import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isAdminEmail } from './adminApi';

const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_BEFORE = 10 * 60 * 1000; // 10 min before

export default function AdminGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | authorized | denied
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);
  const warningRef = useRef(null);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription?.unsubscribe();
  }, [location.pathname]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus('denied');
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!isAdminEmail(user.email)) {
      await supabase.auth.signOut();
      setStatus('denied');
      navigate('/admin/login', { state: { error: 'Access denied. This portal is restricted.' }, replace: true });
      return;
    }
    setStatus('authorized');
    resetInactivityTimer();
  }

  function resetInactivityTimer() {
    clearTimeout(timerRef.current);
    clearTimeout(warningRef.current);
    setShowWarning(false);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    timerRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      navigate('/admin/login', { state: { error: 'Session expired due to inactivity.' }, replace: true });
    }, INACTIVITY_TIMEOUT);
  }

  useEffect(() => {
    if (status !== 'authorized') return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handler));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="admin-login-page">
        <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="admin-spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
          Verifying access...
        </div>
      </div>
    );
  }

  if (status === 'denied') return null;

  return (
    <>
      {children}
      {showWarning && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 400 }}>
            <div className="admin-modal-body" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
              <h3 style={{ marginBottom: 8 }}>Session Expiring Soon</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginBottom: 20 }}>
                You'll be signed out in 10 minutes due to inactivity.
              </p>
              <button className="admin-btn admin-btn-primary" onClick={resetInactivityTimer}>
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
