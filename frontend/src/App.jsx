import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configure Axios to automatically send credentials/cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api';

// Create Global Contexts
export const UserContext = createContext(null);
export const CartContext = createContext(null);
export const FlashContext = createContext(null);

// Navbar Component
function Navbar() {
  const { user, logout } = useContext(UserContext);
  const { cart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = location.pathname === '/';

  // On home page: go dark after scrolling 80px
  useEffect(() => {
    if (!isHome) { setScrolled(false); return; }
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  // Home hero: transparent fixed → darkens on scroll
  // Non-home: solid dark, position relative (no floating)
  const navStyle = isHome
    ? {
        position: 'fixed',
        top: 0, left: 0, width: '100%',
        zIndex: 1000,
        transition: 'background-color 0.35s ease, backdrop-filter 0.35s ease',
        backgroundColor: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        padding: '1rem 0',
      }
    : {
        position: 'relative',
        backgroundColor: '#111111',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        padding: '0.9rem 0',
      };


  return (
    <>
      <nav style={navStyle}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between w-100">

            {/* Mobile Toggler Button */}
            <button
              onClick={toggleMobile}
              className="d-lg-none"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
              title="Menu"
            >
              <i className={mobileOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>

            {/* Brand */}
            <Link to="/" style={{
              fontWeight: 400,
              fontSize: '1.5rem',
              letterSpacing: '-0.03em',
              color: 'white',
              textDecoration: 'none',
            }}>
              Sahasra Silks
            </Link>

            {/* Centre links (Desktop only) */}
            <ul className="navbar-nav flex-row gap-4 mb-0 d-none d-lg-flex">
              <li className="nav-item"><Link to="/" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 300, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>Home</Link></li>
              <li className="nav-item"><Link to="/" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 300, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>Shop</Link></li>
              <li className="nav-item"><Link to="/about" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 300, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>About</Link></li>
              <li className="nav-item"><Link to="/contact" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 300, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>Contact</Link></li>
            </ul>

            {/* Desktop right links */}
            <div className="d-none d-lg-flex align-items-center gap-3">
              <Link to="/" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', textDecoration: 'none' }} title="Search">
                <i className="fas fa-search"></i>
              </Link>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', textDecoration: 'none' }} title="Admin Dashboard">
                      <i className="fas fa-cog"></i>
                    </Link>
                  )}
                  <Link to="/wishlist" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', textDecoration: 'none' }} title="Wishlist">
                    <i className="fas fa-heart"></i>
                  </Link>
                  <Link to="/cart" className="position-relative" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', textDecoration: 'none' }} title="Shopping Bag">
                    <i className="fas fa-shopping-bag"></i>
                    {cart.length > 0 && (
                      <span className="badge-count">
                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', textDecoration: 'none' }} title="My Profile">
                    <i className="fas fa-user"></i>
                  </Link>
                  <button
                    onClick={async () => { await logout(); navigate('/login'); }}
                    style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                    title="Log Out"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </>
              ) : (
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', textDecoration: 'none' }} title="Log In / Register">
                  <i className="fas fa-user"></i>
                </Link>
              )}
            </div>

            {/* Mobile right links - ONLY Cart! */}
            <div className="d-lg-none d-flex align-items-center gap-2">
              <Link to="/cart" className="position-relative" style={{ color: 'white', fontSize: '1.2rem', padding: '0.5rem', textDecoration: 'none' }} title="Shopping Bag">
                <i className="fas fa-shopping-bag"></i>
                {cart.length > 0 && (
                  <span className="badge-count" style={{ top: '2px', right: '2px' }}>
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* Slide-out Mobile Menu Panel */}
      {mobileOpen && (
        <div
          onClick={toggleMobile}
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1100, // Higher than navbar's 1000 to overlay the navbar completely and block any background links/X buttons
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0, left: 0, width: '290px', height: '100vh',
              backgroundColor: '#111111',
              zIndex: 1001,
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 15px rgba(0,0,0,0.5)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              overflowY: 'auto', // Enable scrolling for smaller mobile screens so profile and logout actions are always accessible
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <span style={{ fontWeight: 400, fontSize: '1.25rem', color: 'white' }}>Navigation</span>
              <button
                onClick={toggleMobile}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.25rem' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Mobile Drawer Search Box */}
            <div className="mb-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const q = e.target.search.value;
                navigate(`/?q=${encodeURIComponent(q)}`);
                toggleMobile();
              }}>
                <div className="input-group">
                  <input
                    type="search"
                    name="search"
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="Search Sahasra..."
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button className="btn btn-outline-light border-secondary" type="submit">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </form>
            </div>

            {/* User Info / Actions (Moved to Top for instant visibility) */}
            <div className="pb-4 border-bottom border-secondary mb-4">
              {user ? (
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-2 text-white mb-2">
                    <i className="fas fa-user-circle fa-2x text-muted"></i>
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Logged in as</small>
                      <span className="fw-medium text-capitalize" style={{ fontSize: '0.95rem' }}>{user.name}</span>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={toggleMobile} className="btn btn-outline-light btn-sm text-start flex-grow-1 border-secondary py-2" style={{ fontSize: '0.8rem' }}>
                        <i className="fas fa-cog me-1"></i> Admin
                      </Link>
                    )}
                    <Link to="/wishlist" onClick={toggleMobile} className="btn btn-outline-light btn-sm text-start flex-grow-1 border-secondary py-2" style={{ fontSize: '0.8rem' }}>
                      <i className="fas fa-heart me-1 text-danger"></i> Wishlist
                    </Link>
                    <Link to="/profile" onClick={toggleMobile} className="btn btn-outline-light btn-sm text-start flex-grow-1 border-secondary py-2" style={{ fontSize: '0.8rem' }}>
                      <i className="fas fa-user me-1 text-primary"></i> Profile
                    </Link>
                  </div>
                  <button
                    onClick={async () => { await logout(); navigate('/login'); toggleMobile(); }}
                    className="btn btn-dark btn-sm text-start w-100 text-danger border-secondary py-2 mt-1"
                  >
                    <i className="fas fa-sign-out-alt me-2"></i> Log Out
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={toggleMobile} className="btn btn-outline-light w-100 border-secondary py-2">
                  <i className="fas fa-sign-in-alt me-2"></i> Log In / Register
                </Link>
              )}
            </div>

            <ul className="list-unstyled d-flex flex-column gap-3 mb-auto">
              <li><Link to="/" onClick={toggleMobile} style={{ color: 'white', fontSize: '1.05rem', textDecoration: 'none', fontWeight: 300, display: 'block' }}><i className="fas fa-home me-2 text-muted" style={{ width: '20px' }}></i>Home</Link></li>
              <li><Link to="/" onClick={toggleMobile} style={{ color: 'white', fontSize: '1.05rem', textDecoration: 'none', fontWeight: 300, display: 'block' }}><i className="fas fa-shopping-bag me-2 text-muted" style={{ width: '20px' }}></i>Shop</Link></li>
              <li><Link to="/about" onClick={toggleMobile} style={{ color: 'white', fontSize: '1.05rem', textDecoration: 'none', fontWeight: 300, display: 'block' }}><i className="fas fa-info-circle me-2 text-muted" style={{ width: '20px' }}></i>About Us</Link></li>
              <li><Link to="/contact" onClick={toggleMobile} style={{ color: 'white', fontSize: '1.05rem', textDecoration: 'none', fontWeight: 300, display: 'block' }}><i className="fas fa-envelope me-2 text-muted" style={{ width: '20px' }}></i>Contact</Link></li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}


// Footer Component
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <Link to="/" className="footer-brand">Sahasra Silks</Link>
            <p className="mt-3 text-muted">Drape yourself in elegance with our premium handwoven traditional silk sarees.</p>
          </div>
          <div className="col-md-2 col-6">
            <h5>Shop</h5>
            <ul className="list-unstyled">
              <li><Link to="/">New Arrivals</Link></li>
              <li><Link to="/">Best Sellers</Link></li>
              <li><Link to="/">Sarees</Link></li>
            </ul>
          </div>
          <div className="col-md-2 col-6">
            <h5>Support</h5>
            <ul className="list-unstyled">
              <li><Link to="/">FAQ</Link></li>
              <li><Link to="/">Shipping</Link></li>
              <li><Link to="/">Returns</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Newsletter</h5>
            <p className="text-muted small">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="d-flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" className="form-control" placeholder="Enter your email" required />
              <button className="btn btn-dark">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom mt-5 pt-4 border-top">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <p className="mb-0 text-muted small">&copy; 2024 Sahasra Silks. All rights reserved.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Layout Wrapper (public site)
function Layout({ children }) {
  const { flash, clearFlash } = useContext(FlashContext);

  return (
    <>
      <Navbar />
      {flash && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          }}
        >
          <div className={`alert alert-${flash.type === 'error' || flash.type === 'danger' ? 'danger' : flash.type === 'warning' ? 'warning' : 'success'} alert-dismissible fade show mb-0`} role="alert">
            {flash.message}
            <button type="button" className="btn-close" onClick={clearFlash} aria-label="Close"></button>
          </div>
        </div>
      )}
      <main>
        {children}
      </main>
      <Footer />
    </>
  );
}

