import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './invoice-page.css'; // New CSS file for this page

// Declare serviceOptions and hmoOptions outside the component
// as they are static and do not depend on component state or props.
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
    // CORRECTED: Naming to EXACTLY match the reported string from treatmentPlan
    { name: "FUJI 9(POSTERIOR GIC (PER FILLING)", price: 50000 },
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

// All HMOs now have status: "ONBOARD" with a dummy coverage rate for internal calculation
const hmoOptions = [
    { name: "IHMS", status: "ONBOARD", coverage: 0.8 },
    { name: "HEALTH PARTNERS", status: "ONBOARD", coverage: 0.75 },
    { name: "ZENOR", status: "ONBOARD", coverage: 0.9 },
    { name: "PHILIPS", status: "ONBOARD", coverage: 0.6 },
    { name: "PRO HEALTH", status: "ONBOARD", coverage: 0.85 },
    { name: "FOUNTAIN HEALTH", status: "ONBOARD", coverage: 0.7 },
    { name: "DOT HMO", status: "ONBOARD", coverage: 0.95 },
    { name: "CLEARLINE", status: "ONBOARD", coverage: 0.8 },
    { name: "STERLING HEALTH", status: "ONBOARD", coverage: 0.75 },
    { name: "OCEANIC", status: "ONBOARD", coverage: 0.88 },
    { name: "SUNU", status: "ONBOARD", coverage: 0.7 },
    { name: "LIFEWORTH", status: "ONBOARD", coverage: 0.82 },
    { name: "CKLINE", status: "ONBOARD", coverage: 0.65 },
    { name: "WELLNESS", status: "ONBOARD", coverage: 0.9 },
    { name: "RELIANCE", status: "ONBOARD", coverage: 0.78 },
    { name: "FIRST GUARANTEE", status: "ONBOARD", coverage: 0.83 },
    { name: "THT", status: "ONBOARD", coverage: 0.72 },
    { name: "DOHEEC", status: "ONBOARD", coverage: 0.87 },
    { name: "GNI", status: "ONBOARD", coverage: 0.73 },
    { name: "MH", status: "ONBOARD", coverage: 0.8 },
    { name: "AIICO MULTISHIELD", status: "ONBOARD", coverage: 0.92 },
    { name: "GREENBAY", status: "ONBOARD", coverage: 0.68 },
    { name: "MARINA", status: "ONBOARD", coverage: 0.85 },
    { name: "EAGLE", status: "ONBOARD", coverage: 0.79 },
    { name: "MEDIPLAN", status: "ONBOARD", coverage: 0.8 },
    { name: "METROHEALTH", status: "ONBOARD", coverage: 0.86 },
    { name: "RONSBERGER", status: "ONBOARD", coverage: 0.7 },
    { name: "WELPRO", status: "ONBOARD", coverage: 0.91 },
    { name: "GORAH", status: "ONBOARD", coverage: 0.76 },
    { name: "SMATHEALTH", status: "ONBOARD", coverage: 0.84 },
    { name: "AXA MANSARD", status: "ONBOARD", coverage: 0.93 },
    { name: "BASTION", status: "ONBOARD", coverage: 0.77 },
    { name: "REDCARE", status: "ONBOARD", coverage: 0.89 },
    { name: "AVON", status: "ONBOARD", coverage: 0.9 },
    { name: "ANCHOR", status: "ONBOARD", coverage: 0.71 },
    { name: "LEADWAY", status: "ONBOARD", coverage: 0.88 },
    { name: "NOOR", status: "ONBOARD", coverage: 0.74 },
    { name: "ALLENZA", status: "ONBOARD", coverage: 0.81 },
    { name: "UNITED HEALTH CARE", status: "ONBOARD", coverage: 0.94 },
    { name: "QUEST", status: "ONBOARD", coverage: 0.8 },
];


