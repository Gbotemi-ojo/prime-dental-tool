import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./patient-receipts-page.css";
import API_BASE_URL from "../config/api";
import {
  addressLine1,
  addressLine2,
  clinicName,
  phoneNumber,
} from "../config/info";

export default function PatientReceiptsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  // State for data
  const [patient, setPatient] = useState(null);
  const [latestDentalRecord, setLatestDentalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // State for UI mode based on patient's debt
  const [isDebtPaymentMode, setIsDebtPaymentMode] = useState(false);
  const [debtContextDescription, setDebtContextDescription] = useState("");

  // --- MODIFIED: State for form inputs to allow manual entry ---
  const [receiptItems, setReceiptItems] = useState([]);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [selectedHMO, setSelectedHMO] = useState("");
  const [hmoCoveredAmount, setHmoCoveredAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  // State for UI flow
  const [showReceipt, setShowReceipt] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [receiptNumber] = useState(`RCPT-${Date.now().toString().slice(-6)}`);

  // --- Data Definitions (Unchanged) ---
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
    { name: "Gold Crown", price: 0, placeholder: "Based on value of gold" },
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
    { name: "Braces", price: 0, placeholder: "Based on complexity" },
    { name: "Fluoride Treatment", price: 35000 },
    { name: "Intermaxillary Fixation", price: 150000 },
    { name: "Aligners", price: 0, placeholder: "Based on complexity" },
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

  useEffect(() => {
    const fetchReceiptDetails = async () => {
      const token = localStorage.getItem("jwtToken");
      const role = localStorage.getItem("role");
      setUserRole(role);

      if (!token) {
        toast.error("Authentication required. Please log in.");
        navigate("/login");
        return;
      }

      if (role !== "owner" && role !== "staff") {
        toast.error(
          "Access denied. Only Owners and Staff can access this page."
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

        if (!patientResponse.ok) {
          const errorData = await patientResponse.json();
          setError(
            errorData.error ||
              `Failed to fetch patient details. Status: ${patientResponse.status}`
          );
          setLoading(false);
          return;
        }

        const patientData = await patientResponse.json();
        setPatient(patientData);
        if (patientData.hmo && patientData.hmo.name) {
          setSelectedHMO(patientData.hmo.name);
        }

        let latestRecord = null;
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
            latestRecord = sortedRecords[0];
            setLatestDentalRecord(latestRecord);
          } else {
            console.warn("No dental records found for this patient.");
          }
        } else {
          console.warn(
            `Failed to fetch dental records. Status: ${recordsResponse.status}`
          );
        }

        const outstandingBalance = parseFloat(patientData.outstanding);
        if (outstandingBalance > 0) {
          setIsDebtPaymentMode(true);
          toast.info(
            `Patient has an outstanding balance of ₦${outstandingBalance.toFixed(
              2
            )}. Only debt payment is allowed.`
          );
          setAmountPaid(outstandingBalance.toFixed(2));

          if (
            latestRecord &&
            latestRecord.treatmentPlan &&
            Array.isArray(latestRecord.treatmentPlan) &&
            latestRecord.treatmentPlan.length > 0
          ) {
            setDebtContextDescription(latestRecord.treatmentPlan.join(", "));
          }
        } else {
          if (
            latestRecord &&
            latestRecord.treatmentPlan &&
            Array.isArray(latestRecord.treatmentPlan)
          ) {
            const preAddedItems = latestRecord.treatmentPlan.map(
              (plan, index) => {
                const serviceInfo = serviceOptions.find(
                  (s) => s.name.toLowerCase() === plan.toLowerCase().trim()
                );
                return {
                  id: `plan-${index}-${Date.now()}`,
                  name: plan.trim(),
                  price: serviceInfo ? serviceInfo.price : 0,
                  quantity: 1,
                };
              }
            );
            if (preAddedItems.length > 0) {
              setReceiptItems(preAddedItems);
              toast.info(
                "Treatment plan items pre-added to receipt. Please review prices and quantities."
              );
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

    fetchReceiptDetails();
  }, [patientId, navigate]);

  const patientHasHMO = !!patient?.hmo?.name;
  const patientHMOName = patientHasHMO ? patient.hmo.name : "";
  const patientHmoCoverageRate = patientHasHMO
    ? hmoOptions.find((hmo) => hmo.name === patientHMOName)?.coverage || 0
    : 0;

  const isHmoCovered =
    !isDebtPaymentMode && patientHasHMO && selectedHMO === patientHMOName;
  const subtotal = isDebtPaymentMode
    ? 0
    : receiptItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let calculatedCoveredAmount = 0;
  if (isHmoCovered) {
    calculatedCoveredAmount = subtotal * patientHmoCoverageRate;
  }
  const manualHmoCovered = parseFloat(hmoCoveredAmount);
  const finalCoveredAmount = isDebtPaymentMode
    ? 0
    : manualHmoCovered > 0
    ? manualHmoCovered
    : calculatedCoveredAmount;

  const totalDueFromPatient = isDebtPaymentMode
    ? 0
    : subtotal - finalCoveredAmount;
  const parsedAmountPaid = parseFloat(amountPaid) || 0;
  const patientOutstanding = parseFloat(patient?.outstanding) || 0;

  const balanceChangeFromThisVisit = totalDueFromPatient - parsedAmountPaid;
  const newTotalOutstanding = patientOutstanding + balanceChangeFromThisVisit;

  useEffect(() => {
    if (!showReceipt && !isDebtPaymentMode) {
      setAmountPaid(
        totalDueFromPatient >= 0 ? totalDueFromPatient.toFixed(2) : "0.00"
      );
    }
  }, [totalDueFromPatient, showReceipt, isDebtPaymentMode]);

  // --- NEW: Handler to auto-fill price when a service is selected from the datalist ---
  const handleServiceNameChange = (e) => {
    const name = e.target.value;
    setServiceName(name);

    const service = serviceOptions.find((s) => s.name === name);
    if (service) {
      setServicePrice(service.price.toString());
    } else {
      // If they type a custom service, clear the price for manual entry
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

    setReceiptItems((prevItems) => {
      if (
        prevItems.find(
          (item) => item.name.toLowerCase() === trimmedServiceName.toLowerCase()
        )
      ) {
        toast.warn(
          `"${trimmedServiceName}" is already in the receipt. Adjust quantity if needed.`
        );
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

    // Reset inputs for the next entry
    setServiceName("");
    setServicePrice("");
  };

  const handleRemoveService = (idToRemove) => {
    setReceiptItems((prevItems) =>
      prevItems.filter((item) => item.id !== idToRemove)
    );
  };

  const handlePriceChange = (id, newPrice) => {
    setReceiptItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, price: parseFloat(newPrice) || 0 } : item
      )
    );
  };

  const handleQuantityChange = (id, newQuantity) => {
    setReceiptItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, quantity: parseInt(newQuantity) || 1 }
          : item
      )
    );
  };

  const handleHmoChange = (e) => {
    const selectedHmoName = e.target.value;
    setSelectedHMO(selectedHmoName);
    setHmoCoveredAmount("");
  };

  const handleGenerateReceipt = () => {
    if (!isDebtPaymentMode && receiptItems.length === 0) {
      toast.error("Please add at least one service to generate a receipt.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }
    if (parsedAmountPaid <= -1 || amountPaid === "") {
      toast.error("Please enter a valid, positive amount paid.");
      return;
    }
    setShowReceipt(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!patient || !patient.email) {
      toast.error("Patient email is missing. Cannot send receipt.");
      return;
    }
    if (!isDebtPaymentMode && receiptItems.length === 0) {
      toast.error("No services added to the receipt to send.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method before sending email.");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const senderUserId = localStorage.getItem("userId");
    if (!token || !senderUserId) {
      toast.error("Authentication token or sender ID missing. Please log in.");
      return;
    }

    setIsSendingEmail(true);

    const payload = {
      patientId: patient.id,
      patientName: patient.name,
      patientEmail: patient.email,
      receiptNumber: receiptNumber,
      receiptDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),

      items: isDebtPaymentMode
        ? [
            {
              description: `Payment towards outstanding balance${
                debtContextDescription ? ` (${debtContextDescription})` : ""
              }`,
              quantity: 1,
              unitPrice: parsedAmountPaid,
              totalPrice: parsedAmountPaid,
            },
          ]
        : receiptItems.map((item) => ({
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          })),

      subtotal: isDebtPaymentMode ? 0 : subtotal,
      isHmoCovered: isHmoCovered,
      hmoName: isHmoCovered ? selectedHMO : null,
      coveredAmount: isDebtPaymentMode ? 0 : finalCoveredAmount,
      totalDueFromPatient: isDebtPaymentMode ? 0 : totalDueFromPatient,

      amountPaid: parsedAmountPaid,
      paymentMethod: paymentMethod,
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
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/receipts/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiptData: payload,
          senderUserId: parseInt(senderUserId),
        }),
      });

      if (response.ok) {
        toast.success("Receipt email sent successfully!");
        navigate(0); // Refresh the page to show updated patient balance
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to send receipt email: ${
            errorData.error || response.statusText
          }`
        );
        console.error("Backend error response:", errorData);
      }
    } catch (error) {
      console.error(
        "Network error or unexpected issue during receipt email send:",
        error
      );
      toast.error("Network error. Could not send receipt email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div
        className="receipts-container"
        style={{ textAlign: "center", padding: "50px" }}
      >
        <p className="info-message">Loading patient details...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="receipts-container">
        <p className="info-message error">Error: {error}</p>
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="back-button"
          style={{
            margin: "20px auto",
            display: "block",
            width: "fit-content",
          }}
        >
          <i className="fas fa-arrow-left"></i> Back to Patient Details
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="receipts-container">
        <p className="info-message">Patient data not found.</p>
        <button
          onClick={() => navigate(`/patients`)}
          className="back-button"
          style={{
            margin: "20px auto",
            display: "block",
            width: "fit-content",
          }}
        >
          <i className="fas fa-arrow-left"></i> Back to Patient List
        </button>
      </div>
    );
  }

  return (
    <div className="receipts-container">
      <header className="receipts-header">
        <h1>
          {isDebtPaymentMode
            ? `Clear Balance for ${patient.name}`
            : `Generate Receipt for ${patient.name}`}
        </h1>
        <div className="actions">
          <button
            onClick={() => navigate(`/patients/${patientId}`)}
            className="back-button"
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
          {!showReceipt && (
            <button
              onClick={handleGenerateReceipt}
              className="generate-receipt-button"
            >
              <i className="fas fa-receipt"></i> Generate Receipt
            </button>
          )}
          {showReceipt && (
            <>
              <button onClick={handlePrint} className="print-receipt-button">
                <i className="fas fa-print"></i> Print
              </button>
              <button
                onClick={handleSendEmail}
                className="send-email-button"
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  "Sending..."
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

      {isDebtPaymentMode && !showReceipt && (
        <div className="debt-payment-warning">
          <i className="fas fa-exclamation-triangle"></i>
          <strong>Outstanding Balance Detected:</strong> To bill for new
          services, the patient's outstanding balance of{" "}
          <strong>
            ₦
            {patientOutstanding.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </strong>{" "}
          must be cleared first.
          {debtContextDescription && (
            <p style={{ marginTop: "5px" }}>
              <strong>Reference:</strong> Payment for {debtContextDescription}
            </p>
          )}
        </div>
      )}

      {!showReceipt ? (
        <section className="receipt-form-section">
          <h2>Patient Information</h2>
          <div className="patient-info-display">
            <p>
              <strong>Name:</strong> {patient.name}
            </p>
            {(userRole === "owner" || userRole === "staff") && (
              <>
                <p>
                  <strong>Email:</strong> {patient.email || "N/A"}
                </p>
                <p>
                  <strong>Phone Number:</strong> {patient.phoneNumber || "N/A"}
                </p>
              </>
            )}
            {patientHasHMO && (
              <p>
                <strong>Registered HMO:</strong> {patientHMOName}
              </p>
            )}
          </div>

          {!isDebtPaymentMode && (
            <>
              {latestDentalRecord && (
                <div className="dental-record-context">
                  <h3>Latest Dental Record Context:</h3>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(
                      latestDentalRecord.createdAt
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Treatment Plan (for context):</strong>{" "}
                    {Array.isArray(latestDentalRecord.treatmentPlan)
                      ? latestDentalRecord.treatmentPlan.join(", ")
                      : latestDentalRecord.treatmentPlan || "N/A"}
                  </p>
                </div>
              )}

              <h2>Services Billed</h2>
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
                <button
                  onClick={handleAddService}
                  className="add-service-button"
                >
                  Add
                </button>
              </div>

              {receiptItems.length > 0 && (
                <div className="receipt-items-list">
                  <h3>Added Services:</h3>
                  <table className="services-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Quantity</th>
                        {!isHmoCovered && <th>Unit Price (₦)</th>}
                        {!isHmoCovered && <th>Total (₦)</th>}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptItems.map((item) => (
                        <tr key={item.id}>
                          <td data-label="Service">{item.name}</td>
                          <td data-label="Quantity">
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
                          {!isHmoCovered && (
                            <>
                              <td data-label="Unit Price (₦)">
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
                </div>
              )}

              <h2>HMO Details</h2>
              <div className="hmo-selection">
                <select
                  value={selectedHMO}
                  onChange={handleHmoChange}
                  className="form-select"
                >
                  <option value="">Select HMO Provider (if any)</option>
                  {hmoOptions.map((hmo, index) => (
                    <option key={index} value={hmo.name}>
                      {hmo.name}
                    </option>
                  ))}
                </select>
                {isHmoCovered && (
                  <div className="hmo-covered-input">
                    <label htmlFor="hmoCoveredAmount">
                      HMO Covered Amount (Override)
                    </label>
                    <input
                      type="number"
                      id="hmoCoveredAmount"
                      value={hmoCoveredAmount}
                      onChange={(e) => setHmoCoveredAmount(e.target.value)}
                      placeholder="e.g., 30000"
                      min="0"
                      className="form-control"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <h2>Payment Details</h2>
          <div className="payment-summary-grid">
            {!isDebtPaymentMode && (
              <>
                <div className="payment-summary-item">
                  <span>Subtotal</span>
                  <span>
                    ₦
                    {subtotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="payment-summary-item">
                  <span>HMO Coverage</span>
                  <span>
                    - ₦
                    {finalCoveredAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </>
            )}

            {patientOutstanding > 0 && (
              <div className="payment-summary-item previous-outstanding">
                <strong>Previous Outstanding</strong>
                <strong>
                  ₦
                  {patientOutstanding.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
            )}

            <div className="payment-method-selection">
              <label htmlFor="paymentMethod">Payment Method *</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="POS">POS</option>
                <option value="HMO Payment">HMO Payment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="amount-paid-input">
              <label htmlFor="amountPaid">Amount Paid Now *</label>
              <input
                type="number"
                id="amountPaid"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Enter amount paid"
                min="0"
                className="form-control"
                required
              />
            </div>

            {balanceChangeFromThisVisit !== 0 && (
              <div className="payment-summary-item new-outstanding">
                <strong>Balance Change This Visit</strong>
                <strong>
                  ₦
                  {balanceChangeFromThisVisit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
            )}

            {newTotalOutstanding !== 0 && (
              <div className="payment-summary-item total-outstanding-final">
                <strong>New Total Outstanding</strong>
                <strong>
                  ₦
                  {newTotalOutstanding.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="receipt-display-area printable-content">
          <div className="receipt-company-info">
            <h2>{clinicName}</h2>
            <p>{addressLine1}</p>
            <p>{addressLine2}</p>
            <p>Phone: {phoneNumber}</p>
          </div>
          <div className="receipt-header-display">
            <h2>Payment Receipt</h2>
            <p>
              <strong>Receipt #:</strong> {receiptNumber}
            </p>
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="receipt-patient-info">
            <h3>Received From:</h3>
            <p>
              <strong>Patient Name:</strong> {patient.name}
            </p>
            {(userRole === "owner" || userRole === "staff") && (
              <>
                <p>
                  <strong>Email:</strong> {patient.email || "N/A"}
                </p>
                <p>
                  <strong>Phone Number:</strong> {patient.phoneNumber || "N/A"}
                </p>
              </>
            )}
            {isHmoCovered && (
              <p>
                <strong>HMO:</strong> {selectedHMO}
              </p>
            )}
          </div>
          <div className="receipt-services-rendered">
            <h3>Services Rendered:</h3>
            <table className="receipt-services-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  {!isHmoCovered && <th>Unit Price (₦)</th>}
                  {!isHmoCovered && <th>Amount (₦)</th>}
                </tr>
              </thead>
              <tbody>
                {isDebtPaymentMode ? (
                  <tr>
                    <td>{`Payment towards outstanding balance${
                      debtContextDescription
                        ? ` (${debtContextDescription})`
                        : ""
                    }`}</td>
                    <td>1</td>
                    <td>₦{parsedAmountPaid.toLocaleString()}</td>
                    <td>₦{parsedAmountPaid.toLocaleString()}</td>
                  </tr>
                ) : (
                  receiptItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      {!isHmoCovered && (
                        <>
                          <td>₦{item.price.toLocaleString()}</td>
                          <td>
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="receipt-summary">
            <p>
              <strong>Payment Method:</strong> {paymentMethod || "N/A"}
            </p>
            <p className="amount-paid-now">
              <strong>Amount Paid Now:</strong> ₦
              {parsedAmountPaid.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
            {newTotalOutstanding > 0.005 && (
              <p className="total-outstanding-final">
                <strong>Total Outstanding Balance:</strong> ₦
                {newTotalOutstanding.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
            {isHmoCovered &&
              totalDueFromPatient <= 0 &&
              newTotalOutstanding <= 0 && (
                <p className="fully-covered-status">
                  Status: Fully Covered by HMO for this visit
                </p>
              )}
          </div>
          <div className="receipt-footer">
            <p>Thank you for your patronage!</p>
            <p>Signature: _________________________</p>
          </div>
        </div>
      )}
    </div>
  );
}
