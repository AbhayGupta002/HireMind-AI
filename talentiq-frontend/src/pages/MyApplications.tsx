import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Clock, CheckCircle2, XCircle, Calendar, Building } from 'lucide-react';

interface ApplicationItem {
  id: number;
  job: {
    title: string;
    company: { name: string };
    location: string;
  };
  status: 'APPLIED' | 'SCREENED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';
  aiMatchScore: number;
  appliedAt: string;
  interviewDate?: string;
  offerAmount?: number;
  offerCurrency?: string;
  rejectionReason?: string;
}

export const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applications/my?page=0&size=20');
      setApplications(res.data.content || []);
    } catch (e) {
      // Mock Fallback Applications
      setApplications([
        {
          id: 100,
          job: { title: 'Senior Java Backend Engineer', company: { name: 'TechCorp' }, location: 'Remote' },
          status: 'INTERVIEWING',
          aiMatchScore: 92.5,
          appliedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          interviewDate: new Date(Date.now() + 86400000 * 2).toISOString()
        },
        {
          id: 101,
          job: { title: 'Cloud Infrastructure Lead', company: { name: 'CloudScale' }, location: 'San Francisco, CA' },
          status: 'APPLIED',
          aiMatchScore: 88.0,
          appliedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OFFERED':
        return <span className="badge badge-emerald"><CheckCircle2 size={14} /> Offer Received</span>;
      case 'INTERVIEWING':
        return <span className="badge badge-cyan"><Clock size={14} /> Interviewing Stage</span>;
      case 'SCREENED':
        return <span className="badge badge-indigo">Screened</span>;
      case 'REJECTED':
        return <span className="badge badge-rose"><XCircle size={14} /> Rejected</span>;
      default:
        return <span className="badge badge-indigo">Application Submitted</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Application Tracking Dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>Real-time recruitment pipeline updates and status audit history</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading applications...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {applications.map(app => (
            <div key={app.id} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', color: '#FFF' }}>{app.job.title}</h3>
                  {getStatusBadge(app.status)}
                </div>

                <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={14} color="var(--primary-cyan)" /> {app.job.company.name}
                  </span>
                  <span>Applied on: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  {app.aiMatchScore && (
                    <span style={{ color: 'var(--primary-cyan)', fontWeight: 600 }}>
                      AI Match Score: {app.aiMatchScore}%
                    </span>
                  )}
                </div>

                {app.interviewDate && (
                  <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Interview Scheduled for: {new Date(app.interviewDate).toLocaleString()}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="btn btn-secondary btn-sm">View Timeline</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
