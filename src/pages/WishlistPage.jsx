import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import * as api from '../lib/api';

export default function WishlistPage() {
  const { isAuthenticated, user } = useAuth();
  const { wishlistItems, wishlistIds, loading } = useWishlist();
  const [guestProducts, setGuestProducts] = useState([]);

  // For guests, fetch product details for stored IDs
  useEffect(() => {
    if (!isAuthenticated && wishlistIds.size > 0) {
      Promise.all([...wishlistIds].map(id => api.getProductById(id))).then(results => {
        setGuestProducts(results.filter(r => r.data).map(r => r.data));
      });
    }
  }, [isAuthenticated, wishlistIds]);

  const displayProducts = isAuthenticated ? wishlistItems : guestProducts;

  return (
    <div className="container section">
      <h1 style={{ marginBottom:'32px' }}>My Wishlist ({displayProducts.length})</h1>
      {loading ? (
        <div className="product-grid">
          {Array(4).fill(null).map((_,i) => (
            <div key={i} className="product-card"><div className="product-image-container skeleton"></div></div>
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div style={{ textAlign:'center',padding:'64px 0' }}>
          <Heart size={48} color="var(--color-text-secondary)" style={{ marginBottom:'24px',opacity:0.5 }} />
          <h3>Love something?</h3>
          <p style={{ color:'var(--color-text-secondary)',marginBottom:'24px' }}>Save your favorite items here.</p>
          <Link to="/shop" className="btn btn-outline">Discover Products</Link>
        </div>
      ) : (
        <div className="product-grid">
          {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
