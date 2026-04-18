import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import { Home, Shop, ProductDetail, Cart, Checkout, OrderConfirmation, Wishlist, Auth, AuthCallback, Profile, OrderHistory, NotFound } from './pages/Pages';

// Admin imports
import AdminLogin from './admin/AdminLogin';
import AdminGuard from './admin/AdminGuard';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import ProductList from './admin/pages/ProductList';
import ProductForm from './admin/pages/ProductForm';
import OrderList from './admin/pages/OrderList';
import OrderDetail from './admin/pages/OrderDetail';
import Categories from './admin/pages/Categories';
import Collections from './admin/pages/Collections';
import Discounts from './admin/pages/Discounts';
import { CustomerList, CustomerDetail } from './admin/pages/Customers';
import Reviews from './admin/pages/Reviews';
import Banners from './admin/pages/Banners';
import Media from './admin/pages/Media';
import SettingsPage from './admin/pages/Settings';
import Analytics from './admin/pages/Analytics';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Customer-facing routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="order-confirmation/:orderId" element={<PrivateRoute><OrderConfirmation /></PrivateRoute>} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="auth" element={<Auth />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="orders" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="categories" element={<Categories />} />
          <Route path="collections" element={<Collections />} />
          <Route path="discounts" element={<Discounts />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="banners" element={<Banners />} />
          <Route path="media" element={<Media />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
