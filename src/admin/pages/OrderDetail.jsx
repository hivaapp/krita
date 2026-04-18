import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrder, updateOrder, addOrderEvent, getOrderEvents } from '../adminApi';
import { ArrowLeft, Printer, Truck } from 'lucide-react';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS = { pending: 'admin-badge-warning', confirmed: 'admin-badge-info', processing: 'admin-badge-info', shipped: 'admin-badge-info', delivered: 'admin-badge-success', cancelled: 'admin-badge-danger' };

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { loadOrder(); loadEvents(); }, [id]);

  async function loadOrder() {
    setLoading(true);
    const { data } = await getOrder(id);
    setOrder(data);
    setNewStatus(data?.status || '');
    setTracking(data?.tracking_number || '');
    setCarrier(data?.carrier_name || '');
    setNote(data?.notes || '');
    setLoading(false);
  }

  async function loadEvents() {
    const { data } = await getOrderEvents(id);
    setEvents(data || []);
  }

  async function handleUpdateStatus() {
    const updates = { status: newStatus, notes: note };
    if (newStatus === 'shipped') { updates.tracking_number = tracking; updates.carrier_name = carrier; }
    await updateOrder(id, updates);
    await addOrderEvent(id, newStatus, `Status changed to ${newStatus}`);
    loadOrder(); loadEvents();
  }

  async function handleCancel() {
    if (!confirm('Cancel this order?')) return;
    await updateOrder(id, { status: 'cancelled' });
    await addOrderEvent(id, 'cancelled', 'Order cancelled by admin');
    loadOrder(); loadEvents();
  }

  function handlePrint() {
    const w = window.open('', '_blank');
    if (!w) return;
    const items = order.order_items || [];
    w.document.write(`<html><head><title>Invoice ${order.order_number}</title><style>body{font-family:Arial;padding:40px;font-size:13px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}h1{font-size:22px}.total{font-size:18px;font-weight:bold}</style></head><body>`);
    w.document.write(`<h1>Invoice</h1><p><strong>Order:</strong> ${order.order_number}</p><p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p><p><strong>Customer:</strong> ${order.profiles?.full_name}</p><hr/>`);
    w.document.write(`<table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>`);
    items.forEach(i => w.document.write(`<tr><td>${i.product_name} (${i.size || ''} ${i.color || ''})</td><td>${i.quantity}</td><td>₹${i.unit_price}</td><td>₹${i.line_total}</td></tr>`));
    w.document.write(`</tbody></table><br/>`);
    w.document.write(`<p>Subtotal: ₹${order.subtotal}</p><p>Discount: -₹${order.discount_amount || 0}</p><p>Shipping: ₹${order.shipping_amount || 0}</p><p class="total">Total: ₹${order.total_amount}</p>`);
    w.document.write(`</body></html>`);
    w.document.close();
    w.print();
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;
  if (!order) return <div className="admin-empty"><h3>Order not found</h3></div>;

  const currentIdx = STEPS.indexOf(order.status);
  const addr = order.shipping_address || {};

  return (
    <div>
      <div className="admin-flex admin-gap-12 admin-mb-24">
        <button className="admin-btn-icon" onClick={() => navigate('/admin/orders')}><ArrowLeft size={18} /></button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{order.order_number || 'Order Detail'}</h1>
          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{new Date(order.created_at).toLocaleString()}</span>
        </div>
        <div style={{ marginLeft: 'auto' }} className="admin-flex admin-gap-8">
          <button className="admin-btn admin-btn-secondary" onClick={handlePrint}><Printer size={14} /> Print Invoice</button>
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button className="admin-btn admin-btn-danger" onClick={handleCancel}>Cancel Order</button>
          )}
        </div>
      </div>

      {/* Status Stepper */}
      {order.status !== 'cancelled' && (
        <div className="admin-card admin-mb-16">
          <div className="admin-status-stepper">
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && <div className={`admin-step-line ${i <= currentIdx ? 'completed' : ''}`} />}
                <div className={`admin-step ${i < currentIdx ? 'completed' : i === currentIdx ? 'current' : ''}`}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="admin-grid admin-grid-2 admin-mb-16" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Order Items */}
        <div className="admin-card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Items</h3>
          <table className="admin-table" style={{ fontSize: 13 }}>
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {(order.order_items || []).map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="admin-flex admin-gap-8">
                      {item.product_image && <img src={item.product_image} className="admin-img-thumb" alt="" />}
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{item.size} {item.color}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(item.line_total).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', fontSize: 13, borderTop: '1px solid var(--admin-border)' }}>
            <div className="admin-flex-between" style={{ marginBottom: 4 }}><span>Subtotal</span><span>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span></div>
            <div className="admin-flex-between" style={{ marginBottom: 4 }}><span>Discount</span><span style={{ color: 'var(--admin-success)' }}>-₹{Number(order.discount_amount || 0).toLocaleString('en-IN')}</span></div>
            <div className="admin-flex-between" style={{ marginBottom: 4 }}><span>Shipping</span><span>₹{Number(order.shipping_amount || 0).toLocaleString('en-IN')}</span></div>
            <div className="admin-flex-between" style={{ fontWeight: 700, fontSize: 15, paddingTop: 8, borderTop: '1px solid var(--admin-border)' }}><span>Total</span><span>₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        {/* Customer & Status Update */}
        <div>
          <div className="admin-card admin-mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Customer</h3>
            <div style={{ fontSize: 13 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{order.profiles?.full_name || 'Unknown'}</div>
              <div style={{ color: 'var(--admin-text-muted)', marginBottom: 4 }}>{order.profiles?.phone || 'No phone'}</div>
            </div>
            {addr.line1 && (
              <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 8, padding: 10, background: 'var(--admin-bg)', borderRadius: 'var(--admin-radius-sm)' }}>
                <strong>Shipping Address</strong><br />
                {addr.full_name}<br />{addr.line1}{addr.line2 && <>, {addr.line2}</>}<br />{addr.city}, {addr.state} {addr.pin_code}
              </div>
            )}
          </div>

          <div className="admin-card admin-mb-16">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Update Status</h3>
            <select className="admin-select" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ marginBottom: 8 }}>
              {STEPS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            {newStatus === 'shipped' && (
              <>
                <input className="admin-input" placeholder="Tracking number" value={tracking} onChange={e => setTracking(e.target.value)} style={{ marginBottom: 8 }} />
                <input className="admin-input" placeholder="Carrier name" value={carrier} onChange={e => setCarrier(e.target.value)} style={{ marginBottom: 8 }} />
              </>
            )}
            <button className="admin-btn admin-btn-primary" style={{ width: '100%' }} onClick={handleUpdateStatus}>Save Status</button>
          </div>

          <div className="admin-card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Notes</h3>
            <textarea className="admin-textarea" value={note} onChange={e => setNote(e.target.value)} rows={3} />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Order Timeline</h3>
        {events.length === 0 ? <p style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>No events recorded</p> : (
          events.map(ev => (
            <div key={ev.id} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--admin-accent)', marginTop: 5, flexShrink: 0 }} />
              <div>
                <span className={`admin-badge ${STATUS_COLORS[ev.status] || 'admin-badge-gray'}`}>{ev.status}</span>
                {ev.note && <span style={{ marginLeft: 8, color: 'var(--admin-text-secondary)' }}>{ev.note}</span>}
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>{new Date(ev.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
