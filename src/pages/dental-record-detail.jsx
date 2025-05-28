// src/pages/dental-record-detail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Make sure react-router-dom is installed
import './dental-record-detail.css'; // Ensure this CSS file is in the same directory

// This component is now ready to be used directly in your React Router setup.
// Example: <Route path="/patients/:patientId/dental-records/:recordId" element={<DentalRecordDetail />} />
export default function DentalRecordDetail() {
  // useParams hook extracts parameters directly from the URL
  const { patientId, recordId } = useParams();

  // Parse IDs to integers, as URL parameters are strings
  const parsedPatientId = parseInt(patientId);
  const parsedRecordId = parseInt(recordId);

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
        window.location.href = '/login'; // Redirect to login if no token
        return;
      }

      // Validate parsed IDs
      if (isNaN(parsedPatientId) || isNaN(parsedRecordId)) {
        setError("Invalid Patient ID or Record ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        // Fetch Patient Name (to display in header)
        // This is a separate API call to get the patient's name
        const patientResponse = await fetch(`http://localhost:5000/api/patients/${parsedPatientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatientName(patientData.name);
        } else {
          console.error("Failed to fetch patient name for record detail.");
          // You might set an error here too if patient name is crucial
        }

        // Fetch Dental Record Details for the specific patient and record
        const recordResponse = await fetch(`http://localhost:5000/api/patients/${parsedPatientId}/dental-records/${parsedRecordId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (recordResponse.ok) {
          const recordData = await recordResponse.json();
          setRecord(recordData);
        } else if (recordResponse.status === 404) {
          setError('Dental record not found.');
        } else if (recordResponse.status === 401 || recordResponse.status === 403) {
          localStorage.clear(); // Clear token if unauthorized/forbidden
          window.location.href = '/login'; // Redirect to login
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
  }, [parsedPatientId, parsedRecordId]); // Dependency array: re-run effect if IDs change

  // Helper to render quadrant data in a structured way
  const renderQuadrantData = (data) => {
    // Check if data is null/undefined or if all quadrant values are null
    if (!data || (data.q1 === null && data.q2 === null && data.q3 === null && data.q4 === null)) {
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
      <div className="app-container"> {/* Keep app-container for consistent centering/margins */}
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
          {/* Use parsedPatientId for back link */}
          <a href={`/patients/${parsedPatientId}`} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Patient Details
          </a>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="app-container">
        <div className="record-detail-container no-record-state">
          <p className="info-message">Dental record not found.</p>
          {/* Use parsedPatientId for back link */}
          <a href={`/patients/${parsedPatientId}`} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Patient Details
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="record-detail-container">
      <header className="detail-header">
        <h1>Dental Record for <span className="patient-name-highlight">{patientName || 'Patient'}</span></h1>
        <div className="actions">
          {/* Use parsedPatientId for back link */}
          <a href={`/patients/${parsedPatientId}`} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Patient Details
          </a>
          {/* EDIT DENTAL RECORD BUTTON - Renders if user is 'owner' or 'staff' */}
          {(userRole === 'owner' || userRole === 'staff') && (
            // Use parsedPatientId and record?.id for edit link
            <a href={`/patients/${parsedPatientId}/dental-records/${record?.id}/edit`} className="edit-button">
              <i className="fas fa-edit"></i> Edit Record
            </a>
          )}
        </div>
      </header>

      {/* --- GENERAL INFORMATION --- */}
      <section className="detail-section">
        <h2>General Information</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Record ID:</strong> <span>{record.id}</span>
          </div>
          <div className="detail-item">
            {/* Display date nicely */}
            <strong>Record Date:</strong> <span>{record.recordDate ? new Date(record.recordDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Doctor:</strong> <span>{record.doctorUsername || 'N/A'}</span>
          </div>
          <div className="detail-item full-width">
            <strong>Chief Complaint:</strong> <span>{record.complaint || 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* --- HISTORY --- */}
      <section className="detail-section">
        <h2>History</h2>
        <div className="detail-grid">
          <div className="detail-item full-width">
            <strong>History of Present Complaint:</strong> <span>{record.historyOfPresentComplaint || 'N/A'}</span>
          </div>
          <div className="detail-item full-width">
            <strong>Past Dental History:</strong> <span>{record.pastDentalHistory || 'N/A'}</span>
          </div>
          <div className="detail-item full-width">
            <strong>Family & Social History:</strong> <span>{record.familySocialHistory || 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* --- MEDICAL HISTORY (MEDICATIONS) --- */}
      <section className="detail-section">
        <h2>Medical History (Medications)</h2>
        <div className="medication-tags-group">
          {record.medicationS && <span className="medication-tag tag-steroids">Steroids</span>}
          {record.medicationH && <span className="medication-tag tag-heart">Heart Disease</span>}
          {record.medicationA && <span className="medication-tag tag-asthma">Asthma</span>}
          {record.medicationD && <span className="medication-tag tag-diabetes">Diabetes</span>}
          {record.medicationE && <span className="medication-tag tag-epilepsy">Epilepsy</span>}
          {record.medicationPUD && <span className="medication-tag tag-pud">PUD (Peptic Ulcer Disease)</span>}
          {record.medicationBloodDisorder && <span className="medication-tag tag-blood">Blood Disorder</span>}
          {record.medicationAllergy && <span className="medication-tag tag-allergy">Allergy</span>}
          {!record.medicationS && !record.medicationH && !record.medicationA && !record.medicationD &&
           !record.medicationE && !record.medicationPUD && !record.medicationBloodDisorder && !record.medicationAllergy &&
           <span className="info-message no-medications">No specific medications noted.</span>
          }
        </div>
      </section>

      {/* --- CLINICAL EXAMINATIONS --- */}
      <section className="detail-section">
        <h2>Clinical Examinations</h2>
        <div className="detail-grid">
          <div className="detail-item full-width">
            <strong>Extra-Oral Examination:</strong> <span>{record.extraOralExamination || 'N/A'}</span>
          </div>
          <div className="detail-item full-width">
            <strong>Intra-Oral Examination:</strong> <span>{record.intraOralExamination || 'N/A'}</span>
          </div>
        </div>

        <h3>Oral Charting</h3>
        <div className="quadrant-display-area">
          <div className="quadrant-category">
            <h4>Teeth Present</h4>
            {renderQuadrantData(record.teethPresent)}
          </div>
          <div className="quadrant-category">
            <h4>Carious Cavity</h4>
            {renderQuadrantData(record.cariousCavity)}
          </div>
          <div className="quadrant-category">
            <h4>Filled Teeth</h4>
            {renderQuadrantData(record.filledTeeth)}
          </div>
          <div className="quadrant-category">
            <h4>Missing Teeth</h4>
            {renderQuadrantData(record.missingTeeth)}
          </div>
          <div className="quadrant-category">
            <h4>Fractured Teeth</h4>
            {renderQuadrantData(record.fracturedTeeth)}
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item full-width">
            <strong>Periodontal Condition:</strong> <span>{record.periodontalCondition || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Oral Hygiene:</strong> <span>{record.oralHygiene || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Calculus:</strong> <span>{record.calculus || 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* --- DIAGNOSIS & TREATMENT --- */}
      <section className="detail-section">
        <h2>Diagnosis & Treatment</h2>
        <div className="detail-grid">
          <div className="detail-item full-width">
            <strong>Investigations:</strong> <span>{record.investigations || 'N/A'}</span>
          </div>
          <div className="detail-item full-width">
            <strong>X-ray Findings:</strong> <span>{record.xrayFindings || 'N/A'}</span>
          </div>
          <div className="detail-item full-width">
            <strong>Provisional Diagnosis:</strong>
            <span>{Array.isArray(record.provisionalDiagnosis) && record.provisionalDiagnosis.length > 0 ? record.provisionalDiagnosis.join(', ') : 'N/A'}</span>
          </div>
          <div className="detail-item full-width">
            <strong>Treatment Plan:</strong>
            <span>{Array.isArray(record.treatmentPlan) && record.treatmentPlan.length > 0 ? record.treatmentPlan.join(', ') : 'N/A'}</span>
          </div>
        </div>
      </section>
    </div>
  );
}