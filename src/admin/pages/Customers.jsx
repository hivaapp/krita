import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCustomers, getCustomer, getCustomerOrders } from '../adminApi';
import { Search, ArrowLeft } from 'lucide-react';

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { load(); }, [page, search]);
  async function load() {
    setLoading(true);
    const { data, count } = await getCustomers({ page, perPage: 20, search });
    setCustomers(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Customers</h1>
      <div className="admin-toolbar">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--admin-text-muted)' }} />
          <input className="admin-input" placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 32, maxWidth: 300 }} />
        </div>
      </div>
      <div className="admin-table-wrap">
        {loading ? <div className="admin-loading"><div className="admin-spinner" /></div> : (
          <table className="admin-table">
            <thead><tr><th>Customer</th><th>Phone</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="admin-flex admin-gap-8">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--admin-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, color: 'var(--admin-accent)' }}>
                        {(c.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div><div style={{ fontWeight: 500 }}>{c.full_name || 'Unnamed'}</div></div>
                    </div>
                  </td>
                  <td>{c.phone || '—'}</td>
                  <td style={{ fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                  <td><button className="admin-btn admin-btn-secondary" style={{ fontSize: 12 }} onClick={() => navigate(`/admin/customers/${c.id}`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);
  async function load() {
    const [c, o] = await Promise.all([getCustomer(id), getCustomerOrders(id)]);
    setCustomer(c.data);
    setOrders(o.data || []);
    setLoading(false);
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;
  if (!customer) return <div className="admin-empty"><h3>Customer not found</h3></div>;

  const totalSpent = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div>
      <div className="admin-flex admin-gap-12 admin-mb-24">
        <button className="admin-btn-icon" onClick={() => navigate('/admin/customers')}><ArrowLeft size={18} /></button>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{customer.full_name || 'Customer'}</h1>
      </div>
      <div className="admin-grid admin-grid-4 admin-mb-24">
        <div className="admin-stat-card"><div className="admin-stat-label">Total Orders</div><div className="admin-stat-value">{orders.length}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Total Spent</div><div className="admin-stat-value">₹{totalSpent.toLocaleString('en-IN')}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Avg Order</div><div className="admin-stat-value">₹{orders.length ? Math.round(totalSpent / orders.length).toLocaleString('en-IN') : 0}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Joined</div><div className="admin-stat-value" style={{ fontSize: 16 }}>{new Date(customer.created_at).toLocaleDateString('en-IN')}</div></div>
      </div>
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Orders</h3>
        <table className="admin-table">
          <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                <td className="admin-mono">{o.order_number || o.id.slice(0, 8)}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                <td><span className={`admin-badge ${o.status === 'delivered' ? 'admin-badge-success' : o.status === 'cancelled' ? 'admin-badge-danger' : 'admin-badge-info'}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="admin-empty"><p>No orders yet</p></div>}
      </div>
    </div>
  );
}
