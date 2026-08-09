import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Building2, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';

type LoginRoleMode = 'CANDIDATE' | 'HR' | 'ADMIN';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<LoginRoleMode>('CANDIDATE');
  const [email, setEmail] = useState('candidate@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: LoginRoleMode) => {
    setSelectedRole(role);
    setError('');
    if (role === 'CANDIDATE') {
      setEmail('candidate@example.com');
      setPassword('Password123!');
    } else if (role === 'HR') {
      setEmail('hr@techcorp.com');
      setPassword('Password123!');
    } else if (role === 'ADMIN') {
      setEmail('admin@talentiq.ai');
      setPassword('Admin@123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });

      const emailLower = email.toLowerCase();
      let redirectTo = '/jobs';
      if (selectedRole === 'ADMIN' || emailLower.includes('admin')) {
        redirectTo = '/admin';
      } else if (selectedRole === 'HR' || emailLower.includes('hr') || emailLower.includes('recruiter')) {
        redirectTo = '/hr-analytics';
      }

      navigate(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      maxWidth: '520px',
      margin: '60px auto',
      padding: '0 24px'
    }}>
      <div className="glass-panel" style={{ padding: '36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={28} color="#FFF" />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>Sign In to TalentIQ</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Select your portal account type to sign in</p>
        </div>

        {/* Explicit Role Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          padding: '6px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => handleRoleSelect('CANDIDATE')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: selectedRole === 'CANDIDATE' ? 'var(--gradient-brand)' : 'transparent',
              color: selectedRole === 'CANDIDATE' ? '#FFF' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            <User size={18} color={selectedRole === 'CANDIDATE' ? '#FFF' : 'var(--primary-cyan)'} />
            <span>Candidate</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('HR')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: selectedRole === 'HR' ? 'var(--gradient-indigo-violet)' : 'transparent',
              color: selectedRole === 'HR' ? '#FFF' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            <Building2 size={18} color={selectedRole === 'HR' ? '#FFF' : 'var(--primary-indigo)'} />
            <span>HR Recruiter</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: selectedRole === 'ADMIN' ? 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)' : 'transparent',
              color: selectedRole === 'ADMIN' ? '#FFF' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            <ShieldCheck size={18} color={selectedRole === 'ADMIN' ? '#FFF' : 'var(--accent-rose)'} />
            <span>Admin</span>
          </button>
        </div>

        {/* Selected Role Context Banner */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: selectedRole === 'CANDIDATE' ? 'rgba(6, 182, 212, 0.08)' : selectedRole === 'HR' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(244, 63, 94, 0.08)',
          border: `1px solid ${selectedRole === 'CANDIDATE' ? 'rgba(6, 182, 212, 0.2)' : selectedRole === 'HR' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          {selectedRole === 'CANDIDATE' && (
            <>🎯 Logging in as <strong style={{ color: 'var(--primary-cyan)' }}>Candidate</strong> — Access AI resume scoring, job applications, and portfolio showcase.</>
          )}
          {selectedRole === 'HR' && (
            <>🏢 Logging in as <strong style={{ color: 'var(--primary-indigo)' }}>HR Recruiter</strong> — Access job posting modal, RAG AI Copilot, and candidate analytics.</>
          )}
          {selectedRole === 'ADMIN' && (
            <>🛡️ Logging in as <strong style={{ color: 'var(--accent-rose)' }}>Super Admin</strong> — Access user lockouts, company verification approvals, and platform telemetry.</>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)', color: '#FDA4AF', fontSize: '13px', marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder={selectedRole === 'HR' ? 'hr@company.com' : selectedRole === 'ADMIN' ? 'admin@talentiq.ai' : 'candidate@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '14px',
              fontSize: '15px',
              fontWeight: 700,
              background: selectedRole === 'HR' ? 'var(--gradient-indigo-violet)' : selectedRole === 'ADMIN' ? 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)' : undefined
            }}
          >
            {loading ? 'Authenticating...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogIn size={18} /> Sign In as {selectedRole === 'CANDIDATE' ? 'Candidate' : selectedRole === 'HR' ? 'HR Recruiter' : 'Super Admin'} <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Need a new account? <Link to="/register" style={{ color: 'var(--primary-cyan)', textDecoration: 'none', fontWeight: 600 }}>Create {selectedRole === 'HR' ? 'HR Recruiter' : 'Candidate'} Account</Link>
        </div>
      </div>
    </div>
  );
};
