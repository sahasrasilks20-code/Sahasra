import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { UserContext, FlashContext } from '../App.jsx';

/* ─────────────────────────────────────────────────────────────
   SHARED ADMIN NAVBAR  (matches every HTML admin template)
───────────────────────────────────────────────────────────── */
function AdminNavbar({ active }) {
  const { logout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const links = [
    { label: 'Dashboard', to: '/admin',          key: 'dashboard' },
    { label: 'Orders',    to: '/admin/orders',   key: 'orders'    },
    { label: 'Returns',   to: '/admin/returns',  key: 'returns'   },
    { label: 'Reviews',   to: '/admin/reviews',  key: 'reviews'   },
    { label: 'Settings',  to: '/admin/settings', key: 'settings'  },
  ];

  return (
    <nav style={{
      background: 'white',
      boxShadow: '0 2px 15px rgba(0,0,0,0.05)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 1030,
    }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          {/* Brand */}
          <Link to="/admin" style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: '1.5rem',
            background: 'linear-gradient(135deg, #2c3e50, #34495e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textDecoration: 'none',
          }}>
            <i className="fas fa-shield-alt me-2" style={{ WebkitTextFillColor: '#2c3e50' }}></i>
            Admin Panel
          </Link>

          {/* Nav links */}
          <ul className="navbar-nav flex-row align-items-center gap-1 mb-0" style={{ listStyle: 'none' }}>
            {links.map(l => (
              <li key={l.key}>
                <Link
                  to={l.to}
                  style={{
                    fontWeight: 600,
                    color: active === l.key ? '#2c3e50' : '#555',
                    textDecoration: 'none',
                    padding: '0.4rem 0.75rem',
                    borderBottom: active === l.key ? '2px solid #2c3e50' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="ms-3">
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm px-4"
                style={{ fontWeight: 600 }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────
   SHARED ADMIN PAGE WRAPPER
───────────────────────────────────────────────────────────── */
function AdminPage({ active, children }) {
  const { flash, clearFlash } = useContext(FlashContext);
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f5f7fa', minHeight: '100vh', color: '#2d3436' }}>
      <AdminNavbar active={active} />
      <div className="container py-5">
        {flash && (
          <div className={`alert alert-${flash.type === 'error' || flash.type === 'danger' ? 'danger' : flash.type === 'warning' ? 'warning' : 'success'} alert-dismissible fade show mb-4`} role="alert">
            {flash.message}
            <button type="button" className="btn-close" onClick={clearFlash} aria-label="Close"></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN DASHBOARD
───────────────────────────────────────────────────────────── */
export function AdminDashboard() {
  const { user } = useContext(UserContext);
  const { showFlash } = useContext(FlashContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Add Product form state
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodColor, setProdColor] = useState('');
  const [prodFabric, setProdFabric] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSizes, setProdSizes] = useState('');
  const [prodReturnPolicy, setProdReturnPolicy] = useState('Return Accepted');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImages, setProdImages] = useState(null);

  // Add Category form state
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState(null);

  // Edit category modal state
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatImage, setEditCatImage] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    axios.get('/api/admin/dashboard')
      .then(res => {
        setProducts(res.data.products || []);
        setCategories(res.data.categories || []);
        if (res.data.categories && res.data.categories.length > 0) {
          setProdCategory(res.data.categories[0].name);
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchDashboard();
  }, [user]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', catName);
    if (catImage) fd.append('image', catImage);
    try {
      const res = await axios.post('/api/admin/categories/add', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showFlash(res.data.success || 'Category added', 'success');
      setCatName(''); setCatImage(null);
      fetchDashboard();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed to add category', 'danger'); }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', editCatName);
    if (editCatImage) fd.append('image', editCatImage);
    try {
      const res = await axios.post(`/api/admin/categories/edit/${editCatId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showFlash(res.data.success || 'Category updated', 'success');
      setEditCatId(null);
      fetchDashboard();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed to update category', 'danger'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Products in this category might be affected.')) return;
    try {
      const res = await axios.post(`/api/admin/categories/delete/${id}`);
      showFlash(res.data.success || 'Category deleted', 'success');
      fetchDashboard();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed to delete category', 'danger'); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', prodName); fd.append('category', prodCategory);
    fd.append('brand', prodBrand); fd.append('color', prodColor);
    fd.append('fabric', prodFabric); fd.append('price', prodPrice);
    fd.append('sizes', prodSizes); fd.append('return_policy', prodReturnPolicy);
    fd.append('description', prodDescription);
    if (prodImages) for (const f of prodImages) fd.append('images', f);
    try {
      const res = await axios.post('/api/admin/products/add', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showFlash(res.data.success || 'Product added', 'success');
      setProdName(''); setProdBrand(''); setProdColor(''); setProdFabric('');
      setProdPrice(''); setProdSizes(''); setProdDescription(''); setProdImages(null);
      fetchDashboard();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed to add product', 'danger'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await axios.post(`/api/admin/products/delete/${id}`);
      showFlash(res.data.success || 'Product deleted', 'success');
      fetchDashboard();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed to delete product', 'danger'); }
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '15px',
    border: 'none',
    boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
    marginBottom: '2rem',
    height: '100%',
  };
  const cardHeaderStyle = {
    background: 'white',
    borderBottom: '1px solid #f0f0f0',
    padding: '1.5rem',
    fontWeight: 700,
    fontSize: '1.2rem',
    borderRadius: '15px 15px 0 0',
    fontFamily: "'Outfit', sans-serif",
  };
  const cardBodyStyle = { padding: '1.5rem' };
  const formControlStyle = {
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '2px solid #e9ecef',
    transition: 'all 0.3s ease',
    width: '100%',
    fontSize: '0.95rem',
  };
  const formLabelStyle = { fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' };
  const btnPrimary = {
    background: 'linear-gradient(135deg, #2c3e50, #34495e)',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '10px',
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
  };
  const btnActionStyle = (bg) => ({
    width: '100%',
    marginBottom: '10px',
    padding: '1rem',
    borderRadius: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: bg,
    color: 'white',
    border: 'none',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
  });

  if (loading) return (
    <AdminPage active="dashboard">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#2c3e50' }} role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    </AdminPage>
  );

  return (
    <AdminPage active="dashboard">

      {/* Header */}
      <div className="row mb-5 g-3">
        <div className="col-md-8">
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }} className="display-6 fw-bold mb-0">Dashboard Overview</h1>
          <p className="text-muted">Manage your store inventory and settings</p>
        </div>
        <div className="col-md-4 text-md-end">
          <a href="/" target="_blank" className="btn btn-outline-primary">
            <i className="fas fa-external-link-alt me-2"></i>View Live Site
          </a>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="row mb-4">
        <div className="col-md-4">
          <Link to="/admin/orders" style={btnActionStyle('linear-gradient(135deg,#2c3e50,#34495e)')}>
            <i className="fas fa-shopping-bag"></i> Manage Orders
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/admin/returns" style={btnActionStyle('#e17055')}>
            <i className="fas fa-undo"></i> Manage Returns
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/admin/reviews" style={btnActionStyle('#0984e3')}>
            <i className="fas fa-star"></i> Reviews Mailbox
          </Link>
        </div>
      </div>

      {/* Category Management */}
      <div className="row mb-4 g-4">
        {/* Add Category */}
        <div className="col-md-4">
          <div style={cardStyle}>
            <div style={cardHeaderStyle}><i className="fas fa-folder-plus me-2"></i>Add Category</div>
            <div style={cardBodyStyle}>
              <form onSubmit={handleAddCategory}>
                <div className="mb-3">
                  <label style={formLabelStyle}>Category Name</label>
                  <input type="text" style={formControlStyle} placeholder="e.g. Summer Collection"
                    value={catName} onChange={e => setCatName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label style={formLabelStyle}>Category Image</label>
                  <input type="file" style={formControlStyle} accept="image/*"
                    onChange={e => setCatImage(e.target.files[0])} />
                </div>
                <button type="submit" style={btnPrimary}>Add Category</button>
              </form>
            </div>
          </div>
        </div>

        {/* Existing Categories */}
        <div className="col-md-8">
          <div style={cardStyle}>
            <div style={cardHeaderStyle}><i className="fas fa-list me-2"></i>Existing Categories</div>
            <div style={{ padding: 0 }}>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-hover mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th className="ps-4">Image</th>
                      <th>Name</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-4 text-muted">No categories found.</td></tr>
                    ) : categories.map(cat => (
                      <tr key={cat._id}>
                        <td className="ps-4">
                          {cat.image_url
                            ? <img src={cat.image_url} alt={cat.name} className="rounded" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                            : <div className="rounded bg-light d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}><i className="fas fa-image text-muted"></i></div>
                          }
                        </td>
                        <td className="fw-medium align-middle">{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</td>
                        <td className="text-end pe-4 align-middle">
                          <button className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => { setEditCatId(cat._id); setEditCatName(cat.name); setEditCatImage(null); }}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(cat._id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editCatId && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: '15px' }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ fontFamily: "'Outfit', sans-serif" }}>Edit Category</h5>
                <button type="button" className="btn-close" onClick={() => setEditCatId(null)}></button>
              </div>
              <form onSubmit={handleEditCategory}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label style={formLabelStyle}>Category Name</label>
                    <input type="text" style={formControlStyle} value={editCatName}
                      onChange={e => setEditCatName(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label style={formLabelStyle}>New Image (Optional)</label>
                    <input type="file" style={formControlStyle} accept="image/*"
                      onChange={e => setEditCatImage(e.target.files[0])} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditCatId(null)}>Cancel</button>
                  <button type="submit" style={{ ...btnPrimary, width: 'auto', padding: '0.6rem 1.5rem' }}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Product + Inventory */}
      <div className="row g-4">
        {/* Add Product */}
        <div className="col-lg-4">
          <div style={cardStyle}>
            <div style={cardHeaderStyle}><i className="fas fa-plus-circle me-2"></i>Add New Product</div>
            <div style={cardBodyStyle}>
              <form onSubmit={handleAddProduct}>
                <div className="mb-3">
                  <label htmlFor="prodName" style={formLabelStyle}>Product Name</label>
                  <input type="text" id="prodName" style={formControlStyle} value={prodName}
                    onChange={e => setProdName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="prodCategory" style={formLabelStyle}>Category</label>
                  <select id="prodCategory" style={formControlStyle} value={prodCategory}
                    onChange={e => setProdCategory(e.target.value)} required>
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>)}
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label style={formLabelStyle}>Brand</label>
                    <input type="text" style={formControlStyle} placeholder="Brand" value={prodBrand} onChange={e => setProdBrand(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label style={formLabelStyle}>Price (₹)</label>
                    <input type="number" step="0.01" style={formControlStyle} value={prodPrice} onChange={e => setProdPrice(e.target.value)} required />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label style={formLabelStyle}>Color</label>
                    <input type="text" style={formControlStyle} placeholder="Color" value={prodColor} onChange={e => setProdColor(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label style={formLabelStyle}>Fabric</label>
                    <input type="text" style={formControlStyle} placeholder="Fabric" value={prodFabric} onChange={e => setProdFabric(e.target.value)} />
                  </div>
                </div>
                <div className="mb-3">
                  <label style={formLabelStyle}>Return Policy</label>
                  <select style={formControlStyle} value={prodReturnPolicy} onChange={e => setProdReturnPolicy(e.target.value)} required>
                    <option value="Return Accepted">Return Accepted</option>
                    <option value="No Returns">No Returns</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label style={formLabelStyle}>Sizes &amp; Stock</label>
                  <input type="text" style={formControlStyle} placeholder="S:10, M:5" value={prodSizes} onChange={e => setProdSizes(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label style={formLabelStyle}>Product Images</label>
                  <input type="file" style={formControlStyle} accept="image/*" multiple onChange={e => setProdImages(e.target.files)} />
                </div>
                <div className="mb-3">
                  <label style={formLabelStyle}>Description</label>
                  <textarea style={{ ...formControlStyle, resize: 'vertical' }} rows="3" value={prodDescription} onChange={e => setProdDescription(e.target.value)} required></textarea>
                </div>
                <button type="submit" style={btnPrimary}>
                  <i className="fas fa-save me-2"></i>Save Product
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="col-lg-8">
          <div style={cardStyle}>
            <div style={{ ...cardHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><i className="fas fa-boxes me-2"></i>Inventory Management</span>
              <span className="badge bg-primary rounded-pill">{products.length} Products</span>
            </div>
            <div style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          <i className="fas fa-box-open fa-2x mb-2 d-block"></i>
                          No products found. Add your first product!
                        </td>
                      </tr>
                    ) : products.map(p => (
                      <tr key={p._id}>
                        <td className="ps-4 fw-medium align-middle">{p.name}</td>
                        <td className="align-middle"><span className="badge bg-light text-dark border">{p.category?.charAt(0).toUpperCase() + p.category?.slice(1)}</span></td>
                        <td className="align-middle">₹{Number(p.price).toLocaleString()}</td>
                        <td className="align-middle">
                          {p.stock > 0
                            ? <span className="badge" style={{ background: '#d1e7dd', color: '#0f5132', padding: '0.5em 1em' }}>In Stock ({p.stock})</span>
                            : <span className="badge" style={{ background: '#f8d7da', color: '#842029', padding: '0.5em 1em' }}>Out of Stock</span>
                          }
                        </td>
                        <td className="text-end pe-4 align-middle">
                          <Link to={`/admin/edit_product/${p._id}`} className="btn btn-sm btn-outline-primary me-1">
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button onClick={() => handleDeleteProduct(p._id)} className="btn btn-sm btn-outline-danger">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN ORDERS
───────────────────────────────────────────────────────────── */
export function AdminOrders() {
  const { showFlash } = useContext(FlashContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    axios.get('/api/admin/orders')
      .then(res => setOrders(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this order?')) return;
    try {
      const res = await axios.post(`/api/admin/orders/${id}/approve`);
      showFlash(res.data.success || 'Order approved', 'success');
      fetchOrders();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed', 'danger'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this order? Stock will be restored.')) return;
    try {
      const res = await axios.post(`/api/admin/orders/${id}/reject`);
      showFlash(res.data.success || 'Order rejected', 'success');
      fetchOrders();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed', 'danger'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await axios.post(`/api/admin/orders/${id}/status`, { status });
      showFlash(res.data.success || 'Status updated', 'success');
      fetchOrders();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed', 'danger'); }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending Approval': case 'Pending': return { background: '#fff3cd', color: '#856404' };
      case 'Processing': return { background: '#cff4fc', color: '#055160' };
      case 'Shipped': case 'Delivered': return { background: '#d1e7dd', color: '#0f5132' };
      default: return { background: '#f8d7da', color: '#842029' };
    }
  };

  const orderCardStyle = {
    background: 'white', borderRadius: '15px', border: 'none',
    boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '2rem',
    transition: 'transform 0.2s',
  };

  if (loading) return (
    <AdminPage active="orders">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#2c3e50' }} role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    </AdminPage>
  );

  return (
    <AdminPage active="orders">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="h2 fw-bold mb-0">Order Management</h1>
        <Link to="/admin" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-clipboard-list fa-4x text-muted mb-4 d-block opacity-25"></i>
          <h3 className="text-muted">No Orders Found</h3>
          <p className="text-muted">New orders will appear here.</p>
        </div>
      ) : orders.map(order => (
        <div key={order._id} style={orderCardStyle}>
          {/* Card Header */}
          <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '1.5rem', borderRadius: '15px 15px 0 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div className="d-flex gap-4 flex-wrap">
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Order ID</div>
                <div style={{ fontWeight: 600 }}>#{order.order_id || order._id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Date</div>
                <div style={{ fontWeight: 600 }}>{order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Total</div>
                <div style={{ fontWeight: 600, color: '#0d6efd' }}>₹{Number(order.total_amount || 0).toFixed(2)}</div>
              </div>
            </div>
            <span style={{ padding: '0.5em 1em', borderRadius: '30px', fontWeight: 600, fontSize: '0.85rem', ...getStatusClass(order.status) }}>
              {order.status}
            </span>
          </div>

          {/* Card Body */}
          <div style={{ padding: '1.5rem' }}>
            <div className="row g-4">
              {/* Customer */}
              <div className="col-md-4">
                <h6 className="fw-bold mb-3"><i className="fas fa-user-circle me-2"></i>Customer Details</h6>
                <div className="p-3 bg-light rounded-3">
                  <p className="mb-1 fw-bold">{order.shipping_details?.name}</p>
                  <p className="mb-1 text-muted small"><i className="fas fa-phone me-2"></i>{order.shipping_details?.phone}</p>
                  <p className="mb-0 text-muted small">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    {order.shipping_details?.address}<br />
                    <span className="ms-4">{order.shipping_details?.city}, {order.shipping_details?.zip}</span>
                  </p>
                </div>
              </div>
              {/* Items */}
              <div className="col-md-8">
                <h6 className="fw-bold mb-3"><i className="fas fa-box me-2"></i>Order Items</h6>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '10px', marginBottom: '0.5rem' }}>
                    {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }} />}
                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-bold">{item.name}</h6>
                      <small className="text-muted">Size: {item.size || 'Free'} | Qty: {item.quantity}</small>
                    </div>
                    <div className="fw-bold">₹{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
              <button 
                onClick={() => window.open(`/api/orders/${order._id}/delivery_slip`, '_blank')} 
                style={{ background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, padding: '0.6rem 1.2rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="fas fa-print me-2"></i>Print Delivery Slip
              </button>
              <div className="d-flex gap-2 flex-wrap">
                {(order.status === 'Pending Approval' || order.status === 'Pending') ? (
                  <>
                    <button onClick={() => handleApprove(order._id)} style={{ background: '#198754', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
                      <i className="fas fa-check me-2"></i>Approve
                    </button>
                    <button onClick={() => handleReject(order._id)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
                      <i className="fas fa-times me-2"></i>Reject
                    </button>
                  </>
                ) : order.status !== 'Rejected' && order.status !== 'Returned' && order.status !== 'Delivered' ? (
                  <div className="d-flex align-items-center gap-2">
                    <label className="fw-bold me-2 mb-0">Update Status:</label>
                    <select className="form-select w-auto" value={order.status} onChange={e => handleStatusChange(order._id, e.target.value)}>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </AdminPage>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN RETURNS
───────────────────────────────────────────────────────────── */
export function AdminReturns() {
  const { showFlash } = useContext(FlashContext);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = () => {
    setLoading(true);
    axios.get('/api/admin/returns')
      .then(res => setReturns(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReturns(); }, []);

  const handleApproveReturn = async (id) => {
    if (!window.confirm('Approve this return? Stock will be restored.')) return;
    try {
      const res = await axios.post(`/api/admin/orders/${id}/approve_return`);
      showFlash(res.data.success || 'Return approved', 'success');
      fetchReturns();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed', 'danger'); }
  };

  const handleRejectReturn = async (id) => {
    if (!window.confirm('Reject this return request?')) return;
    try {
      const res = await axios.post(`/api/admin/orders/${id}/reject_return`);
      showFlash(res.data.success || 'Return rejected', 'success');
      fetchReturns();
    } catch (err) { showFlash(err.response?.data?.error || 'Failed', 'danger'); }
  };

  const returnCardStyle = {
    background: 'white', borderRadius: '15px', border: 'none',
    boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '2rem',
    transition: 'transform 0.2s',
  };

  if (loading) return (
    <AdminPage active="returns">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#2c3e50' }} role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    </AdminPage>
  );

  return (
    <AdminPage active="returns">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="h2 fw-bold mb-0">Return Requests</h1>
        <Link to="/admin" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
        </Link>
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-undo fa-4x text-muted mb-4 d-block opacity-25"></i>
          <h3 className="text-muted">No Return Requests</h3>
          <p className="text-muted">Return requests will appear here.</p>
        </div>
      ) : returns.map(order => (
        <div key={order._id} style={returnCardStyle}>
          {/* Card Header */}
          <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '1.5rem', borderRadius: '15px 15px 0 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div className="d-flex gap-4 flex-wrap">
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Order ID</div>
                <div style={{ fontWeight: 600 }}>#{order.order_id || order._id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Date</div>
                <div style={{ fontWeight: 600 }}>{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Total</div>
                <div style={{ fontWeight: 600, color: '#0d6efd' }}>₹{Number(order.total_amount || 0).toFixed(2)}</div>
              </div>
            </div>
            <span style={{ padding: '0.5em 1em', borderRadius: '30px', fontWeight: 600, fontSize: '0.85rem', background: '#fff3cd', color: '#856404' }}>
              Return Requested
            </span>
          </div>

          {/* Card Body */}
          <div style={{ padding: '1.5rem' }}>
            <div className="row g-4">
              <div className="col-md-4">
                <h6 className="fw-bold mb-3"><i className="fas fa-user-circle me-2"></i>Customer Details</h6>
                <div className="p-3 bg-light rounded-3">
                  <p className="mb-1 fw-bold">{order.shipping_details?.name}</p>
                  <p className="mb-1 text-muted small"><i className="fas fa-phone me-2"></i>{order.shipping_details?.phone}</p>
                  <p className="mb-0 text-muted small">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    {order.shipping_details?.address}<br />
                    <span className="ms-4">{order.shipping_details?.city}, {order.shipping_details?.zip}</span>
                  </p>
                </div>
                {order.return_details && (
                  <div className="mt-3 p-3 bg-light rounded-3">
                    <p className="mb-1"><span className="fw-bold">Reason: </span>{order.return_details.reason}</p>
                    <p className="mb-1"><span className="fw-bold">Condition: </span>{order.return_details.condition}</p>
                    <p className="mb-0"><span className="fw-bold">Comments: </span>{order.return_details.comments}</p>
                  </div>
                )}
              </div>
              <div className="col-md-8">
                <h6 className="fw-bold mb-3"><i className="fas fa-box me-2"></i>Items to Return</h6>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '10px', marginBottom: '0.5rem' }}>
                    {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '8px', marginRight: '1rem' }} />}
                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-bold">{item.name}</h6>
                      <small className="text-muted">Size: {item.size || 'Free'} | Qty: {item.quantity}</small>
                    </div>
                    <div className="fw-bold">₹{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-top d-flex gap-2 justify-content-end">
              <button onClick={() => handleApproveReturn(order._id)} style={{ background: '#198754', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
                <i className="fas fa-check me-2"></i>Approve Return
              </button>
              <button onClick={() => handleRejectReturn(order._id)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
                <i className="fas fa-times me-2"></i>Reject Return
              </button>
            </div>
          </div>
        </div>
      ))}
    </AdminPage>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN REVIEWS
───────────────────────────────────────────────────────────── */
export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/reviews')
      .then(res => setReviews(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminPage active="reviews">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#2c3e50' }} role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    </AdminPage>
  );

  return (
    <AdminPage active="reviews">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="h2 fw-bold mb-0">Reviews Mailbox</h1>
          <p className="text-muted">Monitor customer feedback and reviews</p>
        </div>
        <Link to="/admin" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-star fa-4x text-muted mb-4 d-block opacity-25"></i>
          <h3 className="text-muted">No Reviews Yet</h3>
          <p className="text-muted">Customer reviews will appear here once they start coming in.</p>
        </div>
      ) : (
        <div className="row">
          {reviews.map(review => (
            <div key={review._id} className="col-lg-10 mx-auto">
              <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '1.5rem', padding: '1.5rem', transition: 'transform 0.2s' }}>
                <div className="d-flex gap-4 align-items-start">
                  {review.product_image ? (
                    <img src={review.product_image} alt="Product" className="d-none d-sm-block"
                      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
                  ) : (
                    <div className="d-none d-sm-block bg-light d-flex align-items-center justify-content-center"
                      style={{ width: 100, height: 100, borderRadius: '12px', flexShrink: 0 }}>
                      <i className="fas fa-image text-muted"></i>
                    </div>
                  )}
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 style={{ fontFamily: "'Outfit', sans-serif" }} className="mb-1">
                          <span className="text-muted fw-normal">Review for: </span>
                          {review.product_name || 'Unknown Product'}
                        </h5>
                        <div style={{ color: '#ffc107', fontSize: '1rem' }} className="mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <i key={i} className={i < review.rating ? 'fas fa-star' : 'far fa-star'}></i>
                          ))}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        <i className="far fa-clock me-1"></i>
                        {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div className="bg-light p-3 rounded-3 mb-3">
                      <p className="mb-0 text-dark">"{review.comment}"</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 32, height: 32, background: '#0d6efd', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                        {(review.user_name || 'U')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{review.user_name}</span>
                      {review.verified_purchase && (
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill ms-2">
                          <i className="fas fa-check-circle me-1"></i>Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPage>
  );
}

/* ─────────────────────────────────────────────────────────────
   SELLER SETTINGS
───────────────────────────────────────────────────────────── */
export function SellerSettings() {
  const { showFlash } = useContext(FlashContext);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('69.00');

  useEffect(() => {
    axios.get('/api/admin/settings')
      .then(res => {
        if (res.data) {
          const s = res.data;
          setCompanyName(s.company_name || '');
          setEmail(s.email || '');
          setPhone(s.phone || '');
          setApiKey(s.api_key || '');
          setAddress(s.address || '');
          setZipCode(s.zip_code || '');
          setDeliveryFee(String(s.standard_delivery_fee ?? '69.00'));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/settings/update', {
        company_name: companyName, email, phone, api_key: apiKey,
        address, zip_code: zipCode, standard_delivery_fee: deliveryFee,
      });
      showFlash(res.data.success || 'Settings updated', 'success');
    } catch (err) { showFlash(err.response?.data?.error || 'Update failed', 'danger'); }
  };

  const formControlStyle = { padding: '0.8rem 1rem', borderRadius: '10px', border: '2px solid #e9ecef', transition: 'all 0.3s ease', width: '100%', fontSize: '0.95rem' };
  const formLabelStyle = { fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' };

  if (loading) return (
    <AdminPage active="settings">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#2c3e50' }} role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    </AdminPage>
  );

  return (
    <AdminPage active="settings">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="display-6 fw-bold mb-0">Seller Settings</h1>
            <Link to="/admin" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </Link>
          </div>

          <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden', marginTop: '2rem' }}>
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '1.5rem', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Outfit', sans-serif" }}>
              <i className="fas fa-store me-2"></i>Store Configuration
            </div>
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleUpdate}>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="company_name" style={formLabelStyle}>Company Name</label>
                    <input type="text" id="company_name" style={formControlStyle} placeholder="Enter company name"
                      value={companyName} onChange={e => setCompanyName(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="email" style={formLabelStyle}>Contact Email</label>
                    <input type="email" id="email" style={formControlStyle} placeholder="Enter contact email"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-12">
                    <label htmlFor="phone" style={formLabelStyle}>Contact Phone</label>
                    <input type="tel" id="phone" style={formControlStyle} placeholder="Enter contact phone"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="address" style={formLabelStyle}>Store Address</label>
                  <textarea id="address" style={{ ...formControlStyle, resize: 'vertical' }} rows="3"
                    placeholder="Enter your full store address" value={address} onChange={e => setAddress(e.target.value)} required></textarea>
                  <div className="form-text">This address will be displayed to customers.</div>
                </div>
                <div className="mb-4">
                  <label htmlFor="zip_code" style={formLabelStyle}>Zip Code</label>
                  <input type="text" id="zip_code" style={formControlStyle} placeholder="Enter store zip code"
                    value={zipCode} onChange={e => setZipCode(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label htmlFor="delivery_fee" style={formLabelStyle}>Standard Static Delivery Fee (₹)</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input type="number" step="0.01" id="delivery_fee"
                      style={{ ...formControlStyle, borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
                      placeholder="69.00" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} required />
                  </div>
                  <div className="form-text">This static delivery fee will be applied once per order.</div>
                </div>
                <div className="d-grid">
                  <button type="submit" style={{ background: 'linear-gradient(135deg,#2c3e50,#34495e)', border: 'none', padding: '0.8rem 2rem', borderRadius: '10px', fontWeight: 600, color: 'white', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <i className="fas fa-save me-2"></i>Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN EDIT PRODUCT
───────────────────────────────────────────────────────────── */
export function AdminEditProduct() {
  const { id } = useParams();
  const { showFlash } = useContext(FlashContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [fabric, setFabric] = useState('');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [sizes, setSizes] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('Return Accepted');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState(null);

  useEffect(() => {
    setLoading(true);
    const p1 = axios.get('/api/admin/dashboard').then(res => setCategories(res.data.categories || []));
    const p2 = axios.get(`/api/products/${id}`).then(res => {
      const p = res.data.product;
      setName(p.name || ''); setCategory(p.category || ''); setBrand(p.brand || '');
      setFabric(p.fabric || ''); setColor(p.color || ''); setPrice(String(p.price || ''));
      setReturnPolicy(p.return_policy || 'Return Accepted'); setDescription(p.description || '');
      if (p.sizes && Array.isArray(p.sizes)) setSizes(p.sizes.map(s => `${s.size}:${s.stock}`).join(', '));
    });
    Promise.all([p1, p2]).catch(() => navigate('/admin')).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', name); fd.append('category', category); fd.append('brand', brand);
    fd.append('fabric', fabric); fd.append('color', color); fd.append('price', price);
    fd.append('sizes', sizes); fd.append('return_policy', returnPolicy); fd.append('description', description);
    if (images) for (const f of images) fd.append('images', f);
    try {
      const res = await axios.post(`/api/admin/products/edit/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showFlash(res.data.success || 'Product updated', 'success');
      navigate('/admin');
    } catch (err) { showFlash(err.response?.data?.error || 'Update failed', 'danger'); }
  };

  const formControlStyle = { padding: '0.8rem 1rem', borderRadius: '10px', border: '2px solid #e9ecef', transition: 'all 0.3s ease', width: '100%', fontSize: '0.95rem' };
  const formLabelStyle = { fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' };

  if (loading) return (
    <AdminPage active="dashboard">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#2c3e50' }} role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    </AdminPage>
  );

  return (
    <AdminPage active="dashboard">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="h2 fw-bold mb-0">Edit Product</h1>
            <Link to="/admin" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
            </Link>
          </div>

          <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
            <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '1.5rem', fontWeight: 700, fontSize: '1.2rem', borderRadius: '15px 15px 0 0', fontFamily: "'Outfit', sans-serif" }}>
              <i className="fas fa-edit me-2"></i>Product Details
            </div>
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="ep_name" style={formLabelStyle}>Product Name</label>
                  <input type="text" id="ep_name" style={formControlStyle} value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="ep_cat" style={formLabelStyle}>Category</label>
                  <select id="ep_cat" style={formControlStyle} value={category} onChange={e => setCategory(e.target.value)} required>
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>)}
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label style={formLabelStyle}>Brand</label>
                    <input type="text" style={formControlStyle} placeholder="e.g. Nike" value={brand} onChange={e => setBrand(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label style={formLabelStyle}>Price (₹)</label>
                    <input type="number" step="0.01" style={formControlStyle} value={price} onChange={e => setPrice(e.target.value)} required />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label style={formLabelStyle}>Color</label>
                    <input type="text" style={formControlStyle} placeholder="Color" value={color} onChange={e => setColor(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label style={formLabelStyle}>Fabric</label>
                    <input type="text" style={formControlStyle} placeholder="Fabric" value={fabric} onChange={e => setFabric(e.target.value)} />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="ep_rp" style={formLabelStyle}>Return Policy</label>
                  <select id="ep_rp" style={formControlStyle} value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)} required>
                    <option value="Return Accepted">Return Accepted</option>
                    <option value="No Returns">No Returns</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="ep_sizes" style={formLabelStyle}>Sizes &amp; Stock</label>
                  <input type="text" id="ep_sizes" style={formControlStyle} placeholder="S:10, M:5" value={sizes} onChange={e => setSizes(e.target.value)} required />
                  <div className="form-text">Format: Size:Quantity (comma separated). Update this to change stock levels.</div>
                </div>
                <div className="mb-3">
                  <label style={formLabelStyle}>Product Images (Leave empty to keep current)</label>
                  <input type="file" style={formControlStyle} accept="image/*" multiple onChange={e => setImages(e.target.files)} />
                </div>
                <div className="mb-3">
                  <label style={formLabelStyle}>Description</label>
                  <textarea style={{ ...formControlStyle, resize: 'vertical' }} rows="5" value={description} onChange={e => setDescription(e.target.value)} required></textarea>
                </div>
                <button type="submit" style={{ background: 'linear-gradient(135deg,#2c3e50,#34495e)', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', fontWeight: 600, color: 'white', width: '100%', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                  <i className="fas fa-save me-2"></i>Update Product
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
