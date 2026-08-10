import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

// Wrapper that hides the global Navbar on the home page
// (Home.tsx has its own full custom navbar with dark/light toggle)
function AppLayout() {
  const location = useLocation();
  // HR dashboard pages have their own sidebar navbar — hide the global navbar
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
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/portfolio" element={<PortfolioBuilder />} />
          <Route path="/copilot" element={<HrCopilot />} />
          <Route path="/hr-analytics" element={<HrAnalytics />} />
          <Route path="/hr-applications" element={<HrApplications />} />
          <Route path="/hr-messages" element={<HrMessages />} />
          <Route path="/hr-calendar" element={<HrCalendar />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/profile" element={<ProfilePage />} />
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
