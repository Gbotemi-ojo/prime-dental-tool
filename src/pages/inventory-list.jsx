// src/pages/inventory-list.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './inventory-list.css'; // Import the dedicated CSS file
import API_BASE_URL from '../config/api';

// This component displays a list of inventory items.
export default function InventoryList() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState(null); // To determine access for 'Add Item'

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventoryItems = async () => {
      const token = localStorage.getItem('jwtToken');
      const role = localStorage.getItem('role');
      setUserRole(role); // Set user role from local storage

      if (!token) {
        console.log("[InventoryList] No JWT token found. Redirecting to login.");
        navigate('/login');
        return;
      }

      // IMPORTANT CHANGE: Redirect 'nurse' role away from this page
      if (role === 'nurse') {
        console.warn("[InventoryList] Unauthorized access: User is a nurse. Redirecting to patient management.");
        navigate('/patient-management'); // Redirect nurses to patient management
        return; // Stop further execution of this useEffect
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/inventory/items`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Parse unitPrice to a number when fetching data
          const processedItems = data.map(item => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice) // Ensure unitPrice is a number
          }));
          setInventoryItems(processedItems);
        } else if (response.status === 401 || response.status === 403) {
          console.error(`[InventoryList] Authentication error (${response.status}):`, response.statusText);
          localStorage.clear();
          navigate('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to fetch inventory items. Status: ${response.status}`);
          console.error('[InventoryList] API Error:', response.status, response.statusText, errorData);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server. Please ensure the backend is running.');
        console.error('[InventoryList] Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItems();
  }, [navigate]); // Add navigate to dependency array

  // Filter items based on search term (removed SKU from filter)
  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
    // item.sku.toLowerCase().includes(searchTerm.toLowerCase()) // Removed SKU from search
  );

  // If userRole is nurse, prevent rendering the component.
  // The useEffect above will handle the redirection.
  if (userRole === 'nurse') {
    return null;
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="inventory-list-container loading-state">
          <p className="info-message">Loading inventory data...</p>
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
          <a href="/dashboard" className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-list-container">
      <header className="inventory-list-header">
        <h1>Inventory Management</h1>
        <div className="actions">
          <a href="/dashboard" className="back-to-dashboard-button">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </a>
          {/* Only show 'Add New Item' if user is owner or staff */}
          {(userRole === 'owner' || userRole === 'staff') && (
            <a href="/inventory/items/new" className="add-item-button">
              <i className="fas fa-plus-circle"></i> Add New Item
            </a>
          )}
        </div>
      </header>

      <section className="search-filter-section">
        <input
          type="text"
          placeholder="Search items by name or category..." // Updated placeholder
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
            <div key={item.id} className="inventory-card">
              <div className="card-header">
                <h3>{item.name}</h3>
                {/* Assuming 'currentStock' is the correct property for quantity */}
                <span className={`status-badge ${item.currentStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {item.currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              {/* Removed SKU display */}
              {/* <p><strong>SKU:</strong> {item.sku}</p> */}
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Quantity:</strong> {item.currentStock}</p> {/* Display currentStock */}
              {/* unitPrice is now guaranteed to be a number after parseFloat */}
              <p><strong>Unit Price:</strong> ₦{item.unitPrice !== null && item.unitPrice !== undefined ? item.unitPrice.toFixed(2) : 'N/A'}</p>
              <p><strong>Last Updated:</strong> {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</p>
              <div className="card-actions">
                <a href={`/inventory/items/${item.id}`} className="view-details-button">
                  View Details <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
