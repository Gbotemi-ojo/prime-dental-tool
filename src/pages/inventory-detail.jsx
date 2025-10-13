// src/pages/inventory-detail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './inventory-detail.css';
import API_BASE_URL from '../config/api';

export default function InventoryDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [itemDetails, setItemDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [settings, setSettings] = useState(null);

  const [showRecordTransactionModal, setShowRecordTransactionModal] = useState(false);
  const [transactionFormData, setTransactionFormData] = useState({
    transactionType: 'stock_out',
    quantity: '',
    notes: '',
  });
  const [transactionMessage, setTransactionMessage] = useState('');
  const [isTransactionError, setIsTransactionError] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);

  useEffect(() => {
    const fetchItemData = async () => {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);

      if (!token) {
        navigate('/login');
        return;
      }

      const parsedItemId = parseInt(itemId);
      if (isNaN(parsedItemId)) {
        setError("Invalid Inventory Item ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        const [itemResponse, transactionsResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/inventory/items/${parsedItemId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/inventory/items/${parsedItemId}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (!settingsResponse.ok) throw new Error("Failed to fetch settings.");
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
        const canViewPage = settingsData.dashboard?.canSeeInventoryManagement?.includes(role) || role === 'owner';
        if (!canViewPage) {
            setError("You do not have permission to view this page.");
            navigate('/dashboard');
            return;
        }

        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          itemData.unitPrice = parseFloat(itemData.unitPrice);
          setItemDetails(itemData);
        } else if (itemResponse.status === 404) {
          throw new Error('Inventory item not found.');
        } else {
          throw new Error('Failed to fetch item details.');
        }

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData);
        } else {
          console.warn("Could not fetch item transactions.");
        }
      } catch (err) {
        setError(err.message || 'Network error. Could not connect to the server.');
        if (err.message?.includes('401') || err.message?.includes('403')) {
            localStorage.clear();
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemData();
  }, [itemId, navigate]);

  const hasPermission = (permissionKey) => {
    // FIX: The owner role check must come first to grant universal access.
    if (userRole === 'owner') {
      return true;
    }
    // For other roles, we can then safely check the settings structure.
    if (!userRole || !settings || !settings.inventoryManagement) {
      return false;
    }
    return settings.inventoryManagement[permissionKey]?.includes(userRole);
  };
  
  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransactionFormData((prevData) => ({ ...prevData, [name]: value, }));
  };

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    setSubmittingTransaction(true);
    setTransactionMessage('');
    setIsTransactionError(false);

    const token = localStorage.getItem('jwtToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      setTransactionMessage('Authentication required. Please log in again.');
      setIsTransactionError(true);
      setSubmittingTransaction(false);
      return;
    }
    
    if (!hasPermission('canRecordTransaction')) {
      setTransactionMessage('You do not have permission to record transactions.');
      setIsTransactionError(true);
      setSubmittingTransaction(false);
      return;
    }

    if (!transactionFormData.quantity || isNaN(parseInt(transactionFormData.quantity)) || parseInt(transactionFormData.quantity) <= 0) {
      setTransactionMessage('Please enter a valid positive quantity.');
      setIsTransactionError(true);
      setSubmittingTransaction(false);
      return;
    }

    if (transactionFormData.transactionType === 'stock_out' && parseInt(transactionFormData.quantity) > itemDetails.currentStock) {
      setTransactionMessage(`Insufficient stock. Only ${itemDetails.currentStock} ${itemDetails.unitOfMeasure} available.`);
      setIsTransactionError(true);
      setSubmittingTransaction(false);
      return;
    }

    try {
      const payload = {
        itemId: parseInt(itemId),
        userId: parseInt(userId),
        transactionType: transactionFormData.transactionType,
        quantity: parseInt(transactionFormData.quantity),
        notes: transactionFormData.notes,
      };

      const response = await fetch(`${API_BASE_URL}/api/inventory/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setTransactionMessage(data.message || 'Transaction recorded successfully!');
        setIsTransactionError(false);
        setTimeout(() => {
          setShowRecordTransactionModal(false);
          setItemDetails(prev => ({...prev, currentStock: data.newStockLevel}));
          setTransactions(prev => [data.transaction, ...prev].sort((a,b) => new Date(b.transactionDate) - new Date(a.transactionDate)));
          navigate(0);
        }, 1500);

      } else {
        setTransactionMessage(data.error || 'Failed to record transaction.');
        setIsTransactionError(true);
      }
    } catch (err) {
      setTransactionMessage('Network error or server is unreachable.');
      setIsTransactionError(true);
    } finally {
      setSubmittingTransaction(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="app-container">
        <div className="inventory-detail-container loading-state">
          <p className="info-message">Loading inventory item details...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="inventory-detail-container error-state">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate('/inventory/items')} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Inventory List
          </button>
        </div>
      </div>
    );
  }
  
  if (!itemDetails) return null;

  return (
    <div className="inventory-detail-container">
      <header className="detail-header">
        <h1>{itemDetails.name}</h1>
        <div className="actions">
          <button onClick={() => navigate('/inventory/items')} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Inventory
          </button>
          {hasPermission('canRecordTransaction') && (
            <button onClick={() => setShowRecordTransactionModal(true)} className="record-transaction-button">
              <i className="fas fa-exchange-alt"></i> Record Transaction
            </button>
          )}
          {hasPermission('canEditItem') && (
            <button onClick={() => navigate(`/inventory/items/${itemDetails.id}/edit`)} className="edit-button">
              <i className="fas fa-edit"></i> Edit Item
            </button>
          )}
        </div>
      </header>

      <section className="detail-section">
        <h2>Item Information</h2>
        <div className="detail-grid">
          <div className="detail-item"><strong>Category:</strong> <span>{itemDetails.category}</span></div>
          <div className="detail-item"><strong>Current Stock:</strong>{' '}<span className={itemDetails.currentStock <= itemDetails.reorderLevel ? 'stock-low' : 'stock-ok'}>{itemDetails.currentStock} {itemDetails.unitOfMeasure}</span></div>
          <div className="detail-item"><strong>Unit Price:</strong> <span>₦{itemDetails.unitPrice ? itemDetails.unitPrice.toFixed(2) : 'N/A'}</span></div>
          <div className="detail-item"><strong>Reorder Level:</strong> <span>{itemDetails.reorderLevel} {itemDetails.unitOfMeasure}</span></div>
          <div className="detail-item"><strong>Cost Per Unit:</strong> <span>₦{itemDetails.costPerUnit ? parseFloat(itemDetails.costPerUnit).toFixed(2) : 'N/A'}</span></div>
          <div className="detail-item"><strong>Supplier:</strong> <span>{itemDetails.supplier || 'N/A'}</span></div>
          <div className="detail-item full-width-detail-item"><strong>Description:</strong> <span>{itemDetails.description || 'No description provided.'}</span></div>
          <div className="detail-item"><strong>Added On:</strong> <span>{itemDetails.createdAt ? new Date(itemDetails.createdAt).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><strong>Last Updated:</strong> <span>{itemDetails.updatedAt ? new Date(itemDetails.updatedAt).toLocaleDateString() : 'N/A'}</span></div>
          <div className="detail-item"><strong>Last Restocked:</strong> <span>{itemDetails.lastRestockedAt ? new Date(itemDetails.lastRestockedAt).toLocaleDateString() : 'N/A'}</span></div>
        </div>
      </section>

      <section className="detail-section">
        <h2>Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="info-message">No transactions recorded for this item yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead><tr><th>Date</th><th>Type</th><th>Quantity</th><th>Recorded By</th><th>Notes</th></tr></thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                    <td className={`transaction-type-${transaction.transactionType.replace('_', '-')}`}>{transaction.transactionType.replace('_', ' ')}</td>
                    <td className={transaction.quantity < 0 ? 'quantity-out' : 'quantity-in'}>{transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity} {itemDetails.unitOfMeasure}</td>
                    <td>{transaction.username || 'N/A'}</td>
                    <td>{transaction.notes || 'No notes'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showRecordTransactionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Record New Transaction</h2>
              <button className="close-button" onClick={() => setShowRecordTransactionModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRecordTransaction} className="transaction-form">
              <div className="form-group">
                <label htmlFor="transactionType">Transaction Type *</label>
                <select id="transactionType" name="transactionType" value={transactionFormData.transactionType} onChange={handleTransactionChange} required>
                    <option value="stock_out">Stock Out</option>
                    <option value="stock_in">Stock In</option>
                    <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input type="number" id="quantity" name="quantity" value={transactionFormData.quantity} onChange={handleTransactionChange} required min="1" placeholder="e.g., 5" />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" value={transactionFormData.notes} onChange={handleTransactionChange} placeholder="e.g., Used for patient X, Restocked from supplier Y" ></textarea>
              </div>

              {transactionMessage && (<div className={`message ${isTransactionError ? 'error' : 'success'}`}>{transactionMessage}</div>)}

              <div className="modal-actions">
                <button type="submit" disabled={submittingTransaction}>{submittingTransaction ? 'Recording...' : 'Record Transaction'}</button>
                <button type="button" className="cancel-button" onClick={() => setShowRecordTransactionModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
