import React, { useState } from 'react';
import './login-page.css'; // Import the CSS file
import API_BASE_URL from '../config/api';

// Main App component to render the LoginPage
// In a real application, you would integrate this into your routing.
export default function App() {
  return (
    <div className="app-container">
      <LoginPage />
    </div>
  );
}

function LoginPage() {
  // State to hold form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // State for form submission status and messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    // Basic client-side validation
    if (!formData.username || !formData.password) {
      setMessage('Please enter both username/email and password.');
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Login successful! Redirecting...');
        setIsError(false);

        console.log('Login successful:', data);

        // Save the JWT token to localStorage
        const token = data.token || data.accessToken; // Check both common property names
        if (token) {
          localStorage.setItem('jwtToken', token);
        }

        // IMPORTANT: Save user role, ID, and username
        // Prioritize data directly from the response body, then try from a nested 'user' object
        const userRole = data.role || (data.user && data.user.role);
        const userId = data.userId || (data.user && data.user.id);
        const username = data.username || (data.user && data.user.username);

        if (userRole) {
          localStorage.setItem('role', userRole);
        }
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        if (username) {
          localStorage.setItem('username', username);
        }

        // --- UPDATED: Conditional Redirection based on Role ---
        // Nurses should now go to the dashboard, just like owners and staff.
        window.location.href = '/dashboard';
        // --- END of UPDATED ---

      } else {
        setMessage(data.error || 'Login failed. Please check your credentials.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Network error or server is unreachable. Please try again later.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Staff & Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username / Email</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Your username or email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Your password"
          />
        </div>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </div>
      </form>

      <div className="back-link">
        <a href="/">Back to Patient Form</a>
      </div>
    </div>
  );
}
