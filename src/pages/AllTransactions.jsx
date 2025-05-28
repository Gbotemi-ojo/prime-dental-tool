// src/pages/AllTransactions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AllTransactions.css'; // Create this CSS file for styling

export default function AllTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    // FIX: Changed from 'userRole' to 'role' to match how it's stored in LoginPage
    const userRole = localStorage.getItem('role'); 
    
    if (!token || userRole !== 'owner') { // Restrict access to owners
      toast.error('Access denied. Only Owners can view all transactions.');
      navigate('/login'); // Or navigate to dashboard if logged in but not owner
      return;
    }

    const fetchTransactions = async () => {
      try {
        const response = await fetch('https://prime-dental-tool-backend.vercel.app/api/inventory/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        } else if (response.status === 401 || response.status === 403) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Authentication expired or unauthorized. Please log in.');
          localStorage.clear();
          navigate('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to fetch transactions. Status: ${response.status}`);
          toast.error(errorData.error || 'Failed to fetch transactions.');
          console.error('Error fetching transactions:', errorData);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server.');
        toast.error('Network error. Please try again.');
        console.error('Network error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [navigate]);

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

  if (error) {
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
    <div className="all-transactions-container">
      <header className="all-transactions-header">
        <h1>All Inventory Transactions</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/inventory/transactions/record')}>
            <i className="fas fa-plus"></i> Record New Transaction
          </button>
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
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Transacted By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{new Date(transaction.transactionDate).toLocaleString()}</td>
                  <td>{transaction.itemName} ({transaction.itemUnit})</td>
                  <td className={`transaction-type ${transaction.transactionType.toLowerCase().replace('_', '-')}`}>
                    {transaction.transactionType.replace('_', ' ')}
                  </td>
                  <td className={transaction.quantity > 0 ? 'text-success' : 'text-danger'}>
                    {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                  </td>
                  <td>{transaction.username || 'N/A'}</td>
                  <td>{transaction.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}