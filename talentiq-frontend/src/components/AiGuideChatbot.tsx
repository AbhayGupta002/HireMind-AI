import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Bot, Sparkles, X, Send, ArrowRight } from 'lucide-react';

interface Message {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  navLink?: { label: string; path: string };
  time: string;
}

const QUICK_PROMPTS = [
  '🚀 How do I search and apply for jobs?',
  '🏢 How do HR Recruiters post jobs?',
  '⚡ How does AI Match Scoring work?',
  '📄 How does Resume Parsing work?',
  '🔑 Give me demo login credentials',
];

export const AiGuideChatbot: React.FC<{ dark?: boolean }> = ({ dark = true }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! 👋 I'm your **HireMind AI Assistant**. I can guide you through platform features, job searching, HR recruiter tools, AI match scoring, and demo credentials!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Try backend API first, or fallback to intelligent Knowledge Base Engine
    setTimeout(async () => {
      let botResponse = '';
      let navLink: { label: string; path: string } | undefined = undefined;

      const lower = promptText.toLowerCase();

      if (lower.includes('apply') || lower.includes('find job') || lower.includes('search')) {
        botResponse = "To search and apply for jobs:\n1. Click **Find Jobs** in the navigation bar to visit the jobs board.\n2. Filter by Remote/Hybrid or search by keywords (e.g. Java, Python).\n3. Click **Apply Now 🚀** on any position!";
        navLink = { label: 'Explore Active Jobs Board 🚀', path: '/jobs' };
      } else if (lower.includes('post') || lower.includes('hr') || lower.includes('recruiter') || lower.includes('employer')) {
        botResponse = "As an HR Recruiter:\n1. Sign in with an HR account.\n2. Access the **HR Dashboard** to view hiring telemetry.\n3. Click **+ Post New Job** to launch career roles live!\n4. Review applicants & download candidate resume PDFs on the **Applicants** page.";
        navLink = { label: 'Open HR Dashboard 📊', path: '/hr-analytics' };
      } else if (lower.includes('match') || lower.includes('score') || lower.includes('algorithm')) {
        botResponse = "⚡ **AI Match Scoring System**:\nOur 4-tier algorithm evaluates:\n• 40% Required Skills Taxonomy\n• 30% Experience Level Alignment\n• 15% Geographic / Remote Preference\n• 15% Education & Certifications";
        navLink = { label: 'View AI Matched Jobs ✨', path: '/recommendations' };
      } else if (lower.includes('resume') || lower.includes('parse') || lower.includes('pdf')) {
        botResponse = "📄 **Resume Parser Engine**:\nUpload your PDF or DOCX resume in your Profile to automatically extract technical skills, experience history, and generate structured candidate taxomony profiles!";
        navLink = { label: 'Manage Profile & Resume 📄', path: '/profile' };
      } else if (lower.includes('demo') || lower.includes('login') || lower.includes('credential') || lower.includes('password')) {
        botResponse = "🔑 **Demo Login Accounts**:\n\n• **Candidate**: `candidate@example.com` | `Password123!`\n• **HR Recruiter**: `hr@techcorp.com` | `Password123!`\n• **Super Admin**: `admin@talentiq.ai` | `Admin@123!`";
        navLink = { label: 'Go to Login Page 🔑', path: '/login' };
      } else {
        try {
          const apiRes = await apiClient.post('/copilot/conversations/1/messages', { content: promptText });
          botResponse = apiRes.data?.data?.content || "HireMind AI bridges elite technical candidates with corporate recruiters using LLM resume parsing, weighted RAG matching algorithms, and autonomous HR AI Copilots.";
        } catch (e) {
          botResponse = "I can guide you across HireMind AI! Try exploring active jobs, logging into an HR or Candidate account, or managing your portfolio.";
          navLink = { label: 'Explore Jobs Board 🚀', path: '/jobs' };
        }
      }

      const botMsg: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        navLink,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 999 }}>
      {/* ── Floating Action Trigger Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
            border: 'none',
            color: '#FFF',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(124, 58, 237, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={18} color="#FFF" />
          </div>
          <span>AI Platform Guide</span>
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px',
            borderRadius: '50%', background: '#10B981', border: '2px solid #06071A'
          }} />
        </button>
      )}

      {/* ── Interactive Chatbot Window ── */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: '540px',
          maxHeight: '82vh',
          borderRadius: '24px',
          background: dark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(24px)',
          border: dark ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slide-up 0.3s ease forwards',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                position: 'relative', width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={22} color="#FFF" />
                <span style={{
                  position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px',
                  borderRadius: '50%', background: '#10B981', border: '2px solid #FFF'
                }} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>HireMind AI Guide</h4>
                <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 500 }}>Online · Interactive Platform Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: dark ? 'rgba(6, 7, 26, 0.4)' : 'rgba(240, 244, 255, 0.4)',
          }}>
            {messages.map(m => (
              <div key={m.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: m.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: m.sender === 'user'
                    ? 'linear-gradient(135deg, #7C3AED, #DB2777)'
                    : (dark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)'),
                  color: m.sender === 'user' ? '#FFF' : (dark ? '#F8FAFC' : '#0F172A'),
                  border: m.sender === 'user' ? 'none' : (dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)'),
                  fontSize: '13px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}>
                  {m.text}

                  {/* Navigation Action Button */}
                  {m.navLink && (
                    <button
                      onClick={() => navigate(m.navLink!.path)}
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#7C3AED',
                        color: '#FFF',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {m.navLink.label} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: dark ? '#64748B' : '#94A3B8', marginTop: '4px', padding: '0 4px' }}>
                  {m.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A78BFA', fontSize: '12px', padding: '6px' }}>
                <Sparkles size={14} style={{ animation: 'spin-slow 2s linear infinite' }} /> AI Assistant is processing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Prompt Chips */}
          <div style={{
            padding: '10px 14px 4px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            background: dark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderTop: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          }}>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(qp)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  border: dark ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(124,58,237,0.2)',
                  background: dark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
                  color: dark ? '#A78BFA' : '#7C3AED',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={e => { e.preventDefault(); handleSendPrompt(input); }}
            style={{
              padding: '12px 14px',
              display: 'flex',
              gap: '8px',
              background: dark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              borderTop: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <input
              type="text"
              placeholder="Ask anything about HireMind AI..."
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                background: dark ? 'rgba(6, 7, 26, 0.7)' : 'rgba(240, 244, 255, 0.7)',
                color: dark ? '#F8FAFC' : '#0F172A',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #DB2777)',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !input.trim() || isTyping ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
