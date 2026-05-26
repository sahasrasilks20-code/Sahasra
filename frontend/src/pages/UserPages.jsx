import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext, CartContext, FlashContext } from '../App.jsx';

export function Profile() {
  const { user } = useContext(UserContext);
  const { showFlash } = useContext(FlashContext);
  const [profileData, setProfileData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    axios.get('/api/profile')
      .then(res => {
        setProfileData(res.data.user);
        setRecentOrders(res.data.orders || []);
        
        // Map form defaults
        const u = res.data.user;
        setName(u.name || '');
        setPhone(u.phone || '');
        setAddress(u.address || '');
        setCity(u.city || '');
        setState(u.state || '');
        setZip(u.zip || '');
      })
      .catch(err => console.error('Fetch profile failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name, phone, address, city, state, zip,
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      };
      const res = await axios.post('/api/profile/update', payload);
      showFlash(res.data.success, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Profile update failed', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="container mt-5 mb-5">
      <div className="section-header text-center mb-5">
        <h1 class="section-title">My Profile</h1>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="text-center mb-5">
            <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3"
              style={{ width: '80px', height: '80px' }}>
              <i className="fas fa-user fa-2x text-muted"></i>
            </div>
            <h4 className="h5 mb-1">{profileData.name}</h4>
            <p className="text-muted small">{profileData.email}</p>
          </div>

          <form onSubmit={handleUpdate}>
            <h5 className="small text-uppercase fw-bold text-muted mb-3">Personal Information</h5>
            <div className="mb-4">
              <label className="form-label small text-uppercase fw-bold text-muted">Full Name</label>
              <input 
                type="text" 
                className="form-control rounded-0" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>

            <h5 className="small text-uppercase fw-bold text-muted mb-3 mt-5">Address Details</h5>
            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className="form-label small text-uppercase fw-bold text-muted">Address</label>
                <input 
                  type="text" 
                  className="form-control rounded-0" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Street Address" 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-uppercase fw-bold text-muted">City</label>
                <input 
                  type="text" 
                  className="form-control rounded-0" 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  placeholder="City" 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-uppercase fw-bold text-muted">State</label>
                <input 
                  type="text" 
                  className="form-control rounded-0" 
                  value={state} 
                  onChange={e => setState(e.target.value)} 
                  placeholder="State" 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-uppercase fw-bold text-muted">Zip Code</label>
                <input 
                  type="text" 
                  className="form-control rounded-0" 
                  value={zip} 
                  onChange={e => setZip(e.target.value)} 
                  placeholder="Zip Code" 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-uppercase fw-bold text-muted">Phone</label>
                <input 
                  type="text" 
                  className="form-control rounded-0" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Phone Number" 
                />
              </div>
            </div>

            <hr className="my-5" />

            <h5 className="small text-uppercase fw-bold text-muted mb-3">Change Password</h5>
            <div className="mb-3">
              <label className="form-label small text-uppercase fw-bold text-muted">Current Password</label>
              <input 
                type="password" 
                className="form-control rounded-0" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                placeholder="Enter current password" 
              />
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small text-uppercase fw-bold text-muted">New Password</label>
                <input 
                  type="password" 
                  className="form-control rounded-0" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Enter new password" 
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small text-uppercase fw-bold text-muted">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control rounded-0" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm new password" 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-dark w-100 mt-4 py-2">Update Profile</button>
          </form>
        </div>
      </div>

      {/* Orders list in table */}
      <div className="row justify-content-center mt-5 pt-5 border-top">
        <div className="col-lg-10">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h4 mb-0">My Orders</h2>
            <Link to="/my_orders" className="btn btn-outline btn-sm">View All</Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="small text-uppercase text-muted border-bottom">
                  <tr>
                    <th scope="col" className="py-3 fw-normal">Order ID</th>
                    <th scope="col" className="py-3 fw-normal">Date</th>
                    <th scope="col" className="py-3 fw-normal">Total</th>
                    <th scope="col" className="py-3 fw-normal">Status</th>
                    <th scope="col" className="py-3 fw-normal text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order._id}>
                      <td className="py-3 fw-medium">{order.order_id}</td>
                      <td className="py-3 text-muted">
                        {new Date(order.created_at).toLocaleDateString(undefined, {day: 'numeric', month: 'short', year: 'numeric'})}
                      </td>
                      <td className="py-3">₹{order.total_amount}</td>
                      <td className="py-3">
                        {order.status === 'Delivered' ? (
                          <span className="badge bg-success fw-normal rounded-0">Delivered</span>
                        ) : order.status === 'Cancelled' ? (
                          <span className="badge bg-danger fw-normal rounded-0">Cancelled</span>
                        ) : (
                          <span className="badge bg-warning text-dark fw-normal rounded-0">{order.status}</span>
                        )}
                      </td>
                      <td className="py-3 text-end">
                        <Link to={`/order/${order._id}`} className="btn btn-sm btn-outline rounded-0">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 bg-light">
              <p className="text-muted mb-3">No recent orders found.</p>
              <Link to="/" className="btn btn-dark btn-sm">Start Shopping</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPage = (pageNum) => {
    setLoading(true);
    axios.get('/api/my_orders', { params: { page: pageNum } })
      .then(res => {
        setOrders(res.data.orders || []);
        setTotalPages(res.data.total_pages || 1);
        setCurrentPage(res.data.current_page || 1);
      })
      .catch(err => console.error('Fetch my orders failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="section-header text-center mb-5">
        <h1 className="section-title">My Orders</h1>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-10">
          {orders.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="small text-uppercase text-muted border-bottom">
                    <tr>
                      <th scope="col" className="py-3 fw-normal">Order ID</th>
                      <th scope="col" className="py-3 fw-normal">Date</th>
                      <th scope="col" className="py-3 fw-normal">Total</th>
                      <th scope="col" className="py-3 fw-normal">Status</th>
                      <th scope="col" className="py-3 fw-normal text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id}>
                        <td className="py-3 fw-medium">{order.order_id}</td>
                        <td className="py-3 text-muted">
                          {new Date(order.created_at).toLocaleDateString(undefined, {day: 'numeric', month: 'short', year: 'numeric'})}
                        </td>
                        <td className="py-3">₹{order.total_amount}</td>
                        <td className="py-3">
                          {order.status === 'Delivered' ? (
                            <span className="badge bg-success fw-normal rounded-0">Delivered</span>
                          ) : order.status === 'Cancelled' ? (
                            <span className="badge bg-danger fw-normal rounded-0">Cancelled</span>
                          ) : (
                            <span className="badge bg-warning text-dark fw-normal rounded-0">{order.status}</span>
                          )}
                        </td>
                        <td className="py-3 text-end">
                          <Link to={`/order/${order._id}`} className="btn btn-sm btn-outline rounded-0">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                  <nav aria-label="Page navigation">
                    <ul className="pagination">
                      {currentPage > 1 && (
                        <li className="page-item">
                          <button 
                            className="page-link border-0 text-dark" 
                            onClick={() => fetchPage(currentPage - 1)}
                            aria-label="Previous"
                          >
                            <span aria-hidden="true">&laquo;</span>
                          </button>
                        </li>
                      )}

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const p = idx + 1;
                        return (
                          <li key={p} className="page-item">
                            <button 
                              className={`page-link border-0 ${p === currentPage ? 'fw-bold text-dark' : 'text-muted'}`}
                              onClick={() => fetchPage(p)}
                            >
                              {p}
                            </button>
                          </li>
                        );
                      })}

                      {currentPage < totalPages && (
                        <li className="page-item">
                          <button 
                            className="page-link border-0 text-dark" 
                            onClick={() => fetchPage(currentPage + 1)}
                            aria-label="Next"
                          >
                            <span aria-hidden="true">&raquo;</span>
                          </button>
                        </li>
                      )}
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-4">You haven't placed any orders yet.</p>
              <Link to="/" className="btn btn-dark px-4">Start Shopping</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrderDetails() {
  const { id } = useParams();
  const { showFlash } = useContext(FlashContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Review Modal State
  const [activeReviewIndex, setActiveReviewIndex] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    axios.get(`/api/orders/${id}`)
      .then(res => {
        setOrder(res.data.order);
      })
      .catch(err => {
        console.error('Fetch order details failed:', err);
        navigate('/my_orders');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReviewSubmit = async (e, productId) => {
    e.preventDefault();
    try {
      await axios.post(`/api/products/${productId}/review`, {
        rating: reviewRating,
        comment: reviewComment
      });
      showFlash('Review submitted successfully!', 'success');
      setActiveReviewIndex(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      showFlash(err.response?.data?.error || 'Review submission failed', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 className="h3 mb-0">Order Details</h1>
        <Link to="/my_orders" className="btn btn-outline btn-sm"><i className="fas fa-arrow-left me-2"></i> Back</Link>
      </div>

      <div className="row g-5">
        {/* Item specs and reviews modal */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div>
              <span className="text-muted small text-uppercase d-block mb-1">Order ID</span>
              <span className="fw-medium">{order.order_id}</span>
            </div>
            <div>
              <span className="text-muted small text-uppercase d-block mb-1">Status</span>
              <span className="badge bg-light text-dark border rounded-0 fw-normal">{order.status}</span>
            </div>
          </div>

          <div className="table-responsive mb-5">
            <table className="table align-middle">
              <thead className="small text-uppercase text-muted">
                <tr>
                  <th className="fw-normal pb-3">Product</th>
                  <th className="fw-normal pb-3 text-center">Qty</th>
                  <th className="fw-normal pb-3 text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <div className="d-flex align-items-center">
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          style={{ width: '60px', height: '80px', objectFit: 'cover', marginRight: '15px' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x80' }}
                        />
                        <div>
                          <h6 className="mb-1 small fw-bold text-uppercase">{item.name}</h6>
                          {item.size && <small className="text-muted d-block">Size: {item.size}</small>}
                          {item.color && <small className="text-muted d-block text-capitalize">Color: {item.color}</small>}
                          <small className="text-muted">₹{item.price}</small>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-end">
                      <div className="d-flex flex-column align-items-end gap-2">
                        <span>₹{item.price * item.quantity}</span>
                        {order.status === 'Delivered' && (
                          <div className="btn-group btn-group-sm">
                            <button 
                              type="button" 
                              className="btn btn-outline-dark" 
                              onClick={() => setActiveReviewIndex(idx)}
                            >
                              Review
                            </button>
                            {(!item.return_policy || 
                              (!item.return_policy.toLowerCase().includes('no return') && 
                               !item.return_policy.toLowerCase().includes('not accepted'))) && (
                              <Link to={`/request_return/${order._id}`} className="btn btn-outline-danger">Return</Link>
                            )}
                          </div>
                        )}

                        {/* Review Modal */}
                        {order.status === 'Delivered' && activeReviewIndex === idx && (
                          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
                            <div className="modal-dialog">
                              <div className="modal-content text-start text-dark">
                                <div className="modal-header">
                                  <h5 className="modal-title">Review {item.name}</h5>
                                  <button type="button" className="btn-close" onClick={() => setActiveReviewIndex(null)}></button>
                                </div>
                                <form onSubmit={(e) => handleReviewSubmit(e, item.product_id)}>
                                  <div className="modal-body">
                                    <div className="mb-3 text-center">
                                      <label className="form-label fw-medium d-block">Rating</label>
                                      <div className="rating-input justify-content-center d-flex gap-2">
                                        {[1, 2, 3, 4, 5].map(starNum => (
                                          <React.Fragment key={starNum}>
                                            <input 
                                              type="radio" 
                                              name="rating" 
                                              id={`star-${idx}-${starNum}`} 
                                              value={starNum}
                                              checked={reviewRating === starNum}
                                              onChange={() => setReviewRating(starNum)}
                                              className="btn-check"
                                              required
                                            />
                                            <label htmlFor={`star-${idx}-${starNum}`} style={{ cursor: 'pointer' }}>
                                              <i className={`fa-star fs-3 ${reviewRating >= starNum ? 'fas text-warning' : 'far text-muted'}`}></i>
                                            </label>
                                          </React.Fragment>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <label className="form-label fw-medium">Your Review</label>
                                      <textarea 
                                        className="form-control" 
                                        rows="4" 
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        required 
                                        placeholder="Share your experience..."
                                      ></textarea>
                                    </div>
                                  </div>
                                  <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setActiveReviewIndex(null)}>Close</button>
                                    <button type="submit" className="btn btn-dark">Submit Review</button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing side summary */}
        <div className="col-lg-4">
          <div className="bg-light p-4">
            <h5 className="small text-uppercase fw-bold text-muted mb-4">Order Summary</h5>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
              <span className="text-muted">Shipping</span>
              <span>{order.delivery_fee === 0 ? 'Free' : `₹${order.delivery_fee}`}</span>
            </div>
            <div className="d-flex justify-content-between mb-5">
              <span className="fw-bold">Total</span>
              <span className="fw-bold">₹{order.total_amount}</span>
            </div>

            <h5 className="small text-uppercase fw-bold text-muted mb-3">Shipping Address</h5>
            <p className="text-muted small mb-4">
              {order.shipping_details.name}<br />
              {order.shipping_details.address}<br />
              {order.shipping_details.city}, {order.shipping_details.state} - {order.shipping_details.zip}<br />
              Phone: {order.shipping_details.phone}
            </p>

            <a href={`/api/orders/${order._id}/invoice`} target="_blank" rel="noreferrer" className="btn btn-outline w-100">
              Download Invoice
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReturnRequest() {
  const { id } = useParams();
  const { showFlash } = useContext(FlashContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [condition, setCondition] = useState('');
  const [comments, setComments] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/orders/${id}`)
      .then(res => setOrder(res.data.order))
      .catch(err => {
        console.error('Fetch return order failed:', err);
        navigate('/my_orders');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/orders/${id}/return`, { reason, condition, comments });
      showFlash('Return request successfully submitted!', 'success');
      navigate('/my_orders');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Return request failed', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 className="h3 mb-0">Request Return</h1>
        <Link to="/my_orders" className="btn btn-outline btn-sm"><i className="fas fa-arrow-left me-2"></i> Back</Link>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card p-4 mb-4 bg-light border-0">
            <h5 className="small text-uppercase fw-bold text-muted mb-3">Order Summary</h5>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Order ID</span>
              <span className="fw-medium">{order.order_id}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">Total Amount</span>
              <span className="fw-medium">₹{order.total_amount}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label small text-uppercase fw-bold text-muted">Reason for Return</label>
              <select className="form-select rounded-0" value={reason} onChange={e => setReason(e.target.value)} required>
                <option value="" disabled>Select a reason...</option>
                <option value="Size Issue">Size Issue - Too Small/Big</option>
                <option value="Defective">Defective or Damaged Item</option>
                <option value="Not as Described">Item Not as Described</option>
                <option value="Changed Mind">Changed Mind</option>
                <option value="Wrong Item">Received Wrong Item</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label small text-uppercase fw-bold text-muted">Item Condition</label>
              <div className="d-flex flex-column gap-2">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="condition" 
                    id="c1" 
                    value="Unopened"
                    checked={condition === 'Unopened'}
                    onChange={e => setCondition(e.target.value)}
                    required 
                  />
                  <label className="form-check-label" htmlFor="c1">Unopened</label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="condition" 
                    id="c2" 
                    value="Opened"
                    checked={condition === 'Opened'}
                    onChange={e => setCondition(e.target.value)}
                    required 
                  />
                  <label className="form-check-label" htmlFor="c2">Opened but Unused</label>
                </div>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="radio" 
                    name="condition" 
                    id="c3" 
                    value="Used"
                    checked={condition === 'Used'}
                    onChange={e => setCondition(e.target.value)}
                    required 
                  />
                  <label className="form-check-label" htmlFor="c3">Used/Tried On</label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small text-uppercase fw-bold text-muted">Additional Comments</label>
              <textarea 
                className="form-control rounded-0" 
                rows="4"
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Please provide more details..."
              ></textarea>
            </div>

            <button type="submit" className="btn btn-dark w-100 py-3">Submit Return Request</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Wishlist() {
  const { cart, setCart } = useContext(CartContext);
  const { showFlash } = useContext(FlashContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    setLoading(true);
    axios.get('/api/wishlist')
      .then(res => setWishlistItems(res.data || []))
      .catch(err => console.error('Fetch wishlist failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleAddToCart = (product) => {
    let selectedSize = '';
    if (product.sizes && product.sizes.length > 0) {
      const firstSize = product.sizes[0];
      selectedSize = typeof firstSize === 'object' ? firstSize.size : firstSize;
    }
    let selectedColor = '';
    if (product.colors && product.colors.length > 0) {
      selectedColor = product.colors[0];
    } else if (product.color) {
      selectedColor = product.color;
    }

    const cartItem = {
      product_id: product._id.toString(),
      quantity: 1,
      size: selectedSize || null,
      color: selectedColor || null
    };

    const existingIndex = cart.findIndex(
      item => item.product_id === cartItem.product_id && item.size === cartItem.size && item.color === cartItem.color
    );
    let updatedCart = [...cart];
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push(cartItem);
    }
    setCart(updatedCart);
    showFlash(`${product.name} added to cart!`, 'success');
  };

  const handleRemove = async (productId) => {
    try {
      await axios.post(`/api/wishlist/remove/${productId}`);
      showFlash('Removed from wishlist.', 'success');
      fetchWishlist();
    } catch (err) {
      showFlash(err.response?.data?.error || 'Remove failed', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="section-header text-center mb-5">
        <h1 className="section-title">My Wishlist</h1>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="row g-4">
          {wishlistItems.map(item => (
            <div key={item._id} className="col-lg-3 col-md-4 col-6">
              <div className="product-card">
                <div className="product-img-wrapper">
                  <Link to={`/product/${item._id}`}>
                    <img src={item.image_url} alt={item.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400' }} />
                  </Link>
                  <div className="product-actions">
                    <button onClick={() => handleAddToCart(item)} className="action-btn" title="Add to Cart">
                      <i className="fas fa-shopping-bag"></i>
                    </button>
                    <button onClick={() => handleRemove(item._id)} className="action-btn text-danger" title="Remove">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="product-details text-start p-0">
                  <h3 className="product-title text-capitalize">
                    <Link to={`/product/${item._id}`}>{item.name}</Link>
                  </h3>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="product-price">₹{item.price}</span>
                    {item.stock > 0 ? (
                      <span className="text-success small">In Stock</span>
                    ) : (
                      <span className="text-danger small">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <i className="far fa-heart fa-3x text-muted mb-3"></i>
          <p className="text-muted mb-4">Your wishlist is empty.</p>
          <Link to="/" className="btn btn-dark px-4">Browse Products</Link>
        </div>
      )}
    </div>
  );
}
