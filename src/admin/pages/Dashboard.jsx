import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDashboardStats, getRevenueChart, getRecentOrders, getTopProducts, getLowStockVariants, getRecentCustomers } from '../adminApi';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, AlertTriangle, Eye } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'admin-badge-warning', confirmed: 'admin-badge-info', processing: 'admin-badge-info',
  shipped: 'admin-badge-info', delivered: 'admin-badge-success', cancelled: 'admin-badge-danger', refunded: 'admin-badge-danger',
};

function fmt(n) {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + (n || 0).toLocaleString('en-IN');
}

function pctChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous * 100).toFixed(1);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState(30);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadChart(); }, [chartPeriod]);

  async function loadAll() {
    setLoading(true);
    const [s, c, o, tp, ls, rc] = await Promise.all([
      getDashboardStats(), getRevenueChart(30), getRecentOrders(10),
      getTopProducts(5), getLowStockVariants(), getRecentCustomers(5),
    ]);
    setStats(s.data);
    setChartData(c.data || []);
    setRecentOrders(o.data || []);
    setTopProducts(tp.data || []);
    setLowStock(ls.data || []);
    setRecentCustomers(rc.data || []);
    setLoading(false);
  }

  async function loadChart() {
    const { data } = await getRevenueChart(chartPeriod);
    setChartData(data || []);
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> &nbsp; Loading dashboard...</div>;

  const s = stats || {};
  const revChange = pctChange(s.total_revenue_month, s.total_revenue_last_month);
  const ordChange = pctChange(s.total_orders_month, s.total_orders_last_month);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Dashboard</h1>

      {/* Stats Cards */}
      <div className="admin-grid admin-grid-6 admin-mb-24">
        <StatCard label="Revenue (This Month)" value={fmt(s.total_revenue_month)} change={revChange} />
        <StatCard label="Orders (This Month)" value={s.total_orders_month} change={ordChange} />
        <StatCard label="New Customers" value={s.new_customers_month} icon={<Users size={16} />} />
        <StatCard label="Pending Orders" value={s.pending_orders} icon={<ShoppingCart size={16} />} accent />
        <StatCard label="Active Products" value={s.total_products} icon={<Package size={16} />} />
        <StatCard label="Low Stock Alerts" value={s.low_stock_count} icon={<AlertTriangle size={16} />} danger={s.low_stock_count > 0} />
      </div>

      {/* Revenue Chart */}
      <div className="admin-card admin-mb-24">
        <div className="admin-flex-between admin-mb-16">
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Revenue Overview</h2>
          <div className="admin-flex admin-gap-8">
            {[7, 30, 90].map(d => (
              <button key={d} className={`admin-page-btn ${chartPeriod === d ? 'active' : ''}`} onClick={() => setChartPeriod(d)}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'K'} />
            <Tooltip formatter={v => ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']} labelFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} />
            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-grid admin-grid-2 admin-mb-24">
        {/* Recent Orders */}
        <div className="admin-card">
          <div className="admin-flex-between admin-mb-16">
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent Orders</h2>
            <Link to="/admin/orders" style={{ fontSize: 12, color: 'var(--admin-accent)', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="admin-empty"><p>No orders yet</p></div>
          ) : (
            <div style={{ fontSize: 13 }}>
              {recentOrders.slice(0, 6).map(o => (
                <Link to={`/admin/orders/${o.id}`} key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border)', textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div style={{ fontWeight: 500 }} className="admin-mono">{o.order_number || o.id.slice(0, 8)}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{o.profiles?.full_name || 'Customer'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>₹{Number(o.total_amount || 0).toLocaleString('en-IN')}</div>
                    <span className={`admin-badge ${STATUS_COLORS[o.status] || 'admin-badge-gray'}`}>{o.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="admin-card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <div className="admin-empty"><p>No sales data yet</p></div>
          ) : (
            topProducts.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--admin-border)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', width: 20 }}>#{i + 1}</span>
                {p.image_url ? <img src={p.image_url} className="admin-img-thumb" alt="" /> : <div className="admin-img-thumb" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{p.units_sold} sold</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>₹{Number(p.revenue || 0).toLocaleString('en-IN')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-grid admin-grid-2">
        {/* Low Stock */}
        <div className="admin-card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <div className="admin-empty"><AlertTriangle /><h3>All stocked up!</h3><p>No products below threshold</p></div>
          ) : (
            lowStock.slice(0, 6).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--admin-border)', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{v.products?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{v.size} / {v.color}</div>
                </div>
                <span className={`admin-badge ${v.stock_quantity === 0 ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                  {v.stock_quantity} left
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent Customers */}
        <div className="admin-card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Customers</h2>
          {recentCustomers.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--admin-border)', fontSize: 13 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--admin-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, color: 'var(--admin-accent)' }}>
                {(c.full_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{c.full_name || 'Unnamed'}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Joined {new Date(c.created_at).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon, accent, danger }) {
  const isUp = change > 0;
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value" style={danger ? { color: 'var(--admin-danger)' } : accent ? { color: 'var(--admin-warning)' } : undefined}>
        {value}
      </div>
      {change !== null && change !== undefined && (
        <div className={`admin-stat-trend ${isUp ? 'up' : 'down'}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}
