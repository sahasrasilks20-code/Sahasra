import express from 'express';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import cors from 'cors';
import session from 'express-session';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static assets from local static directory
app.use('/static', express.static(path.join(__dirname, './static')));

// Enable CORS
app.use(cors({
  origin: true, // Allow requests from any origin (React Vite development port 5173, etc.)
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Configuration (matches Flask Session cookie behavior)
app.use(session({
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    secure: false,
    httpOnly: true
  }
}));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
let client;
let db;

async function initDB() {
  try {
    const kwargs = {};
    if (MONGO_URI.includes('mongodb+srv') || MONGO_URI.toLowerCase().includes('ssl=true') || MONGO_URI.toLowerCase().includes('tls=true')) {
      // Dynamic TLS support for remote Atlas instances
    }
    client = new MongoClient(MONGO_URI, kwargs);
    await client.connect();
    db = client.db('silks');
    console.log('Successfully connected to MongoDB at:', MONGO_URI);

    // Initialize collections and performance indexes lazily (equivalent to init_db_once in app.py)
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);

    const requiredCols = ['users', 'products', 'orders', 'reviews', 'wishlist', 'categories', 'user_activity', 'settings'];
    for (const col of requiredCols) {
      if (!colNames.includes(col)) {
        await db.createCollection(col);
      }
    }

    // Create performance indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ brand: 1 });
    await db.collection('products').createIndex({ price: 1 });
    await db.collection('products').createIndex({ 'sizes.size': 1 });
    await db.collection('products').createIndex({ color: 1 });
    await db.collection('products').createIndex({ fabric: 1 });
    await db.collection('orders').createIndex({ user_id: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ 'items.product_id': 1 });
    await db.collection('orders').createIndex({ user_id: 1, created_at: -1 });
    await db.collection('reviews').createIndex({ product_id: 1 });
    await db.collection('reviews').createIndex({ user_id: 1 });
    await db.collection('wishlist').createIndex({ user_id: 1 });
    await db.collection('categories').createIndex({ name: 1 }, { unique: true });
    await db.collection('user_activity').createIndex({ user_id: 1, type: 1, timestamp: -1 });

  } catch (err) {
    console.error('MongoDB initialization failed:', err);
  }
}

// Multer in-memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Password Cryptography Helpers (100% compatible with Flask/Werkzeug scrypt and pbkdf2 formats)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256').toString('hex');
  return `pbkdf2:sha256:600000$${salt}$${hash}`;
}

function verifyPassword(plainPassword, passwordHash) {
  if (!passwordHash) return false;
  if (!passwordHash.includes('$')) {
    return plainPassword === passwordHash; // Plaintext fallback
  }

  const parts = passwordHash.split('$');
  if (parts.length < 3) return false;

  const methodPart = parts[0];
  const salt = parts[1];
  const hash = parts[2];
  const methodParts = methodPart.split(':');
  const mainMethod = methodParts[0];

  if (mainMethod === 'pbkdf2') {
    const subMethod = methodParts[1] || 'sha256';
    const iterations = parseInt(methodParts[2] || '600000', 10);
    const derivedKey = crypto.pbkdf2Sync(
      plainPassword,
      salt,
      iterations,
      hash.length / 2,
      subMethod
    );
    return derivedKey.toString('hex') === hash;
  } else if (mainMethod === 'scrypt') {
    try {
      const n = parseInt(methodParts[1] || '32768', 10);
      const r = parseInt(methodParts[2] || '8', 10);
      const p = parseInt(methodParts[3] || '1', 10);
      // Werkzeug uses base64-encoded salt; Node.js scryptSync needs the raw buffer
      let saltBuffer;
      try {
        saltBuffer = Buffer.from(salt, 'base64');
        // Validate it decoded properly (base64 decodes to something reasonable)
        if (saltBuffer.length < 8) throw new Error('Salt too short');
      } catch {
        saltBuffer = Buffer.from(salt, 'utf-8');
      }
      const keyLen = hash.length / 2;
      const derivedKey = crypto.scryptSync(plainPassword, saltBuffer, keyLen, { N: n, r, p });
      return derivedKey.toString('hex') === hash;
    } catch (e) {
      // Fallback: try with raw string salt (for our own generated scrypt hashes)
      try {
        const n = parseInt(methodParts[1] || '32768', 10);
        const r = parseInt(methodParts[2] || '8', 10);
        const p = parseInt(methodParts[3] || '1', 10);
        const derivedKey = crypto.scryptSync(plainPassword, salt, hash.length / 2, { N: n, r, p });
        return derivedKey.toString('hex') === hash;
      } catch { return false; }
    }
  }
  return false;
}

