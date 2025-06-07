// src/pages/inventory-detail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './inventory-detail.css'; // Import the dedicated CSS file
import API_BASE_URL from '../config/api';

// This component displays the details of a specific inventory item and its transaction history.
export default function InventoryDetail() {
  const { itemId } = useParams(); // Get itemId from the URL
  const navigate = useNavigate();

  const [itemDetails, setItemDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingItem, setLoadingItem] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // State for the "Record Transaction" modal
  const [showRecordTransactionModal, setShowRecordTransactionModal] = useState(false);
  const [transactionFormData, setTransactionFormData] = useState({
    transactionType: 'stock_out', // Default to stock_out
    quantity: '',
    notes: '',
  });
  const [transactionMessage, setTransactionMessage] = useState('');
  const [isTransactionError, setIsTransactionError] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);

  // Fetch item details and transactions
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('role');
    setUserRole(role);

    if (!token) {
      console.log("[InventoryDetail] No JWT token found. Redirecting to login.");
      navigate('/login');
      return;
    }

    // IMPORTANT CHANGE: Restrict access for 'nurse' role
    if (role === 'nurse') {
      console.warn("[InventoryDetail] Unauthorized access: User is a nurse. Redirecting.");
      // Assuming a general dashboard or a patient management page for nurses
      navigate('/patient-management'); // Or '/dashboard'
      return;
    }

    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      setError("Invalid Inventory Item ID provided in the URL.");
      setLoadingItem(false);
      setLoadingTransactions(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const itemResponse = await fetch(`${API_BASE_URL}/api/inventory/items/${parsedItemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          // Ensure unitPrice is parsed as a number
          itemData.unitPrice = parseFloat(itemData.unitPrice);
          setItemDetails(itemData);
        } else if (itemResponse.status === 401 || itemResponse.status === 403) {
          console.error(`[InventoryDetail] Auth error fetching item (${itemResponse.status}):`, itemResponse.statusText);
          localStorage.clear();
          navigate('/login');
          return;
        } else if (itemResponse.status === 404) {
          setError('Inventory item not found.');
        } else {
          const errorData = await itemResponse.json();
          setError(errorData.error || `Failed to fetch item details. Status: ${itemResponse.status}`);
          console.error('[InventoryDetail] API Error fetching item:', itemResponse.status, itemResponse.statusText, errorData);
        }
      } catch (err) {
        setError('Network error fetching item details. Could not connect to the server.');
        console.error('[InventoryDetail] Network Error fetching item:', err);
      } finally {
        setLoadingItem(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        const transactionsResponse = await fetch(`${API_BASE_URL}/api/inventory/items/${parsedItemId}/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData);
        } else if (transactionsResponse.status === 401 || transactionsResponse.status === 403) {
          console.error(`[InventoryDetail] Auth error fetching transactions (${transactionsResponse.status}):`, transactionsResponse.statusText);
          // Don't clear local storage or redirect here as item details might still load.
          // The main item fetch will handle full auth failure.
        } else {
          const errorData = await transactionsResponse.json();
          console.error('[InventoryDetail] API Error fetching transactions:', transactionsResponse.status, transactionsResponse.statusText, errorData);
          // Optionally set a specific error for transactions if needed
        }
      } catch (err) {
        console.error('[InventoryDetail] Network Error fetching transactions:', err);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchDetails();
    fetchTransactions();
  }, [itemId, navigate]); // Depend on itemId and navigate for re-fetch

  // Handle transaction form changes
  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransactionFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle transaction submission
  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    setSubmittingTransaction(true);
    setTransactionMessage('');
    setIsTransactionError(false);

    const token = localStorage.getItem('jwtToken');
    const userId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage

    if (!token || !userId) {
      setTransactionMessage('Authentication required. Please log in again.');
      setIsTransactionError(true);
      setSubmittingTransaction(false);
      localStorage.clear();
      navigate('/login');
      return;
    }

    // Role check for submitting transaction - ONLY OWNER and STAFF
    if (userRole !== 'owner' && userRole !== 'staff') {
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

    // Client-side validation for stock_out specific to current stock
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setTransactionMessage(data.message || 'Transaction recorded successfully!');
        setIsTransactionError(false);
        // Reset form and close modal
        setTransactionFormData({ transactionType: 'stock_out', quantity: '', notes: '' });
        setShowRecordTransactionModal(false);
        // Refresh item details and transactions to show updated stock and history
        const fetchUpdatedData = async () => {
          const currentParsedItemId = parseInt(itemId); // Ensure itemId is re-parsed
          if (isNaN(currentParsedItemId)) {
            console.error("Invalid item ID for refetch after transaction.");
            return;
          }

          // Re-fetch item details
          const itemResponse = await fetch(`${API_BASE_URL}/api/inventory/items/${currentParsedItemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (itemResponse.ok) {
            const itemData = await itemResponse.json();
            itemData.unitPrice = parseFloat(itemData.unitPrice);
            setItemDetails(itemData);
          } else {
            console.error("Failed to re-fetch item details after transaction:", itemResponse.status);
          }

          // Re-fetch transactions
          const transactionsResponse = await fetch(`${API_BASE_URL}/api/inventory/items/${currentParsedItemId}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData);
          } else {
            console.error("Failed to re-fetch transactions after transaction:", transactionsResponse.status);
          }
        };
        fetchUpdatedData();

      } else {
        setTransactionMessage(data.error || 'Failed to record transaction.');
        setIsTransactionError(true);
      }
    } catch (err) {
      console.error('Transaction submission error:', err);
      setTransactionMessage('Network error or server is unreachable.');
      setIsTransactionError(true);
    } finally {
      setSubmittingTransaction(false);
    }
  };

  if (loadingItem || loadingTransactions) {
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
          <a href="/inventory/items" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Inventory List
          </a>
        </div>
      </div>
    );
  }

  // Also handle case where itemDetails might be null after an error or if role restriction prevents it
  // This helps prevent rendering the full component if access was denied or item not found.
  if (!itemDetails || (userRole && userRole === 'nurse')) {
    // If userRole is nurse, the useEffect already redirected.
    // If itemDetails is null, it means item not found, and error message is displayed above.
    return null;
  }

  return (
    <div className="inventory-detail-container">
      <header className="detail-header">
        <h1>{itemDetails.name}</h1>
        <div className="actions">
          <a href="/inventory/items" className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Inventory
          </a>
          {/* Record Transaction button: Only for 'owner' and 'staff' */}
          {(userRole === 'owner' || userRole === 'staff') && (
            <button onClick={() => setShowRecordTransactionModal(true)} className="record-transaction-button">
              <i className="fas fa-exchange-alt"></i> Record Transaction
            </button>
          )}
          {/* Edit Item button: Only for 'owner' */}
          {userRole === 'owner' && (
            <a href={`/inventory/items/${itemDetails.id}/edit`} className="edit-button">
              <i className="fas fa-edit"></i> Edit Item
            </a>
          )}
        </div>
      </header>

      <section className="detail-section">
        <h2>Item Information</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Category:</strong> <span>{itemDetails.category}</span>
          </div>
          <div className="detail-item">
            <strong>Current Stock:</strong>{' '}
            <span className={itemDetails.currentStock <= itemDetails.reorderLevel ? 'stock-low' : 'stock-ok'}>
              {itemDetails.currentStock} {itemDetails.unitOfMeasure}
            </span>
          </div>
          <div className="detail-item">
            <strong>Unit Price:</strong> <span>₦{itemDetails.unitPrice ? itemDetails.unitPrice.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Reorder Level:</strong> <span>{itemDetails.reorderLevel} {itemDetails.unitOfMeasure}</span>
          </div>
          <div className="detail-item">
            <strong>Cost Per Unit:</strong> <span>₦{itemDetails.costPerUnit ? parseFloat(itemDetails.costPerUnit).toFixed(2) : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Supplier:</strong> <span>{itemDetails.supplier || 'N/A'}</span>
          </div>
          <div className="detail-item full-width-detail-item">
            <strong>Description:</strong> <span>{itemDetails.description || 'No description provided.'}</span>
          </div>
          <div className="detail-item">
            <strong>Added On:</strong> <span>{itemDetails.createdAt ? new Date(itemDetails.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Last Updated:</strong> <span>{itemDetails.updatedAt ? new Date(itemDetails.updatedAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <strong>Last Restocked:</strong> <span>{itemDetails.lastRestockedAt ? new Date(itemDetails.lastRestockedAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h2>Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="info-message">No transactions recorded for this item yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                    <td className={`transaction-type-${transaction.transactionType.replace('_', '-')}`}>
                      {transaction.transactionType.replace('_', ' ')}
                    </td>
                    <td className={transaction.quantity < 0 ? 'quantity-out' : 'quantity-in'}>
                      {transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity} {itemDetails.unitOfMeasure}
                    </td>
                    <td>{transaction.username || 'N/A'}</td>
                    <td>{transaction.notes || 'No notes'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Record Transaction Modal (only rendered if showRecordTransactionModal is true) */}
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
                <select
                  id="transactionType"
                  name="transactionType"
                  value={transactionFormData.transactionType}
                  onChange={handleTransactionChange}
                  required
                  // Only 'owner' and 'staff' can change transaction type.
                  // 'nurse' will not even see this modal due to the outer check, but if they did,
                  // this ensures they cannot select other types.
                  disabled={userRole === 'nurse'} // This line is technically redundant due to outer check, but good for robustness
                >
                  {/* Options available only if user is 'owner' or 'staff' */}
                  { (userRole === 'owner' || userRole === 'staff') && (
                      <>
                        <option value="stock_out">Stock Out</option>
                        <option value="stock_in">Stock In</option>
                        <option value="adjustment">Adjustment</option>
                      </>
                  )}
                  {/* Fallback for nurse, though they shouldn't reach here */}
                  { userRole === 'nurse' && (
                    <option value="stock_out">Stock Out</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={transactionFormData.quantity}
                  onChange={handleTransactionChange}
                  required
                  min="1" // Quantity must be at least 1 for any transaction
                  placeholder="e.g., 5"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={transactionFormData.notes}
                  onChange={handleTransactionChange}
                  placeholder="e.g., Used for patient X, Restocked from supplier Y"
                ></textarea>
              </div>

              {transactionMessage && (
                <div className={`message ${isTransactionError ? 'error' : 'success'}`}>
                  {transactionMessage}
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" disabled={submittingTransaction}>
                  {submittingTransaction ? 'Recording...' : 'Record Transaction'}
                </button>
                <button type="button" className="cancel-button" onClick={() => setShowRecordTransactionModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
