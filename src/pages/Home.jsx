import React, { useState } from 'react';
import './patient-form.css'; // Import the CSS file
import API_BASE_URL from '../config/api';

// HMO Options for the dropdown, copied from InvoicePage.jsx for consistency
const hmoOptions = [
    { name: "IHMS" },
    { name: "HEALTH PARTNERS" },
    { name: "ZENOR" },
    { name: "PHILIPS" },
    { name: "PRO HEALTH" },
    { name: "FOUNTAIN HEALTH" },
    { name: "DOT HMO" },
    { name: "CLEARLINE" },
    { name: "STERLING HEALTH" },
    { name: "OCEANIC" },
    { name: "SUNU" },
    { name: "LIFEWORTH" },
    { name: "CKLINE" },
    { name: "WELLNESS" },
    { name: "RELIANCE" },
    { name: "FIRST GUARANTEE" },
    { name: "THT" },
    { name: "DOHEEC" },
    { name: "GNI" },
    { name: "MH" },
    { name: "AIICO MULTISHIELD" },
    { name: "GREENBAY" },
    { name: "MARINA" },
    { name: "EAGLE" },
    { name: "MEDIPLAN" },
    { name: "METROHEALTH" },
    { name: "RONSBERGER" },
    { name: "WELPRO" },
    { name: "GORAH" },
    { name: "SMATHEALTH" },
    { name: "AXA MANSARD" },
    { name: "BASTION" },
    { name: "REDCARE" },
    { name: "AVON" },
    { name: "ANCHOR" },
    { name: "LEADWAY" },
    { name: "NOOR" },
    { name: "ALLENZA" },
    { name: "UNITED HEALTH CARE" },
    { name: "LEADWAY" },
    { name: "QUEST" },
    { name: "AVON" },
    { name: "CLEARLINE" }
];

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
  // State to control which form is currently displayed: 'new', 'returning', or 'none'
  const [currentForm, setCurrentForm] = useState('none');

  // State to hold new patient form data
  const [newPatientFormData, setNewPatientFormData] = useState({
    name: '',
    sex: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    hmo: null, // NEW: State for HMO, initialized to null
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
    tagline: 'Your smile, our priority', // Added tagline
    addressLine1: 'Local government, 104, New Ipaja/Egbeda Road,',
    addressLine2: 'opposite prestige super-market, Alimosho, Ipaja Rd, Ipaja, Lagos 100006, Lagos',
    phone: '0703 070 8877',
  };

  // Handle input changes for new patient form
  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    if (name === 'hmo') {
      // Find the selected HMO object from the hmoOptions array
      const selectedHMO = hmoOptions.find(hmo => hmo.name === value);
      setNewPatientFormData((prevData) => ({
        ...prevData,
        hmo: selectedHMO || null, // Store the entire HMO object or null if "Select HMO" is chosen
      }));
    } else {
      setNewPatientFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
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
          hmo: null, // Reset HMO field
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
      const response = await fetch(`${API_BASE_URL}/api/patients/returning-guest-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        {/* The tagline is placed directly after the clinic name */}
        <p className="clinic-tagline">{clinicInfo.tagline}</p>
        <p>{clinicInfo.addressLine1}</p>
        <p>{clinicInfo.addressLine2}</p>
        <p>Phone: {clinicInfo.phone}</p>
      </div>

      {/* Buttons to select form type */}
      {currentForm === 'none' && (
        <div className="form-selection-buttons">
          {/* Descriptive text for the patient */}
          <p className="form-selection-description">
            Please select whether you are a new patient registering for the first time or a returning patient checking in for a follow-up.
          </p>
          <button className="new-patient-button" onClick={() => setCurrentForm('new')}>
            New Patient
          </button>
          <button className="returning-patient-button" onClick={() => setCurrentForm('returning')}>
            Returning Patient
          </button>
        </div>
      )}

      {/* Section for New Patients - Conditionally rendered */}
      {currentForm === 'new' && (
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

            {/* NEW: HMO Selection */}
            <div className="form-group">
              <label htmlFor="newHmo">HMO / Insurance Provider</label>
              <select
                id="newHmo"
                name="hmo"
                value={newPatientFormData.hmo ? newPatientFormData.hmo.name : ''} // Display selected HMO name
                onChange={handleNewPatientChange}
              >
                <option value="">Select HMO (Optional)</option>
                {hmoOptions.map((hmo, index) => (
                  <option key={index} value={hmo.name}>
                    {hmo.name}
                  </option>
                ))}
              </select>
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
             {/* Back button */}
            <div className="form-actions">
                <button type="button" className="back-button" onClick={() => setCurrentForm('none')}>
                    Back
                </button>
            </div>
          </form>
        </div>
      )}

      {/* Separator - Only show if not displaying a specific form */}
      {currentForm === 'none' && <div className="form-separator">OR</div>}

      {/* Section for Returning Patients - Conditionally rendered */}
      {currentForm === 'returning' && (
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
            {/* Back button */}
            <div className="form-actions">
                <button type="button" className="back-button" onClick={() => setCurrentForm('none')}>
                    Back
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="login-link">
        Are you a staff member? <a href="/login">Login here</a>
      </div>
    </div>
  );
}
