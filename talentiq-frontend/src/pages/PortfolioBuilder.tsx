import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, ExternalLink, GitBranch, Eye, ThumbsUp, Trash2, Edit3, X, FolderGit2, AlertCircle } from 'lucide-react';
import '../css/portfolio-builder.css';

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

export const PortfolioBuilder: React.FC = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('WEB');
  const [projectUrl, setProjectUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMyPortfolios();
  }, [user]);

  // ── Fetch Only the Logged-in Candidate's Own Projects ──────
  const fetchMyPortfolios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/portfolios/my');
      const items = res.data?.content || res.data?.data?.content || res.data?.data || [];
      setPortfolios(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.warn('Failed to load portfolio items from backend:', err);
      // If user has no portfolio items or is new, start with empty list (never show other users' projects)
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Open Modal for Create or Edit ──
  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('WEB');
    setProjectUrl('');
    setGithubUrl('');
    setThumbnailUrl('');
    setShowModal(true);
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setCategory(item.category || 'WEB');
    setProjectUrl(item.projectUrl || '');
    setGithubUrl(item.githubUrl || '');
    setThumbnailUrl(item.thumbnailUrl || '');
    setShowModal(true);
  };

  // ── Create or Update Project (Permanently in Database) ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        projectUrl: projectUrl.trim(),
        githubUrl: githubUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        featured: false,
      };

      if (editingId) {
        // Update existing project
        const res = await apiClient.put(`/portfolios/${editingId}`, payload);
        const updated = res.data?.data || res.data;
        setPortfolios((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p))
        );
      } else {
        // Create new project permanently in database
        const res = await apiClient.post('/portfolios', payload);
        const created = res.data?.data || res.data;
        if (created && created.id) {
          setPortfolios((prev) => [created, ...prev]);
        } else {
          // Re-fetch from database to ensure fresh state
          await fetchMyPortfolios();
        }
      }

      setShowModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save portfolio project.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Project (Permanently from Database) ──
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project? This will permanently remove it from your portfolio.')) {
      return;
    }

    try {
      await apiClient.delete(`/portfolios/${id}`);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete portfolio project.');
    }
  };

  // Helper for category styling
  const getCategoryClass = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'WEB':
        return 'category-web';
      case 'MOBILE':
        return 'category-mobile';
      case 'AI_ML':
        return 'category-ai_ml';
      case 'SYSTEM':
        return 'category-system';
      case 'CLOUD':
      case 'CLOUD_DEVOPS':
        return 'category-cloud';
      case 'DESIGN':
        return 'category-design';
      default:
        return 'category-web';
    }
  };

  return (
    <div className="portfolio-page-wrapper">
      <div className="portfolio-container">
        {/* Header */}
        <div className="portfolio-header">
          <div className="portfolio-title-group">
            <h1 className="portfolio-title">
              Project Portfolio Showcase
              <span className="portfolio-title-badge">
                {portfolios.length} {portfolios.length === 1 ? 'Project' : 'Projects'}
              </span>
            </h1>
            <p className="portfolio-subtitle">
              Showcase your technical projects, live applications, and GitHub repositories to recruiters
            </p>
          </div>

          <button onClick={openCreateModal} className="portfolio-add-btn">
            <Plus size={18} /> Add Project
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12, color: '#FCA5A5', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── Content Grid or Empty State ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: 15 }}>
            Loading your portfolio projects...
          </div>
        ) : portfolios.length === 0 ? (
          /* Empty State when candidate has 0 projects */
          <div className="portfolio-empty-state">
            <div className="portfolio-empty-icon">
              <FolderGit2 size={36} />
            </div>
            <h3 className="portfolio-empty-title">No Projects in Your Portfolio Yet</h3>
            <p className="portfolio-empty-desc">
              Your portfolio is currently empty. Add your web apps, mobile projects, AI experiments, or repositories to stand out to hiring recruiters.
            </p>
            <button onClick={openCreateModal} className="portfolio-add-btn">
              <Plus size={18} /> Add Your First Project
            </button>
          </div>
        ) : (
          /* Real Candidate Portfolio Projects Grid */
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
                        onClick={() => openEditModal(item)}
                        className="portfolio-action-icon-btn"
                        title="Edit Project"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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

        {/* ── Add / Edit Project Modal ── */}
        {showModal && (
          <div className="portfolio-modal-overlay">
            <div className="portfolio-modal-content">
              <div className="portfolio-modal-header">
                <h3 className="portfolio-modal-title">
                  {editingId ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="portfolio-modal-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="portfolio-form">
                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Project Title *</label>
                  <input
                    type="text"
                    className="portfolio-input"
                    required
                    placeholder="e.g. Distributed Event Streaming Platform"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="portfolio-grid-2col">
                  <div className="portfolio-form-group">
                    <label className="portfolio-field-label">Category</label>
                    <select
                      className="portfolio-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
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
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="portfolio-form-group">
                  <label className="portfolio-field-label">Description & Architecture *</label>
                  <textarea
                    className="portfolio-textarea"
                    required
                    placeholder="Describe your tech stack, system architecture, key challenges solved, and performance results..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="portfolio-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="portfolio-modal-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="portfolio-modal-submit-btn"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving to Database...'
                      : editingId
                      ? 'Update Project'
                      : 'Create Project Permanently 🚀'}
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
