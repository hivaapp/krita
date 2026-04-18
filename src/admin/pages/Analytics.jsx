import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getRevenueChart, getRevenueByCategory, getTopProducts, getDashboardStats } from '../adminApi';
import { Download } from 'lucide-react';

const COLORS = ['#4F46E5', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];

export default function Analytics() {
  const [period, setPeriod] = useState(30);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [period]);

  async function loadAll() {
    setLoading(true);
    const [rev, cat, top, st] = await Promise.all([
      getRevenueChart(period), getRevenueByCategory(), getTopProducts(10), getDashboardStats()
    ]);
    setRevenueData(rev.data || []);
    setCategoryData(cat.data || []);
    setTopProducts(top.data || []);
    setStats(st.data);
    setLoading(false);
  }

  function exportCSV() {
    const headers = ['Date', 'Revenue', 'Orders'];
    const rows = revenueData.map(d => [d.date, d.revenue, d.orders]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'analytics.csv'; a.click();
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  const s = stats || {};

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Analytics</h1>
        <div className="admin-flex admin-gap-8">
          {[7, 30, 90].map(d => (
            <button key={d} className={`admin-page-btn ${period === d ? 'active' : ''}`} onClick={() => setPeriod(d)}>{d} days</button>
          ))}
          <button className="admin-btn admin-btn-secondary" onClick={exportCSV}><Download size={14} /> CSV</button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="admin-grid admin-grid-4 admin-mb-24">
        <div className="admin-stat-card"><div className="admin-stat-label">Revenue</div><div className="admin-stat-value">₹{Number(s.total_revenue_month || 0).toLocaleString('en-IN')}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Orders</div><div className="admin-stat-value">{s.total_orders_month || 0}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">Products</div><div className="admin-stat-value">{s.total_products || 0}</div></div>
        <div className="admin-stat-card"><div className="admin-stat-label">New Customers</div><div className="admin-stat-value">{s.new_customers_month || 0}</div></div>
      </div>

      {/* Revenue Chart */}
      <div className="admin-card admin-mb-24">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₹' + (v / 1000).toFixed(0) + 'K'} />
            <Tooltip formatter={v => ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Chart + Category Pie */}
      <div className="admin-grid admin-grid-2 admin-mb-24">
        <div className="admin-card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Orders Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric' })} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="admin-card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Revenue by Category</h3>
          {categoryData.length === 0 ? <div className="admin-empty"><p>No data</p></div> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => '₹' + Number(v).toLocaleString('en-IN')} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="admin-card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top 10 Products by Revenue</h3>
        {topProducts.length === 0 ? <div className="admin-empty"><p>No sales data</p></div> : (
          <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 40)}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tickFormatter={v => '₹' + (v / 1000).toFixed(0) + 'K'} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => '₹' + Number(v).toLocaleString('en-IN')} />
              <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
