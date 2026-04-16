import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { products, getReviews } from '../mockData';
import ProductCard from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { Star, Truck, RefreshCcw, ShieldCheck, Clock, CheckCircle, Trash2, X, ShoppingCart, Heart } from 'lucide-react';

function Home() {
  const featured = products.slice(0, 4);
  const trending = products.filter(p => p.isNew).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <img src="https://picsum.photos/seed/hero/1600/900" alt="Hero" className="hero-bg" />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Refine Your<br/>Wardrobe</h1>
          <p className="hero-subtitle">Discover the new luxury collection for the modern aesthetic.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary">Shop Now</Link>
            <Link to="/shop?category=Collections" className="btn btn-outline">View Collections</Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div style={{ background: 'var(--color-surface)', padding: '24px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto', gap: '32px' }}>
          {[
            { icon: <Truck size={20} />, text: 'Free Shipping' },
            { icon: <RefreshCcw size={20} />, text: 'Easy Returns' },
            { icon: <ShieldCheck size={20} />, text: 'Secure Checkout' },
            { icon: <Clock size={20} />, text: '24/7 Support' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 500 }}>
              <span style={{ color: 'var(--color-accent)' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        {/* Categories */}
        <section className="section">
          <h2 style={{ fontSize: '28px', marginBottom: '32px' }}>Shop by Category</h2>
          <div className="category-scroll">
            {['Women', 'Men', 'Accessories', 'Sale'].map(cat => (
              <Link to={`/shop?category=${cat}`} className="category-card" key={cat}>
                <img src={`https://picsum.photos/seed/${cat}/400/500`} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="category-title">{cat}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', margin: 0 }}>New Arrivals</h2>
            <Link to="/shop" style={{ textDecoration: 'underline', fontSize: '14px', fontWeight: 500 }}>View All</Link>
          </div>
          <div className="product-grid">
            {trending.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>

      {/* Promotional Banner */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', background: 'var(--color-accent)', color: '#fff' }}>
        <div style={{ padding: '64px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
          <h2 style={{ fontSize: '40px', marginBottom: '16px' }}>End of Season Sale</h2>
          <p style={{ fontSize: '18px', marginBottom: '32px', opacity: 0.9 }}>Up to 50% off on selected items. Limited time only.</p>
          <Link to="/shop?sale=true" className="btn" style={{ background: '#fff', color: 'var(--color-accent)' }}>Shop Sale</Link>
        </div>
        <div style={{ minHeight: '300px' }}>
          <img src="https://picsum.photos/seed/promo/800/600" alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </section>

      <div className="container">
        {/* Testimonials */}
        <section className="section">
          <h2 style={{ fontSize: '28px', marginBottom: '32px', textAlign: 'center' }}>What Customers Say</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '4px', color: 'var(--color-accent)', marginBottom: '16px' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                </div>
                <p style={{ fontStyle: 'italic', marginBottom: '24px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  "The quality of the clothes is fantastic. I've bought three items so far and they all fit perfectly and look exactly like the pictures."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={`https://picsum.photos/seed/user${i}/40/40`} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Sarah K.</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Verified Buyer</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Shop() {
  const [loading, setLoading] = useState(true);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [activeCategory, setActiveCategory] = useState([]);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('search')?.toLowerCase() || '';
  const urlCategory = searchParams.get('category');

  useEffect(() => {
    if (urlCategory && !activeCategory.includes(urlCategory)) {
      setActiveCategory([urlCategory]);
    }
  }, [urlCategory]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [query, urlCategory]);

  const toggleCategory = (cat) => {
    if (activeCategory.includes(cat)) {
      setActiveCategory(activeCategory.filter(c => c !== cat));
    } else {
      setActiveCategory([...activeCategory, cat]);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory.length === 0 || activeCategory.includes(p.category);
    const matchesSearch = !query || p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container section">
      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Desktop Sidebar */}
        <aside style={{ width: '240px', display: 'none', '@media(min-width: 1024px)': { display: 'block' }, flexShrink: 0 }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Filters</h3>
          
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Category</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Women', 'Men', 'Accessories'].map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={activeCategory.includes(c)} onChange={() => toggleCategory(c)} /> {c}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Price</h4>
            <input type="range" min="0" max="10000" style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              <span>₹0</span>
              <span>₹10,000</span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Size</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                <div key={s} className="size-chip" style={{ width: '36px', height: '36px', minWidth: 0, margin: 0, fontSize: '12px' }}>{s}</div>
              ))}
            </div>
          </div>

          <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setActiveCategory([])}>Clear All</button>
        </aside>

        {/* Main Grid */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              {query && <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Search results for "{query}"</h2>}
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Showing {filteredProducts.length} products</div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-outline" style={{ height: '36px', padding: '0 16px', display: 'flex', '@media(min-width: 1024px)': {display:'none'} }} onClick={() => setFilterDrawer(true)}>
                Filter
              </button>
              <select className="form-input" style={{ width: 'auto', height: '36px' }}>
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Top Rated</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
             <div style={{ padding: '64px 0', textAlign: 'center' }}>
               <h3 style={{ marginBottom: '16px' }}>No products match your filters</h3>
               <button className="btn btn-primary" onClick={() => setActiveCategory([])}>Clear Filters</button>
             </div>
          ) : (
            <div className="product-grid">
              {loading ? (
                Array(8).fill().map((_, i) => (
                  <div key={i} className="product-card">
                    <div className="product-image-container skeleton"></div>
                    <div className="skeleton" style={{ height: '12px', width: '40%', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ height: '14px', width: '30%' }}></div>
                  </div>
                ))
              ) : (
                filteredProducts.map(p => <ProductCard key={p.id} product={p} />)
              )}
            </div>
          )}
          
          {filteredProducts.length > 0 && (
            <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-outline" style={{ minWidth: '200px' }}>Load More</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filterDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '300px', background: 'var(--color-surface)', padding: '24px', paddingBottom: '100px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>Filters</h3>
              <button onClick={() => setFilterDrawer(false)}><X /></button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Category</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Women', 'Men', 'Accessories'].map(c => (
                  <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={activeCategory.includes(c)} onChange={() => toggleCategory(c)} /> {c}
                  </label>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => setFilterDrawer(false)}>Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const product = products.find(p => p.id === id) || products[0];
  const reviews = getReviews(id);

  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  const inWishlist = state.wishlist.includes(product.id);

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_TO_CART', payload: { ...product, qty, size: selectedSize, color: selectedColor } });
  };

  return (
    <div className="container section">
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        <Link to="/">Home</Link> &gt; <Link to="/shop">Shop</Link> &gt; {product.category} &gt; <span style={{ color: 'var(--color-text-primary)' }}>{product.name}</span>
      </div>

      <div className="detail-grid">
        {/* Gallery */}
        <div className="gallery">
          <div className="gallery-main">
            <img src={product.images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="gallery-thumbs">
            {product.images.map((img, i) => (
              <img 
                key={i} 
                src={img} 
                alt="thumb" 
                className={`thumb ${activeImg === i ? 'active' : ''}`} 
                onClick={() => setActiveImg(i)} 
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="product-info-panel">
          <div style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', color: 'var(--color-text-secondary)' }}>{product.brand}</div>
          <h1>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', color: 'var(--color-accent)' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} />)}
            </div>
            <span>{product.rating} ({product.reviewCount} Reviews)</span>
          </div>

          <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {product.isSale ? (
              <>
                <span style={{ color: 'var(--color-badge-sale)' }}>₹{product.price.toLocaleString()}</span>
                <span className="price-original" style={{ fontSize: '18px' }}>₹{product.originalPrice.toLocaleString()}</span>
                <span className="product-badge sale" style={{ position: 'static' }}>Save {product.discount}%</span>
              </>
            ) : (
              <span>₹{product.price.toLocaleString()}</span>
            )}
          </div>

          <div className="form-group">
            <label>Color</label>
            <div>
              {product.colors.map(c => (
                <div key={c} className={`swatch ${selectedColor === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setSelectedColor(c)} />
              ))}
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Size</label>
              <a href="#" style={{ fontSize: '12px', textDecoration: 'underline', color: 'var(--color-text-secondary)' }}>Size Guide</a>
            </div>
            <div>
              {product.sizes.map(s => (
                <div key={s} className={`size-chip ${selectedSize === s ? 'selected' : ''}`} onClick={() => setSelectedSize(s)}>{s}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div className="qty-stepper">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span style={{ fontSize: '16px', fontWeight: 500 }}>{qty}</span>
              <button onClick={() => setQty(Math.min(99, qty + 1))}>+</button>
            </div>
            <button className="btn btn-primary" style={{ flex: 1, minWidth: '200px', height: '44px' }} onClick={handleAddToCart}>
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button className="icon-btn" style={{ border: '1px solid var(--color-border)', borderRadius: '4px' }} onClick={() => dispatch({ type: 'TOGGLE_WISHLIST', payload: product.id })}>
              <Heart size={20} fill={inWishlist ? 'var(--color-error)' : 'none'} color={inWishlist ? 'var(--color-error)' : 'currentColor'} />
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Truck size={18} color="var(--color-text-secondary)" /> Free shipping on orders over ₹5000</li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><RefreshCcw size={18} color="var(--color-text-secondary)" /> 30-day hassle-free returns</li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><ShieldCheck size={18} color="var(--color-text-secondary)" /> 100% Authentic Products</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginTop: '80px' }}>
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--color-border)', marginBottom: '32px', overflowX: 'auto' }}>
          {['description', 'specifications', 'reviews'].map(t => (
            <button 
              key={t}
              style={{ padding: '0 0 16px 0', textTransform: 'capitalize', fontSize: '16px', fontWeight: activeTab === t ? 600 : 400, color: activeTab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === t ? '2px solid var(--color-text-primary)' : '2px solid transparent', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab(t)}
            >
              {t} {t === 'reviews' && `(${product.reviewCount})`}
            </button>
          ))}
        </div>
        
        {activeTab === 'description' && (
          <div style={{ maxWidth: '800px', lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
            <p>{product.description}</p>
            <p>Designed with meticulous attention to detail, this piece represents the pinnacle of modern luxury. Seamlessly transition from day to night, knowing you are wearing the finest quality craftsmanship.</p>
          </div>
        )}
        
        {activeTab === 'specifications' && (
          <div style={{ maxWidth: '800px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <tbody>
                {Object.entries(product.specs).map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px 0', fontWeight: 500, width: '30%', color: 'var(--color-text-secondary)' }}>{k}</td>
                    <td style={{ padding: '16px 0' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', background: 'var(--color-surface)', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
               <div>
                 <div style={{ fontSize: '48px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{product.rating}</div>
                 <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '8px' }}>Average Rating</div>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxWidth: '300px' }}>
                 {[5,4,3,2,1].map(r => (
                   <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                     <span style={{ width: '12px' }}>{r}</span>
                     <Star size={12} />
                     <div style={{ flex: 1, height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                       <div style={{ width: `${r * 15}%`, height: '100%', background: 'var(--color-accent)' }}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{r.date}</div>
                  </div>
                  <div style={{ display: 'flex', color: 'var(--color-accent)', marginBottom: '12px' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      <div style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '32px' }}>You Might Also Like</h2>
        <div className="product-grid">
          {products.slice(10, 14).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
}

function Cart() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  const subtotal = state.cart.reduce((a, c) => a + (c.price * c.qty), 0);
  const tax = subtotal * 0.18; // 18% tax simulation
  const total = subtotal + tax;

  if (state.cart.length === 0) {
    return (
      <div className="container section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '60vh', justifyContent: 'center' }}>
        <ShoppingCart size={64} color="var(--color-border)" style={{ marginBottom: '24px' }} />
        <h1>Your cart is empty</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 style={{ marginBottom: '32px' }}>Shopping Cart ({state.cart.length})</h1>
      <div className="checkout-grid">
        {/* Cart Items */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {state.cart.map((item, idx) => (
              <div key={idx} className="cart-row">
                <img src={item.images[0]} alt={item.name} className="cart-img" />
                <div className="cart-details">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <button className="icon-btn" style={{ width: 'auto', height: 'auto', color: 'var(--color-text-secondary)' }} onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: idx })}>
                      <X size={18} />
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Color: {item.color} | Size: {item.size}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="qty-stepper" style={{ height: '36px', width: '100px' }}>
                      <button onClick={() => dispatch({ type: 'UPDATE_CART_QTY', payload: { index: idx, qty: Math.max(1, item.qty - 1) }})}>−</button>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.qty}</span>
                      <button onClick={() => dispatch({ type: 'UPDATE_CART_QTY', payload: { index: idx, qty: Math.min(99, item.qty + 1) }})}>+</button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Tax</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{tax.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Shipping</span>
              <span>Free</span>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{total.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/shop" style={{ fontSize: '14px', textDecoration: 'underline', color: 'var(--color-text-secondary)' }}>Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkout() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleComplete = (e) => {
    e.preventDefault();
    setTimeout(() => {
      navigate('/order-confirmation');
    }, 1500); // Simulate API call
  };

  return (
    <div className="container section">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '40px', textAlign: 'center' }}>Checkout</h1>
        
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', left: 0, right: 0, height: '2px', background: 'var(--color-border)', zIndex: 0 }}></div>
          {[1,2,3].map(s => (
            <div key={s} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: step >= s ? 'var(--color-accent)' : 'var(--color-surface)', border: step >= s ? 'none' : '2px solid var(--color-border)', color: step >= s ? '#fff' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                {s < step ? <CheckCircle size={14} /> : s}
              </div>
              <span style={{ fontSize: '12px', color: step >= s ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: step >= s ? 500 : 400 }}>
                {s === 1 ? 'Delivery' : s === 2 ? 'Review' : 'Payment'}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={step === 3 ? handleComplete : (e) => { e.preventDefault(); setStep(step + 1); }}>
          {step === 1 && (
            <div style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Delivery Address</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-input" required />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Email Address</label>
                  <input type="email" className="form-input" required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Phone Number</label>
                  <input type="tel" className="form-input" required />
                </div>
              </div>
              <div className="form-group">
                <label>Address Line 1</label>
                <input type="text" className="form-input" required />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" className="form-input" required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>PIN Code</label>
                  <input type="text" className="form-input" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>Continue to Review</button>
            </div>
          )}

          {step === 2 && (
             <div style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
               <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Order Review</h2>
               <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Please verify your items before proceeding to payment.</p>
               
               <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '24px', marginBottom: '24px' }}>
                  {/* Simplified summary rendering */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                    <span>Total Items (Including Tax)</span>
                    <span style={{ fontWeight: 'bold' }}>₹5,200</span>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '16px' }}>
                 <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
                 <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Proceed to Payment</button>
               </div>
             </div>
          )}

          {step === 3 && (
             <div style={{ background: 'var(--color-surface)', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
               <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Payment Method</h2>
               
               <div className="form-group">
                  <label>Card Number</label>
                  <input type="text" className="form-input" placeholder="0000 0000 0000 0000" />
               </div>
               <div style={{ display: 'flex', gap: '16px' }}>
                 <div className="form-group" style={{ flex: 1 }}>
                    <label>Expiry Date</label>
                    <input type="text" className="form-input" placeholder="MM/YY" />
                 </div>
                 <div className="form-group" style={{ flex: 1 }}>
                    <label>CVV</label>
                    <input type="password" className="form-input" placeholder="***" />
                 </div>
               </div>
               <div className="form-group">
                  <label>Name on Card</label>
                  <input type="text" className="form-input" />
               </div>

               <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                 <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
                 <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Place Order</button>
               </div>
             </div>
          )}
        </form>
      </div>
    </div>
  );
}

function OrderConfirmation() {
  const { dispatch } = useStore();
  
  useEffect(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);

  return (
    <div className="container section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '60vh', justifyContent: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
        <CheckCircle size={40} />
      </div>
      <h1 style={{ marginBottom: '16px' }}>Thank You For Your Order!</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '18px' }}>Your order #ORD-{Math.floor(Math.random()*100000)} has been placed successfully.</p>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '40px' }}>We'll send you an email confirmation with tracking details shortly.</p>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn btn-outline">Track Order</button>
        <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}

function Wishlist() {
  const { state } = useStore();
  const wishlistedProducts = products.filter(p => state.wishlist.includes(p.id));

  return (
    <div className="container section">
      <h1 style={{ marginBottom: '32px' }}>My Wishlist ({wishlistedProducts.length})</h1>
      {wishlistedProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Heart size={48} color="var(--color-text-secondary)" style={{ marginBottom: '24px', opacity: 0.5 }} />
          <h3>Love something?</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Save your favorite items here.</p>
          <Link to="/shop" className="btn btn-outline">Discover Products</Link>
        </div>
      ) : (
        <div className="product-grid">
          {wishlistedProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="container section" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--color-surface)', padding: '40px', borderRadius: '8px', border: '1px solid var(--color-border)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '32px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        
        <form onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>First Name</label>
                <input type="text" className="form-input" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Last Name</label>
                <input type="text" className="form-input" />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-input" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" />
          </div>

          {isLogin && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>Forgot Password?</a>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '24px' }}>{isLogin ? 'Login' : 'Create Account'}</button>

          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--color-text-primary)', textDecoration: 'underline', fontWeight: 500, padding: 0 }}>
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container section" style={{ textAlign: 'center', padding: '100px 0' }}>
      <h1 style={{ fontSize: '100px', margin: 0, fontFamily: 'var(--font-mono)' }}>404</h1>
      <h2 style={{ marginBottom: '24px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>The page you are looking for might have been removed or is temporarily unavailable.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}

export { Home, Shop, ProductDetail, Cart, Checkout, OrderConfirmation, Wishlist, Auth, NotFound };
