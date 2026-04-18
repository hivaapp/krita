import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getNotifications, markNotificationsRead, getUnreadNotifCount } from './adminApi';
import {
  LayoutDashboard, Package, FolderTree, Layers, ShoppingCart, Tag,
  Users, Star, Image, PanelTop, Settings, BarChart3, Bell, LogOut,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import './admin.css';

const NAV = [
  { section: 'Main', items: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ]},
  { section: 'Catalog', items: [
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { to: '/admin/collections', icon: Layers, label: 'Collections' },
  ]},
  { section: 'Sales', items: [
    { to: '/admin/discounts', icon: Tag, label: 'Discounts' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
    { to: '/admin/reviews', icon: Star, label: 'Reviews' },
  ]},
  { section: 'Content', items: [
    { to: '/admin/banners', icon: PanelTop, label: 'Banners' },
    { to: '/admin/media', icon: Image, label: 'Media' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ]},
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    loadNotifications();

    // Subscribe to realtime notifications
    const channel = supabase.channel('admin-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadNotifications() {
    const { data } = await getNotifications(15);
    setNotifications(data || []);
    const { count } = await getUnreadNotifCount();
    setUnreadCount(count);
  }

  async function handleMarkAllRead() {
    await markNotificationsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  }

  const initials = user?.user_metadata?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'A';

  return (
    <div className="admin-root">
      {/* Mobile overlay */}
      {mobileOpen && <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <div className="logo-icon">K</div>
          <span className="logo-text">Krita Admin</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV.map(section => (
            <div key={section.section} className="admin-nav-section">
              <div className="admin-nav-section-title">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-item"
            onClick={() => setCollapsed(!collapsed)}
            style={{ width: '100%', border: 'none', background: 'none', marginBottom: 8 }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
            <span>Collapse</span>
          </button>
          <div className="admin-sidebar-profile" onClick={handleSignOut} title="Sign Out">
            <div className="admin-sidebar-avatar">{initials}</div>
            <div className="admin-sidebar-profile-info">
              <div className="admin-sidebar-profile-name">{user?.user_metadata?.full_name || 'Admin'}</div>
              <div className="admin-sidebar-profile-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`admin-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-btn-icon" onClick={() => setMobileOpen(true)} style={{ display: 'none' }} id="admin-menu-btn">
              <Menu size={20} />
            </button>
            <style>{`@media (max-width: 1024px) { #admin-menu-btn { display: flex !important; } }`}</style>
          </div>
          <div className="admin-header-right">
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button className="admin-notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="admin-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="admin-notif-dropdown">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--admin-border)' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button className="admin-btn admin-btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`admin-notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => { if (n.link) navigate(n.link); setNotifOpen(false); }}
                      >
                        <span style={{ fontSize: 18 }}>
                          {n.type === 'new_order' && '🛒'}
                          {n.type === 'low_stock' && '⚠️'}
                          {n.type === 'new_review' && '⭐'}
                          {n.type === 'order_cancelled' && '❌'}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button className="admin-btn-icon" onClick={handleSignOut} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
