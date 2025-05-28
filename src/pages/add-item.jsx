// src/pages/add-item.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './add-item.css'; // Import the dedicated CSS file

// This component provides a form to add a new inventory item.
export default function AddItem() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    // sku: '', // Removed SKU from form data state
    category: '',
    quantity: '',
    unitPrice: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Categories for the dropdown (you can expand this list)
  const categories = [
    'Dental Instruments',
    'Dental Materials',
    'Pharmaceuticals',
    'Office Supplies',
    'Protective Gear',
    'Cleaning Supplies',
    'Other'
  ];

  useEffect(() => {
    // Check for authentication token on component mount
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.log("[AddItem] No JWT token found. Redirecting to login.");
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [navigate]);

  // Handles changes to form input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setIsError(false);

    // Client-side validation - 'sku' is removed from this check
    if (!formData.name || !formData.category || formData.quantity === '' || formData.unitPrice === '') {
      setMessage('Please fill in all required fields (Name, Category, Quantity, Unit Price).');
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
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
      };

      const response = await fetch('https://prime-dental-tool-backend.vercel.app/api/inventory/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Inventory item added successfully!');
        setIsError(false);
        setFormData({
          name: '',
          // sku: '', // Removed SKU from form reset
          category: '',
          quantity: '',
          unitPrice: '',
          description: '',
        });
        setTimeout(() => {
          navigate('/inventory/items');
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to add inventory item. Please check the details.');
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
        <div className="add-item-container loading-state">
          <p className="info-message">Checking authentication...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-item-container">
      <header className="form-header">
        <h1>Add New Inventory Item</h1>
        <div className="actions">
          <a href="/inventory/items" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Inventory List
          </a>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>Item Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Item Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Dental Mirror"
              />
            </div>
            {/* Removed the SKU form group entirely */}
            {/*
            <div className="form-group">
              <label htmlFor="sku">SKU (Stock Keeping Unit) *</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                placeholder="e.g., DM-001"
              />
            </div>
            */}
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                placeholder="e.g., 100"
              />
            </div>
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
                step="100"
                placeholder="e.g., 5000"
              />
            </div>
            <div className="form-group full-width-grid-item">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the item, its uses, etc."
              ></textarea>
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
            {submitting ? 'Adding Item...' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
