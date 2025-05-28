// src/pages/edit-staff.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // For sleek notifications
import './edit-staff.css'; // Import the dedicated CSS file

// This component allows 'owner' roles to edit details of an existing staff member.
export default function EditStaff() {
  const { userId } = useParams(); // Get userId from the URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '', // Can be 'staff' or 'owner'
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null); // Current logged-in user's role

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('role');
    setUserRole(role);

    if (!token) {
      console.log("[EditStaff] No JWT token found. Redirecting to login.");
      navigate('/login');
      return;
    }

    // Only 'owner' role can access this page
    if (role !== 'owner') {
      console.warn("[EditStaff] Unauthorized access: User is not an owner.");
      toast.error("You don't have permission to edit staff members.");
      navigate('/admin/staff-management'); // Redirect unauthorized users
      return;
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      setError("Invalid Staff User ID provided in the URL.");
      setLoading(false);
      return;
    }

    const fetchStaffDetails = async () => {
      try {
        // Use the existing GET /api/admin/users/:id endpoint
        const response = await fetch(`https://prime-dental-tool-backend.vercel.app/api/admin/users/${parsedUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure we don't allow editing of the logged-in owner's role or status
          // to prevent accidental self-lockout if they are the only owner.
          // However, the backend should also enforce this.
          setFormData({
            username: data.username || '',
            email: data.email || '',
            role: data.role || 'staff', // Default to staff if not set
            isActive: data.isActive !== undefined ? data.isActive : true,
          });
        } else if (response.status === 401 || response.status === 403) {
          console.error(`[EditStaff] Authentication error (${response.status}):`, response.statusText);
          localStorage.clear();
          toast.error("Authentication expired or unauthorized. Please log in.");
          navigate('/login');
        } else if (response.status === 404) {
          setError('Staff member not found.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to fetch staff details. Status: ${response.status}`);
          console.error('[EditStaff] API Error:', response.status, response.statusText, errorData);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server. Please ensure the backend is running.');
        console.error('[EditStaff] Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [userId, navigate]); // Depend on userId and navigate

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear previous errors
    toast.dismiss(); // Clear any existing toasts

    const token = localStorage.getItem('jwtToken');
    const loggedInUserId = localStorage.getItem('userId');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      navigate('/login');
      setSubmitting(false);
      return;
    }

    // Basic client-side validation
    if (!formData.username || !formData.role) {
      setError("Username and Role are required.");
      toast.error("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address format.');
      toast.error('Invalid email address format.');
      setSubmitting(false);
      return;
    }

    // Prevent an owner from changing their own role or deactivating themselves
    // This is a client-side guard, backend should also enforce this.
    if (String(userId) === String(loggedInUserId) && formData.role !== 'owner') {
        toast.error("You cannot change your own role from 'owner'.");
        setSubmitting(false);
        return;
    }
    if (String(userId) === String(loggedInUserId) && !formData.isActive) {
        toast.error("You cannot deactivate your own account.");
        setSubmitting(false);
        return;
    }

    try {
      const payload = {
        username: formData.username,
        email: formData.email || null,
        role: formData.role,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString(), // Update timestamp
      };

      // You'll need a PUT /api/admin/users/:id endpoint on your backend
      // This endpoint should handle updating user details (username, email, role, isActive)
      const response = await fetch(`https://prime-dental-tool-backend.vercel.app/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Staff member updated successfully!', {
          onClose: () => navigate(`/admin/staff-management/${userId}`), // Redirect to detail page
          autoClose: 2000,
        });
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || "Authorization failed. Please log in again.");
        localStorage.clear();
        navigate('/login');
      } else if (response.status === 409) {
        setError(data.error || 'Conflict: Username or email already exists.');
        toast.error(data.error || 'Username or email already exists for another user.');
      } else {
        setError(data.error || `Failed to update staff member. Status: ${response.status}`);
        toast.error(data.error || 'Failed to update staff member.');
      }
    } catch (err) {
      console.error('Error updating staff member:', err);
      setError('Network error. Could not connect to the server.');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="edit-staff-container loading-state">
          <p className="info-message">Loading staff member details for editing...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !submitting) {
    return (
      <div className="app-container">
        <div className="edit-staff-container error-state">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate(`/admin/staff-management/${userId}`)} className="cancel-button">
            <i className="fas fa-arrow-left"></i> Back to Staff Details
          </button>
        </div>
      </div>
    );
  }

  // If user is not owner or staff member not found, prevent form rendering
  if (userRole !== 'owner' || !formData.username) {
      return null; // Redirection and toast handled by useEffect
  }

  // Determine if the logged-in user is editing their own 'owner' account
  const isEditingOwnOwnerAccount = (userRole === 'owner' && String(userId) === String(localStorage.getItem('userId')) && formData.role === 'owner');

  return (
    <div className="edit-staff-container">
      <header className="edit-staff-header">
        <h1>Edit Staff Member: {formData.username}</h1>
        <button onClick={() => navigate(`/admin/staff-management/${userId}`)} className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Staff Details
        </button>
      </header>

      <form onSubmit={handleSubmit} className="edit-staff-form">
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

          {/* Role */}
          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              // Disable role change if editing own owner account
              disabled={isEditingOwnOwnerAccount}
            >
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
            {isEditingOwnOwnerAccount && (
                <p className="field-note">You cannot change your own role from 'owner'.</p>
            )}
          </div>

          {/* Is Active Status */}
          <div className="form-group checkbox-group-single">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                // Disable deactivation if editing own owner account
                disabled={isEditingOwnOwnerAccount}
              />
              <label htmlFor="isActive">Account is Active</label>
            </div>
            {isEditingOwnOwnerAccount && (
                <p className="field-note">You cannot deactivate your own account.</p>
            )}
          </div>
        </div> {/* End of form-grid */}

        <div className="form-actions">
          <button type="submit" className="save-button" disabled={submitting}>
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/admin/staff-management/${userId}`)} className="cancel-button" disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
