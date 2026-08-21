import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Mail,
  Plus, X, Check, LayoutDashboard, MessageSquare,
  Users, Briefcase, Settings, LogOut,
  AlertCircle, Sun, Sparkles
} from 'lucide-react';
import '../css/hr-calendar.css';

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
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; isUniverse?: boolean; onClick?: () => void }> =
  ({ icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`cal-nav-item ${active ? 'active' : ''}`}
    >
      {icon}{label}
    </button>
  );

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#10b981', CANCELLED: '#ef4444',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const HrCalendar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Theme State
  const [theme, setTheme] = useState<'light' | 'universe'>(() => {
    return (localStorage.getItem('hr_theme') as 'light' | 'universe') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'universe' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('hr_theme', nextTheme);
  };

  const isUniverse = theme === 'universe';

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

  const Backdrop: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div onClick={onClose} className="cal-modal-overlay" />
  );

  return (
    <div className={`calendar-page-wrapper ${isUniverse ? 'theme-universe' : 'theme-light'}`}>
      {/* ── Sidebar ── */}
      <aside className="cal-sidebar">
        <div className="cal-sidebar-brand" onClick={() => navigate('/')}>
          <div className="cal-brand-icon cal-avatar-brand">
            <span style={{ fontSize: 16 }}>🌌</span>
          </div>
          <span className="cal-brand-name">HireMind AI</span>
        </div>
        <nav className="cal-nav-list">
          <NavItem icon={<LayoutDashboard size={17} />} label="Dashboard" isUniverse={isUniverse} onClick={() => navigate('/hr-analytics')} />
          <NavItem icon={<MessageSquare size={17} />} label="Messages" isUniverse={isUniverse} onClick={() => navigate('/hr-messages')} />
          <NavItem icon={<Calendar size={17} />} label="Calendar" active isUniverse={isUniverse} onClick={() => {}} />
          <NavItem icon={<Users size={17} />} label="Applications" isUniverse={isUniverse} onClick={() => navigate('/hr-applications')} />
          <NavItem icon={<Briefcase size={17} />} label="Jobs" isUniverse={isUniverse} onClick={() => navigate('/jobs')} />
          <div className="cal-nav-divider" />
          <NavItem icon={<Settings size={17} />} label="Settings" isUniverse={isUniverse} onClick={() => {}} />
          <NavItem icon={<LogOut size={17} />} label="Sign Out" isUniverse={isUniverse} onClick={() => { logout(); navigate('/'); }} />
        </nav>
        <div className="cal-user-badge">
          <div className="cal-user-name">{user ? `${user.firstName} ${user.lastName}` : 'HR Manager'}</div>
          <div className="cal-user-email">{user?.email || ''}</div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="cal-main-workspace">
        {/* Header row */}
        <div className="cal-header-bar">
          <div>
            <h1 className="cal-header-title">Interview Calendar</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: isUniverse ? '#94A3B8' : '#64748B' }}>Manage interviews and send candidate selections</p>
          </div>
          <div className="cal-header-actions">
            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} className="cal-theme-btn">
              {isUniverse ? <Sparkles size={14} /> : <Sun size={14} />}
              {isUniverse ? 'Universe Mode' : 'Light Mode'}
            </button>
            <button onClick={() => setShowSelectModal(true)} className="cal-btn-select">
              <Mail size={15} /> Select Candidate
            </button>
            <button onClick={() => setShowScheduleModal(true)} className="cal-btn-schedule">
              <Plus size={15} /> Schedule Interview
            </button>
          </div>
        </div>

        <div className="cal-content-body">
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            {/* ── Calendar Grid ── */}
            <div className="cal-card" style={{ borderRadius: 16, padding: '24px' }}>
              <div className="cal-nav-controls">
                <button onClick={prevMonth} className="cal-nav-arrow-btn">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="cal-month-title">{MONTHS[viewMonth]} {viewYear}</h2>
                <button onClick={nextMonth} className="cal-nav-arrow-btn">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="cal-weekdays-row">
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{d}</div>
                ))}
              </div>

              <div className="cal-grid">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const daySlots = getSlotsForDay(day);
                  const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
                  const isSelected = selectedDay === day;
                  const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                  return (
                    <button
                      key={day}
                      onClick={() => { setSelectedDay(day); if (daySlots.length > 0) setShowDayModal(true); }}
                      className={`cal-day-cell ${isSelected ? 'selected' : ''}`}
                      style={{ opacity: isPast ? 0.45 : 1 }}
                    >
                      <span className="cal-day-number" style={{ color: isToday ? '#6366f1' : undefined }}>{day}</span>
                      <div className="cal-slots-indicator-list">
                        {daySlots.slice(0, 2).map((slot, si) => (
                          <div key={si} style={{
                            width: '80%', height: 4, borderRadius: 2, marginBottom: 2,
                            background: STATUS_COLORS[slot.status] || '#6366f1'
                          }} />
                        ))}
                        {daySlots.length > 2 && (
                          <span style={{ fontSize: 9, color: isUniverse ? '#94A3B8' : '#64748B' }}>+{daySlots.length - 2}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                    <span style={{ fontSize: 11, color: isUniverse ? '#94A3B8' : '#64748B' }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Upcoming Interviews Sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="cal-card" style={{ borderRadius: 16, padding: '20px', flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Upcoming Interviews</h3>
                {loading ? (
                  <div style={{ color: isUniverse ? '#94A3B8' : '#64748B', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Loading...</div>
                ) : slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: isUniverse ? '#94A3B8' : '#64748B' }}>
                    <Calendar size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <div style={{ fontSize: 13 }}>No upcoming interviews</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                    {slots.map(slot => {
                      const color = STATUS_COLORS[slot.status] || '#6366f1';
                      return (
                        <div key={slot.id} style={{
                          padding: '14px', background: isUniverse ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 12,
                          borderLeft: `3px solid ${color}`, borderTop: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', borderRight: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', borderBottom: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{slot.candidateName}</div>
                              <div style={{ fontSize: 11, color: isUniverse ? '#94A3B8' : '#64748B', marginTop: 2 }}>{slot.jobTitle}</div>
                            </div>
                            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `${color}22`, color, fontWeight: 600 }}>{slot.status}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B' }}>
                            <Clock size={12} />
                            {formatFull(slot.scheduledAt)} · {slot.durationMinutes} min
                          </div>
                          {slot.meetingLink && (
                            <a href={slot.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: isUniverse ? '#818cf8' : '#2563eb', textDecoration: 'none' }}>
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
        </div>
      </main>

      {/* ── Schedule Interview Modal ── */}
      {showScheduleModal && (
        <>
          <Backdrop onClose={() => setShowScheduleModal(false)} />
          <div className="cal-modal-overlay">
            <div className="cal-modal-panel">
              <div className="cal-modal-header">
                <h2 className="cal-modal-title">📅 Schedule Interview</h2>
                <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isUniverse ? '#94A3B8' : '#64748B' }}><X size={20} /></button>
              </div>

              <div className="cal-modal-form">
                <div>
                  <label style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginBottom: 6, display: 'block' }}>Select Application *</label>
                  <select
                    value={scheduleForm.applicationId}
                    onChange={e => setScheduleForm(f => ({ ...f, applicationId: e.target.value }))}
                    className="cal-input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8 }}
                  >
                    <option value="">— Choose a candidate application —</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.candidate?.user?.firstName} {app.candidate?.user?.lastName} — {app.job?.title} ({app.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginBottom: 6, display: 'block' }}>Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduledAt}
                    onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="cal-input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, colorScheme: isUniverse ? 'dark' : 'light' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginBottom: 6, display: 'block' }}>Duration (minutes)</label>
                  <select
                    value={scheduleForm.durationMinutes}
                    onChange={e => setScheduleForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) }))}
                    className="cal-input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8 }}
                  >
                    {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutes</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginBottom: 6, display: 'block' }}>Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={scheduleForm.meetingLink}
                    onChange={e => setScheduleForm(f => ({ ...f, meetingLink: e.target.value }))}
                    className="cal-input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginBottom: 6, display: 'block' }}>Notes</label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes for the candidate..."
                    rows={3}
                    className="cal-input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, resize: 'vertical' }}
                  />
                </div>
                <div className="cal-modal-actions">
                  <button onClick={() => setShowScheduleModal(false)} style={{ flex: 1, padding: '11px', background: isUniverse ? 'rgba(255,255,255,0.05)' : '#F1F5F9', border: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', borderRadius: 9, color: isUniverse ? '#94A3B8' : '#64748B', cursor: 'pointer', fontSize: 14 }}>
                    Cancel
                  </button>
                  <button onClick={handleSchedule} disabled={actionLoading || !scheduleForm.applicationId || !scheduleForm.scheduledAt}
                    style={{ flex: 2, padding: '11px', background: isUniverse ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#2563EB', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: actionLoading ? 0.7 : 1 }}>
                    {actionLoading ? 'Scheduling...' : '📅 Schedule & Notify Candidate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Select Candidate Modal ── */}
      {showSelectModal && (
        <>
          <Backdrop onClose={() => setShowSelectModal(false)} />
          <div className="cal-modal-overlay">
            <div className="cal-modal-panel" style={{ maxWidth: 460 }}>
              <div className="cal-modal-header">
                <h2 className="cal-modal-title">🌟 Select Candidate</h2>
                <button onClick={() => setShowSelectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isUniverse ? '#94A3B8' : '#64748B' }}><X size={20} /></button>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', lineHeight: 1.6 }}>
                  This will send a <strong style={{ color: '#34d399' }}>"You are selected"</strong> email directly to the candidate's inbox. A real-time notification will also appear in their portal.
                </div>
              </div>

              <div className="cal-modal-form">
                <div>
                  <label style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginBottom: 6, display: 'block' }}>Select Application *</label>
                  <select
                    value={selectForm.applicationId}
                    onChange={e => setSelectForm(f => ({ ...f, applicationId: e.target.value }))}
                    className="cal-input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8 }}
                  >
                    <option value="">— Choose a candidate —</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.candidate?.user?.firstName} {app.candidate?.user?.lastName} — {app.job?.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginBottom: 6, display: 'block' }}>Custom Message (optional)</label>
                  <textarea
                    value={selectForm.customMessage}
                    onChange={e => setSelectForm(f => ({ ...f, customMessage: e.target.value }))}
                    placeholder="Congratulations! We are excited to move forward with your application..."
                    rows={4}
                    className="cal-input-field"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, resize: 'vertical' }}
                  />
                  <div style={{ fontSize: 11, color: isUniverse ? '#94A3B8' : '#64748B', marginTop: 4 }}>Leave blank to use default selection email text.</div>
                </div>
                <div className="cal-modal-actions">
                  <button onClick={() => setShowSelectModal(false)} style={{ flex: 1, padding: '11px', background: isUniverse ? 'rgba(255,255,255,0.05)' : '#F1F5F9', border: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', borderRadius: 9, color: isUniverse ? '#94A3B8' : '#64748B', cursor: 'pointer', fontSize: 14 }}>
                    Cancel
                  </button>
                  <button onClick={handleSelect} disabled={actionLoading || !selectForm.applicationId}
                    style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#10b981,#06b6d4)', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: actionLoading ? 0.7 : 1 }}>
                    {actionLoading ? 'Sending...' : '🌟 Send Selection Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Day Detail Modal ── */}
      {showDayModal && selectedDay && selectedDaySlots.length > 0 && (
        <>
          <Backdrop onClose={() => setShowDayModal(false)} />
          <div className="cal-modal-overlay">
            <div className="cal-modal-panel" style={{ maxWidth: 400 }}>
              <div className="cal-modal-header">
                <h2 className="cal-modal-title">
                  {MONTHS[viewMonth]} {selectedDay}, {viewYear}
                </h2>
                <button onClick={() => setShowDayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isUniverse ? '#94A3B8' : '#64748B' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedDaySlots.map(slot => {
                  const color = STATUS_COLORS[slot.status] || '#6366f1';
                  return (
                    <div key={slot.id} style={{ padding: '14px', background: isUniverse ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 10, borderLeft: `3px solid ${color}`, borderTop: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', borderRight: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', borderBottom: isUniverse ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{slot.candidateName}</div>
                      <div style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B' }}>{slot.jobTitle}</div>
                      <div style={{ fontSize: 12, color: isUniverse ? '#94A3B8' : '#64748B', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} /> {formatTime(slot.scheduledAt)} · {slot.durationMinutes} min
                      </div>
                      <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${color}22`, color, fontWeight: 600 }}>{slot.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HrCalendar;
