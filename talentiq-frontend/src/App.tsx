import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { JobsList } from './pages/JobsList';
import { Recommendations } from './pages/Recommendations';
import { MyApplications } from './pages/MyApplications';
import { PortfolioBuilder } from './pages/PortfolioBuilder';
import { HrCopilot } from './pages/HrCopilot';
import { HrAnalytics } from './pages/HrAnalytics';
import { HrApplications } from './pages/HrApplications';
import { AdminPortal } from './pages/AdminPortal';
import { ProfilePage } from './pages/ProfilePage';

/* ─────────────────────────────────────────────────────────
   Utility: read roles directly from localStorage
   (needed immediately after login before React state settles)
───────────────────────────────────────────────────────── */
function getStorageUser(): { roles: string[]; email: string } {
  try {
    const saved = localStorage.getItem('user');
    if (!saved) return { roles: [], email: '' };
    const parsed = JSON.parse(saved);
    const rawRoles = parsed.roles || [];
    const email = (parsed.email || '').toLowerCase();
    let roles: string[] = [];
    if (Array.isArray(rawRoles)) {
      roles = rawRoles.map((r: any) => typeof r === 'string' ? r : r?.name || r?.role || String(r));
    }
    return { roles, email };
  } catch {
    return { roles: [], email: '' };
  }
}

function hasHrRole(data: { roles: string[]; email: string }): boolean {
  if (data.email.includes('hr@') || data.email.includes('recruiter') || data.email.includes('rachel.hr')) return true;
  return data.roles.some(r => {
    const str = (typeof r === 'string' ? r : (r as any)?.name || (r as any)?.role || String(r)).toUpperCase();
    return ['ROLE_HR', 'HR', 'ROLE_RECRUITER', 'RECRUITER', 'ROLE_HR_MANAGER', 'HR_MANAGER'].includes(str);
  });
}

function hasAdminRole(data: { roles: string[]; email: string }): boolean {
  if (data.email.includes('admin@')) return true;
  return data.roles.some(r => {
    const str = (typeof r === 'string' ? r : (r as any)?.name || (r as any)?.role || String(r)).toUpperCase();
    return ['ROLE_SUPER_ADMIN', 'ROLE_PLATFORM_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'ROLE_ADMIN', 'PLATFORM_ADMIN'].includes(str);
  });
}




/* ─────────────────────────────────────────────────────────
   Protected Route Guards
───────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: '16px',
      background: '#06071A', color: '#94A3B8', fontSize: '15px'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid rgba(124,58,237,0.2)',
        borderTop: '3px solid #7C3AED',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Verifying your session...
    </div>
  );
}

// HR-only pages: /hr-analytics, /hr-applications, /copilot
function HrRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isHr, isAdmin, isLoading } = useAuth();

  // While loading, also check localStorage directly to avoid flash redirect
  const storageData = getStorageUser();
  const isHrFromStorage = hasHrRole(storageData) || hasAdminRole(storageData);
  const hasToken = !!localStorage.getItem('accessToken');

  // Still loading — don't redirect yet
  if (isLoading && hasToken) return <LoadingScreen />;

  // Not logged in at all
  if (!isAuthenticated && !hasToken) return <Navigate to="/login" replace />;

  // Logged in but not HR/Admin
  if (!isHr && !isAdmin && !isHrFromStorage) return <Navigate to="/login" replace />;

  return children;
}

// Candidate pages: /recommendations, /my-applications, /portfolio
function CandidateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');

  if (isLoading && hasToken) return <LoadingScreen />;
  if (!isAuthenticated && !hasToken) return <Navigate to="/login" replace />;

  return children;
}

// Admin-only: /admin
function AdminRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const storageData = getStorageUser();
  const isAdminFromStorage = hasAdminRole(storageData);
  const hasToken = !!localStorage.getItem('accessToken');

  if (isLoading && hasToken) return <LoadingScreen />;
  if (!isAuthenticated && !hasToken) return <Navigate to="/login" replace />;
  if (!isAdmin && !isAdminFromStorage) return <Navigate to="/login" replace />;

  return children;
}

// Any authenticated user: /profile
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');

  if (isLoading && hasToken) return <LoadingScreen />;
  if (!isAuthenticated && !hasToken) return <Navigate to="/login" replace />;

  return children;
}

/* ─────────────────────────────────────────────────────────
   App Layout (hides global Navbar on home — home has its own)
───────────────────────────────────────────────────────── */
function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isHome && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobsList />} />

          {/* HR Routes — requires HR/Admin login */}
          <Route path="/hr-analytics"    element={<HrRoute><HrAnalytics /></HrRoute>} />
          <Route path="/hr-applications" element={<HrRoute><HrApplications /></HrRoute>} />
          <Route path="/copilot"         element={<HrRoute><HrCopilot /></HrRoute>} />

          {/* Candidate Routes — requires any login */}
          <Route path="/recommendations" element={<CandidateRoute><Recommendations /></CandidateRoute>} />
          <Route path="/my-applications" element={<CandidateRoute><MyApplications /></CandidateRoute>} />
          <Route path="/portfolio"       element={<CandidateRoute><PortfolioBuilder /></CandidateRoute>} />

          {/* Admin Route */}
          <Route path="/admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />

          {/* Any authenticated user */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
