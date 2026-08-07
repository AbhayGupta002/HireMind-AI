import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface RecommendationItem {
  id: number;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  locationScore: number;
  job: {
    id: number;
    title: string;
    company: { name: string };
    location: string;
  };
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
}

export const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recommendations/jobs?page=0&size=10');
      setRecommendations(res.data.content || []);
    } catch (e) {
      // Mock Fallback AI Matches
      setRecommendations([
        {
          id: 1,
          overallScore: 89.5,
          skillScore: 92.0,
          experienceScore: 85.0,
          locationScore: 90.0,
          job: {
            id: 10,
            title: 'Senior Microservices Architect',
            company: { name: 'CloudScale Inc.' },
            location: 'San Francisco, CA (Remote)'
          },
          matchingSkills: ['Java', 'Spring Boot', 'Docker', 'Kubernetes'],
          missingSkills: ['GraphQL'],
          strengths: ['Strong match on required backend Java skills', 'Relevant 3+ years experience'],
          improvements: ['Consider taking a quick tutorial on GraphQL schemas']
        },
        {
          id: 2,
          overallScore: 82.0,
          skillScore: 80.0,
          experienceScore: 85.0,
          locationScore: 81.0,
          job: {
            id: 11,
            title: 'Full Stack Engineer (React + Node)',
            company: { name: 'NextGen Digital' },
            location: 'Austin, TX'
          },
          matchingSkills: ['JavaScript', 'TypeScript', 'React', 'REST APIs'],
          missingSkills: ['Next.js'],
          strengths: ['Strong frontend component architecture experience'],
          improvements: ['Add a Next.js sample project to your portfolio']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div className="badge badge-cyan" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} /> AI Recommendation Engine 2.0
        </div>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Personalized AI Job Matches</h2>
        <p style={{ color: 'var(--text-muted)' }}>Weighted RAG matching calculated from your active resume and skills matrix</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Computing AI matches...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {recommendations.map(rec => (
            <div key={rec.id} className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>{rec.job.title}</h3>
                  <div style={{ fontSize: '14px', color: 'var(--primary-cyan)' }}>{rec.job.company.name} · {rec.job.location}</div>
                </div>

                {/* Score Gauge */}
                <div style={{
                  padding: '12px 24px',
                  borderRadius: '16px',
                  background: 'var(--gradient-brand)',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFF' }}>{rec.overallScore.toFixed(0)}%</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '0.05em' }}>MATCH SCORE</div>
                </div>
              </div>

              {/* Score Meters Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Skills Fit: {rec.skillScore}%</div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${rec.skillScore}%`, height: '100%', background: 'var(--primary-cyan)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Experience Fit: {rec.experienceScore}%</div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${rec.experienceScore}%`, height: '100%', background: 'var(--primary-indigo)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Location/Remote Fit: {rec.locationScore}%</div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${rec.locationScore}%`, height: '100%', background: 'var(--primary-violet)' }} />
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--accent-emerald)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Key Matching Strengths
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rec.strengths?.map((str, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }} /> {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--accent-amber)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} /> Skill Growth Recommendations
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rec.improvements?.map((imp, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-amber)' }} /> {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
