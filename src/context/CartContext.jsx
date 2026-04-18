import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../lib/api';

const CartContext = createContext();

const GUEST_CART_KEY = 'krita_guest_cart';

function getGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || [];
  } catch {
    return [];
  }
}

function setGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Load cart on auth change
  const loadCart = useCallback(async () => {
    if (isAuthenticated && user) {
      setLoading(true);
      const { data } = await api.getCart(user.id);
      setCartItems(data || []);
      setLoading(false);
    } else {
      setCartItems(getGuestCart());
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Merge guest cart on login
  useEffect(() => {
    if (isAuthenticated && user) {
      const guestItems = getGuestCart();
      if (guestItems.length > 0) {
        (async () => {
          for (const item of guestItems) {
            await api.addToCart(user.id, item.productId, item.variantId, item.qty || 1);
          }
          localStorage.removeItem(GUEST_CART_KEY);
          loadCart();
        })();
      }
    }
  }, [isAuthenticated, user]);

  const addToCart = async (product, variantId, quantity = 1, size = '', color = '') => {
    if (isAuthenticated && user) {
      // Optimistic update
      const optimistic = [...cartItems, {
        id: 'temp-' + Date.now(),
        product_id: product.id,
        variant_id: variantId,
        quantity,
        qty: quantity,
        name: product.name,
        brand: product.brand,
        price: product.price,
        originalPrice: product.original_price,
        images: product.images || [],
        size,
        color,
      }];
      setCartItems(optimistic);
      showToast('Added to cart ✓');

      const { error } = await api.addToCart(user.id, product.id, variantId, quantity);
      if (error) {
        showToast(error, 'error');
        loadCart(); // Rollback
      } else {
        loadCart(); // Sync with DB
      }
    } else {
      // Guest mode
      const guestCart = getGuestCart();
      const existing = guestCart.find(i => i.variantId === variantId);
      if (existing) {
        existing.qty += quantity;
      } else {
        guestCart.push({
          id: 'guest-' + Date.now(),
          productId: product.id,
          variantId,
          qty: quantity,
          name: product.name,
          brand: product.brand,
          price: product.price,
          originalPrice: product.original_price,
          images: product.images || [],
          size,
          color,
        });
      }
      setGuestCart(guestCart);
      setCartItems(guestCart);
      showToast('Added to cart ✓');
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (isAuthenticated) {
      setCartItems(prev => prev.map(item =>
        item.id === cartItemId ? { ...item, quantity, qty: quantity } : item
      ));
      const { error } = await api.updateCartQuantity(cartItemId, quantity);
      if (error) {
        showToast(error, 'error');
        loadCart();
      }
    } else {
      const guestCart = getGuestCart();
      const item = guestCart.find(i => i.id === cartItemId);
      if (item) {
        item.qty = quantity;
        setGuestCart(guestCart);
        setCartItems(guestCart);
      }
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (isAuthenticated) {
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      const { error } = await api.removeFromCart(cartItemId);
      if (error) {
        showToast(error, 'error');
        loadCart();
      } else {
        showToast('Removed from cart');
      }
    } else {
      const guestCart = getGuestCart().filter(i => i.id !== cartItemId);
      setGuestCart(guestCart);
      setCartItems(guestCart);
      showToast('Removed from cart');
    }
  };

  const clearCartItems = async () => {
    if (isAuthenticated && user) {
      setCartItems([]);
      await api.clearCart(user.id);
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      setCartItems([]);
    }
  };

  const cartCount = cartItems.reduce((a, c) => a + (c.qty || c.quantity || 0), 0);
  const cartTotal = cartItems.reduce((a, c) => a + (c.price || 0) * (c.qty || c.quantity || 0), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      loading,
      toast,
      setToast,
      showToast,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart: clearCartItems,
      loadCart,
    }}>
      {children}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
