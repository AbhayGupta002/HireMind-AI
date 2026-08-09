import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Briefcase,
  Users,
  Star,
  Globe,
  UserCircle2,
  BarChart2,
  Settings,
  Search,
  Bell,
  TrendingUp,

  ChevronDown,
  Plus,
  MoreVertical,
  Bot
} from 'lucide-react';

/* ─── Types ─── */
interface AnalyticsData {
  companyName: string;
  activeJobsCount: number;
  totalApplicationsCount: number;
  hiredCandidatesCount: number;
  rejectedCount: number;
  conversionRate: number;
  avgTimeToHireDays: number;
  applicationsByStatus: Record<string, number>;
}

interface ActivityItem {
  id: number;
  avatar: string;
  name: string;
  action: string;
  job: string;
  time: string;
  tag: string;
  tagColor: string;
}

interface MeetingItem {
  id: number;
  day: string;
  date: number;
  title: string;
  time: string;
  color: string;
}

interface RecentJob {
  id: number;
  icon: string;
  iconBg: string;
  title: string;
  company: string;
  location: string;
  ago: string;
}

/* ─── Static Mock Data ─── */
const MONTHLY_STATS = [
  { month: 'Jan', apps: 72, shortlisted: 55, rejected: 40 },
  { month: 'Feb', apps: 90, shortlisted: 70, rejected: 55 },
  { month: 'Mar', apps: 65, shortlisted: 48, rejected: 30 },
  { month: 'Apr', apps: 82, shortlisted: 62, rejected: 45 },
  { month: 'May', apps: 94, shortlisted: 75, rejected: 60 },
  { month: 'Jun', apps: 78, shortlisted: 58, rejected: 42 },
  { month: 'Jul', apps: 88, shortlisted: 66, rejected: 50 },
  { month: 'Aug', apps: 96, shortlisted: 74, rejected: 58 },
  { month: 'Sep', apps: 85, shortlisted: 63, rejected: 48 },
  { month: 'Oct', apps: 76, shortlisted: 56, rejected: 38 },
  { month: 'Nov', apps: 92, shortlisted: 72, rejected: 55 },
  { month: 'Dec', apps: 70, shortlisted: 52, rejected: 36 },
];

const ACTIVITY_FEED: ActivityItem[] = [
  { id: 1, avatar: 'M', name: 'Marvin McKinney', action: 'applied for the job', job: 'Product Designer', time: '10 mins ago', tag: 'Applying', tagColor: '#3B82F6' },
  { id: 2, avatar: 'J', name: 'Jane Cooper', action: 'Created new Account as a', job: 'Job Hunt', time: '4 hours ago', tag: 'Sign Up', tagColor: '#10B981' },
  { id: 3, avatar: 'J', name: 'Jenny Wilson', action: 'applied for the job', job: 'Frontend Engineer', time: '10 mins ago', tag: 'Applying', tagColor: '#3B82F6' },
  { id: 4, avatar: 'A', name: 'Alex Johnson', action: 'status updated to', job: 'Senior Backend Dev — INTERVIEWING', time: '1 hour ago', tag: 'Interviewed', tagColor: '#F59E0B' },
];

const MEETINGS: MeetingItem[] = [
  { id: 1, day: 'Mon', date: 10, title: 'Interview', time: '9:00 am – 11:30 am', color: '#3B82F6' },
  { id: 2, day: 'Thu', date: 8, title: 'Organizational meeting', time: '9:11 am – 11:30 am', color: '#F59E0B' },
  { id: 3, day: 'Fri', date: 11, title: 'Meeting with the manager', time: '9:00 am – 11:30 am', color: '#10B981' },
];

const RECENT_JOBS: RecentJob[] = [
  { id: 1, icon: '🎨', iconBg: '#22C55E', title: 'Product Designer', company: 'Spotify', location: 'Singapore', ago: '6 hours ago' },
  { id: 2, icon: '📱', iconBg: '#007AFF', title: 'iOS Developer', company: 'Apple', location: 'San Francisco, CA', ago: '2 Days ago' },
  { id: 3, icon: 'B', iconBg: '#6366F1', title: 'Brand Strategist', company: 'Behance', location: 'New York, US', ago: '2 Days ago' },
  { id: 4, icon: 'F', iconBg: '#F97316', title: 'Jr. Frontend Engineer', company: 'Figma', location: 'Singapore', ago: '2 Days ago' },
];

