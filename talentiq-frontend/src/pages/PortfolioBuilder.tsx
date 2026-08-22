import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MilkyWay3DCanvas } from '../components/MilkyWay3DCanvas';
import {
  Plus,
  ExternalLink,
  GitBranch,
  Eye,
  ThumbsUp,
  Trash2,
  Edit3,
  X,
  FolderGit2,
  AlertCircle,
  FileText,
  UploadCloud,
  CheckCircle2,
  Briefcase,
  Cpu,
  MapPin,
  Calendar,
  Sparkles,
  Download,
  Building2,
} from 'lucide-react';
import '../css/portfolio-builder.css';

// ── Data Interfaces ──────────────────────────────────────────
interface PortfolioItem {
  id: number;
  candidateId?: number;
  title: string;
  description: string;
  category: string;
  projectUrl?: string;
  githubUrl?: string;
  thumbnailUrl?: string;
  viewsCount: number;
  likesCount: number;
  featured?: boolean;
}

interface CandidateSkill {
  id: number;
  skillName: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  years?: number;
  primary?: boolean;
}

interface CandidateExperience {
  id: number;
  company: string;
  title: string;
  description?: string;
  location?: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

interface ResumeItem {
  id: number;
  fileName: string;
  fileSize?: number;
  versionName?: string;
  active?: boolean;
  createdAt?: string;
}

interface CandidateProfile {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  headline?: string;
  bio?: string;
  location?: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsExperience?: number;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  profileCompletion?: number;
  skills?: CandidateSkill[];
  experiences?: CandidateExperience[];
}

// ── Preset Tech Stacks for Quick Selection ───────────────────
const PRESET_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
  'PHP', 'Swift', 'Kotlin', 'Ruby', 'SQL', 'HTML5/CSS3', 'Shell/Bash'
];

const PRESET_FRAMEWORKS = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express',
  'Spring Boot', 'Django', 'FastAPI', 'Flask', 'Laravel', 'ASP.NET Core',
  'Flutter', 'React Native', 'TensorFlow', 'PyTorch', 'LangChain', 'GraphQL'
];

const PRESET_DEVOPS_DB = [
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Google Cloud (GCP)', 'Microsoft Azure', 'Apache Kafka', 'Elasticsearch', 'CI/CD Pipelines'
];

