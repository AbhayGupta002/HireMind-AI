import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { HrAnalytics } from './pages/HrAnalytics';
import { HrApplications } from './pages/HrApplications';
import { AdminPortal } from './pages/AdminPortal';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
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
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
