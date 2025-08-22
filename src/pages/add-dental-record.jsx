// src/pages/add-dental-record.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './add-dental-record.css';
import API_BASE_URL from '../config/api';

export default function AddDentalRecord() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [appointmentInterval, setAppointmentInterval] = useState('');
  const [manualProvisionalDiagnosis, setManualProvisionalDiagnosis] = useState('');
  const [manualTreatmentPlan, setManualTreatmentPlan] = useState('');

  // --- NEW: State for X-ray file management ---
  const [xrayImageFile, setXrayImageFile] = useState(null);
  const [xrayImagePreview, setXrayImagePreview] = useState('');

  const appointmentIntervals = [
      '1 day', '2 days', '3 days', '1 week', '2 weeks', '1 month', '6 weeks', '3 months', '6 months'
  ];

  const initialQuadrantState = { q1: '', q2: '', q3: '', q4: '' };

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
    medicationHIV: false,
    medicationHepatitis: false,
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
    xrayUrl: '', // Field to hold the URL from the backend
    provisionalDiagnosis: [],
    treatmentPlan: [],
    treatmentDone: '',
    calculus: '',
    recordDate: new Date().toISOString().split('T')[0],
  });

  const [selectedProvisionalDiagnosisOption, setSelectedProvisionalDiagnosisOption] = useState('');
  const [selectedTreatmentPlanOption, setSelectedTreatmentPlanOption] = useState('');

  const provisionalDiagnosisOptions = [
    "Dental Caries (Tooth Decay)", "Reversible pulpitis", "Irreversible pulpitis (symptomatic/asymptomatic)", "Pulp necrosis", "Pulp calcification (pulp stones)", 
    "Internal resorption", "Acute apical periodontitis", "Chronic apical periodontitis", "Periapical abscess (acute/chronic)", "Periapical cyst (radicular cyst)",
    "Condensing osteitis (focal sclerosing osteomyelitis)", "Gingivitis (plaque-induced or non-plaque-induced)", "Necrotizing ulcerative gingivitis (NUG)", 
    "Gingival hyperplasia/hypertrophy (drug-induced, hormonal, or hereditary)", "Chronic periodontitis (localized/generalized)", "Aggressive periodontitis", 
    "Necrotizing periodontitis", "Periodontal abscess", "Gingival recession (Miller Class I-IV)", "Furcation involvement (Grade I-III)", "Peri-implant mucositis/peri-implantitis", 
    "Aphthous ulcers (minor/major/herpetiform)", "Oral lichen planus", "Leukoplakia/erythroplakia (potentially malignant)", "Oral candidiasis (pseudomembranous, erythematous, angular cheilitis)",
    "Herpetic stomatitis (HSV-1)", "Oral squamous cell carcinoma", "Fordyce granules", "Geographic tongue (benign migratory glossitis)", "Enamel hypoplasia/hypomineralization", 
    "Amelogenesis imperfecta", "Dentinogenesis imperfecta", "Dental fluorosis", "Tooth discoloration (intrinsic/extrinsic)", "Supernumerary teeth (hyperdontia)",
    "Hypodontia/oligodontia/anodontia", "Fusion/gemination", "Taurodontism", "Dens invaginatus/dens evaginatus", "Temporomandibular joint disorder (TMD)", 
    "Myofascial pain dysfunction (MPD)", "Bruxism (awake/sleep-related)", "Occlusal trauma (primary/secondary)", "Malocclusion (Class I, II, III, open bite, deep bite, crossbite)",
    "Enamel fracture", "Crown fracture (uncomplicated/complicated)", "Root fracture", "Luxation (subluxation, extrusion, lateral, intrusion)", "Avulsion (tooth knocked out)", 
    "Alveolar bone fracture", "Xerostomia (dry mouth)", "Sialadenitis (salivary gland infection)", "Sialolithiasis (salivary stones)", "Mucocele/ranula", 
    "Osteomyelitis", "Osteonecrosis (bisphosphonate-related, radiation-induced)", "Odontogenic cysts (dentigerous cyst, odontogenic keratocyst)", 
    "Odontogenic tumors (ameloblastoma, odontoma)", "Fibro-osseous lesions (fibrous dysplasia, cemento-osseous dysplasia)", "Fractured prosthesis (crown, bridge, denture)",
    "Denture stomatitis", "Poor denture fit", "Failed restoration", "Crowding/spacing", "Impacted teeth (e.g., third molars, canines)", "Ectopic eruption", 
    "Ankylosis (tooth fusion)", "Halitosis (oral/systemic causes)", "Burning mouth syndrome", "Trigeminal neuralgia", "Sleep apnea (obstructive, related to oral anatomy)",
  ];

  const treatmentPlanOptions = [
    "Registration & Consultation", "Registration & Consultation (family)", "Scaling and Polishing", "Scaling and Polishing with Gross Stain", "Simple Extraction Anterior", 
    "Simple Extraction Posterior", "Extraction of Retained Root", "Surgical Extraction (Impacted 3rd Molar)", "Temporary Dressing", "Amalgam Filling", 
    "Fuji 9 (Posterior GIC (per Filling)", "Tooth Whitening (3 Sessions)", "Curretage/Subgingival (per tooth)", "Composite Buildup", "Removable Denture (Additional Tooth)",
    "PFM Crown", "Topical Flouridation/Desensitization", "X-Ray", "Root Canal Treatment Anterior", "Root Canal Treatment Posterior", "Gingivectomy/Operculectomy",
    "Splinting with Wires", "Splinting with GIC Composite", "Incision & Drainage/Suturing with Debridement", "Fissure Sealant", "Pulpotomy/Pulpectomy", 
    "Stainless Steel Crown", "Band & Loop Space Maintainers", "LLA & TPA Space Maintainers", "Essix Retainer", "Crown Cementation", "Esthetic Tooth Filling",
    "Zirconium Crown", "Gold Crown", "Flexible Denture (per tooth)", "Flexible Denture (2nd tooth)", "Metallic Crown", "Dental Implant – One Tooth", 
    "Dental Implant – Two Teeth", "Orthodontist Consult", "Partial Denture", "Denture Repair", "GIC Filling", "Braces Consultation", "Braces", "Fluoride Treatment",
    "Intermaxillary Fixation", "Aligners", "E-Max Crown","Drug", "Mouthwash"
  ];

  useEffect(() => {
    const fetchPatientDataAndUserRole = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);
      if (!token) { navigate('/login'); return; }
      if (role !== 'owner' && role !== 'doctor' && role !== 'nurse') {
        console.log(`[AddDentalRecord] User role '${role}' not authorized to view this page. Redirecting to dashboard.`);
        navigate('/dashboard');
        return;
      }
      const parsedPatientId = parseInt(patientId);
      if (isNaN(parsedPatientId)) {
        setError("Invalid Patient ID provided in the URL.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/${parsedPatientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const patientData = await response.json();
          setPatientName(patientData.name);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.clear();
          navigate('/login');
        } else if (response.status === 404) {
          setError('Patient not found.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to fetch patient name. Status: ${response.status}`);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server.');
        console.error('Network Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientDataAndUserRole();
  }, [patientId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setXrayImageFile(file);
      setXrayImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parentName, quadrantKey] = name.split('.');
      setFormData((prevData) => ({ ...prevData, [parentName]: { ...prevData[parentName], [quadrantKey]: value, }, }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: type === 'checkbox' ? checked : value, }));
    }
  };

  const handleAddProvisionalDiagnosis = () => {
    if (selectedProvisionalDiagnosisOption) {
      if (!formData.provisionalDiagnosis.includes(selectedProvisionalDiagnosisOption)) {
        setFormData(prevData => ({ ...prevData, provisionalDiagnosis: [...prevData.provisionalDiagnosis, selectedProvisionalDiagnosisOption].sort() }));
        setSelectedProvisionalDiagnosisOption('');
      } else {
        toast.warn("This diagnosis has already been added.");
      }
    } else {
      toast.warn("Please select a provisional diagnosis to add.");
    }
  };
  
  const handleAddManualProvisionalDiagnosis = () => {
    const trimmedDiagnosis = manualProvisionalDiagnosis.trim();
    if (trimmedDiagnosis) {
      if (!formData.provisionalDiagnosis.includes(trimmedDiagnosis)) {
        setFormData(prevData => ({ ...prevData, provisionalDiagnosis: [...prevData.provisionalDiagnosis, trimmedDiagnosis].sort() }));
        setManualProvisionalDiagnosis('');
      } else {
        toast.warn("This diagnosis has already been added.");
      }
    } else {
      toast.warn("Please type a diagnosis to add.");
    }
  };

  const handleRemoveProvisionalDiagnosis = (diagnosisToRemove) => {
    setFormData(prevData => ({ ...prevData, provisionalDiagnosis: prevData.provisionalDiagnosis.filter(d => d !== diagnosisToRemove) }));
  };

  const handleAddTreatmentPlan = () => {
    if (selectedTreatmentPlanOption) {
      if (!formData.treatmentPlan.includes(selectedTreatmentPlanOption)) {
        setFormData(prevData => ({ ...prevData, treatmentPlan: [...prevData.treatmentPlan, selectedTreatmentPlanOption].sort() }));
        setSelectedTreatmentPlanOption('');
      } else {
        toast.warn("This treatment plan has already been added.");
      }
    } else {
      toast.warn("Please select a treatment plan to add.");
    }
  };
  
  const handleAddManualTreatmentPlan = () => {
    const trimmedPlan = manualTreatmentPlan.trim();
    if (trimmedPlan) {
      if (!formData.treatmentPlan.includes(trimmedPlan)) {
        setFormData(prevData => ({ ...prevData, treatmentPlan: [...prevData.treatmentPlan, trimmedPlan].sort() }));
        setManualTreatmentPlan('');
      } else {
        toast.warn("This treatment plan has already been added.");
      }
    } else {
      toast.warn("Please type a treatment plan to add.");
    }
  };

  const handleRemoveTreatmentPlan = (planToRemove) => {
    setFormData(prevData => ({ ...prevData, treatmentPlan: prevData.treatmentPlan.filter(p => p !== planToRemove) }));
  };

  const handleImageUpload = async (file) => {
    const token = localStorage.getItem('jwtToken');
    const uploadData = new FormData();
    uploadData.append('xray', file);
    try {
      const response = await fetch(`${API_BASE_URL}/api/xray/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Backend image upload failed.');
      }
      toast.success("Image uploaded successfully!");
      return data.xrayUrl;
    } catch (err) {
      toast.error(`Image upload failed: ${err.message}`);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    toast.dismiss();
  
    if (!formData.complaint || formData.provisionalDiagnosis.length === 0 || formData.treatmentPlan.length === 0 || !formData.treatmentDone || !appointmentInterval) {
      toast.error('Please fill all required fields (*), including Treatment Done and Recall Period.');
      setSubmitting(false);
      return;
    }
  
    const token = localStorage.getItem('jwtToken');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
      toast.error('Authentication required. Please log in again.');
      setSubmitting(false);
      localStorage.clear();
      navigate('/login');
      return;
    }
  
    try {
      let imageUrl = '';
      if (xrayImageFile) {
        toast.info("Uploading X-ray image...");
        imageUrl = await handleImageUpload(xrayImageFile);
        if (!imageUrl) {
          setSubmitting(false);
          return; // Stop submission if upload fails
        }
      }

      const payload = { ...formData, xrayUrl: imageUrl, patientId: parseInt(patientId), userId: parseInt(userId), };
  
      const recordResponse = await fetch(`${API_BASE_URL}/api/patients/${patientId}/dental-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, },
        body: JSON.stringify(payload),
      });
      const recordData = await recordResponse.json();
      if (!recordResponse.ok) {
        throw new Error(recordData.error || 'Failed to add dental record.');
      }
      toast.success(recordData.message || 'Dental record added successfully!');
  
      const appointmentResponse = await fetch(`${API_BASE_URL}/api/patients/${patientId}/schedule-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, },
        body: JSON.stringify({ interval: appointmentInterval }),
      });
      const appointmentData = await appointmentResponse.json();
      if (!appointmentResponse.ok) {
        toast.warn(`Record saved, but failed to set appointment: ${appointmentData.error}.`);
      } else {
        toast.success('Next appointment scheduled!');
      }
      navigate(`/patients/${patientId}`);
  
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="add-record-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p className="info-message">Loading patient data...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="add-record-container">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate(`/patients/${patientId}`)} className="back-button" style={{ margin: '20px auto', display: 'block', width: 'fit-content' }}>
            <i className="fas fa-arrow-left"></i> Back to Patient Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="add-record-container">
      <header className="record-form-header">
        <h1>Add Dental Record for {patientName}</h1>
        <div className="actions">
          <button onClick={() => navigate(`/patients/${patientId}`)} className="back-button"><i className="fas fa-arrow-left"></i> Back to Patient Details</button>
          <button onClick={() => navigate('/patients')} className="all-patients-button"><i className="fas fa-users"></i> All Patient List</button>
          {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse') && (
            <button onClick={() => navigate(`/patients/${patientId}/invoice`)} className="generate-invoice-button"><i className="fas fa-file-invoice"></i> Send Invoice</button>
          )}
          {(userRole === 'owner' || userRole === 'staff' || userRole === 'nurse') && (
            <button onClick={() => navigate(`/patients/${patientId}/receipts`)} className="generate-receipt-button"><i className="fas fa-receipt"></i> Send Receipt</button>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>Chief Complaint & History</h2>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="complaint">Chief Complaint *</label><textarea id="complaint" name="complaint" value={formData.complaint} onChange={handleChange} required placeholder="e.g., Severe toothache, upper right molar"></textarea></div>
            <div className="form-group"><label htmlFor="historyOfPresentComplaint">History of Present Complaint</label><textarea id="historyOfPresentComplaint" name="historyOfPresentComplaint" value={formData.historyOfPresentComplaint} onChange={handleChange} placeholder="e.g., Started 3 days ago, sharp pain, constant, worse with biting"></textarea></div>
            <div className="form-group"><label htmlFor="pastDentalHistory">Past Dental History</label><textarea id="pastDentalHistory" name="pastDentalHistory" value={formData.pastDentalHistory} onChange={handleChange} placeholder="e.g., No prior dental work, last cleaning 6 months ago"></textarea></div>
            <div className="form-group"><label htmlFor="familySocialHistory">Family & Social History</label><textarea id="familySocialHistory" name="familySocialHistory" value={formData.familySocialHistory} onChange={handleChange} placeholder="e.g., Non-smoker, no relevant family history of dental issues"></textarea></div>
          </div>
        </section>

        <section className="form-section">
          <h2>Medical History (Medications)</h2>
          <div className="checkbox-group">
            <div className="checkbox-item"><input type="checkbox" id="medicationS" name="medicationS" checked={formData.medicationS} onChange={handleChange} /><label htmlFor="medicationS">S (Sickle cell)</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationH" name="medicationH" checked={formData.medicationH} onChange={handleChange} /><label htmlFor="medicationH">H (Heart Disease)</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationA" name="medicationA" checked={formData.medicationA} onChange={handleChange} /><label htmlFor="medicationA">A (Asthma)</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationD" name="medicationD" checked={formData.medicationD} onChange={handleChange} /><label htmlFor="medicationD">D (Diabetes)</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationE" name="medicationE" checked={formData.medicationE} onChange={handleChange} /><label htmlFor="medicationE">E (Epilepsy)</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationPUD" name="medicationPUD" checked={formData.medicationPUD} onChange={handleChange} /><label htmlFor="medicationPUD">PUD (Peptic Ulcer Disease)</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationBloodDisorder" name="medicationBloodDisorder" checked={formData.medicationBloodDisorder} onChange={handleChange} /><label htmlFor="medicationBloodDisorder">Blood Disorder</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationAllergy" name="medicationAllergy" checked={formData.medicationAllergy} onChange={handleChange} /><label htmlFor="medicationAllergy">Allergy</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationHIV" name="medicationHIV" checked={formData.medicationHIV} onChange={handleChange} /><label htmlFor="medicationHIV">HIV</label></div>
            <div className="checkbox-item"><input type="checkbox" id="medicationHepatitis" name="medicationHepatitis" checked={formData.medicationHepatitis} onChange={handleChange} /><label htmlFor="medicationHepatitis">Hepatitis</label></div>
          </div>
        </section>

        <section className="form-section">
          <h2>Examinations</h2>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="extraOralExamination">Extra-Oral Examination</label><textarea id="extraOralExamination" name="extraOralExamination" value={formData.extraOralExamination} onChange={handleChange} placeholder="e.g., Mild facial swelling on right side, lymph nodes non-palpable"></textarea></div>
            <div className="form-group"><label htmlFor="intraOralExamination">Intra-Oral Examination</label><textarea id="intraOralExamination" name="intraOralExamination" value={formData.intraOralExamination} onChange={handleChange} placeholder="e.g., Tooth #16 fractured, deep caries exposed, gingiva inflamed"></textarea></div>
            <div className="form-group"><label>Teeth Present</label><div className="quadrant-input-group"><div className="quadrant-input-item"><span className="quadrant-label">Q1</span><input type="text" name="teethPresent.q1" value={formData.teethPresent.q1} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q2</span><input type="text" name="teethPresent.q2" value={formData.teethPresent.q2} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q4</span><input type="text" name="teethPresent.q4" value={formData.teethPresent.q4} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q3</span><input type="text" name="teethPresent.q3" value={formData.teethPresent.q3} onChange={handleChange}/></div></div></div>
            <div className="form-group"><label>Carious Cavity</label><div className="quadrant-input-group"><div className="quadrant-input-item"><span className="quadrant-label">Q1</span><input type="text" name="cariousCavity.q1" value={formData.cariousCavity.q1} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q2</span><input type="text" name="cariousCavity.q2" value={formData.cariousCavity.q2} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q4</span><input type="text" name="cariousCavity.q4" value={formData.cariousCavity.q4} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q3</span><input type="text" name="cariousCavity.q3" value={formData.cariousCavity.q3} onChange={handleChange}/></div></div></div>
            <div className="form-group"><label>Filled Teeth</label><div className="quadrant-input-group"><div className="quadrant-input-item"><span className="quadrant-label">Q1</span><input type="text" name="filledTeeth.q1" value={formData.filledTeeth.q1} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q2</span><input type="text" name="filledTeeth.q2" value={formData.filledTeeth.q2} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q4</span><input type="text" name="filledTeeth.q4" value={formData.filledTeeth.q4} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q3</span><input type="text" name="filledTeeth.q3" value={formData.filledTeeth.q3} onChange={handleChange}/></div></div></div>
            <div className="form-group"><label>Missing Teeth</label><div className="quadrant-input-group"><div className="quadrant-input-item"><span className="quadrant-label">Q1</span><input type="text" name="missingTeeth.q1" value={formData.missingTeeth.q1} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q2</span><input type="text" name="missingTeeth.q2" value={formData.missingTeeth.q2} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q4</span><input type="text" name="missingTeeth.q4" value={formData.missingTeeth.q4} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q3</span><input type="text" name="missingTeeth.q3" value={formData.missingTeeth.q3} onChange={handleChange}/></div></div></div>
            <div className="form-group"><label>Fractured Teeth</label><div className="quadrant-input-group"><div className="quadrant-input-item"><span className="quadrant-label">Q1</span><input type="text" name="fracturedTeeth.q1" value={formData.fracturedTeeth.q1} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q2</span><input type="text" name="fracturedTeeth.q2" value={formData.fracturedTeeth.q2} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q4</span><input type="text" name="fracturedTeeth.q4" value={formData.fracturedTeeth.q4} onChange={handleChange}/></div><div className="quadrant-input-item"><span className="quadrant-label">Q3</span><input type="text" name="fracturedTeeth.q3" value={formData.fracturedTeeth.q3} onChange={handleChange}/></div></div></div>
            <div className="form-group"><label htmlFor="periodontalCondition">Periodontal Condition</label><select id="periodontalCondition" name="periodontalCondition" value={formData.periodontalCondition} onChange={handleChange}><option value="">Select Condition</option><option value="Chronic periodontitis (localized/generalized)">Chronic periodontitis (localized/generalized)</option><option value="Aggressive periodontitis">Aggressive periodontitis</option><option value="Necrotizing periodontitis">Necrotizing periodontitis</option></select></div>
            <div className="form-group"><label htmlFor="oralHygiene">Oral Hygiene</label><select id="oralHygiene" name="oralHygiene" value={formData.oralHygiene} onChange={handleChange}><option value="">Select Hygiene Level</option><option value="Good">Good</option><option value="Fair">Fair</option><option value="Bad">Bad</option></select></div>
            <div className="form-group"><label htmlFor="calculus">Calculus</label><input type="text" id="calculus" name="calculus" value={formData.calculus} onChange={handleChange} placeholder="e.g., Absent, Mild, Moderate, Heavy"/></div>
          </div>
        </section>

        <section className="form-section">
          <h2>Investigations & Diagnosis</h2>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="investigations">Investigations</label><textarea id="investigations" name="investigations" value={formData.investigations} onChange={handleChange} placeholder="e.g., IOPA radiograph of 16, Pulp vitality test"></textarea></div>
            <div className="form-group"><label htmlFor="xrayFindings">X-ray Findings</label><textarea id="xrayFindings" name="xrayFindings" value={formData.xrayFindings} onChange={handleChange} placeholder="e.g., Periapical radiolucency at apex of 16, bone loss"></textarea></div>
            
            {/* --- X-RAY UPLOAD FIELD --- */}
            <div className="form-group full-width-grid-item">
              <label htmlFor="xrayUpload">Upload X-ray Image (Optional)</label>
              <input type="file" id="xrayUpload" name="xrayUpload" accept="image/*" onChange={handleFileChange} className="file-input"/>
              {xrayImagePreview && (
                <div className="image-preview-container">
                  <p>Image Preview:</p>
                  <img src={xrayImagePreview} alt="X-ray Preview" className="image-preview" />
                </div>
              )}
            </div>

            <div className="form-group full-width-grid-item"><label htmlFor="provisionalDiagnosisSelect">Provisional Diagnosis *</label><div className="add-remove-control"><select id="provisionalDiagnosisSelect" value={selectedProvisionalDiagnosisOption} onChange={(e) => setSelectedProvisionalDiagnosisOption(e.target.value)} className="form-select"><option value="">Select a diagnosis from the list</option>{provisionalDiagnosisOptions.map((option) => (<option key={option} value={option}>{option}</option>))}</select><button type="button" onClick={handleAddProvisionalDiagnosis} className="add-button">Add Selected</button></div><div className="add-remove-control" style={{ marginTop: '10px' }}><input type="text" placeholder="Or type a new diagnosis manually" value={manualProvisionalDiagnosis} onChange={(e) => setManualProvisionalDiagnosis(e.target.value)}/><button type="button" onClick={handleAddManualProvisionalDiagnosis} className="add-button">Add Manual</button></div>{formData.provisionalDiagnosis.length > 0 && (<ul className="added-items-list">{formData.provisionalDiagnosis.map((diagnosis, index) => (<li key={index}>{diagnosis}<button type="button" onClick={() => handleRemoveProvisionalDiagnosis(diagnosis)} className="remove-item-button"><i className="fas fa-trash"></i></button></li>))}</ul>)}</div>
            <div className="form-group full-width-grid-item"><label htmlFor="treatmentPlanSelect">Treatment Plan *</label><div className="add-remove-control"><select id="treatmentPlanSelect" value={selectedTreatmentPlanOption} onChange={(e) => setSelectedTreatmentPlanOption(e.target.value)} className="form-select"><option value="">Select a treatment plan from the list</option>{treatmentPlanOptions.map((option) => (<option key={option} value={option}>{option}</option>))}</select><button type="button" onClick={handleAddTreatmentPlan} className="add-button">Add Selected</button></div><div className="add-remove-control" style={{ marginTop: '10px' }}><input type="text" placeholder="Or type a new treatment plan manually" value={manualTreatmentPlan} onChange={(e) => setManualTreatmentPlan(e.target.value)}/><button type="button" onClick={handleAddManualTreatmentPlan} className="add-button">Add Manual</button></div>{formData.treatmentPlan.length > 0 && (<ul className="added-items-list">{formData.treatmentPlan.map((plan, index) => (<li key={index}>{plan}<button type="button" onClick={() => handleRemoveTreatmentPlan(plan)} className="remove-item-button"><i className="fas fa-trash"></i></button></li>))}</ul>)}</div>
            <div className="form-group full-width-grid-item"><label htmlFor="treatmentDone">Treatment Done *</label><textarea id="treatmentDone" name="treatmentDone" value={formData.treatmentDone} onChange={handleChange} required placeholder="e.g., Composite filling on #16, scaling and polishing completed."></textarea></div>
            <div className="form-group"><label htmlFor="recordDate">Record Date</label><input type="date" id="recordDate" name="recordDate" value={formData.recordDate} onChange={handleChange}/></div>
          </div>
        </section>

        <section className="form-section">
          <h2>Next Appointment</h2>
          <div className="form-group"><label htmlFor="appointment-interval">Recall Period *</label><select id="appointment-interval" value={appointmentInterval} onChange={(e) => setAppointmentInterval(e.target.value)} required><option value="" disabled>Select a recall period</option>{appointmentIntervals.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></div>
        </section>

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Record & Set Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
