import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, updateOrder, addOrderEvent } from '../adminApi';
import { Search, Download, Eye } from 'lucide-react';

const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = { pending: 'admin-badge-warning', confirmed: 'admin-badge-info', processing: 'admin-badge-info', shipped: 'admin-badge-info', delivered: 'admin-badge-success', cancelled: 'admin-badge-danger', refunded: 'admin-badge-danger' };

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const perPage = 20;

  useEffect(() => { loadOrders(); }, [page, search, status]);

  async function loadOrders() {
    setLoading(true);
    const { data, count } = await getOrders({ page, perPage, search, status });
    setOrders(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  function exportCSV() {
    const headers = ['Order #', 'Customer', 'Date', 'Total', 'Status', 'Payment'];
    const rows = orders.map(o => [o.order_number, o.profiles?.full_name, new Date(o.created_at).toLocaleDateString(), o.total_amount, o.status, o.payment_status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Orders</h1>
        <button className="admin-btn admin-btn-secondary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>

      <div className="admin-tabs admin-mb-16">
        {STATUSES.map(s => (
          <button key={s} className={`admin-tab ${status === s ? 'active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--admin-text-muted)' }} />
          <input className="admin-input" placeholder="Search by order number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 32, maxWidth: 300 }} />
        </div>
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : orders.length === 0 ? (
          <div className="admin-empty"><h3>No orders found</h3></div>
        ) : (
          <>
            <table className="admin-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="admin-mono" style={{ fontWeight: 500 }}>{o.order_number || o.id.slice(0, 8)}</td>
                    <td>{o.profiles?.full_name || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(o.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`admin-badge ${o.payment_status === 'paid' ? 'admin-badge-success' : 'admin-badge-warning'}`}>{o.payment_status}</span></td>
                    <td><span className={`admin-badge ${STATUS_COLORS[o.status] || 'admin-badge-gray'}`}>{o.status}</span></td>
                    <td><button className="admin-btn-icon" onClick={() => navigate(`/admin/orders/${o.id}`)}><Eye size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-pagination">
              <span>Showing {(page-1)*perPage+1}–{Math.min(page*perPage, total)} of {total}</span>
              <div className="admin-pagination-btns">
                <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Prev</button>
                <button className="admin-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
