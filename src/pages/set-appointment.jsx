// src/pages/set-appointment.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './set-appointment.css'; // New CSS file for styling

const SetAppointmentPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [interval, setInterval] = useState('1 week');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const appointmentIntervals = [
        '1 day', '2 days', '3 days', '1 week', '2 weeks', '1 month', '6 weeks', '3 months', '6 months'
    ];

    useEffect(() => {
        const fetchPatientDetails = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setPatient(data);
                } else {
                    setError('Failed to fetch patient details.');
                }
            } catch (err) {
                setError('Network error fetching patient details.');
            } finally {
                setLoading(false);
            }
        };

        fetchPatientDetails();
    }, [patientId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/schedule-appointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ interval })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Appointment set for ${patient.name}!`);
                navigate('/patients'); // Navigate back to the patient list
            } else {
                throw new Error(result.error || 'Failed to set appointment.');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="set-appointment-container"><p>Loading patient...</p></div>;
    }

    if (!patient) {
        return <div className="set-appointment-container"><p>Patient not found.</p></div>;
    }

    return (
        <div className="set-appointment-container">
            <div className="form-card">
                <button onClick={() => navigate(-1)} className="back-link">
                    <i className="fas fa-chevron-left"></i> Go Back
                </button>
                
                <div className="card-header">
                    <i className="fas fa-calendar-plus header-icon"></i>
                    <h2>Set Next Appointment</h2>
                    <p>Schedule a follow-up for <strong>{patient.name}</strong></p>
                </div>
                
                <form onSubmit={handleSubmit} className="appointment-form">
                    <div className="form-group">
                        <label htmlFor="appointment-interval">Recall Period</label>
                        <div className="custom-select-wrapper">
                            <select 
                                id="appointment-interval" 
                                value={interval} 
                                onChange={(e) => setInterval(e.target.value)}
                                className="custom-select"
                                disabled={submitting}
                            >
                                {appointmentIntervals.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <i className="fas fa-angle-down select-arrow"></i>
                        </div>
                    </div>

                    {error && <p className="error-message-form">{error}</p>}
                    
                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="button-spinner"></span> Scheduling...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check-circle"></i> Confirm Appointment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetAppointmentPage;
