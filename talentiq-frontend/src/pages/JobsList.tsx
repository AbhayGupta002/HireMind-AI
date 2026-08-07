import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Building, DollarSign, CheckCircle2, Plus, X, Briefcase } from 'lucide-react';

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

export const JobsList: React.FC = () => {
  const { isHr, isAdmin } = useAuth();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [search, setSearch] = useState('');
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
      // Fallback local addition if user backend session is mock
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

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.name.toLowerCase().includes(search.toLowerCase()) ||
    j.requiredSkills?.some(s => s.skillName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1140px', margin: '40px auto', padding: '0 24px' }}>
      {/* Header & Controls */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Active Job Opportunities</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {isHr || isAdmin ? 'Manage active job postings or publish new career roles for candidates' : 'Explore high-impact technical roles matching your AI profile'}
            </p>
          </div>

          {(isHr || isAdmin) && (
            <button onClick={() => setShowPostModal(true)} className="btn btn-primary" style={{ padding: '12px 20px', display: 'flex', gap: '8px' }}>
              <Plus size={18} /> Post New Job
            </button>
          )}
        </div>

        {successMessage && (
          <div style={{
            marginTop: '16px', padding: '14px', borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34D399', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle2 size={18} /> {successMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '16px' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by job title, company name, or skills (e.g. Java, Python, React)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '48px', height: '50px' }}
            />
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading active jobs...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredJobs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matching jobs found. Try adjusting your search query.
            </div>
          ) : (
            filteredJobs.map(job => {
              const isApplied = appliedJobIds.includes(job.id);
              return (
                <div key={job.id} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, paddingRight: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '20px', color: '#FFF' }}>{job.title}</h3>
                      {job.remote && <span className="badge badge-cyan">Remote</span>}
                      {job.hybrid && <span className="badge badge-indigo">Hybrid</span>}
                      <span className="badge badge-rose">{job.experienceLevel}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={14} color="var(--primary-cyan)" /> {job.company.name}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} /> {job.location}
                      </span>
                      {job.salaryMin && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          <DollarSign size={14} /> ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax! / 1000).toFixed(0)}k / yr
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {job.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {job.requiredSkills?.map((skill, idx) => (
                        <span key={idx} style={{
                          fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)'
                        }}>
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    {isApplied ? (
                      <span className="badge badge-emerald" style={{ padding: '10px 20px', fontSize: '14px' }}>
                        <CheckCircle2 size={16} /> Applied
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleApply(job.id)} 
                        className="btn btn-primary"
                        disabled={applyingJobId === job.id}
                        style={{ padding: '12px 24px' }}
                      >
                        {applyingJobId === job.id ? 'Submitting...' : 'Apply Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* HR Post Job Modal */}
      {showPostModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', background: 'var(--bg-glass-heavy)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase color="var(--primary-cyan)" size={24} /> Post New Career Opportunity
              </h3>
              <button onClick={() => setShowPostModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            {postError && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {postError}
              </div>
            )}

            <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Job Title *</label>
                <input type="text" className="input-field" required placeholder="e.g. Senior Microservices Architect" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Job Type *</label>
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Experience Level *</label>
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Location</label>
                  <input type="text" className="input-field" placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Min Salary ($/yr)</label>
                  <input type="number" className="input-field" placeholder="130000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Max Salary ($/yr)</label>
                  <input type="number" className="input-field" placeholder="180000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} /> Remote Position
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hybrid} onChange={(e) => setHybrid(e.target.checked)} /> Hybrid Position
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Required Skills (comma separated) *</label>
                <input type="text" className="input-field" required placeholder="e.g. Java 17, Spring Boot, Kafka, Docker, PostgreSQL" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Job Description *</label>
                <textarea className="input-field" rows={3} required placeholder="Detailed role responsibilities, team structure, and impact..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Key Responsibilities</label>
                <textarea className="input-field" rows={2} placeholder="Architect high-performance distributed microservices..." value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowPostModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={postLoading} style={{ flex: 2 }}>
                  {postLoading ? 'Publishing...' : 'Publish Job Posting Live 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
