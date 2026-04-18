import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../lib/api';

const WishlistContext = createContext();

const GUEST_WISHLIST_KEY = 'krita_guest_wishlist';

function getGuestWishlist() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (isAuthenticated && user) {
      setLoading(true);
      const { data } = await api.getWishlist(user.id);
      setWishlistItems(data || []);
      setWishlistIds(new Set((data || []).map(item => item.id)));
      setLoading(false);
    } else {
      const guestIds = getGuestWishlist();
      setWishlistIds(new Set(guestIds));
      setWishlistItems([]);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Merge guest wishlist on login
  useEffect(() => {
    if (isAuthenticated && user) {
      const guestIds = getGuestWishlist();
      if (guestIds.length > 0) {
        (async () => {
          for (const productId of guestIds) {
            await api.addToWishlist(user.id, productId);
          }
          localStorage.removeItem(GUEST_WISHLIST_KEY);
          loadWishlist();
        })();
      }
    }
  }, [isAuthenticated, user]);

  const isInWishlist = (productId) => wishlistIds.has(productId);

  const toggleWishlist = async (productId) => {
    const inList = isInWishlist(productId);

    if (isAuthenticated && user) {
      // Optimistic update
      if (inList) {
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
        await api.removeFromWishlist(user.id, productId);
      } else {
        setWishlistIds(prev => new Set(prev).add(productId));
        await api.addToWishlist(user.id, productId);
        loadWishlist(); // Refresh to get full product data
      }
    } else {
      // Guest mode
      const guestIds = getGuestWishlist();
      if (inList) {
        const filtered = guestIds.filter(id => id !== productId);
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(filtered));
        setWishlistIds(new Set(filtered));
      } else {
        guestIds.push(productId);
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(guestIds));
        setWishlistIds(new Set(guestIds));
      }
    }

    return !inList; // Returns new state: true = added, false = removed
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistIds,
      wishlistCount: wishlistIds.size,
      loading,
      isInWishlist,
      toggleWishlist,
      loadWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
