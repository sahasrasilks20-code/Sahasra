import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { UserContext, CartContext, FlashContext } from '../App.jsx';

export default function Home() {
  const { user } = useContext(UserContext);
  const { cart, setCart } = useContext(CartContext);
  const { showFlash } = useContext(FlashContext);
  
  const [searchParams, setSearchParams] = useSearchParams();

  // API State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Active Query Parameters
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const q = searchParams.get('q') || '';

  // Hero Background Images Cycling
  const heroImages = [
    '/static/images/11.png',
    '/static/images/22.png',
    '/static/images/33.png'
  ];
  const [heroImgSrc, setHeroImgSrc] = useState('/static/images/11.png');

  useEffect(() => {
    // Set initial random image
    const initialIndex = Math.floor(Math.random() * heroImages.length);
    setHeroImgSrc(heroImages[initialIndex]);

    // Cycle image every 3 seconds
    let currentIndex = initialIndex;
    const interval = setInterval(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * heroImages.length);
      } while (newIndex === currentIndex && heroImages.length > 1);
      currentIndex = newIndex;
      setHeroImgSrc(heroImages[newIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Products & Filter Options from Backend
  useEffect(() => {
    setLoading(true);
    const params = { q, category, brand, page };
    axios.get('/api/products', { params })
      .then(res => {
        setProducts(res.data.products || []);
        setCategories(res.data.categories || []);
        setBrands(res.data.brands || []);
        setTotalPages(res.data.total_pages || 1);
        setCurrentPage(res.data.current_page || 1);
      })
      .catch(err => {
        console.error('Fetch products failed:', err);
      })
      .finally(() => setLoading(false));
  }, [category, brand, page, q]);

  // Handle category update
  const handleCategorySelect = (catName) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    newParams.delete('brand'); // Clear brand when changing category
    if (catName) {
      newParams.set('category', catName);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  // Handle brand update
  const handleBrandSelect = (brandName) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    if (brandName === brand) {
      // Toggle off if clicked again
      newParams.delete('brand');
    } else {
      newParams.set('brand', brandName);
    }
    setSearchParams(newParams);
  };

  // Instant Add to Cart (using default size and color)
  const handleAddToCart = (product) => {
    // Default size and color
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

    // Check if already in cart
    const existingIndex = cart.findIndex(
      item => item.product_id === cartItem.product_id && item.size === cartItem.size
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

  // Add to Wishlist
  const handleAddToWishlist = async (productId) => {
    if (!user) {
      showFlash('Please log in to add items to wishlist.', 'warning');
      return;
    }
    try {
      await axios.post(`/api/wishlist/add/${productId}`);
      showFlash('Added to wishlist!', 'success');
    } catch (err) {
      showFlash(err.response?.data?.error || 'Wishlist update failed', 'danger');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <img src={heroImgSrc} alt="Hero Background" className="hero-bg" id="hero-image" />
        <div className="hero-overlay" style={{ background: 'rgba(0, 0, 0, 0.35)' }}></div>
        <div className="hero-content">
          <h1 className="hero-title">Six Yards of Pure Grace</h1>
          <p className="hero-subtitle">Discover our exquisite collection of handwoven Kanchipuram, Banarasi, and Chanderi pure silk sarees crafted for your most cherished moments.</p>
          <a href="#shop-section" className="hero-btn">Explore Collection</a>
        </div>
      </section>

      <div className="container py-5">
        {/* Categories Circle list */}
        {!category && (
          <>
            <div className="section-header mb-4">
              <h2 className="section-title">Shop by Category</h2>
            </div>
            <div className="d-flex flex-wrap justify-content-center gap-4 gap-md-5 mb-5">
              {categories.map((cat, idx) => (
                <div key={idx} className="text-center" style={{ width: '100px' }}>
                  <button 
                    onClick={() => handleCategorySelect(cat.name)} 
                    className="border-0 bg-transparent text-decoration-none d-block category-item p-0 w-100"
                  >
                    <div className="category-circle mb-2">
                      <img src={cat.image_url} alt={cat.name} onError={(e) => { e.target.src = '/static/images/banarasi.png' }} />
                    </div>
                    <span className="category-name text-dark fw-medium text-capitalize">{cat.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Shop Grid Section */}
        <div id="shop-section">
          {category ? (
            /* Filter Toolbar */
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <button onClick={() => handleCategorySelect('')} className="btn btn-outline btn-sm">
                  <i className="fas fa-arrow-left me-2"></i> Back
                </button>
                <h2 className="h4 mb-0 text-capitalize">{category}</h2>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <span className="text-muted small">Filter by:</span>
                {brands.slice(0, 3).map((b, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleBrandSelect(b)}
                    className={`btn btn-sm ${brand === b ? 'btn-dark' : 'btn-outline'}`}
                  >
                    {b.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Featured Products Header */
            <div className="section-header mt-5">
              <h2 className="section-title">Featured Products</h2>
              <span className="text-decoration-underline ms-3" style={{ cursor: 'pointer' }} onClick={() => handleCategorySelect('')}>View All</span>
            </div>
          )}

          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-dark" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 border">
              <h4 className="text-muted fw-light">No products found matching your filter.</h4>
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="row g-4">
                {products.map(product => (
                  <div key={product._id} className="col-lg-3 col-md-4 col-6">
                    <div className="product-card">
                      <div className="product-img-wrapper">
                        <Link to={`/product/${product._id}`}>
                          <img src={product.image_url} alt={product.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400' }} />
                        </Link>
                        <div className="product-actions">
                          <button onClick={() => handleAddToCart(product)} className="action-btn" title="Add to Cart">
                            <i className="fas fa-shopping-bag"></i>
                          </button>
                          <button onClick={() => handleAddToWishlist(product._id)} className="action-btn" title="Wishlist">
                            <i className="fas fa-heart"></i>
                          </button>
                          <Link to={`/product/${product._id}`} className="action-btn" title="View">
                            <i className="fas fa-eye"></i>
                          </Link>
                        </div>
                      </div>
                      <div className="product-details text-start p-0">
                        <h3 className="product-title">
                          <Link to={`/product/${product._id}`}>{product.name}</Link>
                        </h3>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="product-price">₹{product.price}</span>
                          <div className="text-warning small">
                            <i className="fas fa-star"></i> {product.average_rating ? Number(product.average_rating).toFixed(1) : '0.0'}
                            <span className="text-muted"> ({product.review_count || 0})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                            onClick={() => {
                              const newParams = new URLSearchParams(searchParams);
                              newParams.set('page', String(currentPage - 1));
                              setSearchParams(newParams);
                            }}
                          >
                            &laquo;
                          </button>
                        </li>
                      )}

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const p = idx + 1;
                        return (
                          <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
                            <button 
                              className={`page-link border-0 ${p === currentPage ? 'fw-bold text-dark' : 'text-muted'}`}
                              onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.set('page', String(p));
                                setSearchParams(newParams);
                              }}
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
                            onClick={() => {
                              const newParams = new URLSearchParams(searchParams);
                              newParams.set('page', String(currentPage + 1));
                              setSearchParams(newParams);
                            }}
                          >
                            &raquo;
                          </button>
                        </li>
                      )}
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
