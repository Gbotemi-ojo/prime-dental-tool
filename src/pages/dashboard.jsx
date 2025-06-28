// src/pages/dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import './dashboard.css'; // Import the CSS file
import API_BASE_URL from '../config/api';

// This component is designed to be rendered by React Router
// where it conditionally renders components based on the current route and auth status.
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('jwtToken'); // Get token from localStorage
      const storedUserId = localStorage.getItem('userId');
      const storedUsername = localStorage.getItem('username');
      const storedRole = localStorage.getItem('role');

      if (token && storedUserId && storedUsername && storedRole) {
        // Optimistically set user from localStorage to avoid flicker
        setUser({
          id: parseInt(storedUserId),
          username: storedUsername,
          role: storedRole,
        });

        try {
          // Verify token and fetch fresh user data from backend
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData); // Update with fresh data
          } else {
            // Token might be expired or invalid, clear storage and redirect
            console.error('Failed to fetch user data:', response.statusText);
            localStorage.clear(); // Clear all auth related storage
            navigate('/login'); // Redirect to login
          }
        } catch (error) {
          console.error('Network error fetching user data:', error);
          localStorage.clear(); // Clear all auth related storage
          navigate('/login'); // Redirect to login
        }
      } else {
        // No token found, redirect to login
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]); // Add navigate to the dependency array

  const handleLogout = () => {
    localStorage.clear(); // Clear all stored user data (token, id, role, username)
    navigate('/login'); // Redirect to login page
  };

  if (!user) {
    return (
      <div className="app-container"> {/* Use app-container for centering loading message */}
        <div className="dashboard-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading dashboard...</p>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3F51B5', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '20px auto' }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Determine user roles for conditional rendering
  const isOwner = user.role === 'owner';
  const isStaff = user.role === 'staff';
  const isNurse = user.role === 'nurse';
  const isDoctor = user.role === 'doctor';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>EMR Dashboard</h1>
        <div className="welcome-message">
          Welcome, <span>{user.username}</span> ({user.role})!
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="nav-grid">
        {/* Patient Management */}
        {(isOwner || isStaff || isNurse || isDoctor) && (
          <a href="/patients" className="nav-card patients">
            <i className="icon fas fa-user-injured"></i>
            <h3>Patient Management</h3>
            <p>View, add, and manage patient demographic information and medical records.</p>
          </a>
        )}

        {/* Appointments (Accessible by Owner & Staff) */}
        {(isOwner || isStaff) && (
          <a href="/appointments" className="nav-card appointments">
            <i className="icon fas fa-calendar-alt"></i>
            <h3>Appointments</h3>
            <p>View and manage upcoming patient appointments and schedules.</p>
          </a>
        )}

        {/* Inventory Management (Accessible by Owner & Staff ONLY) */}
        {(isOwner || isStaff) && (
          <a href="/inventory/items" className="nav-card inventory">
            <i className="icon fas fa-boxes"></i>
            <h3>Inventory Management</h3>
            <p>Track stock levels, record usage, and manage clinic supplies.</p>
          </a>
        )}

        {/* Admin Tools (Accessible by Owner ONLY) */}
        {isOwner && (
          <a href="/admin/staff-management" className="nav-card admin">
            <i className="icon fas fa-users-cog"></i>
            <h3>Staff Management</h3>
            <p>Add, activate, deactivate, or remove staff accounts.</p>
          </a>
        )}

        {/* View Profile (Accessible by Owner, Staff, Nurse, and Doctor) */}
        {(isOwner || isStaff || isNurse || isDoctor) && (
          <a href="/profile" className="nav-card profile">
            <i className="icon fas fa-id-card"></i>
            <h3>My Profile</h3>
            <p>View and update your personal account details.</p>
          </a>
        )}

        {/* All Inventory Transactions (Accessible by Owner & Staff) */}
        {(isOwner || isStaff) && (
          <a href="/inventory/transactions" className="nav-card inventory">
            <i className="icon fas fa-history"></i>
            <h3>All Inventory Transactions</h3>
            <p>Review comprehensive history of all inventory movements.</p>
          </a>
        )}

        {/* Revenue Report (Accessible by Owner ONLY) */}
        {isOwner && (
          <a href="/revenue-report" className="nav-card revenue-report">
            <i className="icon fas fa-chart-line"></i> {/* Changed icon to chart-line for reports */}
            <h3>Revenue Report</h3>
            <p>View and analyze total revenue over different time periods.</p>
          </a>
        )}
      </nav>
    </div>
  );
}
