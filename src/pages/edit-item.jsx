// src/pages/edit-item.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // For sleek notifications
import './edit-item.css'; // Import the dedicated CSS file

// This component allows owners to edit details of an existing inventory item.
export default function EditItem() {
  const { itemId } = useParams(); // Get itemId from the URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currentStock: '', // Matches schema: currentStock
    unitPrice: '',    // Matches schema: unitPrice
    costPerUnit: '',  // Matches schema: costPerUnit
    reorderLevel: '', // Matches schema: reorderLevel
    unitOfMeasure: '',// Matches schema: unitOfMeasure
    supplier: '',     // Matches schema: supplier
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('role');
    setUserRole(role);

    if (!token) {
      console.log("[EditItem] No JWT token found. Redirecting to login.");
      navigate('/login');
      return;
    }

    if (role !== 'owner') {
      console.warn("[EditItem] Unauthorized access: User is not an owner.");
      toast.error("You don't have permission to edit inventory items.");
      navigate('/dashboard'); // Redirect unauthorized users
      return;
    }

    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      setError("Invalid Inventory Item ID provided in the URL.");
      setLoading(false);
      return;
    }

    const fetchItemDetails = async () => {
      try {
        const response = await fetch(`https://prime-dental-tool-backend.vercel.app/api/inventory/items/${parsedItemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure numbers are parsed for form fields that expect them
          setFormData({
            name: data.name || '',
            category: data.category || '',
            currentStock: data.currentStock !== undefined ? String(data.currentStock) : '',
            unitPrice: data.unitPrice !== undefined ? String(parseFloat(data.unitPrice).toFixed(2)) : '', // Ensure two decimal places for display
            costPerUnit: data.costPerUnit !== undefined ? String(parseFloat(data.costPerUnit).toFixed(2)) : '', // Ensure two decimal places for display
            reorderLevel: data.reorderLevel !== undefined ? String(data.reorderLevel) : '',
            unitOfMeasure: data.unitOfMeasure || '',
            supplier: data.supplier || '',
            description: data.description || '',
          });
        } else if (response.status === 401 || response.status === 403) {
          console.error(`[EditItem] Authentication error (${response.status}):`, response.statusText);
          localStorage.clear();
          navigate('/login');
        } else if (response.status === 404) {
          setError('Inventory item not found.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to fetch item details. Status: ${response.status}`);
          console.error('[EditItem] API Error:', response.status, response.statusText, errorData);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server. Please ensure the backend is running.');
        console.error('[EditItem] Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [itemId, navigate]); // Depend on itemId and navigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    toast.dismiss(); // Clear existing toasts

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      navigate('/login');
      setSubmitting(false);
      return;
    }

    // Basic validation
    if (!formData.name || !formData.category || formData.currentStock === '' || formData.unitPrice === '' || formData.unitOfMeasure === '') {
      setError("Name, Category, Current Stock, Unit Price, and Unit of Measure are required.");
      toast.error("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    const parsedCurrentStock = parseInt(formData.currentStock);
    const parsedUnitPrice = parseFloat(formData.unitPrice);
    const parsedCostPerUnit = parseFloat(formData.costPerUnit);
    const parsedReorderLevel = parseInt(formData.reorderLevel);

    if (isNaN(parsedCurrentStock) || parsedCurrentStock < 0) {
      setError('Current Stock must be a non-negative number.');
      toast.error('Current Stock must be a non-negative number.');
      setSubmitting(false);
      return;
    }
    if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
      setError('Unit Price must be a non-negative number.');
      toast.error('Unit Price must be a non-negative number.');
      setSubmitting(false);
      return;
    }
    if (isNaN(parsedCostPerUnit) || parsedCostPerUnit < 0) {
      setError('Cost Per Unit must be a non-negative number.');
      toast.error('Cost Per Unit must be a non-negative number.');
      setSubmitting(false);
      return;
    }
    if (isNaN(parsedReorderLevel) || parsedReorderLevel < 0) {
      setError('Reorder Level must be a non-negative number.');
      toast.error('Reorder Level must be a non-negative number.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`https://prime-dental-tool-backend.vercel.app/inventory/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          currentStock: parsedCurrentStock,
          unitPrice: parsedUnitPrice,
          costPerUnit: parsedCostPerUnit,
          reorderLevel: parsedReorderLevel,
          unitOfMeasure: formData.unitOfMeasure,
          supplier: formData.supplier || null,
          description: formData.description || null,
          updatedAt: new Date(), // Update timestamp on modification
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Inventory item updated successfully!', {
          onClose: () => navigate(`/inventory/items/${itemId}`), // Redirect on toast close
          autoClose: 2000,
        });
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || "Authorization failed. Please log in again.");
        localStorage.clear();
        navigate('/login');
      } else if (response.status === 409) {
        // Conflict, e.g., duplicate name
        setError(data.error || 'Conflict: An item with this name might already exist.');
        toast.error(data.error || 'An inventory item with this name already exists.');
      }
       else {
        setError(data.error || `Failed to update inventory item. Status: ${response.status}`);
        toast.error(data.error || 'Failed to update inventory item.');
      }
    } catch (err) {
      console.error('Error updating inventory item:', err);
      setError('Network error. Could not connect to the server.');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="edit-item-container loading-state">
          <p className="info-message">Loading item details for editing...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !submitting) { // Only show error if not currently submitting
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

  // Prevent rendering form if not owner or item not found
  if (userRole !== 'owner' || !formData.name) {
      return (
        <div className="app-container">
          <div className="edit-item-container info-state">
            <p className="info-message">Access denied or item not found.</p>
            <button onClick={() => navigate('/inventory/items')} className="cancel-button">
              <i className="fas fa-arrow-left"></i> Back to Inventory List
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
          {/* Item Name */}
          <div className="form-group">
            <label htmlFor="name">Item Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Dental Floss"
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="e.g., Consumables"
            />
          </div>

          {/* Current Stock */}
          <div className="form-group">
            <label htmlFor="currentStock">Current Stock *</label>
            <input
              type="number"
              id="currentStock"
              name="currentStock"
              value={formData.currentStock}
              onChange={handleChange}
              required
              min="0"
              placeholder="e.g., 100"
            />
          </div>

          {/* Unit Price */}
          <div className="form-group">
            <label htmlFor="unitPrice">Unit Price (₦) *</label>
            <input
              type="number"
              id="unitPrice"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="e.g., 5.99"
            />
          </div>

          {/* Cost Per Unit */}
          <div className="form-group">
            <label htmlFor="costPerUnit">Cost Per Unit ($)</label>
            <input
              type="number"
              id="costPerUnit"
              name="costPerUnit"
              value={formData.costPerUnit}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g., 3.50"
            />
          </div>

          {/* Reorder Level */}
          <div className="form-group">
            <label htmlFor="reorderLevel">Reorder Level</label>
            <input
              type="number"
              id="reorderLevel"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 10"
            />
          </div>

          {/* Unit of Measure */}
          <div className="form-group">
            <label htmlFor="unitOfMeasure">Unit of Measure *</label>
            <input
              type="text"
              id="unitOfMeasure"
              name="unitOfMeasure"
              value={formData.unitOfMeasure}
              onChange={handleChange}
              required
              placeholder="e.g., pcs, boxes, ml"
            />
          </div>

          {/* Supplier */}
          <div className="form-group">
            <label htmlFor="supplier">Supplier</label>
            <input
              type="text"
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="e.g., ABC Medical Supplies"
            />
          </div>

          {/* Description - full width */}
          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Detailed description of the item."
            ></textarea>
          </div>
        </div> {/* End of form-grid */}

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