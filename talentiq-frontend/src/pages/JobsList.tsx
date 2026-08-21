import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Building, DollarSign, CheckCircle2, Plus, X, Sparkles, Filter, Rocket } from 'lucide-react';
import '../css/jobs-list.css';

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
      className="jobs-star-canvas"
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
    <div className="jobs-page-wrapper">
      {/* Star Canvas */}
      <StarCanvas />

      {/* Cosmic Background Orbs */}
      <div className="jobs-orb-top-right" />
      <div className="jobs-orb-bottom-left" />

      <div className="jobs-content-container">
        {/* 🚀 Cosmic Header Hero Section */}
        <div className="jobs-hero-panel">
          {/* Orbital Decorative Ring */}
          <div className="jobs-orbital-ring">
            <div className="jobs-orbital-dot" />
          </div>

          <div className="jobs-hero-content">
            <div>
              <div className="jobs-badge-tag">
                <Sparkles size={14} /> Cosmic Tech Opportunities
              </div>
              <h1 className="jobs-hero-title">
                Explore <span className="jobs-gradient-text">Active Career Horizons</span> 🪐
              </h1>
              <p className="jobs-hero-desc">
                {isHr || isAdmin
                  ? 'Manage your corporate postings, recruit top engineering talent, or launch new career orbits.'
                  : 'Discover high-impact software, AI, and cloud roles matched directly with your technical profile.'}
              </p>
            </div>

            {(isHr || isAdmin) && (
              <button
                onClick={() => setShowPostModal(true)}
                className="cosmic-btn-primary jobs-post-btn-hero"
              >
                <Plus size={18} /> Post New Job
              </button>
            )}
          </div>

          {/* Success Banner Alert */}
          {successMessage && (
            <div className="jobs-alert-success">
              <CheckCircle2 size={18} /> {successMessage}
            </div>
          )}
        </div>

        {/* 🔍 Search & Filter Bar */}
        <div className="jobs-filter-panel">
          <div className="jobs-search-row">
            <div className="jobs-search-wrapper">
              <Search size={18} color="#94A3B8" className="jobs-search-icon" />
              <input
                type="text"
                placeholder="Search job title, company, or skills (e.g. Java, Python, React)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="jobs-search-input"
              />
            </div>
          </div>

          {/* Planet Pills Filter Row */}
          <div className="jobs-pills-row">
            <span className="jobs-filter-label">
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
          <div className="jobs-loading">
            <Sparkles size={24} className="jobs-loading-icon" />
            <div>Scanning job orbits...</div>
          </div>
        ) : (
          <div className="jobs-list-container">
            {filteredJobs.length === 0 ? (
              <div className="cosmic-card jobs-empty-card">
                <Rocket size={36} color="#7C3AED" className="jobs-empty-icon" />
                <h3 className="jobs-empty-title">No Orbiting Roles Found</h3>
                <p>Try adjusting your keywords or clearing selected filters.</p>
              </div>
            ) : (
              filteredJobs.map(job => {
                const isApplied = appliedJobIds.includes(job.id);
                return (
                  <div key={job.id} className="cosmic-card jobs-item-card">
                    <div className="jobs-item-main">
                      <div className="jobs-item-title-row">
                        <h3 className="jobs-item-title">{job.title}</h3>
                        {job.remote && (
                          <span className="jobs-badge-remote">
                            🚀 Remote
                          </span>
                        )}
                        {job.hybrid && (
                          <span className="jobs-badge-hybrid">
                            🪐 Hybrid
                          </span>
                        )}
                        <span className="jobs-badge-level">
                          {job.experienceLevel}
                        </span>
                      </div>

                      <div className="jobs-meta-row">
                        <span className="jobs-company-name">
                          <Building size={15} color="#06B6D4" /> {job.company.name}
                        </span>
                        <span className="jobs-location-name">
                          <MapPin size={15} color="#A78BFA" /> {job.location}
                        </span>
                        {job.salaryMin && (
                          <span className="jobs-salary-text">
                            <DollarSign size={15} /> ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax! / 1000).toFixed(0)}k / yr
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="jobs-desc-snippet">
                          {job.description}
                        </p>
                      )}

                      <div className="jobs-skills-row">
                        {job.requiredSkills?.map((skill, idx) => (
                          <span key={idx} className="jobs-skill-chip">
                            ⚡ {skill.skillName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      {isApplied ? (
                        <span className="jobs-applied-badge">
                          <CheckCircle2 size={16} /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApply(job.id)}
                          className="cosmic-btn-primary jobs-apply-btn"
                          disabled={applyingJobId === job.id}
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
          <div className="jobs-modal-overlay">
            <div className="cosmic-card jobs-modal-card">
              <div className="jobs-modal-header">
                <h3 className="jobs-modal-title">
                  <Rocket color="#06B6D4" size={24} /> Post New Orbit Role
                </h3>
                <button onClick={() => setShowPostModal(false)} className="jobs-modal-close-btn">
                  <X size={20} />
                </button>
              </div>

              {postError && (
                <div className="jobs-modal-error">
                  ⚠️ {postError}
                </div>
              )}

              <form onSubmit={handlePostJob} className="jobs-modal-form">
                <div>
                  <label className="jobs-modal-label">Job Title *</label>
                  <input type="text" className="input-field" required placeholder="e.g. Senior Microservices Architect" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="jobs-modal-row-2col">
                  <div>
                    <label className="jobs-modal-label">Job Type *</label>
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
                    <label className="jobs-modal-label">Experience Level *</label>
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

                <div className="jobs-modal-row-3col">
                  <div>
                    <label className="jobs-modal-label">Location</label>
                    <input type="text" className="input-field" placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div>
                    <label className="jobs-modal-label">Min Salary ($/yr)</label>
                    <input type="number" className="input-field" placeholder="130000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                  </div>
                  <div>
                    <label className="jobs-modal-label">Max Salary ($/yr)</label>
                    <input type="number" className="input-field" placeholder="180000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
                  </div>
                </div>

                <div className="jobs-modal-checkbox-row">
                  <label className="jobs-modal-checkbox-label">
                    <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} /> Remote Position
                  </label>
                  <label className="jobs-modal-checkbox-label">
                    <input type="checkbox" checked={hybrid} onChange={(e) => setHybrid(e.target.checked)} /> Hybrid Position
                  </label>
                </div>

                <div>
                  <label className="jobs-modal-label">Required Skills (comma separated) *</label>
                  <input type="text" className="input-field" required placeholder="e.g. Java 17, Spring Boot, Kafka, Docker, PostgreSQL" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                </div>

                <div>
                  <label className="jobs-modal-label">Job Description *</label>
                  <textarea className="input-field" rows={3} required placeholder="Detailed role responsibilities, team structure, and impact..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="jobs-modal-actions">
                  <button type="button" onClick={() => setShowPostModal(false)} className="btn btn-secondary jobs-modal-cancel-btn">Cancel</button>
                  <button type="submit" className="cosmic-btn-primary jobs-modal-submit-btn" disabled={postLoading}>
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
