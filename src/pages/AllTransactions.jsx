// src/pages/AllTransactions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AllTransactions.css';
import API_BASE_URL from '../config/api'

export default function AllTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role'); 
      setUserRole(role);
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const settingsResponse = await fetch(`${API_BASE_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } });

        if (!settingsResponse.ok) throw new Error("Failed to fetch settings.");
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
        const canViewPage = settingsData.dashboard?.canSeeAllInventoryTransactions?.includes(role) || role === 'owner';
        if (!canViewPage) {
            toast.error('Access denied. You do not have permission to view all transactions.', { toastId: 'transactions-access-denied' });
            navigate('/dashboard');
            return;
        }

        const transactionsResponse = await fetch(`${API_BASE_URL}/api/inventory/transactions`, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (transactionsResponse.ok) {
          const data = await transactionsResponse.json();
          setTransactions(data);
        } else {
            throw new Error(`Failed to fetch transactions. Status: ${transactionsResponse.status}`);
        }
      } catch (err) {
        setError(err.message || 'Network error. Could not connect to the server.');
        if (String(err.message).includes('401') || String(err.message).includes('403')) {
            toast.error("Your session has expired. Please log in again.");
            localStorage.clear();
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [navigate]);

  const hasPermission = (permissionKey) => {
    if (userRole === 'owner') {
      return true;
    }
    if (!userRole || !settings || !settings.inventoryManagement) {
      return false;
    }
    return settings.inventoryManagement[permissionKey]?.includes(userRole);
  };

  /**
   * FIX: This function now explains the workflow to the user before navigating.
   * A transaction requires an item, so we send the user to the item list to select one.
   */
  const handleRecordTransactionClick = () => {
    toast.info("Please select an item from the list to record a transaction for.", {
        position: "top-center",
        autoClose: 3500, // Message stays for 3.5 seconds
    });
    navigate('/inventory/items');
  };

  if (loading || !settings) {
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

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="all-transactions-container">
      <header className="all-transactions-header">
        <h1>All Inventory Transactions</h1>
        <div className="header-actions">
          {hasPermission('canRecordTransaction') && (
            <button className="btn btn-primary" onClick={handleRecordTransactionClick}>
              <i className="fas fa-plus"></i> Record New Transaction
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </header>

      {transactions.length === 0 ? (
        <p className="no-transactions-message">No inventory transactions found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover all-transactions-table">
            <thead>
              <tr><th>ID</th><th>Date</th><th>Item</th><th>Type</th><th>Quantity</th><th>Transacted By</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="ID">{transaction.id}</td>
                  <td data-label="Date">{new Date(transaction.transactionDate).toLocaleString()}</td>
                  <td data-label="Item">{transaction.itemName} ({transaction.itemUnit})</td>
                  <td data-label="Type" className={`transaction-type ${transaction.transactionType.toLowerCase().replace('_', '-')}`}>{transaction.transactionType.replace('_', ' ')}</td>
                  <td data-label="Quantity" className={transaction.quantity > 0 ? 'text-success' : 'text-danger'}>{transaction.quantity > 0 ? '+' : ''}{transaction.quantity}</td>
                  <td data-label="Transacted By">{transaction.username || 'N/A'}</td>
                  <td data-label="Notes">{transaction.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
