import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Building2, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';
import '../css/login.css';

type LoginRoleMode = 'CANDIDATE' | 'HR' | 'ADMIN';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<LoginRoleMode>('CANDIDATE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: LoginRoleMode) => {
    setSelectedRole(role);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const roles = savedUser.roles || [];
      const userIsHr = roles.includes('ROLE_HR') || roles.includes('HR') || selectedRole === 'HR';
      const userIsAdmin = roles.includes('ROLE_SUPER_ADMIN') || roles.includes('SUPER_ADMIN') || selectedRole === 'ADMIN';

      if (userIsAdmin) {
        navigate('/admin');
      } else if (userIsHr) {
        navigate('/hr-analytics');
      } else {
        navigate('/jobs');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon-badge">
            <Sparkles size={28} color="#FFF" />
          </div>
          <h2 className="login-title">Sign In to TalentIQ</h2>
          <p className="login-subtitle">Select your portal account type to sign in</p>
        </div>

        {/* Explicit Role Selector Tabs */}
        <div className="login-role-tabs">
          <button
            type="button"
            onClick={() => handleRoleSelect('CANDIDATE')}
            className={`login-role-tab ${selectedRole === 'CANDIDATE' ? 'active-candidate' : ''}`}
          >
            <User size={18} color={selectedRole === 'CANDIDATE' ? '#FFF' : 'var(--primary-cyan)'} />
            <span>Candidate</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('HR')}
            className={`login-role-tab ${selectedRole === 'HR' ? 'active-hr' : ''}`}
          >
            <Building2 size={18} color={selectedRole === 'HR' ? '#FFF' : 'var(--primary-indigo)'} />
            <span>HR Recruiter</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            className={`login-role-tab ${selectedRole === 'ADMIN' ? 'active-admin' : ''}`}
          >
            <ShieldCheck size={18} color={selectedRole === 'ADMIN' ? '#FFF' : 'var(--accent-rose)'} />
            <span>Admin</span>
          </button>
        </div>

        {/* Selected Role Context Banner */}
        <div className={`login-role-banner ${selectedRole.toLowerCase()}`}>
          {selectedRole === 'CANDIDATE' && (
            <>🎯 Logging in as <strong>Candidate</strong> — Access AI resume scoring, job applications, and portfolio showcase.</>
          )}
          {selectedRole === 'HR' && (
            <>🏢 Logging in as <strong>HR Recruiter</strong> — Access job posting modal, RAG AI Copilot, and candidate analytics.</>
          )}
          {selectedRole === 'ADMIN' && (
            <>🛡️ Logging in as <strong>Super Admin</strong> — Access user lockouts, company verification approvals, and platform telemetry.</>
          )}
        </div>

        {error && (
          <div className="login-error-alert">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label className="login-label">
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

          <div className="login-form-group">
            <label className="login-label">
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
            className={`btn btn-primary login-submit-btn ${selectedRole.toLowerCase()}`}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <span className="login-btn-content">
                <LogIn size={18} /> Sign In as {selectedRole === 'CANDIDATE' ? 'Candidate' : selectedRole === 'HR' ? 'HR Recruiter' : 'Super Admin'} <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div className="login-footer">
          Need a new account? <Link to="/register" className="login-footer-link">Create {selectedRole === 'HR' ? 'HR Recruiter' : 'Candidate'} Account</Link>
        </div>
      </div>
    </div>
  );
};
