// src/pages/patient-list.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    // ... (no changes in this component)
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


function PatientList() {
  const [allPatients, setAllPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [settings, setSettings] = useState(null); // ADDED: State for settings
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', handleResize);

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // MODIFIED: Fetch patients and settings in parallel
        const [patientsResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/patients`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          }),
          fetch(`${API_BASE_URL}/api/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          setAllPatients(patientsData);
        } else {
          throw new Error(`Failed to fetch patient data. Status: ${patientsResponse.status}`);
        }

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSettings(settingsData);
          // --- DEBUGGING: Log settings and role to verify ---
          console.log("SETTINGS LOADED:", settingsData);
          console.log("USER ROLE:", role);
        } else {
          throw new Error('Failed to fetch application settings.');
        }

      } catch (err) {
        setError(err.message || 'Network error. Could not connect to the server.');
        if (err.message?.includes('401') || err.message?.includes('403')) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  // --- NEW: Permission checking helper function ---
  const hasPermission = (permissionKey) => {
    if (!userRole || !settings || !settings.patientManagement) return false;
    if (userRole === 'owner') return true; // Owner always has access
    return settings.patientManagement[permissionKey]?.includes(userRole);
  };

  const processedPatients = useMemo(() => {
    // ... (no changes in this useMemo hook)
    let augmentedPatients = allPatients.map(p => {
        const allVisits = [];
        if (p.createdAt) {
            allVisits.push({ date: new Date(p.createdAt), type: 'New' });
        }
        if (p.dailyVisits && Array.isArray(p.dailyVisits)) {
            p.dailyVisits.forEach(visit => {
                allVisits.push({ date: new Date(visit.checkInTime), type: 'Returning' });
            });
        }
        let mostRecentVisit = null;
        if (allVisits.length > 0) {
            mostRecentVisit = allVisits.reduce((latest, current) => 
                current.date > latest.date ? current : latest
            );
        }
        return { ...p, allVisits, mostRecentVisit };
    });

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      augmentedPatients = augmentedPatients.filter(p => {
          const nameMatch = p.name.toLowerCase().includes(lowerCaseSearchTerm);
          // MODIFIED: Use permission to decide if phone/email are searchable
          const phoneMatch = hasPermission('canSeeContactDetails') && p.phoneNumber && p.phoneNumber.includes(lowerCaseSearchTerm);
          const emailMatch = hasPermission('canSeeContactDetails') && p.email && p.email.toLowerCase().includes(lowerCaseSearchTerm);
          return nameMatch || phoneMatch || emailMatch;
      });
    }

    if (selectedDate) {
      const formattedSelectedDate = formatDateForInput(selectedDate);
      augmentedPatients = augmentedPatients.filter(p => 
        p.allVisits.some(v => formatDateForInput(v.date) === formattedSelectedDate)
      );
    }
    
    augmentedPatients.sort((a, b) => {
        const dateA = a.mostRecentVisit ? a.mostRecentVisit.date.getTime() : 0;
        const dateB = b.mostRecentVisit ? b.mostRecentVisit.date.getTime() : 0;
        return dateB - dateA;
    });

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
  }, [allPatients, searchTerm, selectedDate, userRole, settings]); // MODIFIED: Added settings to dependency array

  // MODIFIED: Use permission to control column visibility
  const showNextAppointmentColumn = hasPermission('canSeeNextAppointment');

  if (loading || !settings) return <div className="spinner-container"><div className="spinner"></div><p>Loading patient data...</p></div>;
  if (error) return <div className="app-container"><div className="patient-list-container"><p className="info-message error">Error: {error}</p></div></div>;
  
  return (
    <div className="patient-list-container">
      <header className="patient-list-header">
        <h1>Patient Directory</h1>
        <div className="actions">
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button"><i className="fas fa-arrow-left"></i> Back</button>
          {/* Using permission for Add Patient button as an example of future extension */}
          {(userRole === 'owner' || userRole === 'staff') && ( 
            <button onClick={() => navigate('/')} className="add-patient-button"><i className="fas fa-plus-circle"></i> Add New Patient</button>
          )}
        </div>
      </header>
      
      <section className="search-filter-section">
          <input type="text" placeholder="Search by name..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <input type="date" className="date-input" value={selectedDate ? formatDateForInput(selectedDate) : ''} onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)} />
          {selectedDate && <button onClick={() => setSelectedDate(null)} className="clear-date-button"><i className="fas fa-times"></i> Clear</button>}
      </section>

      {processedPatients.length === 0 ? (
          <p className="info-message">No patients found. Try adjusting your search or date filter.</p>
      ) : (
          <div className="table-responsive">
          <table className="patient-table">
              <thead>
              <tr>
                  <th>Name</th>
                  {!isMobile && (
                    <>
                        <th>Role</th>
                        {/* MODIFIED: Show contact column based on permission */}
                        {hasPermission('canSeeContactDetails') && <th>Contact</th>}
                        <th>Date of Birth</th>
                        <th>Sex</th>
                        <th>HMO</th>
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
                          <GetVisitTag patient={family} selectedDate={selectedDate} />
                          {family.name}
                      </td>
                      {!isMobile && (
                        <>
                            <td><span className="role-badge head">{family.isFamilyHead ? 'Head' : 'Individual'}</span></td>
                            {/* MODIFIED: Render contact details based on permission */}
                            {hasPermission('canSeeContactDetails') && (
                              <td>
                                <div className="contact-info">
                                  <span>{family.phoneNumber || 'N/A'}</span>
                                  <span>{family.email || 'N/A'}</span>
                                  <span>{family.address || 'N/A'}</span>
                                </div>
                              </td>
                            )}
                            <td>{family.dateOfBirth ? new Date(family.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                            <td>{family.sex}</td>
                            <td>{family.hmo ? 'Yes' : 'No'}</td>
                            {showNextAppointmentColumn && <td>{family.nextAppointmentDate ? new Date(family.nextAppointmentDate).toLocaleDateString() : 'Not Set'}</td>}
                        </>
                      )}
                      <td className="table-actions-cell">
                        {/* MODIFIED: Pass settings and permission checker to Actions component */}
                        <PatientActions patient={family} userRole={userRole} navigate={navigate} hasPermission={hasPermission} />
                      </td>
                  </tr>
                  {family.familyMembers.map((member) => (
                      <tr key={member.id} className="family-member-row">
                      <td className="indented-cell patient-name-cell">
                          <GetVisitTag patient={member} selectedDate={selectedDate} />
                          {member.name}
                      </td>
                      {!isMobile && (
                        <>
                            <td><span className="role-badge member">Member</span></td>
                            {/* --- FIX: Show Family Head's contact info for members --- */}
                            {hasPermission('canSeeContactDetails') && (
                              <td>
                                <div className="contact-info inherited">
                                  <span>{family.phoneNumber || 'N/A'} (Head)</span>
                                  <span>{family.email || 'N/A'} (Head)</span>
                                  <span>{family.address || 'N/A'} (Head)</span>
                                </div>
                              </td>
                            )}
                            <td>{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                            <td>{member.sex}</td>
                            <td>{member.hmo ? 'Yes' : 'No'}</td>
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
    </div>
  );
}


// MODIFIED: Accept hasPermission prop
function PatientActions({ patient, userRole, navigate, hasPermission }) {
    const [isOpen, setIsOpen] = useState(false);
    const [style, setStyle] = useState({});
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    // ... (handleToggle and useEffect hooks remain the same)
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

    // MODIFIED: Define actions with their required permission key
    const actionItems = [
        { label: 'Details', icon: 'fa-eye', path: `/patients/${patient.id}`, permissionKey: null }, // Assume all roles can see details
        { label: 'Set Appointment', icon: 'fa-calendar-plus', path: `/patients/${patient.id}/set-appointment`, permissionKey: 'canSetAppointment' },
        { label: 'Send Invoice', icon: 'fa-file-invoice', path: `/patients/${patient.id}/invoice`, permissionKey: 'canSendInvoice' },
        { label: 'Send Receipt', icon: 'fa-receipt', path: `/patients/${patient.id}/receipts`, permissionKey: 'canSendReceipt' },
        { label: 'Edit Bio', icon: 'fa-user-edit', path: `/patients/${patient.id}/edit`, permissionKey: 'canEditBio' }
    ];

    // MODIFIED: Filter actions based on the permission checker
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
