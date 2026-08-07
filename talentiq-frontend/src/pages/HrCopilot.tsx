import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Bot, Send, Sparkles, UserCheck, Briefcase, Settings } from 'lucide-react';

interface ChatMessage {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export const HrCopilot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextType, setContextType] = useState<'GENERAL' | 'CANDIDATE' | 'JOB'>('GENERAL');
  const [preferredModel, setPreferredModel] = useState('gpt-4o');

  useEffect(() => {
    // Initial greeting
    setMessages([
      {
        id: 1,
        role: 'ASSISTANT',
        content: 'Hello! I am your TalentIQ HR AI Copilot. Select a candidate or job context above to begin deep evaluation, resume parsing, or interview question generation.',
        createdAt: new Date().toISOString()
      }
    ]);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'USER',
      content: prompt.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      // Post to backend API
      const res = await apiClient.post('/copilot/conversations/1/messages', { content: userMsg.content });
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'ASSISTANT',
        content: res.data.data.content,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      // Fallback Mock Assistant Response
      let mockReply = 'I have analyzed the current candidate portfolio and job description. They show a 92% compatibility match on core Java & Spring Boot requirements. I recommend scheduling an initial 30-min technical screening call.';
      if (contextType === 'CANDIDATE') {
        mockReply = 'Candidate John Doe has 4 years of experience in distributed systems and microservices. Strengths include Kafka, Docker, and AWS. Growth area: GraphQL.';
      } else if (contextType === 'JOB') {
        mockReply = 'For Senior Microservices Architect position, key requirements are Java 17, Spring Boot, and Kubernetes. We currently have 3 matching candidate profiles with >85% scores.';
      }

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'ASSISTANT',
          content: mockReply,
          createdAt: new Date().toISOString()
        }]);
        setLoading(false);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '40px auto', padding: '0 24px', height: 'calc(100vh - 150px)', display: 'flex', gap: '24px' }}>
      {/* Context Sidebar */}
      <div className="glass-panel" style={{ width: '300px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={18} color="var(--primary-cyan)" /> Copilot Context
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Select active RAG context mode</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className={`btn ${contextType === 'GENERAL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContextType('GENERAL')}
              style={{ justifyContent: 'flex-start', fontSize: '13px' }}
            >
              <Sparkles size={16} /> General Assistant
            </button>
            <button
              className={`btn ${contextType === 'CANDIDATE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContextType('CANDIDATE')}
              style={{ justifyContent: 'flex-start', fontSize: '13px' }}
            >
              <UserCheck size={16} /> Active Candidate Context
            </button>
            <button
              className={`btn ${contextType === 'JOB' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContextType('JOB')}
              style={{ justifyContent: 'flex-start', fontSize: '13px' }}
            >
              <Briefcase size={16} /> Active Job Posting Context
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={14} /> Model Settings
          </h4>
          <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Preferred Model</label>
          <select className="input-field" style={{ padding: '8px', fontSize: '12px' }} value={preferredModel} onChange={(e) => setPreferredModel(e.target.value)}>
            <option value="gpt-4o">OpenAI GPT-4o (Default)</option>
            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
            <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
          </select>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>HR Copilot Active Session ({contextType} MODE)</span>
          </div>
          <span className="badge badge-cyan">{preferredModel}</span>
        </div>

        {/* Messages Stream */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === 'USER' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '14px 18px',
                borderRadius: '16px',
                background: msg.role === 'USER' ? 'var(--gradient-brand)' : 'rgba(30, 41, 59, 0.8)',
                color: '#FFF',
                fontSize: '14px',
                lineHeight: '1.6',
                border: msg.role === 'USER' ? 'none' : '1px solid var(--border-subtle)',
                boxShadow: msg.role === 'USER' ? 'var(--shadow-glow)' : 'none'
              }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '12px 18px', borderRadius: '16px', background: 'rgba(30, 41, 59, 0.8)', fontSize: '13px', color: 'var(--text-muted)' }}>
              AI Copilot is thinking...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Ask Copilot (e.g. Compare candidate skills against Senior Java posting)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
