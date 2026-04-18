import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Truck, RefreshCcw, ShieldCheck, Clock } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import * as api from '../lib/api';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getNewArrivals(4),
      ]);
      setCategories(catRes.data || []);
      setNewArrivals(prodRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <section className="hero">
        <img src="https://picsum.photos/seed/hero/1600/900" alt="Hero" className="hero-bg" />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Refine Your<br/>Wardrobe</h1>
          <p className="hero-subtitle">Discover the new luxury collection for the modern aesthetic.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary">Shop Now</Link>
            <Link to="/shop?category=women" className="btn btn-outline">View Collections</Link>
          </div>
        </div>
      </section>

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
        <section className="section">
          <h2 style={{ fontSize: '28px', marginBottom: '32px' }}>Shop by Category</h2>
          <div className="category-scroll">
            {(loading ? [{name:'',slug:''},{name:'',slug:''},{name:'',slug:''},{name:'',slug:''}] : categories.filter(c=>c.slug!=='sale')).map((cat, i) => (
              <Link to={`/shop?category=${cat.slug}`} className="category-card" key={cat.slug || i}>
                {loading ? <div className="skeleton" style={{width:'100%',height:'100%'}}></div> : (
                  <>
                    <img src={cat.image_url || `https://picsum.photos/seed/${cat.slug}/400/500`} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="category-title">{cat.name}</div>
                  </>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', margin: 0 }}>New Arrivals</h2>
            <Link to="/shop" style={{ textDecoration: 'underline', fontSize: '14px', fontWeight: 500 }}>View All</Link>
          </div>
          <div className="product-grid">
            {loading ? Array(4).fill(null).map((_, i) => (
              <div key={i} className="product-card">
                <div className="product-image-container skeleton"></div>
                <div className="skeleton" style={{ height: '12px', width: '40%', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ height: '14px', width: '30%' }}></div>
              </div>
            )) : newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>

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
        <section className="section">
          <h2 style={{ fontSize: '28px', marginBottom: '32px', textAlign: 'center' }}>What Customers Say</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[{name:'Sarah K.',i:1},{name:'Rahul M.',i:2},{name:'Priya D.',i:3}].map(({name,i}) => (
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
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{name}</div>
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