export const PortfolioBuilder: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'skills' | 'experience' | 'resume'>('projects');

  // Candidate Data State
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [experiences, setExperiences] = useState<CandidateExperience[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Project Modal State ──
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectCategory, setProjectCategory] = useState('WEB');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectGithub, setProjectGithub] = useState('');
  const [projectThumb, setProjectThumb] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  // ── Skill Modal State ──
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillNameInput, setSkillNameInput] = useState('');
  const [skillProficiency, setSkillProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('ADVANCED');
  const [skillYears, setSkillYears] = useState<number>(3);
  const [savingSkill, setSavingSkill] = useState(false);

  // ── Experience Modal State ──
  const [showExpModal, setShowExpModal] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [savingExp, setSavingExp] = useState(false);

  // ── Profile Edit Modal State ──
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCurrentTitle, setEditCurrentTitle] = useState('');
  const [editCurrentCompany, setEditCurrentCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editYearsExp, setEditYearsExp] = useState<number>(0);
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Resume Upload State ──
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // ── Fetch All Candidate Portfolio & Profile Data ──────────
  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Candidate Profile & Skills & Experiences
      try {
        const profRes = await apiClient.get('/candidates/me');
        const profData = profRes.data?.data || profRes.data;
        if (profData) {
          setProfile(profData);
          setSkills(profData.skills || []);
          setExperiences(profData.experiences || []);
          setEditHeadline(profData.headline || '');
          setEditBio(profData.bio || '');
          setEditCurrentTitle(profData.currentTitle || '');
          setEditCurrentCompany(profData.currentCompany || '');
          setEditLocation(profData.location || '');
          setEditYearsExp(profData.yearsExperience || 0);
          setEditGithub(profData.githubUrl || '');
          setEditLinkedin(profData.linkedinUrl || '');
        }
      } catch (e) {
        console.warn('Candidate profile lookup fallback:', e);
      }

      // 2. Fetch Candidate's Own Projects (Isolated to Current User)
      try {
        const projRes = await apiClient.get('/portfolios/my');
        const projItems = projRes.data?.content || projRes.data?.data?.content || projRes.data?.data || [];
        setPortfolios(Array.isArray(projItems) ? projItems : []);
      } catch (e) {
        setPortfolios([]);
      }

      // 3. Fetch Candidate's Uploaded Resumes
      try {
        const resRes = await apiClient.get('/resumes');
        const resList = resRes.data?.data || resRes.data || [];
        setResumes(Array.isArray(resList) ? resList : []);
      } catch (e) {
        setResumes([]);
      }
    } catch (err: any) {
      console.warn('Error loading portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Flash Toast Notification ──────────────────────────────
  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ── PROJECTS CRUD (Permanent MySQL Persistence) ────────────
  const openCreateProjectModal = () => {
    setEditingProjectId(null);
    setProjectTitle('');
    setProjectDesc('');
    setProjectCategory('WEB');
    setProjectUrl('');
    setProjectGithub('');
    setProjectThumb('');
    setShowProjectModal(true);
  };

  const openEditProjectModal = (item: PortfolioItem) => {
    setEditingProjectId(item.id);
    setProjectTitle(item.title || '');
    setProjectDesc(item.description || '');
    setProjectCategory(item.category || 'WEB');
    setProjectUrl(item.projectUrl || '');
    setProjectGithub(item.githubUrl || '');
    setProjectThumb(item.thumbnailUrl || '');
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setSavingProject(true);
    setError('');
    try {
      const payload = {
        title: projectTitle.trim(),
        description: projectDesc.trim(),
        category: projectCategory,
        projectUrl: projectUrl.trim(),
        githubUrl: projectGithub.trim(),
        thumbnailUrl: projectThumb.trim(),
        featured: false,
      };

      if (editingProjectId) {
        const res = await apiClient.put(`/portfolios/${editingProjectId}`, payload);
        const updated = res.data?.data || res.data;
        setPortfolios((prev) =>
          prev.map((p) => (p.id === editingProjectId ? { ...p, ...updated } : p))
        );
        showToast('Project updated successfully!');
      } else {
        const res = await apiClient.post('/portfolios', payload);
        const created = res.data?.data || res.data;
        if (created && created.id) {
          setPortfolios((prev) => [created, ...prev]);
        } else {
          await fetchAllData();
        }
        showToast('Project created permanently in your portfolio! 🚀');
      }
      setShowProjectModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save portfolio project.');
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently remove this project?')) return;
    try {
      await apiClient.delete(`/portfolios/${id}`);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      showToast('Project deleted.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete project.');
    }
  };

  // ── SKILLS CRUD (Permanent MySQL Persistence) ──────────────
  const handleAddPresetSkill = async (name: string) => {
    // Check if already present
    if (skills.some((s) => s.skillName.toLowerCase() === name.toLowerCase())) {
      return;
    }
    try {
      const payload = {
        skillName: name,
        proficiency: 'ADVANCED',
        years: 3,
        primary: true,
      };
      const res = await apiClient.post('/candidates/me/skills', payload);
      const updatedProfile = res.data?.data || res.data;
      if (updatedProfile?.skills) {
        setSkills(updatedProfile.skills);
      } else {
        await fetchAllData();
      }
      showToast(`Added ${name} to your skills matrix!`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add skill.');
    }
  };

  const handleCustomSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillNameInput.trim()) return;

    setSavingSkill(true);
    try {
      const payload = {
        skillName: skillNameInput.trim(),
        proficiency: skillProficiency,
        years: skillYears,
        primary: skillProficiency === 'EXPERT' || skillProficiency === 'ADVANCED',
      };
      const res = await apiClient.post('/candidates/me/skills', payload);
      const updatedProfile = res.data?.data || res.data;
      if (updatedProfile?.skills) {
        setSkills(updatedProfile.skills);
      } else {
        await fetchAllData();
      }
      setShowSkillModal(false);
      setSkillNameInput('');
      showToast('Skill added successfully!');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add skill.');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await apiClient.delete(`/candidates/me/skills/${skillId}`);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      showToast('Skill removed.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete skill.');
    }
  };

  // ── WORK EXPERIENCE CRUD (Permanent MySQL Persistence) ──────
  const handleAddExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany.trim() || !expTitle.trim()) return;

    setSavingExp(true);
    try {
      const payload = {
        company: expCompany.trim(),
        title: expTitle.trim(),
        location: expLocation.trim(),
        startDate: expStartDate || null,
        endDate: expCurrent ? null : expEndDate || null,
        current: expCurrent,
        description: expDescription.trim(),
      };
      const res = await apiClient.post('/candidates/me/experiences', payload);
      const updatedProfile = res.data?.data || res.data;
      if (updatedProfile?.experiences) {
        setExperiences(updatedProfile.experiences);
      } else {
        await fetchAllData();
      }
      setShowExpModal(false);
      // Reset
      setExpCompany('');
      setExpTitle('');
      setExpLocation('');
      setExpStartDate('');
      setExpEndDate('');
      setExpCurrent(false);
      setExpDescription('');
      showToast('Work experience saved!');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save experience.');
    } finally {
      setSavingExp(false);
    }
  };

  const handleDeleteExperience = async (expId: number) => {
    if (!window.confirm('Delete this work experience entry?')) return;
    try {
      await apiClient.delete(`/candidates/me/experiences/${expId}`);
      setExperiences((prev) => prev.filter((e) => e.id !== expId));
      showToast('Experience entry removed.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete experience.');
    }
  };

  // ── PROFILE UPDATE (Permanent MySQL Persistence) ───────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        headline: editHeadline.trim(),
        bio: editBio.trim(),
        currentTitle: editCurrentTitle.trim(),
        currentCompany: editCurrentCompany.trim(),
        location: editLocation.trim(),
        yearsExperience: editYearsExp,
        githubUrl: editGithub.trim(),
        linkedinUrl: editLinkedin.trim(),
      };
      const res = await apiClient.put('/candidates/me', payload);
      const updated = res.data?.data || res.data;
      setProfile((prev) => ({ ...prev, ...updated }));
      setShowProfileModal(false);
      showToast('Profile details updated permanently!');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── RESUME UPLOAD (Permanent File & Database Persistence) ──
  const handleResumeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('versionName', file.name);

    setUploadingResume(true);
    setError('');
    try {
      const res = await apiClient.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = res.data?.data || res.data;
      if (uploaded) {
        setResumes((prev) => [uploaded, ...prev]);
        showToast('Resume uploaded and parsed successfully! 📄✨');
      } else {
        await fetchAllData();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload resume file.');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    if (!window.confirm('Delete this resume version?')) return;
    try {
      await apiClient.delete(`/resumes/${resumeId}`);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      showToast('Resume version deleted.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete resume.');
    }
  };

  const handleDownloadResume = async (resumeId: number, fileName: string) => {
    try {
      const res = await apiClient.get(`/resumes/${resumeId}`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Could not download resume file.');
    }
  };

  // ── Helper Category Badge Styles ──
  const getCategoryClass = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'WEB': return 'category-web';
      case 'MOBILE': return 'category-mobile';
      case 'AI_ML': return 'category-ai_ml';
      case 'SYSTEM': return 'category-system';
      case 'CLOUD':
      case 'CLOUD_DEVOPS': return 'category-cloud';
      case 'DESIGN': return 'category-design';
      default: return 'category-web';
    }
  };

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email?.split('@')[0] || 'Candidate';

  return (
    <div className="portfolio-page-wrapper">
      {/* 3D Interactive Milky Way Galaxy Canvas */}
      <MilkyWay3DCanvas interactive={true} showOrbits={true} />

      <div className="portfolio-container">
        {/* Toast / Feedback Banner */}
        {successMsg && (
          <div style={{ padding: '12px 18px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 14, color: '#4ADE80', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, backdropFilter: 'blur(12px)' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 18px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 14, color: '#FCA5A5', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, backdropFilter: 'blur(12px)' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* ── 3D Hero Profile Header Card ── */}
        <div className="portfolio-hero-card">
          <div className="portfolio-hero-info">
            <div className="portfolio-avatar-glow">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="portfolio-hero-meta">
              <h1>{displayName}</h1>
              <p className="portfolio-hero-sub">
                <Sparkles size={15} color="#38BDF8" />
                {profile?.currentTitle || 'Full-Stack Software Engineer'}
                {profile?.currentCompany ? ` @ ${profile.currentCompany}` : ''}
              </p>

              <div className="portfolio-hero-tags">
                {profile?.location && (
                  <span className="portfolio-hero-tag-item">
                    <MapPin size={13} /> {profile.location}
                  </span>
                )}
                {profile?.yearsExperience !== undefined && profile?.yearsExperience > 0 && (
                  <span className="portfolio-hero-tag-item">
                    <Briefcase size={13} /> {profile.yearsExperience}+ Years Exp
                  </span>
                )}
                {profile?.githubUrl && (
                  <a
                    href={profile.githubUrl.startsWith('http') ? profile.githubUrl : `https://${profile.githubUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <GitBranch size={13} /> GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="portfolio-hero-actions">
            <button onClick={() => setShowProfileModal(true)} className="portfolio-edit-profile-btn">
              <Edit3 size={15} /> Edit Profile Info
            </button>
          </div>
        </div>

        {/* ── Section Navigation Tabs ── */}
        <div className="portfolio-tabs-nav">
          <button
            onClick={() => setActiveTab('projects')}
            className={`portfolio-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          >
            <FolderGit2 size={16} /> Projects Showcase
            <span className="portfolio-tab-badge">{portfolios.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`portfolio-tab-btn ${activeTab === 'skills' ? 'active skills' : ''}`}
          >
            <Cpu size={16} /> Skills & Tech Stack Matrix
            <span className="portfolio-tab-badge">{skills.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`portfolio-tab-btn ${activeTab === 'experience' ? 'active experience' : ''}`}
          >
            <Building2 size={16} /> Work History & Companies
            <span className="portfolio-tab-badge">{experiences.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('resume')}
            className={`portfolio-tab-btn ${activeTab === 'resume' ? 'active resume' : ''}`}
          >
            <FileText size={16} /> Resume Center
            <span className="portfolio-tab-badge">{resumes.length}</span>
          </button>
        </div>

        {/* ── TAB 1: PROJECTS SHOWCASE ── */}
        {activeTab === 'projects' && (
          <div>
            <div className="portfolio-section-header">
              <div>
                <h2 className="portfolio-section-title">
                  <FolderGit2 size={22} color="#38BDF8" />
                  Technical Project Showcase
                </h2>
                <p className="portfolio-section-subtitle">
                  Live systems, production microservices, full-stack applications, and open-source repositories
                </p>
              </div>

              <button onClick={openCreateProjectModal} className="portfolio-primary-add-btn">
                <Plus size={16} /> Add New Project
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>Loading projects...</div>
            ) : portfolios.length === 0 ? (
              <div className="portfolio-empty-state">
                <div className="portfolio-empty-icon">
                  <FolderGit2 size={36} />
                </div>
                <h3 className="portfolio-empty-title">No Projects in Your Portfolio Yet</h3>
                <p className="portfolio-empty-desc">
                  Your portfolio is currently empty. Add your web apps, mobile projects, AI experiments, or repositories to stand out to hiring recruiters.
                </p>
                <button onClick={openCreateProjectModal} className="portfolio-primary-add-btn">
                  <Plus size={16} /> Add Your First Project 🚀
                </button>
              </div>
            ) : (
              <div className="portfolio-grid">
                {portfolios.map((item) => (
                  <div key={item.id} className="portfolio-card">
                    <div>
                      <div className="portfolio-card-top">
                        <span className={`portfolio-category-tag ${getCategoryClass(item.category)}`}>
                          {item.category?.replace('_', ' ')}
                        </span>

                        <div className="portfolio-card-actions">
                          <button
                            onClick={() => openEditProjectModal(item)}
                            className="portfolio-action-icon-btn"
                            title="Edit Project"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(item.id)}
                            className="portfolio-action-icon-btn delete"
                            title="Delete Project Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="portfolio-item-title">{item.title}</h3>
                      <p className="portfolio-item-desc">{item.description}</p>
                    </div>

                    <div>
                      <div className="portfolio-stats">
                        <span className="portfolio-stat-item">
                          <Eye size={13} /> {item.viewsCount || 0} views
                        </span>
                        <span className="portfolio-stat-item">
                          <ThumbsUp size={13} /> {item.likesCount || 0} likes
                        </span>
                      </div>

                      <div className="portfolio-links-row">
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl.startsWith('http') ? item.projectUrl : `https://${item.projectUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="portfolio-link-btn demo"
                          >
                            <ExternalLink size={13} /> Live Demo
                          </a>
                        )}
                        {item.githubUrl && (
                          <a
                            href={item.githubUrl.startsWith('http') ? item.githubUrl : `https://${item.githubUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="portfolio-link-btn code"
                          >
                            <GitBranch size={13} /> GitHub Code
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: SKILLS & TECH STACK MATRIX (Task 2) ── */}
        {activeTab === 'skills' && (
          <div className="portfolio-skills-container">
            <div className="portfolio-section-header">
              <div>
                <h2 className="portfolio-section-title">
                  <Cpu size={22} color="#818CF8" />
                  Skills & Technology Matrix
                </h2>
                <p className="portfolio-section-subtitle">
                  Select your programming languages, frameworks, cloud infrastructure, and tools
                </p>
              </div>

              <button onClick={() => setShowSkillModal(true)} className="portfolio-primary-add-btn">
                <Plus size={16} /> Custom Skill
              </button>
            </div>

            {/* Quick-Add Tech Chips */}
            <div className="portfolio-skills-quick-chips">
              <h4 className="portfolio-quick-category-title">⚡ Programming Languages</h4>
              <div className="portfolio-chip-group">
                {PRESET_LANGUAGES.map((lang) => {
                  const isAdded = skills.some((s) => s.skillName.toLowerCase() === lang.toLowerCase());
                  return (
                    <button
                      key={lang}
                      onClick={() => handleAddPresetSkill(lang)}
                      className={`portfolio-preset-chip ${isAdded ? 'active' : ''}`}
                    >
                      {isAdded ? <CheckCircle2 size={13} /> : <Plus size={13} />} {lang}
                    </button>
                  );
                })}
              </div>

              <h4 className="portfolio-quick-category-title">🚀 Frameworks & Libraries</h4>
              <div className="portfolio-chip-group">
                {PRESET_FRAMEWORKS.map((fw) => {
                  const isAdded = skills.some((s) => s.skillName.toLowerCase() === fw.toLowerCase());
                  return (
                    <button
                      key={fw}
                      onClick={() => handleAddPresetSkill(fw)}
                      className={`portfolio-preset-chip ${isAdded ? 'active' : ''}`}
                    >
                      {isAdded ? <CheckCircle2 size={13} /> : <Plus size={13} />} {fw}
                    </button>
                  );
                })}
              </div>

              <h4 className="portfolio-quick-category-title">☁️ Cloud, DevOps & Databases</h4>
              <div className="portfolio-chip-group">
                {PRESET_DEVOPS_DB.map((db) => {
                  const isAdded = skills.some((s) => s.skillName.toLowerCase() === db.toLowerCase());
                  return (
                    <button
                      key={db}
                      onClick={() => handleAddPresetSkill(db)}
                      className={`portfolio-preset-chip ${isAdded ? 'active' : ''}`}
                    >
                      {isAdded ? <CheckCircle2 size={13} /> : <Plus size={13} />} {db}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Candidate's Active Skills Grid */}
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', margin: '10px 0 0 0' }}>
              Your Active Skills Portfolio ({skills.length})
            </h3>

            {skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                No skills added yet. Click any technology chip above or use "+ Custom Skill" to add your skills!
              </div>
            ) : (
              <div className="portfolio-my-skills-grid">
                {skills.map((skill) => (
                  <div key={skill.id} className="portfolio-skill-card">
                    <div>
                      <h4 className="portfolio-skill-name">{skill.skillName}</h4>
                      <span className="portfolio-skill-level">
                        {skill.proficiency} {skill.years ? `• ${skill.years} Yrs` : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="portfolio-action-icon-btn delete"
                      title="Remove Skill"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: WORK HISTORY & COMPANIES (Task 2) ── */}
        {activeTab === 'experience' && (
          <div>
            <div className="portfolio-section-header">
              <div>
                <h2 className="portfolio-section-title">
                  <Building2 size={22} color="#F59E0B" />
                  Work Experience & Company History
                </h2>
                <p className="portfolio-section-subtitle">
                  Where you are currently working and previous software companies, roles, and accomplishments
                </p>
              </div>

              <button onClick={() => setShowExpModal(true)} className="portfolio-primary-add-btn">
                <Plus size={16} /> Add Experience
              </button>
            </div>

            {experiences.length === 0 ? (
              <div className="portfolio-empty-state">
                <div className="portfolio-empty-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' }}>
                  <Building2 size={36} />
                </div>
                <h3 className="portfolio-empty-title">No Work History Added Yet</h3>
                <p className="portfolio-empty-desc">
                  Add your current job, previous engineering roles, and software accomplishments to showcase your career trajectory.
                </p>
                <button onClick={() => setShowExpModal(true)} className="portfolio-primary-add-btn">
                  <Plus size={16} /> Add Current / Past Company
                </button>
              </div>
            ) : (
              <div className="portfolio-experience-list">
                {experiences.map((exp) => (
                  <div key={exp.id} className="portfolio-experience-card">
                    <div className="portfolio-exp-header">
                      <div>
                        <h3 className="portfolio-exp-title">{exp.title}</h3>
                        <div className="portfolio-exp-company">
                          <Building2 size={14} /> {exp.company}
                          {exp.current && <span className="portfolio-exp-current-badge">Current Position</span>}
                          {exp.location && <span style={{ color: '#94A3B8', fontSize: 13 }}>• {exp.location}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="portfolio-exp-dates">
                          <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                          {exp.startDate || 'Started'} — {exp.current ? 'Present' : exp.endDate || 'Ended'}
                        </span>
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="portfolio-action-icon-btn delete"
                          title="Delete Experience"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {exp.description && <p className="portfolio-exp-desc">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: RESUME CENTER (Task 1) ── */}
        {activeTab === 'resume' && (
          <div className="portfolio-resume-container">
            <div className="portfolio-section-header">
              <div>
                <h2 className="portfolio-section-title">
                  <FileText size={22} color="#EC4899" />
                  Resume & Document Center
                </h2>
                <p className="portfolio-section-subtitle">
                  Upload your latest PDF/DOCX resume for automated AI parsing and recruiter review
                </p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx"
              onChange={handleResumeFileSelect}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="portfolio-resume-dropzone"
            >
              <UploadCloud size={48} color="#EC4899" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', margin: '0 0 6px 0' }}>
                {uploadingResume ? 'Uploading & Parsing Resume with AI...' : 'Click to Upload Resume (PDF / DOCX)'}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
                Supports standard formats up to 10MB. Automatically parses skills, projects, and work history.
              </p>
            </div>

            {/* List of Uploaded Resumes */}
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', margin: '12px 0 0 0' }}>
              Your Uploaded Resumes ({resumes.length})
            </h3>

            {resumes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                No resumes uploaded yet. Click the upload zone above to attach your resume file!
              </div>
            ) : (
              <div className="portfolio-resume-list">
                {resumes.map((res) => (
                  <div key={res.id} className="portfolio-resume-card">
                    <div className="portfolio-resume-meta">
                      <div className="portfolio-resume-icon">
                        <FileText size={22} />
                      </div>
                      <div>
                        <h4 className="portfolio-resume-filename">{res.fileName || 'Resume Document.pdf'}</h4>
                        <span className="portfolio-resume-size">
                          {res.fileSize ? `${(res.fileSize / 1024).toFixed(1)} KB` : 'PDF Document'}
                          {res.active ? ' • Active Primary' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="portfolio-resume-actions">
                      <button
                        onClick={() => handleDownloadResume(res.id, res.fileName)}
                        className="portfolio-resume-btn download"
                      >
                        <Download size={13} /> Download
                      </button>
                      <button
                        onClick={() => handleDeleteResume(res.id)}
                        className="portfolio-resume-btn delete"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODAL 1: ADD / EDIT PROJECT ── */}
        {showProjectModal && (
          <div className="portfolio-modal-overlay">
            <div className="portfolio-modal-content">
              <div className="portfolio-modal-header">
                <h3 className="portfolio-modal-title">
                  {editingProjectId ? 'Edit Project Showcase' : 'Add New Project Showcase'}
                </h3>
                <button onClick={() => setShowProjectModal(false)} className="portfolio-modal-close-btn">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="portfolio-form">
                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Project Title *</label>
                  <input
                    type="text"
                    className="portfolio-input"
                    required
                    placeholder="e.g. Distributed Event Streaming Platform"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                  />
                </div>

                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Category</label>
                    <select
                      className="portfolio-select"
                      value={projectCategory}
                      onChange={(e) => setProjectCategory(e.target.value)}
                    >
                      <option value="WEB">Web Application</option>
                      <option value="MOBILE">Mobile App</option>
                      <option value="AI_ML">AI / Machine Learning</option>
                      <option value="CLOUD_DEVOPS">Cloud / DevOps</option>
                      <option value="SYSTEM">System Architecture</option>
                      <option value="DESIGN">UI/UX Design</option>
                    </select>
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Thumbnail URL (Optional)</label>
                    <input
                      type="url"
                      className="portfolio-input"
                      placeholder="https://images.unsplash.com/..."
                      value={projectThumb}
                      onChange={(e) => setProjectThumb(e.target.value)}
                    />
                  </div>
                </div>

                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Description & Architecture *</label>
                  <textarea
                    className="portfolio-textarea"
                    required
                    placeholder="Describe your tech stack, system architecture, key challenges solved, and performance results..."
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                  />
                </div>

                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Live Demo URL</label>
                    <input
                      type="url"
                      className="portfolio-input"
                      placeholder="https://my-app-demo.com"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">GitHub Repository URL</label>
                    <input
                      type="url"
                      className="portfolio-input"
                      placeholder="https://github.com/my-profile/repo"
                      value={projectGithub}
                      onChange={(e) => setProjectGithub(e.target.value)}
                    />
                  </div>
                </div>

                <div className="portfolio-modal-actions">
                  <button type="button" onClick={() => setShowProjectModal(false)} className="portfolio-modal-cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="portfolio-modal-submit-btn" disabled={savingProject}>
                    {savingProject ? 'Saving...' : editingProjectId ? 'Update Project' : 'Save Project Permanently 🚀'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 2: CUSTOM SKILL ── */}
        {showSkillModal && (
          <div className="portfolio-modal-overlay">
            <div className="portfolio-modal-content">
              <div className="portfolio-modal-header">
                <h3 className="portfolio-modal-title">Add Custom Skill</h3>
                <button onClick={() => setShowSkillModal(false)} className="portfolio-modal-close-btn">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCustomSkillSubmit} className="portfolio-form">
                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Skill / Technology Name *</label>
                  <input
                    type="text"
                    className="portfolio-input"
                    required
                    placeholder="e.g. Apache Kafka, Rust, Terraform, Solidity"
                    value={skillNameInput}
                    onChange={(e) => setSkillNameInput(e.target.value)}
                  />
                </div>

                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Proficiency Level</label>
                    <select
                      className="portfolio-select"
                      value={skillProficiency}
                      onChange={(e) => setSkillProficiency(e.target.value as any)}
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Years of Experience</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      className="portfolio-input"
                      value={skillYears}
                      onChange={(e) => setSkillYears(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="portfolio-modal-actions">
                  <button type="button" onClick={() => setShowSkillModal(false)} className="portfolio-modal-cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="portfolio-modal-submit-btn" disabled={savingSkill}>
                    {savingSkill ? 'Saving...' : 'Add Skill ⚡'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 3: WORK EXPERIENCE ── */}
        {showExpModal && (
          <div className="portfolio-modal-overlay">
            <div className="portfolio-modal-content">
              <div className="portfolio-modal-header">
                <h3 className="portfolio-modal-title">Add Work Experience</h3>
                <button onClick={() => setShowExpModal(false)} className="portfolio-modal-close-btn">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddExperienceSubmit} className="portfolio-form">
                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Company Name *</label>
                    <input
                      type="text"
                      className="portfolio-input"
                      required
                      placeholder="e.g. Google, Stripe, Microsoft"
                      value={expCompany}
                      onChange={(e) => setExpCompany(e.target.value)}
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Job Title *</label>
                    <input
                      type="text"
                      className="portfolio-input"
                      required
                      placeholder="e.g. Senior Backend Engineer"
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Location (Optional)</label>
                  <input
                    type="text"
                    className="portfolio-input"
                    placeholder="e.g. San Francisco, CA or Remote"
                    value={expLocation}
                    onChange={(e) => setExpLocation(e.target.value)}
                  />
                </div>

                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Start Date</label>
                    <input
                      type="date"
                      className="portfolio-input"
                      value={expStartDate}
                      onChange={(e) => setExpStartDate(e.target.value)}
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">End Date</label>
                    <input
                      type="date"
                      className="portfolio-input"
                      disabled={expCurrent}
                      value={expEndDate}
                      onChange={(e) => setExpEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                  <input
                    type="checkbox"
                    id="currentExpCheck"
                    checked={expCurrent}
                    onChange={(e) => setExpCurrent(e.target.checked)}
                  />
                  <label htmlFor="currentExpCheck" style={{ fontSize: 13, color: '#CBD5E1', cursor: 'pointer' }}>
                    I am currently working here (Current Company)
                  </label>
                </div>

                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Key Responsibilities & Tech Stack</label>
                  <textarea
                    className="portfolio-textarea"
                    placeholder="Describe your role, projects delivered, systems designed, and technical technologies used..."
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                  />
                </div>

                <div className="portfolio-modal-actions">
                  <button type="button" onClick={() => setShowExpModal(false)} className="portfolio-modal-cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="portfolio-modal-submit-btn" disabled={savingExp}>
                    {savingExp ? 'Saving...' : 'Save Experience 🏢'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL 4: EDIT PROFILE DETAILS ── */}
        {showProfileModal && (
          <div className="portfolio-modal-overlay">
            <div className="portfolio-modal-content">
              <div className="portfolio-modal-header">
                <h3 className="portfolio-modal-title">Edit Candidate Profile</h3>
                <button onClick={() => setShowProfileModal(false)} className="portfolio-modal-close-btn">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="portfolio-form">
                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Current Job Title</label>
                    <input
                      type="text"
                      className="portfolio-input"
                      placeholder="e.g. Lead Software Architect"
                      value={editCurrentTitle}
                      onChange={(e) => setEditCurrentTitle(e.target.value)}
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Current Company</label>
                    <input
                      type="text"
                      className="portfolio-input"
                      placeholder="e.g. Tech Corp"
                      value={editCurrentCompany}
                      onChange={(e) => setEditCurrentCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Location</label>
                    <input
                      type="text"
                      className="portfolio-input"
                      placeholder="e.g. Seattle, WA / Remote"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Total Years Experience</label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      className="portfolio-input"
                      value={editYearsExp}
                      onChange={(e) => setEditYearsExp(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Headline / Professional Summary</label>
                  <input
                    type="text"
                    className="portfolio-input"
                    placeholder="e.g. Senior Backend Engineer specializing in high-throughput distributed systems"
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                  />
                </div>

                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">GitHub Profile URL</label>
                    <input
                      type="url"
                      className="portfolio-input"
                      placeholder="https://github.com/my-profile"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="portfolio-input"
                      placeholder="https://linkedin.com/in/my-profile"
                      value={editLinkedin}
                      onChange={(e) => setEditLinkedin(e.target.value)}
                    />
                  </div>
                </div>

                <div className="portfolio-modal-actions">
                  <button type="button" onClick={() => setShowProfileModal(false)} className="portfolio-modal-cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="portfolio-modal-submit-btn" disabled={savingProfile}>
                    {savingProfile ? 'Updating...' : 'Save Profile Changes ✨'}
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

export default PortfolioBuilder;
