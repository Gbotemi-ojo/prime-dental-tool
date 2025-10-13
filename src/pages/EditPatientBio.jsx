import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './edit-patient-bio.css'; 
import API_BASE_URL from '../config/api';

export default function EditPatientBio() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        sex: '',
        dateOfBirth: '',
        phoneNumber: '',
        email: '',
        address: '',
        hmo: null,
        isFamilyHead: false
    });
    
    // --- NEW: State for dynamically fetched HMO list ---
    const [hmoOptions, setHmoOptions] = useState([]);

    const [newMembers, setNewMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                // Fetch patient data and HMO list in parallel for efficiency
                const [patientResponse, hmoResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL}/api/billing/options`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                // Handle HMO data
                if (hmoResponse.ok) {
                    const hmoData = await hmoResponse.json();
                    setHmoOptions(hmoData.hmos || []);
                } else {
                    console.error("Failed to fetch HMO list.");
                }

                // Handle patient data
                const patientData = await patientResponse.json();
                if (patientResponse.ok) {
                    setFormData({
                        name: patientData.name || '',
                        sex: patientData.sex || '',
                        dateOfBirth: patientData.dateOfBirth ? formatDateForInput(patientData.dateOfBirth) : '',
                        phoneNumber: patientData.phoneNumber || '',
                        email: patientData.email || '',
                        address: patientData.address || '',
                        hmo: patientData.hmo || null,
                        isFamilyHead: patientData.isFamilyHead || false,
                    });
                } else {
                    setError(patientData.error || 'Failed to fetch patient data.');
                }
            } catch (err) {
                setError('Network error or server is unreachable.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [patientId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'hmo') {
            const selectedHMO = hmoOptions.find(hmo => hmo.name === value);
            setFormData(prev => ({ ...prev, hmo: selectedHMO || null }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleMemberChange = (index, e) => {
        const { name, value } = e.target;
        const updatedMembers = [...newMembers];
        updatedMembers[index][name] = value;
        setNewMembers(updatedMembers);
    };

    const addMemberForm = () => {
        setNewMembers([...newMembers, { name: '', sex: '', dateOfBirth: '' }]);
    };

    const removeMemberForm = (index) => {
        const updatedMembers = newMembers.filter((_, i) => i !== index);
        setNewMembers(updatedMembers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        setIsError(false);
        const token = localStorage.getItem('jwtToken');

        try {
            const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update patient bio.');
            }
            setMessage('Patient bio updated successfully! ');
        } catch (err) {
            setMessage(`Error updating bio: ${err.message}`);
            setIsError(true);
            setSubmitting(false);
            return;
        }

        if (newMembers.length > 0) {
            let membersAddedCount = 0;
            for (const member of newMembers) {
                try {
                    const memberResponse = await fetch(`${API_BASE_URL}/api/patients/${patientId}/members`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(member),
                    });
                    if (memberResponse.ok) {
                        membersAddedCount++;
                    } else {
                       const errorData = await memberResponse.json();
                       console.error(`Failed to add member ${member.name}:`, errorData.message);
                    }
                } catch (err) {
                    console.error(`Network error adding member ${member.name}:`, err);
                }
            }
             setMessage(prev => `${prev} Added ${membersAddedCount} new family member(s).`);
        }

        setSubmitting(false);
        setTimeout(() => navigate(`/patients/${patientId}`), 2000);
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div><p>Loading...</p></div>;
    if (error) return <div className="edit-patient-bio-container"><p className="message error">Error: {error}</p></div>;

    return (
        <div className="edit-patient-bio-container">
            <header className="edit-patient-bio-header">
                <h2>Edit Patient Bio</h2>
                <button onClick={() => navigate('/patients')} className="back-to-list-button">
                    <i className="fas fa-arrow-left"></i> Back to Patient List
                </button>
            </header>

            <form onSubmit={handleSubmit} className="edit-patient-bio-form">
                <section className="form-section">
                    <h3>Patient Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="name">Full Name *</label>
                            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="sex">Sex *</label>
                            <select id="sex" name="sex" value={formData.sex} onChange={handleChange} required>
                                <option value="">Select Sex</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth</label>
                            <input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phoneNumber">Phone Number *</label>
                             <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required disabled={!formData.isFamilyHead} title={!formData.isFamilyHead ? "Cannot edit for a family member" : ""} />
                        </div>
                         <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={!formData.isFamilyHead} title={!formData.isFamilyHead ? "Cannot edit for a family member" : ""} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                name="address"
                                rows="3"
                                value={formData.address}
                                onChange={handleChange}
                                disabled={!formData.isFamilyHead}
                                title={!formData.isFamilyHead ? "Address is inherited from the family head" : "Address is shared by all family members"}
                            />
                        </div>
                        <div className="form-group">
                           <label htmlFor="hmo">HMO / Insurance</label>
                           <select id="hmo" name="hmo" value={formData.hmo ? formData.hmo.name : ''} onChange={handleChange} disabled={!formData.isFamilyHead} title={!formData.isFamilyHead ? "Cannot edit for a family member" : ""}>
                               <option value="">Select HMO</option>
                               {hmoOptions.map((hmo) => <option key={hmo.id} value={hmo.name}>{hmo.name}</option>)}
                           </select>
                        </div>
                    </div>
                </section>

                {formData.isFamilyHead && (
                    <section className="form-section members-section">
                        <h3>Add Family Members</h3>
                        {newMembers.map((member, index) => (
                            <div key={index} className="member-form-group">
                                <div className="member-header">
                                    <h4>New Member #{index + 1}</h4>
                                    <button type="button" onClick={() => removeMemberForm(index)} className="remove-member-button">
                                        <i className="fas fa-trash"></i> Remove
                                    </button>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor={`memberName-${index}`}>Full Name *</label>
                                        <input id={`memberName-${index}`} name="name" type="text" value={member.name} onChange={(e) => handleMemberChange(index, e)} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`memberSex-${index}`}>Sex *</label>
                                        <select id={`memberSex-${index}`} name="sex" value={member.sex} onChange={(e) => handleMemberChange(index, e)} required>
                                            <option value="">Select Sex</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`memberDob-${index}`}>Date of Birth</label>
                                        <input id={`memberDob-${index}`} name="dateOfBirth" type="date" value={member.dateOfBirth} onChange={(e) => handleMemberChange(index, e)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addMemberForm} className="add-member-button">
                            <i className="fas fa-plus-circle"></i> Add Another Member
                        </button>
                    </section>
                )}

                {message && (
                    <div className={`message ${isError ? 'error' : 'success'}`}>{message}</div>
                )}

                <div className="form-actions">
                    <button type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Update and Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
