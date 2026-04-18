import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, resetPassword } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(() => navigate('/'));
  }, [navigate]);
  return <div className="container section" style={{textAlign:'center',padding:'100px 0'}}>Authenticating...</div>;
}

export default function AuthPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') || '/';
  const [isLogin, setIsLogin] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email:'', password:'', firstName:'', lastName:'' });

  useEffect(() => {
    if (isAuthenticated) navigate(redirect, { replace: true });
  }, [isAuthenticated]);

  const handleChange = (e) => { setForm(f => ({...f, [e.target.name]: e.target.value})); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (showReset) {
      const { error } = await resetPassword(form.email);
      setLoading(false);
      if (error) setError(error);
      else setSuccess('Password reset email sent! Check your inbox.');
      return;
    }

    if (isLogin) {
      const { error } = await signInWithEmail(form.email, form.password);
      setLoading(false);
      if (error) setError(error);
    } else {
      const { error } = await signUpWithEmail(form.email, form.password, `${form.firstName} ${form.lastName}`);
      setLoading(false);
      if (error) setError(error);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => navigate(redirect), 2000);
    }
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  if (showReset) {
    return (
      <div className="container section" style={{ display:'flex',justifyContent:'center' }}>
        <div style={{ background:'var(--color-surface)',padding:'40px',borderRadius:'8px',border:'1px solid var(--color-border)',width:'100%',maxWidth:'400px' }}>
          <h1 style={{ fontSize:'24px',textAlign:'center',marginBottom:'32px' }}>Reset Password</h1>
          {error && <div style={{color:'var(--color-error)',fontSize:'14px',marginBottom:'16px',textAlign:'center'}}>{error}</div>}
          {success && <div style={{color:'var(--color-success)',fontSize:'14px',marginBottom:'16px',textAlign:'center'}}>{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Email Address</label><input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required /></div>
            <button type="submit" className="btn btn-primary" style={{width:'100%',marginBottom:'16px'}} disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
          <div style={{textAlign:'center',fontSize:'14px'}}><button onClick={()=>{setShowReset(false);setSuccess('');}} style={{textDecoration:'underline',color:'var(--color-text-secondary)'}}>Back to Login</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ display:'flex',justifyContent:'center' }}>
      <div style={{ background:'var(--color-surface)',padding:'40px',borderRadius:'8px',border:'1px solid var(--color-border)',width:'100%',maxWidth:'400px' }}>
        <h1 style={{ fontSize:'24px',textAlign:'center',marginBottom:'32px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        {error && <div style={{color:'var(--color-error)',fontSize:'14px',marginBottom:'16px',textAlign:'center'}}>{error}</div>}
        {success && <div style={{color:'var(--color-success)',fontSize:'14px',marginBottom:'16px',textAlign:'center'}}>{success}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ display:'flex',gap:'16px' }}>
              <div className="form-group" style={{flex:1}}><label>First Name</label><input name="firstName" className="form-input" value={form.firstName} onChange={handleChange} required /></div>
              <div className="form-group" style={{flex:1}}><label>Last Name</label><input name="lastName" className="form-input" value={form.lastName} onChange={handleChange} /></div>
            </div>
          )}
          <div className="form-group"><label>Email Address</label><input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required /></div>
          <div className="form-group"><label>Password</label><input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} required minLength={6} /></div>
          {isLogin && (
            <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:'24px',fontSize:'13px' }}>
              <button type="button" onClick={()=>setShowReset(true)} style={{ color:'var(--color-text-secondary)',textDecoration:'underline' }}>Forgot Password?</button>
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width:'100%',marginBottom:'16px' }} disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}</button>
        </form>
        <div style={{ textAlign:'center',marginBottom:'16px',fontSize:'13px',color:'var(--color-text-secondary)' }}>or</div>
        <button onClick={handleGoogle} className="btn btn-outline" style={{ width:'100%',marginBottom:'24px' }}>Continue with Google</button>
        <div style={{ textAlign:'center',fontSize:'14px',color:'var(--color-text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => {setIsLogin(!isLogin);setError('');setSuccess('');}} style={{ color:'var(--color-text-primary)',textDecoration:'underline',fontWeight:500 }}>{isLogin ? 'Register' : 'Login'}</button>
        </div>
      </div>
    </div>
  );
}
