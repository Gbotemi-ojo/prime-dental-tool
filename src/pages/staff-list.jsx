// src/pages/staff-list.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // For sleek notifications
import './staff-list.css'; // Import the dedicated CSS file

// This component displays a list of staff members (users with 'owner' or 'staff' roles).
export default function StaffList() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState(null); // Current logged-in user's role

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaffMembers = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);

      if (!token) {
        console.log("[StaffList] No JWT token found. Redirecting to login.");
        navigate('/login');
        return;
      }

      // Only 'owner' role can view staff list, based on your backend authorizeRoles.
      if (role !== 'owner') {
        toast.error("You don't have permission to view staff members.");
        navigate('/dashboard');
        return;
      }

      try {
        // --- IMPORTANT: Updated API endpoint to match your backend ---
        const response = await fetch('http://localhost:5000/api/admin/users/staff', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStaffMembers(data);
        } else if (response.status === 401 || response.status === 403) {
          console.error(`[StaffList] Authentication error (${response.status}):`, response.statusText);
          localStorage.clear();
          toast.error("Authentication expired or unauthorized. Please log in.");
          navigate('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to fetch staff members. Status: ${response.status}`);
          console.error('[StaffList] API Error:', response.status, response.statusText, errorData);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server. Please ensure the backend is running and the /api/admin/users/staff endpoint exists.');
        console.error('[StaffList] Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffMembers();
  }, [navigate]); // Add navigate to dependency array

  // Filter staff members based on search term
  const filteredStaff = staffMembers.filter(member =>
    member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="app-container">
        <div className="staff-list-container loading-state">
          <p className="info-message">Loading staff data...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="staff-list-container error-state">
          <p className="info-message error">Error: {error}</p>
          <a href="/dashboard" className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-list-container">
      <header className="staff-list-header">
        <h1>Staff Management</h1>
        <div className="actions">
          <a href="/dashboard" className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </a>
          {/* Only 'owner' can add new staff */}
          {userRole === 'owner' && (
            <a href="/admin/staff-management/new" className="add-staff-button">
              <i className="fas fa-user-plus"></i> Add New Staff
            </a>
          )}
        </div>
      </header>

      <section className="search-filter-section">
        <input
          type="text"
          placeholder="Search staff by username, email, or role..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>

      {filteredStaff.length === 0 ? (
        <p className="info-message">No staff members found. Try adjusting your search or add a new staff member.</p>
      ) : (
        <div className="table-responsive">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined On</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td>{member.username}</td>
                  <td>{member.email || 'N/A'}</td>
                  <td className={`role-${member.role.toLowerCase()}`}>{member.role}</td>
                  <td className={`status-${member.isActive ? 'active' : 'inactive'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td>{member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <a href={`/admin/staff-management/${member.id}`} className="view-details-button"> {/* UPDATED ROUTE HERE */}
                      View Details
                    </a>
                    {/* Only 'owner' can edit staff members (via status or full edit) */}
                    {userRole === 'owner' && (
                      <a href={`/admin/staff-management/${member.id}/edit`} className="edit-button"> {/* UPDATED ROUTE HERE */}
                        Edit
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}