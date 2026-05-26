import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function About() {
  return (
    <div className="container mt-5 mb-5">
      <div className="section-header text-center mb-5">
        <h1 className="section-title">About Us</h1>
        <p className="text-muted mt-3" style={{ maxWidth: '600px', margin: '0 auto' }}>
          We are dedicated to providing the best fashion and lifestyle products to our customers.
        </p>
      </div>

      <div className="row align-items-center mb-5">
        <div className="col-md-6 mb-4 mb-md-0">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Our Team" 
            className="img-fluid rounded-0" 
          />
        </div>
        <div className="col-md-6">
          <div className="ps-md-4">
            <h2 className="h3 mb-3">Our Story</h2>
            <p className="text-muted mb-4">
              Founded in 2023, Sahasra Silks began with a simple mission: to make high-quality fashion accessible to
              everyone. What started as a small local boutique has grown into a global online store, serving
              customers in over 50 countries.
            </p>
            <p className="text-muted">
              We believe in sustainable fashion and ethical sourcing. Every product you see on our store has been
              carefully curated to ensure it meets our high standards of quality and style.
            </p>
          </div>
        </div>
      </div>

      <div className="row text-center g-4">
        <div className="col-md-4">
          <div className="p-4 border h-100">
            <i className="fas fa-shipping-fast fa-2x mb-3 text-dark"></i>
            <h4 className="h5">Fast Delivery</h4>
            <p className="text-muted small mb-0">We ensure your products reach you as quickly as possible.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 border h-100">
            <i className="fas fa-undo fa-2x mb-3 text-dark"></i>
            <h4 className="h5">Easy Returns</h4>
            <p className="text-muted small mb-0">Not satisfied? Return it within 30 days, no questions asked.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 border h-100">
            <i className="fas fa-headset fa-2x mb-3 text-dark"></i>
            <h4 className="h5">24/7 Support</h4>
            <p className="text-muted small mb-0">Our customer support team is always here to help you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  const [settings, setSettings] = useState({
    company_name: 'Sahasra Silks',
    address: '123 Fashion Street, New York, NY 10001, USA',
    phone: '+1 234 567 8900',
    email: 'support@sahasrasilks.com',
    zip_code: ''
  });

  useEffect(() => {
    axios.get('/api/settings')
      .then(res => {
        if (res.data) {
          setSettings(prev => ({
            ...prev,
            company_name: res.data.company_name || prev.company_name,
            address: res.data.address || prev.address,
            phone: res.data.phone || prev.phone,
            email: res.data.email || prev.email,
            zip_code: res.data.zip_code || prev.zip_code
          }));
        }
      })
      .catch(err => console.error('Failed to load store settings:', err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent successfully!');
    e.target.reset();
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="section-header text-center mb-5">
        <h1 className="section-title">Contact Us</h1>
        <p className="text-muted mt-3">Have questions? We'd love to hear from you.</p>
      </div>

      <div className="row g-5">
        <div className="col-md-6">
          <h3 className="h5 mb-4">Get in Touch</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small text-uppercase fw-bold text-muted">Name</label>
              <input type="text" className="form-control rounded-0" placeholder="Your Name" required />
            </div>
            <div className="mb-3">
              <label className="form-label small text-uppercase fw-bold text-muted">Email</label>
              <input type="email" className="form-control rounded-0" placeholder="Your Email" required />
            </div>
            <div className="mb-3">
              <label className="form-label small text-uppercase fw-bold text-muted">Subject</label>
              <input type="text" className="form-control rounded-0" placeholder="Subject" required />
            </div>
            <div className="mb-4">
              <label className="form-label small text-uppercase fw-bold text-muted">Message</label>
              <textarea className="form-control rounded-0" rows="5" placeholder="Your Message" required></textarea>
            </div>
            <button type="submit" className="btn btn-dark w-100 py-2">Send Message</button>
          </form>
        </div>
        
        <div className="col-md-6">
          <div className="bg-light p-4 h-100">
            <h3 className="h5 mb-4">Contact Info</h3>
            <div className="mb-4">
              <h5 className="small text-uppercase fw-bold text-muted mb-2">Address</h5>
              <p className="mb-0">
                {settings.address}
                {settings.zip_code && `, ${settings.zip_code}`}
              </p>
            </div>
            <div className="mb-4">
              <h5 className="small text-uppercase fw-bold text-muted mb-2">Phone</h5>
              <p className="mb-0">{settings.phone}</p>
            </div>
            <div className="mb-4">
              <h5 className="small text-uppercase fw-bold text-muted mb-2">Email</h5>
              <p className="mb-0">{settings.email}</p>
            </div>

            <div className="mt-5">
              <h5 className="small text-uppercase fw-bold text-muted mb-3">Follow Us</h5>
              <div className="d-flex gap-3">
                <a href="#" className="text-dark"><i className="fab fa-facebook-f text-dark"></i></a>
                <a href="#" className="text-dark"><i className="fab fa-twitter text-dark"></i></a>
                <a href="#" className="text-dark"><i className="fab fa-instagram text-dark"></i></a>
                <a href="#" className="text-dark"><i className="fab fa-linkedin-in text-dark"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
