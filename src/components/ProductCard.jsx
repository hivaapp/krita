import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const images = product.images || [];
  const discount = product.discount_percent || product.discount || 0;
  const isSale = product.is_sale || product.isSale || false;
  const isNew = product.is_new || product.isNew || false;
  const inStock = product.inStock !== undefined ? product.inStock : true;
  const slug = product.slug || product.id;

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    // Use first variant if available
    const variant = product.variants?.[0];
    addToCart(
      product,
      variant?.id || null,
      1,
      variant?.size || product.sizes?.[0] || '',
      variant?.color || product.colors?.[0] || ''
    );
  };

  return (
    <Link 
      to={`/product/${slug}`} 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        <div className="product-badges">
          {isNew && <span className="product-badge new">New</span>}
          {isSale && discount > 0 && <span className="product-badge sale">-{discount}%</span>}
          {!inStock && <span className="product-badge" style={{ background: '#333' }}>Sold Out</span>}
        </div>
        
        <button className="product-wishlist" onClick={handleToggleWishlist}>
          <Heart size={18} fill={inWishlist ? 'var(--color-error)' : 'none'} color={inWishlist ? 'var(--color-error)' : 'currentColor'} style={{ transition: 'all 0.2s', transform: inWishlist ? 'scale(1.1)' : 'scale(1)' }} />
        </button>

        <img src={images[0] || 'https://picsum.photos/seed/placeholder/600/800'} alt={product.name} className="product-img" loading="lazy" />
        {images[1] && (
          <img src={images[1]} alt={product.name} className="product-img product-img-hover" loading="lazy" />
        )}

        {inStock && (
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            <ShoppingBag size={14} style={{ marginRight: '8px' }} />
            Add to Cart
          </button>
        )}
      </div>

      <div className="product-brand">{product.brand}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-price">
        {isSale && product.original_price ? (
          <>
            <span className="price-discount">₹{Number(product.price).toLocaleString()}</span>
            <span className="price-original">₹{Number(product.original_price).toLocaleString()}</span>
          </>
        ) : (
          <span>₹{Number(product.price).toLocaleString()}</span>
        )}
      </div>
    </Link>
  );
}
