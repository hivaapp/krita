export { default as Home } from './Home';
export { default as Shop } from './Shop';
export { default as ProductDetail } from './ProductDetail';
export { default as Cart } from './CartPage';
export { default as Checkout } from './Checkout';
export { default as OrderConfirmation } from './OrderConfirmation';
export { default as Wishlist } from './WishlistPage';
export { default as Auth, AuthCallback } from './AuthPage';
export { default as Profile } from './ProfilePage';
export { default as OrderHistory } from './OrderHistory';

export function NotFound() {
  return (
    <div className="container section" style={{ textAlign: 'center', padding: '100px 0' }}>
      <h1 style={{ fontSize: '72px', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>404</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary">Back to Home</a>
    </div>
  );
}
