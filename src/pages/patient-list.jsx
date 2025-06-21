// src/pages/patient-list.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useNavigate } from 'react-router-dom';
import './patient-list.css';
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
  // State to hold all patients fetched from the API
  const [allPatients, setAllPatients] = useState([]);
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  // State for the selected date filter, initialized to today's date
  const [selectedDate, setSelectedDate] = useState(new Date());
  // State for loading indicator
  const [loading, setLoading] = useState(true);
  // State for error messages
  const [error, setError] = useState(null);
  // State to store user role for access control
  const [userRole, setUserRole] = useState(null);
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Helper function to format a Date object or ISO string to YYYY-MM-DD
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Effect hook to fetch patients when the component mounts or navigate changes
  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);

      // Redirect to login if no token is found
      if (!token) {
        console.log("No JWT token found in localStorage. Redirecting to login.");
        navigate('/login');
        return;
      }

      try {
        // Fetch all patients (client-side filtering will be applied later)
        const response = await fetch(`${API_BASE_URL}/api/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAllPatients(data); // Store all fetched patients
        } else if (response.status === 401 || response.status === 403) {
          // Handle authentication/authorization errors
          console.error(`Authentication error (${response.status}):`, response.statusText);
          localStorage.clear(); // Clear storage and redirect
          navigate('/login');
        } else {
          // Handle other API errors
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
        // Handle network errors
        setError('Network error. Could not connect to the server. Please ensure the backend is running and accessible.');
        console.error('Network Error during fetch:', err);
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    fetchPatients();
  }, [navigate]); // navigate is a dependency as it's used inside the effect

  // Memoized filtering logic for patients based on search term and selected date
  const filteredPatients = useMemo(() => {
    let tempPatients = allPatients;

    // 1. Filter by selected date
    if (selectedDate) {
      const formattedSelectedDate = formatDateForInput(selectedDate);
      tempPatients = tempPatients.filter(patient => {
        // Assuming 'createdAt' is the field that stores the patient's creation date (e.g., ISO string)
        // If your API uses a different field name (e.g., 'addedDate'), update 'patient.createdAt' accordingly.
        return patient.createdAt && formatDateForInput(patient.createdAt) === formattedSelectedDate;
      });
    }

    // 2. Filter by search term (applied after date filter)
    return tempPatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Conditional search by phone/email for non-nurse roles
      (userRole !== 'nurse' && patient.phoneNumber && patient.phoneNumber.includes(searchTerm)) ||
      (userRole !== 'nurse' && patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allPatients, searchTerm, selectedDate, userRole]); // Re-run when these dependencies change

  // Loading state rendering
  if (loading) {
    return (
      <div className="app-container">
        <div className="patient-list-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p className="info-message">Loading patient data...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Error state rendering
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

  // Main rendering of the patient list
  return (
    <div className="patient-list-container">
      <header className="patient-list-header">
        <h1>Patient Directory</h1>
        <div className="actions">
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
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
          placeholder="Search patients by name..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Date Picker Input */}
        <input
          type="date"
          className="date-input" // New class for styling
          value={formatDateForInput(selectedDate)} // Display selected date
          onChange={(e) => setSelectedDate(new Date(e.target.value))} // Update selected date
        />
      </section>

      {filteredPatients.length === 0 ? (
        <p className="info-message">No patients found for the selected criteria. Try adjusting your search or date filter.</p>
      ) : (
        <div className="table-responsive">
          <table className="patient-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Date of Birth</th>
                <th>Sex</th>
                <th>HMO Covered</th> {/* NEW: HMO Covered column header */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.name}</td>
                  <td>
                    {userRole === 'nurse' ? (
                      <span className="restricted-info">[Restricted]</span>
                    ) : (
                      patient.phoneNumber
                    )}
                  </td>
                  <td>
                    {userRole === 'nurse' ? (
                      <span className="restricted-info">[Restricted]</span>
                    ) : (
                      patient.email || 'N/A'
                    )}
                  </td>
                  <td>{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                  <td>{patient.sex}</td>
                  <td>{patient.hmo ? 'Yes' : 'No'}</td> {/* NEW: HMO Covered status */}
                  <td className="table-actions-cell">
                    {/* Hide "View Details" button from nurses and doctors */}
                    {(userRole === 'owner' || userRole === 'staff') && ( // Doctor role explicitly removed here
                      <button onClick={() => navigate(`/patients/${patient.id}`)} className="table-view-details-button">
                        View Details
                      </button>
                    )}
                    {/* Invoice and Receipts Buttons - Hidden from doctors */}
                    {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse') && ( // Doctor role explicitly removed here
                      <>
                        <button onClick={() => navigate(`/patients/${patient.id}/invoice`)} className="table-invoice-button">
                          <i className="fas fa-file-invoice"></i> Invoice
                        </button>
                        <button onClick={() => navigate(`/patients/${patient.id}/receipts`)} className="table-receipts-button">
                          <i className="fas fa-receipt"></i> Receipts
                        </button>
                      </>
                    )}
                    {/* NEW: Edit Bio Button - Visible to owner and staff */}
                    {(userRole === 'owner' || userRole === 'staff') && (
                      <button onClick={() => navigate(`/patients/${patient.id}/edit`)} className="table-edit-bio-button">
                        <i className="fas fa-user-edit"></i> Edit Bio
                      </button>
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
