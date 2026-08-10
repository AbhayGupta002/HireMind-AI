import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  LayoutDashboard, MessageSquare, Calendar, Briefcase,
  Users, TrendingUp, Bell, Settings, Search,
  LogOut, RefreshCw, ChevronRight, Bot, Star
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { Client as StompClient } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/* ─── Types ─── */
interface MonthlyStats {
  month: string;
  applications: number;
  shortlisted: number;
  rejected: number;
}

interface HrDashboard {
  companyName: string;
  activeJobsCount: number;
  totalApplicationsCount: number;
  shortlistedCount: number;
  hiredCandidatesCount: number;
  conversionRate: number;
  avgTimeToHireDays: number;
  applicationsByStatus: Record<string, number>;
  monthlyStats: MonthlyStats[];
}

interface ApplicationItem {
  id: number;
  candidate: { user: { firstName: string; lastName: string; email: string } };
  job: { title: string };
  status: string;
  appliedAt: string;
}

interface InterviewSlot {
  id: number;
  candidateName: string;
  jobTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
}

/* ─── Status badge colors ─── */
const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#3B82F6', SCREENING: '#F59E0B', SHORTLISTED: '#8B5CF6',
  INTERVIEWING: '#06B6D4', OFFERED: '#10B981', HIRED: '#22C55E',
  REJECTED: '#EF4444', WITHDRAWN: '#6B7280',
};

/* ─── Sidebar NavItem ─── */
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> =
  ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      width: '100%', padding: '11px 16px', borderRadius: '10px', border: 'none',
      cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400,
      background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
      color: active ? '#fff' : '#94a3b8', transition: 'all 0.2s', textAlign: 'left',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {icon}{label}
    </button>
  );

