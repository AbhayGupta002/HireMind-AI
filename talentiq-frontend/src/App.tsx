import React from 'react';
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
import HrAnalytics from './pages/HrAnalytics';
import { HrApplications } from './pages/HrApplications';
import { AdminPortal } from './pages/AdminPortal';
import { ProfilePage } from './pages/ProfilePage';
import HrMessages from './pages/HrMessages';
import HrCalendar from './pages/HrCalendar';

/* ─── Route Guards for Authentication & Role Security ─── */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#818cf8' }}>
        Authenticating...
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const HrRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isHr, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#818cf8' }}>
        Authenticating HR Portal...
      </div>
    );
  }
  return isAuthenticated && (isHr || isAdmin) ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#818cf8' }}>
        Authenticating Admin Portal...
      </div>
    );
  }
  return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/login" replace />;
};

// Wrapper that hides the global Navbar on home and HR dashboard pages
function AppLayout() {
  const location = useLocation();
  const HR_ROUTES = ['/hr-analytics', '/hr-messages', '/hr-calendar', '/hr-applications', '/hr-copilot', '/copilot', '/admin'];
  const isHome = location.pathname === '/';
  const hideNavbar = isHome || HR_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!hideNavbar && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobsList />} />

          {/* Protected Candidate & Profile Routes */}
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><PortfolioBuilder /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Protected HR Recruiter Routes */}
          <Route path="/hr-analytics" element={<HrRoute><HrAnalytics /></HrRoute>} />
          <Route path="/hr-applications" element={<HrRoute><HrApplications /></HrRoute>} />
          <Route path="/hr-messages" element={<HrRoute><HrMessages /></HrRoute>} />
          <Route path="/hr-calendar" element={<HrRoute><HrCalendar /></HrRoute>} />
          <Route path="/hr-copilot" element={<HrRoute><HrCopilot /></HrRoute>} />
          <Route path="/copilot" element={<HrRoute><HrCopilot /></HrRoute>} />

          {/* Protected Super Admin Route */}
          <Route path="/admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />

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
