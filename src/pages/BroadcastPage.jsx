// src/pages/BroadcastPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './BroadcastPage.css';

export default function BroadcastPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [birthdayPatients, setBirthdayPatients] = useState([]);
  
  // State for Direct Message feature
  const [allPatients, setAllPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [directSubject, setDirectSubject] = useState('');
  const [directMessage, setDirectMessage] = useState('');

  const [loading, setLoading] = useState({
    birthday: false,
    custom: false,
    phones: false,
    direct: false,
    list: true, // Initially true while fetching the birthday list and all patients
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
      if (response.ok || response.status === 207) { // 207 is Multi-Status for partial success
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
      // Fetch birthday list
      const birthdayData = await handleApiCall('/api/broadcast/birthday-list', 'GET', null, 'list');
      if (birthdayData && birthdayData.patients) {
        setBirthdayPatients(birthdayData.patients);
      } else {
        setBirthdayPatients([]);
      }
      // Fetch all patients for the direct message search
      const patientsData = await handleApiCall('/api/patients', 'GET', null, 'list'); // reuse 'list' loading state
      if (patientsData) {
        setAllPatients(patientsData);
      }
    };
    fetchInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendBirthdayWishes = async () => {
    await handleApiCall('/api/broadcast/birthday', 'POST', null, 'birthday');
    // Refresh the list after sending
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
    handleApiCall('/api/broadcast/custom', 'POST', { subject, message }, 'custom');
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
        // Clear form on success
        setSelectedPatient(null);
        setSearchQuery('');
        setDirectSubject('');
        setDirectMessage('');
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
    return allPatients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5); // Show top 5 matches
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

        {/* Direct Message Card - NEW */}
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
                            if (selectedPatient) setSelectedPatient(null); // Deselect if user starts typing again
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

        {/* Custom Broadcast Card */}
        <div className="broadcast-card wide-card">
          <div className="card-icon custom"><i className="fas fa-bullhorn"></i></div>
          <h3>Custom Email Broadcast</h3>
          <p>Send a custom email to all registered patients and staff members.</p>
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
            <button type="submit" disabled={loading.custom} className="broadcast-button">
              {loading.custom ? <><i className="fas fa-spinner fa-spin"></i> Broadcasting...</> : <><i className="fas fa-envelope-open-text"></i> Send Broadcast</>}
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