/* ─── Stat Card ─── */
const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }> =
  ({ label, value, icon, color, sub }) => (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)', padding: '24px',
      display: 'flex', alignItems: 'center', gap: '18px',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      <div style={{ width: 52, height: 52, borderRadius: '14px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );

/* ─── Main Dashboard ─── */
const HrAnalytics: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<HrDashboard | null>(null);
  const [recentApps, setRecentApps] = useState<ApplicationItem[]>([]);
  const [calendar, setCalendar] = useState<InterviewSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeNav, setActiveNav] = useState('Dashboard');
  const stompRef = useRef<StompClient | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, appsRes, calRes] = await Promise.all([
        apiClient.get('/v1/analytics/hr'),
        apiClient.get('/v1/applications/hr?size=5&sort=appliedAt,desc').catch(() => ({ data: { data: { content: [] } } })),
        apiClient.get('/v1/interviews/calendar').catch(() => ({ data: { data: [] } })),
      ]);
      setDashboard(analyticsRes.data.data);
      setRecentApps(appsRes.data?.data?.content || []);
      setCalendar(calRes.data?.data || []);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // WebSocket for real-time KPI refresh on new notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new StompClient({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', () => {
          fetchDashboard(); // Refresh on any notification
        });
      },
      onStompError: () => {},
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const chartData = (dashboard?.monthlyStats || []).map(m => ({
    name: m.month.split(' ')[0], // "Jan 2026" → "Jan"
    Applications: m.applications,
    Shortlisted: m.shortlisted,
    Rejected: m.rejected,
  }));

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };
  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return ''; }
  };
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 16px',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HireMind AI</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '1.2px', padding: '0 8px 8px', textTransform: 'uppercase' }}>Main Menu</div>
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeNav === 'Dashboard'} onClick={() => setActiveNav('Dashboard')} />
          <NavItem icon={<MessageSquare size={18} />} label="Messages" active={activeNav === 'Messages'} onClick={() => { setActiveNav('Messages'); navigate('/hr-messages'); }} />
          <NavItem icon={<Calendar size={18} />} label="Calendar" active={activeNav === 'Calendar'} onClick={() => { setActiveNav('Calendar'); navigate('/hr-calendar'); }} />
          <NavItem icon={<Users size={18} />} label="Applications" active={activeNav === 'Applications'} onClick={() => navigate('/hr-applications')} />
          <NavItem icon={<Briefcase size={18} />} label="Jobs" active={activeNav === 'Jobs'} onClick={() => navigate('/jobs')} />
          <NavItem icon={<Bot size={18} />} label="AI Copilot" active={activeNav === 'Copilot'} onClick={() => navigate('/hr-copilot')} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
          <NavItem icon={<Settings size={18} />} label="Settings" onClick={() => {}} />
          <NavItem icon={<LogOut size={18} />} label="Sign Out" onClick={handleLogout} />
        </nav>

        {/* User profile */}
        <div style={{ padding: '16px', background: 'rgba(99,102,241,0.1)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{user?.name || 'HR Manager'}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{user?.email || ''}</div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>
              {dashboard ? `${dashboard.companyName} Dashboard` : 'HR Dashboard'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={fetchDashboard} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 8, color: '#818cf8', fontSize: 13, cursor: 'pointer'
            }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>
              <Bell size={18} color="#94a3b8" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, color: '#fca5a5' }}>
            ⚠️ {error} — showing cached data if available.
          </div>
        )}

        {/* ── KPI Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard label="Total Applications" value={dashboard?.totalApplicationsCount ?? '—'} icon={<Users size={22} />} color="#6366f1" sub="All time" />
          <StatCard label="Active Jobs" value={dashboard?.activeJobsCount ?? '—'} icon={<Briefcase size={22} />} color="#10b981" sub="Currently open" />
          <StatCard label="Shortlisted" value={dashboard?.shortlistedCount ?? '—'} icon={<Star size={22} />} color="#f59e0b" sub="Candidates" />
          <StatCard label="Conversion Rate" value={dashboard ? `${dashboard.conversionRate}%` : '—'} icon={<TrendingUp size={22} />} color="#06b6d4" sub="Applications → Offer" />
        </div>

        {/* ── Chart + Calendar Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>

          {/* Bar Chart */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Applications Overview</h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>Last 6 months</span>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                    cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Bar dataKey="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Shortlisted" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                {loading ? 'Loading chart data...' : 'No data yet — start receiving applications!'}
              </div>
            )}
          </div>

          {/* Upcoming Interviews */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Upcoming Interviews</h2>
              <button onClick={() => navigate('/hr-calendar')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} style={{ height: 60, background: 'rgba(255,255,255,0.03)', borderRadius: 10, animation: 'pulse 2s infinite' }} />
                ))
              ) : calendar.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
                  <Calendar size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>No upcoming interviews</div>
                  <button onClick={() => navigate('/hr-calendar')} style={{ marginTop: 12, padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                    Schedule Interview
                  </button>
                </div>
              ) : (
                calendar.slice(0, 4).map(slot => {
                  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4'];
                  const color = COLORS[slot.id % COLORS.length];
                  return (
                    <div key={slot.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                      borderLeft: `3px solid ${color}`
                    }}>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>{formatDate(slot.scheduledAt).split(' ')[0]}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{formatDate(slot.scheduledAt).split(' ')[1]}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.candidateName}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{slot.jobTitle} · {formatTime(slot.scheduledAt)}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `${color}22`, color }}>{slot.status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Activity Feed + Status Distribution Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

          {/* Activity Feed */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent Applications</h2>
              <button onClick={() => navigate('/hr-applications')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ height: 56, background: 'rgba(255,255,255,0.02)', borderRadius: 8, margin: '4px 0' }} />
                ))
              ) : recentApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
                  <Users size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>No applications yet</div>
                </div>
              ) : (
                recentApps.map(app => {
                  const name = `${app.candidate?.user?.firstName || 'Candidate'} ${app.candidate?.user?.lastName || ''}`.trim();
                  const statusColor = STATUS_COLORS[app.status] || '#6366f1';
                  return (
                    <div key={app.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: `${statusColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700, color: statusColor
                      }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Applied for <strong style={{ color: '#94a3b8' }}>{app.job?.title}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${statusColor}22`, color: statusColor, fontWeight: 600 }}>
                          {app.status}
                        </span>
                        <span style={{ fontSize: 10, color: '#475569' }}>{timeAgo(app.appliedAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Application Status Distribution */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Status Breakdown</h2>
            {dashboard?.applicationsByStatus && Object.keys(dashboard.applicationsByStatus).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(dashboard.applicationsByStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const total = dashboard.totalApplicationsCount || 1;
                    const pct = Math.round((count / total) * 100);
                    const color = STATUS_COLORS[status] || '#6366f1';
                    return (
                      <div key={status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{status}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: 13 }}>
                {loading ? 'Loading...' : 'No status data available'}
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>Quick Actions</div>
              <button onClick={() => navigate('/hr-messages')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#818cf8', fontSize: 12, cursor: 'pointer' }}>
                <MessageSquare size={14} /> Message Candidates
              </button>
              <button onClick={() => navigate('/hr-calendar')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#34d399', fontSize: 12, cursor: 'pointer' }}>
                <Calendar size={14} /> Schedule Interview
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default HrAnalytics;
