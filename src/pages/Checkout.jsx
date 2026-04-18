import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import * as api from '../lib/api';

export default function Checkout() {
  const { user } = useAuth();
  const { cartItems, cartTotal, showToast } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [form, setForm] = useState({ fullName:'', email: user?.email||'', phone:'', line1:'', line2:'', city:'', state:'', pinCode:'' });

  const tax = cartTotal * 0.18;
  const shipping = cartTotal >= 999 ? 0 : 99;
  const discount = couponResult?.valid ? couponResult.discountAmount : 0;
  const total = cartTotal - discount + tax + shipping;

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const applyCoupon = async () => {
    const { data } = await api.validateCoupon(couponCode, cartTotal);
    setCouponResult(data);
    if (data?.valid) showToast(data.message);
    else showToast(data?.message || 'Invalid coupon', 'error');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) { setStep(step + 1); return; }
    setSubmitting(true);
    const { data, error } = await api.placeOrder(
      { full_name: form.fullName, phone: form.phone, line1: form.line1, line2: form.line2, city: form.city, state: form.state, pin_code: form.pinCode },
      'card',
      couponCode || null
    );
    setSubmitting(false);
    if (error) { showToast(error, 'error'); return; }
    navigate(`/order-confirmation/${data.orderId}`);
  };

  return (
    <div className="container section">
      <div style={{ maxWidth:'600px',margin:'0 auto' }}>
        <h1 style={{ marginBottom:'40px',textAlign:'center' }}>Checkout</h1>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'48px',position:'relative' }}>
          <div style={{ position:'absolute',top:'12px',left:0,right:0,height:'2px',background:'var(--color-border)',zIndex:0 }}></div>
          {[1,2,3].map(s => (
            <div key={s} style={{ position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'8px' }}>
              <div style={{ width:'26px',height:'26px',borderRadius:'50%',background:step>=s?'var(--color-accent)':'var(--color-surface)',border:step>=s?'none':'2px solid var(--color-border)',color:step>=s?'#fff':'var(--color-text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'bold' }}>
                {s < step ? <CheckCircle size={14} /> : s}
              </div>
              <span style={{ fontSize:'12px',color:step>=s?'var(--color-text-primary)':'var(--color-text-secondary)' }}>{s===1?'Delivery':s===2?'Review':'Payment'}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div style={{ background:'var(--color-surface)',padding:'32px',borderRadius:'8px',border:'1px solid var(--color-border)' }}>
              <h2 style={{ fontSize:'20px',marginBottom:'24px' }}>Delivery Address</h2>
              <div className="form-group"><label>Full Name</label><input name="fullName" value={form.fullName} onChange={handleChange} className="form-input" required /></div>
              <div style={{ display:'flex',gap:'16px' }}>
                <div className="form-group" style={{flex:1}}><label>Email</label><input name="email" value={form.email} onChange={handleChange} type="email" className="form-input" required /></div>
                <div className="form-group" style={{flex:1}}><label>Phone</label><input name="phone" value={form.phone} onChange={handleChange} type="tel" className="form-input" required /></div>
              </div>
              <div className="form-group"><label>Address Line 1</label><input name="line1" value={form.line1} onChange={handleChange} className="form-input" required /></div>
              <div className="form-group"><label>Address Line 2</label><input name="line2" value={form.line2} onChange={handleChange} className="form-input" /></div>
              <div style={{ display:'flex',gap:'16px' }}>
                <div className="form-group" style={{flex:1}}><label>City</label><input name="city" value={form.city} onChange={handleChange} className="form-input" required /></div>
                <div className="form-group" style={{flex:1}}><label>State</label><input name="state" value={form.state} onChange={handleChange} className="form-input" required /></div>
                <div className="form-group" style={{flex:1}}><label>PIN Code</label><input name="pinCode" value={form.pinCode} onChange={handleChange} className="form-input" required /></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%',marginTop:'16px' }}>Continue to Review</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ background:'var(--color-surface)',padding:'32px',borderRadius:'8px',border:'1px solid var(--color-border)' }}>
              <h2 style={{ fontSize:'20px',marginBottom:'24px' }}>Order Review</h2>
              {cartItems.map(item => (
                <div key={item.id} style={{ display:'flex',gap:'16px',marginBottom:'16px',paddingBottom:'16px',borderBottom:'1px solid var(--color-border)' }}>
                  <img src={item.images?.[0]} alt="" style={{ width:'60px',height:'80px',objectFit:'cover',borderRadius:'4px' }} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500}}>{item.name}</div>
                    <div style={{fontSize:'13px',color:'var(--color-text-secondary)'}}>{item.size} / {item.color} × {item.qty||item.quantity}</div>
                  </div>
                  <div style={{fontFamily:'var(--font-mono)',fontWeight:500}}>₹{(item.price*(item.qty||item.quantity)).toLocaleString()}</div>
                </div>
              ))}
              <div style={{ display:'flex',gap:'8px',marginBottom:'16px' }}>
                <input className="form-input" style={{marginBottom:0}} placeholder="Coupon code" value={couponCode} onChange={e=>setCouponCode(e.target.value)} />
                <button type="button" className="btn btn-outline" onClick={applyCoupon}>Apply</button>
              </div>
              {couponResult && <div style={{fontSize:'13px',color:couponResult.valid?'var(--color-success)':'var(--color-error)',marginBottom:'16px'}}>{couponResult.message}</div>}
              <div style={{ borderTop:'1px solid var(--color-border)',paddingTop:'16px',fontSize:'14px' }}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
                {discount > 0 && <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',color:'var(--color-success)'}}><span>Discount</span><span>-₹{discount.toLocaleString()}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><span>Tax</span><span>₹{Math.round(tax).toLocaleString()}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}><span>Shipping</span><span>{shipping===0?'Free':`₹${shipping}`}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:600,fontSize:'18px'}}><span>Total</span><span>₹{Math.round(total).toLocaleString()}</span></div>
              </div>
              <div style={{ display:'flex',gap:'16px',marginTop:'24px' }}>
                <button type="button" className="btn btn-outline" style={{flex:1}} onClick={()=>setStep(1)}>Back</button>
                <button type="submit" className="btn btn-primary" style={{flex:2}}>Proceed to Payment</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background:'var(--color-surface)',padding:'32px',borderRadius:'8px',border:'1px solid var(--color-border)' }}>
              <h2 style={{ fontSize:'20px',marginBottom:'24px' }}>Payment</h2>
              <div className="form-group"><label>Card Number</label><input className="form-input" placeholder="0000 0000 0000 0000" /></div>
              <div style={{ display:'flex',gap:'16px' }}>
                <div className="form-group" style={{flex:1}}><label>Expiry</label><input className="form-input" placeholder="MM/YY" /></div>
                <div className="form-group" style={{flex:1}}><label>CVV</label><input className="form-input" type="password" placeholder="***" /></div>
              </div>
              <div style={{ display:'flex',gap:'16px',marginTop:'32px' }}>
                <button type="button" className="btn btn-outline" style={{flex:1}} onClick={()=>setStep(2)}>Back</button>
                <button type="submit" className="btn btn-primary" style={{flex:2}} disabled={submitting}>{submitting ? 'Placing Order...' : 'Place Order'}</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
