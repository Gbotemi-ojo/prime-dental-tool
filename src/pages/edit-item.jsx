// src/pages/edit-item.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './edit-item.css';
import API_BASE_URL from '../config/api'

export default function EditItem() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currentStock: '',
    unitPrice: '',
    costPerUnit: '',
    reorderLevel: '',
    unitOfMeasure: '',
    supplier: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [settings, setSettings] = useState(null); // State for settings

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('role');
    setUserRole(role);

    if (!token) {
      navigate('/login');
      return;
    }

    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      setError("Invalid Inventory Item ID in URL.");
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [itemResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/inventory/items/${parsedItemId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        // --- Permission Check ---
        if (!settingsResponse.ok) throw new Error("Failed to fetch settings.");
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
        const canEdit = settingsData.inventoryManagement?.canEditItem?.includes(role) || role === 'owner';
        if (!canEdit) {
            toast.error("You don't have permission to edit inventory items.", { toastId: 'edit-item-denied' });
            navigate('/inventory/items'); // Redirect unauthorized users
            return;
        }

        // --- Item Data Fetching ---
        if (itemResponse.ok) {
          const data = await itemResponse.json();
          setFormData({
            name: data.name || '',
            category: data.category || '',
            currentStock: data.currentStock !== undefined ? String(data.currentStock) : '',
            unitPrice: data.unitPrice !== undefined ? String(parseFloat(data.unitPrice).toFixed(2)) : '',
            costPerUnit: data.costPerUnit !== undefined ? String(parseFloat(data.costPerUnit).toFixed(2)) : '',
            reorderLevel: data.reorderLevel !== undefined ? String(data.reorderLevel) : '',
            unitOfMeasure: data.unitOfMeasure || '',
            supplier: data.supplier || '',
            description: data.description || '',
          });
        } else if (itemResponse.status === 404) {
          throw new Error('Inventory item not found.');
        } else {
          throw new Error(`Failed to fetch item details. Status: ${itemResponse.status}`);
        }
      } catch (err) {
        setError(err.message);
        if (String(err.message).includes('401') || String(err.message).includes('403')) {
          toast.error("Session expired. Please log in again.");
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [itemId, navigate]);

  const hasPermission = (permissionKey) => {
    if (userRole === 'owner') return true;
    if (!userRole || !settings || !settings.inventoryManagement) return false;
    return settings.inventoryManagement[permissionKey]?.includes(userRole);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasPermission('canEditItem')) {
      toast.error("You no longer have permission to perform this action.");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    toast.dismiss();

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      navigate('/login');
      return;
    }
    
    // Validation for required fields
    const requiredFields = ['name', 'category', 'currentStock', 'unitPrice', 'unitOfMeasure'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            toast.error(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`);
            setSubmitting(false);
            return;
        }
    }

    try {
      // FIX: Corrected API endpoint URL to include '/api'
      const response = await fetch(`${API_BASE_URL}/api/inventory/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          currentStock: parseInt(formData.currentStock, 10),
          unitPrice: parseFloat(formData.unitPrice),
          costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
          reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel, 10) : null,
          updatedAt: new Date(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Inventory item updated successfully!', {
          onClose: () => navigate(`/inventory/items/${itemId}`),
          autoClose: 2000,
        });
      } else {
        toast.error(data.error || `Failed to update. Status: ${response.status}`);
        if (response.status === 401 || response.status === 403) navigate('/login');
      }
    } catch (err) {
      setError('Network error. Could not connect to the server.');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="app-container">
        <div className="edit-item-container loading-state">
          <p className="info-message">Loading item details...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="edit-item-container error-state">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate(`/inventory/items/${itemId}`)} className="cancel-button">
            <i className="fas fa-arrow-left"></i> Back to Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-item-container">
      <header className="edit-item-header">
        <h1>Edit Inventory Item: {formData.name}</h1>
        <button onClick={() => navigate(`/inventory/items/${itemId}`)} className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Item Details
        </button>
      </header>

      <form onSubmit={handleSubmit} className="edit-item-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Item Name *</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="currentStock">Current Stock *</label>
            <input type="number" id="currentStock" name="currentStock" value={formData.currentStock} onChange={handleChange} required min="0" />
          </div>
          <div className="form-group">
            <label htmlFor="unitPrice">Unit Price (₦) *</label>
            <input type="number" id="unitPrice" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label htmlFor="costPerUnit">Cost Per Unit (₦)</label>
            <input type="number" id="costPerUnit" name="costPerUnit" value={formData.costPerUnit} onChange={handleChange} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label htmlFor="reorderLevel">Reorder Level</label>
            <input type="number" id="reorderLevel" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label htmlFor="unitOfMeasure">Unit of Measure *</label>
            <input type="text" id="unitOfMeasure" name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="supplier">Supplier</label>
            <input type="text" id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} />
          </div>
          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="4"></textarea>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-button" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/inventory/items/${itemId}`)} className="cancel-button" disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
