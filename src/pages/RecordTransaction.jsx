// src/pages/RecordTransaction.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './RecordTransaction.css'; // Create this CSS file for styling
import API_BASE_URL from '../config/api'

export default function RecordTransaction() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    itemId: '',
    transactionType: '', // 'stock_in', 'stock_out', 'adjustment'
    quantity: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null); // Used for both fetch errors and form submission errors
  const [userRole, setUserRole] = useState(null); // Added to store user role

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('role'); // Get the user's role from local storage
    setUserRole(role); // Store the role in state

    if (!token) {
      toast.error('Authentication required. Please log in.');
      navigate('/login');
      return;
    }

    // --- Role-based Access Control ---
    // Only 'owner' and 'staff' roles are allowed to access this page.
    if (role !== 'owner' && role !== 'staff') {
      toast.error('Access denied. Only Staff and Owners can record inventory transactions.');
      navigate('/dashboard'); // Redirect to dashboard or another appropriate page
      return;
    }
    // --- End Role-based Access Control ---


    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load inventory items.');
          toast.error(errorData.error || 'Failed to load inventory items.');
          console.error('Error fetching items:', errorData);
        }
      } catch (err) {
        setError('Network error: Could not fetch inventory items.');
        toast.error('Network error. Please try again.');
        console.error('Network error fetching items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [navigate]); // navigate is a dependency

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear item ID if transaction type changes and it's not applicable (though here it always is)
    // No change needed here, as the logic is already sound for clearing itemId if type changes.
    if (name === 'transactionType' && value === '') {
        setFormData(prevData => ({ ...prevData, itemId: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear previous errors on new submission attempt
    toast.dismiss(); // Dismiss any lingering toasts

    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error('Authentication required. Please log in.');
      navigate('/login');
      setSubmitting(false);
      return;
    }

    // Client-side validation
    const parsedQuantity = parseInt(formData.quantity);

    if (!formData.itemId || !formData.transactionType || formData.quantity === '') {
      setError('Please fill all required fields.');
      toast.error('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    if (isNaN(parsedQuantity)) {
      setError('Quantity must be a valid number.');
      toast.error('Quantity must be a valid number.');
      setSubmitting(false);
      return;
    }
    // For 'adjustment', quantity can be negative, so we only enforce positive for others.
    if (formData.transactionType !== 'adjustment' && parsedQuantity <= 0) {
      setError(`Quantity must be positive for '${formData.transactionType}' transaction.`);
      toast.error(`Quantity must be positive for '${formData.transactionType}' transaction.`);
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        itemId: parseInt(formData.itemId),
        transactionType: formData.transactionType,
        quantity: parsedQuantity,
        notes: formData.notes,
      };

      const response = await fetch(`${API_BASE_URL}/api/inventory/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Transaction recorded successfully!');
        setFormData({
          itemId: '',
          transactionType: '',
          quantity: '',
          notes: '',
        }); // Reset form
        navigate('/inventory/transactions'); // Redirect to all transactions list
      } else if (response.status === 401 || response.status === 403) {
        toast.error(data.error || 'Authorization failed. Please log in again.');
        localStorage.clear();
        navigate('/login');
      } else {
        // Display specific backend error message
        setError(data.error || 'Failed to record transaction.');
        toast.error(data.error || 'Failed to record transaction.');
      }
    } catch (err) {
      console.error('Error recording transaction:', err);
      setError('Network error. Could not connect to the server.');
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render logic for loading and initial errors (before form interaction)
  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error during the initial fetch and we're not submitting
  if (error && !submitting && !formData.itemId) { // Check !formData.itemId to distinguish initial load error from submission error
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="record-transaction-container">
      <header className="record-transaction-header">
        <h1>Record Inventory Transaction</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </header>

      <form onSubmit={handleSubmit} className="record-transaction-form">
        {/* Display form-specific errors here */}
        {error && submitting && ( // Only show error here if it's a submission error
          <div className="alert alert-danger mb-3" role="alert">
            {error}
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="itemId" className="form-label">Inventory Item *</label>
          <select
            className="form-select"
            id="itemId"
            name="itemId"
            value={formData.itemId}
            onChange={handleChange}
            required
            disabled={submitting}
          >
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.currentStock} {item.unitOfMeasure} available)
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="transactionType" className="form-label">Transaction Type *</label>
          <select
            className="form-select"
            id="transactionType"
            name="transactionType"
            value={formData.transactionType}
            onChange={handleChange}
            required
            disabled={submitting}
          >
            <option value="">Select type</option>
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="quantity" className="form-label">Quantity *</label>
          <input
            type="number"
            className="form-control"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min={formData.transactionType === 'stock_in' || formData.transactionType === 'stock_out' ? "1" : undefined}
            disabled={submitting}
          />
          {formData.transactionType === 'adjustment' && (
            <div className="form-text">For 'Adjustment', quantity can be positive (add) or negative (subtract).</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="notes" className="form-label">Notes (Optional)</label>
          <textarea
            className="form-control"
            id="notes"
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            disabled={submitting}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting ? 'Recording...' : 'Record Transaction'}
        </button>
      </form>
    </div>
  );
}