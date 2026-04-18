import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

const statusColors = {
  pending: { bg: '#FDF4EC', color: '#A0622A' },
  confirmed: { bg: '#EBF5EE', color: '#417A55' },
  processing: { bg: '#FDF4EC', color: '#A0622A' },
  shipped: { bg: '#E8F0FE', color: '#1967D2' },
  delivered: { bg: '#EBF5EE', color: '#417A55' },
  cancelled: { bg: '#FDECEA', color: '#C0392B' },
  refunded: { bg: '#FDECEA', color: '#C0392B' },
};

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (user) {
      api.getOrders(user.id).then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return (
    <div className="container section">
      <h1 style={{ marginBottom: '32px' }}>My Orders</h1>
      {Array(3).fill(null).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: '8px' }}></div>)}
    </div>
  );

  return (
    <div className="container section">
      <h1 style={{ marginBottom: '32px' }}>My Orders</h1>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Package size={48} color="var(--color-text-secondary)" style={{ marginBottom: '24px', opacity: 0.5 }} />
          <h3>No orders yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Start shopping to see your orders here.</p>
          <Link to="/shop" className="btn btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => {
            const sc = statusColors[order.status] || statusColors.pending;
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '12px' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{order.order_number}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{new Date(order.created_at).toLocaleDateString()} · {order.order_items?.length || 0} items</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '20px', background: sc.bg, color: sc.color, fontWeight: 600, textTransform: 'capitalize' }}>{order.status}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{Number(order.total_amount).toLocaleString()}</span>
                  </div>
                </div>
                {isExpanded && order.order_items && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>
                    {order.order_items.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                        {item.product_image && <img src={item.product_image} alt="" style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '4px' }} />}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.product_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{item.size} / {item.color} × {item.quantity}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>₹{Number(item.line_total).toLocaleString()}</div>
                      </div>
                    ))}
                    {order.estimated_delivery_date && (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
                        Est. delivery: {new Date(order.estimated_delivery_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
