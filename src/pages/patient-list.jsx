// src/pages/patient-list.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './patient-list.css';
import API_BASE_URL from '../config/api';

// Main App component to render the PatientList
export default function App() {
  return (
    <div className="app-container">
      <PatientList />
    </div>
  );
}

// Helper to format date consistently
const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper component to render the "New" or "Returning" tag
const GetVisitTag = ({ patient, selectedDate }) => {
    let visitInfo = null;

    if (selectedDate) {
        const formattedSelectedDate = formatDateForInput(selectedDate);
        const visitsOnDay = patient.allVisits
            .filter(v => formatDateForInput(v.date) === formattedSelectedDate)
            .sort((a, b) => b.date - a.date); 

        if (visitsOnDay.length > 0) {
            visitInfo = visitsOnDay.find(v => v.type === 'Returning') || visitsOnDay[0];
        }
    } else {
        visitInfo = patient.mostRecentVisit;
    }

    if (!visitInfo || !visitInfo.type) return null;

    return (
        <span className={`visit-tag ${visitInfo.type.toLowerCase()}`}>
            {visitInfo.type}
        </span>
    );
};

// Helper: Patient Name Card Display
const PatientNameDisplay = ({ patient, visitTag }) => {
    let hmoName = 'Private';
    if (patient.hmo) {
        if (typeof patient.hmo === 'string') {
             hmoName = patient.hmo;
        } else if (typeof patient.hmo === 'object' && patient.hmo.name) {
             hmoName = patient.hmo.name;
        }
    }
    
    const isPrivate = hmoName.toLowerCase() === 'private' || !patient.hmo;

    return (
        <React.Fragment>
            {/* Visit Status Tag */}
            {visitTag}

            {/* HMO Status Tag */}
            <span className={`hmo-tag ${isPrivate ? 'private' : 'hmo'}`}>
                {hmoName}
            </span>

            <div className="patient-info-wrapper">
                <div className="patient-main-info">
                    {/* Patient Name */}
                    <span className="name-text">{patient.name}</span>
                    
                    {/* UPDATED: Documented Text Indicator (Text instead of Icon) */}
                    {patient.hasDentalRecords ? (
                         <span className="record-status documented">Documented</span>
                    ) : (
                         <span className="record-status undocumented">Undocumented</span>
                    )}
                </div>

                {/* Assigned Doctor Subtext */}
                <div className="patient-sub-info">
                    <i className="fas fa-user-md"></i>
                    <span>
                        {patient.doctorName 
                            ? `Dr. ${patient.doctorName}` 
                            : 'No Doctor Assigned'}
                    </span>
                </div>
            </div>
        </React.Fragment>
    );
};

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const navigate = useNavigate();

  // Handle debounce for search
  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(searchTerm);
          if (searchTerm !== debouncedSearch) {
             setPagination(prev => ({ ...prev, page: 1 }));
          }
      }, 800);
      return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Settings (Once)
  useEffect(() => {
    const fetchSettingsAndUser = async () => {
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('role');
        setUserRole(role);
        if (!token) { navigate('/login'); return; }

        try {
            const settingsRes = await fetch(`${API_BASE_URL}/api/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                setSettings(data);
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };
    fetchSettingsAndUser();
  }, [navigate]);

  // Fetch Patients (Paginated & Search & Date)
  useEffect(() => {
      const fetchPatients = async () => {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        try {
            // UPDATED: Include 'date' in query params
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                date: selectedDate ? formatDateForInput(selectedDate) : ''
            });

            const response = await fetch(`${API_BASE_URL}/api/patients?${queryParams}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });

            if (response.ok) {
                const result = await response.json();
                const data = result.data || (Array.isArray(result) ? result : []);
                const meta = result.meta || { totalPages: 1, total: data.length };
                
                setPatients(data);
                setPagination(prev => ({ 
                    ...prev, 
                    totalPages: meta.totalPages, 
                    total: meta.total 
                }));
            } else {
                throw new Error('Failed to fetch patients');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
      };

      fetchPatients();
  }, [pagination.page, debouncedSearch, selectedDate, navigate]); // Added selectedDate dependency

  const hasPermission = (permissionKey) => {
    if (!userRole || !settings || !settings.patientManagement) return false;
    if (userRole === 'owner') return true; 
    return settings.patientManagement[permissionKey]?.includes(userRole);
  };

  const processedPatients = useMemo(() => {
    let augmentedPatients = patients.map(p => {
        const allVisits = [];
        if (p.createdAt) allVisits.push({ date: new Date(p.createdAt), type: 'New' });
        if (p.dailyVisits && Array.isArray(p.dailyVisits)) {
            p.dailyVisits.forEach(visit => {
                allVisits.push({ date: new Date(visit.checkInTime), type: 'Returning' });
            });
        }
        let mostRecentVisit = null;
        if (allVisits.length > 0) {
            mostRecentVisit = allVisits.reduce((latest, current) => current.date > latest.date ? current : latest);
        }
        return { ...p, allVisits, mostRecentVisit };
    });

    // NOTE: Client-side date filter REMOVED because we now do it server-side.
    
    const familyHeads = augmentedPatients.filter(p => p.isFamilyHead);
    const familyMap = new Map(familyHeads.map(p => [p.id, { ...p, familyMembers: [] }]));
    
    const singlePatients = augmentedPatients.filter(p => !p.isFamilyHead && !p.familyId);
    singlePatients.forEach(p => familyMap.set(`single-${p.id}`, { ...p, familyMembers: [] }));
    
    augmentedPatients.forEach(p => {
      if (!p.isFamilyHead && p.familyId && familyMap.has(p.familyId)) {
        familyMap.get(p.familyId).familyMembers.push(p);
      }
    });

    return Array.from(familyMap.values());
  }, [patients]); // Removed selectedDate dependency (filtering happens at API level now)

  const showNextAppointmentColumn = hasPermission('canSeeNextAppointment');

  const handleNextPage = () => {
      if (pagination.page < pagination.totalPages) {
          setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      }
  };

  const handlePrevPage = () => {
      if (pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      }
  };

  if (!settings && loading) return <div className="spinner-container"><div className="spinner"></div><p>Loading...</p></div>;
  if (error) return <div className="app-container"><p className="info-message error">Error: {error}</p></div>;
  
  return (
    <div className="patient-list-container">
      <header className="patient-list-header">
        <h1>Patient Directory</h1>
        <div className="actions">
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button"><i className="fas fa-arrow-left"></i> Back</button>
          {(userRole === 'owner' || userRole === 'staff') && ( 
            <button onClick={() => navigate('/')} className="add-patient-button"><i className="fas fa-plus-circle"></i> Add New Patient</button>
          )}
        </div>
      </header>
      
      <section className="search-filter-section">
          <input 
              type="text" 
              placeholder="Search by name, phone..." 
              className="search-input" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <input 
              type="date" 
              className="date-input" 
              value={selectedDate ? formatDateForInput(selectedDate) : ''} 
              onChange={(e) => {
                  setSelectedDate(e.target.value ? new Date(e.target.value) : null);
                  setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on date filter
              }} 
          />
          {selectedDate && <button onClick={() => { setSelectedDate(null); setPagination(prev => ({ ...prev, page: 1 })); }} className="clear-date-button"><i className="fas fa-times"></i> Clear</button>}
      </section>

      {loading && <div className="spinner-container-small"><div className="spinner small"></div></div>}

      {!loading && processedPatients.length === 0 ? (
          <p className="info-message">No patients found.</p>
      ) : (
          <div className="table-responsive">
            <table className="patient-table">
                <thead>
                <tr>
                    <th>Name</th>
                    {!isMobile && (
                        <>
                            <th>Role</th>
                            {hasPermission('canSeeContactDetails') && <th>Contact</th>}
                            <th>Date of Birth</th>
                            <th>Sex</th>
                            {showNextAppointmentColumn && <th>Next Appointment</th>}
                        </>
                    )}
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {processedPatients.map((family) => (
                    <React.Fragment key={family.id || `single-${family.id}`}>
                    <tr className="family-head-row">
                        <td className="patient-name-cell">
                             <PatientNameDisplay 
                                patient={family} 
                                visitTag={<GetVisitTag patient={family} selectedDate={selectedDate} />} 
                            />
                        </td>
                        {!isMobile && (
                            <>
                                <td><span className="role-badge head">{family.isFamilyHead ? 'Head' : 'Individual'}</span></td>
                                {hasPermission('canSeeContactDetails') && (
                                <td>
                                    <div className="contact-info">
                                    <span>{family.phoneNumber || 'N/A'}</span>
                                    <span>{family.email || 'N/A'}</span>
                                    </div>
                                </td>
                                )}
                                <td>{family.dateOfBirth ? new Date(family.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                                <td>{family.sex}</td>
                                {showNextAppointmentColumn && <td>{family.nextAppointmentDate ? new Date(family.nextAppointmentDate).toLocaleDateString() : 'Not Set'}</td>}
                            </>
                        )}
                        <td className="table-actions-cell">
                            <PatientActions patient={family} userRole={userRole} navigate={navigate} hasPermission={hasPermission} />
                        </td>
                    </tr>
                    {family.familyMembers.map((member) => (
                        <tr key={member.id} className="family-member-row">
                            <td className="indented-cell patient-name-cell">
                                <PatientNameDisplay 
                                    patient={member} 
                                    visitTag={<GetVisitTag patient={member} selectedDate={selectedDate} />} 
                                />
                            </td>
                            {!isMobile && (
                                <>
                                    <td><span className="role-badge member">Member</span></td>
                                    {hasPermission('canSeeContactDetails') && (
                                        <td>
                                        <div className="contact-info inherited">
                                            <span>{family.phoneNumber || 'N/A'} (Head)</span>
                                        </div>
                                        </td>
                                    )}
                                    <td>{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                                    <td>{member.sex}</td>
                                    {showNextAppointmentColumn && <td>{member.nextAppointmentDate ? new Date(member.nextAppointmentDate).toLocaleDateString() : 'Not Set'}</td>}
                                </>
                            )}
                            <td className="table-actions-cell">
                                <PatientActions patient={member} userRole={userRole} navigate={navigate} hasPermission={hasPermission} />
                            </td>
                        </tr>
                    ))}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
          </div>
      )}

      {/* Pagination Controls */}
      <div className="pagination-controls">
          <button 
            onClick={handlePrevPage} 
            disabled={pagination.page === 1 || loading}
            className="pagination-button"
          >
              <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span className="pagination-info">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={pagination.page >= pagination.totalPages || loading}
            className="pagination-button"
          >
              Next <i className="fas fa-chevron-right"></i>
          </button>
      </div>
    </div>
  );
}

function PatientActions({ patient, userRole, navigate, hasPermission }) {
    const [isOpen, setIsOpen] = useState(false);
    const [style, setStyle] = useState({});
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const handleToggle = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const menuHeight = 220; 
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;
            let topPosition;
            if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                topPosition = rect.top - menuHeight - 4;
            } else {
                topPosition = rect.bottom + 4;
            }
            setStyle({
                position: 'fixed',
                top: `${topPosition}px`,
                left: `${rect.right}px`,
                transform: 'translateX(-100%)',
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen &&
                menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleActionClick = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    const actionItems = [
        { label: 'Details', icon: 'fa-eye', path: `/patients/${patient.id}`, permissionKey: null },
        { label: 'Set Appointment', icon: 'fa-calendar-plus', path: `/patients/${patient.id}/set-appointment`, permissionKey: 'canSetAppointment' },
        { label: 'Send Invoice', icon: 'fa-file-invoice', path: `/patients/${patient.id}/invoice`, permissionKey: 'canSendInvoice' },
        { label: 'Send Receipt', icon: 'fa-receipt', path: `/patients/${patient.id}/receipts`, permissionKey: 'canSendReceipt' },
        { label: 'Edit Bio', icon: 'fa-user-edit', path: `/patients/${patient.id}/edit`, permissionKey: 'canEditBio' }
    ];

    const availableActions = actionItems.filter(action => !action.permissionKey || hasPermission(action.permissionKey));

    return (
        <div ref={buttonRef}>
            <button onClick={handleToggle} className="actions-dropdown-button">
                Actions <i className={`fas fa-chevron-down ${isOpen ? 'open' : ''}`}></i>
            </button>
            {isOpen && createPortal(
                <div ref={menuRef} style={style} className="actions-dropdown-menu">
                    {availableActions.map(action => (
                         <a key={action.label} onClick={() => handleActionClick(action.path)} className="actions-dropdown-item">
                            <i className={`fas ${action.icon}`}></i>
                            <span>{action.label}</span>
                        </a>
                    ))}
                    {availableActions.length === 0 && (
                        <span className="actions-dropdown-item-none">No actions available</span>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
