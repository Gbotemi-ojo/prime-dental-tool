import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './patient-receipts-page.css';
import API_BASE_URL from '../config/api';

export default function PatientReceiptsPage() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [latestDentalRecord, setLatestDentalRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const [receiptItems, setReceiptItems] = useState([]); // [{ id: unique, name: 'Service Name', price: number }]
    const [selectedService, setSelectedService] = useState('');
    const [selectedHMO, setSelectedHMO] = useState('');
    const [hmoCoveredAmount, setHmoCoveredAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Hardcoded list of services with base prices
    const serviceOptions = [
        { name: "Registration & Consultation", price: 5000 },
        { name: "Registration & Consultation (family)", price: 10000 },
        { name: "Scaling and Polishing", price: 40000 },
        { name: "Scaling and Polishing with Gross Stain", price: 50000 },
        { name: "Simple Extraction Anterior", price: 40000 },
        { name: "Simple Extraction Posterior", price: 50000 },
        { name: "Extraction of Retained Root", price: 50000 },
        { name: "Surgical Extraction (Impacted 3rd Molar)", price: 100000 },
        { name: "Temporary Dressing", price: 20000 },
        { name: "Amalgam Filling", price: 30000 },
        { name: "Fuji 9 (Posterior GIC per Filling)", price: 50000 },
        { name: "Tooth Whitening (3 Sessions)", price: 100000 },
        { name: "Curretage/Subgingival (per tooth)", price: 30000 },
        { name: "Composite Buildup", price: 50000 },
        { name: "Removable Denture (Additional Tooth)", price: 50000 },
        { name: "PFM Crown", price: 150000 },
        { name: "Topical Flouridation/Desensitization", price: 20000 },
        { name: "X-Ray", price: 10000 },
        { name: "Root Canal Treatment Anterior", price: 100000 },
        { name: "Root Canal Treatment Posterior", price: 150000 },
        { name: "Gingivectomy/Operculectomy", price: 30000 },
        { name: "Splinting with Wires", price: 100000 },
        { name: "Splinting with GIC Composite", price: 150000 },
        { name: "Incision & Drainage/Suturing with Debridement", price: 50000 },
        { name: "Fissure Sealant", price: 20000 },
        { name: "Pulpotomy/Pulpectomy", price: 50000 },
        { name: "Stainless Steel Crown", price: 75000 },
        { name: "Band & Loop Space Maintainers", price: 60000 },
        { name: "LLA & TPA Space Maintainers", price: 70000 },
        { name: "Essix Retainer", price: 100000 },
        { name: "Crown Cementation", price: 30000 },
        { name: "Esthetic Tooth Filling", price: 35000 },
        { name: "Zirconium Crown", price: 250000 },
        { name: "Gold Crown", price: 0, placeholder: "Based on value of gold" }, // Price will be editable
        { name: "Flexible Denture (per tooth)", price: 75000 },
        { name: "Flexible Denture (2nd tooth)", price: 40000 },
        { name: "Metallic Crown", price: 70000 },
        { name: "Dental Implant – One Tooth", price: 1200000 },
        { name: "Dental Implant – Two Teeth", price: 1800000 },
        { name: "Orthodontist Consult", price: 20000 },
        { name: "Partial Denture", price: 50000 },
        { name: "Denture Repair", price: 30000 },
        { name: "GIC Filling", price: 40000 },
        { name: "Braces Consultation", price: 20000 },
        { name: "Braces", price: 0, placeholder: "Based on complexity" }, // Price will be editable
        { name: "Fluoride Treatment", price: 35000 },
        { name: "Intermaxillary Fixation", price: 150000 },
        { name: "Aligners", price: 0, placeholder: "Based on complexity" }, // Price will be editable
        { name: "E-Max Crown", price: 300000 }
    ];

    // Filtered list of HMOs to only include "ONBOARD" ones
    const hmoOptions = [
        { name: "IHMS", status: "ONBOARD" },
        { name: "HEALTH PARTNERS", status: "ONBOARD" },
        { name: "PHILIPS", status: "ONBOARD" },
        { name: "CLEARLINE", status: "ONBOARD" },
        { name: "WELLNESS", status: "ONBOARD" },
        { name: "RELIANCE", status: "ONBOARD" },
        { name: "METROHEALTH", status: "ONBOARD" },
        { name: "BASTION", status: "ONBOARD" },
        { name: "REDCARE", status: "ONBOARD" },
        { name: "AVON", status: "ONBOARD" },
        { name: "ANCHOR", status: "ONBOARD" },
        { name: "LEADWAY", status: "ONBOARD" },
        { name: "NOOR", status: "ONBOARD" },
        { name: "ALLENZA", status: "ONBOARD" },
        { name: "UNITED HEALTH CARE", status: "ONBOARD" },
        { name: "LEADWAY", status: "ONBOARD" },
        { name: "QUEST", status: "ONBOARD" },
        { name: "AVON", status: "ONBOARD" },
        { name: "CLEARLINE", status: "ONBOARD" }
    ];

    useEffect(() => {
        const fetchPatientAndRecordDetails = async () => {
            const token = localStorage.getItem('jwtToken');
            const role = localStorage.getItem('role');
            setUserRole(role);

            if (!token) {
                toast.error('Authentication required. Please log in.');
                navigate('/login');
                return;
            }

            if (role !== 'owner' && role !== 'staff') {
                toast.error('Access denied. Only Staff and Owners can access this page.');
                navigate('/patient-management');
                return;
            }

            const parsedPatientId = parseInt(patientId);
            if (isNaN(parsedPatientId)) {
                setError("Invalid Patient ID provided in the URL.");
                setLoading(false);
                return;
            }

            try {
                // Fetch Patient Details
                const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (patientResponse.ok) {
                    const patientData = await patientResponse.json();
                    setPatient(patientData);

                    // Fetch Patient's Latest Dental Record
                    const dentalRecordsResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (dentalRecordsResponse.ok) {
                        const dentalRecords = await dentalRecordsResponse.json();
                        // Assuming the backend returns records sorted by date descending, take the first one
                        if (dentalRecords && dentalRecords.length > 0) {
                            const latestRecord = dentalRecords[0];
                            setLatestDentalRecord(latestRecord);

                            // Pre-populate receipt items with treatment plan from the latest record
                            if (latestRecord.treatmentPlan && Array.isArray(latestRecord.treatmentPlan)) {
                                const prefilledItems = latestRecord.treatmentPlan.map((plan, index) => {
                                    // Try to find a matching service and use its price, otherwise default to 0
                                    const matchedService = serviceOptions.find(s => s.name.toLowerCase() === plan.toLowerCase());
                                    return {
                                        id: `plan-${index}-${Date.now()}`, // Unique ID
                                        name: plan,
                                        price: matchedService ? matchedService.price : 0, // Default to 0 if not found
                                    };
                                });
                                setReceiptItems(prefilledItems);
                            }
                        } else {
                            console.log('No dental records found for this patient.');
                        }
                    } else {
                        console.warn('Failed to fetch dental records for pre-populating receipt.');
                    }

                } else if (patientResponse.status === 404) {
                    setError('Patient not found.');
                } else {
                    const errorData = await patientResponse.json();
                    setError(errorData.error || `Failed to fetch patient details. Status: ${patientResponse.status}`);
                }
            } catch (err) {
                setError('Network error. Could not connect to the server.');
                console.error('Network Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPatientAndRecordDetails();
    }, [patientId, navigate]);

    const handleAddService = () => {
        if (selectedService) {
            const serviceInfo = serviceOptions.find(s => s.name === selectedService);
            if (serviceInfo) {
                setReceiptItems(prevItems => [
                    ...prevItems,
                    {
                        id: Date.now(), // Unique ID for key
                        name: serviceInfo.name,
                        price: serviceInfo.price,
                    }
                ]);
                setSelectedService(''); // Reset dropdown
            }
        } else {
            toast.warn('Please select a service to add.');
        }
    };

    const handleRemoveService = (idToRemove) => {
        setReceiptItems(prevItems => prevItems.filter(item => item.id !== idToRemove));
    };

    const handlePriceChange = (id, newPrice) => {
        setReceiptItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, price: parseFloat(newPrice) || 0 } : item
            )
        );
    };

    const handleHmoChange = (e) => {
        const selectedHmoName = e.target.value;
        setSelectedHMO(selectedHmoName);
        setHmoCoveredAmount(''); // Reset amount when HMO changes
    };

    const subtotal = receiptItems.reduce((sum, item) => sum + item.price, 0);
    const coveredAmount = parseFloat(hmoCoveredAmount) || 0;
    const totalDue = subtotal - coveredAmount;

    const handleGenerateReceipt = () => {
        if (receiptItems.length === 0) {
            toast.error('Please add at least one service to generate a receipt.');
            return;
        }
        setShowReceipt(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendReceipt = async () => {
        if (!patient?.email) {
            toast.error('Patient email address is missing. Cannot send receipt.');
            return;
        }
        if (receiptItems.length === 0) {
            toast.error('Please add at least one service to generate a receipt.');
            return;
        }
        if (!paymentMethod) {
            toast.error('Please select a payment method.');
            return;
        }

        setIsSendingEmail(true);
        const token = localStorage.getItem('jwtToken');
        const currentUser = JSON.parse(localStorage.getItem('user'));

        const currentReceiptNumber = `PR-${Date.now()}`; // Generate here for consistency
        const currentReceiptDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const receiptData = {
            // These fields are required at the root level by your backend's validation
            patientId: patient.id,
            receiptNumber: currentReceiptNumber,
            receiptDate: currentReceiptDate,
            amountPaid: totalDue,
            paymentMethod: paymentMethod,

            // Other necessary receipt details
            patientEmail: patient.email,
            patientName: patient.name,
            items: receiptItems.map(item => ({
                description: item.name,
                amount: item.price
            })),
            hmoProvider: selectedHMO || 'N/A',
            hmoCoveredAmount: selectedHMO ? coveredAmount : 0,
            clinicName: process.env.REACT_APP_CLINIC_NAME || 'Prime Dental Clinic',
            clinicAddress: process.env.REACT_APP_CLINIC_ADDRESS || '123 Dental St, Smile City',
            clinicPhone: process.env.REACT_APP_CLINIC_PHONE || '+1234567890',
            clinicEmail: process.env.REACT_APP_EMAIL_FROM || 'info@yourclinic.com',
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/receipts/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patientEmail: patient.email, // This is explicitly for the email service
                    receiptData: receiptData, // The main data object
                    senderUserId: currentUser ? currentUser.id : null
                })
            });

            if (response.ok) {
                toast.success('Receipt email sent successfully!');
            } else {
                const errorData = await response.json();
                toast.error(`Failed to send receipt email: ${errorData.error || 'Unknown error'}`);
                console.error('Failed to send receipt email:', errorData);
            }
        } catch (err) {
            toast.error('Network error. Could not send receipt email.');
            console.error('Network Error during receipt email send:', err);
        } finally {
            setIsSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="app-container">
                <div className="receipts-container" style={{ textAlign: 'center', padding: '50px' }}>
                    <p className="info-message">Loading patient details...</p>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <div className="receipts-container">
                    <p className="info-message error">Error: {error}</p>
                    <button onClick={() => navigate(`/patients/${patientId}`)} className="back-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
                        <i className="fas fa-arrow-left"></i> Back to Patient Details
                    </button>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="app-container">
                <div className="receipts-container">
                    <p className="info-message">Patient data not found.</p>
                    <button onClick={() => navigate(`/patients`)} className="back-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
                        <i className="fas fa-arrow-left"></i> Back to Patient List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="receipts-container">
            <header className="receipts-header">
                <h1>Generate Receipt for {patient.name}</h1>
                <div className="actions">
                    <button onClick={() => navigate(`/patients/${patient.id}`)} className="back-button">
                        <i className="fas fa-arrow-left"></i> Back to Patient Details
                    </button>
                    <button onClick={handleGenerateReceipt} className="generate-receipt-button" disabled={receiptItems.length === 0}>
                        <i className="fas fa-file-invoice"></i> Generate Receipt Display
                    </button>
                    {showReceipt && (
                        <>
                            <button onClick={handlePrint} className="print-receipt-button">
                                <i className="fas fa-print"></i> Print Receipt
                            </button>
                            <button
                                onClick={handleSendReceipt}
                                className="send-receipt-button"
                                disabled={isSendingEmail || !patient?.email || receiptItems.length === 0 || !paymentMethod}
                            >
                                {isSendingEmail ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-envelope"></i> Send Receipt Email
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </header>

            {!showReceipt ? (
                <section className="receipt-form-section">
                    <h2>Patient Information</h2>
                    <div className="patient-info-display">
                        <p><strong>Name:</strong> {patient.name}</p>
                        {userRole === 'nurse' ? (
                            <>
                                <p><strong>Phone:</strong> <span className="restricted-info"></span></p>
                                <p><strong>Email:</strong> <span className="restricted-info"></span></p>
                            </>
                        ) : (
                            <>
                                <p><strong>Phone:</strong> {patient.phoneNumber}</p>
                                <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
                            </>
                        )}
                    </div>

                    <h2>Services Rendered</h2>
                    <div className="service-selection">
                        <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="form-select">
                            <option value="">Select a service</option>
                            {serviceOptions.map((service, index) => (
                                <option key={index} value={service.name}>
                                    {service.name} - ₦{service.price.toLocaleString()}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddService} className="add-service-button">
                            Add Service
                        </button>
                    </div>

                    {receiptItems.length > 0 && (
                        <div className="receipt-items-list">
                            <h3>Added Services:</h3>
                            <table className="services-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Price (₦)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receiptItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                                    className="price-input"
                                                    min="0"
                                                />
                                            </td>
                                            <td>
                                                <button onClick={() => handleRemoveService(item.id)} className="remove-service-button">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="subtotal-display">
                                <strong>Subtotal:</strong> ₦{subtotal.toLocaleString()}
                            </div>
                        </div>
                    )}

                    <h2>HMO / Insurance Details</h2>
                    <div className="hmo-selection">
                        <select value={selectedHMO} onChange={handleHmoChange} className="form-select">
                            <option value="">Select HMO Provider</option>
                            {hmoOptions.map((hmo, index) => (
                                <option key={index} value={hmo.name}>
                                    {hmo.name} ({hmo.status})
                                </option>
                            ))}
                        </select>
                        {selectedHMO && (
                            <div className="hmo-covered-input">
                                <label htmlFor="hmoCoveredAmount">HMO Covered Amount (₦)</label>
                                <input
                                    type="number"
                                    id="hmoCoveredAmount"
                                    value={hmoCoveredAmount}
                                    onChange={(e) => setHmoCoveredAmount(e.target.value)}
                                    placeholder="e.g., 50000"
                                    min="0"
                                    className="form-control"
                                />
                            </div>
                        )}
                    </div>

                    <h2>Payment Method</h2>
                    <div className="payment-method-selection">
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-select">
                            <option value="">Select Payment Method</option>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Transfer">Bank Transfer</option>
                            <option value="HMO">HMO Payment</option>
                        </select>
                    </div>

                </section>
            ) : (
                <div className="receipt-display-area printable-content">
                    <div className="receipt-header-display">
                        <h2>Official Receipt</h2>
                        <p>Receipt Number: PR-{Date.now()}</p>
                        <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="receipt-patient-info">
                        <h3>Patient Details:</h3>
                        <p><strong>Name:</strong> {patient.name}</p>
                        {userRole === 'nurse' ? (
                            <>
                                <p><strong>Phone:</strong> <span className="restricted-info"></span></p>
                                <p><strong>Email:</strong> <span className="restricted-info"></span></p>
                            </>
                        ) : (
                            <>
                                <p><strong>Phone:</strong> {patient.phoneNumber}</p>
                                <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
                            </>
                        )}
                    </div>
                    <div className="receipt-services-rendered">
                        <h3>Services:</h3>
                        <table className="receipt-services-table">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Price (₦)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receiptItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>₦{item.price.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="receipt-summary">
                        <p><strong>Subtotal:</strong> ₦{subtotal.toLocaleString()}</p>
                        {selectedHMO && (
                            <p>
                                <strong>HMO ({selectedHMO}):</strong> ₦{coveredAmount.toLocaleString()} Covered
                            </p>
                        )}
                        <p><strong>Payment Method:</strong> {paymentMethod || 'N/A'}</p>
                        <p className="total-due">
                            <strong>Total Amount Due from Patient:</strong> ₦{totalDue.toLocaleString()}
                        </p>
                    </div>
                    <div className="receipt-footer">
                        <p>Thank you for your business!</p>
                        <p>Signature: _________________________</p>
                        <p className="clinic-contact">
                            {process.env.REACT_APP_CLINIC_NAME || 'Prime Dental Clinic'} |
                            {process.env.REACT_APP_CLINIC_ADDRESS || '123 Dental St, Smile City'} |
                            {process.env.REACT_APP_CLINIC_PHONE || '+1234567890'} |
                            {process.env.REACT_APP_EMAIL_FROM || 'info@yourclinic.com'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