// Admin seeding endpoint - creates/resets admin user with Node.js compatible password
app.post('/api/seed-admin', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== 'sahasra-seed-2024') {
      return res.status(403).json({ error: 'Invalid seed secret' });
    }
    const adminEmail = 'sahasrasilks20@gmail.com';
    const adminPassword = 'Harsha@123';
    const hashedPassword = hashPassword(adminPassword);
    await db.collection('users').updateOne(
      { email: adminEmail },
      { $set: { name: 'Sahasra Admin', email: adminEmail, password: hashedPassword, role: 'admin' } },
      { upsert: true }
    );
    res.json({ success: `Admin account created/updated. Email: ${adminEmail} | Password: ${adminPassword}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Middleware
function requireAuth(req, res, next) {
  if (!req.session.user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user_id || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

// ==========================================
// 1. ASSET / IMAGE STREAMING (GridFS Bucket)
// ==========================================
app.get('/image/:id', async (req, res) => {
  try {
    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    const id = new ObjectId(req.params.id);
    const files = await db.collection('fs.files').find({ _id: id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('Image not found');
    }
    const file = files[0];
    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.pipe(res);
  } catch (err) {
    res.status(404).send('Image not found');
  }
});

// ==========================================
// 2. AUTHENTICATION ENDPOINTS
// ==========================================
app.post(['/register', '/api/register'], async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const totalUsers = await db.collection('users').countDocuments({});
    const role = totalUsers === 0 ? 'admin' : 'customer';

    const newUser = {
      name,
      email,
      password: hashPassword(password),
      role
    };

    await db.collection('users').insertOne(newUser);
    res.json({ success: 'Registration successful! Please login.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/login', '/api/login'], async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });
    if (user && verifyPassword(password, user.password)) {
      req.session.user_id = user._id.toString();
      req.session.user_name = user.name;
      req.session.role = user.role || 'customer';
      res.json({
        user_id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'customer'
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/logout', '/api/logout'], (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: 'Successfully logged out' });
  });
});

app.get('/api/current_user', (req, res) => {
  if (req.session.user_id) {
    res.json({
      user_id: req.session.user_id,
      name: req.session.user_name,
      role: req.session.role
    });
  } else {
    res.json(null);
  }
});

// ==========================================
// 3. CATALOGUE / PRODUCTS SEARCH & FILTERS
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const query = {};
    const search_query = req.query.q || '';
    if (search_query) {
      const terms = search_query.split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        const and_conditions = [];
        for (const term of terms) {
          const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regexObj = { $regex: escaped, $options: 'i' };
          and_conditions.push({
            $or: [
              { name: regexObj },
              { description: regexObj },
              { brand: regexObj },
              { category: regexObj },
              { color: regexObj },
              { fabric: regexObj },
              { 'sizes.size': regexObj }
            ]
          });
        }
        query.$and = and_conditions;
      }

      // Track Search Activity in background
      if (req.session.user_id) {
        db.collection('user_activity').insertOne({
          user_id: req.session.user_id,
          type: 'search',
          query: search_query,
          timestamp: new Date()
        }).catch(e => console.error(e));
      }
    }

    // Sidebar Filters
    if (req.query.category) query.category = req.query.category;
    if (req.query.brand) query.brand = req.query.brand;
    if (req.query.color) query.color = req.query.color;
    if (req.query.fabric) query.fabric = req.query.fabric;
    if (req.query.size) query['sizes.size'] = req.query.size;

    // Sorting
    const sort_by = req.query.sort || 'newest';
    let sort_criteria = { _id: -1 };
    if (sort_by === 'price_asc') sort_criteria = { price: 1 };
    else if (sort_by === 'price_desc') sort_criteria = { price: -1 };

    // Pagination
    const page = parseInt(req.query.page || '1', 10);
    const per_page = 12;
    const skip = (page - 1) * per_page;

    const total_products = await db.collection('products').countDocuments(query);
    const total_pages = Math.ceil(total_products / per_page);

    const products = await db.collection('products')
      .find(query)
      .sort(sort_criteria)
      .skip(skip)
      .limit(per_page)
      .toArray();

    // Batch query reviews to avoid N+1 queries (identical to homepage optimization)
    const product_ids = products.map(p => p._id.toString());
    const all_reviews = await db.collection('reviews').find({ product_id: { $in: product_ids } }).toArray();

    const reviews_by_product = {};
    for (const r of all_reviews) {
      if (r.product_id) {
        if (!reviews_by_product[r.product_id]) reviews_by_product[r.product_id] = [];
        reviews_by_product[r.product_id].push(r);
      }
    }

    for (const p of products) {
      const p_id = p._id.toString();
      const product_reviews = reviews_by_product[p_id] || [];
      if (product_reviews.length > 0) {
        const sum = product_reviews.reduce((acc, r) => acc + r.rating, 0);
        p.average_rating = parseFloat((sum / product_reviews.length).toFixed(1));
        p.review_count = product_reviews.length;
      } else {
        p.average_rating = 0;
        p.review_count = 0;
      }
    }

    // Sidebar metadata options
    const sidebar_query = {};
    if (req.query.category) sidebar_query.category = req.query.category;

    const distinct_categories = await db.collection('products').distinct('category');
    const categories_metadata = await db.collection('categories').find({ name: { $in: distinct_categories } }).toArray();

    const categories = distinct_categories.filter(c => c !== 'Clothing').map(cat_name => {
      const meta = categories_metadata.find(m => m.name === cat_name);
      return {
        name: cat_name,
        image_url: meta?.image_url || `https://via.placeholder.com/300x200?text=${encodeURIComponent(cat_name)}`
      };
    });

    const brands = await db.collection('products').distinct('brand', sidebar_query);
    const colors = await db.collection('products').distinct('color', sidebar_query);
    const fabrics = await db.collection('products').distinct('fabric', sidebar_query);
    const sizes = await db.collection('products').distinct('sizes.size', sidebar_query);

    res.json({
      products,
      categories,
      brands,
      colors,
      fabrics,
      sizes,
      total_products,
      total_pages,
      current_page: page
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recommendations Algorithm (Batch Optimized, identical logic to python helper)
app.get('/api/recommendations', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) return res.json([]);

    const recent_orders = await db.collection('orders').find({ user_id }).sort({ created_at: -1 }).limit(5).toArray();
    const recent_searches = await db.collection('user_activity').find({ user_id, type: 'search' }).sort({ timestamp: -1 }).limit(5).toArray();

    const preferred_categories = new Set();
    const product_ids = new Set();
    for (const order of recent_orders) {
      for (const item of order.items) {
        product_ids.add(item.product_id);
      }
    }

    if (product_ids.size > 0) {
      const obj_ids = [];
      for (const pid of product_ids) {
        try { obj_ids.push(new ObjectId(pid)); } catch (e) {}
      }
      if (obj_ids.length > 0) {
        const products = await db.collection('products').find({ _id: { $in: obj_ids } }, { projection: { category: 1 } }).toArray();
        for (const p of products) {
          preferred_categories.add(p.category);
        }
      }
    }

    // Searches matching
    const all_cats = (await db.collection('categories').find({}, { projection: { name: 1 } }).toArray()).map(c => c.name);
    for (const activity of recent_searches) {
      const query = activity.query.toLowerCase();
      for (const cat of all_cats) {
        if (query.includes(cat.toLowerCase())) {
          preferred_categories.add(cat);
        }
      }
    }

    let recommendations = [];
    if (preferred_categories.size > 0) {
      recommendations = await db.collection('products').find({
        category: { $in: Array.from(preferred_categories) },
        stock: { $gt: 0 }
      }).limit(8).toArray();
    }

    if (recommendations.length < 4) {
      const popular = await db.collection('products').find({ stock: { $gt: 0 } }).limit(8).toArray();
      recommendations = [...recommendations, ...popular];
    }

    // Deduplicate
    const seen = new Set();
    const unique_recs = [];
    for (const p of recommendations) {
      const p_id = p._id.toString();
      if (!seen.has(p_id)) {
        unique_recs.push(p);
        seen.add(p_id);
      }
    }

    res.json(unique_recs.slice(0, 4));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    let id;
    try { id = new ObjectId(req.params.id); } catch (e) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await db.collection('products').findOne({ _id: id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Category recommendations
    const recommendations = await db.collection('products').find({
      category: product.category,
      _id: { $ne: id }
    }).limit(4).toArray();

    // Reviews
    const reviews = await db.collection('reviews').find({ product_id: req.params.id }).sort({ created_at: -1 }).toArray();
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      product.average_rating = parseFloat((sum / reviews.length).toFixed(1));
      product.review_count = reviews.length;
    } else {
      product.average_rating = 0;
      product.review_count = 0;
    }

    // Check if user is eligible to write a review
    let can_review = false;
    if (req.session.user_id) {
      const has_purchased = await db.collection('orders').findOne({
        user_id: req.session.user_id,
        'items.product_id': req.params.id,
        status: 'Delivered'
      });
      const has_reviewed = await db.collection('reviews').findOne({
        user_id: req.session.user_id,
        product_id: req.params.id
      });
      if (has_purchased && !has_reviewed) {
        can_review = true;
      }
    }

    res.json({ product, recommendations, reviews, can_review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Write Review
app.post('/api/products/:id/review', requireAuth, async (req, res) => {
  try {
    const product_id = req.params.id;
    const { rating, comment } = req.body;
    const user_id = req.session.user_id;
    const user_name = req.session.user_name;

    const has_purchased = await db.collection('orders').findOne({
      user_id,
      'items.product_id': product_id,
      status: 'Delivered'
    });

    if (!has_purchased) {
      return res.status(400).json({ error: 'You can only review products you have purchased and received.' });
    }

    const has_reviewed = await db.collection('reviews').findOne({ user_id, product_id });
    if (has_reviewed) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    const review = {
      product_id,
      user_id,
      user_name,
      rating: parseInt(rating, 10),
      comment,
      created_at: new Date()
    };

    await db.collection('reviews').insertOne(review);
    res.json({ success: 'Review submitted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. WISHLIST MANAGEMENT
// ==========================================
app.get('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const user_wishlist = await db.collection('wishlist').findOne({ user_id });
    if (user_wishlist && user_wishlist.products && user_wishlist.products.length > 0) {
      const pids = [];
      for (const pid of user_wishlist.products) {
        try { pids.push(new ObjectId(pid)); } catch (e) {}
      }
      const products = await db.collection('products').find({ _id: { $in: pids } }).toArray();
      res.json(products);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist/add/:id', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const product_id = req.params.id;
    
    let id;
    try { id = new ObjectId(product_id); } catch (e) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await db.collection('products').findOne({ _id: id });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await db.collection('wishlist').updateOne(
      { user_id },
      { $addToSet: { products: product_id } },
      { upsert: true }
    );
    res.json({ success: 'Added to wishlist!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist/remove/:id', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const product_id = req.params.id;

    await db.collection('wishlist').updateOne(
      { user_id },
      { $pull: { products: product_id } }
    );
    res.json({ success: 'Removed from wishlist.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CART & SHIPPING FEES
// ==========================================
app.post('/api/calculate_shipping', async (req, res) => {
  try {
    const settings = await db.collection('settings').findOne({ type: 'store_settings' });
    const fee = settings?.standard_delivery_fee ? parseFloat(settings.standard_delivery_fee) : 69.0;
    res.json({ delivery_fee: fee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ORDER PROCESSING & RETURNS
// ==========================================
app.post('/api/checkout', requireAuth, async (req, res) => {
  try {
    const { items, shipping_details } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    const product_ids = [];
    items.forEach(i => {
      product_ids.push(i.product_id);
      if (ObjectId.isValid(i.product_id)) {
        product_ids.push(new ObjectId(i.product_id));
      }
    });
    console.log('DEBUG checkout - items in cart:', items);
    console.log('DEBUG checkout - generated product_ids query:', product_ids);
    const products = await db.collection('products').find({ _id: { $in: product_ids } }).toArray();
    console.log('DEBUG checkout - retrieved products from DB:', products);
    const products_dict = {};
    for (const p of products) {
      products_dict[p._id.toString()] = p;
    }

    let calculated_total = 0;
    const order_items = [];

    for (const item of items) {
      const product = products_dict[item.product_id];
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name}` });
      }

      let stock_available = false;
      const size = item.size;

      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        for (const s of product.sizes) {
          if (s.size === size) {
            if (s.stock >= item.quantity) stock_available = true;
            break;
          }
        }
      } else {
        if (product.stock >= item.quantity) stock_available = true;
      }

      if (!stock_available) {
        return res.status(400).json({ error: `Sorry, ${product.name} (Size: ${size}) is out of stock or requested quantity unavailable.` });
      }

      order_items.push({
        product_id: item.product_id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: size,
        image_url: product.image_url || 'https://via.placeholder.com/150',
        free_delivery: product.free_delivery || false
      });

      calculated_total += product.price * item.quantity;
    }

    const settings = await db.collection('settings').findOne({ type: 'store_settings' });
    const delivery_fee = settings?.standard_delivery_fee ? parseFloat(settings.standard_delivery_fee) : 69.0;
    const final_total = calculated_total + delivery_fee;

    // Generate Order ID (matches ORD-YYYYMMDD-XXXX formatting)
    const yyyymmdd = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randUuid = crypto.randomUUID().slice(0, 4).toUpperCase();
    const order_id = `ORD-${yyyymmdd}-${randUuid}`;

    const order = {
      order_id,
      user_id: req.session.user_id,
      items: order_items,
      subtotal: calculated_total,
      delivery_fee,
      total_amount: final_total,
      shipping_details,
      payment_method: 'COD',
      payment_status: 'Pending',
      status: 'Pending Approval',
      created_at: new Date()
    };

    // Update user address snapshot
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.session.user_id) },
      {
        $set: {
          name: shipping_details.name,
          phone: shipping_details.phone,
          address: shipping_details.address,
          city: shipping_details.city,
          state: shipping_details.state,
          zip: shipping_details.zip
        }
      }
    );

    await db.collection('orders').insertOne(order);
    res.json({ success: 'Order placed successfully!', order_id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/my_orders', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const page = parseInt(req.query.page || '1', 10);
    const per_page = 10;
    const skip = (page - 1) * per_page;

    const total_orders = await db.collection('orders').countDocuments({ user_id });
    const total_pages = Math.ceil(total_orders / per_page);

    const orders = await db.collection('orders')
      .find({ user_id })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(per_page)
      .toArray();

    res.json({ orders, total_pages, current_page: page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const req_id = req.params.id;

    let order = null;
    try {
      if (ObjectId.isValid(req_id)) {
        order = await db.collection('orders').findOne({ _id: new ObjectId(req_id), user_id });
      }
    } catch (e) {}

    if (!order) {
      order = await db.collection('orders').findOne({ order_id: req_id, user_id });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order && order.items) {
      const itemsWithPolicy = [];
      for (const item of order.items) {
        let policy = 'Return Accepted'; // default fallback
        if (item.product_id) {
          const query = ObjectId.isValid(item.product_id)
            ? { _id: new ObjectId(item.product_id) }
            : { _id: item.product_id };
          const prod = await db.collection('products').findOne(query);
          if (prod && prod.return_policy) {
            policy = prod.return_policy;
          }
        }
        itemsWithPolicy.push({ ...item, return_policy: policy });
      }
      order.items = itemsWithPolicy;
    }

    const settings = await db.collection('settings').findOne({ type: 'store_settings' });
    res.json({ order, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Invoice ─────────────────────────────────────────────────────────────────
app.get('/api/orders/:id/invoice', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const role    = req.session.role;
    const req_id  = req.params.id;

    let order = null;
    if (ObjectId.isValid(req_id)) {
      // Admin can view any order; users can only view their own
      const filter = role === 'admin'
        ? { _id: new ObjectId(req_id) }
        : { _id: new ObjectId(req_id), user_id };
      order = await db.collection('orders').findOne(filter);
    }
    if (!order) {
      const filter = role === 'admin'
        ? { order_id: req_id }
        : { order_id: req_id, user_id };
      order = await db.collection('orders').findOne(filter);
    }
    if (!order) return res.status(404).send('<h2>Order not found</h2>');

    const settings = await db.collection('settings').findOne({ type: 'store_settings' }) || {};

    const formatDate = (d) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const itemRows = (order.items || []).map(item => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;">
          <strong>${item.name || ''}</strong><br>
          <small style="color:#6c757d;">Size: ${item.size || 'Free'} | Color: ${item.color || '—'}</small>
        </td>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${Number(item.price).toFixed(2)}</td>
        <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Invoice #${order.order_id || order._id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f5f7fa; color: #2d3436; padding: 2rem; }
    .invoice-box {
      max-width: 800px; margin: 0 auto; background: white;
      border-radius: 15px; box-shadow: 0 5px 30px rgba(0,0,0,0.08); overflow: hidden;
    }
    .inv-header {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      color: white; padding: 2.5rem 2.5rem 2rem;
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .inv-header .brand { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.02em; }
    .inv-header .brand small { display: block; font-size: 0.8rem; font-weight: 400; opacity: 0.7; margin-top: 4px; }
    .inv-header .inv-meta { text-align: right; }
    .inv-header .inv-meta h2 { font-size: 1.2rem; font-weight: 600; }
    .inv-header .inv-meta p { font-size: 0.85rem; opacity: 0.8; margin-top: 4px; }
    .inv-body { padding: 2.5rem; }
    .inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    .inv-section h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6c757d; margin-bottom: 0.75rem; }
    .inv-section p { font-size: 0.9rem; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #f8f9fa; padding: 12px 10px; text-align: left;
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6c757d;
    }
    thead th:nth-child(2), thead th:nth-child(3), thead th:nth-child(4) { text-align: center; }
    thead th:last-child { text-align: right; }
    .totals { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
    .totals table { width: 280px; }
    .totals td { padding: 8px 10px; font-size: 0.9rem; }
    .totals td:last-child { text-align: right; }
    .totals .grand-total td { font-weight: 700; font-size: 1rem; border-top: 2px solid #2c3e50; padding-top: 12px; }
    .status-badge {
      display: inline-block; padding: 4px 14px; border-radius: 20px;
      font-size: 0.8rem; font-weight: 600;
      background: #d1e7dd; color: #0f5132;
    }
    .inv-footer {
      margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #f0f0f0;
      text-align: center; font-size: 0.8rem; color: #6c757d;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-box { box-shadow: none; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:800px;margin:0 auto 1rem;text-align:right;">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#2c3e50,#34495e);color:white;border:none;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;">
      🖨️ Print / Save as PDF
    </button>
    <button onclick="window.close()" style="background:#f8f9fa;color:#2c3e50;border:1px solid #dee2e6;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;margin-left:8px;">
      ✕ Close
    </button>
  </div>

  <div class="invoice-box">
    <div class="inv-header">
      <div class="brand">
        ${settings.company_name || 'Sahasra Silks'}
        <small>${settings.address || ''}</small>
      </div>
      <div class="inv-meta">
        <h2>INVOICE</h2>
        <p>#${order.order_id || order._id}</p>
        <p>${formatDate(order.created_at)}</p>
        <span class="status-badge" style="margin-top:8px;display:inline-block;">${order.status || 'Processing'}</span>
      </div>
    </div>

    <div class="inv-body">
      <div class="inv-grid">
        <div class="inv-section">
          <h3>Bill To</h3>
          <p>
            <strong>${order.shipping_details?.name || '—'}</strong><br>
            ${order.shipping_details?.address || ''}<br>
            ${order.shipping_details?.city || ''}, ${order.shipping_details?.zip || ''}<br>
            Phone: ${order.shipping_details?.phone || '—'}
          </p>
        </div>
        <div class="inv-section">
          <h3>Store Contact</h3>
          <p>
            ${settings.company_name || 'Sahasra Silks'}<br>
            ${settings.email || '—'}<br>
            ${settings.phone || '—'}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td style="color:#6c757d;">Subtotal</td>
            <td>₹${Number(order.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#6c757d;">Delivery</td>
            <td>${order.delivery_fee === 0 ? 'Free' : '₹' + Number(order.delivery_fee || 0).toFixed(2)}</td>
          </tr>
          <tr class="grand-total">
            <td>Total</td>
            <td>₹${Number(order.total_amount || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="inv-footer">
        <p>Thank you for shopping with ${settings.company_name || 'Sahasra Silks'}!</p>
        <p style="margin-top:4px;">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<h2>Error generating invoice: ${err.message}</h2>`);
  }
});

// ── Delivery Slip ─────────────────────────────────────────────────────────────
app.get('/api/orders/:id/delivery_slip', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const role    = req.session.role;
    const req_id  = req.params.id;

    if (role !== 'admin') {
      return res.status(403).send('<h2>Access Denied</h2>');
    }

    let order = null;
    if (ObjectId.isValid(req_id)) {
      order = await db.collection('orders').findOne({ _id: new ObjectId(req_id) });
    }
    if (!order) {
      order = await db.collection('orders').findOne({ order_id: req_id });
    }
    if (!order) return res.status(404).send('<h2>Order not found</h2>');

    const settings = await db.collection('settings').findOne({ type: 'store_settings' }) || {};

    const formatDate = (d) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const itemRows = (order.items || []).map(item => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #dee2e6;">
          <strong>${item.name || ''}</strong>
        </td>
        <td style="padding:12px;border-bottom:1px solid #dee2e6;text-align:center;">${item.size || 'Free'}</td>
        <td style="padding:12px;border-bottom:1px solid #dee2e6;text-align:center;font-weight:bold;">${item.quantity}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Delivery Slip - #${order.order_id || order._id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #212529; padding: 2rem; }
    .slip-box {
      max-width: 600px; margin: 0 auto; background: white;
      border: 2px dashed #000; border-radius: 8px; overflow: hidden; padding: 2rem;
    }
    .slip-header {
      border-bottom: 2px solid #000; padding-bottom: 1.5rem; margin-bottom: 1.5rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    .slip-header h1 { font-size: 1.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .slip-header .badge {
      background: #000; color: #fff; padding: 0.4rem 1rem; font-size: 0.85rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #495057;
      margin-bottom: 0.5rem; font-weight: 700; border-bottom: 1px solid #dee2e6; padding-bottom: 3px;
    }
    .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .address-box p { font-size: 0.85rem; line-height: 1.5; color: #212529; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    thead th {
      border-bottom: 2px solid #dee2e6; padding: 10px; text-align: left;
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #495057;
    }
    thead th:nth-child(2), thead th:nth-child(3) { text-align: center; }
    .slip-footer {
      border-top: 2px solid #dee2e6; padding-top: 1rem; margin-top: 1rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    .slip-footer p { font-size: 0.8rem; color: #6c757d; }
    .slip-footer .signature { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; font-size: 0.8rem; margin-top: 15px; }
    .barcode-placeholder {
      font-family: monospace; font-size: 0.75rem; color: #6c757d; border: 1px solid #dee2e6;
      padding: 0.5rem; text-align: center; border-radius: 4px; margin-bottom: 1.5rem;
      letter-spacing: 5px; font-weight: bold; background: #f8f9fa;
    }
    @media print {
      body { background: white; padding: 0; }
      .slip-box { border-radius: 0; box-shadow: none; max-width: 100%; border: 2px dashed #000; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width:600px;margin:0 auto 1rem;text-align:right;">
    <button onclick="window.print()" style="background:#000;color:white;border:none;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;">
      🖨️ Print Delivery Slip
    </button>
    <button onclick="window.close()" style="background:#f8f9fa;color:#000;border:1px solid #dee2e6;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;margin-left:8px;">
      ✕ Close
    </button>
  </div>

  <div class="slip-box">
    <div class="slip-header">
      <h1>Delivery Slip</h1>
      <div class="badge">${order.payment_method || 'COD'}</div>
    </div>

    <div class="barcode-placeholder">
      |||| | |||||| || | |||| ||| |<br>
      ${order.order_id || order._id}
    </div>

    <div class="address-grid">
      <div class="address-box">
        <div class="section-title">Shipping To</div>
        <p>
          <strong>${order.shipping_details?.name || '—'}</strong><br>
          ${order.shipping_details?.address || ''}<br>
          ${order.shipping_details?.city || ''}, ${order.shipping_details?.zip || ''}<br>
          <strong>Phone: ${order.shipping_details?.phone || '—'}</strong>
        </p>
      </div>
      <div class="address-box">
        <div class="section-title">Shipped From</div>
        <p>
          <strong>${settings.company_name || 'Sahasra Silks'}</strong><br>
          ${settings.address || ''}<br>
          ${settings.zip_code || ''}<br>
          Phone: ${settings.phone || '—'}
        </p>
      </div>
    </div>

    <div class="section-title">Package Content</div>
    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align:center;">Size</th>
          <th style="text-align:center;">Qty</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="slip-footer">
      <div>
        <p>Order Date: ${formatDate(order.created_at)}</p>
        <p>Shipment Method: Ground Courier</p>
        <p style="font-weight:bold;margin-top:4px;">Declaration Amount: ₹${Number(order.total_amount || 0).toFixed(2)}</p>
      </div>
      <div class="signature">
        Receiver Signature
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<h2>Error generating delivery slip: ${err.message}</h2>`);
  }
});

app.post('/api/orders/:id/return', requireAuth, async (req, res) => {

  try {
    const user_id = req.session.user_id;
    const req_id = req.params.id;
    const { reason, condition, comments } = req.body;

    let order = null;
    try {
      if (ObjectId.isValid(req_id)) {
        order = await db.collection('orders').findOne({ _id: new ObjectId(req_id), user_id });
      }
    } catch (e) {}

    if (!order) {
      order = await db.collection('orders').findOne({ order_id: req_id, user_id });
    }

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'Delivered') {
      return res.status(400).json({ error: 'Return request failed. Order must be delivered.' });
    }

    const return_details = {
      reason,
      condition,
      comments,
      requested_at: new Date()
    };

    await db.collection('orders').updateOne(
      { _id: order._id },
      {
        $set: {
          status: 'Return Requested',
          return_details: return_details
        }
      }
    );

    res.json({ success: 'Return requested successfully. Waiting for admin approval.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. USER PROFILE DETAILS
// ==========================================
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.session.user_id) });
    const recent_orders = await db.collection('orders').find({ user_id: req.session.user_id }).sort({ _id: -1 }).limit(5).toArray();
    
    // Omit sensitive fields
    const user_profile = { ...user };
    delete user_profile.password;

    res.json({ user: user_profile, orders: recent_orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile/update', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const { name, address, city, state, zip, phone, current_password, new_password, confirm_password } = req.body;

    const user = await db.collection('users').findOne({ _id: new ObjectId(user_id) });
    const update_data = { name };

    const address_fields = { address, city, state, zip, phone };
    for (const [k, v] of Object.entries(address_fields)) {
      if (v) update_data[k] = v;
    }

    await db.collection('users').updateOne({ _id: new ObjectId(user_id) }, { $set: update_data });
    req.session.user_name = name;

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Please enter your current password to change it.' });
      }
      if (new_password !== confirm_password) {
        return res.status(400).json({ error: 'New passwords do not match.' });
      }

      if (verifyPassword(current_password, user.password)) {
        await db.collection('users').updateOne(
          { _id: new ObjectId(user_id) },
          { $set: { password: hashPassword(new_password) } }
        );
      } else {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
    }

    res.json({ success: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. ADMINISTRATIVE CONTROLS (ADMIN ONLY)
// ==========================================
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const products = await db.collection('products').find().toArray();
    const categories = await db.collection('categories').find().toArray();
    res.json({ products, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Category CRUD
app.post('/api/admin/categories/add', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    let { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name required' });
    name = name.toLowerCase().trim();

    const exists = await db.collection('categories').findOne({ name });
    if (exists) return res.status(400).json({ error: 'Category already exists.' });

    const category_data = { name };

    // Upload to GridFS
    if (req.file) {
      const bucket = new GridFSBucket(db, { bucketName: 'fs' });
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      });
      uploadStream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      category_data.image_url = `/image/${uploadStream.id}`;
    }

    await db.collection('categories').insertOne(category_data);
    res.json({ success: 'Category added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/categories/edit/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const cat_id = new ObjectId(req.params.id);
    let { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name required' });
    
    const update_data = { name: name.toLowerCase().trim() };

    if (req.file) {
      const bucket = new GridFSBucket(db, { bucketName: 'fs' });
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      });
      uploadStream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      update_data.image_url = `/image/${uploadStream.id}`;
    }

    await db.collection('categories').updateOne({ _id: cat_id }, { $set: update_data });
    res.json({ success: 'Category updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/categories/delete/:id', requireAdmin, async (req, res) => {
  try {
    const cat_id = new ObjectId(req.params.id);
    await db.collection('categories').deleteOne({ _id: cat_id });
    res.json({ success: 'Category deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Product CRUD
app.post('/api/admin/products/add', requireAdmin, upload.array('images'), async (req, res) => {
  try {
    const { name, category, brand, color, fabric, price, delivery_type, return_policy, package_weight, description, sizes, weight, free_delivery } = req.body;

    // Parse Sizes Input: "S:10, M:5" -> [{'size': 'S', 'stock': 10}]
    const sizes_list = [];
    let total_stock = 0;
    if (sizes) {
      for (const item of sizes.split(',')) {
        const parts = item.trim().split(':');
        if (parts.length === 2) {
          const s = parts[0].trim();
          const qty = parseInt(parts[1].trim(), 10);
          if (!isNaN(qty)) {
            sizes_list.push({ size: s, stock: qty });
            total_stock += qty;
          }
        }
      }
    }

    const image_urls = [];
    if (req.files && req.files.length > 0) {
      const bucket = new GridFSBucket(db, { bucketName: 'fs' });
      for (const file of req.files) {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype
        });
        uploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });
        image_urls.push(`/image/${uploadStream.id}`);
      }
    }

    if (image_urls.length === 0) {
      image_urls.push(req.body.image_url || 'https://via.placeholder.com/300');
    }

    const product = {
      name,
      category,
      brand: brand || '',
      color: color || '',
      fabric: fabric || '',
      price: parseFloat(price),
      delivery_type: delivery_type || 'Paid Delivery',
      return_policy: return_policy || 'No Returns',
      package_weight: package_weight || '',
      description,
      image_url: image_urls[0],
      images: image_urls,
      stock: total_stock,
      sizes: sizes_list,
      weight: parseFloat(weight || '0.5'),
      free_delivery: free_delivery === 'true' || free_delivery === true,
      admin_id: req.session.user_id
    };

    await db.collection('products').insertOne(product);
    res.json({ success: 'Product added successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products/edit/:id', requireAdmin, upload.array('images'), async (req, res) => {
  try {
    const product_id = new ObjectId(req.params.id);
    const { name, category, brand, price, color, fabric, delivery_type, return_policy, package_weight, description, sizes, weight, free_delivery } = req.body;

    const sizes_list = [];
    let total_stock = 0;
    if (sizes) {
      for (const size_entry of sizes.split(',')) {
        if (size_entry.includes(':')) {
          const [s, q] = size_entry.split(':');
          const qty = parseInt(q.trim(), 10);
          if (!isNaN(qty)) {
            sizes_list.push({ size: s.trim(), stock: qty });
            total_stock += qty;
          }
        }
      }
    }

    const update_data = {
      name,
      category,
      brand,
      price: parseFloat(price),
      color,
      fabric,
      delivery_type: delivery_type || 'Paid Delivery',
      return_policy: return_policy || 'No Returns',
      package_weight: package_weight || '',
      description,
      sizes: sizes_list,
      stock: total_stock,
      weight: parseFloat(weight || '0.5'),
      free_delivery: free_delivery === 'true' || free_delivery === true
    };

    if (req.files && req.files.length > 0) {
      const bucket = new GridFSBucket(db, { bucketName: 'fs' });
      const image_urls = [];
      for (const file of req.files) {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype
        });
        uploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });
        image_urls.push(`/image/${uploadStream.id}`);
      }
      if (image_urls.length > 0) {
        update_data.images = image_urls;
        update_data.image_url = image_urls[0];
      }
    }

    await db.collection('products').updateOne({ _id: product_id }, { $set: update_data });
    res.json({ success: 'Product updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products/delete/:id', requireAdmin, async (req, res) => {
  try {
    const product_id = new ObjectId(req.params.id);
    await db.collection('products').deleteOne({ _id: product_id });
    res.json({ success: 'Product deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await db.collection('orders').find().sort({ created_at: -1 }).toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/orders/:id/approve', requireAdmin, async (req, res) => {
  try {
    const order_id = new ObjectId(req.params.id);
    const order = await db.collection('orders').findOne({ _id: order_id });
    if (order) {
      // Deduct stock upon approval
      for (const item of order.items) {
        const product_id = new ObjectId(item.product_id);
        const quantity = item.quantity;
        const size = item.size;

        const product = await db.collection('products').findOne({ _id: product_id });
        if (product) {
          if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && size) {
            await db.collection('products').updateOne(
              { _id: product_id, 'sizes.size': size },
              { $inc: { stock: -quantity, 'sizes.$.stock': -quantity } }
            );
          } else {
            await db.collection('products').updateOne(
              { _id: product_id },
              { $inc: { stock: -quantity } }
            );
          }
        }
      }

      await db.collection('orders').updateOne(
        { _id: order_id },
        { $set: { status: 'Processing', approved_at: new Date() } }
      );
      res.json({ success: 'Order approved and processing.' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/orders/:id/reject', requireAdmin, async (req, res) => {
  try {
    const order_id = new ObjectId(req.params.id);
    await db.collection('orders').updateOne(
      { _id: order_id },
      { $set: { status: 'Rejected' } }
    );
    res.json({ success: 'Order rejected successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const order_id = new ObjectId(req.params.id);
    const { status } = req.body;
    await db.collection('orders').updateOne(
      { _id: order_id },
      { $set: { status } }
    );
    res.json({ success: `Order status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Returns
app.get('/api/admin/returns', requireAdmin, async (req, res) => {
  try {
    const orders = await db.collection('orders').find({ status: 'Return Requested' }).sort({ created_at: -1 }).toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/orders/:id/approve_return', requireAdmin, async (req, res) => {
  try {
    const order_id = new ObjectId(req.params.id);
    const order = await db.collection('orders').findOne({ _id: order_id });
    if (order) {
      // Restore stock upon return approval
      for (const item of order.items) {
        const product_id = new ObjectId(item.product_id);
        const quantity = item.quantity;
        const size = item.size;

        if (size) {
          await db.collection('products').updateOne(
            { _id: product_id, 'sizes.size': size },
            { $inc: { stock: quantity, 'sizes.$.stock': quantity } }
          );
        } else {
          await db.collection('products').updateOne(
            { _id: product_id },
            { $inc: { stock: quantity } }
          );
        }
      }

      await db.collection('orders').updateOne(
        { _id: order_id },
        { $set: { status: 'Returned' } }
      );
      res.json({ success: 'Return approved and stock restored.' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/orders/:id/reject_return', requireAdmin, async (req, res) => {
  try {
    const order_id = new ObjectId(req.params.id);
    await db.collection('orders').updateOne(
      { _id: order_id },
      { $set: { status: 'Shipped' } }
    );
    res.json({ success: 'Return request rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Reviews Moderation (Batch projection, N+1 optimized)
app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  try {
    const reviews = await db.collection('reviews').find().sort({ created_at: -1 }).toArray();
    if (reviews.length > 0) {
      const pids = reviews.map(r => new ObjectId(r.product_id));
      const products = await db.collection('products').find({ _id: { $in: pids } }).toArray();
      const products_dict = {};
      for (const p of products) {
        products_dict[p._id.toString()] = p;
      }
      for (const r of reviews) {
        const p = products_dict[r.product_id];
        if (p) {
          r.product_name = p.name;
          r.product_image = p.image_url;
        }
      }
    }
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Seller Settings
app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await db.collection('settings').findOne({ type: 'store_settings' });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/update', requireAdmin, async (req, res) => {
  try {
    const { address, company_name, email, phone, zip_code, standard_delivery_fee, api_key } = req.body;
    await db.collection('settings').updateOne(
      { type: 'store_settings' },
      {
        $set: {
          address,
          company_name,
          email,
          phone,
          zip_code,
          standard_delivery_fee: parseFloat(standard_delivery_fee || '69.0'),
          api_key,
          type: 'store_settings'
        }
      },
      { upsert: true }
    );
    res.json({ success: 'Settings updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public Seller Settings (excluding api_key for security)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.collection('settings').findOne({ type: 'store_settings' }) || {};
    const { api_key, ...publicSettings } = settings;
    res.json(publicSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Frontend Static Files (Vite production build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get("/ping", (req, res) => {
  res.send("Server active");
});

// Catch-all route to serve index.html for client-side routing (React Router)
app.get('*', (req, res) => {
  // Exclude API, static, and image routes to prevent infinite loop redirects
  if (req.path.startsWith('/api') || req.path.startsWith('/image') || req.path.startsWith('/static')) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ==========================================
// SERVER INITIALIZATION & EXPORT
// ==========================================
if (process.env.VERCEL) {
  // Lazily trigger DB initialization in Serverless environments
  initDB();
} else {
  // Standard local/traditional hosting initialization
  initDB().then(() => {
    app.listen(PORT, () => {
      console.log(`High-concurrency Waitress-grade Express Server listening on http://localhost:${PORT}`);
    });
  });
}

export default app;