/* ─── Sidebar Nav Item ─── */
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}
const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '10px 16px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 600 : 400,
      background: active ? '#2563EB' : 'transparent',
      color: active ? '#FFFFFF' : '#64748B',
      transition: 'all 0.2s',
      textAlign: 'left',
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
  >
    {icon}
    {label}
  </button>
);

/* ─── Circular Progress Ring ─── */
const RingChart: React.FC<{ pct: number; color: string }> = ({ pct, color }) => {
  const r = 28, circ = 2 * Math.PI * r;
  const filled = circ - (pct / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#E2E8F0" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={filled}
        strokeLinecap="round" transform="rotate(-90 36 36)" />
      <text x="36" y="40" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
};

/* ─── Bar Chart ─── */
const BarChart: React.FC<{ data: typeof MONTHLY_STATS }> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.apps));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', padding: '0 8px' }}>
      {data.map((d) => {
        const appH = (d.apps / maxVal) * 180;
        const slH = (d.shortlisted / maxVal) * 180;
        const rjH = (d.rejected / maxVal) * 180;
        return (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '190px' }}>
              <div style={{ width: '7px', height: `${appH}px`, background: '#38BDF8', borderRadius: '4px 4px 0 0' }} />
              <div style={{ width: '7px', height: `${slH}px`, background: '#FBBF24', borderRadius: '4px 4px 0 0' }} />
              <div style={{ width: '7px', height: `${rjH}px`, background: '#FB7185', borderRadius: '4px 4px 0 0' }} />
            </div>
            <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════ */
export const HrAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter] = useState('Month');
  const [notifications] = useState(6);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/analytics/hr');
        const d = res.data.data;
        setAnalytics({
          companyName: d.companyName || 'CloudTech Inc',
          activeJobsCount: d.activeJobsCount ?? 8,
          totalApplicationsCount: d.totalApplicationsCount ?? 5672,
          hiredCandidatesCount: d.hiredCandidatesCount ?? 3045,
          rejectedCount: d.applicationsByStatus?.REJECTED ?? 1055,
          conversionRate: d.conversionRate ?? 74,
          avgTimeToHireDays: d.avgTimeToHireDays ?? 14,
          applicationsByStatus: d.applicationsByStatus ?? {},
        });
      } catch {
        setAnalytics({
          companyName: 'CloudTech Inc',
          activeJobsCount: 8,
          totalApplicationsCount: 5672,
          hiredCandidatesCount: 3045,
          rejectedCount: 1055,
          conversionRate: 74,
          avgTimeToHireDays: 14,
          applicationsByStatus: { APPLIED: 65, SCREENED: 42, INTERVIEWING: 17, OFFERED: 10, REJECTED: 8 },
        });
      }
    })();
  }, []);

  const hrName = user ? `${user.firstName} ${user.lastName}` : 'Thomas Flecture';
  const hrRole = 'Director of Recruiting';

  /* ─── Stats Cards ─── */
  const stats = [
    { label: 'Total Applications', value: analytics?.totalApplicationsCount ?? 5672, pct: 74, color: '#22C55E', trend: '+14% Inc.' },
    { label: 'Shortlisted Candidates', value: analytics?.hiredCandidatesCount ?? 3045, pct: 74, color: '#FBBF24', trend: '+14% Inc.' },
    { label: 'Rejected Candidates', value: analytics?.rejectedCount ?? 1055, pct: 74, color: '#FB7185', trend: '+14% Inc.' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>

      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <aside style={{
        width: '220px',
        minHeight: '100vh',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px 24px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '16px' }}>🧠</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1E293B' }}>HireMind R.</span>
        </div>

        {/* MENU */}
        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', padding: '0 16px', marginBottom: '8px' }}>MENU</p>
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active={activeNav === 'Dashboard'} onClick={() => setActiveNav('Dashboard')} />
          <NavItem icon={<MessageSquare size={16} />} label="Message" active={activeNav === 'Message'} onClick={() => setActiveNav('Message')} />
          <NavItem icon={<Calendar size={16} />} label="Calendar" active={activeNav === 'Calendar'} onClick={() => setActiveNav('Calendar')} />
        </div>

        {/* RECRUITMENT */}
        <div style={{ marginBottom: '8px', marginTop: '16px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', padding: '0 16px', marginBottom: '8px' }}>RECRUITMENT</p>
          <NavItem icon={<Briefcase size={16} />} label="Jobs" active={activeNav === 'Jobs'} onClick={() => { setActiveNav('Jobs'); navigate('/jobs'); }} />
          <NavItem icon={<Users size={16} />} label="Candidates" active={activeNav === 'Candidates'} onClick={() => { setActiveNav('Candidates'); navigate('/hr-applications'); }} />
          <NavItem icon={<Star size={16} />} label="My Referrals" active={activeNav === 'Referrals'} onClick={() => setActiveNav('Referrals')} />
          <NavItem icon={<Globe size={16} />} label="Career Site" active={activeNav === 'Career'} onClick={() => setActiveNav('Career')} />
        </div>

        {/* ORGANIZATION */}
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', padding: '0 16px', marginBottom: '8px' }}>ORGANIZATION</p>
          <NavItem icon={<UserCircle2 size={16} />} label="Employee" active={activeNav === 'Employee'} onClick={() => setActiveNav('Employee')} />
          <NavItem icon={<BarChart2 size={16} />} label="Structure" active={activeNav === 'Structure'} onClick={() => setActiveNav('Structure')} />
          <NavItem icon={<BarChart2 size={16} />} label="Report" active={activeNav === 'Report'} onClick={() => setActiveNav('Report')} />
          <NavItem icon={<Settings size={16} />} label="Settings" active={activeNav === 'Settings'} onClick={() => setActiveNav('Settings')} />
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Top Header Bar ── */}
        <header style={{
          height: '64px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Hello, {user?.firstName || 'Thomas'}. Welcome to HireMind AI</p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by anything"
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                background: '#F8FAFC',
                color: '#1E293B',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: '#2563EB', border: 'none', borderRadius: '7px',
              width: '28px', height: '28px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Search size={13} color="#FFFFFF" />
            </button>
          </div>

          {/* Icons */}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <span style={{ fontSize: '18px' }}>?</span>
          </button>
          <div style={{ position: 'relative' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
              <Bell size={18} />
            </button>
            {notifications > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: '#EF4444', color: '#FFF', borderRadius: '50%',
                width: '16px', height: '16px', fontSize: '9px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{notifications}</span>
            )}
          </div>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#FFF'
          }}>
            {(user?.firstName?.[0] || 'H')}
          </div>
        </header>

        {/* ── Page Body (scrollable) ── */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', gap: '24px' }}>

          {/* ── Center Column ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {stats.map((s, i) => (
                <div key={i} style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 4px', fontWeight: 500 }}>{s.label}</p>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px', lineHeight: 1 }}>
                      {s.value.toLocaleString()}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#22C55E' }}>
                      <TrendingUp size={12} />
                      <span>{s.trend}</span>
                    </div>
                  </div>
                  <RingChart pct={s.pct} color={s.color} />
                </div>
              ))}
            </div>

            {/* Monthly Bar Chart */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Statistics of active Applications</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {[{ c: '#38BDF8', l: 'Applications' }, { c: '#FBBF24', l: 'Shortlisted' }, { c: '#FB7185', l: 'Rejected' }].map(item => (
                    <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748B' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.c }} />
                      {item.l}
                    </div>
                  ))}
                  <button style={{
                    padding: '5px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
                    background: '#FFF', fontSize: '12px', color: '#1E293B', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {timeFilter} <ChevronDown size={12} />
                  </button>
                </div>
              </div>

              {/* Y-axis labels */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '210px', alignItems: 'flex-end', paddingBottom: '20px' }}>
                  {['100%', '80%', '60%', '40%', '20%'].map(l => (
                    <span key={l} style={{ fontSize: '10px', color: '#CBD5E1' }}>{l}</span>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <BarChart data={MONTHLY_STATS} />
                </div>
              </div>
            </div>

            {/* Activity Feed + Meetings Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Activity Feed */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Activity Feed</h3>
                  <button style={{
                    padding: '4px 10px', borderRadius: '8px', border: '1px solid #E2E8F0',
                    background: '#FFF', fontSize: '11px', color: '#64748B', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    All Activity <ChevronDown size={11} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {ACTIVITY_FEED.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#FFF', fontSize: '12px', fontWeight: 700,
                      }}>{item.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#1E293B' }}>
                          <strong>{item.name}</strong> {item.action} <strong>{item.job}</strong>
                        </p>
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>{item.time}</span>
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px',
                        background: item.tagColor + '20', color: item.tagColor, flexShrink: 0,
                      }}>{item.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meetings */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Meetings</h3>
                  <button style={{
                    padding: '4px 10px', borderRadius: '8px', border: '1px solid #E2E8F0',
                    background: '#FFF', fontSize: '11px', color: '#64748B', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    Create new <ChevronDown size={11} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {MEETINGS.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '12px', background: '#F8FAFC',
                      border: '1px solid #E2E8F0'
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: m.color + '20', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '9px', color: m.color, fontWeight: 700 }}>{m.day}</span>
                        <span style={{ fontSize: '14px', color: m.color, fontWeight: 800, lineHeight: 1 }}>{m.date}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{m.title}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{m.time}</p>
                      </div>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}>
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Action Buttons */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigate('/jobs')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: '#2563EB', color: '#FFF', border: 'none',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                    }}
                  >
                    <Plus size={14} /> Post Job
                  </button>
                  <button
                    onClick={() => navigate('/copilot')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: '#7C3AED', color: '#FFF', border: 'none',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                    }}
                  >
                    <Bot size={14} /> AI Copilot
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT SIDEBAR ══════════ */}
          <aside style={{
            width: '240px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>

            {/* Profile Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px 20px',
              border: '1px solid #E2E8F0',
              textAlign: 'center',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 800, color: '#FFF',
                margin: '0 auto 12px',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.35)',
              }}>
                {(user?.firstName?.[0] || 'T')}
              </div>
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#1E293B', margin: '0 0 4px' }}>{hrName}</p>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{hrRole}</p>
            </div>

            {/* Messages */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Messages</h4>
              {[
                { name: 'Cameron Williamson', msg: 'Have you planned any deadline…', avatar: 'C' },
                { name: 'Jacob Jones', msg: 'The candidate has been shortlis…', avatar: 'J' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i === 0 ? '12px' : 0, cursor: 'pointer' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'linear-gradient(135deg, #F59E0B, #EF4444)' : 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFF', fontSize: '12px', fontWeight: 700,
                  }}>{m.avatar}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{m.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{m.msg}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Added Jobs */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Recent Added Jobs</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {RECENT_JOBS.map(job => (
                  <div key={job.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/jobs')}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                      background: job.iconBg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px',
                    }}>{job.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#94A3B8' }}>{job.company}, {job.location} · {job.ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel Quick Stats */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Hiring Funnel</h4>
              {[
                { label: 'Applied', val: analytics?.applicationsByStatus['APPLIED'] ?? 65, color: '#38BDF8' },
                { label: 'Screened', val: analytics?.applicationsByStatus['SCREENED'] ?? 42, color: '#FBBF24' },
                { label: 'Interviewing', val: analytics?.applicationsByStatus['INTERVIEWING'] ?? 17, color: '#A78BFA' },
                { label: 'Offered', val: analytics?.applicationsByStatus['OFFERED'] ?? 10, color: '#34D399' },
                { label: 'Rejected', val: analytics?.applicationsByStatus['REJECTED'] ?? 8, color: '#FB7185' },
              ].map(s => {
                const total = 65 + 42 + 17 + 10 + 8;
                const pct = Math.round((s.val / total) * 100);
                return (
                  <div key={s.label} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontSize: '11px', color: '#1E293B', fontWeight: 700 }}>{s.val}</span>
                    </div>
                    <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
