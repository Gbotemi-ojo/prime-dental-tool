// src/pages/BroadcastPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './BroadcastPage.css';

export default function BroadcastPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [birthdayPatients, setBirthdayPatients] = useState([]);
  const [loading, setLoading] = useState({
    birthday: false,
    custom: false,
    phones: false,
    list: true, // Initially true while fetching the birthday list
  });
  const navigate = useNavigate();

  const handleApiCall = async (endpoint, method, body, loadingKey) => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error('Authentication expired. Please log in again.');
      navigate('/login');
      return null;
    }

    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcast/${endpoint}`, {
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
  
  const fetchBirthdayList = async () => {
    const data = await handleApiCall('birthday-list', 'GET', null, 'list');
    if (data && data.patients) {
      setBirthdayPatients(data.patients);
    } else {
      setBirthdayPatients([]); // Clear list on error
    }
  };

  useEffect(() => {
    fetchBirthdayList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendBirthdayWishes = async () => {
    await handleApiCall('birthday', 'POST', null, 'birthday');
    fetchBirthdayList(); // Refresh the list after sending
  };
  
  const handleSendCustomBroadcast = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.warn('Please provide both a subject and a message.');
      return;
    }
    handleApiCall('custom', 'POST', { subject, message }, 'custom');
  };
  
  const handleFetchPhoneNumbers = async () => {
    const data = await handleApiCall('phone-numbers', 'GET', null, 'phones');
    if (data && data.phoneNumbers) {
      setPhoneNumbers(data.phoneNumbers);
    }
  };

  const copyToClipboard = () => {
    if (phoneNumbers) {
      navigator.clipboard.writeText(phoneNumbers)
        .then(() => toast.info('Phone numbers copied to clipboard!'))
        .catch(() => toast.error('Failed to copy text.'));
    }
  };

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
