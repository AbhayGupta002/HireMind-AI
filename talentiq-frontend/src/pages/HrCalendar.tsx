import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Mail,
  Plus, X, Check, LayoutDashboard, MessageSquare,
  Users, Briefcase, Settings, LogOut, Bot,
  AlertCircle
} from 'lucide-react';

/* ─── Types ─── */
interface InterviewSlot {
  id: number;
  applicationId: number;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  notes?: string;
  status: string;
}

interface Application {
  id: number;
  candidate: { user: { firstName: string; lastName: string; email: string } };
  job: { id: number; title: string };
  status: string;
}

/* ─── Sidebar NavItem ─── */
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> =
  ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
      padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      fontSize: '14px', fontWeight: active ? 600 : 400,
      background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
      color: active ? '#fff' : '#94a3b8', transition: 'all 0.2s', textAlign: 'left',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {icon}{label}
    </button>
  );

/* ─── Status color map ─── */
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#10b981', CANCELLED: '#ef4444',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const HrCalendar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar navigation
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);

  // Forms
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: '', scheduledAt: '', durationMinutes: 60, meetingLink: '', notes: ''
  });
  const [selectForm, setSelectForm] = useState({ applicationId: '', customMessage: '' });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* ─── Fetch data ─── */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, appsRes] = await Promise.all([
        apiClient.get('/v1/interviews/calendar'),
        apiClient.get('/v1/applications/hr?size=50&sort=appliedAt,desc').catch(() => ({ data: { data: { content: [] } } })),
      ]);
      setSlots(slotsRes.data?.data || []);
      setApplications(appsRes.data?.data?.content || []);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ─── Calendar helpers ─── */
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const getSlotsForDay = (day: number): InterviewSlot[] => {
    return slots.filter(slot => {
      const d = new Date(slot.scheduledAt);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };
  const formatFull = (iso: string) => {
    try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  /* ─── Schedule interview ─── */
  const handleSchedule = async () => {
    if (!scheduleForm.applicationId || !scheduleForm.scheduledAt) return;
    try {
      setActionLoading(true);
      await apiClient.post('/v1/interviews/schedule', {
        applicationId: parseInt(scheduleForm.applicationId),
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        durationMinutes: scheduleForm.durationMinutes,
        meetingLink: scheduleForm.meetingLink || undefined,
        notes: scheduleForm.notes || undefined,
      });
      setActionMsg({ type: 'success', text: '✅ Interview scheduled! Email sent to candidate.' });
      setShowScheduleModal(false);
      setScheduleForm({ applicationId: '', scheduledAt: '', durationMinutes: 60, meetingLink: '', notes: '' });
      fetchData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to schedule interview.' });
    } finally { setActionLoading(false); }
  };

  /* ─── Send selection email ─── */
  const handleSelect = async () => {
    if (!selectForm.applicationId) return;
    try {
      setActionLoading(true);
      await apiClient.post('/v1/interviews/select', {
        applicationId: parseInt(selectForm.applicationId),
        customMessage: selectForm.customMessage || undefined,
      });
      setActionMsg({ type: 'success', text: '🎉 Selection email sent successfully!' });
      setShowSelectModal(false);
      setSelectForm({ applicationId: '', customMessage: '' });
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to send selection email.' });
    } finally { setActionLoading(false); }
  };

  /* ─── Update slot status ─── */
  const updateStatus = async (slotId: number, status: string) => {
    try {
      await apiClient.put(`/v1/interviews/${slotId}/status`, { status });
      fetchData();
    } catch { }
  };

  const selectedDaySlots = selectedDay ? getSlotsForDay(selectedDay) : [];

  /* ─── Overlay modal backdrop ─── */
  const Backdrop: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(4px)' }} />
  );

  /* ─── Input style ─── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HireMind AI</span>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <NavItem icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={() => navigate('/hr-analytics')} />
          <NavItem icon={<MessageSquare size={17} />} label="Messages" onClick={() => navigate('/hr-messages')} />
          <NavItem icon={<Calendar size={17} />} label="Calendar" active onClick={() => {}} />
          <NavItem icon={<Users size={17} />} label="Applications" onClick={() => navigate('/hr-applications')} />
          <NavItem icon={<Briefcase size={17} />} label="Jobs" onClick={() => navigate('/jobs')} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
          <NavItem icon={<Settings size={17} />} label="Settings" onClick={() => {}} />
          <NavItem icon={<LogOut size={17} />} label="Sign Out" onClick={() => { logout(); navigate('/'); }} />
        </nav>
        <div style={{ padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{user ? `${user.firstName} ${user.lastName}` : 'HR Manager'}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{user?.email || ''}</div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>

        {/* Action message banner */}
        {actionMsg && (
          <div style={{
            padding: '12px 20px', borderRadius: 10, marginBottom: 20,
            background: actionMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${actionMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: actionMsg.type === 'success' ? '#34d399' : '#fca5a5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
          </div>
        )}

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Interview Calendar</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Manage interviews and send candidate selections</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowSelectModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 9, color: '#34d399', fontSize: 13, cursor: 'pointer', fontWeight: 600
            }}>
              <Mail size={15} /> Select Candidate
            </button>
            <button onClick={() => setShowScheduleModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
              borderRadius: 9, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600
            }}>
              <Plus size={15} /> Schedule Interview
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* ── Calendar Grid ── */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
            {/* Month navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6 }}>
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{MONTHS[viewMonth]} {viewYear}</h2>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6 }}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#475569', padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const daySlots = getSlotsForDay(day);
                const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
                const isSelected = selectedDay === day;
                const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <button key={day} onClick={() => { setSelectedDay(day); if (daySlots.length > 0) setShowDayModal(true); }}
                    style={{
                      aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'flex-start', padding: '6px 4px',
                      borderRadius: 10, border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                      cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
                      background: isToday
                        ? 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))'
                        : isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                      opacity: isPast ? 0.45 : 1,
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!isSelected && !isToday) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#818cf8' : '#e2e8f0', marginBottom: 3 }}>{day}</span>
                    {daySlots.slice(0, 2).map((slot, si) => (
                      <div key={si} style={{
                        width: '80%', height: 4, borderRadius: 2, marginBottom: 2,
                        background: STATUS_COLORS[slot.status] || '#6366f1'
                      }} />
                    ))}
                    {daySlots.length > 2 && (
                      <span style={{ fontSize: 9, color: '#64748b' }}>+{daySlots.length - 2}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Upcoming Interviews ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '20px', flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#e2e8f0' }}>Upcoming Interviews</h3>
              {loading ? (
                <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Loading...</div>
              ) : slots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#475569' }}>
                  <Calendar size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <div style={{ fontSize: 13 }}>No upcoming interviews</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                  {slots.map(slot => {
                    const color = STATUS_COLORS[slot.status] || '#6366f1';
                    return (
                      <div key={slot.id} style={{
                        padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                        borderLeft: `3px solid ${color}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{slot.candidateName}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{slot.jobTitle}</div>
                          </div>
                          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `${color}22`, color, fontWeight: 600 }}>{slot.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                          <Clock size={12} />
                          {formatFull(slot.scheduledAt)} · {slot.durationMinutes} min
                        </div>
                        {slot.meetingLink && (
                          <a href={slot.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: '#818cf8', textDecoration: 'none' }}>
                            🔗 Join Meeting
                          </a>
                        )}
                        {slot.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            <button onClick={() => updateStatus(slot.id, 'CONFIRMED')} style={{ flex: 1, padding: '5px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: '#10b981', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <Check size={11} /> Confirm
                            </button>
                            <button onClick={() => updateStatus(slot.id, 'CANCELLED')} style={{ flex: 1, padding: '5px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <X size={11} /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Schedule Interview Modal ── */}
      {showScheduleModal && (
        <>
          <Backdrop onClose={() => setShowScheduleModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
            padding: '28px', width: 480, zIndex: 101, boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📅 Schedule Interview</h2>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Select Application *</label>
                <select value={scheduleForm.applicationId}
                  onChange={e => setScheduleForm(f => ({ ...f, applicationId: e.target.value }))}
                  style={{ ...inputStyle, background: '#0f172a' }}>
                  <option value="">— Choose a candidate application —</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.candidate?.user?.firstName} {app.candidate?.user?.lastName} — {app.job?.title} ({app.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Interview Date & Time *</label>
                <input type="datetime-local" value={scheduleForm.scheduledAt}
                  onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Duration (minutes)</label>
                <select value={scheduleForm.durationMinutes}
                  onChange={e => setScheduleForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) }))}
                  style={{ ...inputStyle, background: '#0f172a' }}>
                  {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Meeting Link</label>
                <input type="url" placeholder="https://meet.google.com/..." value={scheduleForm.meetingLink}
                  onChange={e => setScheduleForm(f => ({ ...f, meetingLink: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Notes</label>
                <textarea value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes for the candidate..."
                  rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowScheduleModal(false)} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
                  Cancel
                </button>
                <button onClick={handleSchedule} disabled={actionLoading || !scheduleForm.applicationId || !scheduleForm.scheduledAt}
                  style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? 'Scheduling...' : '📅 Schedule & Notify Candidate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Select Candidate Modal ── */}
      {showSelectModal && (
        <>
          <Backdrop onClose={() => setShowSelectModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
            padding: '28px', width: 460, zIndex: 101, boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🌟 Select Candidate</h2>
              <button onClick={() => setShowSelectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                This will send a <strong style={{ color: '#34d399' }}>"You are selected"</strong> email directly to the candidate's inbox. A real-time notification will also appear in their portal.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Select Application *</label>
                <select value={selectForm.applicationId}
                  onChange={e => setSelectForm(f => ({ ...f, applicationId: e.target.value }))}
                  style={{ ...inputStyle, background: '#0f172a' }}>
                  <option value="">— Choose a candidate —</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.candidate?.user?.firstName} {app.candidate?.user?.lastName} — {app.job?.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Custom Message (optional)</label>
                <textarea value={selectForm.customMessage}
                  onChange={e => setSelectForm(f => ({ ...f, customMessage: e.target.value }))}
                  placeholder="Congratulations! We are excited to move forward with your application..."
                  rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Leave blank to use the default selection message.</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowSelectModal(false)} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
                  Cancel
                </button>
                <button onClick={handleSelect} disabled={actionLoading || !selectForm.applicationId}
                  style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#10b981,#06b6d4)', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? 'Sending...' : '🌟 Send Selection Email'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Day Detail Modal ── */}
      {showDayModal && selectedDay && selectedDaySlots.length > 0 && (
        <>
          <Backdrop onClose={() => setShowDayModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
            padding: '24px', width: 400, zIndex: 101, boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {MONTHS[viewMonth]} {selectedDay}, {viewYear}
              </h2>
              <button onClick={() => setShowDayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedDaySlots.map(slot => {
                const color = STATUS_COLORS[slot.status] || '#6366f1';
                return (
                  <div key={slot.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: `3px solid ${color}` }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{slot.candidateName}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{slot.jobTitle}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={12} /> {formatTime(slot.scheduledAt)} · {slot.durationMinutes} min
                    </div>
                    <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${color}22`, color, fontWeight: 600 }}>{slot.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        select option { background: #1e293b; color: #f1f5f9; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.8); }
      `}</style>
    </div>
  );
};

export default HrCalendar;