export default function InvoicePage() {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [latestDentalRecord, setLatestDentalRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const [invoiceItems, setInvoiceItems] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [selectedHMO, setSelectedHMO] = useState('');
    const [hmoCoveredAmount, setHmoCoveredAmount] = useState('');
    const [showInvoice, setShowInvoice] = useState(false);
    // Invoice number needs to be consistent, initialize once and keep
    const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);

    // Determine if the patient has an HMO registered in their profile
    const patientHasHMO = !!patient?.hmo?.name;
    const patientHMOName = patientHasHMO ? patient.hmo.name : '';
    const patientHmoCoverageRate = patientHasHMO ?
        (hmoOptions.find(hmo => hmo.name === patientHMOName)?.coverage || 0) : 0;


    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            const token = localStorage.getItem('jwtToken');
            const role = localStorage.getItem('role');
            setUserRole(role);

            if (!token) {
                toast.error('Authentication required. Please log in.');
                navigate('/login');
                return;
            }

            // Nurse can also access now for sending invoices
            if (role !== 'owner' && role !== 'staff' && role !== 'nurse') {
                toast.error('Access denied. Only Staff, Nurses, and Owners can access this page.');
                navigate(`/patients/${patientId}`);
                return;
            }

            const parsedPatientId = parseInt(patientId);
            if (isNaN(parsedPatientId)) {
                setError("Invalid Patient ID provided in the URL.");
                setLoading(false);
                return;
            }

            try {
                const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (patientResponse.ok) {
                    const patientData = await patientResponse.json();
                    setPatient(patientData);
                    // Pre-select patient's HMO if they have one
                    if (patientData.hmo && patientData.hmo.name) {
                        setSelectedHMO(patientData.hmo.name);
                    }
                } else if (patientResponse.status === 404) {
                    setError('Patient not found.');
                    setLoading(false);
                    return;
                } else {
                    const errorData = await patientResponse.json();
                    setError(errorData.error || `Failed to fetch patient details. Status: ${patientResponse.status}`);
                    setLoading(false);
                    return;
                }

                const recordsResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (recordsResponse.ok) {
                    const recordsData = await recordsResponse.json();
                    if (recordsData && recordsData.length > 0) {
                        const sortedRecords = recordsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        const latestRecord = sortedRecords[0];
                        setLatestDentalRecord(latestRecord);

                        if (latestRecord.treatmentPlan && Array.isArray(latestRecord.treatmentPlan)) {
                            const preAddedItems = latestRecord.treatmentPlan.map((planItem, index) => {
                                // Trim the planItem and convert to lowercase for case-insensitive matching
                                const serviceMatch = serviceOptions.find(s => s.name.toLowerCase() === planItem.toLowerCase().trim());
                                return {
                                    id: `tp-${Date.now()}-${index}`,
                                    name: planItem.trim(),
                                    // Use the price from serviceMatch, default to 0 if no match
                                    price: serviceMatch ? serviceMatch.price : 0,
                                    quantity: 1
                                };
                            });
                            if (preAddedItems.length > 0) {
                                setInvoiceItems(preAddedItems);
                                toast.info('Treatment plan items pre-added to invoice. Please review prices.');
                            }
                        }
                    }
                } else {
                    console.warn(`Could not fetch dental records for patient ${parsedPatientId}. Status: ${recordsResponse.status}`);
                }

            } catch (err) {
                setError('Network error. Could not connect to the server.');
                console.error('Network Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoiceDetails();
    }, [patientId, navigate]);

    const handleAddService = () => {
        if (selectedService) {
            const serviceInfo = serviceOptions.find(s => s.name === selectedService);
            if (serviceInfo) {
                setInvoiceItems(prevItems => {
                    const existingItem = prevItems.find(item => item.name === serviceInfo.name);
                    if (existingItem) {
                        toast.warn(`"${serviceInfo.name}" is already in the invoice. Adjust quantity if needed.`);
                        return prevItems;
                    }

                    return [
                        ...prevItems,
                        {
                            id: Date.now(),
                            name: serviceInfo.name,
                            price: serviceInfo.price,
                            quantity: 1
                        }
                    ];
                });
                setSelectedService('');
            }
        } else {
            toast.warn('Please select a service to add.');
        }
    };

    const handleRemoveService = (idToRemove) => {
        setInvoiceItems(prevItems => prevItems.filter(item => item.id !== idToRemove));
    };

    const handlePriceChange = (id, newPrice) => {
        setInvoiceItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, price: parseFloat(newPrice) || 0 } : item
            )
        );
    };

    const handleQuantityChange = (id, newQuantity) => {
        setInvoiceItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, quantity: parseInt(newQuantity) || 1 } : item
            )
        );
    };

    const handleHmoChange = (e) => {
        const selectedHmoName = e.target.value;
        setSelectedHMO(selectedHmoName);
        setHmoCoveredAmount(''); // Reset covered amount on HMO change
    };

    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let calculatedCoveredAmount = 0;
    if (patientHasHMO && selectedHMO === patientHMOName) {
        calculatedCoveredAmount = subtotal * patientHmoCoverageRate;
    }

    // Prioritize manually entered HMO Covered Amount if it's a valid number and greater than 0
    const manualHmoCovered = parseFloat(hmoCoveredAmount);
    const finalCoveredAmount = (manualHmoCovered > 0) ? manualHmoCovered : calculatedCoveredAmount;

    const totalDue = subtotal - finalCoveredAmount;

    // This check determines if the invoice should behave like an HMO invoice (hide prices, show only balance/fully covered)
    const isInvoiceForHmoPatient = patientHasHMO && selectedHMO === patientHMOName;


    const handleGenerateInvoice = () => {
        if (invoiceItems.length === 0) {
            toast.error('Please add at least one service to generate an invoice.');
            return;
        }
        setShowInvoice(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        if (!patient || !patient.email) {
            toast.error('Patient email is missing. Cannot send invoice.');
            return;
        }
        if (invoiceItems.length === 0) {
            toast.error('No services added to the invoice to send.');
            return;
        }

        const token = localStorage.getItem('jwtToken');
        if (!token) {
            toast.error('Authentication token missing. Please log in.');
            return;
        }

        // --- ENHANCED LOGGING BEFORE SENDING PAYLOAD ---
        console.log("--- Frontend Payload Debugging ---");
        console.log("Frontend - invoiceItems raw:", invoiceItems);
        // Log each item's calculated totalPrice
        invoiceItems.forEach((item, index) => {
            console.log(`Frontend - invoiceItems[${index}] - name: ${item.name}, price: ${item.price}, quantity: ${item.quantity}, calculated totalPrice: ${item.price * item.quantity}`);
        });

        console.log("Frontend - subtotal (calculated):", subtotal);
        console.log("Frontend - coveredAmount (final after logic):", finalCoveredAmount); // Use finalCoveredAmount
        console.log("Frontend - totalDue (calculated):", totalDue);
        console.log("Frontend - isInvoiceForHmoPatient:", isInvoiceForHmoPatient);
        console.log("Frontend - selectedHMO:", selectedHMO);
        console.log("Frontend - hmoCoveredAmount (input):", hmoCoveredAmount);
        console.log("Frontend - patientHasHMO:", patientHasHMO);
        console.log("Frontend - patientHMOName:", patientHMOName);
        console.log("Frontend - patientHmoCoverageRate:", patientHmoCoverageRate);


        const payload = {
            patientId: patient.id,
            patientName: patient.name,
            patientEmail: patient.email,
            invoiceNumber: invoiceNumber,
            invoiceDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            // Only send 'items' array, structured as the backend validation expects.
            // The backend's EmailService will be responsible for transforming this
            // into the 'services' format for the email template.
            items: invoiceItems.map(item => ({
                description: item.name,    // Map item.name to description
                quantity: item.quantity,
                unitPrice: item.price,     // Map item.price to unitPrice
                totalPrice: item.price * item.quantity // Calculate totalPrice for each item here
            })),
            isHmoCovered: isInvoiceForHmoPatient,
            hmoName: isInvoiceForHmoPatient ? selectedHMO : null,
            coveredAmount: isInvoiceForHmoPatient ? finalCoveredAmount : 0, // Use finalCoveredAmount here
            totalAmount: totalDue, // This is the total amount due from the patient (totalDue from frontend)
            notes: "Please make payment within 7 days of invoice date.",
            clinicName: process.env.REACT_APP_CLINIC_NAME || "Prime Dental Clinic",
            clinicAddress: process.env.REACT_APP_CLINIC_ADDRESS || "local government, 104, New Ipaja/Egbeda Road, opposite prestige super-market, Alimosho, Ipaja Rd, Ipaja, Lagos 100006, Lagos",
            clinicPhone: process.env.REACT_APP_CLINIC_PHONE || "0703 070 8877",
            // Include latestDentalRecord for the template
            latestDentalRecord: latestDentalRecord ? {
                provisionalDiagnosis: Array.isArray(latestDentalRecord.provisionalDiagnosis) ? latestDentalRecord.provisionalDiagnosis.join(', ') : latestDentalRecord.provisionalDiagnosis || 'N/A',
                treatmentPlan: Array.isArray(latestDentalRecord.treatmentPlan) ? latestDentalRecord.treatmentPlan.join(', ') : latestDentalRecord.treatmentPlan || 'N/A'
            } : null,
            // Pass subtotal and totalDue explicitly for non-HMO display in template
            subtotal: subtotal, // Raw subtotal
            totalDueFromPatient: totalDue // Renamed to clearly reflect patient's responsibility
        };

        // Log the final payload to the console for debugging
        console.log('Final payload sent to backend:', payload);

        try {
            const response = await fetch(`${API_BASE_URL}/api/invoices/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Invoice email sent successfully!');
            } else {
                const errorData = await response.json();
                toast.error(`Failed to send invoice email: ${errorData.error || response.statusText}`);
                console.error('Backend error response:', errorData);
            }
        } catch (error) {
            console.error('Network error or unexpected issue during invoice email send:', error);
            toast.error('Network error. Could not send invoice email.');
        }
    };


    if (loading) {
        return (
            <div className="app-container">
                <div className="invoice-container" style={{ textAlign: 'center', padding: '50px' }}>
                    <p className="info-message">Loading patient details and dental records...</p>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <div className="invoice-container">
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
                <div className="invoice-container">
                    <p className="info-message">Patient data not found.</p>
                    <button onClick={() => navigate(`/patients`)} className="back-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
                        <i className="fas fa-arrow-left"></i> Back to Patient List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="invoice-container">
            <header className="invoice-header">
                <h1>Generate Invoice for {patient.name}</h1>
                <div className="actions">
                    <button onClick={() => navigate(`/patients/${patientId}`)} className="back-button">
                        <i className="fas fa-arrow-left"></i> Back to Patient Details
                    </button>
                    {!showInvoice && (
                        <button onClick={handleGenerateInvoice} className="generate-invoice-button">
                            <i className="fas fa-file-invoice"></i> Generate Invoice
                        </button>
                    )}
                    {showInvoice && (
                        <>
                            <button onClick={handlePrint} className="print-invoice-button">
                                <i className="fas fa-print"></i> Print Invoice
                            </button>
                            {/* New Send Email Button */}
                            <button onClick={handleSendEmail} className="send-email-button">
                                <i className="fas fa-envelope"></i> Send Email
                            </button>
                        </>
                    )}
                </div>
            </header>

            {!showInvoice ? (
                <section className="invoice-form-section">
                    <h2>Patient Information</h2>
                    <div className="patient-info-display">
                        <p><strong>Name:</strong> {patient.name}</p>
                        {userRole === 'nurse' ? (
                            <>
                                <p><strong>Phone:</strong> <span className="restricted-info">Restricted</span></p>
                                <p><strong>Email:</strong> <span className="restricted-info">Restricted</span></p>
                            </>
                        ) : (
                            <>
                                <p><strong>Phone:</strong> {patient.phoneNumber}</p>
                                <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
                            </>
                        )}
                        {/* Display Patient's Registered HMO here */}
                        {patientHasHMO && (
                            <p><strong>Registered HMO:</strong> {patientHMOName}</p>
                        )}
                    </div>

                    {latestDentalRecord && (
                        <div className="dental-record-context">
                            <h3>Latest Dental Record Context:</h3>
                            <p><strong>Date:</strong> {new Date(latestDentalRecord.createdAt).toLocaleDateString()}</p>
                            <p><strong>Provisional Diagnosis:</strong> {Array.isArray(latestDentalRecord.provisionalDiagnosis) ? latestDentalRecord.provisionalDiagnosis.join(', ') : latestDentalRecord.provisionalDiagnosis || 'N/A'}</p>
                            <p><strong>Treatment Plan (for context):</strong> {Array.isArray(latestDentalRecord.treatmentPlan) ? latestDentalRecord.treatmentPlan.join(', ') : latestDentalRecord.treatmentPlan || 'N/A'}</p>
                        </div>
                    )}

                    <h2>Services to Bill</h2>
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

                    {invoiceItems.length > 0 && (
                        <div className="invoice-items-list">
                            <h3>Added Services:</h3>
                            <table className="services-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Quantity</th>
                                        {/* Conditionally hide Unit Price and Total columns based on HMO status */}
                                        {!isInvoiceForHmoPatient && <th>Unit Price (₦)</th>}
                                        {!isInvoiceForHmoPatient && <th>Total (₦)</th>}
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    className="quantity-input"
                                                    min="1"
                                                />
                                            </td>
                                            {/* Conditionally hide Unit Price and Total columns based on HMO status */}
                                            {!isInvoiceForHmoPatient && (
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                                        className="price-input"
                                                        min="0"
                                                    />
                                                </td>
                                            )}
                                            {!isInvoiceForHmoPatient && <td>₦{(item.price * item.quantity).toLocaleString()}</td>}
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
                                    {hmo.name}
                                </option>
                            ))}
                        </select>
                        {/* Only show HMO Covered Amount input if the patient has an HMO AND the selected HMO matches the patient's registered HMO */}
                        {isInvoiceForHmoPatient && (
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
                </section>
            ) : (
                <div className="invoice-display-area printable-content">
                    <div className="invoice-company-info">
                        <h2>{process.env.REACT_APP_CLINIC_NAME || "Your Dental Clinic Name"}</h2>
                        <p>{process.env.REACT_APP_CLINIC_ADDRESS || "123 Dental Lane, City, Country"}</p>
                        <p>Phone: {process.env.REACT_APP_CLINIC_PHONE || "(123) 456-7890"} | Email: {process.env.REACT_APP_EMAIL_FROM || "info@dentalclinic.com"}</p>
                    </div>
                    <div className="invoice-header-display">
                        <h2>INVOICE</h2>
                        <p><strong>Invoice #:</strong> {invoiceNumber}</p>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="invoice-patient-info">
                        <h3>Bill To:</h3>
                        <p><strong>Patient Name:</strong> {patient.name}</p>
                        {/* Conditional display of patient contact info based on user role and HMO status */}
                        {(userRole === 'owner' || userRole === 'staff') ? (
                            <>
                                <p><strong>Phone:</strong> {patient.phoneNumber}</p>
                                <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
                            </>
                        ) : (userRole === 'nurse' && isInvoiceForHmoPatient) ? ( // Nurse and HMO patient
                            <>
                                <p><strong>Phone:</strong> <span className="restricted-info">Restricted</span></p>
                                <p><strong>Email:</strong> <span className="restricted-info">Restricted</span></p>
                            </>
                        ) : ( // Nurse and non-HMO patient (default restricted)
                            <>
                                <p><strong>Phone:</strong> <span className="restricted-info">Restricted</span></p>
                                <p><strong>Email:</strong> <span className="restricted-info">Restricted</span></p>
                            </>
                        )}
                        {/* Display HMO on invoice if it's an HMO patient and HMO is selected */}
                        {isInvoiceForHmoPatient && (
                            <p><strong>HMO:</strong> {selectedHMO}</p>
                        )}
                    </div>
                    <div className="invoice-services-rendered">
                        <h3>Services Rendered:</h3>
                        <table className="invoice-services-table">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Quantity</th>
                                    {/* Conditionally hide Unit Price and Total columns for HMO patients */}
                                    {!isInvoiceForHmoPatient && <th>Unit Price (₦)</th>}
                                    {!isInvoiceForHmoPatient && <th>Total (₦)</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        {/* Conditionally hide Unit Price and Total columns for HMO patients */}
                                        {!isInvoiceForHmoPatient && <td>₦{item.price.toLocaleString()}</td>}
                                        {!isInvoiceForHmoPatient && <td>₦{(item.price * item.quantity).toLocaleString()}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="invoice-summary">
                        {/* Display simplified summary for HMO patients */}
                        {isInvoiceForHmoPatient ? (
                            <>
                                {totalDue > 0 ? (
                                    <p className="total-due due-balance">
                                        <strong>Balance Due from Patient:</strong> ₦{totalDue.toLocaleString()}
                                    </p>
                                ) : (
                                    <p className="total-due fully-covered">
                                        <strong>Status: Fully Covered by HMO</strong>
                                    </p>
                                )}
                            </>
                        ) : (
                            // Display full summary for non-HMO patients
                            <>
                                <p><strong>Subtotal:</strong> ₦{subtotal.toLocaleString()}</p>
                                <p className="total-due">
                                    <strong>Total Amount Due from Patient:</strong> ₦{subtotal.toLocaleString()}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="invoice-notes">
                        <h3>Notes:</h3>
                        <p>Please make payment within 7 days of invoice date.</p>
                        {latestDentalRecord && (
                            <div className="invoice-treatment-context">
                                <p><strong>Related Provisional Diagnosis:</strong> {Array.isArray(latestDentalRecord.provisionalDiagnosis) ? latestDentalRecord.provisionalDiagnosis.join(', ') : latestDentalRecord.provisionalDiagnosis || 'N/A'}</p>
                                <p><strong>Related Treatment Plan:</strong> {Array.isArray(latestDentalRecord.treatmentPlan) ? latestDentalRecord.treatmentPlan.join(', ') : latestDentalRecord.treatmentPlan || 'N/A'}</p>
                            </div>
                        )}
                    </div>
                    <div className="invoice-footer">
                        <p>Thank you for your prompt payment!</p>
                        <p>Signature: _________________________</p>
                    </div>
                </div>
            )}
        </div>
    );
}
