import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './edit-patient-bio.css'; 
import API_BASE_URL from '../config/api';

// HMO Options for the dropdown
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
    { name: "CLEARLINE" }, { name: "HYGEIA" }, { name: "NEM" }, { name: "KENNEDIA" }
];

export default function EditPatientBio() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    // UPDATED: Added 'address' field to state
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
        const fetchPatientData = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    // UPDATED: Set address from fetched data
                    setFormData({
                        name: data.name || '',
                        sex: data.sex || '',
                        dateOfBirth: data.dateOfBirth ? formatDateForInput(data.dateOfBirth) : '',
                        phoneNumber: data.phoneNumber || '',
                        email: data.email || '',
                        address: data.address || '',
                        hmo: data.hmo || null,
                        isFamilyHead: data.isFamilyHead || false,
                    });
                } else {
                    setError(data.error || 'Failed to fetch patient data.');
                }
            } catch (err) {
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
                        {/* UPDATED: Added Address textarea, disabled for non-family heads */}
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
                               {hmoOptions.map((hmo, i) => <option key={i} value={hmo.name}>{hmo.name}</option>)}
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
