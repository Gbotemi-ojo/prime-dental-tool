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
    let visitInfo = null;

    if (selectedDate) {
        // If a date is selected, find the relevant visit for that day.
        // A person could be new and returning on the same day. Let's find all visits for the day.
        const formattedSelectedDate = formatDateForInput(selectedDate);
        const visitsOnDay = patient.allVisits
            .filter(v => formatDateForInput(v.date) === formattedSelectedDate)
            .sort((a, b) => b.date - a.date); // Sort to get latest if multiple on same day

        if (visitsOnDay.length > 0) {
            // Prioritize 'Returning' type if it exists for that day, as it implies a subsequent action
            visitInfo = visitsOnDay.find(v => v.type === 'Returning') || visitsOnDay[0];
        }
    } else {
        // If no date is selected, use the most recent visit overall.
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 800);
    };
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
        const response = await fetch(`${API_BASE_URL}/api/patients`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });

        if (response.ok) {
          const patientsData = await response.json();
          setAllPatients(patientsData);
        } else {
          const errorMsg = `Failed to fetch data. Status: ${response.status}`;
          setError(errorMsg);
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

    fetchData();

    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const processedPatients = useMemo(() => {
    // 1. Augment patient data with visit information
    let augmentedPatients = allPatients.map(p => {
        const allVisits = [];
        // Add the initial registration as a "New" visit
        if (p.createdAt) {
            allVisits.push({ date: new Date(p.createdAt), type: 'New' });
        }
        // Add all subsequent check-ins as "Returning" visits
        if (p.dailyVisits && Array.isArray(p.dailyVisits)) {
            p.dailyVisits.forEach(visit => {
                allVisits.push({ date: new Date(visit.checkInTime), type: 'Returning' });
            });
        }

        // Determine the most recent visit
        let mostRecentVisit = null;
        if (allVisits.length > 0) {
            mostRecentVisit = allVisits.reduce((latest, current) => 
                current.date > latest.date ? current : latest
            );
        }

        return { ...p, allVisits, mostRecentVisit };
    });

    // 2. Filter patients
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      augmentedPatients = augmentedPatients.filter(p => {
          const nameMatch = p.name.toLowerCase().includes(lowerCaseSearchTerm);
          const phoneMatch = !['nurse', 'doctor'].includes(userRole) && p.phoneNumber && p.phoneNumber.includes(lowerCaseSearchTerm);
          const emailMatch = !['nurse', 'doctor'].includes(userRole) && p.email && p.email.toLowerCase().includes(lowerCaseSearchTerm);
          return nameMatch || phoneMatch || emailMatch;
      });
    }

    if (selectedDate) {
      const formattedSelectedDate = formatDateForInput(selectedDate);
      augmentedPatients = augmentedPatients.filter(p => 
        p.allVisits.some(v => formatDateForInput(v.date) === formattedSelectedDate)
      );
    }
    
    // 3. Sort patients by the most recent visit date
    augmentedPatients.sort((a, b) => {
        const dateA = a.mostRecentVisit ? a.mostRecentVisit.date.getTime() : 0;
        const dateB = b.mostRecentVisit ? b.mostRecentVisit.date.getTime() : 0;
        return dateB - dateA;
    });

    // 4. Group by family structure for display
    const familyHeads = augmentedPatients.filter(p => p.isFamilyHead);
    const familyMap = new Map(familyHeads.map(p => [p.id, { ...p, familyMembers: [] }]));
    
    const singlePatients = augmentedPatients.filter(p => !p.isFamilyHead && !p.familyId);
    singlePatients.forEach(p => {
        // Use a unique key to avoid clashes with family IDs
        familyMap.set(`single-${p.id}`, { ...p, familyMembers: [] });
    });

    augmentedPatients.forEach(p => {
      if (!p.isFamilyHead && p.familyId && familyMap.has(p.familyId)) {
        familyMap.get(p.familyId).familyMembers.push(p);
      }
    });

    return Array.from(familyMap.values());
  }, [allPatients, searchTerm, selectedDate, userRole]);

  const showNextAppointmentColumn = !['nurse', 'doctor'].includes(userRole);

  if (loading) return <div className="spinner-container"><div className="spinner"></div><p>Loading patient data...</p></div>;
  if (error) return <div className="app-container"><div className="patient-list-container"><p className="info-message error">Error: {error}</p></div></div>;
  
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
          <input type="text" placeholder="Search by name, phone, or email..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                        <th>Contact</th>
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
                            <td>
                                {(!['nurse', 'doctor'].includes(userRole)) ? (
                                    <div className="contact-info">
                                        <span>{family.phoneNumber || 'N/A'}</span>
                                        <span>{family.email || 'N/A'}</span>
                                    </div>
                                ) : '' /* Empty string for restricted roles */}
                            </td>
                            <td>{family.dateOfBirth ? new Date(family.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                            <td>{family.sex}</td>
                            <td>{family.hmo ? 'Yes' : 'No'}</td>
                            {showNextAppointmentColumn && <td>{family.nextAppointmentDate ? new Date(family.nextAppointmentDate).toLocaleDateString() : 'Not Set'}</td>}
                        </>
                      )}
                      <td className="table-actions-cell">
                      <PatientActions patient={family} userRole={userRole} navigate={navigate} />
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
                            <td>
                                {(!['nurse', 'doctor'].includes(userRole)) ? (
                                    <div className="contact-info inherited">
                                        <span>Inherited</span>
                                    </div>
                                ) : '' /* Empty string for restricted roles */}
                            </td>
                            <td>{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                            <td>{member.sex}</td>
                            <td>{member.hmo ? 'Yes' : 'No'}</td>
                            {showNextAppointmentColumn && <td>{member.nextAppointmentDate ? new Date(member.nextAppointmentDate).toLocaleDateString() : 'Not Set'}</td>}
                        </>
                      )}
                      <td className="table-actions-cell">
                          <PatientActions patient={member} userRole={userRole} navigate={navigate} />
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


function PatientActions({ patient, userRole, navigate }) {
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
        // Ensure patient.id is used for navigation
        { roles: ['owner', 'doctor', 'staff', 'nurse'], label: 'Details', icon: 'fa-eye', path: `/patients/${patient.id}` },
        { roles: ['owner', 'staff', 'nurse', 'doctor'], label: 'Appointment', icon: 'fa-calendar-plus', path: `/patients/${patient.id}/set-appointment` },
        { roles: ['owner', 'staff', 'nurse'], label: 'Invoice', icon: 'fa-file-invoice', path: `/patients/${patient.id}/invoice` },
        { roles: ['owner', 'staff'], label: 'Receipts', icon: 'fa-receipt', path: `/patients/${patient.id}/receipts` },
        { roles: ['owner', 'staff'], label: 'Edit Bio', icon: 'fa-user-edit', path: `/patients/${patient.id}/edit` }
    ];

    const availableActions = actionItems.filter(action => action.roles.includes(userRole));

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
