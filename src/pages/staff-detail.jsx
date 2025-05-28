// src/pages/staff-detail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // For sleek notifications
import './staff-detail.css'; // Import the dedicated CSS file

// This component displays the details of a specific staff member.
export default function StaffDetail() {
  const { userId } = useParams(); // Get userId from the URL
  const navigate = useNavigate();

  const [staffMember, setStaffMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null); // Current logged-in user's role
  const [currentLoggedInUserId, setCurrentLoggedInUserId] = useState(null); // ID of the currently logged-in user

  // State for confirmation modals
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false); // To disable buttons during action

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('role');
    const loggedInId = localStorage.getItem('userId');
    setUserRole(role);
    setCurrentLoggedInUserId(loggedInId);

    if (!token) {
      console.log("[StaffDetail] No JWT token found. Redirecting to login.");
      navigate('/login');
      return;
    }

    // Only 'owner' role can view staff details, or a staff member can view their own details.
    // Adjust this logic if you want staff to view other staff.
    if (role !== 'owner' && String(loggedInId) !== String(userId)) {
      toast.error("You don't have permission to view this staff member's details.");
      navigate('/admin/staff-management'); // Redirect if not authorized
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
        // Backend API endpoint to fetch a single user by ID
        // You'll need to create this route on your backend: GET /api/admin/users/:id
        const response = await fetch(`https://prime-dental-tool-backend.vercel.app/api/admin/users/${parsedUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setStaffMember(data);
        } else if (response.status === 401 || response.status === 403) {
          console.error(`[StaffDetail] Authentication error (${response.status}):`, response.statusText);
          localStorage.clear();
          toast.error("Authentication expired or unauthorized. Please log in.");
          navigate('/login');
        } else if (response.status === 404) {
          setError('Staff member not found.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to fetch staff details. Status: ${response.status}`);
          console.error('[StaffDetail] API Error:', response.status, response.statusText, errorData);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server. Please ensure the backend is running and the /api/admin/users/:id endpoint exists.');
        console.error('[StaffDetail] Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [userId, navigate, currentLoggedInUserId]); // Add currentLoggedInUserId to dependencies

  // Handle Activate/Deactivate Status
  const handleToggleStatus = async () => {
    setIsActionSubmitting(true);
    toast.dismiss(); // Clear existing toasts

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      navigate('/login');
      setIsActionSubmitting(false);
      return;
    }

    try {
      const newStatus = !staffMember.isActive; // Toggle current status
      const response = await fetch(`https://prime-dental-tool-backend.vercel.app/api/admin/users/${staffMember.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Staff account ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        // Update local state to reflect the change immediately
        setStaffMember((prev) => ({ ...prev, isActive: newStatus, updatedAt: new Date().toISOString() }));
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || "Authorization failed. You don't have permission to change status.");
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error(data.error || `Failed to update staff status.`);
        setError(data.error || `Failed to update staff status. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error toggling staff status:', err);
      toast.error('Network error. Could not update staff status.');
      setError('Network error. Could not update staff status.');
    } finally {
      setIsActionSubmitting(false);
      setShowDeactivateModal(false); // Close modal
    }
  };

  // Handle Delete Staff Member
  const handleDeleteStaff = async () => {
    setIsActionSubmitting(true);
    toast.dismiss(); // Clear existing toasts

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      navigate('/login');
      setIsActionSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`https://prime-dental-tool-backend.vercel.app/api/admin/users/${staffMember.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Staff account deleted successfully!', {
          onClose: () => navigate('/admin/staff-management'), // Redirect to staff list after deletion
          autoClose: 2000,
        });
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || "Authorization failed. You don't have permission to delete this account.");
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error(data.error || `Failed to delete staff account.`);
        setError(data.error || `Failed to delete staff account. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error deleting staff account:', err);
      toast.error('Network error. Could not delete staff account.');
      setError('Network error. Could not delete staff account.');
    } finally {
      setIsActionSubmitting(false);
      setShowDeleteModal(false); // Close modal
    }
  };


  if (loading) {
    return (
      <div className="app-container">
        <div className="staff-detail-container loading-state">
          <p className="info-message">Loading staff member details...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="staff-detail-container error-state">
          <p className="info-message error">Error: {error}</p>
          <a href="/admin/staff-management" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Staff List
          </a>
        </div>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="app-container">
        <div className="staff-detail-container info-state">
          <p className="info-message">Staff member not found.</p>
          <a href="/admin/staff-management" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Staff List
          </a>
        </div>
      </div>
    );
  }

  // Determine if the logged-in user can perform actions on this profile
  const canEditOrDelete = userRole === 'owner';
  // A user cannot deactivate/delete themselves if they are the owner role
  const isSelfOwner = (userRole === 'owner' && String(staffMember.id) === String(currentLoggedInUserId));

  return (
    <div className="staff-detail-container">
      <header className="detail-header">
        <h1>Staff Member: {staffMember.username}</h1>
        <div className="actions">
          <a href="/admin/staff-management" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Staff List
          </a>
          {canEditOrDelete && (
            <>
              {/* Edit button */}
              <a href={`/admin/staff-management/${staffMember.id}/edit`} className="edit-button">
                <i className="fas fa-edit"></i> Edit Profile
              </a>

              {/* Deactivate/Activate button */}
              {staffMember.role !== 'owner' && ( // Cannot deactivate/activate an 'owner' role
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className={`toggle-status-button ${staffMember.isActive ? 'deactivate' : 'activate'}`}
                  disabled={isActionSubmitting}
                >
                  <i className={`fas fa-${staffMember.isActive ? 'user-slash' : 'user-check'}`}></i>
                  {staffMember.isActive ? 'Deactivate Account' : 'Activate Account'}
                </button>
              )}

              {/* Delete button */}
              {staffMember.role !== 'owner' && ( // Cannot delete an 'owner' role
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="delete-button"
                  disabled={isActionSubmitting}
                >
                  <i className="fas fa-trash-alt"></i> Delete Account
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <section className="detail-section">
        <h2>Personal Information</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Username:</strong> <span>{staffMember.username}</span>
          </div>
          <div className="detail-item">
            <strong>Email:</strong> <span>{staffMember.email || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Role:</strong> <span className={`role-badge role-${staffMember.role.toLowerCase()}`}>{staffMember.role}</span>
          </div>
          <div className="detail-item">
            <strong>Status:</strong> <span className={`status-badge status-${staffMember.isActive ? 'active' : 'inactive'}`}>
              {staffMember.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="detail-item">
            <strong>Joined On:</strong> <span>{staffMember.createdAt ? new Date(staffMember.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Last Updated:</strong> <span>{staffMember.updatedAt ? new Date(staffMember.updatedAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* Deactivate/Activate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Account {staffMember.isActive ? 'Deactivation' : 'Activation'}</h2>
              <button className="close-button" onClick={() => setShowDeactivateModal(false)}>&times;</button>
            </div>
            <p className="modal-message">
              Are you sure you want to {staffMember.isActive ? 'deactivate' : 'activate'} the account for <strong>{staffMember.username}</strong>?
              {staffMember.isActive ? " This will prevent them from logging in." : " This will allow them to log in."}
            </p>
            <div className="modal-actions">
              <button onClick={handleToggleStatus} className={staffMember.isActive ? 'deactivate-confirm-button' : 'activate-confirm-button'} disabled={isActionSubmitting}>
                {isActionSubmitting ? 'Processing...' : (staffMember.isActive ? 'Confirm Deactivate' : 'Confirm Activate')}
              </button>
              <button onClick={() => setShowDeactivateModal(false)} className="cancel-button" disabled={isActionSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Account Deletion</h2>
              <button className="close-button" onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>
            <p className="modal-message danger-text">
              Are you absolutely sure you want to **permanently delete** the account for <strong>{staffMember.username}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={handleDeleteStaff} className="delete-confirm-button" disabled={isActionSubmitting}>
                {isActionSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="cancel-button" disabled={isActionSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
