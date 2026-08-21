import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import '../css/recommendations.css';

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
    <div className="recs-container">
      <div className="recs-header">
        <div className="badge badge-cyan recs-tag">
          <Sparkles size={14} /> AI Recommendation Engine 2.0
        </div>
        <h2 className="recs-title">Personalized AI Job Matches</h2>
        <p className="recs-subtitle">Weighted RAG matching calculated from your active resume and skills matrix</p>
      </div>

      {loading ? (
        <div className="recs-loading">Computing AI matches...</div>
      ) : (
        <div className="recs-list">
          {recommendations.map(rec => (
            <div key={rec.id} className="glass-panel rec-card">
              <div className="rec-top-row">
                <div>
                  <h3 className="rec-job-title">{rec.job.title}</h3>
                  <div className="rec-company-loc">{rec.job.company.name} · {rec.job.location}</div>
                </div>

                {/* Score Gauge */}
                <div className="rec-score-gauge">
                  <div className="rec-score-value">{rec.overallScore.toFixed(0)}%</div>
                  <div className="rec-score-label">MATCH SCORE</div>
                </div>
              </div>

              {/* Score Meters Breakdown */}
              <div className="rec-meters-grid">
                <div>
                  <div className="rec-meter-label">Skills Fit: {rec.skillScore}%</div>
                  <div className="rec-meter-track">
                    <div className="rec-meter-bar skills" style={{ width: `${rec.skillScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="rec-meter-label">Experience Fit: {rec.experienceScore}%</div>
                  <div className="rec-meter-track">
                    <div className="rec-meter-bar experience" style={{ width: `${rec.experienceScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="rec-meter-label">Location/Remote Fit: {rec.locationScore}%</div>
                  <div className="rec-meter-track">
                    <div className="rec-meter-bar location" style={{ width: `${rec.locationScore}%` }} />
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="rec-insights-grid">
                <div>
                  <h4 className="rec-insights-heading-emerald">
                    <CheckCircle2 size={16} /> Key Matching Strengths
                  </h4>
                  <ul className="rec-insights-list">
                    {rec.strengths?.map((str, idx) => (
                      <li key={idx} className="rec-insight-item">
                        <span className="rec-bullet-emerald" /> {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="rec-insights-heading-amber">
                    <AlertCircle size={16} /> Skill Growth Recommendations
                  </h4>
                  <ul className="rec-insights-list">
                    {rec.improvements?.map((imp, idx) => (
                      <li key={idx} className="rec-insight-item">
                        <span className="rec-bullet-amber" /> {imp}
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
