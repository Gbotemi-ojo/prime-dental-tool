// src/pages/edit-dental-record.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './edit-dental-record.css'; // Import the dedicated CSS file
import API_BASE_URL from '../config/api'

export default function EditDentalRecord() {
  const { patientId, recordId } = useParams(); // Get patientId and recordId from URL
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initial state for quadrant fields, used for resetting or if data is missing
  const initialQuadrantState = { q1: '', q2: '', q3: '', q4: '' };

  // Form state for all dental record fields, initialized empty
  const [formData, setFormData] = useState({
    complaint: '',
    historyOfPresentComplaint: '',
    pastDentalHistory: '',
    medicationS: false,
    medicationH: false,
    medicationA: false,
    medicationD: false,
    medicationE: false,
    medicationPUD: false,
    medicationBloodDisorder: false,
    medicationAllergy: false,
    familySocialHistory: '',
    extraOralExamination: '',
    intraOralExamination: '',
    teethPresent: { ...initialQuadrantState },
    cariousCavity: { ...initialQuadrantState },
    filledTeeth: { ...initialQuadrantState },
    missingTeeth: { ...initialQuadrantState },
    fracturedTeeth: { ...initialQuadrantState },
    periodontalCondition: '',
    oralHygiene: '',
    investigations: '',
    xrayFindings: '',
    provisionalDiagnosis: [], // This will store the ADDED diagnoses
    treatmentPlan: [],       // This will store the ADDED treatment plans
    treatmentDone: '',       // NEW: Add treatmentDone field
    calculus: '',
    recordDate: '', // Will be populated from fetched data
  });

  // State for the currently selected option in the dropdowns (for adding)
  const [selectedProvisionalDiagnosisOption, setSelectedProvisionalDiagnosisOption] = useState('');
  const [selectedTreatmentPlanOption, setSelectedTreatmentPlanOption] = useState('');

  // Options for Provisional Diagnosis dropdown (same as AddDentalRecord)
  const provisionalDiagnosisOptions = [
    "Dental Caries (Tooth Decay)", "Reversible pulpitis", "Irreversible pulpitis (symptomatic/asymptomatic)",
    "Pulp necrosis", "Pulp calcification (pulp stones)", "Internal resorption", "Acute apical periodontitis",
    "Chronic apical periodontitis", "Periapical abscess (acute/chronic)", "Periapical cyst (radicular cyst)",
    "Condensing osteitis (focal sclerosing osteomyelitis)", "Gingivitis (plaque-induced or non-plaque-induced)",
    "Necrotizing ulcerative gingivitis (NUG)", "Gingival hyperplasia/hypertrophy (drug-induced, hormonal, or hereditary)",
    "Chronic periodontitis (localized/generalized)", "Aggressive periodontitis", "Necrotizing periodontitis",
    "Periodontal abscess", "Gingival recession (Miller Class I-IV)", "Furcation involvement (Grade I-III)",
    "Peri-implant mucositis/peri-implantitis", "Aphthous ulcers (minor/major/herpetiform)", "Oral lichen planus",
    "Leukoplakia/erythroplakia (potentially malignant)", "Oral candidiasis (pseudomembranous, erythematous, angular cheilitis)",
    "Herpetic stomatitis (HSV-1)", "Oral squamous cell carcinoma", "Fordyce granules", "Geographic tongue (benign migratory glossitis)",
    "Enamel hypoplasia/hypomineralization", "Amelogenesis imperfecta", "Dentinogenesis imperfecta",
    "Dental fluorosis", "Tooth discoloration (intrinsic/extrinsic)", "Supernumerary teeth (hyperdontia)",
    "Hypodontia/oligodontia/anodontia", "Fusion/gemination", "Taurodontism", "Dens invaginatus/dens evaginatus",
    "Temporomandibular joint disorder (TMD)", "Myofascial pain dysfunction (MPD)", "Bruxism (awake/sleep-related)",
    "Occlusal trauma (primary/secondary)", "Malocclusion (Class I, II, III, open bite, deep bite, crossbite)",
    "Enamel fracture", "Crown fracture (uncomplicated/complicated)", "Root fracture",
    "Luxation (subluxation, extrusion, lateral, intrusion)", "Avulsion (tooth knocked out)", "Alveolar bone fracture",
    "Xerostomia (dry mouth)", "Sialadenitis (salivary gland infection)", "Sialolithiasis (salivary stones)",
    "Mucocele/ranula", "Osteomyelitis", "Osteonecrosis (bisphosphonate-related, radiation-induced)",
    "Odontogenic cysts (dentigerous cyst, odontogenic keratocyst)", "Odontogenic tumors (ameloblastoma, odontoma)",
    "Fibro-osseous lesions (fibrous dysplasia, cemento-osseous dysplasia)", "Fractured prosthesis (crown, bridge, denture)",
    "Denture stomatitis", "Poor denture fit", "Failed restoration", "Crowding/spacing",
    "Impacted teeth (e.g., third molars, canines)", "Ectopic eruption", "Ankylosis (tooth fusion)",
    "Halitosis (oral/systemic causes)", "Burning mouth syndrome", "Trigeminal neuralgia",
    "Sleep apnea (obstructive, related to oral anatomy)",
  ];

  // Options for Treatment Plan dropdown (same as AddDentalRecord)
  const treatmentPlanOptions = [
    "Registration & Consultation",
    "Registration & Consultation (family)",
    "Scaling and Polishing", // Changed from SCALING AND POLISHING
    "Scaling and Polishing with Gross Stain", // Changed from SCALING AND POLISHING WITH GROSS STAIN
    "Simple Extraction Anterior",
    "Simple Extraction Posterior",
    "Extraction of Retained Root",
    "Surgical Extraction (Impacted 3rd Molar)",
    "Temporary Dressing",
    "Amalgam Filling",
    "Fuji 9 (Posterior GIC (per Filling)", // Adjusted casing and parentheses
    "Tooth Whitening (3 Sessions)", // Adjusted casing and parentheses
    "Curretage/Subgingival (per tooth)", // Adjusted casing and parentheses
    "Composite Buildup",
    "Removable Denture (Additional Tooth)", // Adjusted casing and parentheses
    "PFM Crown",
    "Topical Flouridation/Desensitization",
    "X-Ray", // Changed from X-RAY
    "Root Canal Treatment Anterior",
    "Root Canal Treatment Posterior",
    "Gingivectomy/Operculectomy",
    "Splinting with Wires",
    "Splinting with GIC Composite",
    "Incision & Drainage/Suturing with Debridement", // Adjusted casing and ampersand
    "Fissure Sealant",
    "Pulpotomy/Pulpectomy",
    "Stainless Steel Crown",
    "Band & Loop Space Maintainers",
    "LLA & TPA Space Maintainers",
    "Essix Retainer",
    "Crown Cementation",
    "Esthetic Tooth Filling", // Changed from ESTETIC TOOTH FILLING
    "Zirconium Crown",
    "Gold Crown",
    "Flexible Denture (per tooth)", // Changed from FLEXIBLE DENTURE PER TEETH
    "Flexible Denture (2nd tooth)", // Changed from FLEXIBLE DENTURS 2ND TEETH
    "Metallic Crown",
    "Dental Implant – One Tooth", // Changed from DENTAL IMPLANT-ONE TEETH
    "Dental Implant – Two Teeth", // Changed from DENTAL IMPLANT - TWO TEETH
    "Orthodontist Consult",
    "Partial Denture",
    "Denture Repair",
    "GIC Filling",
    "Braces Consultation",
    "Braces",
    "Fluoride Treatment", // Changed from FLUORIDE TREATMENT
    "Intermaxillary Fixation",
    "Aligners",
    "E-Max Crown"
  ];

  useEffect(() => {
    const fetchRecordAndPatientDetails = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const parsedPatientId = parseInt(patientId);
      const parsedRecordId = parseInt(recordId);

      if (isNaN(parsedPatientId) || isNaN(parsedRecordId)) {
        setError("Invalid Patient ID or Record ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        // Fetch Patient Name
        const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatientName(patientData.name);
        } else {
          console.error("Failed to fetch patient name for record detail.");
        }

        // Fetch Dental Record Details
        const recordResponse = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}/dental-records/${parsedRecordId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (recordResponse.ok) {
          const recordData = await recordResponse.json();
          // Populate form data with fetched record details
          setFormData({
            complaint: recordData.complaint || '',
            historyOfPresentComplaint: recordData.historyOfPresentComplaint || '',
            pastDentalHistory: recordData.pastDentalHistory || '',
            medicationS: recordData.medicationS || false,
            medicationH: recordData.medicationH || false,
            medicationA: recordData.medicationA || false,
            medicationD: recordData.medicationD || false,
            medicationE: recordData.medicationE || false,
            medicationPUD: recordData.medicationPUD || false,
            medicationBloodDisorder: recordData.medicationBloodDisorder || false,
            medicationAllergy: recordData.medicationAllergy || false,
            familySocialHistory: recordData.familySocialHistory || '',
            extraOralExamination: recordData.extraOralExamination || '',
            intraOralExamination: recordData.intraOralExamination || '',
            // Ensure quadrant data is an object, or use initialQuadrantState as fallback
            teethPresent: recordData.teethPresent || { ...initialQuadrantState },
            cariousCavity: recordData.cariousCavity || { ...initialQuadrantState },
            filledTeeth: recordData.filledTeeth || { ...initialQuadrantState },
            missingTeeth: recordData.missingTeeth || { ...initialQuadrantState },
            fracturedTeeth: recordData.fracturedTeeth || { ...initialQuadrantState },
            periodontalCondition: recordData.periodontalCondition || '',
            oralHygiene: recordData.oralHygiene || '',
            investigations: recordData.investigations || '',
            xrayFindings: recordData.xrayFindings || '',
            // Initialize provisionalDiagnosis and treatmentPlan with fetched arrays
            provisionalDiagnosis: Array.isArray(recordData.provisionalDiagnosis) ? recordData.provisionalDiagnosis : [],
            treatmentPlan: Array.isArray(recordData.treatmentPlan) ? recordData.treatmentPlan : [],
            treatmentDone: recordData.treatmentDone || '', // NEW: Populate treatmentDone
            calculus: recordData.calculus || '',
            // Format date for input type="date"
            recordDate: recordData.recordDate ? new Date(recordData.recordDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          });
          // Reset selected options for dropdowns after loading data
          setSelectedProvisionalDiagnosisOption('');
          setSelectedTreatmentPlanOption('');

        } else if (recordResponse.status === 404) {
          setError('Dental record not found.');
        } else if (recordResponse.status === 401 || recordResponse.status === 403) {
          localStorage.clear();
          navigate('/login');
        } else {
          const errorData = await recordResponse.json();
          setError(errorData.error || `Failed to fetch dental record details. Status: ${recordResponse.status}`);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server.');
        console.error('Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordAndPatientDetails();
  }, [patientId, recordId, navigate]); // Dependencies for useEffect

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle quadrant inputs (e.g., "teethPresent.q1")
      const [parentName, quadrantKey] = name.split('.');
      setFormData((prevData) => ({
        ...prevData,
        [parentName]: {
          ...prevData[parentName],
          [quadrantKey]: value,
        },
      }));
    } else {
      // Handle regular inputs and checkboxes
      setFormData((prevData) => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // Helper functions for Provisional Diagnosis (Add/Remove)
  const handleAddProvisionalDiagnosis = () => {
    if (selectedProvisionalDiagnosisOption && !formData.provisionalDiagnosis.includes(selectedProvisionalDiagnosisOption)) {
      setFormData((prevData) => ({
        ...prevData,
        provisionalDiagnosis: [...prevData.provisionalDiagnosis, selectedProvisionalDiagnosisOption],
      }));
      setSelectedProvisionalDiagnosisOption(''); // Clear selection after adding
    }
  };

  const handleRemoveProvisionalDiagnosis = (diagnosisToRemove) => {
    setFormData((prevData) => ({
      ...prevData,
      provisionalDiagnosis: prevData.provisionalDiagnosis.filter(
        (diagnosis) => diagnosis !== diagnosisToRemove
      ),
    }));
  };

  // Helper functions for Treatment Plan (Add/Remove)
  const handleAddTreatmentPlan = () => {
    if (selectedTreatmentPlanOption && !formData.treatmentPlan.includes(selectedTreatmentPlanOption)) {
      setFormData((prevData) => ({
        ...prevData,
        treatmentPlan: [...prevData.treatmentPlan, selectedTreatmentPlanOption],
      }));
      setSelectedTreatmentPlanOption(''); // Clear selection after adding
    }
  };

  const handleRemoveTreatmentPlan = (planToRemove) => {
    setFormData((prevData) => ({
      ...prevData,
      treatmentPlan: prevData.treatmentPlan.filter(
        (plan) => plan !== planToRemove
      ),
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setIsError(false);

    // Client-side validation
    if (!formData.complaint || formData.provisionalDiagnosis.length === 0 || formData.treatmentPlan.length === 0) {
      setMessage('Please fill in Chief Complaint, Provisional Diagnosis, and Treatment Plan.');
      setIsError(true);
      setSubmitting(false);
      return;
    }

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setMessage('Authentication required. Please log in again.');
      setIsError(true);
      setSubmitting(false);
      localStorage.clear();
      navigate('/login');
      return;
    }

    try {
      // The backend PUT endpoint for dental records typically only needs the recordId
      // The patientId is part of the URL for logical nesting, but not usually in the payload for update
      const payload = {
        ...formData,
        // Ensure that any fields that might be null or empty strings are handled as null if your backend prefers
        // For example, if a quadrant field is empty, send null instead of ""
        teethPresent: formData.teethPresent.q1 || formData.teethPresent.q2 || formData.teethPresent.q3 || formData.teethPresent.q4 ? formData.teethPresent : null,
        cariousCavity: formData.cariousCavity.q1 || formData.cariousCavity.q2 || formData.cariousCavity.q3 || formData.cariousCavity.q4 ? formData.cariousCavity : null,
        filledTeeth: formData.filledTeeth.q1 || formData.filledTeeth.q2 || formData.filledTeeth.q3 || formData.filledTeeth.q4 ? formData.filledTeeth : null,
        missingTeeth: formData.missingTeeth.q1 || formData.missingTeeth.q2 || formData.missingTeeth.q3 || formData.missingTeeth.q4 ? formData.missingTeeth : null,
        fracturedTeeth: formData.fracturedTeeth.q1 || formData.fracturedTeeth.q2 || formData.fracturedTeeth.q3 || formData.fracturedTeeth.q4 ? formData.fracturedTeeth : null,
        // provisionalDiagnosis and treatmentPlan are already arrays, send them as is
        provisionalDiagnosis: formData.provisionalDiagnosis.length > 0 ? formData.provisionalDiagnosis : [], // Keep as empty array if empty
        treatmentPlan: formData.treatmentPlan.length > 0 ? formData.treatmentPlan : [], // Keep as empty array if empty
        // NEW: Include treatmentDone in the payload
        treatmentDone: formData.treatmentDone || null,


        updatedAt: new Date(), // Set update timestamp
      };

      // Use the PUT endpoint for updating dental records
      const response = await fetch(`${API_BASE_URL}/api/dental-records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Dental record updated successfully!');
        setIsError(false);
        // Redirect back to the dental record detail page after successful update
        navigate(`/patients/${patientId}/dental-records/${recordId}`);
      } else {
        setMessage(data.error || 'Failed to update dental record. Please check the details.');
        setIsError(true);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setMessage('Network error or server is unreachable. Please try again later.');
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="edit-record-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p className="info-message">Loading dental record for editing...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="edit-record-container">
          <p className="info-message error">Error: {error}</p>
          <a href={`/patients/${patientId}/dental-records/${recordId}`} className="back-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
            <i className="fas fa-arrow-left"></i> Back to Record Details
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-record-container">
      <header className="record-form-header">
        <h1>Edit Dental Record for {patientName}</h1>
        <div className="actions">
          <a href={`/patients/${patientId}/dental-records/${recordId}`} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Record Details
          </a>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>Chief Complaint & History</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="complaint">Chief Complaint *</label>
              <textarea
                id="complaint"
                name="complaint"
                value={formData.complaint}
                onChange={handleChange}
                required
                placeholder="e.g., Severe toothache, upper right molar"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="historyOfPresentComplaint">History of Present Complaint</label>
              <textarea
                id="historyOfPresentComplaint"
                name="historyOfPresentComplaint"
                value={formData.historyOfPresentComplaint}
                onChange={handleChange}
                placeholder="e.g., Started 3 days ago, sharp pain, constant, worse with biting"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="pastDentalHistory">Past Dental History</label>
              <textarea
                id="pastDentalHistory"
                name="pastDentalHistory"
                value={formData.pastDentalHistory}
                onChange={handleChange}
                placeholder="e.g., No prior dental work, last cleaning 6 months ago"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="familySocialHistory">Family & Social History</label>
              <textarea
                id="familySocialHistory"
                name="familySocialHistory"
                value={formData.familySocialHistory}
                onChange={handleChange}
                placeholder="e.g., Non-smoker, no relevant family history of dental issues"
              ></textarea>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>Medical History (Medications)</h2>
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input type="checkbox" id="medicationS" name="medicationS" checked={formData.medicationS} onChange={handleChange} />
              <label htmlFor="medicationS">S (Sickle cell)</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="medicationH" name="medicationH" checked={formData.medicationH} onChange={handleChange} />
              <label htmlFor="medicationH">H (Heart Disease)</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="medicationA" name="medicationA" checked={formData.medicationA} onChange={handleChange} />
              <label htmlFor="medicationA">A (Asthma)</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="medicationD" name="medicationD" checked={formData.medicationD} onChange={handleChange} />
              <label htmlFor="medicationD">D (Diabetes)</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="medicationE" name="medicationE" checked={formData.medicationE} onChange={handleChange} />
              <label htmlFor="medicationE">E (Epilepsy)</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="medicationPUD" name="medicationPUD" checked={formData.medicationPUD} onChange={handleChange} />
              <label htmlFor="medicationPUD">PUD (Peptic Ulcer Disease)</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="medicationBloodDisorder" name="medicationBloodDisorder" checked={formData.medicationBloodDisorder} onChange={handleChange} />
              <label htmlFor="medicationBloodDisorder">Blood Disorder</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="medicationAllergy" name="medicationAllergy" checked={formData.medicationAllergy} onChange={handleChange} />
              <label htmlFor="medicationAllergy">Allergy</label>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>Examinations</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="extraOralExamination">Extra-Oral Examination</label>
              <textarea
                id="extraOralExamination"
                name="extraOralExamination"
                value={formData.extraOralExamination}
                onChange={handleChange}
                placeholder="e.g., Mild facial swelling on right side, lymph nodes non-palpable"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="intraOralExamination">Intra-Oral Examination</label>
              <textarea
                id="intraOralExamination"
                name="intraOralExamination"
                value={formData.intraOralExamination}
                onChange={handleChange}
                placeholder="e.g., Tooth #16 fractured, deep caries exposed, gingiva inflamed"
              ></textarea>
            </div>

            {/* Quadrant Inputs */}
            <div className="form-group">
              <label>Teeth Present</label>
              <div className="quadrant-input-group">
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q1</span>
                  <input
                    type="text"
                    name="teethPresent.q1"
                    value={formData.teethPresent.q1}
                    onChange={handleChange}
                  />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q2</span>
                  <input
                    type="text"
                    name="teethPresent.q2"
                    value={formData.teethPresent.q2}
                    onChange={handleChange}
                  />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q4</span>
                  <input
                    type="text"
                    name="teethPresent.q4"
                    value={formData.teethPresent.q4}
                    onChange={handleChange}
                  />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q3</span>
                  <input
                    type="text"
                    name="teethPresent.q3"
                    value={formData.teethPresent.q3}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Carious Cavity</label>
              <div className="quadrant-input-group">
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q1</span>
                  <input type="text" name="cariousCavity.q1" value={formData.cariousCavity.q1} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q2</span>
                  <input type="text" name="cariousCavity.q2" value={formData.cariousCavity.q2} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q4</span>
                  <input type="text" name="cariousCavity.q4" value={formData.cariousCavity.q4} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q3</span>
                  <input type="text" name="cariousCavity.q3" value={formData.cariousCavity.q3} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Filled Teeth</label>
              <div className="quadrant-input-group">
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q1</span>
                  <input type="text" name="filledTeeth.q1" value={formData.filledTeeth.q1} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q2</span>
                  <input type="text" name="filledTeeth.q2" value={formData.filledTeeth.q2} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q4</span>
                  <input type="text" name="filledTeeth.q4" value={formData.filledTeeth.q4} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q3</span>
                  <input type="text" name="filledTeeth.q3" value={formData.filledTeeth.q3} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Missing Teeth</label>
              <div className="quadrant-input-group">
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q1</span>
                  <input type="text" name="missingTeeth.q1" value={formData.missingTeeth.q1} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q2</span>
                  <input type="text" name="missingTeeth.q2" value={formData.missingTeeth.q2} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q4</span>
                  <input type="text" name="missingTeeth.q4" value={formData.missingTeeth.q4} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q3</span>
                  <input type="text" name="missingTeeth.q3" value={formData.missingTeeth.q3} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Fractured Teeth</label>
              <div className="quadrant-input-group">
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q1</span>
                  <input type="text" name="fracturedTeeth.q1" value={formData.fracturedTeeth.q1} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q2</span>
                  <input type="text" name="fracturedTeeth.q2" value={formData.fracturedTeeth.q2} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q4</span>
                  <input type="text" name="fracturedTeeth.q4" value={formData.fracturedTeeth.q4} onChange={handleChange} />
                </div>
                <div className="quadrant-input-item">
                  <span className="quadrant-label">Q3</span>
                  <input
                    type="text"
                    name="fracturedTeeth.q3"
                    value={formData.fracturedTeeth.q3}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="periodontalCondition">Periodontal Condition</label>
              <select
                id="periodontalCondition"
                name="periodontalCondition"
                value={formData.periodontalCondition}
                onChange={handleChange}
              >
                <option value="">Select Condition</option>
                <option value="Chronic periodontitis (localized/generalized)">Chronic periodontitis (localized/generalized)</option>
                <option value="Aggressive periodontitis">Aggressive periodontitis</option>
                <option value="Necrotizing periodontitis">Necrotizing periodontitis</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="oralHygiene">Oral Hygiene</label>
              <select
                id="oralHygiene"
                name="oralHygiene"
                value={formData.oralHygiene}
                onChange={handleChange}
              >
                <option value="">Select Hygiene Level</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Bad">Bad</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="calculus">Calculus</label>
              <input
                type="text"
                id="calculus"
                name="calculus"
                value={formData.calculus}
                onChange={handleChange}
                placeholder="e.g., Absent, Mild, Moderate, Heavy"
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>Investigations & Diagnosis</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="investigations">Investigations</label>
              <textarea
                id="investigations"
                name="investigations"
                value={formData.investigations}
                onChange={handleChange}
                placeholder="e.g., IOPA radiograph of 16, Pulp vitality test"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="xrayFindings">X-ray Findings</label>
              <textarea
                id="xrayFindings"
                name="xrayFindings"
                value={formData.xrayFindings}
                onChange={handleChange}
                placeholder="e.g., Periapical radiolucency at apex of 16, bone loss"
              ></textarea>
            </div>

            {/* Provisional Diagnosis - Click and Add */}
            <div className="form-group full-width-grid-item">
              <label htmlFor="provisionalDiagnosisSelect">Provisional Diagnosis *</label>
              <div className="add-remove-control">
                <select
                  id="provisionalDiagnosisSelect"
                  value={selectedProvisionalDiagnosisOption}
                  onChange={(e) => setSelectedProvisionalDiagnosisOption(e.target.value)}
                  className="form-select" // Re-using form-select class if it exists for general select styling
                >
                  <option value="">Select a diagnosis</option>
                  {provisionalDiagnosisOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleAddProvisionalDiagnosis} className="add-button">
                  Add Diagnosis
                </button>
              </div>
              {formData.provisionalDiagnosis.length > 0 && (
                <ul className="added-items-list">
                  {formData.provisionalDiagnosis.map((diagnosis, index) => (
                    <li key={index}>
                      {diagnosis}
                      <button type="button" onClick={() => handleRemoveProvisionalDiagnosis(diagnosis)} className="remove-item-button">
                        <i className="fas fa-trash"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Treatment Plan - Click and Add */}
            <div className="form-group full-width-grid-item">
              <label htmlFor="treatmentPlanSelect">Treatment Plan *</label>
              <div className="add-remove-control">
                <select
                  id="treatmentPlanSelect"
                  value={selectedTreatmentPlanOption}
                  onChange={(e) => setSelectedTreatmentPlanOption(e.target.value)}
                  className="form-select" // Re-using form-select class if it exists for general select styling
                >
                  <option value="">Select a treatment plan</option>
                  {treatmentPlanOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleAddTreatmentPlan} className="add-button">
                  Add Plan
                </button>
              </div>
              {formData.treatmentPlan.length > 0 && (
                <ul className="added-items-list">
                  {formData.treatmentPlan.map((plan, index) => (
                    <li key={index}>
                      {plan}
                      <button type="button" onClick={() => handleRemoveTreatmentPlan(plan)} className="remove-item-button">
                        <i className="fas fa-trash"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* NEW: Treatment Done Input */}
            <div className="form-group full-width-grid-item">
              <label htmlFor="treatmentDone">Treatment Done</label>
              <textarea
                id="treatmentDone"
                name="treatmentDone"
                value={formData.treatmentDone}
                onChange={handleChange}
                placeholder="e.g., Composite filling on #16, scaling and polishing completed."
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="recordDate">Record Date</label>
              <input
                type="date"
                id="recordDate"
                name="recordDate"
                value={formData.recordDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Updating Record...' : 'Update Dental Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
