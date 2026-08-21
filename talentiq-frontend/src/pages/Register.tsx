import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Building2, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import '../css/register.css';

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
      if (mode === 'HR') {
        navigate('/hr-analytics');
      } else {
        navigate('/jobs');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-container">
        {/* Header */}
        <div className="register-header">
          <div className="register-icon-badge">
            <Sparkles size={28} color="#FFF" />
          </div>
          <h1 className="register-title">Create Your TalentIQ Account</h1>
          <p className="register-subtitle">
            Already have an account? <Link to="/login" className="register-login-link">Sign in</Link>
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="glass-panel register-mode-toggle">
          <button
            onClick={() => { setMode('CANDIDATE'); setStep(1); setError(''); }}
            className={`register-mode-btn ${mode === 'CANDIDATE' ? 'active-candidate' : ''}`}
          >
            <User size={18} /> I'm a Candidate
          </button>
          <button
            onClick={() => { setMode('HR'); setStep(1); setError(''); }}
            className={`register-mode-btn ${mode === 'HR' ? 'active-hr' : ''}`}
          >
            <Building2 size={18} /> I'm an HR Recruiter
          </button>
        </div>

        {/* Role description banner */}
        <div className={`register-role-banner ${mode.toLowerCase()}`}>
          {mode === 'CANDIDATE' ? (
            <>🎯 <strong>Candidate Account</strong> — Upload your resume for AI analysis, browse AI-matched job recommendations, track applications, and build your portfolio showcase.</>
          ) : (
            <>🏢 <strong>HR Recruiter Account</strong> — Post jobs, screen candidates with AI match scoring, use the AI Copilot for interviews, and access hiring funnel analytics. Corporate email required.</>
          )}
        </div>

        {/* Step Progress */}
        <div className="register-step-progress">
          <div className="register-step-item">
            <div className={`register-step-bubble ${step >= 1 ? 'active' : ''}`}>
              {step > 1 ? <CheckCircle2 size={16} /> : '1'}
            </div>
            <span className={`register-step-label ${step >= 1 ? 'active' : ''}`}>Account Basics</span>
          </div>
          <div className={`register-step-connector ${step === 2 ? 'active' : ''}`} />
          <div className="register-step-item">
            <div className={`register-step-bubble ${step >= 2 ? 'active' : ''}`}>
              2
            </div>
            <span className={`register-step-label ${step >= 2 ? 'active' : ''}`}>
              {mode === 'CANDIDATE' ? 'Career Details' : 'Company Details'}
            </span>
          </div>
        </div>

        {/* Form Panel */}
        <div className="glass-panel register-form-panel">
          {error && (
            <div className="register-error-alert">
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 1: Basic Account Info ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="register-form">
              <div className="register-row-2col">
                <div>
                  <label className="register-field-label">First Name *</label>
                  <input className="input-field" type="text" required placeholder="John"
                    value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                </div>
                <div>
                  <label className="register-field-label">Last Name *</label>
                  <input className="input-field" type="text" required placeholder="Doe"
                    value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="register-field-label">Email Address *</label>
                <input className="input-field" type="email" required
                  placeholder={mode === 'HR' ? 'recruiter@company.com' : 'you@example.com'}
                  value={form.email} onChange={e => update('email', e.target.value)} />
              </div>

              <div className="register-password-wrapper">
                <label className="register-field-label">Password * (min. 8 characters)</label>
                <input className="input-field register-password-input" type={showPassword ? 'text' : 'password'} required
                  placeholder="Create a strong password"
                  value={form.password} onChange={e => update('password', e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="register-eye-btn">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div>
                <label className="register-field-label">Confirm Password *</label>
                <input className="input-field" type="password" required placeholder="Confirm your password"
                  value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary register-submit-btn-full">
                Continue to {mode === 'CANDIDATE' ? 'Career Details' : 'Company Details'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ── STEP 2: Role-specific Details ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="register-form">
              {mode === 'CANDIDATE' ? (
                // ── CANDIDATE STEP 2 ──
                <>
                  <div>
                    <label className="register-field-label">Phone Number</label>
                    <input className="input-field" type="tel" placeholder="+91 98765 43210"
                      value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="register-field-label">Current Location</label>
                    <input className="input-field" type="text" placeholder="Mumbai, India"
                      value={form.location} onChange={e => update('location', e.target.value)} />
                  </div>
                  <div>
                    <label className="register-field-label">Desired Job Role / Title</label>
                    <input className="input-field" type="text" placeholder="e.g. Senior Java Engineer, Full-Stack Developer"
                      value={form.desiredRole} onChange={e => update('desiredRole', e.target.value)} />
                  </div>
                  <div>
                    <label className="register-field-label">Years of Professional Experience</label>
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
                  <div className="register-benefits-box candidate">
                    <p className="register-benefits-title-cyan">✅ What you get with your Candidate account:</p>
                    <ul className="register-benefits-list">
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
                    <label className="register-field-label">Company Name *</label>
                    <input className="input-field" type="text" required placeholder="e.g. TechCorp Solutions Pvt. Ltd."
                      value={form.companyName} onChange={e => update('companyName', e.target.value)} />
                  </div>
                  <div>
                    <label className="register-field-label">Your Job Title *</label>
                    <input className="input-field" type="text" required placeholder="e.g. Senior Technical Recruiter"
                      value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} />
                  </div>
                  <div>
                    <label className="register-field-label">Company Website</label>
                    <input className="input-field" type="url" placeholder="https://yourcompany.com"
                      value={form.companyWebsite} onChange={e => update('companyWebsite', e.target.value)} />
                  </div>
                  <div className="register-row-2col">
                    <div>
                      <label className="register-field-label">Industry *</label>
                      <select className="input-field" required value={form.industry} onChange={e => update('industry', e.target.value)}>
                        <option value="">Select Industry</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="register-field-label">Company Size *</label>
                      <select className="input-field" required value={form.companySize} onChange={e => update('companySize', e.target.value)}>
                        <option value="">Select Size</option>
                        {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </div>
                  </div>

                  {/* HR Benefits */}
                  <div className="register-benefits-box hr">
                    <p className="register-benefits-title-indigo">✅ What you get with your HR Recruiter account:</p>
                    <ul className="register-benefits-list">
                      <li>📢 Unlimited Job Postings with auto AI screening</li>
                      <li>🤖 HR AI Copilot — RAG-powered interview Q&A assistant</li>
                      <li>📊 Hiring Funnel Analytics — Stage breakdown, time-to-hire metrics</li>
                      <li>⭐ AI Candidate Match Scoring — Auto-rank applicants by skill fit</li>
                    </ul>
                  </div>
                </>
              )}

              <div className="register-step2-actions">
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary register-btn-back">
                  ← Back
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary register-btn-submit ${mode === 'HR' ? 'active-hr' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : `Create ${mode === 'CANDIDATE' ? 'Candidate' : 'HR Recruiter'} Account 🚀`}
                </button>
              </div>

              <p className="register-terms-notice">
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
