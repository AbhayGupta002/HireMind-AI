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

// 🔒 Protected Route Guards
function HrRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isHr, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>Loading authorization...</div>;
  if (!isAuthenticated || (!isHr && !isAdmin)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function CandidateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isCandidate, isLoading } = useAuth();
  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>Loading authorization...</div>;
  if (!isAuthenticated || !isCandidate) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>Loading authorization...</div>;
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>Loading authorization...</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Wrapper that hides the global Navbar on the home page
function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isHrDashboard = location.pathname === '/hr-analytics';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isHome && !isHrDashboard && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobsList />} />

          {/* Protected Candidate Routes */}
          <Route path="/recommendations" element={<CandidateRoute><Recommendations /></CandidateRoute>} />
          <Route path="/my-applications" element={<CandidateRoute><MyApplications /></CandidateRoute>} />
          <Route path="/portfolio" element={<CandidateRoute><PortfolioBuilder /></CandidateRoute>} />

          {/* Protected HR Routes */}
          <Route path="/hr-analytics" element={<HrRoute><HrAnalytics /></HrRoute>} />
          <Route path="/hr-applications" element={<HrRoute><HrApplications /></HrRoute>} />
          <Route path="/copilot" element={<HrRoute><HrCopilot /></HrRoute>} />

          {/* Protected Admin & User Routes */}
          <Route path="/admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

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
