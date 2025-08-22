import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";
import "./invoice-page.css"; // New CSS file for this page
import {
  addressLine1,
  addressLine2,
  clinicName,
  phoneNumber,
} from "../config/info";

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
  { name: "E-Max Crown", price: 300000 },
];

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
  { name: "HYGEIA", status: "ONBOARD", coverage: 0.75 },
  { name: "NEM", status: "ONBOARD", coverage: 0.8 },
  { name: "KENNEDIA", status: "ONBOARD", coverage: 0.85 },
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
  // --- MODIFIED: State for new manual service input ---
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [selectedHMO, setSelectedHMO] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);

  const patientHasHMO = !!patient?.hmo?.name;
  const patientHMOName = patientHasHMO ? patient.hmo.name : "";
  const patientHmoCoverageRate = patientHasHMO
    ? hmoOptions.find((hmo) => hmo.name === patientHMOName)?.coverage || 0
    : 0;

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      const token = localStorage.getItem("jwtToken");
      const role = localStorage.getItem("role");
      setUserRole(role);

      if (!token) {
        toast.error("Authentication required. Please log in.");
        navigate("/login");
        return;
      }

      const allowedRoles = ["owner", "staff", "nurse"];
      if (!allowedRoles.includes(role)) {
        toast.error(
          "Access denied. You do not have permission to view this page."
        );
        navigate("/dashboard");
        return;
      }

      const parsedPatientId = parseInt(patientId);
      if (isNaN(parsedPatientId)) {
        setError("Invalid Patient ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        const patientResponse = await fetch(
          `${API_BASE_URL}/api/patients/${parsedPatientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatient(patientData);
          if (patientData.hmo && patientData.hmo.name) {
            setSelectedHMO(patientData.hmo.name);
          }
        } else if (patientResponse.status === 404) {
          setError("Patient not found.");
        } else {
          const errorData = await patientResponse.json();
          setError(
            errorData.error ||
              `Failed to fetch patient details. Status: ${patientResponse.status}`
          );
        }

        const recordsResponse = await fetch(
          `${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          if (recordsData && recordsData.length > 0) {
            const sortedRecords = recordsData.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            const latestRecord = sortedRecords[0];
            setLatestDentalRecord(latestRecord);

            if (
              latestRecord.treatmentPlan &&
              Array.isArray(latestRecord.treatmentPlan)
            ) {
              const preAddedItems = latestRecord.treatmentPlan.map(
                (planItem, index) => {
                  const serviceMatch = serviceOptions.find(
                    (s) =>
                      s.name.toLowerCase() === planItem.toLowerCase().trim()
                  );
                  return {
                    id: `tp-${Date.now()}-${index}`,
                    name: planItem.trim(),
                    price: serviceMatch ? serviceMatch.price : 0,
                    quantity: 1,
                  };
                }
              );
              if (preAddedItems.length > 0) {
                setInvoiceItems(preAddedItems);
                toast.info(
                  "Treatment plan items pre-added to invoice. Please review prices."
                );
              }
            }
          }
        }
      } catch (err) {
        setError("Network error. Could not connect to the server.");
        console.error("Network Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [patientId, navigate]);

  // --- NEW: Handler to auto-fill price when a service is selected from the datalist ---
  const handleServiceNameChange = (e) => {
    const name = e.target.value;
    setServiceName(name);

    const service = serviceOptions.find((s) => s.name === name);
    if (service) {
      setServicePrice(service.price.toString());
    } else {
      setServicePrice("");
    }
  };

  // --- MODIFIED: Handler to add a service (pre-filled or custom) ---
  const handleAddService = () => {
    if (!serviceName.trim()) {
      toast.warn("Please enter a service name.");
      return;
    }
    if (!servicePrice || parseFloat(servicePrice) < 0) {
      toast.warn("Please enter a valid, non-negative price for the service.");
      return;
    }

    const trimmedServiceName = serviceName.trim();

    setInvoiceItems((prevItems) => {
      if (
        prevItems.find(
          (item) => item.name.toLowerCase() === trimmedServiceName.toLowerCase()
        )
      ) {
        toast.warn(`"${trimmedServiceName}" is already in the invoice.`);
        return prevItems;
      }
      return [
        ...prevItems,
        {
          id: Date.now(),
          name: trimmedServiceName,
          price: parseFloat(servicePrice),
          quantity: 1,
        },
      ];
    });

    // Reset inputs
    setServiceName("");
    setServicePrice("");
  };

  const handleRemoveService = (idToRemove) =>
    setInvoiceItems((prevItems) =>
      prevItems.filter((item) => item.id !== idToRemove)
    );
  const handlePriceChange = (id, newPrice) =>
    setInvoiceItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, price: parseFloat(newPrice) || 0 } : item
      )
    );
  const handleQuantityChange = (id, newQuantity) =>
    setInvoiceItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, quantity: parseInt(newQuantity) || 1 }
          : item
      )
    );
  const handleHmoChange = (e) => setSelectedHMO(e.target.value);

  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const isInvoiceForHmoPatient =
    patientHasHMO && selectedHMO === patientHMOName;
  const finalCoveredAmount = isInvoiceForHmoPatient
    ? subtotal * patientHmoCoverageRate
    : 0;
  const totalDue = subtotal - finalCoveredAmount;

  const handleGenerateInvoice = () => {
    if (invoiceItems.length === 0) {
      toast.error("Please add at least one service to generate an invoice.");
      return;
    }
    setShowInvoice(true);
  };

  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    if (!patient || (!patient.email && userRole !== "nurse")) {
      toast.error("Patient email is missing. Cannot send invoice.");
      return;
    }
    if (invoiceItems.length === 0) {
      toast.error("No services added to the invoice to send.");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.error("Authentication token missing. Please log in.");
      return;
    }

    setIsSendingEmail(true);

    const payload = {
      patientId: patient.id,
      patientName: patient.name,
      patientEmail: patient.email,
      invoiceNumber: invoiceNumber,
      invoiceDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      items: invoiceItems.map((item) => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: isInvoiceForHmoPatient ? 0 : item.price,
        totalPrice: isInvoiceForHmoPatient ? 0 : item.price * item.quantity,
      })),
      isHmoCovered: isInvoiceForHmoPatient,
      hmoName: isInvoiceForHmoPatient ? selectedHMO : null,
      coveredAmount: finalCoveredAmount,
      totalAmount: totalDue,
      notes: "Thank you for your patronage",
      clinicName: clinicName,
      clinicAddress: `${addressLine1} ${addressLine2}`,
      clinicPhone: phoneNumber,
      latestDentalRecord: latestDentalRecord
        ? {
            provisionalDiagnosis: Array.isArray(
              latestDentalRecord.provisionalDiagnosis
            )
              ? latestDentalRecord.provisionalDiagnosis.join(", ")
              : latestDentalRecord.provisionalDiagnosis || "N/A",
            treatmentPlan: Array.isArray(latestDentalRecord.treatmentPlan)
              ? latestDentalRecord.treatmentPlan.join(", ")
              : latestDentalRecord.treatmentPlan || "N/A",
          }
        : null,
      subtotal: isInvoiceForHmoPatient ? 0 : subtotal,
      totalDueFromPatient: totalDue,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Invoice email sent successfully!");
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to send invoice email: ${
            errorData.error || response.statusText
          }`
        );
      }
    } catch (error) {
      toast.error("Network error. Could not send invoice email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading)
    return (
      <div className="app-container">
        <div
          className="invoice-container"
          style={{ textAlign: "center", padding: "50px" }}
        >
          <p className="info-message">Loading...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="app-container">
        <div className="invoice-container">
          <p className="info-message error">Error: {error}</p>
        </div>
      </div>
    );
  if (!patient)
    return (
      <div className="app-container">
        <div className="invoice-container">
          <p className="info-message">Patient not found.</p>
        </div>
      </div>
    );

  return (
    <div className="invoice-container">
      <header className="invoice-header">
        <h1>Generate Invoice for {patient.name}</h1>
        <div className="actions">
          <button
            onClick={() => navigate(`/patients/${patientId}`)}
            className="back-button"
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
          {!showInvoice && (
            <button
              onClick={handleGenerateInvoice}
              className="generate-invoice-button"
            >
              <i className="fas fa-file-invoice"></i> Generate
            </button>
          )}
          {showInvoice && (
            <>
              <button onClick={handlePrint} className="print-invoice-button">
                <i className="fas fa-print"></i> Print
              </button>
              <button
                onClick={handleSendEmail}
                className="send-email-button"
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <>
                    <span className="spinner-small"></span> Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-envelope"></i> Send Email
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {!showInvoice ? (
        <section className="invoice-form-section">
          <h2>Patient Information</h2>
          <div className="patient-info-display">
            <p>
              <strong>Name:</strong> {patient.name}
            </p>
            <p>
              <strong>Phone:</strong> {patient.phoneNumber || "null"}
            </p>
            <p>
              <strong>Email:</strong> {patient.email || "null"}
            </p>
            {patientHasHMO && (
              <p>
                <strong>Registered HMO:</strong> {patientHMOName}
              </p>
            )}
          </div>

          {latestDentalRecord && (
            <div className="dental-record-context">
              <h3>Latest Dental Record Context:</h3>
              <p>
                <strong>Diagnosis:</strong>{" "}
                {Array.isArray(latestDentalRecord.provisionalDiagnosis)
                  ? latestDentalRecord.provisionalDiagnosis.join(", ")
                  : latestDentalRecord.provisionalDiagnosis || "N/A"}
              </p>
              <p>
                <strong>Treatment Plan:</strong>{" "}
                {Array.isArray(latestDentalRecord.treatmentPlan)
                  ? latestDentalRecord.treatmentPlan.join(", ")
                  : latestDentalRecord.treatmentPlan || "N/A"}
              </p>
            </div>
          )}

          <h2>Services to Bill</h2>
          {/* --- MODIFIED: Replaced select with datalist input --- */}
          <div className="service-selection">
            <input
              type="text"
              list="service-options"
              value={serviceName}
              onChange={handleServiceNameChange}
              placeholder="Type or select a service"
              className="form-control"
            />
            <datalist id="service-options">
              {serviceOptions.map((service, index) => (
                <option key={index} value={service.name} />
              ))}
            </datalist>
            <input
              type="number"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              placeholder="Price (₦)"
              className="price-input-manual"
            />
            <button onClick={handleAddService} className="add-service-button">
              Add
            </button>
          </div>

          {invoiceItems.length > 0 && (
            <div className="invoice-items-list">
              <h3>Added Services:</h3>
              <table className="services-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Qty</th>
                    {!isInvoiceForHmoPatient && <th>Price (₦)</th>}
                    {!isInvoiceForHmoPatient && <th>Total (₦)</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Service">{item.name}</td>
                      <td data-label="Qty">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, e.target.value)
                          }
                          className="quantity-input"
                          min="1"
                        />
                      </td>
                      {!isInvoiceForHmoPatient && (
                        <>
                          <td data-label="Price (₦)">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handlePriceChange(item.id, e.target.value)
                              }
                              className="price-input"
                              min="0"
                            />
                          </td>
                          <td data-label="Total (₦)">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </td>
                        </>
                      )}
                      <td data-label="Actions">
                        <button
                          onClick={() => handleRemoveService(item.id)}
                          className="remove-service-button"
                        >
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
            <select
              value={selectedHMO}
              onChange={handleHmoChange}
              className="form-select"
            >
              <option value="">Select HMO Provider</option>
              {hmoOptions.map((hmo, index) => (
                <option key={index} value={hmo.name}>
                  {hmo.name}
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : (
        <div className="invoice-display-area printable-content">
          <div className="invoice-company-info">
            <h2>{clinicName}</h2>
            <p>{addressLine1}</p>
            <p>{addressLine2}</p>
          </div>
          <div className="invoice-header-display">
            <h2>INVOICE</h2>
            <p>
              <strong>Invoice #:</strong> {invoiceNumber}
            </p>
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="invoice-patient-info">
            <h3>Bill To:</h3>
            <p>
              <strong>Patient Name:</strong> {patient.name}
            </p>
            <p>
              <strong>Email:</strong> {patient.email || "null"}
            </p>
            {isInvoiceForHmoPatient && (
              <p>
                <strong>HMO:</strong> {selectedHMO}
              </p>
            )}
          </div>
          <div className="invoice-services-rendered">
            <h3>Services Rendered:</h3>
            <table className="invoice-services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Quantity</th>
                  {!isInvoiceForHmoPatient && <th>Unit Price (₦)</th>}
                  {!isInvoiceForHmoPatient && <th>Amount (₦)</th>}
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    {!isInvoiceForHmoPatient && (
                      <td>₦{item.price.toLocaleString()}</td>
                    )}
                    {!isInvoiceForHmoPatient && (
                      <td>₦{(item.price * item.quantity).toLocaleString()}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="invoice-summary">
            {!isInvoiceForHmoPatient && (
              <>
                <p>
                  <strong>Subtotal:</strong> ₦{subtotal.toLocaleString()}
                </p>
                <p className="total-due">
                  <strong>Total Amount Due from Patient:</strong> ₦
                  {totalDue.toLocaleString()}
                </p>
              </>
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
