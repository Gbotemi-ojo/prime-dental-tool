// src/pages/patient-list.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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

function PatientList() {
  const [allPatients, setAllPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchPatients = async () => {
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
          const data = await response.json();
          setAllPatients(data);
        } else {
          const errorMsg = `Failed to fetch patients. Status: ${response.status}`;
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

    fetchPatients();
  }, [navigate]);

  const processedPatients = useMemo(() => {
    const familyHeads = allPatients.filter(p => p.isFamilyHead);
    const familyMap = new Map(familyHeads.map(p => [p.id, { ...p, familyMembers: [] }]));

    allPatients.forEach(p => {
      if (!p.isFamilyHead && p.familyId && familyMap.has(p.familyId)) {
        familyMap.get(p.familyId).familyMembers.push(p);
      }
    });

    const singlePatients = allPatients.filter(p => !p.isFamilyHead && !p.familyId);
    singlePatients.forEach(p => {
        familyMap.set(p.id, { ...p, familyMembers: [] });
    });

    let families = Array.from(familyMap.values());

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      families = families.filter(family => {
        const headMatch = family.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                          (!['nurse', 'doctor'].includes(userRole) && family.phoneNumber && family.phoneNumber.includes(lowerCaseSearchTerm)) ||
                          (!['nurse', 'doctor'].includes(userRole) && family.email && family.email.toLowerCase().includes(lowerCaseSearchTerm));
        const memberMatch = family.familyMembers.some(member => member.name.toLowerCase().includes(lowerCaseSearchTerm));
        return headMatch || memberMatch;
      });
    }

    if (selectedDate) {
      const formattedSelectedDate = formatDateForInput(selectedDate);
      families = families.filter(family => {
        const headMatch = family.createdAt && formatDateForInput(family.createdAt) === formattedSelectedDate;
        const memberMatch = family.familyMembers.some(member => member.createdAt && formatDateForInput(member.createdAt) === formattedSelectedDate);
        return headMatch || memberMatch;
      });
    }

    return families;
  }, [allPatients, searchTerm, selectedDate, userRole]);

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
                <th>Role</th>
                <th>Contact</th>
                <th>Date of Birth</th>
                <th>Sex</th>
                <th>HMO</th>
                <th>Next Appointment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedPatients.map((family) => (
                <React.Fragment key={family.id}>
                  <tr className="family-head-row">
                    <td>{family.name}</td>
                    <td><span className="role-badge head">Head</span></td>
                    <td>
                        {(!['nurse', 'doctor'].includes(userRole)) ? (
                            <div className="contact-info">
                                <span>{family.phoneNumber || 'N/A'}</span>
                                <span>{family.email || 'N/A'}</span>
                            </div>
                        ) : 'Restricted'}
                    </td>
                    <td>{family.dateOfBirth ? new Date(family.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                    <td>{family.sex}</td>
                    <td>{family.hmo ? 'Yes' : 'No'}</td>
                    <td>{family.nextAppointmentDate ? new Date(family.nextAppointmentDate).toLocaleDateString() : 'Not Set'}</td>
                    <td className="table-actions-cell">
                      <PatientActions patient={family} userRole={userRole} navigate={navigate} />
                    </td>
                  </tr>
                  {family.familyMembers.map((member) => (
                    <tr key={member.id} className="family-member-row">
                      <td className="indented-cell">{member.name}</td>
                      <td><span className="role-badge member">Member</span></td>
                       <td>
                        {(!['nurse', 'doctor'].includes(userRole)) ? (
                            <div className="contact-info inherited">
                                <span>Inherited</span>
                            </div>
                        ) : 'Restricted'}
                      </td>
                      <td>{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                      <td>{member.sex}</td>
                      <td>{member.hmo ? 'Yes' : 'No'}</td>
                      <td>{member.nextAppointmentDate ? new Date(member.nextAppointmentDate).toLocaleDateString() : 'Not Set'}</td>
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

// --- NEW & IMPROVED: Actions component with dropdown ---
function PatientActions({ patient, userRole, navigate }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleActionClick = (path) => {
        navigate(path);
        setIsOpen(false); // Close dropdown after action
    };

    const actionItems = [
        { roles: ['owner', 'doctor'], label: 'Details', icon: 'fa-eye', path: `/patients/${patient.id}` },
        { roles: ['owner', 'staff', 'nurse', 'doctor'], label: 'Appointment', icon: 'fa-calendar-plus', path: `/patients/${patient.id}/set-appointment` },
        { roles: ['owner', 'staff', 'nurse'], label: 'Invoice', icon: 'fa-file-invoice', path: `/patients/${patient.id}/invoice` },
        { roles: ['owner', 'staff'], label: 'Receipts', icon: 'fa-receipt', path: `/patients/${patient.id}/receipts` },
        { roles: ['owner', 'staff'], label: 'Edit Bio', icon: 'fa-user-edit', path: `/patients/${patient.id}/edit` }
    ];

    const availableActions = actionItems.filter(action => action.roles.includes(userRole));

    return (
        <div className="actions-dropdown-container" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="actions-dropdown-button">
                Actions <i className={`fas fa-chevron-down ${isOpen ? 'open' : ''}`}></i>
            </button>
            {isOpen && (
                <div className="actions-dropdown-menu">
                    {availableActions.map(action => (
                         <a key={action.label} onClick={() => handleActionClick(action.path)} className="actions-dropdown-item">
                            <i className={`fas ${action.icon}`}></i>
                            <span>{action.label}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}