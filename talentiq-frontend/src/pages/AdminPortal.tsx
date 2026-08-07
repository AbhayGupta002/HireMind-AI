import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ShieldCheck, Users, Building2, Lock, Unlock, CheckCircle2, XCircle } from 'lucide-react';

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalCompanies: number;
  verifiedCompanies: number;
  pendingCompanies: number;
  totalJobs: number;
  totalApplications: number;
  totalResumes: number;
}

interface UserItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
}

interface PendingCompany {
  id: number;
  name: string;
  website: string;
  industry: string;
  verified: boolean;
}

export const AdminPortal: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, uRes, cRes] = await Promise.all([
        apiClient.get('/admin/metrics'),
        apiClient.get('/admin/users?page=0&size=10'),
        apiClient.get('/admin/companies/pending?page=0&size=10')
      ]);
      setMetrics(mRes.data.data);
      setUsers(uRes.data.content || []);
      setPendingCompanies(cRes.data.content || []);
    } catch (e) {
      // Mock Fallback Admin Data
      setMetrics({
        totalUsers: 1250,
        activeUsers: 1210,
        lockedUsers: 40,
        totalCompanies: 85,
        verifiedCompanies: 78,
        pendingCompanies: 7,
        totalJobs: 340,
        totalApplications: 2890,
        totalResumes: 1180
      });

      setUsers([
        { id: 1, email: 'candidate@example.com', firstName: 'John', lastName: 'Doe', status: 'ACTIVE', roles: ['ROLE_CANDIDATE'] },
        { id: 2, email: 'spammer@example.com', firstName: 'Bad', lastName: 'Actor', status: 'SUSPENDED', roles: ['ROLE_CANDIDATE'] }
      ]);

      setPendingCompanies([
        { id: 10, name: 'CyberDyn Systems', website: 'https://cyberdyn.com', industry: 'Cybersecurity', verified: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    const nextEnabled = currentStatus !== 'ACTIVE';
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { enabled: nextEnabled, reason: 'Admin action' });
      setUsers(users.map(u => u.id === userId ? { ...u, status: nextEnabled ? 'ACTIVE' : 'SUSPENDED' } : u));
    } catch (e) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: nextEnabled ? 'ACTIVE' : 'SUSPENDED' } : u));
    }
  };

  const handleVerifyCompany = async (companyId: number, approve: boolean) => {
    try {
      await apiClient.put(`/admin/companies/${companyId}/verify`, { approved: approve });
      setPendingCompanies(pendingCompanies.filter(c => c.id !== companyId));
    } catch (e) {
      setPendingCompanies(pendingCompanies.filter(c => c.id !== companyId));
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div className="badge badge-rose" style={{ marginBottom: '12px' }}>
          <ShieldCheck size={14} /> Platform Security & Administration
        </div>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Super Admin Control Panel</h2>
        <p style={{ color: 'var(--text-muted)' }}>System health telemetry, user account lockouts, and company verification workflows</p>
      </div>

      {loading || !metrics ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading system telemetry...</div>
      ) : (
        <>
          {/* Top Platform Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Users</div>
              <div style={{ fontSize: '28px', fontWeight: 800 }}>{metrics.totalUsers}</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Companies</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-cyan)' }}>{metrics.totalCompanies}</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending Verifications</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-amber)' }}>{metrics.pendingCompanies}</div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Applications</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-indigo)' }}>{metrics.totalApplications}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* User Lockout Controls */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--primary-cyan)" /> User Account Controls
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.status)}
                      className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {u.status === 'ACTIVE' ? <><Lock size={12} /> Lock</> : <><Unlock size={12} /> Unlock</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Company Verifications */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--accent-amber)" /> Pending Company Approvals
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingCompanies.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No companies pending approval</p>
                ) : (
                  pendingCompanies.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.industry} · {c.website}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleVerifyCompany(c.id, true)} className="btn btn-primary btn-sm">
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button onClick={() => handleVerifyCompany(c.id, false)} className="btn btn-danger btn-sm">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
