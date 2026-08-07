import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Building2, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';

type RegisterMode = 'CANDIDATE' | 'HR';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // HR-specific fields
  companyName: string;
  jobTitle: string;
  companyWebsite: string;
  industry: string;
  companySize: string;
  // Candidate-specific fields
  phone: string;
  location: string;
  desiredRole: string;
  yearsExperience: string;
}

const INDUSTRIES = [
  'Technology / Software', 'Finance & Banking', 'Healthcare & Life Sciences',
  'E-Commerce / Retail', 'Education', 'Consulting', 'Manufacturing',
  'Media & Entertainment', 'Government & Public Sector', 'Startup / Venture'
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<RegisterMode>('CANDIDATE');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    companyName: '', jobTitle: '', companyWebsite: '', industry: '', companySize: '',
    phone: '', location: '', desiredRole: '', yearsExperience: ''
  });

  const update = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('All fields are required'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'CANDIDATE') {
        await register({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: 'ROLE_CANDIDATE',
          phone: form.phone,
          location: form.location,
          desiredRole: form.desiredRole,
          yearsExperience: Number(form.yearsExperience) || 0
        });
      } else {
        await register({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: 'ROLE_HR',
          companyName: form.companyName,
          jobTitle: form.jobTitle,
          companyWebsite: form.companyWebsite,
          industry: form.industry,
          companySize: form.companySize
        });
      }
      navigate('/jobs');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 24px 80px',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--gradient-brand)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)', margin: '0 auto 16px'
          }}>
            <Sparkles size={28} color="#FFF" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Create Your TalentIQ Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-cyan)' }}>Sign in</Link>
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="glass-panel" style={{ padding: '6px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button
            onClick={() => { setMode('CANDIDATE'); setStep(1); setError(''); }}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'CANDIDATE' ? 'var(--gradient-brand)' : 'transparent',
              color: mode === 'CANDIDATE' ? '#FFF' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <User size={18} /> I'm a Candidate
          </button>
          <button
            onClick={() => { setMode('HR'); setStep(1); setError(''); }}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'HR' ? 'var(--gradient-indigo-violet)' : 'transparent',
              color: mode === 'HR' ? '#FFF' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Building2 size={18} /> I'm an HR Recruiter
          </button>
        </div>

        {/* Role description banner */}
        <div style={{
          padding: '14px 20px',
          borderRadius: '10px',
          marginBottom: '24px',
          background: mode === 'CANDIDATE' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(99, 102, 241, 0.08)',
          border: `1px solid ${mode === 'CANDIDATE' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: '1.6'
        }}>
          {mode === 'CANDIDATE' ? (
            <>🎯 <strong style={{ color: 'var(--primary-cyan)' }}>Candidate Account</strong> — Upload your resume for AI analysis, browse AI-matched job recommendations, track applications, and build your portfolio showcase.</>
          ) : (
            <>🏢 <strong style={{ color: 'var(--primary-indigo)' }}>HR Recruiter Account</strong> — Post jobs, screen candidates with AI match scoring, use the AI Copilot for interviews, and access hiring funnel analytics. Corporate email required.</>
          )}
        </div>

        {/* Step Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: step >= 1 ? 'var(--gradient-brand)' : 'var(--bg-card)',
              border: step >= 1 ? 'none' : '2px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: '#FFF'
            }}>
              {step > 1 ? <CheckCircle2 size={16} /> : '1'}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: step >= 1 ? '#FFF' : 'var(--text-dim)' }}>Account Basics</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: step === 2 ? 'var(--gradient-brand)' : 'var(--border-subtle)', borderRadius: '2px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: step >= 2 ? 'var(--gradient-brand)' : 'var(--bg-card)',
              border: step >= 2 ? 'none' : '2px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: step >= 2 ? '#FFF' : 'var(--text-dim)'
            }}>
              2
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: step >= 2 ? '#FFF' : 'var(--text-dim)' }}>
              {mode === 'CANDIDATE' ? 'Career Details' : 'Company Details'}
            </span>
          </div>
        </div>

        {/* Form Panel */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5', fontSize: '13px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 1: Basic Account Info ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>First Name *</label>
                  <input className="input-field" type="text" required placeholder="John"
                    value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Last Name *</label>
                  <input className="input-field" type="text" required placeholder="Doe"
                    value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Email Address *</label>
                <input className="input-field" type="email" required
                  placeholder={mode === 'HR' ? 'recruiter@company.com' : 'you@example.com'}
                  value={form.email} onChange={e => update('email', e.target.value)} />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Password * (min. 8 characters)</label>
                <input className="input-field" type={showPassword ? 'text' : 'password'} required
                  placeholder="Create a strong password"
                  value={form.password} onChange={e => update('password', e.target.value)}
                  style={{ paddingRight: '48px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', bottom: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Confirm Password *</label>
                <input className="input-field" type="password" required placeholder="Confirm your password"
                  value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px' }}>
                Continue to {mode === 'CANDIDATE' ? 'Career Details' : 'Company Details'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ── STEP 2: Role-specific Details ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'CANDIDATE' ? (
                // ── CANDIDATE STEP 2 ──
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Phone Number</label>
                    <input className="input-field" type="tel" placeholder="+91 98765 43210"
                      value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Current Location</label>
                    <input className="input-field" type="text" placeholder="Mumbai, India"
                      value={form.location} onChange={e => update('location', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Desired Job Role / Title</label>
                    <input className="input-field" type="text" placeholder="e.g. Senior Java Engineer, Full-Stack Developer"
                      value={form.desiredRole} onChange={e => update('desiredRole', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Years of Professional Experience</label>
                    <select className="input-field" value={form.yearsExperience} onChange={e => update('yearsExperience', e.target.value)}>
                      <option value="">Select experience level</option>
                      <option value="0">Fresher / Intern (0 years)</option>
                      <option value="1">1 year</option>
                      <option value="2">2 years</option>
                      <option value="3">3 years</option>
                      <option value="4">4 years</option>
                      <option value="5">5 years</option>
                      <option value="7">7 years</option>
                      <option value="10">10 years</option>
                      <option value="15">15+ years</option>
                    </select>
                  </div>

                  {/* Candidate Benefits */}
                  <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.06)', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '10px' }}>✅ What you get with your Candidate account:</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li>🤖 AI Resume Parser — Upload PDF/DOCX, extract skills automatically</li>
                      <li>⚡ AI Job Matching — Match score against 100s of job postings</li>
                      <li>📂 Portfolio Builder — Showcase projects, live demos & GitHub</li>
                      <li>📊 Application Tracker — Pipeline stage, status, interview dates</li>
                    </ul>
                  </div>
                </>
              ) : (
                // ── HR RECRUITER STEP 2 ──
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Company Name *</label>
                    <input className="input-field" type="text" required placeholder="e.g. TechCorp Solutions Pvt. Ltd."
                      value={form.companyName} onChange={e => update('companyName', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Your Job Title *</label>
                    <input className="input-field" type="text" required placeholder="e.g. Senior Technical Recruiter"
                      value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Company Website</label>
                    <input className="input-field" type="url" placeholder="https://yourcompany.com"
                      value={form.companyWebsite} onChange={e => update('companyWebsite', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Industry *</label>
                      <select className="input-field" required value={form.industry} onChange={e => update('industry', e.target.value)}>
                        <option value="">Select Industry</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Company Size *</label>
                      <select className="input-field" required value={form.companySize} onChange={e => update('companySize', e.target.value)}>
                        <option value="">Select Size</option>
                        {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </div>
                  </div>

                  {/* HR Benefits */}
                  <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.06)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-indigo)', marginBottom: '10px' }}>✅ What you get with your HR Recruiter account:</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li>📢 Unlimited Job Postings with auto AI screening</li>
                      <li>🤖 HR AI Copilot — RAG-powered interview Q&A assistant</li>
                      <li>📊 Hiring Funnel Analytics — Stage breakdown, time-to-hire metrics</li>
                      <li>⭐ AI Candidate Match Scoring — Auto-rank applicants by skill fit</li>
                    </ul>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1, padding: '14px' }}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ flex: 2, padding: '14px', background: mode === 'HR' ? 'var(--gradient-indigo-violet)' : undefined }}>
                  {loading ? 'Creating Account...' : `Create ${mode === 'CANDIDATE' ? 'Candidate' : 'HR Recruiter'} Account 🚀`}
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '4px' }}>
                By creating an account, you agree to TalentIQ's Terms of Service and Privacy Policy.
                {mode === 'HR' && ' HR accounts undergo corporate verification within 24 hours.'}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
