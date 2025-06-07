// src/pages/patient-list.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for programmatic navigation
import './patient-list.css'; // Make sure this CSS file exists and is linked!
import API_BASE_URL from '../config/api';

// Main App component to render the PatientList
// In a real application, this would be integrated into your routing.
export default function App() {
  return (
    <div className="app-container">
      <PatientList />
    </div>
  );
}

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState(null); // To determine access for 'Add Patient' and 'Receipts'
  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role'); // Get role from local storage
      setUserRole(role);

      if (!token) {
        console.log("No JWT token found in localStorage. Redirecting to login.");
        navigate('/login'); // Use navigate instead of window.location.href
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        } else if (response.status === 401 || response.status === 403) {
          console.error(`Authentication error (${response.status}):`, response.statusText);
          localStorage.clear(); // Clear all auth related storage
          navigate('/login'); // Redirect to login
        } else {
          let errorMsg = `Failed to fetch patients. Status: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMsg = errorData.error;
            } else if (errorData && errorData.message) {
              errorMsg = errorData.message;
            }
          } catch (jsonError) {
            console.warn("Could not parse error response as JSON:", jsonError);
          }
          setError(errorMsg);
          console.error('API Error details:', response.status, response.statusText, errorMsg);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server. Please ensure the backend is running and accessible.');
        console.error('Network Error during fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [navigate]); // Add navigate to dependency array

  // Filtered patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    // Only include phone/email in search if the user is NOT a nurse
    (userRole !== 'nurse' && patient.phoneNumber && patient.phoneNumber.includes(searchTerm)) || // Added null check for safety
    (userRole !== 'nurse' && patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="app-container">
        <div className="patient-list-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p className="info-message">Loading patient data...</p>
          <div className="spinner"></div> {/* Using CSS for spinner */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="patient-list-container">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-list-container">
      <header className="patient-list-header">
        <h1>Patient Directory</h1>
        <div className="actions">
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
          {/* Add New Patient button - still only for owner/staff */}
          {(userRole === 'owner' || userRole === 'staff') && (
            <button onClick={() => navigate('/')} className="add-patient-button">
              <i className="fas fa-plus-circle"></i> Add New Patient
            </button>
          )}
        </div>
      </header>

      <section className="search-filter-section">
        <input
          type="text"
          placeholder="Search patients by name..." // Changed placeholder as nurses can only search by name effectively
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>

      {filteredPatients.length === 0 ? (
        <p className="info-message">No patients found. Try adjusting your search or add a new patient.</p>
      ) : (
        <div className="table-responsive"> {/* Wrapper for horizontal scrolling on small screens */}
          <table className="patient-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Date of Birth</th>
                <th>Sex</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.name}</td>
                  <td>
                    {/* Conditional rendering for phone number */}
                    {userRole === 'nurse' ? (
                      <span className="restricted-info">[Restricted]</span> // Better indicator
                    ) : (
                      patient.phoneNumber
                    )}
                  </td>
                  <td>
                    {/* Conditional rendering for email */}
                    {userRole === 'nurse' ? (
                      <span className="restricted-info">[Restricted]</span> // Better indicator
                    ) : (
                      patient.email || 'N/A'
                    )}
                  </td>
                  <td>{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                  <td>{patient.sex}</td>
                  <td className="table-actions-cell">
                    {/* Hide "View Details" button from nurses */}
                    {(userRole === 'owner' || userRole === 'staff') && (
                      <button onClick={() => navigate(`/patients/${patient.id}`)} className="table-view-details-button">
                        View Details
                      </button>
                    )}
                    {/* NEW: Invoice and Receipts Buttons per patient - NOW visible for nurses too */}
                    {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse') && ( // ADDED 'nurse' here
                      <>
                        <button onClick={() => navigate(`/patients/${patient.id}/invoice`)} className="table-invoice-button">
                          <i className="fas fa-file-invoice"></i> Invoice
                        </button>
                        <button onClick={() => navigate(`/patients/${patient.id}/receipts`)} className="table-receipts-button">
                          <i className="fas fa-receipt"></i> Receipts
                        </button>
                      </>
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

