// src/pages/appointments.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE_URL from '../config/api';
import './appointments.css';

const AppointmentCard = ({ patient, onSendReminder, onNavigate, sendingReminderId, viewMode }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasOutstanding = parseFloat(patient.outstanding) > 0;
    const isSending = sendingReminderId === patient.id;

    const formattedOutstanding = hasOutstanding
        ? parseFloat(patient.outstanding).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })
        : '0.00';
    
    const parseJsonField = (jsonString) => {
        if (!jsonString) return 'N/A';
        try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(item => item.name || item).join(', ');
            }
            return parsed.name || JSON.stringify(parsed);
        } catch {
            return jsonString;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No Date';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <li className="appointment-card">
            <div className="card-main-content">
                <div className="patient-info">
                    <span className="patient-name" onClick={onNavigate}>{patient.name}</span>
                    <span className="patient-contact">{patient.phoneNumber || 'No contact info'}</span>
                    {viewMode === 'all' && patient.nextAppointmentDate && (
                        <span className="appointment-date-display">
                            Appointment: {formatDate(patient.nextAppointmentDate)}
                        </span>
                    )}
                    {hasOutstanding && (
                         <div className="outstanding-badge">
                            Outstanding: ₦{formattedOutstanding}
                        </div>
                    )}
                </div>
                <div className="card-actions">
                    <button 
                        className="send-reminder-btn"
                        onClick={onSendReminder}
                        disabled={!patient.email || isSending}
                        title={!patient.email ? "Patient has no email address" : "Send reminder email"}
                    >
                        {isSending ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Sending...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-envelope"></i> Send Reminder
                            </>
                        )}
                    </button>
                </div>
            </div>
             <div 
                className="card-details-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? 'Hide Details' : 'Show Details'} <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </div>
            {isExpanded && (
                <div className="card-collapsible-content">
                    <div className="detail-item">
                        <span className="label">Latest Treatment Done</span>
                        <div className="value">{patient.latestTreatmentDone || 'N/A'}</div>
                    </div>
                     <div className="detail-item">
                        <span className="label">Treatment Plan</span>
                        <div className="value">{parseJsonField(patient.latestTreatmentPlan)}</div>
                    </div>
                    <div className="detail-item">
                        <span className="label">Provisional Diagnosis</span>
                        <div className="value">{parseJsonField(patient.latestProvisionalDiagnosis)}</div>
                    </div>
                </div>
            )}
        </li>
    );
};

const AppointmentsPage = () => {
    const [allPatients, setAllPatients] = useState([]);
    const [viewMode, setViewMode] = useState('today');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sendingReminderId, setSendingReminderId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatients = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/patients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setAllPatients(data);
                } else {
                    setError(`Failed to fetch patients. Status: ${response.status}`);
                    if (response.status === 401 || response.status === 403) {
                        localStorage.clear();
                        navigate('/login');
                    }
                }
            } catch (err) {
                setError('Network error. Could not connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [navigate]);

    const toLocalISOString = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const appointments = useMemo(() => {
        if (!allPatients.length) return [];

        let filteredAppointments = [];

        if (viewMode === 'all') {
            filteredAppointments = allPatients.filter(patient => patient.nextAppointmentDate);
            filteredAppointments.sort((a, b) => {
                const dateA = new Date(a.nextAppointmentDate);
                const dateB = new Date(b.nextAppointmentDate);
                return dateA - dateB;
            });
        } else {
            const targetDateStr = toLocalISOString(selectedDate);
            filteredAppointments = allPatients.filter(patient => {
                if (!patient.nextAppointmentDate) return false;
                const appointmentDateStr = toLocalISOString(patient.nextAppointmentDate);
                return appointmentDateStr === targetDateStr;
            });
        }
        return filteredAppointments;
    }, [allPatients, selectedDate, viewMode]);

    useEffect(() => {
        if (viewMode === 'today' || viewMode === 'tomorrow') {
            const newDate = new Date();
            if (viewMode === 'tomorrow') {
                newDate.setDate(newDate.getDate() + 1);
            }
            setSelectedDate(newDate);
        }
    }, [viewMode]);

    const handleDateChange = (e) => {
        const date = new Date(e.target.value + 'T00:00:00');
        setSelectedDate(date);
        setViewMode('byDate');
    };

    const handleSendReminder = async (patientId) => {
        const token = localStorage.getItem('jwtToken');
        setSendingReminderId(patientId);
        try {
            const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/send-reminder`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message, { theme: "colored" });
            } else {
                toast.error(data.error || 'Failed to send reminder.', { theme: "colored" });
            }
        } catch (err) {
            toast.error('Network error. Could not send reminder.', { theme: "colored" });
        } finally {
            setSendingReminderId(null);
        }
    };
    
    const getHeaderText = () => {
        if (viewMode === 'today') return "Today's";
        if (viewMode === 'tomorrow') return "Tomorrow's";
        if (viewMode === 'all') return "All";
        return `Date: ${toLocalISOString(selectedDate)}`;
    }

    return (
        <>
             <ToastContainer
                position="bottom-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
             />
            <div className="appointments-container">
                <header className="appointments-header">
                    <h1>Appointments Schedule</h1>
                    <button onClick={() => navigate('/dashboard')} className="back-button">
                        <i className="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                </header>

                <div className="view-controls">
                    <div className="toggle-buttons">
                        <button 
                            className={`toggle-btn ${viewMode === 'today' ? 'active' : ''}`} 
                            onClick={() => setViewMode('today')}>
                            <i className="fas fa-calendar-day"></i> Today
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'tomorrow' ? 'active' : ''}`} 
                            onClick={() => setViewMode('tomorrow')}>
                            <i className="fas fa-calendar-check"></i> Tomorrow
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'byDate' ? 'active' : ''}`} 
                            onClick={() => setViewMode('byDate')}>
                            <i className="fas fa-calendar-alt"></i> Search by Date
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`} 
                            onClick={() => setViewMode('all')}>
                            <i className="fas fa-list"></i> All Appointments
                        </button>
                    </div>
                    {viewMode === 'byDate' && (
                        <div className="date-picker-wrapper">
                             <input
                                type="date"
                                className="date-input-appointments"
                                value={toLocalISOString(selectedDate)}
                                onChange={handleDateChange}
                            />
                        </div>
                    )}
                </div>

                <main className="appointments-list-section">
                    <h2 style={{ marginBottom: '20px', color: 'var(--text-dark)' }}>
                        {getHeaderText()} Appointments ({appointments.length})
                    </h2>
                    {loading ? (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <p>Loading appointments...</p>
                        </div>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : appointments.length > 0 ? (
                        <ul className="appointments-list">
                            {appointments.map(patient => (
                                <AppointmentCard 
                                    key={patient.id} 
                                    patient={patient}
                                    onSendReminder={() => handleSendReminder(patient.id)}
                                    onNavigate={() => navigate(`/patients/${patient.id}`)}
                                    sendingReminderId={sendingReminderId}
                                    viewMode={viewMode} // Pass viewMode prop
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="no-appointments-message">
                            <i className="far fa-calendar-times"></i>
                            <p>No appointments scheduled for {getHeaderText().toLowerCase()}.</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default AppointmentsPage;
