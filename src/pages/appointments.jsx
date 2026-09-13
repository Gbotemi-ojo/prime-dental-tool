// src/pages/appointments.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE_URL from '../config/api';
import './appointments.css';

// NEW: Modal component for sending custom emails
const CustomEmailModal = ({ patient, isOpen, onClose, onSend }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        setSubject('');
        setMessage('');
    }, [patient]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleSendClick = async () => {
        if (!subject.trim() || !message.trim()) {
            toast.warn('Subject and message cannot be empty.', { theme: 'colored' });
            return;
        }
        setIsSending(true);
        await onSend(patient.id, subject, message);
        setIsSending(false);
        onClose(); 
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" ref={modalRef}>
                <header className="modal-header">
                    <h3>Compose Email to {patient.name}</h3>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </header>
                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="email-subject">Subject</label>
                        <input
                            type="text"
                            id="email-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email-message">Message</label>
                        <textarea
                            id="email-message"
                            rows="10"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                        ></textarea>
                    </div>
                </div>
                <footer className="modal-footer">
                    <button className="modal-cancel-btn" onClick={onClose} disabled={isSending}>
                        Cancel
                    </button>
                    <button className="modal-send-btn" onClick={handleSendClick} disabled={isSending}>
                        {isSending ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Send Email'}
                    </button>
                </footer>
            </div>
        </div>
    );
};


const AppointmentCard = ({ patient, onSendReminder, onComposeEmail, onNavigate, sendingState, viewMode }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const hasOutstanding = parseFloat(patient.outstanding) > 0;

    const isSending = (type) => sendingState?.patientId === patient.id && sendingState?.type === type;

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <li className={`appointment-card ${isDropdownOpen ? 'dropdown-active' : ''}`}>
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
                    <div className="reminder-dropdown-container" ref={dropdownRef}>
                        <button 
                            className="send-reminder-btn"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={!patient.email}
                            title={!patient.email ? "Patient has no email address" : "Send reminder email"}
                        >
                            <i className="fas fa-envelope"></i> Send Reminder <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'}`}></i>
                        </button>
                        {isDropdownOpen && (
                             <div className="reminder-dropdown-menu">
                                <button onClick={() => { onSendReminder(patient.id, 'general'); setIsDropdownOpen(false); }} disabled={isSending('general')}>
                                    {isSending('general') ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Generic Reminder'}
                                </button>
                                <button onClick={() => { onSendReminder(patient.id, 'scaling'); setIsDropdownOpen(false); }} disabled={isSending('scaling')}>
                                    {isSending('scaling') ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Scaling & Polishing'}
                                </button>
                                <button onClick={() => { onSendReminder(patient.id, 'extraction'); setIsDropdownOpen(false); }} disabled={isSending('extraction')}>
                                     {isSending('extraction') ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Post-Extraction'}
                                </button>
                                <button onClick={() => { onSendReminder(patient.id, 'rootCanal'); setIsDropdownOpen(false); }} disabled={isSending('rootCanal')}>
                                     {isSending('rootCanal') ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Root Canal'}
                                </button>
                                <hr style={{margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-color)'}} />
                                <button onClick={() => { onComposeEmail(patient); setIsDropdownOpen(false); }}>
                                    Compose Custom Email...
                                </button>
                             </div>
                        )}
                    </div>
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
    const [sendingState, setSendingState] = useState({ patientId: null, type: null });
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatientForEmail, setSelectedPatientForEmail] = useState(null);

    const toLocalISOString = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Initialize date based on view mode (Today/Tomorrow)
    useEffect(() => {
        if (viewMode === 'today') {
            setSelectedDate(new Date());
        } else if (viewMode === 'tomorrow') {
            const tmrw = new Date();
            tmrw.setDate(tmrw.getDate() + 1);
            setSelectedDate(tmrw);
        }
    }, [viewMode]);

    useEffect(() => {
        const fetchScheduledPatients = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                // Construct query based on view mode
                let query = '';
                if (viewMode !== 'all') {
                    // Use the date we set in the other effect
                    const dateStr = toLocalISOString(selectedDate);
                    query = `?date=${dateStr}`;
                }

                // Call the NEW specialized endpoint
                const response = await fetch(`${API_BASE_URL}/api/patients/scheduled${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setAllPatients(data); // This endpoint returns array directly
                } else {
                    setError(`Failed to fetch appointments. Status: ${response.status}`);
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

        fetchScheduledPatients();
    }, [navigate, viewMode, selectedDate]); // Refetch when mode or date changes

    const handleDateChange = (e) => {
        const date = new Date(e.target.value + 'T00:00:00');
        setSelectedDate(date);
        // viewMode stays 'byDate'
    };

    const handleOpenModal = (patient) => {
        setSelectedPatientForEmail(patient);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPatientForEmail(null);
    };
    
    const handleSendCustomEmail = async (patientId, subject, message) => {
        const token = localStorage.getItem('jwtToken');
        const url = `${API_BASE_URL}/api/patients/${patientId}/send-custom-email`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subject, message })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message, { theme: "colored" });
            } else {
                toast.error(data.error || `Failed to send email.`, { theme: "colored" });
            }
        } catch (err) {
            toast.error(`Network error. Could not send email.`, { theme: "colored" });
        }
    };
    
    const handleSendReminder = async (patientId, type = 'general') => {
        const token = localStorage.getItem('jwtToken');
        setSendingState({ patientId, type });

        let url;
        if (type === 'general') {
            url = `${API_BASE_URL}/api/patients/${patientId}/send-reminder`;
        } else {
            url = `${API_BASE_URL}/api/patients/${patientId}/reminders/${type}`;
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message, { theme: "colored" });
            } else {
                toast.error(data.error || `Failed to send ${type} reminder.`, { theme: "colored" });
            }
        } catch (err) {
            toast.error(`Network error. Could not send ${type} reminder.`, { theme: "colored" });
        } finally {
            setSendingState({ patientId: null, type: null });
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
             
             <CustomEmailModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                patient={selectedPatientForEmail}
                onSend={handleSendCustomEmail}
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
                        {getHeaderText()} Appointments ({allPatients.length})
                    </h2>
                    {loading ? (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <p>Loading appointments...</p>
                        </div>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : allPatients.length > 0 ? (
                        <ul className="appointments-list">
                            {allPatients.map(patient => (
                                <AppointmentCard 
                                    key={patient.id} 
                                    patient={patient}
                                    onSendReminder={handleSendReminder}
                                    onComposeEmail={handleOpenModal}
                                    onNavigate={() => navigate(`/patients/${patient.id}`)}
                                    sendingState={sendingState}
                                    viewMode={viewMode}
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