// Lazy/Dynamic Imports for Pages
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import { Cart, Checkout } from './pages/CartAndCheckout.jsx';
import { Profile, MyOrders, OrderDetails, ReturnRequest, Wishlist } from './pages/UserPages.jsx';
import { Login, Register } from './pages/AuthPages.jsx';
import { About, Contact } from './pages/StaticPages.jsx';
import { AdminDashboard, AdminOrders, AdminReturns, AdminReviews, SellerSettings, AdminEditProduct } from './pages/AdminPages.jsx';

// Inner component that reads location for layout splitting
function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    // Admin pages have their own white navbar — no outer Layout wrapper
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/returns" element={<AdminReturns />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/settings" element={<SellerSettings />} />
        <Route path="/admin/edit_product/:id" element={<AdminEditProduct />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my_orders" element={<MyOrders />} />
        <Route path="/order/:id" element={<OrderDetails />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/request_return/:id" element={<ReturnRequest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Layout>
  );
}

// Component to automatically scroll to the top of the window on every route change (handles all button page clicks)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('silks_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [flash, setFlash] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('silks_cart', JSON.stringify(cart));
  }, [cart]);

  // Flash Message Helper
  const showFlash = (message, type = 'success') => {
    setFlash({ message, type });
    setTimeout(() => {
      setFlash(null);
    }, 5000);
  };

  const clearFlash = () => setFlash(null);

  // Fetch current user on mount
  useEffect(() => {
    axios.get('/api/current_user')
      .then(res => {
        if (res.data) setUser(res.data);
      })
      .catch(err => console.error('Auth verification failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      showFlash('Successfully logged out', 'success');
    } catch (err) {
      showFlash('Logout failed', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      <CartContext.Provider value={{ cart, setCart }}>
        <FlashContext.Provider value={{ flash, showFlash, clearFlash }}>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
        </FlashContext.Provider>
      </CartContext.Provider>
    </UserContext.Provider>
  );
}
