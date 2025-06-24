import React, { useState } from 'react';
import './patient-form.css'; // Import the CSS file
import API_BASE_URL from '../config/api';

// HMO Options for the dropdown, copied from InvoicePage.jsx for consistency
const hmoOptions = [
    { name: "IHMS" }, { name: "HEALTH PARTNERS" }, { name: "ZENOR" },
    { name: "PHILIPS" }, { name: "PRO HEALTH" }, { name: "FOUNTAIN HEALTH" },
    { name: "DOT HMO" }, { name: "CLEARLINE" }, { name: "STERLING HEALTH" },
    { name: "OCEANIC" }, { name: "SUNU" }, { name: "LIFEWORTH" },
    { name: "CKLINE" }, { name: "WELLNESS" }, { name: "RELIANCE" },
    { name: "FIRST GUARANTEE" }, { name: "THT" }, { name: "DOHEEC" },
    { name: "GNI" }, { name: "MH" }, { name: "AIICO MULTISHIELD" },
    { name: "GREENBAY" }, { name: "MARINA" }, { name: "EAGLE" },
    { name: "MEDIPLAN" }, { name: "METROHEALTH" }, { name: "RONSBERGER" },
    { name: "WELPRO" }, { name: "GORAH" }, { name: "SMATHEALTH" },
    { name: "AXA MANSARD" }, { name: "BASTION" }, { name: "REDCARE" },
    { name: "AVON" }, { name: "ANCHOR" }, { name: "LEADWAY" },
    { name: "NOOR" }, { name: "ALLENZA" }, { name: "UNITED HEALTH CARE" },
    { name: "QUEST" }
];

// Main component to render the Patient Registration Portal
export default function PatientHomePage() {
  return (
    <div className="app-container">
      <PatientRegistrationPortal />
    </div>
  );
}

