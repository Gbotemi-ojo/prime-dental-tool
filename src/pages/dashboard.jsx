// src/pages/dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import API_BASE_URL from '../config/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const [userResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (userResponse.ok) setUser(await userResponse.json());
        else throw new Error('Failed to fetch user data. Please log in again.');

        if (settingsResponse.ok) setSettings(await settingsResponse.json());
        else throw new Error('Failed to fetch application settings.');
      } catch (error) {
        console.error('Dashboard loading error:', error);
        localStorage.clear();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const hasPermission = (sectionKey) => {
    if (!user || !settings || !settings.dashboard) return false;
    if (user.role === 'owner') return true;
    return settings.dashboard[sectionKey]?.includes(user.role);
  };

  const canSeeAnalytics = () => {
      if (!user) return false;
      return ['owner', 'staff'].includes(user.role);
  };

  const canSeeBroadcasts = () => {
      if (!user) return false;
      return ['owner', 'staff'].includes(user.role);
  };

  const canSeeBookings = () => {
      if (!user) return false;
      return ['owner', 'staff'].includes(user.role);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading || !user) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ border: '4px solid #e2e8f0', borderTop: '4px solid #818cf8', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="background-shape shape1"></div>
      <div className="background-shape shape2"></div>

      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="greeting">{getGreeting()}, {user.username}!</h1>
          <p className="date-time">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <div className="header-right">
          <div className="welcome-message">
            Logged in as: <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <nav className="nav-grid">
        {hasPermission('canSeePatientManagement') && (
          <a href="/patients" className="nav-card">
            <div className="icon-container patients"><i className="fas fa-user-injured"></i></div>
            <div className="text-content"><h3>Patient Management</h3><p>View, add, and manage patient records.</p></div>
          </a>
        )}
        
        {/* NEW: Daily Report Card (Visible to all logged in users) */}
        <a href="/daily-report" className="nav-card">
            <div className="icon-container daily-report"><i className="fas fa-file-contract"></i></div>
            <div className="text-content"><h3>Daily Report</h3><p>Submit end-of-day operational summary.</p></div>
        </a>

        {canSeeBookings() && (
             <a href="/bookings" className="nav-card">
                 <div className="icon-container bookings"><i className="fas fa-globe"></i></div>
                 <div className="text-content"><h3>Website Bookings</h3><p>Manage requests from your website.</p></div>
             </a>
        )}

        {canSeeAnalytics() && (
             <a href="/analytics" className="nav-card">
                 <div className="icon-container analytics"><i className="fas fa-chart-pie"></i></div>
                 <div className="text-content"><h3>Data & Analytics</h3><p>Visualize clinic performance and trends.</p></div>
             </a>
        )}

        {canSeeBroadcasts() && (
             <a href="/broadcast" className="nav-card">
                 <div className="icon-container broadcast"><i className="fas fa-bullhorn"></i></div>
                 <div className="text-content"><h3>Broadcast Center</h3><p>Send emails and export contacts.</p></div>
             </a>
        )}

        {hasPermission('canSeeDoctorSchedule') && (
            <a href="/doctor-schedule" className="nav-card">
                <div className="icon-container doctor-schedule"><i className="fas fa-user-md"></i></div>
                <div className="text-content"><h3>Doctor's Schedule</h3><p>View and manage patient assignments.</p></div>
            </a>
        )}

        {hasPermission('canSeeAppointments') && (
          <a href="/appointments" className="nav-card">
            <div className="icon-container appointments"><i className="fas fa-calendar-alt"></i></div>
            <div className="text-content"><h3>Appointments</h3><p>Manage upcoming patient appointments.</p></div>
          </a>
        )}

        {hasPermission('canSeeInventoryManagement') && (
          <a href="/inventory/items" className="nav-card">
            <div className="icon-container inventory"><i className="fas fa-boxes"></i></div>
            <div className="text-content"><h3>Inventory</h3><p>Track and manage clinic supplies.</p></div>
          </a>
        )}

        {hasPermission('canSeeStaffManagement') && (
          <a href="/admin/staff-management" className="nav-card">
            <div className="icon-container staff-management"><i className="fas fa-users-cog"></i></div>
            <div className="text-content"><h3>Staff Management</h3><p>Add, remove, or manage staff accounts.</p></div>
          </a>
        )}

        {hasPermission('canSeeMyProfile') && (
          <a href="/profile" className="nav-card">
            <div className="icon-container profile"><i className="fas fa-id-card"></i></div>
            <div className="text-content"><h3>My Profile</h3><p>View and update your account details.</p></div>
          </a>
        )}

        {hasPermission('canSeeAllInventoryTransactions') && (
          <a href="/inventory/transactions" className="nav-card">
            <div className="icon-container inventory"><i className="fas fa-history"></i></div>
            <div className="text-content"><h3>Inventory Log</h3><p>Review history of all inventory movements.</p></div>
          </a>
        )}

        {hasPermission('canSeeRevenueReport') && (
          <a href="/revenue-report" className="nav-card">
            <div className="icon-container revenue-report"><i className="fas fa-chart-line"></i></div>
            <div className="text-content"><h3>Revenue Report</h3><p>Analyze total revenue over time.</p></div>
          </a>
        )}
        
        {user.role === 'owner' && (
          <a href="/settings" className="nav-card">
            <div className="icon-container settings"><i className="fas fa-cogs"></i></div>
            <div className="text-content"><h3>Settings</h3><p>Configure application permissions.</p></div>
          </a>
        )}
      </nav>
    </div>
  );
}
