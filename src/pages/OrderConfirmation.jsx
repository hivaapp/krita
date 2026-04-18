import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import * as api from '../lib/api';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      api.getOrderById(orderId).then(({ data }) => setOrder(data));
    }
    // Realtime subscription for status updates
    if (orderId) {
      const unsub = api.subscribeToOrderStatus(orderId, (updated) => {
        setOrder(prev => prev ? { ...prev, ...updated } : updated);
      });
      return unsub;
    }
  }, [orderId]);

  return (
    <div className="container section" style={{ display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',minHeight:'60vh',justifyContent:'center' }}>
      <div style={{ width:'80px',height:'80px',borderRadius:'50%',background:'var(--color-success)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'32px' }}>
        <CheckCircle size={40} />
      </div>
      <h1 style={{ marginBottom:'16px' }}>Thank You For Your Order!</h1>
      <p style={{ color:'var(--color-text-secondary)',marginBottom:'8px',fontSize:'18px' }}>
        Order #{order?.order_number || '...'} has been placed successfully.
      </p>
      {order?.estimated_delivery_date && (
        <p style={{ color:'var(--color-text-secondary)',marginBottom:'8px' }}>Estimated delivery: {new Date(order.estimated_delivery_date).toLocaleDateString()}</p>
      )}
      <p style={{ color:'var(--color-text-secondary)',marginBottom:'8px' }}>
        Status: <span style={{ fontWeight:600,color:'var(--color-success)',textTransform:'capitalize' }}>{order?.status || 'confirmed'}</span>
      </p>
      <p style={{ color:'var(--color-text-secondary)',marginBottom:'40px' }}>We'll send you an email confirmation with tracking details shortly.</p>
      <div style={{ display:'flex',gap:'16px' }}>
        <Link to="/orders" className="btn btn-outline">My Orders</Link>
        <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}
