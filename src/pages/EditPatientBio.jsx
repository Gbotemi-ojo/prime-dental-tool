import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './edit-patient-bio.css'; // Import the dedicated CSS file
import API_BASE_URL from '../config/api';

// HMO Options for the dropdown (copied for consistency)
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
    { name: "LEADWAY" }, { name: "QUEST" }, { name: "AVON" },
    { name: "CLEARLINE" }
];

export default function EditPatientBio() {
    const { patientId } = useParams(); // Get patientId from URL parameters
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        sex: '',
        dateOfBirth: '',
        phoneNumber: '',
        email: '',
        hmo: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Helper to format date to YYYY-MM-DD for input[type="date"]
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Fetch patient data when the component mounts or patientId changes
    useEffect(() => {
        const fetchPatientData = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (response.ok) {
                    setFormData({
                        name: data.name || '',
                        sex: data.sex || '',
                        dateOfBirth: data.dateOfBirth ? formatDateForInput(data.dateOfBirth) : '',
                        phoneNumber: data.phoneNumber || '',
                        email: data.email || '',
                        hmo: data.hmo || null, // HMO should already be an object or null
                    });
                } else {
                    setError(data.error || 'Failed to fetch patient data.');
                }
            } catch (err) {
                console.error('Fetch patient error:', err);
                setError('Network error or server is unreachable.');
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, [patientId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'hmo') {
            const selectedHMO = hmoOptions.find(hmo => hmo.name === value);
            setFormData((prevData) => ({
                ...prevData,
                hmo: selectedHMO || null,
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        setIsError(false);

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            setMessage('Authentication required.');
            setIsError(true);
            setSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Patient bio updated successfully!');
                setIsError(false);
                // NEW: Navigate back to the patient list after successful update
                navigate('/patients');
            } else {
                setMessage(data.message || data.error || 'Failed to update patient bio.');
                setIsError(true);
            }
        } catch (err) {
            console.error('Update patient bio error:', err);
            setMessage('Network error or server is unreachable. Please try again later.');
            setIsError(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="edit-patient-bio-container">
                <p className="info-message">Loading patient data...</p>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="edit-patient-bio-container">
                <p className="error-message">Error: {error}</p>
                <button onClick={() => navigate('/patients')} className="back-button">Back to Patient List</button>
            </div>
        );
    }

    return (
        <div className="edit-patient-bio-container">
            <header className="edit-patient-bio-header">
                <h2>Edit Patient Bio</h2>
                {/* This button still navigates to the specific patient details page */}
                <button onClick={() => navigate(`/patients/${patientId}`)} className="back-to-details-button">
                    <i className="fas fa-arrow-left"></i> Back to Patient Details
                </button>
            </header>

            <form onSubmit={handleSubmit} className="edit-patient-bio-form">
                <section className="form-section">
                    <h3>Patient Information</h3>
                    <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="hmo">HMO / Insurance Provider</label>
                        <select
                            id="hmo"
                            name="hmo"
                            value={formData.hmo ? formData.hmo.name : ''}
                            onChange={handleChange}
                        >
                            <option value="">Select HMO (Optional)</option>
                            {hmoOptions.map((hmo, index) => (
                                <option key={index} value={hmo.name}>
                                    {hmo.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {message && (
                    <div className={`message ${isError ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Updating Bio...' : 'Update Patient Bio'}
                    </button>
                </div>
            </form>
        </div>
    );
}
