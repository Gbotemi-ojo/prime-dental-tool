// src/pages/inventory-list.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './inventory-list.css';
import API_BASE_URL from '../config/api';
import { toast } from 'react-toastify';

export default function InventoryList() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [settings, setSettings] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role);

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const settingsResponse = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!settingsResponse.ok) throw new Error("Failed to fetch settings.");
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
        const canViewPage = settingsData.dashboard?.canSeeInventoryManagement?.includes(role) || role === 'owner';
        if (!canViewPage) {
            toast.error("Access denied. You don't have permission to view inventory.", { toastId: 'inventory-access-denied' });
            navigate('/dashboard');
            return;
        }

        const itemsResponse = await fetch(`${API_BASE_URL}/api/inventory/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (itemsResponse.ok) {
          const data = await itemsResponse.json();
          const processedItems = data.map(item => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice)
          }));
          setInventoryItems(processedItems);
        } else {
            throw new Error(`Failed to fetch inventory items. Status: ${itemsResponse.status}`);
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

    fetchInventoryData();
  }, [navigate]);

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

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !settings) {
    return (
      <div className="app-container">
        <div className="inventory-list-container loading-state">
          <p className="info-message">Loading...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="inventory-list-container error-state">
          <p className="info-message error">Error: {error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-list-container">
      <header className="inventory-list-header">
        <h1>Inventory Management</h1>
        <div className="actions">
          <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
          {hasPermission('canAddItem') && (
            <button onClick={() => navigate('/inventory/items/new')} className="add-item-button">
              <i className="fas fa-plus-circle"></i> Add New Item
            </button>
          )}
        </div>
      </header>

      <section className="search-filter-section">
        <input
          type="text"
          placeholder="Search items by name or category..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>

      {filteredItems.length === 0 ? (
        <p className="info-message">No inventory items found. Try adjusting your search or add a new item.</p>
      ) : (
        <div className="inventory-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="inventory-card" onClick={() => navigate(`/inventory/items/${item.id}`)}>
              <div className="card-header">
                <h3>{item.name}</h3>
                <span className={`status-badge ${item.currentStock > item.reorderLevel ? 'in-stock' : 'low-stock'}`}>
                  {item.currentStock > item.reorderLevel ? 'In Stock' : 'Low Stock'}
                </span>
              </div>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Quantity:</strong> {item.currentStock}</p>
              <p><strong>Unit Price:</strong> ₦{item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice.toFixed(2) : 'N/A'}</p>
              <p><strong>Last Updated:</strong> {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</p>
              <div className="card-actions">
                <span className="view-details-button">
                  View Details <i className="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
