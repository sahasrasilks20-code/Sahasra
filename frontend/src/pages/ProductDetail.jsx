import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext, CartContext, FlashContext } from '../App.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const { cart, setCart } = useContext(CartContext);
  const { showFlash } = useContext(FlashContext);
  const navigate = useNavigate();

  // Detail State
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Fetch Product Details
  useEffect(() => {
    setLoading(true);
    axios.get(`/api/products/${id}`)
      .then(res => {
        const prod = res.data.product;
        setProduct(prod);
        setReviews(res.data.reviews || []);
        
        // Select defaults
        if (prod.sizes && prod.sizes.length > 0) {
          const firstSize = prod.sizes[0];
          setSelectedSize(typeof firstSize === 'object' ? firstSize.size : firstSize);
        }
        if (prod.colors && prod.colors.length > 0) {
          setSelectedColor(prod.colors[0]);
        } else if (prod.color) {
          setSelectedColor(prod.color);
        }
      })
      .catch(err => {
        console.error('Fetch product detail failed:', err);
        showFlash('Product not found.', 'danger');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Handle Add to Cart
  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showFlash('Please select a size.', 'warning');
      return;
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      showFlash('Please select a color.', 'warning');
      return;
    }

    const cartItem = {
      product_id: product._id.toString(),
      quantity: 1,
      size: selectedSize || null,
      color: selectedColor || null
    };

    // Sync to cart context state
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

  // Handle Buy Now
  const handleBuyNow = (e) => {
    e.preventDefault();
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showFlash('Please select a size.', 'warning');
      return;
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      showFlash('Please select a color.', 'warning');
      return;
    }

    const cartItem = {
      product_id: product._id.toString(),
      quantity: 1,
      size: selectedSize || null,
      color: selectedColor || null
    };

    // Add to cart state
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
    
    // Redirect to checkout
    navigate('/checkout');
  };

  // Add to Wishlist
  const handleAddToWishlist = async () => {
    if (!user) {
      showFlash('Please log in to add items to wishlist.', 'warning');
      return;
    }
    try {
      await axios.post(`/api/wishlist/add/${product._id}`);
      showFlash('Added to wishlist!', 'success');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Wishlist update failed', 'danger');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="container mt-5 mb-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/" className="text-muted text-decoration-none">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/?category=${product.category}`} className="text-muted text-decoration-none text-capitalize">
              {product.category}
            </Link>
          </li>
          <li className="breadcrumb-item active text-capitalize" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="row g-5">
        {/* Product Image */}
        <div className="col-md-6">
          <div className="product-img-wrapper" style={{ height: 'auto', aspectRatio: '3/4' }}>
            <img src={product.image_url} alt={product.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/600x800' }} />
          </div>
        </div>

        {/* Product Info */}
        <div className="col-md-6">
          <h1 className="display-5 fw-bold mb-3 text-capitalize">{product.name}</h1>

          <div className="d-flex align-items-center mb-4">
            <span className="h2 mb-0 me-3">₹{product.price}</span>
            {product.stock > 0 ? (
              <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">In Stock</span>
            ) : (
              <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">Out of Stock</span>
            )}

            <div className="ms-auto text-warning small">
              {product.average_rating > 0 ? (
                <>
                  <i className="fas fa-star me-1"></i>
                  {Number(product.average_rating).toFixed(1)}
                  <span className="text-muted"> ({product.review_count || 0} reviews)</span>
                </>
              ) : (
                <span className="text-muted">No reviews yet</span>
              )}
            </div>
          </div>

          <p className="text-muted mb-4 lead" style={{ fontSize: '1rem' }}>{product.description}</p>

          <div className="mb-4 p-3 bg-light rounded-3">
            <div className="row g-2">
              <div className="col-6">
                <small class="text-muted d-block">Brand</small>
                <span className="fw-medium text-capitalize">{product.brand || 'Sahasra'}</span>
              </div>
              <div className="col-6">
                <small class="text-muted d-block">Fabric</small>
                <span className="fw-medium text-capitalize">{product.fabric || 'Pure Silk'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddToCart}>
            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <label className="form-label fw-medium mb-2">Select Size</label>
                <div className="d-flex flex-wrap gap-2">
                  {product.sizes.map(s => {
                    const sVal = typeof s === 'object' ? s.size : s;
                    return (
                      <div key={sVal} className="position-relative">
                        <input 
                          type="radio" 
                          name="size" 
                          id={`size-${sVal}`} 
                          value={sVal} 
                          required 
                          className="btn-check" 
                          checked={selectedSize === sVal}
                          onChange={(e) => setSelectedSize(e.target.value)}
                        />
                        <label htmlFor={`size-${sVal}`} className="btn btn-outline-dark px-3">{sVal}</label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-4">
                <label className="form-label fw-medium mb-2">Select Color</label>
                <div className="d-flex flex-wrap gap-2">
                  {product.colors.map(c => (
                    <div key={c} className="position-relative">
                      <input 
                        type="radio" 
                        name="color" 
                        id={`color-${c}`} 
                        value={c} 
                        required 
                        className="btn-check"
                        checked={selectedColor === c}
                        onChange={(e) => setSelectedColor(e.target.value)}
                      />
                      <label htmlFor={`color-${c}`} className="btn btn-outline-dark px-3 text-capitalize">{c}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="d-flex flex-column gap-3 mt-5">
              <div className="d-flex gap-3 w-100">
                <button 
                  type="submit" 
                  className="btn btn-outline-dark btn-lg flex-grow-1" 
                  disabled={product.stock === 0}
                >
                  <i className="fas fa-shopping-bag me-2"></i> Add to Cart
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-dark btn-lg px-4" 
                  title="Add to Wishlist"
                  onClick={handleAddToWishlist}
                >
                  <i className="far fa-heart"></i>
                </button>
              </div>
              <button 
                type="button" 
                className="btn btn-dark btn-lg w-100 py-3 text-uppercase" 
                style={{ fontWeight: 600, letterSpacing: '0.5px' }}
                disabled={product.stock === 0}
                onClick={handleBuyNow}
              >
                ⚡ Buy Now
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-5 pt-5 border-top">
        <h3 className="h4 mb-4">Customer Reviews</h3>
        {reviews.length > 0 ? (
          <div className="row g-4">
            {reviews.map(review => (
              <div key={review._id} className="col-md-6">
                <div className="card bg-light p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="mb-1 fw-bold">{review.user_name}</h6>
                      <small className="text-muted">
                        {new Date(review.created_at).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                      </small>
                    </div>
                    <div className="text-warning small">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <i key={idx} className={`${idx < review.rating ? 'fas' : 'far'} fa-star`}></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-muted mb-0">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-light rounded-3 mb-4">
            <p className="text-muted mb-3">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}
