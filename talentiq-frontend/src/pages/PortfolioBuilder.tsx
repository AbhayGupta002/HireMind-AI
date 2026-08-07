import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Plus, ExternalLink, GitBranch, Eye, ThumbsUp } from 'lucide-react';

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
    <div style={{ maxWidth: '1140px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Project Portfolio Showcase</h2>
          <p style={{ color: 'var(--text-muted)' }}>Demonstrate your technical projects, live demos, and GitHub repositories</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Add Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {portfolios.map(item => (
          <div key={item.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-indigo">{item.category}</span>
                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {item.viewsCount}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> {item.likesCount}</span>
                </div>
              </div>

              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#FFF' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                {item.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              {item.projectUrl && (
                <a href={item.projectUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <ExternalLink size={14} /> Live Demo
                </a>
              )}
              {item.githubUrl && (
                <a href={item.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <GitBranch size={14} /> GitHub Code
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(9, 13, 22, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', background: 'var(--bg-glass-heavy)' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '20px' }}>Add Portfolio Showcase Project</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Project Title</label>
                <input type="text" className="input-field" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Category</label>
                <select className="input-field" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option value="WEB">Web Development</option>
                  <option value="AI_ML">AI & Machine Learning</option>
                  <option value="SYSTEM">Distributed Systems & Backend</option>
                  <option value="MOBILE">Mobile Applications</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Description</label>
                <textarea className="input-field" rows={3} required value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Project URL / Demo</label>
                <input type="url" className="input-field" value={newProjectUrl} onChange={(e) => setNewProjectUrl(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>GitHub Repo URL</label>
                <input type="url" className="input-field" value={newGithubUrl} onChange={(e) => setNewGithubUrl(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
