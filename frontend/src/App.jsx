import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/AuthPage/LoginPage';
import RegisterPage from './pages/AuthPage/RegisterPage';
import AdminLayout from './pages/AdminDashboard/AdminLayout';
import JobMarketplacePage from './pages/AdminDashboard/pages/JobMarketplacePage';
import Rule55ChallansPage from './pages/AdminDashboard/pages/Rule55ChallansPage';
import SubcontractorNetworkPage from './pages/AdminDashboard/pages/SubcontractorNetworkPage';
import GSTLedgerPage from './pages/AdminDashboard/pages/GSTLedgerPage';
import NotificationsPage from './pages/AdminDashboard/pages/NotificationsPage';
import SettingsPage from './pages/AdminDashboard/pages/SettingsPage';
import ManageJobsAndContractsPage from './pages/AdminDashboard/pages/ManageJobsAndContractsPage';

// Subcontractor (User) Dashboard Imports
import UserLayout from './pages/UserDashboard/UserLayout';
import LiveJobFeedPage from './pages/UserDashboard/pages/LiveJobFeedPage';
import ActiveContractsPage from './pages/UserDashboard/pages/ActiveContractsPage';
import Rule55InwardPage from './pages/UserDashboard/pages/Rule55InwardPage';
import EarningsPage from './pages/UserDashboard/pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';

import './App.css';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
      if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
      if (user.role === 'subcontractor') return <Navigate to="/user-dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#022c22', color: '#fff' } }} />
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<JobMarketplacePage />} />
          <Route path="contracts" element={<ManageJobsAndContractsPage />} />
          <Route path="profile" element={<ProfilePage role="admin" />} />
          <Route path="challans" element={<Rule55ChallansPage />} />
          <Route path="network" element={<SubcontractorNetworkPage />} />
          <Route path="gst" element={<GSTLedgerPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* User (Subcontractor) Dashboard Routes */}
        <Route path="/user-dashboard" element={<ProtectedRoute role="subcontractor"><UserLayout /></ProtectedRoute>}>
          <Route index element={<LiveJobFeedPage />} />
          <Route path="profile" element={<ProfilePage role="subcontractor" />} />
          <Route path="contracts" element={<ActiveContractsPage />} />
          <Route path="challans" element={<Rule55InwardPage />} />
          <Route path="earnings" element={<EarningsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
