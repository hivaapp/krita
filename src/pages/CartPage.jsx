import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const tax = cartTotal * 0.18;
  const shipping = cartTotal >= 999 ? 0 : 99;
  const total = cartTotal + tax + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="container section" style={{ display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',minHeight:'60vh',justifyContent:'center' }}>
        <ShoppingCart size={64} color="var(--color-border)" style={{ marginBottom:'24px' }} />
        <h1>Your cart is empty</h1>
        <p style={{ color:'var(--color-text-secondary)',marginBottom:'32px' }}>Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 style={{ marginBottom:'32px' }}>Shopping Cart ({cartItems.length})</h1>
      <div className="checkout-grid">
        <div>
          {cartItems.map(item => (
            <div key={item.id} className="cart-row">
              <img src={item.images?.[0] || 'https://picsum.photos/seed/placeholder/200/260'} alt={item.name} className="cart-img" />
              <div className="cart-details">
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'8px' }}>
                  <div style={{ fontWeight:500 }}>{item.name}</div>
                  <button className="icon-btn" style={{ width:'auto',height:'auto',color:'var(--color-text-secondary)' }} onClick={() => removeFromCart(item.id)}><X size={18} /></button>
                </div>
                <div style={{ fontSize:'13px',color:'var(--color-text-secondary)',marginBottom:'16px' }}>
                  {item.color && `Color: ${item.color}`}{item.size && ` | Size: ${item.size}`}
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div className="qty-stepper" style={{ height:'36px',width:'100px' }}>
                    <button onClick={() => updateQuantity(item.id, Math.max(1, (item.qty||item.quantity) - 1))}>−</button>
                    <span style={{ fontSize:'14px',fontWeight:500 }}>{item.qty||item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, (item.qty||item.quantity) + 1)}>+</button>
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)',fontWeight:600 }}>₹{(item.price * (item.qty||item.quantity)).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ background:'var(--color-surface)',padding:'32px',borderRadius:'8px',border:'1px solid var(--color-border)',position:'sticky',top:'100px' }}>
            <h2 style={{ fontSize:'20px',marginBottom:'24px' }}>Order Summary</h2>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'16px',fontSize:'14px' }}><span style={{color:'var(--color-text-secondary)'}}>Subtotal</span><span style={{fontFamily:'var(--font-mono)'}}>₹{cartTotal.toLocaleString()}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'16px',fontSize:'14px' }}><span style={{color:'var(--color-text-secondary)'}}>Tax (18%)</span><span style={{fontFamily:'var(--font-mono)'}}>₹{Math.round(tax).toLocaleString()}</span></div>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'24px',fontSize:'14px' }}><span style={{color:'var(--color-text-secondary)'}}>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
            <div style={{ borderTop:'1px solid var(--color-border)',paddingTop:'24px',marginBottom:'32px',display:'flex',justifyContent:'space-between',fontWeight:600,fontSize:'18px' }}><span>Total</span><span style={{fontFamily:'var(--font-mono)'}}>₹{Math.round(total).toLocaleString()}</span></div>
            <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
            <div style={{ textAlign:'center',marginTop:'16px' }}><Link to="/shop" style={{ fontSize:'14px',textDecoration:'underline',color:'var(--color-text-secondary)' }}>Continue Shopping</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
