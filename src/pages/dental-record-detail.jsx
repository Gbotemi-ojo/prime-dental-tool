// src/pages/dental-record-detail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './dental-record-detail.css';
import API_BASE_URL from '../config/api';

export default function DentalRecordDetail() {
  const { patientId, recordId } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchRecordDetails = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);

      if (!token) {
        navigate('/login');
        return;
      }

      const parsedPatientId = parseInt(patientId);
      const parsedRecordId = parseInt(recordId);
      if (isNaN(parsedPatientId) || isNaN(parsedRecordId)) {
        setError("Invalid Patient ID or Record ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatientName(patientData.name);
        } else {
          console.error("Failed to fetch patient name for record detail.");
        }

        const recordResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records/${parsedRecordId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (recordResponse.ok) {
          const recordData = await recordResponse.json();
          setRecord(recordData);
        } else if (recordResponse.status === 404) {
          setError('Dental record not found.');
        } else if (recordResponse.status === 401 || recordResponse.status === 403) {
          localStorage.clear();
          navigate('/login');
        } else {
          const errorData = await recordResponse.json();
          setError(errorData.error || `Failed to fetch dental record details. Status: ${recordResponse.status}`);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server.');
        console.error('Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [patientId, recordId, navigate]);

  const renderQuadrantData = (data) => {
    if (!data || Object.values(data).every(v => v === null || v === '')) {
      return <div className="quadrant-grid-na">N/A</div>;
    }
    return (
      <div className="quadrant-grid">
        <div className="quadrant-item q1"><strong>Q1:</strong> <span>{data.q1 || 'N/A'}</span></div>
        <div className="quadrant-item q2"><strong>Q2:</strong> <span>{data.q2 || 'N/A'}</span></div>
        <div className="quadrant-item q3"><strong>Q3:</strong> <span>{data.q3 || 'N/A'}</span></div>
        <div className="quadrant-item q4"><strong>Q4:</strong> <span>{data.q4 || 'N/A'}</span></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="record-detail-container loading-state">
          <p className="info-message">Loading dental record details...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="record-detail-container error-state">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate(`/patients/${patientId}`)} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Patient Details
          </button>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="app-container">
        <div className="record-detail-container no-record-state">
          <p className="info-message">Dental record not found.</p>
          <button onClick={() => navigate(`/patients/${patientId}`)} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Patient Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="record-detail-container">
      <header className="detail-header">
        <h1>Dental Record for <span className="patient-name-highlight">{patientName || 'Patient'}</span></h1>
        <div className="actions">
          <button onClick={() => navigate(`/patients/${patientId}`)} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Patient Details
          </button>
          {(userRole === 'owner' || userRole === 'staff' || userRole === 'doctor' || userRole === 'nurse') && (
            <>
              <button onClick={() => navigate(`/patients/${patientId}/dental-records/${record?.id}/edit`)} className="edit-button">
                <i className="fas fa-edit"></i> Edit Record
              </button>
              <button onClick={() => navigate(`/patients/${patientId}/invoice`)} className="send-invoice-button">
                  <i className="fas fa-paper-plane"></i> Send Invoice
              </button>
              <button onClick={() => navigate(`/patients/${patientId}/receipts`)} className="send-receipt-button">
                  <i className="fas fa-envelope"></i> Send Receipt
              </button>
            </>
          )}
        </div>
      </header>

      <section className="detail-section">
        <h2>General Information</h2>
        <div className="detail-grid">
          <div className="detail-item"><strong>Record ID:</strong> <span>{record.id}</span></div>
          <div className="detail-item"><strong>Record Date:</strong> <span>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><strong>Doctor:</strong> <span>{record.doctorUsername || 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>Chief Complaint:</strong> <span>{record.complaint || 'N/A'}</span></div>
        </div>
      </section>

      <section className="detail-section">
        <h2>History</h2>
        <div className="detail-grid">
          <div className="detail-item full-width"><strong>History of Present Complaint:</strong> <span>{record.historyOfPresentComplaint || 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>Past Dental History:</strong> <span>{record.pastDentalHistory || 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>Family & Social History:</strong> <span>{record.familySocialHistory || 'N/A'}</span></div>
        </div>
      </section>

      <section className="detail-section">
        <h2>Medical History (Medications)</h2>
        <div className="medication-tags-group">
          {record.medicationS && <span className="medication-tag tag-steroids">Sickle cell</span>}
          {record.medicationH && <span className="medication-tag tag-heart">Heart Disease</span>}
          {record.medicationA && <span className="medication-tag tag-asthma">Asthma</span>}
          {record.medicationD && <span className="medication-tag tag-diabetes">Diabetes</span>}
          {record.medicationE && <span className="medication-tag tag-epilepsy">Epilepsy</span>}
          {record.medicationPUD && <span className="medication-tag tag-pud">PUD (Peptic Ulcer Disease)</span>}
          {record.medicationBloodDisorder && <span className="medication-tag tag-blood">Blood Disorder</span>}
          {record.medicationAllergy && <span className="medication-tag tag-allergy">Allergy</span>}
          {record.medicationHIV && <span className="medication-tag tag-hiv">HIV</span>}
          {record.medicationHepatitis && <span className="medication-tag tag-hepatitis">Hepatitis</span>}
          {!record.medicationS && !record.medicationH && !record.medicationA && !record.medicationD && !record.medicationE && !record.medicationPUD && !record.medicationBloodDisorder && !record.medicationAllergy && !record.medicationHIV && !record.medicationHepatitis &&
           <span className="info-message no-medications">No specific medications noted.</span>
          }
        </div>
      </section>

      <section className="detail-section">
        <h2>Clinical Examinations</h2>
        <div className="detail-grid">
          <div className="detail-item full-width"><strong>Extra-Oral Examination:</strong> <span>{record.extraOralExamination || 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>Intra-Oral Examination:</strong> <span>{record.intraOralExamination || 'N/A'}</span></div>
        </div>
        <h3>Oral Charting</h3>
        <div className="quadrant-display-area">
          <div className="quadrant-category"><h4>Teeth Present</h4>{renderQuadrantData(record.teethPresent)}</div>
          <div className="quadrant-category"><h4>Carious Cavity</h4>{renderQuadrantData(record.cariousCavity)}</div>
          <div className="quadrant-category"><h4>Filled Teeth</h4>{renderQuadrantData(record.filledTeeth)}</div>
          <div className="quadrant-category"><h4>Missing Teeth</h4>{renderQuadrantData(record.missingTeeth)}</div>
          <div className="quadrant-category"><h4>Fractured Teeth</h4>{renderQuadrantData(record.fracturedTeeth)}</div>
        </div>
        <div className="detail-grid">
          <div className="detail-item full-width"><strong>Periodontal Condition:</strong> <span>{record.periodontalCondition || 'N/A'}</span></div>
          <div className="detail-item"><strong>Oral Hygiene:</strong> <span>{record.oralHygiene || 'N/A'}</span></div>
          <div className="detail-item"><strong>Calculus:</strong> <span>{record.calculus || 'N/A'}</span></div>
        </div>
      </section>

      <section className="detail-section">
        <h2>Diagnosis & Treatment</h2>
        <div className="detail-grid">
          <div className="detail-item full-width"><strong>Investigations:</strong> <span>{record.investigations || 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>X-ray Findings:</strong> <span>{record.xrayFindings || 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>Provisional Diagnosis:</strong><span>{Array.isArray(record.provisionalDiagnosis) && record.provisionalDiagnosis.length > 0 ? record.provisionalDiagnosis.join(', ') : 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>Treatment Plan:</strong><span>{Array.isArray(record.treatmentPlan) && record.treatmentPlan.length > 0 ? record.treatmentPlan.join(', ') : 'N/A'}</span></div>
          <div className="detail-item full-width"><strong>Treatment Done:</strong><span>{record.treatmentDone || 'N/A'}</span></div>
        </div>
        {record.xrayUrl && (
          <div className="xray-image-section">
            <h3>X-ray Image</h3>
            <a href={record.xrayUrl} target="_blank" rel="noopener noreferrer" title="Click to view full image">
              <img src={record.xrayUrl} alt={`X-ray for ${patientName}`} className="xray-image" />
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
