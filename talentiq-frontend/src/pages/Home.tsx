import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bot, FileText, ArrowRight, Zap } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Hero Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '100px 24px 60px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="badge badge-cyan" style={{ margin: '0 auto 24px', padding: '6px 16px', fontSize: '13px' }}>
          <Sparkles size={14} /> Next-Gen AI Talent Intelligence Engine 2.0
        </div>

        <h1 style={{ fontSize: '56px', lineHeight: '1.15', marginBottom: '24px', fontWeight: 800 }}>
          Supercharge Tech Hiring with <br />
          <span className="text-gradient">Automated AI Matching</span> & Copilot Intelligence
        </h1>

        <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          TalentIQ bridges elite developers and corporate recruiters using deep LLM resume parsing,
          weighted RAG candidate matching algorithms, and an autonomous HR AI Copilot.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link to="/jobs" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Explore Active Jobs
          </Link>
        </div>

        {/* Feature Grid Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '80px',
          textAlign: 'left'
        }}>
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
            }}>
              <FileText size={24} color="var(--primary-cyan)" />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>AI Resume Parser</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              Apache Tika text extraction converts candidate PDFs and DOCX files into structured JSON profiles with skill taxonomies.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
            }}>
              <Zap size={24} color="var(--primary-indigo)" />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Smart Match Scoring</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              4-tier weighted algorithms (40% skills, 30% experience, 15% location, 15% education) generate instant fit analysis.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
            }}>
              <Bot size={24} color="var(--primary-violet)" />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>HR AI Copilot</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              Recruiters query full candidate portfolios and job requirements via interactive context-aware LLM sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
