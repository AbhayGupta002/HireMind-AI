import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Client as StompClient } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  Send, Phone, PhoneOff, Mic, MicOff, Search,
  ArrowLeft, LayoutDashboard, Calendar, Bot,
  MessageSquare, Users, Briefcase, Settings, LogOut,
  Circle
} from 'lucide-react';

/* ─── Types ─── */
interface Contact {
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface Message {
  id?: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  content: string;
  type: string;
  read: boolean;
  sentAt: string;
}

/* ─── Sidebar NavItem ─── */
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> =
  ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
      padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      fontSize: '14px', fontWeight: active ? 600 : 400,
      background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
      color: active ? '#fff' : '#94a3b8', transition: 'all 0.2s', textAlign: 'left',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {icon}{label}
    </button>
  );

const HrMessages: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);

  // WebRTC state
  const [callState, setCallState] = useState<'idle' | 'calling' | 'in-call'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callWith, setCallWith] = useState<string>('');

  const stompRef = useRef<StompClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const currentUserId = user?.id ? parseInt(String(user.id)) : 0;

  /* ─── Fetch contacts ─── */
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setContactsLoading(true);
        const res = await apiClient.get('/v1/chat/contacts');
        setContacts(res.data?.data || []);
      } catch {
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  /* ─── Connect WebSocket / STOMP ─── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new StompClient({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,

      onConnect: () => {
        // Subscribe to incoming messages
        client.subscribe('/user/queue/chat', (frame) => {
          const msg: Message = JSON.parse(frame.body);
          setMessages(prev => {
            // Avoid duplicate if we already appended optimistically
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Refresh contacts for last-message preview
          apiClient.get('/v1/chat/contacts').then(res => setContacts(res.data?.data || []));
        });

        // Subscribe to typing events
        client.subscribe('/user/queue/typing', (frame) => {
          const payload = JSON.parse(frame.body);
          if (payload.senderId === selectedContact?.userId) {
            setOtherTyping(payload.typing);
          }
        });

        // Subscribe to WebRTC signaling
        client.subscribe('/user/queue/signal', (frame) => {
          const signal = JSON.parse(frame.body);
          handleIncomingSignal(signal);
        });
      },
      onStompError: (err) => console.warn('STOMP error', err),
    });
    client.activate();
    stompRef.current = client;

    return () => { client.deactivate(); };
  }, [selectedContact?.userId]);

  /* ─── Load conversation history ─── */
  const loadConversation = useCallback(async (contact: Contact) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/v1/chat/conversations/${contact.userId}`);
      setMessages(res.data?.data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact);
    }
  }, [selectedContact, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  /* ─── Send message ─── */
  const sendMessage = () => {
    if (!inputText.trim() || !selectedContact || !stompRef.current?.connected) return;

    const payload = {
      receiverId: selectedContact.userId,
      content: inputText.trim(),
      type: 'TEXT',
    };

    // Optimistic UI update
    const optimistic: Message = {
      senderId: currentUserId,
      senderName: user?.name || 'Me',
      receiverId: selectedContact.userId,
      content: inputText.trim(),
      type: 'TEXT',
      read: false,
      sentAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');

    stompRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
  };

  /* ─── Typing indicator ─── */
  const handleTyping = () => {
    if (!selectedContact || !stompRef.current?.connected) return;
    if (!isTyping) {
      setIsTyping(true);
      stompRef.current.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ receiverId: selectedContact.userId, typing: true }),
      });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      stompRef.current?.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ receiverId: selectedContact.userId, typing: false }),
      });
    }, 2000);
  };

  /* ─── WebRTC Audio Call ─── */
  const startCall = async () => {
    if (!selectedContact) return;
    try {
      setCallState('calling');
      setCallWith(selectedContact.name);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
        setCallState('in-call');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && stompRef.current?.connected) {
          stompRef.current.publish({
            destination: '/app/chat.signal',
            body: JSON.stringify({
              receiverId: selectedContact.userId,
              signalType: 'ice-candidate',
              payload: JSON.stringify(event.candidate),
            }),
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      stompRef.current?.publish({
        destination: '/app/chat.signal',
        body: JSON.stringify({
          receiverId: selectedContact.userId,
          signalType: 'offer',
          payload: JSON.stringify(offer),
        }),
      });
    } catch (err) {
      alert('Microphone access denied or unavailable.');
      hangUp();
    }
  };

  const hangUp = () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setCallState('idle');
    setCallWith('');

    if (selectedContact) {
      stompRef.current?.publish({
        destination: '/app/chat.signal',
        body: JSON.stringify({ receiverId: selectedContact.userId, signalType: 'call-end', payload: '{}' }),
      });
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const enabled = !isMuted;
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = enabled; });
      setIsMuted(!enabled);
    }
  };

  const handleIncomingSignal = async (signal: any) => {
    if (signal.signalType === 'call-end') { hangUp(); return; }
    if (signal.signalType === 'offer') {
      setCallState('calling');
      setCallWith(signal.senderName || 'Caller');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      if (!stream) return;
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      pc.ontrack = e => { if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0]; setCallState('in-call'); };
      pc.onicecandidate = e => {
        if (e.candidate) stompRef.current?.publish({
          destination: '/app/chat.signal',
          body: JSON.stringify({ receiverId: signal.senderId, signalType: 'ice-candidate', payload: JSON.stringify(e.candidate) }),
        });
      };

      await pc.setRemoteDescription(JSON.parse(signal.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      stompRef.current?.publish({
        destination: '/app/chat.signal',
        body: JSON.stringify({ receiverId: signal.senderId, signalType: 'answer', payload: JSON.stringify(answer) }),
      });
    } else if (signal.signalType === 'answer' && pcRef.current) {
      await pcRef.current.setRemoteDescription(JSON.parse(signal.payload));
    } else if (signal.signalType === 'ice-candidate' && pcRef.current) {
      await pcRef.current.addIceCandidate(JSON.parse(signal.payload));
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMsgTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 16px',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HireMind AI</span>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <NavItem icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={() => navigate('/hr-analytics')} />
          <NavItem icon={<MessageSquare size={17} />} label="Messages" active onClick={() => {}} />
          <NavItem icon={<Calendar size={17} />} label="Calendar" onClick={() => navigate('/hr-calendar')} />
          <NavItem icon={<Users size={17} />} label="Applications" onClick={() => navigate('/hr-applications')} />
          <NavItem icon={<Briefcase size={17} />} label="Jobs" onClick={() => navigate('/jobs')} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
          <NavItem icon={<Settings size={17} />} label="Settings" onClick={() => {}} />
          <NavItem icon={<LogOut size={17} />} label="Sign Out" onClick={() => { logout(); navigate('/'); }} />
        </nav>
        <div style={{ padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{user?.name || 'HR Manager'}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{user?.email || ''}</div>
        </div>
      </aside>

      {/* ── Contacts Panel ── */}
      <div style={{
        width: 300, background: 'rgba(15,23,42,0.6)', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px 16px 12px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 14px' }}>Messages</h2>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              style={{
                width: '100%', padding: '8px 10px 8px 30px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9',
                fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {contactsLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#475569' }}>
              <MessageSquare size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div style={{ fontSize: 13 }}>No contacts yet</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Contacts appear after candidates apply</div>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <button key={contact.userId} onClick={() => setSelectedContact(contact)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: selectedContact?.userId === contact.userId ? 'rgba(99,102,241,0.15)' : 'transparent',
                marginBottom: 4, transition: 'background 0.15s'
              }}
                onMouseEnter={e => { if (selectedContact?.userId !== contact.userId) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (selectedContact?.userId !== contact.userId) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontSize: 16, fontWeight: 700, color: '#fff'
                }}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{contact.name}</span>
                    {contact.unreadCount > 0 && (
                      <span style={{ fontSize: 10, background: '#6366f1', color: '#fff', borderRadius: 10, padding: '2px 6px', fontWeight: 700 }}>
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {contact.lastMessage || contact.email}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      {selectedContact ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Chat Header */}
          <div style={{
            padding: '16px 24px', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {selectedContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{selectedContact.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
                  {otherTyping ? (
                    <><Circle size={8} fill="#10b981" color="#10b981" /> <span style={{ color: '#10b981' }}>typing...</span></>
                  ) : (
                    <>{selectedContact.email}</>
                  )}
                </div>
              </div>
            </div>

            {/* Call controls */}
            <div style={{ display: 'flex', gap: 10 }}>
              {callState === 'idle' && (
                <button onClick={startCall} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  background: 'linear-gradient(135deg,#10b981,#06b6d4)', border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600
                }}>
                  <Phone size={14} /> Audio Call
                </button>
              )}
              {(callState === 'calling' || callState === 'in-call') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, color: callState === 'in-call' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Circle size={8} fill="currentColor" color="currentColor" style={{ animation: 'pulse 2s infinite' }} />
                    {callState === 'in-call' ? `In call with ${callWith}` : `Calling ${callWith}...`}
                  </div>
                  <button onClick={toggleMute} style={{ padding: '7px', background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 7, cursor: 'pointer', color: isMuted ? '#ef4444' : '#94a3b8' }}>
                    {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button onClick={hangUp} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 13, cursor: 'pointer' }}>
                    <PhoneOff size={14} /> End
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#64748b', paddingTop: 40 }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: '#475569' }}>
                <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No messages yet</div>
                <div style={{ fontSize: 13 }}>Start the conversation with {selectedContact.name}</div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id || idx} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                      {!isMe && (
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {msg.senderName?.charAt(0) || '?'}
                        </div>
                      )}
                      <div style={{ maxWidth: '65%' }}>
                        {!isMe && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, paddingLeft: 4 }}>{msg.senderName}</div>}
                        <div style={{
                          padding: '10px 14px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: isMe ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
                          color: '#f1f5f9', fontSize: 14, lineHeight: 1.5,
                          border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)'
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 3, textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : 4 }}>
                          {formatMsgTime(msg.sentAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {otherTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#818cf8' }}>
                      {selectedContact.name.charAt(0)}
                    </div>
                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: '14px 14px 14px 4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '16px 24px', background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <input
              ref={inputRef}
              value={inputText}
              onChange={e => { setInputText(e.target.value); handleTyping(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message ${selectedContact.name}...`}
              style={{
                flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9',
                fontSize: 14, outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(99,102,241,0.5)'; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            <button onClick={sendMessage} disabled={!inputText.trim() || !stompRef.current?.connected}
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: inputText.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                color: inputText.trim() ? '#fff' : '#475569'
              }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* No Contact Selected */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <MessageSquare size={36} color="#6366f1" style={{ opacity: 0.6 }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Select a conversation</div>
            <div style={{ fontSize: 14 }}>Choose a candidate from the left to start messaging</div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
};

export default HrMessages;
