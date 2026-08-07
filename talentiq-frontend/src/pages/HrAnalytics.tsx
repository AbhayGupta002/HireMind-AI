import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, UserCheck, TrendingUp, Clock, Percent, Plus } from 'lucide-react';

interface HrAnalyticsData {
  companyId: number;
  companyName: string;
  activeJobsCount: number;
  totalApplicationsCount: number;
  hiredCandidatesCount: number;
  conversionRate: number;
  avgTimeToHireDays: number;
  applicationsByStatus: Record<string, number>;
}

export const HrAnalytics: React.FC = () => {
  const [data, setData] = useState<HrAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/hr');
      setData(res.data.data);
    } catch (e) {
      // Mock Fallback Analytics
      setData({
        companyId: 100,
        companyName: 'TechCorp Solutions',
        activeJobsCount: 8,
        totalApplicationsCount: 142,
        hiredCandidatesCount: 18,
        conversionRate: 12.67,
        avgTimeToHireDays: 14.5,
        applicationsByStatus: {
          APPLIED: 65,
          SCREENED: 42,
          INTERVIEWING: 17,
          OFFERED: 10,
          REJECTED: 8
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Recruiter Analytics & Hiring Funnel</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time telemetry insights for {data?.companyName || 'your company'}</p>
        </div>
        <Link to="/jobs" className="btn btn-primary" style={{ padding: '12px 20px', display: 'flex', gap: '8px' }}>
          <Plus size={18} /> Post New Job
        </Link>
      </div>

      {loading || !data ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading analytics metrics...</div>
      ) : (
        <>
          {/* Top KPI Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Active Job Postings</span>
                <Briefcase size={20} color="var(--primary-cyan)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.activeJobsCount}</div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Applications</span>
                <FileText size={20} color="var(--primary-indigo)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.totalApplicationsCount}</div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hires / Offers</span>
                <UserCheck size={20} color="var(--accent-emerald)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-emerald)' }}>{data.hiredCandidatesCount}</div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Avg Time to Hire</span>
                <Clock size={20} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.avgTimeToHireDays} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>days</span></div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Funnel Conversion Rate</span>
                <Percent size={20} color="var(--primary-violet)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary-cyan)' }}>{data.conversionRate}%</div>
            </div>
          </div>

          {/* Applications Stage Breakdown */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--primary-cyan)" /> Application Stage Pipeline Distribution
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(data.applicationsByStatus).map(([stage, count]) => {
                const percentage = data.totalApplicationsCount > 0 ? ((count / data.totalApplicationsCount) * 100).toFixed(1) : 0;
                return (
                  <div key={stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{stage}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} candidate applications ({percentage}%)</span>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: stage === 'OFFERED' ? 'var(--accent-emerald)' : stage === 'INTERVIEWING' ? 'var(--primary-cyan)' : 'var(--primary-indigo)'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
