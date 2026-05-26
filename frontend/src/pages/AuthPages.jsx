import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext, FlashContext } from '../App.jsx';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(UserContext);
  const { showFlash } = useContext(FlashContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { email, password });
      login(res.data);
      showFlash('Successfully logged in!', 'success');
      if (res.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      showFlash(err.response?.data?.error || 'Invalid email or password', 'danger');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center mt-5 mb-5" style={{ minHeight: '80vh' }}>
      <div className="card border-0 shadow-sm p-5" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="h3 mb-2">Welcome Back</h2>
          <p className="text-muted">Please login to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-medium">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              id="email"
              placeholder="name@example.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-medium">Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="password"
              placeholder="Enter your password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-dark w-100 mb-3 py-2">Login</button>

          <div className="text-center">
            <p className="mb-0 text-muted">
              Don't have an account? <Link to="/register" className="text-dark fw-bold text-decoration-none">Sign up</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showFlash } = useContext(FlashContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/register', { name, email, password });
      showFlash(res.data.success, 'success');
      navigate('/login');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Registration failed', 'danger');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center mt-5 mb-5" style={{ minHeight: '80vh' }}>
      <div className="card border-0 shadow-sm p-5" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="h3 mb-2">Create Account</h2>
          <p className="text-muted">Join us for the best shopping experience</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label fw-medium">Full Name</label>
            <input 
              type="text" 
              className="form-control" 
              id="name"
              placeholder="John Doe"
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-medium">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              id="email"
              placeholder="name@example.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-medium">Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="password"
              placeholder="Create a strong password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-dark w-100 mb-3 py-2">Sign Up</button>

          <div className="text-center">
            <p className="mb-0 text-muted">
              Already have an account? <Link to="/login" className="text-dark fw-bold text-decoration-none">Login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
