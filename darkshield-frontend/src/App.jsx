import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ThreatsPage from './pages/ThreatsPage';
import IncidentsPage from './pages/IncidentsPage';
import AssetsPage from './pages/AssetsPage';
import GlobeViewPage from './pages/GlobeViewPage';
import ChatPage from './pages/ChatPage';
import AIAnalystPage from './pages/AIAnalystPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-void)', fontFamily: 'var(--font-display)', color: 'var(--neon-green)', letterSpacing: 4 }}>INITIALIZING...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/threats" element={<ProtectedRoute><ThreatsPage /></ProtectedRoute>} />
      <Route path="/incidents" element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
      <Route path="/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
      <Route path="/globe" element={<ProtectedRoute><GlobeViewPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/ai" element={<ProtectedRoute><AIAnalystPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
