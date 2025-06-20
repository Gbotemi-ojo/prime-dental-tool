// src/pages/add-staff.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // For sleek notifications
import './add-staff.css'; // Import the dedicated CSS file
import API_BASE_URL from '../config/api';

// This component allows 'owner' roles to add new staff members.
export default function AddStaff() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '', // Changed default role to empty, forcing selection
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null); // For general page errors (e.g., auth)
  const [userRole, setUserRole] = useState(null); // Current logged-in user's role

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('role');
    setUserRole(role);

    if (!token) {
      console.log("[AddStaff] No JWT token found. Redirecting to login.");
      navigate('/login');
      return;
    }

    // Only 'owner' role can access this page
    if (role !== 'owner') {
      console.warn("[AddStaff] Unauthorized access: User is not an owner.");
      toast.error("You don't have permission to add staff members.");
      navigate('/admin/staff-management'); // Redirect unauthorized users
      return;
    }
    setLoading(false); // Finished initial auth check
  }, [navigate]);

  // Handles changes to form input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear previous errors
    toast.dismiss(); // Clear any existing toasts

    // Client-side validation
    if (!formData.username || !formData.password || !formData.confirmPassword || !formData.role) {
      setError('Username, Password, Confirm Password, and Role are required.');
      toast.error('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.');
      setSubmitting(false);
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address format.');
      toast.error('Invalid email address format.');
      setSubmitting(false);
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      localStorage.clear();
      navigate('/login');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email || null, // Send null if empty string
        role: formData.role, // Send the selected role
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/users/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Staff account created successfully!', {
          onClose: () => navigate('/admin/staff-management'), // Redirect on toast close
          autoClose: 2000,
        });
        // Clear form after successful submission
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '', // Reset role to empty after submission
        });
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || "Authorization failed. Please log in again.");
        localStorage.clear();
        navigate('/login');
      } else if (response.status === 409) {
        // Conflict, e.g., username or email already exists
        setError(data.error || 'A staff account with this username or email already exists.');
        toast.error(data.error || 'A staff account with this username or email already exists.');
      } else {
        setError(data.error || `Failed to create staff account. Status: ${response.status}`);
        toast.error(data.error || 'Failed to create staff account.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Network error or server is unreachable. Please try again later.');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="add-staff-container loading-state">
          <p className="info-message">Checking permissions...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Display error if not authorized or other initial errors
  if (error && !submitting) {
    return (
      <div className="app-container">
        <div className="add-staff-container error-state">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate('/admin/staff-management')} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Staff List
          </button>
        </div>
      </div>
    );
  }

  // If user is not owner, they shouldn't even see the form
  if (userRole !== 'owner') {
    return null; // The useEffect already handles redirection and toast
  }

  return (
    <div className="add-staff-container">
      <header className="add-staff-header">
        <h1>Add New Staff Member</h1>
        <button onClick={() => navigate('/admin/staff-management')} className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Staff List
        </button>
      </header>

      <form onSubmit={handleSubmit} className="add-staff-form">
        <div className="form-grid">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="e.g., janedoe"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., jane.doe@example.com"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter a strong password"
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
            />
          </div>

          {/* Role selection for Owner */}
          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option> {/* Added a default empty option */}
              <option value="staff">Staff</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option> {/* Added Doctor option */}
              {/* <option value="owner">Owner</option> // Uncomment if owners can create other owners */}
            </select>
          </div>
        </div> {/* End of form-grid */}

        <div className="form-actions">
          <button type="submit" className="save-button" disabled={submitting}>
            {submitting ? 'Adding Staff...' : 'Add Staff Member'}
          </button>
          <button type="button" onClick={() => navigate('/admin/staff-management')} className="cancel-button" disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
