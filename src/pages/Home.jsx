import React, { useState } from 'react';
import './patient-form.css'; // Import the CSS file
import API_BASE_URL from '../config/api';

// Main App component to render the PatientForm
// In a real application, this would be your main App.js or a specific page component.
export default function App() {
  return (
    <div className="app-container">
      <PatientForm />
    </div>
  );
}

function PatientForm() {
  // State to hold new patient form data
  const [newPatientFormData, setNewPatientFormData] = useState({
    name: '',
    sex: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
  });

  // State to hold returning patient phone number
  const [returningPatientPhoneNumber, setReturningPatientPhoneNumber] = useState('');

  // State for form submission status and messages for New Guest Form
  const [loadingNewGuest, setLoadingNewGuest] = useState(false);
  const [newGuestMessage, setNewGuestMessage] = useState('');
  const [isNewGuestError, setIsNewGuestError] = useState(false);

  // State for form submission status and messages for Returning Guest Form
  const [loadingReturningGuest, setLoadingReturningGuest] = useState(false);
  const [returningGuestMessage, setReturningGuestMessage] = useState('');
  const [isReturningGuestError, setIsReturningGuestError] = useState(false);

  // Clinic Information (hardcoded as per your request)
  const clinicInfo = {
    name: 'Prime Dental Clinic',
    addressLine1: 'Local government, 104, New Ipaja/Egbeda Road,',
    addressLine2: 'opposite prestige super-market, Alimosho, Ipaja Rd, Ipaja, Lagos 100006, Lagos',
    phone: '0703 070 8877',
  };

  // Handle input changes for new patient form
  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatientFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle input changes for returning patient form
  const handleReturningPatientPhoneChange = (e) => {
    setReturningPatientPhoneNumber(e.target.value);
  };

  // Handle new guest patient form submission
  const handleNewGuestSubmit = async (e) => {
    e.preventDefault();
    setLoadingNewGuest(true);
    setNewGuestMessage(''); // Clear previous message
    setIsNewGuestError(false); // Clear previous error state

    // Basic client-side validation for new guest
    if (!newPatientFormData.name || !newPatientFormData.sex || !newPatientFormData.phoneNumber) {
      setNewGuestMessage('Please fill in all required fields (Name, Sex, Phone Number).');
      setIsNewGuestError(true);
      setLoadingNewGuest(false);
      return;
    }

    // Email format validation (optional, but good practice)
    if (newPatientFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatientFormData.email)) {
      setNewGuestMessage('Please enter a valid email address.');
      setIsNewGuestError(true);
      setLoadingNewGuest(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/guest-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPatientFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setNewGuestMessage(data.message || 'New patient information submitted successfully!');
        setIsNewGuestError(false);
        // Clear the form on successful submission
        setNewPatientFormData({
          name: '',
          sex: '',
          dateOfBirth: '',
          phoneNumber: '',
          email: '',
        });
      } else {
        setNewGuestMessage(data.error || 'Failed to submit new patient information. Please try again.');
        setIsNewGuestError(true);
      }
    } catch (error) {
      console.error('New patient submission error:', error);
      setNewGuestMessage('Network error or server is unreachable. Please try again later.');
      setIsNewGuestError(true);
    } finally {
      setLoadingNewGuest(false);
    }
  };

  // Handle returning guest patient form submission
  const handleReturningGuestSubmit = async (e) => {
    e.preventDefault();
    setLoadingReturningGuest(true);
    setReturningGuestMessage(''); // Clear previous message
    setIsReturningGuestError(false); // Clear previous error state

    if (!returningPatientPhoneNumber) {
      setReturningGuestMessage('Please enter the phone number for returning patient.');
      setIsReturningGuestError(true);
      setLoadingReturningGuest(false);
      return;
    }

    try {
      // NOTE: The backend endpoint `/api/patients/returning-guest-visit` currently
      // requires authentication (e.g., JWT token). To truly make this accessible
      // on a public landing page without a staff member logging in, you would
      // need to adjust the backend route to *not* require authentication for this
      // specific endpoint, or implement a mechanism for anonymous/public access.
      // This frontend change *removes the attempt to send a token*, but the backend
      // will still enforce its security rules.
      // const token = localStorage.getItem('jwtToken');
      // if (!token) {
      //   console.warn("No JWT token found for returning guest submission. This endpoint might require authentication.");
      //   setReturningGuestMessage("Authentication required to record returning guest visit. Please log in.");
      //   setIsReturningGuestError(true);
      //   setLoadingReturningGuest(false);
      //   return;
      // }

      const response = await fetch(`${API_BASE_URL}/api/patients/returning-guest-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // Removed as per request for public access
        },
        body: JSON.stringify({ phoneNumber: returningPatientPhoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setReturningGuestMessage(data.message || `Visit recorded for ${data.patientName || 'returning guest'}!`);
        setIsReturningGuestError(false);
        setReturningPatientPhoneNumber(''); // Clear the phone number field
      } else {
        setReturningGuestMessage(data.error || 'Failed to record returning guest visit. Please try again.');
        setIsReturningGuestError(true);
      }
    } catch (error) {
      console.error('Returning guest submission error:', error);
      setReturningGuestMessage('Network error or server is unreachable. Please try again later.');
      setIsReturningGuestError(true);
    } finally {
      setLoadingReturningGuest(false);
    }
  };

  return (
    <div className="form-container">
      {/* Clinic Header Section */}
      <div className="clinic-header">
        <h1>{clinicInfo.name}</h1>
        <p>{clinicInfo.addressLine1}</p>
        <p>{clinicInfo.addressLine2}</p>
        <p>Phone: {clinicInfo.phone}</p>
      </div>

      {/* Section for New Patients */}
      <div className="form-section">
        <h2>New Patient Registration</h2>
        <p className="section-description">Fill out this form if you are visiting for the first time.</p>
        <form onSubmit={handleNewGuestSubmit}>
          <div className="form-group">
            <label htmlFor="newName">Full Name *</label>
            <input
              type="text"
              id="newName"
              name="name"
              value={newPatientFormData.name}
              onChange={handleNewPatientChange}
              required
              placeholder="e.g., John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newSex">Sex *</label>
            <select
              id="newSex"
              name="sex"
              value={newPatientFormData.sex}
              onChange={handleNewPatientChange}
              required
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="newDateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="newDateOfBirth"
              name="dateOfBirth"
              value={newPatientFormData.dateOfBirth}
              onChange={handleNewPatientChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPhoneNumber">Phone Number *</label>
            <input
              type="tel"
              id="newPhoneNumber"
              name="phoneNumber"
              value={newPatientFormData.phoneNumber}
              onChange={handleNewPatientChange}
              required
              placeholder="e.g., +1234567890"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newEmail">Email Address</label>
            <input
              type="email"
              id="newEmail"
              name="email"
              value={newPatientFormData.email}
              onChange={handleNewPatientChange}
              placeholder="e.g., john.doe@example.com"
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loadingNewGuest}>
              {loadingNewGuest ? 'Submitting New Patient...' : 'Register New Patient'}
            </button>
          </div>
          {/* New Guest Message Display */}
          {newGuestMessage && (
            <div className={`message ${isNewGuestError ? 'error' : 'success'}`}>
              {newGuestMessage}
            </div>
          )}
        </form>
      </div>

      {/* Separator */}
      <div className="form-separator">OR</div>

      {/* Section for Returning Patients */}
      <div className="form-section returning-patient-section">
        <h2>Returning Patient Check-in</h2>
        <p className="section-description">If you've visited us before, please enter your phone number to check-in.</p>
        <form onSubmit={handleReturningGuestSubmit}>
          <div className="form-group">
            <label htmlFor="returningPhoneNumber">Phone Number *</label>
            <input
              type="tel"
              id="returningPhoneNumber"
              name="returningPhoneNumber"
              value={returningPatientPhoneNumber}
              onChange={handleReturningPatientPhoneChange}
              required
              placeholder="e.g., +1234567890"
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loadingReturningGuest} className="returning-button">
              {loadingReturningGuest ? 'Checking In...' : 'Check-in as Returning Patient'}
            </button>
          </div>
          {/* Returning Guest Message Display */}
          {returningGuestMessage && (
            <div className={`message ${isReturningGuestError ? 'error' : 'success'}`}>
              {returningGuestMessage}
            </div>
          )}
        </form>
      </div>

      <div className="login-link">
        Are you a staff member? <a href="/login">Login here</a>
      </div>
    </div>
  );
}
