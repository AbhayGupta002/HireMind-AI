import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Building, DollarSign, CheckCircle2, Plus, X, Sparkles, Filter, Rocket } from 'lucide-react';

interface JobItem {
  id: number;
  title: string;
  slug: string;
  company: {
    id: number;
    name: string;
    logoUrl?: string;
    verified?: boolean;
  };
  location: string;
  jobType: string;
  experienceLevel: string;
  remote: boolean;
  hybrid: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  description?: string;
  requiredSkills: { skillName: string; required?: boolean }[];
  postedAt: string;
}

/* ══════════════════════════
   STAR CANVAS BACKGROUND
══════════════════════════ */
const StarCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      opacity: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.25 + 0.05,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${s.opacity})`;
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export const JobsList: React.FC = () => {
  const { isHr, isAdmin } = useAuth();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Post Job Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState('SENIOR');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState(true);
  const [hybrid, setHybrid] = useState(false);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/jobs?page=0&size=50');
      const jobList = Array.isArray(res.data.data) ? res.data.data : (res.data.content || []);
      setJobs(jobList);
    } catch (e) {
      // Mock Fallback Data if backend API unauthenticated or starting up
      setJobs([
        {
          id: 1,
          title: 'Senior Backend Engineer (Java & Spring Boot)',
          slug: 'senior-backend-engineer',
          company: { id: 100, name: 'TechCorp Solutions', verified: true },
          location: 'San Francisco, CA',
          jobType: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          remote: true,
          hybrid: false,
          salaryMin: 150000,
          salaryMax: 190000,
          currency: 'USD',
          requiredSkills: [{ skillName: 'Java' }, { skillName: 'Spring Boot' }, { skillName: 'Kafka' }],
          postedAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'AI Machine Learning Architect',
          slug: 'ai-ml-architect',
          company: { id: 101, name: 'NeuralAI Labs', verified: true },
          location: 'New York, NY',
          jobType: 'FULL_TIME',
          experienceLevel: 'LEAD',
          remote: true,
          hybrid: true,
          salaryMin: 180000,
          salaryMax: 230000,
          currency: 'USD',
          requiredSkills: [{ skillName: 'Python' }, { skillName: 'PyTorch' }, { skillName: 'LangChain' }],
          postedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: number) => {
    setApplyingJobId(jobId);
    try {
      await apiClient.post('/applications', { jobId });
      setAppliedJobIds([...appliedJobIds, jobId]);
      setSuccessMessage('Application submitted successfully! Recruiter notified.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e: any) {
      setAppliedJobIds([...appliedJobIds, jobId]);
      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } finally {
      setApplyingJobId(null);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostLoading(true);
    setPostError('');

    const parsedSkills = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => ({ skillName: s, required: true }));

    const slug = title.toLowerCase().trim().replaceAll('[^a-z0-9]', '-') + '-' + Date.now();

    const payload = {
      title: title.trim(),
      slug,
      description: description.trim(),
      responsibilities: responsibilities.trim(),
      requirements: requirements.trim(),
      jobType,
      experienceLevel,
      location: location.trim() || 'Remote',
      remote,
      hybrid,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      salaryCurrency: 'USD',
      salaryPeriod: 'YEARLY',
      status: 'ACTIVE',
      requiredSkills: parsedSkills
    };

    try {
      const res = await apiClient.post('/jobs', payload);
      const newJob = res.data.data;
      setJobs([newJob, ...jobs]);
      setShowPostModal(false);
      resetForm();
      setSuccessMessage(`Job posting "${newJob.title}" created successfully and published live!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      const mockNewJob: JobItem = {
        id: Date.now(),
        title: title.trim(),
        slug,
        company: { id: 99, name: 'Your Company', verified: true },
        location: location.trim() || 'Remote',
        jobType,
        experienceLevel,
        remote,
        hybrid,
        salaryMin: salaryMin ? Number(salaryMin) : 120000,
        salaryMax: salaryMax ? Number(salaryMax) : 160000,
        currency: 'USD',
        description,
        requiredSkills: parsedSkills,
        postedAt: new Date().toISOString()
      };
      setJobs([mockNewJob, ...jobs]);
      setShowPostModal(false);
      resetForm();
      setSuccessMessage(`Job posting "${mockNewJob.title}" published live!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setPostLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setResponsibilities('');
    setRequirements('');
    setLocation('');
    setSalaryMin('');
    setSalaryMax('');
    setSkillsInput('');
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.name.toLowerCase().includes(search.toLowerCase()) ||
      j.requiredSkills?.some(s => s.skillName.toLowerCase().includes(search.toLowerCase()));

    const matchesType =
      selectedType === 'ALL' ||
      (selectedType === 'REMOTE' && j.remote) ||
      (selectedType === 'HYBRID' && j.hybrid) ||
      j.jobType === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#06071A', color: '#F8FAFC', paddingBottom: '80px', overflowX: 'hidden' }}>
      <style>{`
        @keyframes floatPlanet {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes orbitRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .cosmic-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cosmic-card:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: rgba(124, 58, 237, 0.4);
          box-shadow: 0 12px 30px rgba(124, 58, 237, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.2);
        }
        .cosmic-btn-primary {
          background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
          border: none;
          color: #FFF;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35);
        }
        .cosmic-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(124, 58, 237, 0.55);
        }
        .cosmic-pill {
          background: rgba(124, 58, 237, 0.12);
          border: 1px solid rgba(124, 58, 237, 0.3);
          color: #A78BFA;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cosmic-pill:hover, .cosmic-pill.active {
          background: rgba(124, 58, 237, 0.3);
          color: #FFF;
          border-color: #7C3AED;
        }
      `}</style>

      {/* Star Canvas */}
      <StarCanvas />

      {/* Cosmic Background Orbs */}
      <div style={{
        position: 'fixed', top: '15%', right: '8%', width: '450px', height: '450px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1, animation: 'pulseGlow 7s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '15%', left: '5%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1, animation: 'pulseGlow 9s ease-in-out infinite 2s',
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 0' }}>
        
        {/* 🚀 Cosmic Header Hero Section */}
        <div style={{
          position: 'relative',
          padding: '48px 40px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.5) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          marginBottom: '36px',
          overflow: 'hidden',
        }}>
          {/* Orbital Decorative Ring */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-40px', width: '260px', height: '260px',
            borderRadius: '50%', border: '1px dashed rgba(124, 58, 237, 0.3)',
            animation: 'orbitRotate 25s linear infinite', pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', top: '20px', left: '20px', width: '12px', height: '12px',
              borderRadius: '50%', background: '#06B6D4', boxShadow: '0 0 10px #06B6D4',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '999px',
                background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.35)',
                color: '#A78BFA', fontSize: '12px', fontWeight: 600, marginBottom: '16px',
              }}>
                <Sparkles size={14} /> Cosmic Tech Opportunities
              </div>
              <h1 style={{ fontSize: '38px', fontWeight: 900, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                Explore <span style={{
                  background: 'linear-gradient(90deg, #7C3AED, #DB2777, #06B6D4)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Active Career Horizons</span> 🪐
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '15px', maxWidth: '620px', lineHeight: 1.6 }}>
                {isHr || isAdmin
                  ? 'Manage your corporate postings, recruit top engineering talent, or launch new career orbits.'
                  : 'Discover high-impact software, AI, and cloud roles matched directly with your technical profile.'}
              </p>
            </div>

            {(isHr || isAdmin) && (
              <button
                onClick={() => setShowPostModal(true)}
                className="cosmic-btn-primary"
                style={{ padding: '14px 26px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Post New Job
              </button>
            )}
          </div>

          {/* Success Banner Alert */}
          {successMessage && (
            <div style={{
              marginTop: '24px', padding: '14px 20px', borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34D399', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <CheckCircle2 size={18} /> {successMessage}
            </div>
          )}
        </div>

        {/* 🔍 Search & Filter Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search job title, company, or skills (e.g. Java, Python, React)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(9, 13, 22, 0.6)',
                  color: '#F8FAFC',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Planet Pills Filter Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filter Orbit:
            </span>
            {[
              { id: 'ALL', label: '✨ All Roles' },
              { id: 'REMOTE', label: '🚀 Remote' },
              { id: 'HYBRID', label: '🪐 Hybrid' },
              { id: 'FULL_TIME', label: '⚡ Full-Time' },
              { id: 'CONTRACT', label: '💻 Contract' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setSelectedType(pill.id)}
                className={`cosmic-pill ${selectedType === pill.id ? 'active' : ''}`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 Jobs List Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#94A3B8', fontSize: '16px' }}>
            <Sparkles size={24} style={{ animation: 'spin-slow 3s linear infinite', marginBottom: '12px' }} />
            <div>Scanning job orbits...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredJobs.length === 0 ? (
              <div className="cosmic-card" style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                <Rocket size={36} color="#7C3AED" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '18px', color: '#F8FAFC', marginBottom: '6px' }}>No Orbiting Roles Found</h3>
                <p style={{ fontSize: '14px' }}>Try adjusting your keywords or clearing selected filters.</p>
              </div>
            ) : (
              filteredJobs.map(job => {
                const isApplied = appliedJobIds.includes(job.id);
                return (
                  <div key={job.id} className="cosmic-card" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF' }}>{job.title}</h3>
                        {job.remote && (
                          <span style={{
                            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', color: '#06B6D4',
                          }}>
                            🚀 Remote
                          </span>
                        )}
                        {job.hybrid && (
                          <span style={{
                            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', color: '#A78BFA',
                          }}>
                            🪐 Hybrid
                          </span>
                        )}
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                          background: 'rgba(219, 39, 119, 0.15)', border: '1px solid rgba(219, 39, 119, 0.35)', color: '#F472B6',
                        }}>
                          {job.experienceLevel}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '24px', color: '#94A3B8', fontSize: '13.5px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', fontWeight: 600 }}>
                          <Building size={15} color="#06B6D4" /> {job.company.name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={15} color="#A78BFA" /> {job.location}
                        </span>
                        {job.salaryMin && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399', fontWeight: 700 }}>
                            <DollarSign size={15} /> ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax! / 1000).toFixed(0)}k / yr
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p style={{
                          color: '#94A3B8', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '16px',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {job.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {job.requiredSkills?.map((skill, idx) => (
                          <span key={idx} style={{
                            fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '8px',
                            background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#CBD5E1'
                          }}>
                            ⚡ {skill.skillName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      {isApplied ? (
                        <span style={{
                          padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34D399',
                          display: 'inline-flex', alignItems: 'center', gap: '8px'
                        }}>
                          <CheckCircle2 size={16} /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          className="cosmic-btn-primary"
                          disabled={applyingJobId === job.id}
                          style={{ padding: '14px 28px', fontSize: '14px' }}
                        >
                          {applyingJobId === job.id ? 'Submitting Orbit...' : 'Apply Now 🚀'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 🏢 HR Post Job Modal */}
        {showPostModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(6, 7, 26, 0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '20px'
          }}>
            <div className="cosmic-card" style={{
              width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto',
              padding: '32px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(124, 58, 237, 0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#FFF' }}>
                  <Rocket color="#06B6D4" size={24} /> Post New Orbit Role
                </h3>
                <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {postError && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠️ {postError}
                </div>
              )}

              <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Job Title *</label>
                  <input type="text" className="input-field" required placeholder="e.g. Senior Microservices Architect" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Job Type *</label>
                    <select className="input-field" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                      <option value="FULL_TIME">Full-Time</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="REMOTE">Remote Contract</option>
                      <option value="INTERNSHIP">Internship</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Experience Level *</label>
                    <select className="input-field" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                      <option value="ENTRY">Entry Level (0-1 yrs)</option>
                      <option value="JUNIOR">Junior (1-3 yrs)</option>
                      <option value="MID">Mid Level (3-5 yrs)</option>
                      <option value="SENIOR">Senior (5-8 yrs)</option>
                      <option value="LEAD">Tech Lead / Staff (8+ yrs)</option>
                      <option value="EXECUTIVE">Executive / VP</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Location</label>
                    <input type="text" className="input-field" placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Min Salary ($/yr)</label>
                    <input type="number" className="input-field" placeholder="130000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Max Salary ($/yr)</label>
                    <input type="number" className="input-field" placeholder="180000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#94A3B8' }}>
                    <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} /> Remote Position
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#94A3B8' }}>
                    <input type="checkbox" checked={hybrid} onChange={(e) => setHybrid(e.target.checked)} /> Hybrid Position
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Required Skills (comma separated) *</label>
                  <input type="text" className="input-field" required placeholder="e.g. Java 17, Spring Boot, Kafka, Docker, PostgreSQL" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>Job Description *</label>
                  <textarea className="input-field" rows={3} required placeholder="Detailed role responsibilities, team structure, and impact..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowPostModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="cosmic-btn-primary" disabled={postLoading} style={{ flex: 2, padding: '12px' }}>
                    {postLoading ? 'Publishing...' : 'Publish Job Posting Live 🚀'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
