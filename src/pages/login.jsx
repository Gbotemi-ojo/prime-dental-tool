import React, { useState } from 'react';
import './login-page.css'; // Import the CSS file

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
      // Replace 'http://localhost:5000' with your actual backend URL
      const response = await fetch('http://localhost:5000/api/auth/login', {
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

        // --- START OF CRITICAL FIX: Ensure role and other user data are saved ---
        // Save the JWT token to localStorage with the key 'jwtToken'
        if (data.token) { // Assuming your backend sends the token in 'data.token'
          localStorage.setItem('jwtToken', data.token);
        } else if (data.accessToken) { // If your backend sends it in 'data.accessToken'
          localStorage.setItem('jwtToken', data.accessToken);
        }
        
        // IMPORTANT: Save user role, ID, and username separately if your backend provides them directly
        // Your JWT payload shows 'role', 'userId', and 'username' (if you decode the token)
        // However, your backend's /api/auth/login response might also send these directly as top-level properties
        // or nested under a 'user' object. Adjust 'data.role', 'data.user.role' etc. as per your backend's actual response structure.
        if (data.role) { // If role is directly in the response
          localStorage.setItem('role', data.role);
        } else if (data.user && data.user.role) { // If role is nested under 'user'
          localStorage.setItem('role', data.user.role);
        }

        if (data.userId) { // If userId is directly in the response
            localStorage.setItem('userId', data.userId);
        } else if (data.user && data.user.id) { // If userId is nested under 'user'
            localStorage.setItem('userId', data.user.id);
        }

        if (data.username) { // If username is directly in the response
            localStorage.setItem('username', data.username);
        } else if (data.user && data.user.username) { // If username is nested under 'user'
            localStorage.setItem('username', data.user.username);
        }
        // --- END OF CRITICAL FIX ---

        // Redirect to the dashboard upon successful login
        window.location.href = '/dashboard'; 
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
