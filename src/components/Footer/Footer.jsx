import React, { useState } from "react";
import "./style.css";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

const Footer = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubscribe = async () => {
    if (!email) {
      setMessage('Please enter an email address.');
      setMessageType('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    const apiUrl = 'https://novacrest-backend.vercel.app/subscriptions';

    const authToken = 'YOUR_AUTH_TOKEN';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ email: email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Subscription successful!');
        setMessageType('success');
        setEmail('');
      } else {
        setMessage(data.error || 'Subscription failed.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Subscription API error:', error);
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer>
      <Container>
        <Row className="footer-row">
          <Col md={3} sm={5} className="box">
            <div className="logo">
              <ion-icon name="medkit"></ion-icon>
              <h1>NOVACREST PHARMACY</h1>
            </div>
            <p>
              Your trusted source for genuine medications, health products, and
              expert pharmaceutical care. We prioritize your well-being with
              every prescription filled.
            </p>
          </Col>
          <Col md={3} sm={5} className="box">
            <h2>About Us</h2>
            <ul>
              <li>
                <Link to="/shop">Our Products</Link>
              </li>
              <li>
                <Link to="/bloglist">Health Blog</Link>
              </li>
              <li>
                <Link to="/terms">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </Col>
          <Col md={3} sm={5} className="box">
            <h2>Subscribe to our Newsletter</h2>
            <div className="subscribe-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
              />
              <button onClick={handleSubscribe} disabled={loading}>
                {loading ? (
                  <div style={{
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3498db',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }}></div>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
            {message && (
              <p style={{
                marginTop: '10px',
                fontSize: '0.9em',
                color: messageType === 'success' ? 'green' : 'white',
              }}>
                {message}
              </p>
            )}
          </Col>
          <Col md={3} sm={5} className="box">
            <h2>Contact Us</h2>
            <ul>
              <li>
                Shop 4 Yummy Yummy Plaza, Sam Ethnan Air Force Base, Ikeja, Lagos
              </li>
              <li>
                <a href="mailto:support@novacrestpharmacy.com">
                  Email: support@novacrestpharmacy.com
                </a>
              </li>
              <li>
                <a href="tel:+2349165434330">Phone: +234 916 543 4330</a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </footer>
  );
};

export default Footer;