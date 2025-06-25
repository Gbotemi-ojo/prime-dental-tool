// src/pages/appointments.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// TODO: Move this to a central config file (e.g., src/config/api.js)
const API_BASE_URL = 'http://localhost:5000'; 

// CSS styles are embedded directly to avoid resolution errors.
const AppointmentStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        :root {
            --primary-color: #3F51B5;
            --secondary-color: #5C6BC0;
            --accent-color: #00BCD4;
            --text-dark: #263238;
            --text-medium: #546E7A;
            --text-light: #ffffff;
            --background-light: #f4f6f8;
            --background-card: #ffffff;
            --border-color: #e0e4e8;
            --shadow-light: rgba(0, 0, 0, 0.05);
            --shadow-medium: rgba(0, 0, 0, 0.1);
        }

        .appointments-container {
            font-family: 'Inter', sans-serif;
            background-color: var(--background-light);
            min-height: 100vh;
            padding: 30px;
        }

        .appointments-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
        }

        .appointments-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-dark);
        }

        .back-button {
            background-color: var(--secondary-color);
            color: var(--text-light);
            border: none;
            border-radius: 8px;
            padding: 12px 22px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .back-button:hover {
            background-color: var(--primary-color);
            transform: translateY(-2px);
        }

        .view-controls {
            background-color: var(--background-card);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px var(--shadow-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }

        .toggle-buttons {
            display: flex;
            background-color: #e9ecef;
            border-radius: 10px;
            padding: 5px;
        }

        .toggle-btn {
            padding: 12px 25px;
            border: none;
            background-color: transparent;
            color: var(--text-medium);
            font-size: 1rem;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .toggle-btn.active {
            background-color: var(--primary-color);
            color: var(--text-light);
            box-shadow: 0 3px 10px rgba(63, 81, 181, 0.3);
        }

        .date-picker-wrapper {
            display: flex;
            align-items: center;
        }

        .date-input-appointments {
            padding: 12px 18px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 1rem;
            font-family: 'Inter', sans-serif;
            color: var(--text-dark);
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .date-input-appointments:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.15);
        }

        .appointments-list-section .list-header {
            margin-bottom: 20px;
        }

        .appointments-list-section h2 {
            font-size: 1.8rem;
            color: var(--text-dark);
            font-weight: 600;
        }

        .appointments-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
            display: grid;
            gap: 15px;
        }

        .appointment-card {
            background-color: var(--background-card);
            padding: 20px 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px var(--shadow-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 5px solid var(--accent-color);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
        }

        .appointment-card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 8px 25px var(--shadow-medium);
        }

        .patient-info {
            display: flex;
            flex-direction: column;
        }

        .patient-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--text-dark);
        }

        .patient-contact {
            font-size: 0.9rem;
            color: var(--text-medium);
            margin-top: 4px;
        }

        .appointment-details {
            display: flex;
            align-items: center;
            gap: 20px;
            color: var(--text-medium);
        }

        .appointment-time {
            font-weight: 500;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .details-arrow {
            font-size: 1.2rem;
            color: var(--secondary-color);
            transition: transform 0.3s ease;
        }

        .appointment-card:hover .details-arrow {
            transform: translateX(5px);
        }

        .loading-indicator, .no-appointments-message {
            text-align: center;
            padding: 60px 20px;
            background-color: var(--background-card);
            border-radius: 12px;
        }
        
        .loading-indicator p, .no-appointments-message p {
            font-size: 1.2rem;
            color: var(--text-medium);
            font-weight: 500;
        }

        .no-appointments-message i {
            font-size: 3rem;
            color: var(--secondary-color);
            margin-bottom: 20px;
            display: block;
        }

        .loading-indicator .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .appointments-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
            .view-controls {
                flex-direction: column;
                align-items: stretch;
            }
            .toggle-buttons {
                width: 100%;
                justify-content: center;
            }
        }
    `}</style>
);


const AppointmentsPage = () => {
    const [allPatients, setAllPatients] = useState([]);
    const [viewMode, setViewMode] = useState('today'); // 'today' or 'byDate'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        const targetDateStr = toLocalISOString(selectedDate);
        return allPatients.filter(patient => {
            if (!patient.nextAppointmentDate) return false;
            const appointmentDateStr = toLocalISOString(patient.nextAppointmentDate);
            return appointmentDateStr === targetDateStr;
        });
    }, [allPatients, selectedDate]);

    useEffect(() => {
        if (viewMode === 'today') {
            setSelectedDate(new Date());
        }
    }, [viewMode]);

    const handleDateChange = (e) => {
        const date = new Date(e.target.value + 'T00:00:00');
        setSelectedDate(date);
    };

    return (
        <>
            <AppointmentStyles />
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
                            <i className="fas fa-calendar-day"></i> Today's Appointments
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'byDate' ? 'active' : ''}`} 
                            onClick={() => setViewMode('byDate')}>
                            <i className="fas fa-calendar-alt"></i> Search by Date
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
                    {loading ? (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <p>Loading appointments...</p>
                        </div>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : appointments.length > 0 ? (
                        <ul className="appointments-list">
                            <div className="list-header">
                                <h2>{viewMode === 'today' ? "Today's" : `Date: ${toLocalISOString(selectedDate)}`} Appointments ({appointments.length})</h2>
                            </div>
                            {appointments.map(patient => (
                                <li key={patient.id} className="appointment-card" onClick={() => navigate(`/patients/${patient.id}`)}>
                                    <div className="patient-info">
                                        <span className="patient-name">{patient.name}</span>
                                        <span className="patient-contact">{patient.phoneNumber || 'No contact'}</span>
                                    </div>
                                    <div className="appointment-details">
                                        <span className="appointment-time">
                                            <i className="fas fa-clock"></i> All Day
                                        </span>
                                        <i className="fas fa-chevron-right details-arrow"></i>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-appointments-message">
                            <i className="fas fa-calendar-times"></i>
                            <p>No appointments scheduled for {viewMode === 'today' ? 'today' : toLocalISOString(selectedDate)}.</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default AppointmentsPage;
