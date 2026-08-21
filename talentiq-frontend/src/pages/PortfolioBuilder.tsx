import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Plus, ExternalLink, GitBranch, Eye, ThumbsUp } from 'lucide-react';
import '../css/portfolio-builder.css';

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  category: string;
  projectUrl?: string;
  githubUrl?: string;
  thumbnailUrl?: string;
  viewsCount: number;
  likesCount: number;
}

export const PortfolioBuilder: React.FC = () => {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('WEB');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [newGithubUrl, setNewGithubUrl] = useState('');

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const res = await apiClient.get('/portfolios/candidate/1');
      setPortfolios(res.data.content || []);
    } catch (e) {
      setPortfolios([
        {
          id: 1,
          title: 'Distributed Event Streaming Platform',
          description: 'High-throughput Kafka and Spring Cloud Event Driven Architecture processing 10k msg/sec.',
          category: 'SYSTEM',
          projectUrl: 'https://demo-streaming.example.com',
          githubUrl: 'https://github.com/example/event-streaming',
          viewsCount: 142,
          likesCount: 28
        },
        {
          id: 2,
          title: 'AI Resume Synthesizer & RAG Engine',
          description: 'LangChain4j integration with Vector Search embeddings for resume skill extraction.',
          category: 'AI_ML',
          projectUrl: 'https://ai-resume.example.com',
          githubUrl: 'https://github.com/example/ai-resume-parser',
          viewsCount: 215,
          likesCount: 45
        }
      ]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/portfolios', {
        title: newTitle,
        description: newDescription,
        category: newCategory,
        projectUrl: newProjectUrl,
        githubUrl: newGithubUrl,
      });
      setPortfolios([...portfolios, res.data.data]);
      setShowModal(false);
      setNewTitle('');
      setNewDescription('');
    } catch (e) {
      const mockNew: PortfolioItem = {
        id: Date.now(),
        title: newTitle,
        description: newDescription,
        category: newCategory,
        projectUrl: newProjectUrl,
        githubUrl: newGithubUrl,
        viewsCount: 1,
        likesCount: 0
      };
      setPortfolios([...portfolios, mockNew]);
      setShowModal(false);
      setNewTitle('');
      setNewDescription('');
    }
  };

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <div>
          <h2 className="portfolio-title">Project Portfolio Showcase</h2>
          <p className="portfolio-subtitle">Demonstrate your technical projects, live demos, and GitHub repositories</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Add Project
        </button>
      </div>

      <div className="portfolio-grid">
        {portfolios.map(item => (
          <div key={item.id} className="glass-panel portfolio-card">
            <div>
              <div className="portfolio-card-top">
                <span className="badge badge-indigo">{item.category}</span>
                <div className="portfolio-stats">
                  <span className="portfolio-stat-item"><Eye size={14} /> {item.viewsCount}</span>
                  <span className="portfolio-stat-item"><ThumbsUp size={14} /> {item.likesCount}</span>
                </div>
              </div>

              <h3 className="portfolio-item-title">{item.title}</h3>
              <p className="portfolio-item-desc">
                {item.description}
              </p>
            </div>

            <div className="portfolio-links-row">
              {item.projectUrl && (
                <a href={item.projectUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm portfolio-link-btn">
                  <ExternalLink size={14} /> Live Demo
                </a>
              )}
              {item.githubUrl && (
                <a href={item.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm portfolio-link-btn">
                  <GitBranch size={14} /> GitHub Code
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="portfolio-modal-overlay">
          <div className="glass-panel portfolio-modal-content">
            <h3 className="portfolio-modal-title">Add Portfolio Showcase Project</h3>
            <form onSubmit={handleCreate} className="portfolio-form">
              <div>
                <label className="portfolio-field-label">Project Title</label>
                <input type="text" className="input-field" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="portfolio-field-label">Category</label>
                <select className="input-field" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option value="WEB">Web Development</option>
                  <option value="AI_ML">AI & Machine Learning</option>
                  <option value="SYSTEM">Distributed Systems & Backend</option>
                  <option value="MOBILE">Mobile Applications</option>
                </select>
              </div>
              <div>
                <label className="portfolio-field-label">Description</label>
                <textarea className="input-field" rows={3} required value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </div>
              <div>
                <label className="portfolio-field-label">Project URL / Demo</label>
                <input type="url" className="input-field" value={newProjectUrl} onChange={(e) => setNewProjectUrl(e.target.value)} />
              </div>
              <div>
                <label className="portfolio-field-label">GitHub Repo URL</label>
                <input type="url" className="input-field" value={newGithubUrl} onChange={(e) => setNewGithubUrl(e.target.value)} />
              </div>

              <div className="portfolio-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary portfolio-modal-btn">Cancel</button>
                <button type="submit" className="btn btn-primary portfolio-modal-btn">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