function PatientRegistrationPortal() {
  // State to control which main view is displayed: 'none', 'new', or 'returning'
  const [currentForm, setCurrentForm] = useState('none');
  // State for the type of new account: 'none', 'individual', 'family'
  const [newAccountType, setNewAccountType] = useState('none');

  // State for form data (used for individual patient or family head)
  const [headPatientData, setHeadPatientData] = useState({
    name: '',
    sex: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    hmo: null,
  });

  // State for family members
  const [familyMembers, setFamilyMembers] = useState([{ name: '', sex: '', dateOfBirth: '' }]);

  // State for returning patient phone number
  const [returningPatientPhoneNumber, setReturningPatientPhoneNumber] = useState('');

  // Unified state for loading, message, and error status
  const [submissionStatus, setSubmissionStatus] = useState({
    loading: false,
    message: '',
    isError: false,
  });

  // Clinic Information
  const clinicInfo = {
    name: 'Prime Dental Clinic',
    tagline: 'Your smile, our priority',
    addressLine1: 'Local government, 104, New Ipaja/Egbeda Road,',
    addressLine2: 'opposite prestige super-market, Alimosho, Ipaja Rd, Ipaja, Lagos 100006, Lagos',
    phone: '0703 070 8877',
  };

  // --- HANDLERS FOR HEAD/INDIVIDUAL PATIENT ---
  const handleHeadDataChange = (e) => {
    const { name, value } = e.target;
    if (name === 'hmo') {
      const selectedHMO = hmoOptions.find(hmo => hmo.name === value);
      setHeadPatientData((prevData) => ({ ...prevData, hmo: selectedHMO || null }));
    } else {
      setHeadPatientData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  // --- HANDLERS FOR FAMILY MEMBERS ---
  const handleMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMembers = [...familyMembers];
    updatedMembers[index][name] = value;
    setFamilyMembers(updatedMembers);
  };

  const addMember = () => {
    setFamilyMembers([...familyMembers, { name: '', sex: '', dateOfBirth: '' }]);
  };

  const removeMember = (index) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    }
  };

  const resetFormState = () => {
    setHeadPatientData({ name: '', sex: '', dateOfBirth: '', phoneNumber: '', email: '', hmo: null });
    setFamilyMembers([{ name: '', sex: '', dateOfBirth: '' }]);
    setReturningPatientPhoneNumber('');
  }

  // --- SUBMISSION HANDLERS ---
  const handleSubmit = async (e, accountType) => {
    e.preventDefault();
    setSubmissionStatus({ loading: true, message: '', isError: false });

    let url = '';
    let body = {};

    if (accountType === 'individual') {
      if (!headPatientData.name || !headPatientData.sex || !headPatientData.phoneNumber) {
        setSubmissionStatus({ loading: false, message: 'Please fill in all required fields (Name, Sex, Phone Number).', isError: true });
        return;
      }
      url = `${API_BASE_URL}/api/patients/guest-submit`;
      body = headPatientData;
    } else if (accountType === 'family') {
       if (!headPatientData.name || !headPatientData.sex || !headPatientData.phoneNumber) {
        setSubmissionStatus({ loading: false, message: 'Please fill in all required fields for the Family Head.', isError: true });
        return;
      }
      url = `${API_BASE_URL}/api/patients/guest-family-submit`;
      body = { ...headPatientData, members: familyMembers };
    } else if (accountType === 'returning') {
        if (!returningPatientPhoneNumber) {
            setSubmissionStatus({ loading: false, message: 'Please enter the phone number.', isError: true });
            return;
        }
        url = `${API_BASE_URL}/api/patients/returning-guest-visit`;
        body = { phoneNumber: returningPatientPhoneNumber };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (response.ok) {
        setSubmissionStatus({ loading: false, message: data.message || 'Submission successful!', isError: false });
        resetFormState();
      } else {
        setSubmissionStatus({ loading: false, message: data.error || 'Submission failed. Please try again.', isError: true });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus({ loading: false, message: 'Network error or server is unreachable. Please try again later.', isError: true });
    }
  };

  // --- UI RENDER LOGIC ---

  const renderNewPatientForm = (accountType) => (
    <form onSubmit={(e) => handleSubmit(e, accountType)}>
      <h3>{accountType === 'family' ? 'Family Head Information' : 'Patient Information'}</h3>
      <div className="form-group">
        <label htmlFor="name">Full Name *</label>
        <input type="text" id="name" name="name" value={headPatientData.name} onChange={handleHeadDataChange} required placeholder="e.g., John Doe" />
      </div>
      <div className="form-group">
        <label htmlFor="sex">Sex *</label>
        <select id="sex" name="sex" value={headPatientData.sex} onChange={handleHeadDataChange} required>
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="dateOfBirth">Date of Birth</label>
        <input type="date" id="dateOfBirth" name="dateOfBirth" value={headPatientData.dateOfBirth} onChange={handleHeadDataChange} />
      </div>
      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number *</label>
        <input type="tel" id="phoneNumber" name="phoneNumber" value={headPatientData.phoneNumber} onChange={handleHeadDataChange} required placeholder="e.g., +1234567890" />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" value={headPatientData.email} onChange={handleHeadDataChange} placeholder="e.g., john.doe@example.com" />
      </div>
      <div className="form-group">
        <label htmlFor="hmo">HMO / Insurance Provider</label>
        <select id="hmo" name="hmo" value={headPatientData.hmo ? headPatientData.hmo.name : ''} onChange={handleHeadDataChange}>
          <option value="">Select HMO (Optional)</option>
          {hmoOptions.map((hmo, index) => <option key={index} value={hmo.name}>{hmo.name}</option>)}
        </select>
      </div>

      {accountType === 'family' && (
        <div className="family-members-section">
          <h3>Family Members</h3>
          {familyMembers.map((member, index) => (
            <div key={index} className="member-form-group">
              <div className="member-header">
                <h4>Member {index + 1}</h4>
                {familyMembers.length > 1 && <button type="button" className="remove-member-button" onClick={() => removeMember(index)}>Remove</button>}
              </div>
              <div className="form-group">
                <label htmlFor={`memberName${index}`}>Full Name *</label>
                <input type="text" id={`memberName${index}`} name="name" value={member.name} onChange={(e) => handleMemberChange(index, e)} required placeholder="Member's Name"/>
              </div>
              <div className="form-group">
                <label htmlFor={`memberSex${index}`}>Sex *</label>
                <select id={`memberSex${index}`} name="sex" value={member.sex} onChange={(e) => handleMemberChange(index, e)} required>
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor={`memberDob${index}`}>Date of Birth</label>
                <input type="date" id={`memberDob${index}`} name="dateOfBirth" value={member.dateOfBirth} onChange={(e) => handleMemberChange(index, e)} />
              </div>
            </div>
          ))}
          <button type="button" className="add-member-button" onClick={addMember}>+ Add Another Member</button>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={submissionStatus.loading}>
          {submissionStatus.loading ? 'Submitting...' : `Register ${accountType === 'family' ? 'Family' : 'Patient'}`}
        </button>
      </div>
      {submissionStatus.message && <div className={`message ${submissionStatus.isError ? 'error' : 'success'}`}>{submissionStatus.message}</div>}
      <div className="form-actions">
          <button type="button" className="back-button" onClick={() => setNewAccountType('none')}>Back to Account Type</button>
      </div>
    </form>
  );

  return (
    <div className="form-container">
      <div className="clinic-header">
        <h1>{clinicInfo.name}</h1>
        <p className="clinic-tagline">{clinicInfo.tagline}</p>
        <p>{clinicInfo.addressLine1}</p>
        <p>{clinicInfo.addressLine2}</p>
        <p>Phone: {clinicInfo.phone}</p>
      </div>

      {currentForm === 'none' && (
        <div className="form-selection-buttons">
          <p className="form-selection-description">Please select whether you are a new patient or a returning patient.</p>
          <button className="new-patient-button" onClick={() => setCurrentForm('new')}>New Patient</button>
          <button className="returning-patient-button" onClick={() => setCurrentForm('returning')}>Returning Patient</button>
        </div>
      )}

      {currentForm === 'new' && (
        <div className="form-section">
          {newAccountType === 'none' && (
            <>
              <h2>New Patient Registration</h2>
              <div className="form-selection-buttons">
                <p className="form-selection-description">Are you registering for yourself or for a family?</p>
                <button className="new-patient-button" onClick={() => setNewAccountType('individual')}>Individual Account</button>
                <button className="returning-patient-button" onClick={() => setNewAccountType('family')}>Family Account</button>
              </div>
               <div className="form-actions">
                  <button type="button" className="back-button" onClick={() => setCurrentForm('none')}>Back</button>
               </div>
            </>
          )}

          {newAccountType === 'individual' && (
            <>
              <h2>Individual Account Registration</h2>
              <p className="section-description">Fill out this form to create a new individual patient account.</p>
              {renderNewPatientForm('individual')}
            </>
          )}
          
          {newAccountType === 'family' && (
            <>
              <h2>Family Account Registration</h2>
              <p className="section-description">Register a family head and add family members below.</p>
              {renderNewPatientForm('family')}
            </>
          )}
        </div>
      )}

      {currentForm === 'returning' && (
        <div className="form-section returning-patient-section">
          <h2>Returning Patient Check-in</h2>
          <p className="section-description">If you've visited us before, please enter your phone number to check-in.</p>
          <form onSubmit={(e) => handleSubmit(e, 'returning')}>
            <div className="form-group">
              <label htmlFor="returningPhoneNumber">Phone Number *</label>
              <input type="tel" id="returningPhoneNumber" value={returningPatientPhoneNumber} onChange={(e) => setReturningPatientPhoneNumber(e.target.value)} required placeholder="e.g., +1234567890" />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={submissionStatus.loading} className="returning-button">
                {submissionStatus.loading ? 'Checking In...' : 'Check-in'}
              </button>
            </div>
            {submissionStatus.message && <div className={`message ${submissionStatus.isError ? 'error' : 'success'}`}>{submissionStatus.message}</div>}
            <div className="form-actions">
              <button type="button" className="back-button" onClick={() => { setCurrentForm('none'); setSubmissionStatus({loading: false, message:'', isError: false}); }}>Back</button>
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
