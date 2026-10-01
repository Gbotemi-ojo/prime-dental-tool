// src/pages/BroadcastPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './BroadcastPage.css';

const treatmentPlanOptions = [
    "Registration & Consultation", "Registration & Consultation (family)", "Scaling and Polishing", "Scaling and Polishing with Gross Stain", "Simple Extraction Anterior", 
    "Simple Extraction Posterior", "Extraction of Retained Root", "Surgical Extraction (Impacted 3rd Molar)", "Temporary Dressing", "Amalgam Filling", 
    "Fuji 9 (Posterior GIC (per Filling)", "Tooth Whitening (3 Sessions)", "Curretage/Subgingival (per tooth)", "Composite Buildup", "Removable Denture (Additional Tooth)",
    "PFM Crown", "Topical Flouridation/Desensitization", "X-Ray", "Root Canal Treatment Anterior", "Root Canal Treatment Posterior", "Gingivectomy/Operculectomy",
    "Splinting with Wires", "Splinting with GIC Composite", "Incision & Drainage/Suturing with Debridement", "Fissure Sealant", "Pulpotomy/Pulpectomy", 
    "Stainless Steel Crown", "Band & Loop Space Maintainers", "LLA & TPA Space Maintainers", "Essix Retainer", "Crown Cementation", "Esthetic Tooth Filling",
    "Zirconium Crown", "Gold Crown", "Flexible Denture (per tooth)", "Flexible Denture (2nd tooth)", "Metallic Crown", "Dental Implant   One Tooth", 
    "Dental Implant   Two Teeth", "Orthodontist Consult", "Partial Denture", "Denture Repair", "GIC Filling", "Braces Consultation", "Braces", "Fluoride Treatment",
    "Intermaxillary Fixation", "Aligners", "E-Max Crown","Drug", "Mouthwash"
];

