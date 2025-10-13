import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { toast } from 'react-toastify';
import './settings.css';

// --- Skeleton Loader Component ---
function SettingsSkeletonLoader() {
    return (
        <div className="settings-page-container">
            <header className="page-header skeleton-loader">
                <div className="skeleton-item" style={{ height: '40px', width: '200px' }}></div>
                <div className="skeleton-item" style={{ height: '40px', width: '180px' }}></div>
            </header>
            <div className="settings-page skeleton-loader">
                <nav className="skeleton-nav">
                    <div className="skeleton-item"></div>
                </nav>
                <main className="skeleton-content">
                    <div className="permissions-nav skeleton-subnav">
                        <div className="skeleton-item"></div>
                        <div className="skeleton-item"></div>
                        <div className="skeleton-item"></div>
                    </div>
                    <section className="settings-section">
                        <div className="settings-grid">
                            <div className="skeleton-card"><div className="skeleton-item"></div></div>
                            <div className="skeleton-card"><div className="skeleton-item"></div></div>
                            <div className="skeleton-card"><div className="skeleton-item"></div></div>
                            <div className="skeleton-card"><div className="skeleton-item"></div></div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}


// --- Main Settings Page Component ---
export default function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [services, setServices] = useState([]);
    const [hmos, setHmos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('permissions');
    const navigate = useNavigate();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'service' or 'hmo'
    const [editingItem, setEditingItem] = useState(null); // null for new, item object for edit

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const [settingsRes, billingRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/api/billing/options`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!settingsRes.ok || !billingRes.ok) throw new Error(`Failed to fetch initial data.`);
            
            const settingsData = await settingsRes.json();
            const billingData = await billingRes.json();
            
            setSettings(settingsData);
            setServices(billingData.services || []);
            setHmos(billingData.hmos || []);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveChanges = async (updatedSettings) => {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedSettings)
            });
            if (!response.ok) throw new Error('Failed to save settings.');
            toast.success('Permissions saved successfully!');
            setSettings(updatedSettings);
        } catch (err) {
            toast.error(err.message);
            console.error(err);
        }
    };
    
    // --- CRUD Handlers ---
    const handleOpenModal = (type, item = null) => {
        setModalType(type);
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setModalType(null);
    };

    const handleSaveItem = async (itemData) => {
        const token = localStorage.getItem('jwtToken');
        const isEditing = !!editingItem;
        const url = isEditing
            ? `${API_BASE_URL}/api/billing/${modalType}s/${editingItem.id}`
            : `${API_BASE_URL}/api/billing/${modalType}s`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(itemData),
            });
            if (!response.ok) throw new Error(`Failed to save ${modalType}.`);
            toast.success(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} saved successfully!`);
            handleCloseModal();
            fetchData(); // Refresh data
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDeleteItem = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
        
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch(`${API_BASE_URL}/api/billing/${type}s/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(`Failed to delete ${type}.`);
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
            fetchData(); // Refresh data
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <SettingsSkeletonLoader />;

    if (error) return <div className="settings-container error-message"><p>Error: {error}</p></div>;

    return (
        <div className="settings-page-container">
            <header className="page-header">
                <h1>Settings</h1>
                <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-btn">
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </header>

            <div className="settings-page">
                <nav className="settings-nav">
                    <ul>
                        <li><button onClick={() => setActiveTab('permissions')} className={activeTab === 'permissions' ? 'active' : ''}><i className="fas fa-user-shield"></i> Permissions</button></li>
                        <li><button onClick={() => setActiveTab('pricelist')} className={activeTab === 'pricelist' ? 'active' : ''}><i className="fas fa-dollar-sign"></i> Pricelist</button></li>
                        <li><button onClick={() => setActiveTab('hmos')} className={activeTab === 'hmos' ? 'active' : ''}><i className="fas fa-hospital"></i> HMO Providers</button></li>
                    </ul>
                </nav>
                <main className="settings-content">
                    {activeTab === 'permissions' && settings && <PermissionsSection settings={settings} onSave={handleSaveChanges} />}
                    {activeTab === 'pricelist' && <PricelistSection services={services} onAdd={() => handleOpenModal('service')} onEdit={(item) => handleOpenModal('service', item)} onDelete={(id) => handleDeleteItem('service', id)} />}
                    {activeTab === 'hmos' && <HmoSection hmos={hmos} onAdd={() => handleOpenModal('hmo')} onEdit={(item) => handleOpenModal('hmo', item)} onDelete={(id) => handleDeleteItem('hmo', id)} />}
                </main>
                {isModalOpen && <ManagementModal type={modalType} item={editingItem} onClose={handleCloseModal} onSave={handleSaveItem} />}
            </div>
        </div>
    );
}

// --- Permissions Section Component ---
function PermissionsSection({ settings, onSave }) {
    const [localSettings, setLocalSettings] = useState(JSON.parse(JSON.stringify(settings)));
    const [activeSubTab, setActiveSubTab] = useState(Object.keys(localSettings)[0] || '');

    const handlePermissionChange = (group, section, role) => {
        const currentRoles = localSettings[group]?.[section] || [];
        const updatedRoles = currentRoles.includes(role)
            ? currentRoles.filter((r) => r !== role)
            : [...currentRoles, role];

        setLocalSettings(prev => ({
            ...prev,
            [group]: { ...prev[group], [section]: updatedRoles }
        }));
    };
    
    const allRoles = ['staff', 'nurse', 'doctor'];
    const formatSectionName = (name) => name.replace(/([A-Z])/g, ' $1').trim();

    const activeGroup = localSettings[activeSubTab];

    return (
        <>
            <div className="settings-content-header">
                <h1>Role Permissions</h1>
                <p>Control which roles can see or perform actions across the EMR. Owners have universal access.</p>
            </div>
            
            <div className="permissions-nav">
                {Object.keys(localSettings).map(group => (
                    <button 
                        key={group} 
                        onClick={() => setActiveSubTab(group)} 
                        className={activeSubTab === group ? 'active' : ''}
                    >
                        {formatSectionName(group)}
                    </button>
                ))}
            </div>

            {activeGroup && (
                <section className="settings-section">
                    <div className="settings-grid">
                        {Object.keys(activeGroup).map((section) => (
                            <div key={section} className="settings-card">
                                <h3>{formatSectionName(section)}</h3>
                                {allRoles.map((role) => (
                                    <div key={role} className="toggle-switch">
                                        <span className="toggle-switch-label">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                                        <label className="switch">
                                            <input type="checkbox" checked={activeGroup[section]?.includes(role) || false} onChange={() => handlePermissionChange(activeSubTab, section, role)} />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <button onClick={() => onSave(localSettings)} className="btn btn-primary" style={{ marginTop: '2rem' }}>Save Permissions</button>
        </>
    );
}

// --- Pricelist Section Component ---
function PricelistSection({ services, onAdd, onEdit, onDelete }) {
    return (
        <>
            <div className="settings-content-header">
                <h1>Pricelist Management</h1>
                <p>Add, edit, or remove services offered at the clinic.</p>
            </div>
            <div className="management-header">
                <h2>All Services ({services.length})</h2>
                <button onClick={onAdd} className="btn btn-primary"><i className="fas fa-plus"></i> Add New Service</button>
            </div>
            <table className="management-table">
                <thead><tr><th>Service Name</th><th>Price (₦)</th><th>Actions</th></tr></thead>
                <tbody>
                    {services.map(service => (
                        <tr key={service.id}>
                            <td>{service.name}</td>
                            <td>{parseFloat(service.price).toLocaleString()}</td>
                            <td className="table-actions">
                                <button onClick={() => onEdit(service)} className="edit-btn" title="Edit"><i className="fas fa-pencil-alt"></i></button>
                                <button onClick={() => onDelete(service.id)} className="delete-btn" title="Delete"><i className="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

// --- HMO Section Component ---
function HmoSection({ hmos, onAdd, onEdit, onDelete }) {
    return (
        <>
            <div className="settings-content-header">
                <h1>HMO Provider Management</h1>
                <p>Manage the list of Health Maintenance Organizations.</p>
            </div>
            <div className="management-header">
                <h2>All HMOs ({hmos.length})</h2>
                <button onClick={onAdd} className="btn btn-primary"><i className="fas fa-plus"></i> Add New HMO</button>
            </div>
            <table className="management-table">
                <thead><tr><th>HMO Name</th><th>Actions</th></tr></thead>
                <tbody>
                    {hmos.map(hmo => (
                        <tr key={hmo.id}>
                            <td>{hmo.name}</td>
                            <td className="table-actions">
                                <button onClick={() => onEdit(hmo)} className="edit-btn" title="Edit"><i className="fas fa-pencil-alt"></i></button>
                                <button onClick={() => onDelete(hmo.id)} className="delete-btn" title="Delete"><i className="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

// --- Reusable Modal Component ---
function ManagementModal({ type, item, onClose, onSave }) {
    const [formData, setFormData] = useState(
        item || (type === 'service' ? { name: '', price: '' } : { name: '' })
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const title = `${item ? 'Edit' : 'Add New'} ${type === 'service' ? 'Service' : 'HMO'}`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{title}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">{type === 'service' ? 'Service Name' : 'HMO Name'}</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    {type === 'service' && (
                        <div className="form-group">
                            <label htmlFor="price">Price (₦)</label>
                            <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" />
                        </div>
                    )}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
