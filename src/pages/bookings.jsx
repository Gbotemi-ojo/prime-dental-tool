// src/pages/bookings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './bookings.css';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  // NEW: State for branch filtering
  const [branchFilter, setBranchFilter] = useState('All');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('jwtToken');
      setUserRole(localStorage.getItem('role'));

      if (!token) {
         navigate('/login');
         return;
       }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/website-bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          throw new Error('Failed to fetch bookings.');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`Mark this booking as ${newStatus}?`)) return;
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/website-bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}` 
         },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Booking marked as ${newStatus}`);
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      } else {
         throw new Error('Failed to update status.');
       }
    } catch (error) {
       toast.error(error.message);
     }
  };

  const handleSendReminder = async (id) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/api/website-bookings/${id}/reminder`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Reminder email sent to patient!");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reminder.");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // NEW: Filter the bookings based on the selected branch
  const filteredBookings = bookings.filter(booking => {
    if (branchFilter === 'All') return true;
    return booking.branch === branchFilter;
  });

  if (loading) return <div className="spinner">Loading...</div>;

  return (
    <div className="bookings-page-container">
      <div className="bookings-card">
        <header className="bookings-header">
          <h1>Website Bookings</h1>
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button">
            Back to Dashboard
          </button>
        </header>

        {/* NEW: Branch Filter Controls */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <label htmlFor="branchFilter" style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Filter by Branch:</label>
          <select 
            id="branchFilter" 
            value={branchFilter} 
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '1rem', minWidth: '200px' }}
          >
            <option value="All">All Branches</option>
            <option value="Iju">Iju</option>
            <option value="Iyana Ipaja">Iyana Ipaja</option>
          </select>
        </div>

        <div className="bookings-table-responsive">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Patient Details</th>
                <th>Branch</th>
                <th>Requested Date</th>
                <th>Reason / Complaint</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                    {bookings.length === 0 ? 'No booking requests found.' : 'No booking requests found for the selected branch.'}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      {new Date(booking.createdAt).toLocaleDateString()}
                      <br />
                      <small style={{color: '#999'}}>
                        {new Date(booking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </small>
                    </td>
                    
                    <td className="col-contact">
                      <strong>{booking.name}</strong>
                      <small>{booking.sex} | {booking.phoneNumber}</small>
                      {booking.email && <small>{booking.email}</small>}
                    </td>

                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                        {booking.branch || <span style={{color: '#999', fontStyle: 'italic', fontWeight: 'normal'}}>Not specified</span>}
                      </span>
                    </td>

                    <td>
                      {booking.requestedAppointmentDate 
                         ? new Date(booking.requestedAppointmentDate).toLocaleDateString() 
                         : <span style={{color: '#999', fontStyle: 'italic'}}>Not specified</span>}
                    </td>

                    <td className="col-complaint">
                      {booking.complaint || 'No complaint provided.'}
                    </td>

                    <td>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        {/* Send Reminder Button */}
                        <button 
                           className="btn-action btn-reminder" 
                           title="Send Email Reminder"
                          onClick={() => handleSendReminder(booking.id)}
                          disabled={!booking.email}
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>

                        {/* Confirm/Reject Buttons (Only for Pending) */}
                        {booking.status === 'pending' && (
                          <>
                            <button 
                               className="btn-action btn-confirm" 
                               title="Confirm Appointment"
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button 
                               className="btn-action btn-reject" 
                               title="Reject Request"
                              onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}