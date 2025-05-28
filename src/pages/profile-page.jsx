// src/pages/profile-page.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // For sleek notifications
import './profile-page.css'; // Import the dedicated CSS file

// This component allows a logged-in user to view and update their personal profile details.
export default function ProfilePage() {
  const navigate = useNavigate();

  // State for general profile data (username, email)
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    role: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null); // For errors related to fetching/updating profile

  // State for password change form
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null); // For errors related to password change

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.log("[ProfilePage] No JWT token found. Redirecting to login.");
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        // UPDATED: Using your existing /api/auth/me endpoint
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData({
            username: data.username || '',
            email: data.email || '',
            role: data.role || '',
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        } else if (response.status === 401 || response.status === 403) {
          console.error(`[ProfilePage] Authentication error (${response.status}):`, response.statusText);
          localStorage.clear();
          toast.error("Authentication expired or unauthorized. Please log in.");
          navigate('/login');
        } else {
          const errorData = await response.json();
          setProfileError(errorData.error || `Failed to fetch profile. Status: ${response.status}`);
          console.error('[ProfilePage] API Error fetching profile:', response.status, response.statusText, errorData);
        }
      } catch (err) {
        setProfileError('Network error. Could not connect to the server. Please ensure the backend is running and the /api/auth/me endpoint exists.');
        console.error('[ProfilePage] Network Error fetching profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle changes for general profile form
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle changes for password change form
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle profile update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setProfileError(null);
    toast.dismiss();

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      navigate('/login');
      setSubmittingProfile(false);
      return;
    }

    // Client-side validation
    if (!profileData.username) {
      setProfileError('Username is required.');
      toast.error('Username is required.');
      setSubmittingProfile(false);
      return;
    }
    if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      setProfileError('Invalid email address format.');
      toast.error('Invalid email address format.');
      setSubmittingProfile(false);
      return;
    }

    try {
      const payload = {
        username: profileData.username,
        email: profileData.email || null, // Send null if empty string
      };

      // IMPORTANT: This PUT endpoint needs to be implemented on your backend
      // It should be specific for a user updating THEIR OWN profile (e.g., /api/user/profile)
      // NOT the /api/admin/users/:id endpoint which is for admin management.
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Profile updated successfully!');
        // Optionally update local storage if username changes and it's used elsewhere
        // localStorage.setItem('username', profileData.username);
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || "Authorization failed. Please log in again.");
        localStorage.clear();
        navigate('/login');
      } else if (response.status === 409) {
        setProfileError(data.error || 'Username or email already exists.');
        toast.error(data.error || 'Username or email already exists.');
      } else {
        setProfileError(data.error || `Failed to update profile. Status: ${response.status}`);
        toast.error(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError('Network error. Could not connect to the server.');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPassword(true);
    setPasswordError(null);
    toast.dismiss();

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      navigate('/login');
      setSubmittingPassword(false);
      return;
    }

    // Client-side validation
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmNewPassword) {
      setPasswordError('All password fields are required.');
      toast.error('All password fields are required.');
      setSubmittingPassword(false);
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      toast.error('New passwords do not match.');
      setSubmittingPassword(false);
      return;
    }
    if (passwordFormData.newPassword.length < 8) { // Example: minimum password length
      setPasswordError('New password must be at least 8 characters long.');
      toast.error('New password must be at least 8 characters long.');
      setSubmittingPassword(false);
      return;
    }

    try {
      // IMPORTANT: This PUT endpoint needs to be implemented on your backend
      // It should be specific for a user changing THEIR OWN password (e.g., /api/user/profile/password)
      const response = await fetch('http://localhost:5000/api/user/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordFormData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Password updated successfully!');
        // Clear password fields after success
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || "Authorization failed. Please log in again.");
        localStorage.clear();
        navigate('/login');
      } else {
        setPasswordError(data.error || `Failed to update password. Status: ${response.status}`);
        toast.error(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Network error. Could not connect to the server.');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmittingPassword(false);
    }
  };


  if (loadingProfile) {
    return (
      <div className="app-container">
        <div className="profile-page-container loading-state">
          <p className="info-message">Loading profile data...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (profileError && !submittingProfile) {
    return (
      <div className="app-container">
        <div className="profile-page-container error-state">
          <p className="info-message error">Error: {profileError}</p>
          <a href="/dashboard" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!profileData.username) {
    return (
      <div className="app-container">
        <div className="profile-page-container info-state">
          <p className="info-message">Profile data not found. Please log in.</p>
          <a href="/login" className="back-button">
            <i className="fas fa-sign-in-alt"></i> Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <header className="profile-header">
        <h1>My Profile</h1>
        <a href="/dashboard" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </a>
      </header>

      {/* General Profile Information Section */}
      <section className="profile-section">
        <h2>Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="your.email@example.com"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input type="text" value={profileData.role} disabled className="disabled-input" />
            </div>
            <div className="form-group">
              <label>Account Status</label>
              <input type="text" value={profileData.isActive ? 'Active' : 'Inactive'} disabled className="disabled-input" />
            </div>
            <div className="form-group">
              <label>Joined On</label>
              <input type="text" value={profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'} disabled className="disabled-input" />
            </div>
            <div className="form-group">
              <label>Last Updated</label>
              <input type="text" value={profileData.updatedAt ? new Date(profileData.updatedAt).toLocaleDateString() : 'N/A'} disabled className="disabled-input" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="save-button" disabled={submittingProfile}>
              {submittingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </section>

      {/* Password Change Section */}
      <section className="profile-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password *</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordFormData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordFormData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password *</label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={passwordFormData.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="save-button" disabled={submittingPassword}>
              {submittingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}