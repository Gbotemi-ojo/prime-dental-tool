// src/pages/doctor-schedule.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import './doctor-schedule.css';

// --- ICONS ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>;
const StethoscopeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l2.5 1.5a.5.5 0 0 0 .5-.868L9 9.793V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02-.022L7.028 9.22a.75.75 0 0 1-1.072 0l-2.22-2.22a.75.75 0 0 1 1.06-1.06l1.72 1.72 3.82-3.82a.75.75 0 0 1 1.06 1.06L7.027 9.22z"/></svg>
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/><path d="m8 3.293 6 6V14.5a1.5 1.5 0 0 1-1.5 1.5v-7A.5.5 0 0 0 12 7.5h-1a.5.5 0 0 0-.5.5v7H7.5a.5.5 0 0 0-.5.5h-4A1.5 1.5 0 0 1 1 14.5V10.293l6-6L8 3.293Z"/></svg>;

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="confirm-btn">Confirm</button>
                    <button onClick={onCancel} className="cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const PatientCard = ({ patient, user, allDoctors, onAssignDoctor, onUpdateField }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [diagnosis, setDiagnosis] = useState(patient.provisionalDiagnosis || '');
    const [treatmentPlan, setTreatmentPlan] = useState(patient.treatmentPlan || '');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [newDoctorId, setNewDoctorId] = useState(null);

    const handleUpdate = () => {
        if (user?.role === 'doctor' || user?.role === 'owner') {
            if (diagnosis !== patient.provisionalDiagnosis) {
                onUpdateField(patient.patientId, patient.dentalRecordId, 'provisionalDiagnosis', diagnosis);
            }
            if (treatmentPlan !== patient.treatmentPlan) {
                onUpdateField(patient.patientId, patient.dentalRecordId, 'treatmentPlan', treatmentPlan);
            }
            setIsUpdating(false);
        }
    };

    const handleAssignChange = (e) => {
        const selectedDoctorId = e.target.value;
        if (selectedDoctorId && selectedDoctorId !== patient.doctorId) {
            setNewDoctorId(selectedDoctorId);
            setShowAssignModal(true);
        }
    };

    const confirmAssignment = () => {
        onAssignDoctor(patient.patientId, newDoctorId);
        setShowAssignModal(false);
    };

    const cancelAssignment = () => {
        setShowAssignModal(false);
        setNewDoctorId(null);
    };

    return (
        <div className="patient-card">
            {showAssignModal && (
                <ConfirmationModal
                    message="Are you sure you want to reassign this patient?"
                    onConfirm={confirmAssignment}
                    onCancel={cancelAssignment}
                />
            )}
            <div className="card-header">
                <h3 className="patient-name"><UserIcon /> {patient.patientName}</h3>
                {(user?.role === 'owner' || user?.role === 'staff') && (
                    <div className="doctor-assign-wrapper">
                        <select
                            onChange={handleAssignChange}
                            value={newDoctorId || patient.doctorId || ""}
                            className="doctor-assign-select"
                        >
                            <option value="" disabled>Assign Doctor</option>
                            {allDoctors.map(doctor => (
                                <option key={doctor.id} value={doctor.id}>{doctor.username}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="card-body">
                <div className="patient-details">
                    <span className="detail-item">
                        <StethoscopeIcon />
                        <strong>Assigned Doctor:</strong> {patient.doctorName || 'Not Assigned'}
                    </span>
                    <span className="detail-item">
                        <CalendarIcon />
                        <strong>Next Appointment:</strong> {patient.nextAppointmentDate ? new Date(patient.nextAppointmentDate).toLocaleDateString() : 'Not Set'}
                    </span>
                </div>
                <div className="patient-fields">
                    <div className="field-group">
                        <label>Provisional Diagnosis</label>
                        <textarea
                            value={diagnosis}
                            onChange={(e) => { setDiagnosis(e.target.value); setIsUpdating(true); }}
                            disabled={user?.role !== 'doctor' && user?.role !== 'owner'}
                        />
                    </div>
                    <div className="field-group">
                        <label>Treatment Plan</label>
                        <textarea
                            value={treatmentPlan}
                            onChange={(e) => { setTreatmentPlan(e.target.value); setIsUpdating(true); }}
                            disabled={user?.role !== 'doctor' && user?.role !== 'owner'}
                        />
                    </div>
                </div>
                {isUpdating && (user?.role === 'doctor' || user?.role === 'owner') && (
                    <button onClick={handleUpdate} className="update-btn">
                        <CheckCircleIcon /> Update Record
                    </button>
                )}
            </div>
             <div className="card-footer">
                Registered on: {new Date(patient.createdAt).toLocaleDateString()}
            </div>
        </div>
    );
};

const DoctorSchedule = () => {
    const [patients, setPatients] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    // --- UX State ---
    const [view, setView] = useState('list'); // 'list', 'date', 'doctor', 'combined'
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUserAndData = useCallback(async () => {
        const token = localStorage.getItem('jwtToken');
        const storedUser = {
            id: localStorage.getItem('userId'),
            role: localStorage.getItem('role'),
            username: localStorage.getItem('username'),
        };

        if (!token || !storedUser.id || !storedUser.role) {
            navigate('/login');
            return;
        }
        setUser(storedUser);

        try {
            let url = `${API_BASE_URL}/api/patients/doctor-schedule`;
            if (storedUser.role === 'doctor') {
                url = `${API_BASE_URL}/api/patients/doctor-schedule/${storedUser.id}`;
            }

            const patientsResponse = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!patientsResponse.ok) {
                throw new Error('Failed to fetch patients.');
            }
            const patientsData = await patientsResponse.json();
            setPatients(patientsData);

            if (storedUser.role === 'owner' || storedUser.role === 'staff') {
                const doctorsResponse = await fetch(`${API_BASE_URL}/api/admin/users/doctors-and-owners`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!doctorsResponse.ok) {
                    throw new Error('Failed to fetch doctors.');
                }
                const doctorsData = await doctorsResponse.json();
                setAllDoctors(doctorsData);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUserAndData();
    }, [fetchUserAndData]);

    const handleAssignDoctor = async (patientId, doctorId) => {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/assign-doctor`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ doctorId })
            });

            if (!response.ok) {
                throw new Error('Failed to assign doctor.');
            }
            fetchUserAndData(); // Refresh data to show the change
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateField = async (patientId, recordId, field, value) => {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${API_BASE_URL}/api/patients/dental-records/${recordId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ [field]: value })
            });

            if (!response.ok) {
                throw new Error(`Failed to update ${field}.`);
            }
            // Optimistically update the UI to feel faster, or just refetch
            fetchUserAndData();
        } catch (err) {
            setError(err.message);
        }
    };
    
    const processedPatients = useMemo(() => {
        let filtered = [...patients];

        // 1. View-based filtering
        if (view === 'date' || view === 'combined') {
            filtered = filtered.filter(p => p.nextAppointmentDate && p.nextAppointmentDate.startsWith(selectedDate));
        }
        if (view === 'doctor' || view === 'combined') {
            if (selectedDoctor) {
                 filtered = filtered.filter(p => p.doctorId === parseInt(selectedDoctor, 10));
            }
        }

        // 2. Search filtering (applied on top of view filter)
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [patients, view, selectedDate, selectedDoctor, searchQuery]);


    const renderContent = () => {
        if (processedPatients.length === 0) {
            return <div className="no-results-card">No patients found for the selected criteria.</div>;
        }
        return (
            <div className="patient-grid">
                {processedPatients.map(patient => (
                    <PatientCard
                        key={patient.patientId}
                        patient={patient}
                        user={user}
                        allDoctors={allDoctors}
                        onAssignDoctor={handleAssignDoctor}
                        onUpdateField={handleUpdateField}
                    />
                ))}
            </div>
        );
    };

    if (loading) return <div className="loading">Loading Schedule...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="schedule-container-reimagined">
            <div className="schedule-header-reimagined">
                 <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-btn">
                     <HomeIcon /> Back to Dashboard
                 </button>
                <h1>Doctor's Schedule</h1>
                <div className="view-controls">
                    <button onClick={() => setView('list')} className={view === 'list' ? 'active' : ''}>All Patients</button>
                    <button onClick={() => setView('date')} className={view === 'date' ? 'active' : ''}>By Appointment Date</button>
                    <button onClick={() => setView('doctor')} className={view === 'doctor' ? 'active' : ''}>By Doctor</button>
                    <button onClick={() => setView('combined')} className={view === 'combined' ? 'active' : ''}>Combined View</button>
                </div>
            </div>

            <div className="filter-bar">
                {(view === 'date' || view === 'combined') && (
                    <div className="filter-item date-filter-group">
                        <label htmlFor="appointmentDate">Appointment Date</label>
                        <div className="date-controls">
                            <button onClick={() => setSelectedDate(today)} className={`date-control-btn ${selectedDate === today ? 'active' : ''}`}>Today</button>
                            <button onClick={() => setSelectedDate(tomorrow)} className={`date-control-btn ${selectedDate === tomorrow ? 'active' : ''}`}>Tomorrow</button>
                            <input
                                type="date"
                                id="appointmentDate"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                )}
                 {(view === 'doctor' || view === 'combined') && (
                    <div className="filter-item">
                        <label htmlFor="doctorSelect">Select Doctor</label>
                        <select
                            id="doctorSelect"
                            value={selectedDoctor}
                            onChange={e => setSelectedDoctor(e.target.value)}
                        >
                            <option value="">All Doctors</option>
                            {allDoctors.map(doc => <option key={doc.id} value={doc.id}>{doc.username}</option>)}
                        </select>
                    </div>
                )}
                 <div className="filter-item search-filter">
                     <label htmlFor="searchPatient">Search Patient</label>
                    <input
                        type="text"
                        id="searchPatient"
                        placeholder="Type patient name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="content-area">
                {renderContent()}
            </div>
        </div>
    );
};

export default DoctorSchedule;
