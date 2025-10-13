// src/pages/patient-detail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./patient-detail.css";
import API_BASE_URL from "../config/api";

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [dentalRecords, setDentalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [settings, setSettings] = useState(null); // ADDED: State for settings

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("jwtToken");
      const role = localStorage.getItem("role");
      setUserRole(role);

      if (!token) {
        navigate("/login");
        return;
      }

      const parsedPatientId = parseInt(patientId);
      if (isNaN(parsedPatientId)) {
        setError("Invalid Patient ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        // MODIFIED: Fetch patient, records, and settings in parallel
        const [patientResponse, recordsResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatient(patientData);
        } else {
          const errorData = await patientResponse.json();
          throw new Error(errorData.error || "Failed to fetch patient details.");
        }

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          setDentalRecords(recordsData);
        } else {
           const errorData = await recordsResponse.json();
           console.warn("Could not fetch dental records:", errorData.error);
        }

        if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            setSettings(settingsData);
        } else {
            throw new Error("Failed to fetch application settings.");
        }

      } catch (err) {
        setError(err.message || "Network error. Could not connect to the server.");
        if (err.message?.includes('401') || err.message?.includes('403')) {
            localStorage.clear();
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId, navigate]);

  // --- NEW: Permission checking helper function ---
  const hasPermission = (permissionKey) => {
    if (!userRole || !settings || !settings.patientManagement) return false;
    if (userRole === 'owner') return true;
    return settings.patientManagement[permissionKey]?.includes(userRole);
  };

  if (loading || !settings) { // MODIFIED: Wait for settings to load
    return (
      <div className="app-container">
        <div
          className="patient-detail-container"
          style={{ textAlign: "center", padding: "50px" }}
        >
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
          <button
            onClick={() => navigate("/patients")}
            className="back-button"
            style={{
              margin: "20px auto",
              display: "block",
              width: "fit-content",
            }}
          >
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
          <button
            onClick={() => navigate("/patients")}
            className="back-button"
            style={{
              margin: "20px auto",
              display: "block",
              width: "fit-content",
            }}
          >
            <i className="fas fa-arrow-left"></i> Back to Patient List
          </button>
        </div>
      </div>
    );
  }
  
  const canSeeContact = hasPermission('canSeeContactDetails');

  return (
    <div className="patient-detail-container">
      <header className="detail-header">
        <h1>Patient: {patient.name}</h1>
        {/* MODIFIED: Replaced hardcoded role checks with hasPermission */}
        <div className="actions">
          <button onClick={() => navigate("/patients")} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to List
          </button>
          {hasPermission('canEditBio') && (
            <button
              onClick={() => navigate(`/patients/${patient.id}/edit`)}
              className="edit-button"
            >
              <i className="fas fa-user-edit"></i> Edit Bio
            </button>
          )}
          {hasPermission('canAddDentalRecord') && (
            <button
              onClick={() =>
                navigate(`/patients/${patient.id}/records/new`) // CORRECTED ROUTE
              }
              className="add-record-button"
            >
              <i className="fas fa-plus-circle"></i> Add Dental Record
            </button>
          )}
          {hasPermission('canSendInvoice') && (
              <button
                onClick={() => navigate(`/patients/${patient.id}/invoice`)}
                className="send-invoice-button"
              >
                <i className="fas fa-file-invoice"></i> Send Invoice
              </button>
          )}
          {hasPermission('canSendReceipt') && (
              <button
                onClick={() => navigate(`/patients/${patient.id}/receipts`)}
                className="send-receipt-button"
              >
                <i className="fas fa-receipt"></i> Send Receipt
              </button>
          )}
        </div>
      </header>

      <section className="detail-section">
        <h2>Demographic Information</h2>
        {/* MODIFIED: Replaced hardcoded role checks with a single permission check */}
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Patient ID:</strong> <span>{patient.id}</span>
          </div>
          <div className="detail-item">
            <strong>Phone Number:</strong>{" "}
            {canSeeContact ? (
              <span>{patient.phoneNumber || "N/A"}</span>
            ) : (
              <span className="restricted-info">Restricted</span>
            )}
          </div>
          <div className="detail-item">
            <strong>Email:</strong>{" "}
            {canSeeContact ? (
              <span>{patient.email || "N/A"}</span>
            ) : (
              <span className="restricted-info">Restricted</span>
            )}
          </div>
          <div className="detail-item">
            <strong>Address:</strong>{" "}
            {canSeeContact ? (
              <span>{patient.address || "N/A"}</span>
            ) : (
              <span className="restricted-info">Restricted</span>
            )}
          </div>
          <div className="detail-item">
            <strong>Date of Birth:</strong>{" "}
            <span>
              {patient.dateOfBirth
                ? new Date(patient.dateOfBirth).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div className="detail-item">
            <strong>Sex:</strong> <span>{patient.sex}</span>
          </div>
          <div className="detail-item">
            <strong>HMO Covered:</strong>{" "}
            <span>
              {patient.hmo && patient.hmo.name ? (
                <strong className="hmo-covered-yes">
                  Yes ({patient.hmo.name})
                </strong>
              ) : (
                <strong className="hmo-covered-no">No</strong>
              )}
            </span>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h2>Dental Records</h2>
        {dentalRecords.length === 0 ? (
          <p className="info-message">
            No dental records found for this patient.
          </p>
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
                    <td data-label="Record ID">{record.id}</td>
                    <td data-label="Date">
                      {record.createdAt
                        ? new Date(record.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td data-label="Complaint" title={record.complaint || ""}>
                      {record.complaint || "N/A"}
                    </td>
                    <td
                      data-label="Provisional Diagnosis"
                      title={
                        Array.isArray(record.provisionalDiagnosis)
                          ? record.provisionalDiagnosis.join(", ")
                          : record.provisionalDiagnosis || ""
                      }
                    >
                      {Array.isArray(record.provisionalDiagnosis)
                        ? record.provisionalDiagnosis.join(", ")
                        : record.provisionalDiagnosis || "N/A"}
                    </td>
                    <td
                      data-label="Treatment Plan"
                      title={
                        Array.isArray(record.treatmentPlan)
                          ? record.treatmentPlan.join(", ")
                          : record.treatmentPlan || ""
                      }
                    >
                      {Array.isArray(record.treatmentPlan)
                        ? record.treatmentPlan.join(", ")
                        : record.treatmentPlan || "N/A"}
                    </td>
                    <td data-label="Doctor">
                      {record.doctorUsername || "N/A"}
                    </td>
                    <td data-label="Actions">
                      <button
                        onClick={() =>
                          navigate(
                            `/patients/${patient.id}/records/${record.id}` // CORRECTED ROUTE
                          )
                        }
                        className="view-record-button"
                      >
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

