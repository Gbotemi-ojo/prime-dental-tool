// src/pages/patient-detail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './patient-detail.css';
import API_BASE_URL from '../config/api';

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [dentalRecords, setDentalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);

      if (!token) {
        navigate('/login');
        return;
      }

      if (role !== 'owner' && role !== 'doctor' && role !== 'staff' && role !== 'nurse') {
        navigate('/dashboard');
        return;
      }
      
      const parsedPatientId = parseInt(patientId);
      if (isNaN(parsedPatientId)) {
        setError("Invalid Patient ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatient(patientData);
        } else {
          const errorData = await patientResponse.json();
          setError(errorData.error || 'Failed to fetch patient details.');
          if (patientResponse.status === 401 || patientResponse.status === 403) {
            localStorage.clear();
            navigate('/login');
          }
          setLoading(false);
          return;
        }

        const recordsResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          setDentalRecords(recordsData);
        } else {
          const errorData = await recordsResponse.json();
          setError(errorData.error || 'Failed to fetch dental records.');
        }

      } catch (err) {
        setError('Network error. Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId, navigate]);

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
          <button onClick={() => navigate('/patients')} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to List
          </button>
          <button onClick={() => navigate(`/patients/${patient.id}/edit`)} className="edit-button">
            <i className="fas fa-user-edit"></i> Edit Bio
          </button>
          {(userRole === 'owner' || userRole === 'doctor') && (
            <button onClick={() => navigate(`/patients/${patient.id}/dental-records/new`)} className="add-record-button">
              <i className="fas fa-plus-circle"></i> Add Dental Record
            </button>
          )}
          {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse') && (
            <>
              <button onClick={() => navigate(`/patients/${patient.id}/invoice`)} className="send-invoice-button">
                <i className="fas fa-file-invoice"></i> Send Invoice
              </button>
              <button onClick={() => navigate(`/patients/${patient.id}/receipts`)} className="send-receipt-button">
                <i className="fas fa-receipt"></i> Send Receipt
              </button>
            </>
          )}
        </div>
      </header>

      <section className="detail-section">
        <h2>Demographic Information</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Patient ID:</strong> <span>{patient.id}</span>
          </div>
          <div className="detail-item">
            <strong>Phone Number:</strong>{' '}
            {(userRole === 'doctor' || userRole === 'nurse') ? (
              <span className="restricted-info">Restricted</span>
            ) : (
              <span>{patient.phoneNumber || 'N/A'}</span>
            )}
          </div>
          <div className="detail-item">
            <strong>Email:</strong>{' '}
            {(userRole === 'doctor' || userRole === 'nurse') ? (
              <span className="restricted-info">Restricted</span>
            ) : (
              <span>{patient.email || 'N/A'}</span>
            )}
          </div>
          {/* UPDATED: Added Address field with role-based restriction */}
          <div className="detail-item">
            <strong>Address:</strong>{' '}
            {(userRole === 'doctor' || userRole === 'nurse') ? (
              <span className="restricted-info">Restricted</span>
            ) : (
              <span>{patient.address || 'N/A'}</span>
            )}
          </div>
          <div className="detail-item">
            <strong>Date of Birth:</strong> <span>{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Sex:</strong> <span>{patient.sex}</span>
          </div>
          <div className="detail-item">
            <strong>HMO Covered:</strong>{' '}
            <span>
              {patient.hmo && patient.hmo.name ? 
                <strong className="hmo-covered-yes">Yes ({patient.hmo.name})</strong> : 
                <strong className="hmo-covered-no">No</strong>
              }
            </span>
          </div>
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
                    <td title={record.complaint || ''}>{record.complaint || 'N/A'}</td>
                    <td title={Array.isArray(record.provisionalDiagnosis) ? record.provisionalDiagnosis.join(', ') : record.provisionalDiagnosis || ''}>
                      {Array.isArray(record.provisionalDiagnosis) ? record.provisionalDiagnosis.join(', ') : record.provisionalDiagnosis || 'N/A'}
                    </td>
                    <td title={Array.isArray(record.treatmentPlan) ? record.treatmentPlan.join(', ') : record.treatmentPlan || ''}>
                      {Array.isArray(record.treatmentPlan) ? record.treatmentPlan.join(', ') : record.treatmentPlan || 'N/A'}
                    </td>
                    <td>{record.doctorUsername || 'N/A'}</td>
                    <td>
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
