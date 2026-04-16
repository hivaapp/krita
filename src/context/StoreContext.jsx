import React, { createContext, useReducer, useEffect, useContext } from 'react';

const StoreContext = createContext();

const initialState = {
  cart: JSON.parse(localStorage.getItem('krita_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('krita_wishlist')) || [],
  user: null,
  toast: null, // { message: string, type: 'success'|'error'|'info' }
};

function storeReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.cart.find(
        i => i.id === action.payload.id && i.size === action.payload.size && i.color === action.payload.color
      );
      let newCart;
      if (existing) {
        newCart = state.cart.map(i => i === existing ? { ...i, qty: i.qty + action.payload.qty } : i);
      } else {
        newCart = [...state.cart, action.payload];
      }
      return { ...state, cart: newCart, toast: { message: 'Added to cart ✓', type: 'success', id: Date.now() } };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((_, idx) => idx !== action.payload) };
    case 'UPDATE_CART_QTY':
      return { 
        ...state, 
        cart: state.cart.map((item, idx) => idx === action.payload.index ? { ...item, qty: action.payload.qty } : item) 
      };
    case 'TOGGLE_WISHLIST': {
      const exists = state.wishlist.includes(action.payload);
      const newWishlist = exists ? state.wishlist.filter(id => id !== action.payload) : [...state.wishlist, action.payload];
      return { ...state, wishlist: newWishlist, toast: { message: exists ? 'Removed from wishlist' : 'Added to wishlist ♥', type: 'info', id: Date.now() } };
    }
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  useEffect(() => {
    localStorage.setItem('krita_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  useEffect(() => {
    localStorage.setItem('krita_wishlist', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  // Auto clear toast
  useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => {
        dispatch({ type: 'CLEAR_TOAST' });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [state.toast]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
      {/* Global Toast */}
      {state.toast && (
        <div className={`toast-notification toast-${state.toast.type}`}>
          {state.toast.message}
        </div>
      )}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
