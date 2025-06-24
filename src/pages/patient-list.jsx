// src/pages/patient-list.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedDate, setSelectedDate] = useState(null); // Default to null to show all dates initially
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
          // Handle non-OK responses
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
    // 1. Create a map of family heads
    const familyHeads = allPatients.filter(p => p.isFamilyHead);
    const familyMap = new Map(familyHeads.map(p => [p.id, { ...p, familyMembers: [] }]));

    // 2. Add family members to their respective heads
    allPatients.forEach(p => {
      if (!p.isFamilyHead && p.familyId && familyMap.has(p.familyId)) {
        familyMap.get(p.familyId).familyMembers.push(p);
      }
    });
    
    // 3. Handle patients who are not part of a family structure (isFamilyHead is false, but familyId is null)
    const singlePatients = allPatients.filter(p => !p.isFamilyHead && !p.familyId);
    singlePatients.forEach(p => {
        // Treat them like a "family" of one for consistent data structure
        familyMap.set(p.id, { ...p, familyMembers: [] });
    });


    let families = Array.from(familyMap.values());

    // 4. Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      families = families.filter(family => {
        const headMatch = family.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                          (userRole !== 'nurse' && family.phoneNumber && family.phoneNumber.includes(lowerCaseSearchTerm)) ||
                          (userRole !== 'nurse' && family.email && family.email.toLowerCase().includes(lowerCaseSearchTerm));
        
        const memberMatch = family.familyMembers.some(member => member.name.toLowerCase().includes(lowerCaseSearchTerm));

        return headMatch || memberMatch;
      });
    }

    // 5. Filter by selected date
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

  if (loading) {
    return <div className="spinner-container"><div className="spinner"></div><p>Loading patient data...</p></div>;
  }

  if (error) {
    return (
        <div className="app-container">
            <div className="patient-list-container">
                <p className="info-message error">Error: {error}</p>
                <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="patient-list-container">
      <header className="patient-list-header">
        <h1>Patient Directory</h1>
        <div className="actions">
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
          {(userRole === 'owner' || userRole === 'staff') && (
            <button onClick={() => navigate('/')} className="add-patient-button">
              <i className="fas fa-plus-circle"></i> Add New Patient
            </button>
          )}
        </div>
      </header>

      <section className="search-filter-section">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="date"
          className="date-input"
          value={selectedDate ? formatDateForInput(selectedDate) : ''}
          onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
        />
        {selectedDate && (
          <button onClick={() => setSelectedDate(null)} className="clear-date-button">
            <i className="fas fa-times"></i> Clear Date
          </button>
        )}
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
                <th>Phone</th>
                <th>Email</th>
                <th>Date of Birth</th>
                <th>Sex</th>
                <th>HMO</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedPatients.map((family) => (
                <React.Fragment key={family.id}>
                  {/* Family Head Row */}
                  <tr className="family-head-row">
                    <td>{family.name}</td>
                    <td><span className="role-badge head">Head</span></td>
                    <td>{userRole === 'nurse' ? '[Restricted]' : (family.phoneNumber || 'N/A')}</td>
                    <td>{userRole === 'nurse' ? '[Restricted]' : (family.email || 'N/A')}</td>
                    <td>{family.dateOfBirth ? new Date(family.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                    <td>{family.sex}</td>
                    <td>{family.hmo ? 'Yes' : 'No'}</td>
                    <td className="table-actions-cell">
                      <PatientActions patient={family} userRole={userRole} navigate={navigate} />
                    </td>
                  </tr>
                  {/* Family Member Rows */}
                  {family.familyMembers.map((member) => (
                    <tr key={member.id} className="family-member-row">
                      <td className="indented-cell">{member.name}</td>
                      <td><span className="role-badge member">Member</span></td>
                      <td>[Inherited]</td>
                      <td>[Inherited]</td>
                      <td>{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                      <td>{member.sex}</td>
                      <td>{member.hmo ? 'Yes' : 'No'}</td>
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


// A helper component to render action buttons for a patient
function PatientActions({ patient, userRole, navigate }) {
    return (
        <>
            {(userRole === 'owner' || userRole === 'staff') && (
                <button onClick={() => navigate(`/patients/${patient.id}`)} className="table-action-button view">
                    <i className="fas fa-eye"></i> Details
                </button>
            )}
            {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse') && (
                <>
                    <button onClick={() => navigate(`/patients/${patient.id}/invoice`)} className="table-action-button invoice">
                        <i className="fas fa-file-invoice"></i> Invoice
                    </button>
                    <button onClick={() => navigate(`/patients/${patient.id}/receipts`)} className="table-action-button receipts">
                        <i className="fas fa-receipt"></i> Receipts
                    </button>
                </>
            )}
            {(userRole === 'owner' || userRole === 'staff') && (
                <button onClick={() => navigate(`/patients/${patient.id}/edit`)} className="table-action-button edit">
                    <i className="fas fa-user-edit"></i> Edit Bio
                </button>
            )}
        </>
    );
}
