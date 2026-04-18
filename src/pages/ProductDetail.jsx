import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Truck, RefreshCcw, ShieldCheck, ShoppingCart, Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import * as api from '../lib/api';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prod } = await api.getProductBySlug(slug);
      if (!prod) { setLoading(false); return; }
      setProduct(prod);
      setSelectedSize(prod.sizes?.[0] || '');
      setSelectedColor(prod.colors?.[0] || '');
      setActiveImg(0);
      setQty(1);

      const [revRes, ratingRes, relRes] = await Promise.all([
        api.getReviews(prod.id),
        api.getRatingSummary(prod.id),
        api.getRelatedProducts(prod.category_id, prod.id, 4),
      ]);
      setReviews(revRes.data || []);
      setRatingSummary(ratingRes.data || null);
      setRelated(relRes.data || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <div className="container section">
      <div className="detail-grid">
        <div className="gallery"><div className="gallery-main skeleton" style={{minHeight:'400px'}}></div></div>
        <div className="product-info-panel">
          <div className="skeleton" style={{height:'16px',width:'30%',marginBottom:'12px'}}></div>
          <div className="skeleton" style={{height:'28px',width:'80%',marginBottom:'16px'}}></div>
          <div className="skeleton" style={{height:'24px',width:'40%',marginBottom:'32px'}}></div>
        </div>
      </div>
    </div>
  );

  if (!product) return <div className="container section" style={{textAlign:'center',padding:'100px 0'}}><h2>Product not found</h2><Link to="/shop" className="btn btn-primary">Back to Shop</Link></div>;

  const inWishlist = isInWishlist(product.id);
  const selectedVariant = product.variants?.find(v => v.size === selectedSize && v.color === selectedColor) || product.variants?.[0];
  const isSale = product.is_sale;
  const discount = product.discount_percent;

  const handleAddToCart = () => {
    addToCart(product, selectedVariant?.id || null, qty, selectedSize, selectedColor);
  };

  return (
    <div className="container section">
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        <Link to="/">Home</Link> &gt; <Link to="/shop">Shop</Link> &gt; <Link to={`/shop?category=${product.categorySlug}`}>{product.category}</Link> &gt; <span style={{ color: 'var(--color-text-primary)' }}>{product.name}</span>
      </div>

      <div className="detail-grid">
        <div className="gallery">
          <div className="gallery-main">
            <img src={product.images[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="gallery-thumbs">
            {product.images.map((img, i) => (
              <img key={i} src={img} alt="thumb" className={`thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)} />
            ))}
          </div>
        </div>

        <div className="product-info-panel">
          <div style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', color: 'var(--color-text-secondary)' }}>{product.brand}</div>
          <h1>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', color: 'var(--color-accent)' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} />)}
            </div>
            <span>{product.rating} ({product.review_count} Reviews)</span>
          </div>

          <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isSale && product.original_price ? (
              <>
                <span style={{ color: 'var(--color-badge-sale)' }}>₹{Number(product.price).toLocaleString()}</span>
                <span className="price-original" style={{ fontSize: '18px' }}>₹{Number(product.original_price).toLocaleString()}</span>
                <span className="product-badge sale" style={{ position: 'static' }}>Save {discount}%</span>
              </>
            ) : (
              <span>₹{Number(product.price).toLocaleString()}</span>
            )}
          </div>

          {product.colors.length > 0 && (
            <div className="form-group">
              <label>Color — {selectedColor}</label>
              <div>
                {product.colors.map(c => (
                  <div key={c} className={`swatch ${selectedColor === c ? 'selected' : ''}`} style={{ background: product.colorHexMap[c] || '#ccc' }} onClick={() => setSelectedColor(c)} title={c} />
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="form-group">
              <label>Size</label>
              <div>
                {product.sizes.map(s => (
                  <div key={s} className={`size-chip ${selectedSize === s ? 'selected' : ''}`} onClick={() => setSelectedSize(s)}>{s}</div>
                ))}
              </div>
            </div>
          )}

          {selectedVariant && (
            <div style={{ fontSize: '13px', color: selectedVariant.stock_quantity > 0 ? 'var(--color-success)' : 'var(--color-error)', marginBottom: '16px' }}>
              {selectedVariant.stock_quantity > 0 ? `${selectedVariant.stock_quantity} in stock` : 'Out of stock'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div className="qty-stepper">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span style={{ fontSize: '16px', fontWeight: 500 }}>{qty}</span>
              <button onClick={() => setQty(Math.min(selectedVariant?.stock_quantity || 99, qty + 1))}>+</button>
            </div>
            <button className="btn btn-primary" style={{ flex: 1, minWidth: '200px', height: '44px' }} onClick={handleAddToCart} disabled={selectedVariant && selectedVariant.stock_quantity === 0}>
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button className="icon-btn" style={{ border: '1px solid var(--color-border)', borderRadius: '4px' }} onClick={() => toggleWishlist(product.id)}>
              <Heart size={20} fill={inWishlist ? 'var(--color-error)' : 'none'} color={inWishlist ? 'var(--color-error)' : 'currentColor'} />
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Truck size={18} color="var(--color-text-secondary)" /> Free shipping on orders over ₹999</li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><RefreshCcw size={18} color="var(--color-text-secondary)" /> 30-day hassle-free returns</li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><ShieldCheck size={18} color="var(--color-text-secondary)" /> 100% Authentic Products</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginTop: '80px' }}>
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--color-border)', marginBottom: '32px', overflowX: 'auto' }}>
          {['description', 'reviews'].map(t => (
            <button key={t} style={{ padding: '0 0 16px 0', textTransform: 'capitalize', fontSize: '16px', fontWeight: activeTab === t ? 600 : 400, color: activeTab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', borderBottom: activeTab === t ? '2px solid var(--color-text-primary)' : '2px solid transparent', whiteSpace: 'nowrap' }} onClick={() => setActiveTab(t)}>
              {t} {t === 'reviews' && `(${product.review_count})`}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div style={{ maxWidth: '800px', lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
            <p>{product.description}</p>
          </div>
        )}

        {activeTab === 'reviews' && ratingSummary && (
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', background: 'var(--color-surface)', padding: '32px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{ratingSummary.average}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '8px' }}>{ratingSummary.total} reviews</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxWidth: '300px' }}>
                {[5,4,3,2,1].map(r => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                    <span style={{ width: '12px' }}>{r}</span>
                    <Star size={12} />
                    <div style={{ flex: 1, height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${ratingSummary.total > 0 ? (ratingSummary.breakdown[r] / ratingSummary.total * 100) : 0}%`, height: '100%', background: 'var(--color-accent)' }}></div>
                    </div>
                    <span style={{ width: '24px', textAlign: 'right' }}>{ratingSummary.breakdown[r]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', color: 'var(--color-accent)', marginBottom: '8px' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  {r.title && <div style={{ fontWeight: 500, marginBottom: '8px' }}>{r.title}</div>}
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: '80px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '32px' }}>You Might Also Like</h2>
          <div className="product-grid">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
