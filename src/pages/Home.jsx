import React, { useState } from 'react';
import './patient-form.css'; // Import the CSS file

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
  // State to hold form data
  const [formData, setFormData] = useState({
    name: '',
    sex: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
  });

  // State for form submission status and messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    // Basic client-side validation
    if (!formData.name || !formData.sex || !formData.phoneNumber) {
      setMessage('Please fill in all required fields (Name, Sex, Phone Number).');
      setIsError(true);
      setLoading(false);
      return;
    }

    // Email format validation (optional, but good practice)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage('Please enter a valid email address.');
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      // Replace 'http://localhost:5000' with your actual backend URL
      const response = await fetch('https://prime-dental-tool-backend.vercel.app/api/patients/guest-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Patient information submitted successfully!');
        setIsError(false);
        // Clear the form on successful submission
        setFormData({
          name: '',
          sex: '',
          dateOfBirth: '',
          phoneNumber: '',
          email: '',
        });
      } else {
        setMessage(data.error || 'Failed to submit patient information. Please try again.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage('Network error or server is unreachable. Please try again later.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Patient Information Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sex">Sex *</label>
          <select
            id="sex"
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            required
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number *</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            placeholder="e.g., +1234567890"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., john.doe@example.com"
          />
        </div>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Information'}
          </button>
        </div>
      </form>

      <div className="login-link">
        Are you a staff member? <a href="/login">Login here</a>
      </div>
    </div>
  );
}