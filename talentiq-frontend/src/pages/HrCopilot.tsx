import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Bot, Send, Sparkles, UserCheck, Briefcase, Settings } from 'lucide-react';
import '../css/hr-copilot.css';

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
    <div className="copilot-container">
      {/* Context Sidebar */}
      <div className="glass-panel copilot-sidebar">
        <div>
          <h3 className="copilot-sidebar-title">
            <Bot size={18} color="var(--primary-cyan)" /> Copilot Context
          </h3>
          <p className="copilot-sidebar-subtitle">Select active RAG context mode</p>

          <div className="copilot-mode-btn-group">
            <button
              className={`btn ${contextType === 'GENERAL' ? 'btn-primary' : 'btn-secondary'} copilot-mode-btn`}
              onClick={() => setContextType('GENERAL')}
            >
              <Sparkles size={16} /> General Assistant
            </button>
            <button
              className={`btn ${contextType === 'CANDIDATE' ? 'btn-primary' : 'btn-secondary'} copilot-mode-btn`}
              onClick={() => setContextType('CANDIDATE')}
            >
              <UserCheck size={16} /> Active Candidate Context
            </button>
            <button
              className={`btn ${contextType === 'JOB' ? 'btn-primary' : 'btn-secondary'} copilot-mode-btn`}
              onClick={() => setContextType('JOB')}
            >
              <Briefcase size={16} /> Active Job Posting Context
            </button>
          </div>
        </div>

        <div className="copilot-settings-box">
          <h4 className="copilot-settings-heading">
            <Settings size={14} /> Model Settings
          </h4>
          <label className="copilot-settings-label">Preferred Model</label>
          <select className="input-field copilot-settings-select" value={preferredModel} onChange={(e) => setPreferredModel(e.target.value)}>
            <option value="gpt-4o">OpenAI GPT-4o (Default)</option>
            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
            <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
          </select>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="glass-panel copilot-chat-panel">
        {/* Header */}
        <div className="copilot-chat-header">
          <div className="copilot-status-indicator">
            <div className="copilot-status-dot" />
            <span className="copilot-header-title">HR Copilot Active Session ({contextType} MODE)</span>
          </div>
          <span className="badge badge-cyan">{preferredModel}</span>
        </div>

        {/* Messages Stream */}
        <div className="copilot-messages-stream">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`copilot-msg-bubble ${msg.role.toLowerCase()}`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="copilot-typing-bubble">
              AI Copilot is thinking...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="copilot-input-bar">
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
