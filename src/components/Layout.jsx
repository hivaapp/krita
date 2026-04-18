import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, Menu, Home, Grid, X, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function BrandLogo() {
  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'visible' }}>
      <img 
        src="/logo.png" 
        alt="KRITA Logo" 
        style={{ 
          height: '90px', 
          width: 'auto', 
          objectFit: 'contain', 
          mixBlendMode: 'multiply',
          transform: 'scale(1.2)',
          transformOrigin: 'center'
        }} 
      />
    </Link>
  );
}

function WhatsAppButton() {
  const phoneNumber = "919963650681";
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={32} fill="currentColor" />
    </a>
  );
}

export default function Layout() {
  const { isAuthenticated, user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className={`header ${isScrolled || !isHome || menuOpen ? 'solid' : ''}`}>
        <div className="container header-container">
          {/* Mobile Menu Icon */}
          <button className="icon-btn" style={{ display: 'flex', '@media(min-width: 1024px)': {display:'none'} }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <BrandLogo />

          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/shop?category=women">Women</Link>
            <Link to="/shop?category=men">Men</Link>
            <Link to="/shop?sale=true" style={{ color: 'var(--color-badge-sale)' }}>Sale</Link>
          </nav>

          <div className="header-actions">
            <button className="icon-btn" onClick={() => setSearchOpen(true)}>
              <Search size={22} />
            </button>
            <Link to="/wishlist" className="icon-btn">
              <Heart size={22} />
              {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </Link>
            <Link to="/cart" className="icon-btn">
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
            <Link to={isAuthenticated ? "/profile" : "/auth"} className="icon-btn" style={{ display: 'flex' }}>
              <User size={22} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, top: '80px', background: 'var(--color-surface)', zIndex: 40, padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '18px', fontWeight: '500' }}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
            <Link to="/shop?category=women" onClick={() => setMenuOpen(false)}>Women</Link>
            <Link to="/shop?category=men" onClick={() => setMenuOpen(false)}>Men</Link>
            <Link to="/shop?category=accessories" onClick={() => setMenuOpen(false)}>Accessories</Link>
            <Link to="/shop?sale=true" onClick={() => setMenuOpen(false)} style={{ color: 'var(--color-badge-sale)' }}>Sale</Link>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'block', marginBottom: '16px' }}>My Profile</Link>
                  <Link to="/orders" onClick={() => setMenuOpen(false)} style={{ display: 'block' }}>My Orders</Link>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)}>Login / Register</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {searchOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 60, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
           <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', position: 'relative' }}>
             <button style={{ position: 'absolute', right: 0, top: '-40px', color: '#fff' }} onClick={() => setSearchOpen(false)}>
               <X size={32} />
             </button>
             <input 
               type="text" 
               placeholder="Search for products, brands..." 
               style={{ width: '100%', border: 'none', borderBottom: '2px solid #fff', background: 'transparent', color: '#fff', fontSize: '32px', padding: '16px 0', outline: 'none' }} 
               autoFocus
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   setSearchOpen(false);
                   navigate(`/shop?search=${searchQuery}`);
                   setSearchQuery('');
                 }
               }}
             />
             <div style={{ marginTop: '24px', color: '#ccc' }}>
               Press enter to search...
             </div>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <BrandLogo />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Luxury meets modernity. Elevating everyday wear with premium materials and timeless silhouettes. Shop more, smile more.
              </p>
            </div>
            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><Link to="/shop?category=women">Women's Collection</Link></li>
                <li><Link to="/shop?category=men">Men's Collection</Link></li>
                <li><Link to="/shop?category=accessories">Accessories</Link></li>
                <li><Link to="/shop?sale=true">Clearance Sale</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Help & Support</h4>
              <ul>
                <li><Link to="/orders">Track Order</Link></li>
                <li><a href="#">Returns & Exchanges</a></li>
                <li><a href="#">Shipping Info</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Stay in the loop</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Subscribe for early access to new arrivals and exclusive offers.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="email" placeholder="Your email address" className="form-input" style={{ marginBottom: 0 }} />
                <button className="btn btn-primary" style={{ padding: '0 16px' }}>Subscribe</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} KRITA. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '16px' }}>
               <span>Visa</span>
               <span>Mastercard</span>
               <span>PayPal</span>
               <span>UPI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/shop" className={`bottom-nav-item ${location.pathname === '/shop' ? 'active' : ''}`}>
          <Grid size={20} />
          <span>Shop</span>
        </Link>
        <Link to="/wishlist" className={`bottom-nav-item ${location.pathname === '/wishlist' ? 'active' : ''}`}>
          <div style={{ position: 'relative' }}>
             <Heart size={20} />
             {wishlistCount > 0 && <span className="badge" style={{ top: '-8px', right: '-8px' }}>{wishlistCount}</span>}
          </div>
          <span>Wishlist</span>
        </Link>
        <Link to="/cart" className={`bottom-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}>
          <div style={{ position: 'relative' }}>
             <ShoppingCart size={20} />
             {cartCount > 0 && <span className="badge" style={{ top: '-8px', right: '-8px' }}>{cartCount}</span>}
          </div>
          <span>Cart</span>
        </Link>
      </nav>
      <WhatsAppButton />
    </div>
  );
}
