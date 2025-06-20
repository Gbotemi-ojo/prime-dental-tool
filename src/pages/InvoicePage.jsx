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
    // CORRECTED: Naming to EXACTLY match the reported string from treatmentPlan for "Fuji 9"
    { name: "Fuji 9 (Posterior GIC (per Filling)", price: 50000 },
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

// All HMOs now have status: "ONBOARD"
const hmoOptions = [
    { name: "IHMS", status: "ONBOARD" },
    { name: "HEALTH PARTNERS", status: "ONBOARD" },
    { name: "ZENOR", status: "ONBOARD" },
    { name: "PHILIPS", "status": "ONBOARD" },
    { name: "PRO HEALTH", status: "ONBOARD" },
    { name: "FOUNTAIN HEALTH", status: "ONBOARD" },
    { name: "DOT HMO", status: "ONBOARD" },
    { name: "CLEARLINE", status: "ONBOARD" },
    { name: "STERLING HEALTH", status: "ONBOARD" },
    { name: "OCEANIC", status: "ONBOARD" },
    { name: "SUNU", status: "ONBOARD" },
    { name: "LIFEWORTH", status: "ONBOARD" },
    { name: "CKLINE", status: "ONBOARD" },
    { name: "WELLNESS", status: "ONBOARD" },
    { name: "RELIANCE", status: "ONBOARD" },
    { name: "FIRST GUARANTEE", status: "ONBOARD" },
    { name: "THT", status: "ONBOARD" },
    { name: "DOHEEC", status: "ONBOARD" },
    { name: "GNI", status: "ONBOARD" },
    { name: "MH", status: "ONBOARD" },
    { name: "AIICO MULTISHIELD", status: "ONBOARD" },
    { name: "GREENBAY", status: "ONBOARD" },
    { name: "MARINA", status: "ONBOARD" },
    { name: "EAGLE", status: "ONBOARD" },
    { name: "MEDIPLAN", status: "ONBOARD" },
    { name: "METROHEALTH", status: "ONBOARD" },
    { name: "RONSBERGER", status: "ONBOARD" },
    { name: "WELPRO", status: "ONBOARD" },
    { name: "GORAH", status: "ONBOARD" },
    { name: "SMATHEALTH", status: "ONBOARD" },
    { name: "AXA MANSARD", status: "ONBOARD" },
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
    const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);

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
    const coveredAmount = parseFloat(hmoCoveredAmount) || 0;
    const totalDue = subtotal - coveredAmount;

    // This check is now effectively always true if an HMO is selected
    const isHmoOnboard = selectedHMO && hmoOptions.find(h => h.name === selectedHMO)?.status === "ONBOARD";

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

        try {
            const response = await fetch(`${API_BASE_URL}/api/invoices/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patientId: patient.id,
                    patientName: patient.name,
                    patientEmail: patient.email,
                    invoiceNumber: invoiceNumber,
                    invoiceDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    // Mapped invoiceItems to 'items' as expected by backend,
                    // and adjusted item properties (name -> description, price -> unitPrice)
                    items: invoiceItems.map(item => ({
                        description: item.name,
                        quantity: item.quantity,
                        unitPrice: item.price
                    })),
                    // Mapped totalDue to 'totalAmount' as expected by backend
                    totalAmount: totalDue,
                    hmo: selectedHMO,
                    hmoCoveredAmount: coveredAmount,
                    notes: "Thank you for your patronage.",
                    clinicName: "PRIME DENTAL CLINIC", // Replace with actual clinic name from config if available
                    clinicAddress: " local government, 104, New Ipaja/Egbeda Road, opposite prestige super-market, Alimosho, Ipaja Rd, Ipaja, Lagos 100006, Lagos", // Replace with actual clinic address
                    clinicPhone: "0703 070 8877", // Replace with actual clinic phone
                    clinicEmail: "info@dentalclinic.com" // Replace with actual clinic email
                })
            });

            if (response.ok) {
                toast.success('Invoice email sent successfully!');
            } else {
                const errorData = await response.json();
                toast.error(`Failed to send invoice email: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error sending invoice email:', error);
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
                                        <th>Unit Price (₦)</th>
                                        <th>Total (₦)</th>
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
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                                    className="price-input"
                                                    min="0"
                                                />
                                            </td>
                                            <td>₦{(item.price * item.quantity).toLocaleString()}</td>
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
                </section>
            ) : (
                <div className="invoice-display-area printable-content">
                    <div className="invoice-company-info">
                        <h2>Prime Dental Clinic</h2> {/* Replace with actual clinic name */}
                        <p>local government, 104, New Ipaja/Egbeda Road, opposite prestige super-market, Alimosho, Ipaja Rd, Ipaja, Lagos 100006, Lagos</p>
                        <p>Phone: 0703 070 8877 </p>
                    </div>
                    <div className="invoice-header-display">
                        <h2>INVOICE</h2>
                        <p><strong>Invoice #:</strong> {invoiceNumber}</p>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="invoice-patient-info">
                        <h3>Bill To:</h3>
                        <p><strong>Patient Name:</strong> {patient.name}</p>
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
                    </div>
                    <div className="invoice-services-rendered">
                        <h3>Services Rendered:</h3>
                        <table className="invoice-services-table">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Quantity</th>
                                    <th>Unit Price (₦)</th>
                                    <th>Total (₦)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>₦{item.price.toLocaleString()}</td>
                                        <td>₦{(item.price * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="invoice-summary">
                        <p><strong>Subtotal:</strong> ₦{subtotal.toLocaleString()}</p>
                        {selectedHMO && (
                            <p>
                                <strong>HMO ({selectedHMO}):</strong> ₦{coveredAmount.toLocaleString()} Covered
                            </p>
                        )}
                        <p className="total-due">
                            <strong>Total Amount Due from Patient:</strong> ₦{totalDue.toLocaleString()}
                        </p>
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