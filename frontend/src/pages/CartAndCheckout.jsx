import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext, CartContext, FlashContext } from '../App.jsx';

export function Cart() {
  const { cart, setCart } = useContext(CartContext);
  const { showFlash } = useContext(FlashContext);
  const [productsDict, setProductsDict] = useState({});
  const [shippingFee, setShippingFee] = useState(69);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load product details for items in cart
  useEffect(() => {
    if (cart.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);

    axios.get('/api/products')
      .then(res => {
        const dict = {};
        for (const p of res.data.products || []) {
          dict[p._id.toString()] = p;
        }
        setProductsDict(dict);
      })
      .catch(err => console.error('Fetch cart products failed:', err))
      .finally(() => setLoading(false));

    // Fetch dynamic shipping fee calculation
    axios.post('/api/calculate_shipping')
      .then(res => setShippingFee(res.data.delivery_fee))
      .catch(err => console.error('Shipping calculation failed:', err));
  }, [cart]);

  const handleQtyChange = (productId, size, color, newQty) => {
    if (newQty < 1) return;
    const updated = cart.map(item => {
      if (item.product_id === productId && item.size === size && item.color === color) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updated);
  };

  const handleRemove = (productId, size, color) => {
    const updated = cart.filter(
      item => !(item.product_id === productId && item.size === size && item.color === color)
    );
    setCart(updated);
    showFlash('Item removed from cart', 'success');
  };

  // Compile cart list with metadata
  const cartItems = cart.map(item => {
    const product = productsDict[item.product_id];
    if (!product) return null;
    return {
      ...product,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      total: product.price * item.quantity
    };
  }).filter(Boolean);

  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = subtotal > 0 ? subtotal + shippingFee : 0;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Shopping Cart</h1>
        <span className="text-muted">{cartItems.length} items</span>
      </div>

      {cartItems.length > 0 ? (
        <div className="row g-5">
          {/* Cart Items List */}
          <div className="col-lg-8">
            <div className="d-flex flex-column gap-3">
              {cartItems.map((item, idx) => (
                <div key={idx} className="card border p-3">
                  <div className="d-flex gap-3 align-items-center">
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="rounded"
                      style={{ width: '80px', height: '100px', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/80x100' }}
                    />

                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between mb-1">
                        <h5 className="mb-0 fs-6">
                          <Link to={`/product/${item._id}`} className="text-decoration-none text-dark text-capitalize">
                            {item.name}
                          </Link>
                        </h5>
                        <span className="fw-bold">₹{item.total}</span>
                      </div>

                      <div className="text-muted small mb-2 text-capitalize">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ' | '}
                        {item.color && `Color: ${item.color}`}
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <input 
                            type="number" 
                            value={item.quantity} 
                            min="1"
                            onChange={(e) => handleQtyChange(item._id.toString(), item.size, item.color, parseInt(e.target.value, 10))}
                            className="form-control form-control-sm text-center" 
                            style={{ width: '60px' }}
                          />
                          <small className="text-muted">Quantity</small>
                        </div>

                        <button 
                          onClick={() => handleRemove(item._id.toString(), item.size, item.color)}
                          className="btn btn-link text-danger small text-decoration-none border-0 p-0 bg-transparent"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="col-lg-4">
            <div className="card bg-light p-4 border-0 rounded-3 sticky-top" style={{ top: '100px' }}>
              <h4 className="h5 mb-4">Order Summary</h4>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Shipping</span>
                <span>
                  {shippingFee > 0 ? (
                    `₹${shippingFee}`
                  ) : (
                    <span className="text-success">Free</span>
                  )}
                </span>
              </div>

              <hr className="my-3" />

              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold">Total</span>
                <span className="fw-bold fs-5">₹{grandTotal}</span>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn btn-dark w-100 py-3">
                Proceed to Checkout
              </button>

              <div className="mt-4 text-center">
                <small className="text-muted"><i className="fas fa-lock me-1"></i> Secure Checkout</small>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-shopping-bag fa-3x text-muted opacity-25"></i>
          </div>
          <h3 className="h4 text-muted mb-3">Your cart is empty</h3>
          <p className="text-muted mb-4">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="btn btn-dark px-4">Start Shopping</Link>
        </div>
      )}
    </div>
  );
}

export function Checkout() {
  const { user } = useContext(UserContext);
  const { cart, setCart } = useContext(CartContext);
  const { showFlash } = useContext(FlashContext);
  
  const [productsDict, setProductsDict] = useState({});
  const [shippingFee, setShippingFee] = useState(69);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Fetch Cart Details and Profile Coordinates
  useEffect(() => {
    if (!user) {
      showFlash('Please log in to checkout.', 'warning');
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    setLoading(true);
    axios.get('/api/products')
      .then(res => {
        const dict = {};
        for (const p of res.data.products || []) {
          dict[p._id.toString()] = p;
        }
        setProductsDict(dict);
      })
      .catch(err => console.error('Fetch products failed:', err));

    axios.get('/api/profile')
      .then(res => {
        if (res.data.user) {
          const u = res.data.user;
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setAddress(u.address || '');
          setCity(u.city || '');
          setState(u.state || '');
          setZip(u.zip || '');
        }
      })
      .catch(err => console.error('Profile fetch failed:', err))
      .finally(() => setLoading(false));

    axios.post('/api/calculate_shipping')
      .then(res => setShippingFee(res.data.delivery_fee))
      .catch(err => console.error('Shipping calculation failed:', err));
  }, [user, cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const billingDetails = { name, email, phone, address, city, state, zip };
    try {
      const res = await axios.post('/api/checkout', {
        items: cart,
        shipping_details: billingDetails
      });
      showFlash(res.data.success || 'Order placed successfully!', 'success');
      setCart([]); // Reset Cart context
      navigate('/my_orders');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Order submission failed', 'danger');
    }
  };

  const cartItems = cart.map(item => {
    const product = productsDict[item.product_id];
    if (!product) return null;
    return {
      ...product,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      total: product.price * item.quantity
    };
  }).filter(Boolean);

  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = subtotal + shippingFee;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="section-title text-center mb-5">
        <h1 className="h3">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-5">
          {/* Billing Form */}
          <div className="col-lg-8">
            <div className="card border p-4">
              <h4 className="h5 mb-4">Billing Details</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">City</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">State</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={state} 
                    onChange={e => setState(e.target.value)} 
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">ZIP Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={zip} 
                    onChange={e => setZip(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="col-lg-4">
            <div className="card bg-light p-4 border-0 rounded-3">
              <h4 className="h5 mb-4">Order Summary</h4>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span className="fw-bold">₹{subtotal}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Shipping</span>
                <span>
                  {shippingFee > 0 ? (
                    `₹${shippingFee}`
                  ) : (
                    <span className="text-success">Free</span>
                  )}
                </span>
              </div>
              <hr className="my-3" />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold">Total</span>
                <span className="fw-bold fs-5">₹{grandTotal}</span>
              </div>

              <h5 className="h6 mb-3">Payment Method</h5>
              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="radio" 
                  name="payment_method" 
                  id="cod" 
                  value="COD" 
                  defaultChecked 
                />
                <label className="form-check-label" htmlFor="cod">
                  Cash on Delivery
                </label>
              </div>

              <button type="submit" className="btn btn-dark w-100 py-3">Place Order</button>

              <div className="mt-3 text-center">
                <small className="text-muted">By placing an order, you agree to our Terms of Service.</small>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
