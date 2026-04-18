import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOut, updatePassword } from '../lib/auth';
import * as api from '../lib/api';
import { User, MapPin, ShieldCheck, LogOut, Plus, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [addrForm, setAddrForm] = useState(null);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
    if (user) api.getAddresses(user.id).then(({ data }) => setAddresses(data || []));
  }, [profile, user]);

  const saveProfile = async () => {
    setSaving(true);
    const { data } = await api.updateProfile(user.id, form);
    if (data) setProfile(data);
    setSaving(false);
    setMsg('Profile updated!');
    setTimeout(() => setMsg(''), 3000);
  };

  const changePw = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { setMsg('Passwords do not match'); return; }
    const { error } = await updatePassword(pwForm.newPassword);
    setMsg(error || 'Password updated!');
    setPwForm({ newPassword: '', confirm: '' });
  };

  const saveAddr = async () => {
    if (!addrForm) return;
    if (addrForm.id) {
      await api.updateAddress(addrForm.id, addrForm);
    } else {
      await api.addAddress(user.id, addrForm);
    }
    setAddrForm(null);
    const { data } = await api.getAddresses(user.id);
    setAddresses(data || []);
  };

  const deleteAddr = async (id) => {
    await api.deleteAddress(id);
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const tabs = [
    { key: 'info', label: 'Personal Info', icon: <User size={16}/> },
    { key: 'addresses', label: 'Addresses', icon: <MapPin size={16}/> },
    { key: 'security', label: 'Security', icon: <ShieldCheck size={16}/> },
  ];

  return (
    <div className="container section">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px' }}>
        <h1>My Account</h1>
        <button className="btn btn-outline" onClick={handleLogout} style={{display:'flex',alignItems:'center',gap:'8px'}}><LogOut size={16}/>Logout</button>
      </div>
      <div style={{ display:'flex',gap:'8px',marginBottom:'32px',overflowX:'auto' }}>
        {tabs.map(t => (
          <button key={t.key} className={`btn ${tab===t.key?'btn-primary':'btn-outline'}`} onClick={()=>setTab(t.key)} style={{display:'flex',alignItems:'center',gap:'6px',whiteSpace:'nowrap'}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {msg && <div style={{ padding:'12px',background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'8px',marginBottom:'24px',fontSize:'14px' }}>{msg}</div>}

      {tab === 'info' && (
        <div style={{ maxWidth:'500px' }}>
          <div className="form-group"><label>Email</label><input className="form-input" value={user?.email||''} disabled /></div>
          <div className="form-group"><label>Full Name</label><input className="form-input" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} /></div>
          <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?'Saving...':'Save Changes'}</button>
        </div>
      )}

      {tab === 'addresses' && (
        <div style={{ maxWidth:'600px' }}>
          {addrForm ? (
            <div style={{background:'var(--color-surface)',padding:'24px',borderRadius:'8px',border:'1px solid var(--color-border)',marginBottom:'24px'}}>
              <h3 style={{marginBottom:'16px'}}>{addrForm.id?'Edit':'New'} Address</h3>
              {['full_name','phone','line1','line2','city','state','pin_code'].map(f=>(
                <div className="form-group" key={f}><label style={{textTransform:'capitalize'}}>{f.replace('_',' ')}</label>
                  <input className="form-input" value={addrForm[f]||''} onChange={e=>setAddrForm(a=>({...a,[f]:e.target.value}))} />
                </div>
              ))}
              <div style={{display:'flex',gap:'12px'}}>
                <button className="btn btn-primary" onClick={saveAddr}>Save</button>
                <button className="btn btn-outline" onClick={()=>setAddrForm(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-outline" onClick={()=>setAddrForm({full_name:'',phone:'',line1:'',line2:'',city:'',state:'',pin_code:''})} style={{marginBottom:'24px',display:'flex',alignItems:'center',gap:'8px'}}><Plus size={16}/>Add Address</button>
          )}
          {addresses.map(a => (
            <div key={a.id} style={{padding:'16px',border:'1px solid var(--color-border)',borderRadius:'8px',marginBottom:'12px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontWeight:500}}>{a.full_name} {a.is_default && <span style={{fontSize:'11px',background:'var(--color-accent)',color:'#fff',padding:'2px 8px',borderRadius:'10px',marginLeft:'8px'}}>Default</span>}</div>
                <div style={{fontSize:'14px',color:'var(--color-text-secondary)',marginTop:'4px'}}>{a.line1}, {a.city}, {a.state} {a.pin_code}</div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button className="icon-btn" onClick={()=>setAddrForm(a)} title="Edit"><User size={14}/></button>
                {!a.is_default && <button className="icon-btn" onClick={()=>api.setDefaultAddress(user.id,a.id).then(()=>api.getAddresses(user.id).then(({data})=>setAddresses(data||[])))} title="Set default"><Check size={14}/></button>}
                <button className="icon-btn" onClick={()=>deleteAddr(a.id)} title="Delete"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'security' && (
        <div style={{ maxWidth:'400px' }}>
          <div className="form-group"><label>New Password</label><input type="password" className="form-input" value={pwForm.newPassword} onChange={e=>setPwForm(f=>({...f,newPassword:e.target.value}))} minLength={6}/></div>
          <div className="form-group"><label>Confirm Password</label><input type="password" className="form-input" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))}/></div>
          <button className="btn btn-primary" onClick={changePw}>Change Password</button>
        </div>
      )}
    </div>
  );
}