export default function BroadcastPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [birthdayPatients, setBirthdayPatients] = useState([]);
  
  // State for pagination
  const [startRange, setStartRange] = useState(1);
  const [endRange, setEndRange] = useState(100);

  // State for Direct Message feature
  const [allPatients, setAllPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [directSubject, setDirectSubject] = useState('');
  const [directMessage, setDirectMessage] = useState('');

  // State for Targeted Broadcast (Filter) feature
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState(todayStr);
  const [filterDiagnosis, setFilterDiagnosis] = useState('');
  const [filteredTargetPatients, setFilteredTargetPatients] = useState([]);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [targetedSubject, setTargetedSubject] = useState('');
  const [targetedMessage, setTargetedMessage] = useState('');

  const [loading, setLoading] = useState({
    birthday: false,
    custom: false,
    phones: false,
    direct: false,
    list: true,
    filter: false,
    targeted: false,
  });

  const navigate = useNavigate();

  // Generic API handler
  const handleApiCall = async (endpoint, method, body, loadingKey) => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error('Authentication expired. Please log in again.');
      navigate('/login');
      return null;
    }

    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
      });

      const data = await response.json();
      if (response.ok || response.status === 207) {
        if (data.message) {
            response.ok ? toast.success(data.message) : toast.info(data.message);
        }
        return data;
      } else {
        throw new Error(data.message || 'An unknown error occurred.');
      }
    } catch (error) {
      toast.error(error.message);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Fetch initial data (birthdays and all patients for search)
  useEffect(() => {
    const fetchInitialData = async () => {
      const birthdayData = await handleApiCall('/api/broadcast/birthday-list', 'GET', null, 'list');
      if (birthdayData && birthdayData.patients) {
        setBirthdayPatients(birthdayData.patients);
      } else {
        setBirthdayPatients([]);
      }

      const patientsData = await handleApiCall('/api/patients', 'GET', null, 'list'); 
      if (patientsData && patientsData.data) {
        setAllPatients(patientsData.data);
      } else if (patientsData && Array.isArray(patientsData)) {
        setAllPatients(patientsData);
      }
    };

    fetchInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendBirthdayWishes = async () => {
    await handleApiCall('/api/broadcast/birthday', 'POST', null, 'birthday');
    const data = await handleApiCall('/api/broadcast/birthday-list', 'GET', null, 'list');
    if (data && data.patients) {
        setBirthdayPatients(data.patients);
    }
  };

  const handleSendCustomBroadcast = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.warn('Please provide both a subject and a message.');
      return;
    }
    
    if (startRange < 1 || endRange < startRange) {
      toast.warn('Please provide a valid range (e.g., 1 to 100).');
      return;
    }

    const offset = startRange - 1;
    const limit = endRange - startRange + 1;

    handleApiCall('/api/broadcast/custom', 'POST', { subject, message, offset, limit }, 'custom');
  };

  const handleFetchPhoneNumbers = async () => {
    const data = await handleApiCall('/api/broadcast/phone-numbers', 'GET', null, 'phones');
    if (data && data.phoneNumbers) {
      setPhoneNumbers(data.phoneNumbers);
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
        toast.warn('Please select a patient first.');
        return;
    }
    if (!directSubject.trim() || !directMessage.trim()) {
        toast.warn('Please provide both a subject and a message.');
        return;
    }

    const endpoint = `/api/broadcast/direct-message/${selectedPatient.id}`;
    const body = { subject: directSubject, message: directMessage };
    const result = await handleApiCall(endpoint, 'POST', body, 'direct');
    
    if (result && result.success) {
        setSelectedPatient(null);
        setSearchQuery('');
        setDirectSubject('');
        setDirectMessage('');
    }
  };

  const handleFilterPatients = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterStartDate) params.append('startDate', filterStartDate);
    if (filterEndDate) params.append('endDate', filterEndDate);
    if (filterDiagnosis) params.append('diagnosis', filterDiagnosis);

    const result = await handleApiCall(`/api/broadcast/filter?${params.toString()}`, 'GET', null, 'filter');
    if (result && result.patients) {
        setFilteredTargetPatients(result.patients);
        setHasFiltered(true);
    }
  };

  const handleSendTargetedBroadcast = async (e) => {
    e.preventDefault();
    if (filteredTargetPatients.length === 0) {
        toast.warn('No patients to send to.');
        return;
    }
    if (!targetedSubject.trim() || !targetedMessage.trim()) {
        toast.warn('Please provide a subject and message.');
        return;
    }

    const patientIds = filteredTargetPatients.map(p => p.id);
    const body = { patientIds, subject: targetedSubject, message: targetedMessage };
    const result = await handleApiCall('/api/broadcast/targeted', 'POST', body, 'targeted');
    
    if (result && result.success) {
        setTargetedSubject('');
        setTargetedMessage('');
    }
  };

  const copyToClipboard = () => {
    if (phoneNumbers) {
      navigator.clipboard.writeText(phoneNumbers)
        .then(() => toast.info('Phone numbers copied to clipboard!'))
        .catch(() => toast.error('Failed to copy text.'));
    }
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return [];
    return allPatients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [searchQuery, allPatients]);

  return (
    <div className="broadcast-container">
      <header className="broadcast-header">
        <h1>Broadcast Center</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button-broadcast">
          <i className="fas fa-arrow-left"></i>
        </button>
      </header>
      
      <div className="broadcast-grid">
        {/* Birthday Broadcast Card */}
        <div className="broadcast-card birthday-card">
          <div className="card-icon birthday"><i className="fas fa-birthday-cake"></i></div>
          <h3>Today's Birthday Wishes</h3>
          <p>Send a happy birthday email to all patients whose birthday is today.</p>
          
          <div className="birthday-list-container">
            {loading.list ? (
              <div className="loader"><i className="fas fa-spinner fa-spin"></i></div>
            ) : birthdayPatients.length > 0 ? (
              <ul className="birthday-list">
                {birthdayPatients.map(p => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            ) : (
              <p className="no-birthdays">No birthdays today!</p>
            )}
          </div>

          <button 
            onClick={handleSendBirthdayWishes} 
            disabled={loading.birthday || birthdayPatients.length === 0} 
            className="broadcast-button"
          >
            {loading.birthday ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Wishes</>}
          </button>
        </div>

        {/* Direct Message Card */}
        <div className="broadcast-card wide-card">
            <div className="card-icon direct-message"><i className="fas fa-user-edit"></i></div>
            <h3>Direct Patient Message</h3>
            <p>Search for a patient by name and send them a personal email.</p>
            <form onSubmit={handleSendDirectMessage} className="direct-message-form">
                <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        placeholder="Search patient name..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (selectedPatient) setSelectedPatient(null); 
                        }}
                        disabled={!!selectedPatient}
                        className="search-input"
                    /> 
                    {searchQuery && !selectedPatient && (
                        <ul className="search-results">
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map(p => (
                                    <li key={p.id} onClick={() => {
                                        setSelectedPatient(p);
                                        setSearchQuery(p.name);
                                    }}>
                                        {p.name}
                                    </li>
                                ))
                            ) : (
                                <li className="no-results">No patients found</li>
                            )}
                        </ul>
                    )}
                </div>

                {selectedPatient && (
                    <div className="direct-message-fields">
                        <input
                            type="text"
                            placeholder="Email Subject"
                            value={directSubject}
                            onChange={(e) => setDirectSubject(e.target.value)}
                            required
                        />
                        <textarea
                            placeholder={`Type your message to ${selectedPatient.name}...`}
                            rows="5"
                            value={directMessage}
                            onChange={(e) => setDirectMessage(e.target.value)}
                            required
                        ></textarea>
                    </div>
                )}

                <button type="submit" disabled={loading.direct || !selectedPatient} className="broadcast-button">
                    {loading.direct ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Direct Message</>}
                </button>
            </form>
        </div>

        {/* Filter & Targeted Broadcast Card */}
        <div className="broadcast-card wide-card">
          <div className="card-icon filter"><i className="fas fa-filter"></i></div>
          <h3>Targeted Filter Broadcast</h3>
          <p>Filter patients by treatment plan or visit date and send them a specific email.</p>
          
          <form onSubmit={handleFilterPatients} className="custom-broadcast-form" style={{ marginBottom: '1.5rem' }}>
             <div className="form-row">
                <div className="form-col">
                  <label className="form-label">From Date:</label>
                  <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                </div>
                <div className="form-col">
                  <label className="form-label">To Date:</label>
                  <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                </div>
             </div>
             
             <div className="form-col">
                <label className="form-label">Treatment Plan / Diagnosis:</label>
                <select 
                    value={treatmentPlanOptions.includes(filterDiagnosis) ? filterDiagnosis : ''} 
                    onChange={e => setFilterDiagnosis(e.target.value)}
                    className="broadcast-select"
                >
                    <option value="">-- Select a Treatment Plan --</option>
                    {treatmentPlanOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <input 
                    type="text" 
                    placeholder="Or type Treatment Plan / Diagnosis manually..." 
                    value={filterDiagnosis} 
                    onChange={e => setFilterDiagnosis(e.target.value)} 
                />
             </div>

             <button type="submit" disabled={loading.filter} className="broadcast-button">
                 {loading.filter ? <><i className="fas fa-spinner fa-spin"></i> Filtering...</> : <><i className="fas fa-search"></i> Search Patients</>}
             </button>
          </form>

          {hasFiltered && (
              <div className="filter-results-box">
                  <p>
                      <i className="fas fa-check-circle"></i> Found {filteredTargetPatients.length} patient(s) matching criteria.
                  </p>
                  
                  {filteredTargetPatients.length > 0 && (
                      <form onSubmit={handleSendTargetedBroadcast} className="custom-broadcast-form">
                          <input 
                              type="text" 
                              placeholder="Email Subject" 
                              value={targetedSubject} 
                              onChange={e => setTargetedSubject(e.target.value)} 
                              required 
                          />
                          <textarea 
                              placeholder="Type your targeted message here..." 
                              rows="5" 
                              value={targetedMessage} 
                              onChange={e => setTargetedMessage(e.target.value)} 
                              required
                          ></textarea>
                          <button type="submit" disabled={loading.targeted} className="broadcast-button">
                              {loading.targeted ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Targeted Broadcast</>}
                          </button>
                      </form>
                  )}
              </div>
          )}
        </div>

        {/* Mass Email Broadcast Card */}
        <div className="broadcast-card wide-card">
          <div className="card-icon custom"><i className="fas fa-bullhorn"></i></div>
          <h3>Mass Email Broadcast</h3>
          <p>Send a mass email to all registered patients and staff members in batches.</p>
          <form onSubmit={handleSendCustomBroadcast} className="custom-broadcast-form">
            <input
              type="text"
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <textarea
              placeholder="Type your message here..."
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
            
            {/* Batch Range Selection */}
            <div className="form-row" style={{ alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="From (e.g., 1)"
                  value={startRange}
                  onChange={(e) => setStartRange(Number(e.target.value))}
                  min="1"
                  required
                />
                <span style={{ color: 'var(--text-medium)', fontWeight: '600' }}>to</span>
                <input
                  type="number"
                  placeholder="To (e.g., 100)"
                  value={endRange}
                  onChange={(e) => setEndRange(Number(e.target.value))}
                  min="1"
                  required
                />
            </div>

            <button type="submit" disabled={loading.custom} className="broadcast-button">
              {loading.custom ? <><i className="fas fa-spinner fa-spin"></i> Broadcasting...</> : <><i className="fas fa-envelope-open-text"></i> Send Broadcast Batch</>}
            </button>
          </form>
        </div>

        {/* Phone Numbers Card */}
        <div className="broadcast-card wide-card">
          <div className="card-icon phones"><i className="fas fa-sms"></i></div>
          <h3>Export Phone Numbers</h3>
          <p>Generate a comma-separated list of all patient phone numbers for SMS campaigns.</p>
          <button onClick={handleFetchPhoneNumbers} disabled={loading.phones} className="broadcast-button">
             {loading.phones ? <><i className="fas fa-spinner fa-spin"></i> Fetching...</> : <><i className="fas fa-download"></i> Fetch All Numbers</>}
          </button>

          {phoneNumbers && (
            <div className="phone-numbers-result">
              <textarea value={phoneNumbers} readOnly rows="5"></textarea>
              <button onClick={copyToClipboard} className="broadcast-button copy-button">
                <i className="fas fa-copy"></i> Copy to Clipboard
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
