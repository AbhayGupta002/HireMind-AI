import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Client as StompClient } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  Send, Phone, PhoneOff, Mic, MicOff, Search,
  LayoutDashboard, Calendar,
  MessageSquare, Users, Briefcase, Settings, LogOut,
  Circle, Sun, Sparkles
} from 'lucide-react';
import '../css/hr-messages.css';

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
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; isUniverse?: boolean; onClick?: () => void }> =
  ({ icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`msg-nav-item ${active ? 'active' : ''}`}
    >
      {icon}{label}
    </button>
  );

const HrMessages: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Theme State
  const [theme, setTheme] = useState<'light' | 'universe'>(() => {
    return (localStorage.getItem('hr_theme') as 'light' | 'universe') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'universe' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('hr_theme', nextTheme);
  };

  const isUniverse = theme === 'universe';

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
        client.subscribe('/user/queue/chat', (frame) => {
          const msg: Message = JSON.parse(frame.body);
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          apiClient.get('/v1/chat/contacts').then(res => setContacts(res.data?.data || []));
        });

        client.subscribe('/user/queue/typing', (frame) => {
          const payload = JSON.parse(frame.body);
          if (payload.senderId === selectedContact?.userId) {
            setOtherTyping(payload.typing);
          }
        });

        client.subscribe('/user/queue/signal', (frame) => {
          const signal = JSON.parse(frame.body);
          handleIncomingSignal(signal);
        });
      },
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

    const optimistic: Message = {
      senderId: currentUserId,
      senderName: user ? `${user.firstName} ${user.lastName}` : 'Me',
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

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = (event) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
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
    <div className={`messages-page-wrapper ${isUniverse ? 'theme-universe' : 'theme-light'}`}>
      <audio ref={remoteAudioRef} autoPlay />

      {/* ── Sidebar ── */}
      <aside className="msg-sidebar">
        <div className="msg-sidebar-brand" onClick={() => navigate('/')}>
          <div className="msg-brand-icon msg-avatar-brand">
            <span style={{ fontSize: 16 }}>🌌</span>
          </div>
          <span className="msg-brand-name">HireMind AI</span>
        </div>

        <nav className="msg-nav-list">
          <NavItem icon={<LayoutDashboard size={17} />} label="Dashboard" isUniverse={isUniverse} onClick={() => navigate('/hr-analytics')} />
          <NavItem icon={<MessageSquare size={17} />} label="Messages" active isUniverse={isUniverse} onClick={() => {}} />
          <NavItem icon={<Calendar size={17} />} label="Calendar" isUniverse={isUniverse} onClick={() => navigate('/hr-calendar')} />
          <NavItem icon={<Users size={17} />} label="Applications" isUniverse={isUniverse} onClick={() => navigate('/hr-applications')} />
          <NavItem icon={<Briefcase size={17} />} label="Jobs" isUniverse={isUniverse} onClick={() => navigate('/jobs')} />
          <div className="msg-nav-divider" />
          <NavItem icon={<Settings size={17} />} label="Settings" isUniverse={isUniverse} onClick={() => {}} />
          <NavItem icon={<LogOut size={17} />} label="Sign Out" isUniverse={isUniverse} onClick={() => { logout(); navigate('/'); }} />
        </nav>

        <div className="msg-user-badge">
          <div className="msg-user-name">{user ? `${user.firstName} ${user.lastName}` : 'HR Manager'}</div>
          <div className="msg-user-email">{user?.email || ''}</div>
        </div>
      </aside>

      {/* ── Contacts Panel ── */}
      <div className="msg-contacts-panel">
        <div className="msg-contacts-header">
          <div className="msg-contacts-title-row">
            <h2 className="msg-contacts-title">Messages</h2>
            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} className="msg-theme-btn">
              {isUniverse ? <Sparkles size={12} /> : <Sun size={12} />}
              {isUniverse ? 'Universe' : 'Light'}
            </button>
          </div>

          <div className="msg-search-wrapper">
            <Search size={14} className="msg-search-icon" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="msg-search-input msg-input-field"
            />
          </div>
        </div>

        <div className="msg-contacts-scroll">
          {contactsLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: isUniverse ? '#94A3B8' : '#64748B', fontSize: 13 }}>Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: isUniverse ? '#94A3B8' : '#64748B' }}>
              <MessageSquare size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div style={{ fontSize: 13 }}>No contacts yet</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Contacts appear after candidates apply</div>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <button
                key={contact.userId}
                onClick={() => setSelectedContact(contact)}
                className={`msg-contact-btn ${selectedContact?.userId === contact.userId ? 'selected' : ''}`}
              >
                <div className="msg-contact-avatar msg-avatar-brand">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="msg-contact-info">
                  <div className="msg-contact-top">
                    <span className="msg-contact-name">{contact.name}</span>
                    {contact.unreadCount > 0 && (
                      <span className="msg-unread-badge">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="msg-contact-snippet">
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
        <div className="msg-chat-main">
          {/* Chat Header */}
          <div className="msg-chat-header">
            <div className="msg-chat-header-user">
              <div className="msg-contact-avatar msg-avatar-brand">
                {selectedContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="msg-chat-header-name">{selectedContact.name}</div>
                <div className="msg-chat-header-status">
                  {otherTyping ? (
                    <><Circle size={8} fill="#10b981" color="#10b981" /> <span style={{ color: '#10b981' }}>typing...</span></>
                  ) : (
                    <>{selectedContact.email}</>
                  )}
                </div>
              </div>
            </div>

            {/* Call controls */}
            <div className="msg-call-actions">
              {callState === 'idle' && (
                <button onClick={startCall} className="msg-call-btn-start">
                  <Phone size={14} /> Audio Call
                </button>
              )}
              {(callState === 'calling' || callState === 'in-call') && (
                <div className="msg-call-active-bar">
                  <div className={`msg-call-status-pulse ${callState === 'in-call' ? 'in-call' : 'calling'}`}>
                    <Circle size={8} fill="currentColor" color="currentColor" style={{ animation: 'chatPulse 2s infinite' }} />
                    {callState === 'in-call' ? `In call with ${callWith}` : `Calling ${callWith}...`}
                  </div>
                  <button onClick={toggleMute} className={`msg-mute-btn ${isMuted ? 'muted' : ''}`}>
                    {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button onClick={hangUp} className="msg-hangup-btn">
                    <PhoneOff size={14} /> End
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="msg-stream">
            {loading ? (
              <div style={{ textAlign: 'center', color: isUniverse ? '#94A3B8' : '#64748B', paddingTop: 40 }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: isUniverse ? '#94A3B8' : '#64748B' }}>
                <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: isUniverse ? '#F8FAFC' : '#1E293B' }}>No messages yet</div>
                <div style={{ fontSize: 13 }}>Start the conversation with {selectedContact.name}</div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id || idx} className={`msg-row ${isMe ? 'me' : 'other'}`}>
                      {!isMe && (
                        <div className="msg-row-avatar msg-avatar-brand">
                          {msg.senderName?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="msg-content-wrapper">
                        {!isMe && <div className="msg-sender-label">{msg.senderName}</div>}
                        <div className={`msg-bubble ${isMe ? 'msg-bubble-me me' : 'msg-bubble-other other'}`}>
                          {msg.content}
                        </div>
                        <div className={`msg-timestamp ${isMe ? 'me' : ''}`}>
                          {formatMsgTime(msg.sentAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="msg-chat-input-bar">
            <input
              value={inputText}
              onChange={e => { setInputText(e.target.value); handleTyping(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message ${selectedContact.name}...`}
              className="msg-input-field"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || !stompRef.current?.connected}
              className={`msg-send-btn ${inputText.trim() ? 'active' : ''}`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="msg-empty-placeholder">
          <div className="msg-placeholder-icon-circle">
            <MessageSquare size={36} color="#6366f1" style={{ opacity: 0.6 }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: isUniverse ? '#F8FAFC' : '#1E293B', marginBottom: 8 }}>Select a conversation</div>
            <div style={{ fontSize: 14 }}>Choose a candidate from the left to start messaging</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrMessages;
