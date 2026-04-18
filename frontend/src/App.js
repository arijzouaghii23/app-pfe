import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import Layout from './componets/Layout';
import AdminDashboard from './pages/AdminDashboard';
import MapPage from './pages/MapPage';
import AgentDashboard from './pages/AgentDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import WaitPage from './pages/WaitPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Page d'accueil publique (Portail Citoyen) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/wait" element={<WaitPage />} />


        {/* Routes Protégées (Avec Sidebar) */}
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/agent" element={<AgentDashboard />} />
          <Route path="/expert" element={<ExpertDashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<Navigate to="/map" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;