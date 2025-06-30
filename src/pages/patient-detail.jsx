// src/pages/patient-detail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import './patient-detail.css'; // Import the CSS file for patient detail
import API_BASE_URL from '../config/api';

// This component is designed to be rendered by React Router
// Example: <Route path="/patients/:patientId" element={<PatientDetail />} />
export default function PatientDetail() {
  // Directly get the patientId from the URL parameters as defined in App.jsx
  const { patientId } = useParams(); // Destructuring 'patientId' directly
  const navigate = useNavigate(); // Initialize navigate hook for programmatic redirection

  const [patient, setPatient] = useState(null);
  const [dentalRecords, setDentalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null); // To determine access for buttons

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');

      setUserRole(role); // Set role state immediately from localStorage

      if (!token) {
        console.log("[PatientDetail] No JWT token found in localStorage. Redirecting to login.");
        navigate('/login'); // Use navigate for redirection
        return;
      }

      // Restriction 3: Only owner and doctor should be allowed on this page
      if (role !== 'owner' && role !== 'doctor') {
        console.log(`[PatientDetail] User role '${role}' not authorized to view this page. Redirecting to dashboard.`);
        navigate('/dashboard'); // Redirect unauthorized users
        return;
      }

      // Parse the patientId from URL string to integer for API calls
      const parsedPatientId = parseInt(patientId); // Use 'patientId' directly from useParams
      if (isNaN(parsedPatientId)) {
        setError("Invalid Patient ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        // Fetch Patient Details
        const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatient(patientData);
        } else if (patientResponse.status === 404) {
          setError('Patient not found.');
          setLoading(false);
          return;
        } else if (patientResponse.status === 401 || patientResponse.status === 403) {
          console.error(`[PatientDetail] Authentication error (${patientResponse.status}):`, patientResponse.statusText);
          localStorage.clear(); // Clear token if unauthorized/forbidden
          navigate('/login'); // Redirect to login
          return;
        } else {
          const errorData = await patientResponse.json();
          setError(errorData.error || `Failed to fetch patient details. Status: ${patientResponse.status}`);
          console.error('[PatientDetail] Patient API Error:', patientResponse.status, patientResponse.statusText, errorData);
          setLoading(false);
          return;
        }

        // Fetch Dental Records for this patient
        const recordsResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          setDentalRecords(recordsData);
        } else if (recordsResponse.status === 401 || recordsResponse.status === 403) {
          console.error(`[PatientDetail] Authentication error (${recordsResponse.status}):`, recordsResponse.statusText);
          localStorage.clear();
          navigate('/login'); // Redirect to login
          return;
        } else {
          const errorData = await recordsResponse.json();
          setError(errorData.error || `Failed to fetch dental records. Status: ${recordsResponse.status}`);
          console.error('[PatientDetail] Records API Error:', recordsResponse.status, recordsResponse.statusText, errorData);
        }

      } catch (err) {
        setError('Network error. Could not connect to the server. Please ensure the backend is running and accessible.');
        console.error('Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Re-run effect if patientId or navigate function changes
    fetchData();
  }, [patientId, navigate, userRole]); // Added userRole to dependency array to react to its changes

  if (loading) {
    return (
      <div className="app-container">
        <div className="patient-detail-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p className="info-message">Loading patient details...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="patient-detail-container">
          <p className="info-message error">Error: {error}</p>
          {/* Link back to patient list */}
          <button onClick={() => navigate('/patients')} className="back-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
            <i className="fas fa-arrow-left"></i> Back to Patient List
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="app-container">
        <div className="patient-detail-container">
          <p className="info-message">Patient data not found.</p>
          {/* Link back to patient list */}
          <button onClick={() => navigate('/patients')} className="back-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
            <i className="fas fa-arrow-left"></i> Back to Patient List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-detail-container">
      <header className="detail-header">
        <h1>Patient: {patient.name}</h1>
        <div className="actions">
          {/* Back to List Button */}
          <button onClick={() => navigate('/patients')} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to List
          </button>

          {/* ADD DENTAL RECORD BUTTON - Now visible for owner, staff, nurse, and doctor */}
          {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse' || userRole === 'doctor') && (
            <button onClick={() => navigate(`/patients/${patient.id}/dental-records/new`)} className="add-record-button">
              <i className="fas fa-plus-circle"></i> Add Dental Record
            </button>
          )}

          {/* Buttons for Invoice and Receipt - Not visible for doctor */}
          {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse') && ( // Restriction 1: Not visible for doctor
            <>
              {/* Send Invoice Button */}
              <button onClick={() => navigate(`/patients/${patient.id}/invoice`)} className="send-invoice-button">
                <i className="fas fa-file-invoice"></i> Send Invoice
              </button>
              {/* Send Receipt Button */}
              <button onClick={() => navigate(`/patients/${patient.id}/receipts`)} className="send-receipt-button">
                <i className="fas fa-receipt"></i> Send Receipt
              </button>
            </>
          )}
        </div>
      </header>

      <section className="detail-section">
        <h2>Demographic Information</h2>
        <div className="detail-grid"> {/* Apply detail-grid for proper layout */}
          <div className="detail-item">
            <strong>Patient ID:</strong> <span>{patient.id}</span>
          </div>
          <div className="detail-item">
            <strong>Phone Number:</strong>{' '}
            {/* Restriction 2: Conditional rendering for phone number */}
            {(userRole === 'doctor') ? (
              <span>null</span> // Display N/A for doctors
            ) : (
              <span>{patient.phoneNumber || 'null'}</span>
            )}
          </div>
          <div className="detail-item">
            <strong>Email:</strong>{' '}
            {/* Restriction 2: Conditional rendering for email */}
            {(userRole === 'doctor') ? (
              <span>null</span> // Display null for doctors
            ) : (
              <span>{patient.email || 'null'}</span>
            )}
          </div>
          <div className="detail-item">
            <strong>Date of Birth:</strong> <span>{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Sex:</strong> <span>{patient.sex}</span>
          </div>
          {/* NEW: HMO Covered status display */}
          <div className="detail-item">
            <strong>HMO Covered:</strong>{' '}
            <span>
              {patient.hmo && patient.hmo.name ? `Yes (${patient.hmo.name})` : 'No'}
            </span>
          </div>
          {/* Add more patient details as needed */}
        </div>
      </section>

      <section className="detail-section">
        <h2>Dental Records</h2>
        {dentalRecords.length === 0 ? (
          <p className="info-message">No dental records found for this patient.</p>
        ) : (
          <div className="records-table-responsive">
            <table className="medical-records-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Date</th>
                  <th>Complaint</th>
                  <th>Provisional Diagnosis</th>
                  <th>Treatment Plan</th>
                  <th>Doctor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dentalRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{record.complaint || 'N/A'}</td>
                    {/* Display Provisional Diagnosis as comma-separated string */}
                    <td>{Array.isArray(record.provisionalDiagnosis) ? record.provisionalDiagnosis.join(', ') : record.provisionalDiagnosis || 'N/A'}</td>
                    {/* Display Treatment Plan as comma-separated string */}
                    <td>{Array.isArray(record.treatmentPlan) ? record.treatmentPlan.join(', ') : record.treatmentPlan || 'N/A'}</td>
                    <td>{record.doctorUsername || 'N/A'}</td>
                    <td>
                      {/* Link to dental record detail now includes patient.id */}
                      <button onClick={() => navigate(`/patients/${patient.id}/dental-records/${record.id}`)} className="view-record-button">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
