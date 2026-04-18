import React, { useState, useEffect } from 'react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../adminApi';
import { Plus, Pencil, Trash2, Shuffle } from 'lucide-react';

export default function Discounts() {
  const [coupons, setCoupons] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const { data } = await getCoupons(); setCoupons(data || []); setLoading(false); }

  function newCoupon() {
    setModal({ code: '', discount_type: 'percent', discount_value: '', min_order_value: '', max_uses: '', per_user_limit: '', starts_at: '', expires_at: '', is_active: true });
  }

  function editCoupon(c) {
    setModal({ id: c.id, code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, min_order_value: c.min_order_value || '', max_uses: c.max_uses || '', per_user_limit: c.per_user_limit || '', starts_at: c.starts_at ? c.starts_at.slice(0, 16) : '', expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '', is_active: c.is_active });
  }

  function genCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setModal(m => ({ ...m, code }));
  }

  async function handleSave() {
    if (!modal.code) return;
    const data = {
      code: modal.code.toUpperCase(), discount_type: modal.discount_type,
      discount_value: parseFloat(modal.discount_value) || 0,
      min_order_value: parseFloat(modal.min_order_value) || 0,
      max_uses: modal.max_uses ? parseInt(modal.max_uses) : null,
      per_user_limit: modal.per_user_limit ? parseInt(modal.per_user_limit) : null,
      starts_at: modal.starts_at || null, expires_at: modal.expires_at || null,
      is_active: modal.is_active,
    };
    if (modal.id) await updateCoupon(modal.id, data);
    else await createCoupon(data);
    setModal(null); load();
  }

  function getStatus(c) {
    if (!c.is_active) return { label: 'Disabled', cls: 'admin-badge-gray' };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: 'Expired', cls: 'admin-badge-danger' };
    if (c.starts_at && new Date(c.starts_at) > new Date()) return { label: 'Scheduled', cls: 'admin-badge-info' };
    return { label: 'Active', cls: 'admin-badge-success' };
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Discounts & Coupons</h1>
        <button className="admin-btn admin-btn-primary" onClick={newCoupon}><Plus size={16} /> Create Coupon</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {coupons.map(c => {
              const st = getStatus(c);
              return (
                <tr key={c.id}>
                  <td className="admin-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                  <td>{c.discount_type === 'percent' ? 'Percentage' : 'Flat'}</td>
                  <td>{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                  <td>₹{c.min_order_value || 0}</td>
                  <td>{c.uses_count || 0}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td style={{ fontSize: 12 }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                  <td><span className={`admin-badge ${st.cls}`}>{st.label}</span></td>
                  <td>
                    <div className="admin-flex admin-gap-8">
                      <button className="admin-btn-icon" onClick={() => editCoupon(c)}><Pencil size={15} /></button>
                      <button className="admin-btn-icon" style={{ color: 'var(--admin-danger)' }} onClick={async () => { if (confirm('Delete this coupon?')) { await deleteCoupon(c.id); load(); } }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {coupons.length === 0 && <div className="admin-empty"><h3>No coupons yet</h3></div>}
      </div>

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{modal.id ? 'Edit' : 'Create'} Coupon</h3>
              <button className="admin-btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-label">Code</label>
                <div className="admin-flex admin-gap-8">
                  <input className="admin-input admin-mono" value={modal.code} onChange={e => setModal({ ...modal, code: e.target.value.toUpperCase() })} style={{ textTransform: 'uppercase' }} />
                  <button className="admin-btn admin-btn-secondary" onClick={genCode} title="Random"><Shuffle size={14} /></button>
                </div>
              </div>
              <div className="admin-grid admin-grid-2">
                <div className="admin-form-group">
                  <label className="admin-label">Type</label>
                  <select className="admin-select" value={modal.discount_type} onChange={e => setModal({ ...modal, discount_type: e.target.value })}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Value</label>
                  <input className="admin-input" type="number" value={modal.discount_value} onChange={e => setModal({ ...modal, discount_value: e.target.value })} />
                </div>
              </div>
              <div className="admin-grid admin-grid-2">
                <div className="admin-form-group"><label className="admin-label">Min Order (₹)</label><input className="admin-input" type="number" value={modal.min_order_value} onChange={e => setModal({ ...modal, min_order_value: e.target.value })} /></div>
                <div className="admin-form-group"><label className="admin-label">Max Uses</label><input className="admin-input" type="number" value={modal.max_uses} onChange={e => setModal({ ...modal, max_uses: e.target.value })} placeholder="Unlimited" /></div>
              </div>
              <div className="admin-grid admin-grid-2">
                <div className="admin-form-group"><label className="admin-label">Start Date</label><input className="admin-input" type="datetime-local" value={modal.starts_at} onChange={e => setModal({ ...modal, starts_at: e.target.value })} /></div>
                <div className="admin-form-group"><label className="admin-label">Expiry Date</label><input className="admin-input" type="datetime-local" value={modal.expires_at} onChange={e => setModal({ ...modal, expires_at: e.target.value })} /></div>
              </div>
              <label className="admin-flex admin-gap-8" style={{ fontSize: 13, cursor: 'pointer' }}>
                <button className={`admin-toggle ${modal.is_active ? 'active' : ''}`} onClick={() => setModal({ ...modal, is_active: !modal.is_active })} type="button" /> Active
              </label>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
