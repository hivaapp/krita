import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function ProductCard({ product }) {
  const { state, dispatch } = useStore();
  const [isHovered, setIsHovered] = useState(false);

  const inWishlist = state.wishlist.includes(product.id);

  const toggleWishlist = (e) => {
    e.preventDefault();
    dispatch({ type: 'TOGGLE_WISHLIST', payload: product.id });
  };

  const addToCart = (e) => {
    e.preventDefault();
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { 
        ...product, 
        qty: 1, 
        size: product.sizes[0], 
        color: product.colors[0] 
      } 
    });
  };

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        <div className="product-badges">
          {product.isNew && <span className="product-badge new">New</span>}
          {product.isSale && <span className="product-badge sale">-{product.discount}%</span>}
          {!product.inStock && <span className="product-badge" style={{ background: '#333' }}>Sold Out</span>}
        </div>
        
        <button className="product-wishlist" onClick={toggleWishlist}>
          <Heart size={18} fill={inWishlist ? 'var(--color-error)' : 'none'} color={inWishlist ? 'var(--color-error)' : 'currentColor'} style={{ transition: 'all 0.2s', transform: inWishlist ? 'scale(1.1)' : 'scale(1)' }} />
        </button>

        <img src={product.images[0]} alt={product.name} className="product-img" loading="lazy" />
        {product.images[1] && (
          <img src={product.images[1]} alt={product.name} className="product-img product-img-hover" loading="lazy" />
        )}

        {product.inStock && (
          <button className="add-to-cart-btn" onClick={addToCart}>
            <ShoppingBag size={14} style={{ marginRight: '8px' }} />
            Add to Cart
          </button>
        )}
      </div>

      <div className="product-brand">{product.brand}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-price">
        {product.isSale ? (
          <>
            <span className="price-discount">₹{product.price.toLocaleString()}</span>
            <span className="price-original">₹{product.originalPrice.toLocaleString()}</span>
          </>
        ) : (
          <span>₹{product.price.toLocaleString()}</span>
        )}
      </div>
    </Link>
  );
}
