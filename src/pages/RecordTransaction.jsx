// src/pages/RecordTransaction.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './RecordTransaction.css'; // Create this CSS file for styling

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
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      toast.error('Authentication required. Please log in.');
      navigate('/login');
      return;
    }

    const fetchItems = async () => {
      try {
        const response = await fetch('https://prime-dental-tool-backend.vercel.app/api/inventory/items', {
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
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear item ID if transaction type changes and it's not applicable (though here it always is)
    if (name === 'transactionType' && value === '') {
        setFormData(prevData => ({ ...prevData, itemId: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    toast.dismiss();

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

      const response = await fetch('https://prime-dental-tool-backend.vercel.app/api/inventory/transactions', {
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

  if (error && !submitting) {
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
            min={formData.transactionType !== 'adjustment' ? "1" : undefined} // Only positive for stock_in/out
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