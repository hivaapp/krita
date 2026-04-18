import React, { useState, useEffect } from 'react';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../adminApi';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const { data } = await getBanners(); setBanners(data || []); setLoading(false); }

  function openNew() { setModal({ title: '', subtitle: '', cta_text: '', cta_link: '', desktop_image_url: '', mobile_image_url: '', type: 'hero', display_order: banners.length, is_active: true, starts_at: '', ends_at: '' }); }
  function openEdit(b) { setModal({ id: b.id, title: b.title, subtitle: b.subtitle || '', cta_text: b.cta_text || '', cta_link: b.cta_link || '', desktop_image_url: b.desktop_image_url || '', mobile_image_url: b.mobile_image_url || '', type: b.type, display_order: b.display_order, is_active: b.is_active, starts_at: b.starts_at ? b.starts_at.slice(0, 16) : '', ends_at: b.ends_at ? b.ends_at.slice(0, 16) : '' }); }

  async function handleSave() {
    if (!modal.title) return;
    const data = { title: modal.title, subtitle: modal.subtitle, cta_text: modal.cta_text, cta_link: modal.cta_link, desktop_image_url: modal.desktop_image_url || null, mobile_image_url: modal.mobile_image_url || null, type: modal.type, display_order: modal.display_order, is_active: modal.is_active, starts_at: modal.starts_at || null, ends_at: modal.ends_at || null };
    if (modal.id) await updateBanner(modal.id, data);
    else await createBanner(data);
    setModal(null); load();
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Banners</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}><Plus size={16} /> Add Banner</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Preview</th><th>Title</th><th>Type</th><th>Link</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {banners.map(b => (
              <tr key={b.id}>
                <td>{b.desktop_image_url ? <img src={b.desktop_image_url} style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }} alt="" /> : <div style={{ width: 80, height: 40, background: 'var(--admin-bg)', borderRadius: 4 }} />}</td>
                <td style={{ fontWeight: 500 }}>{b.title}</td>
                <td><span className="admin-badge admin-badge-gray">{b.type}</span></td>
                <td style={{ fontSize: 12 }}>{b.cta_link || '—'}</td>
                <td>{b.display_order}</td>
                <td><span className={`admin-badge ${b.is_active ? 'admin-badge-success' : 'admin-badge-gray'}`}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="admin-flex admin-gap-8">
                    <button className="admin-btn-icon" onClick={() => openEdit(b)}><Pencil size={15} /></button>
                    <button className="admin-btn-icon" style={{ color: 'var(--admin-danger)' }} onClick={async () => { if (confirm('Delete?')) { await deleteBanner(b.id); load(); } }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {banners.length === 0 && <div className="admin-empty"><h3>No banners yet</h3></div>}
      </div>

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header"><h3 className="admin-modal-title">{modal.id ? 'Edit' : 'Add'} Banner</h3><button className="admin-btn-icon" onClick={() => setModal(null)}>✕</button></div>
            <div className="admin-modal-body">
              <div className="admin-form-group"><label className="admin-label">Title</label><input className="admin-input" value={modal.title} onChange={e => setModal({ ...modal, title: e.target.value })} /></div>
              <div className="admin-form-group"><label className="admin-label">Subtitle</label><input className="admin-input" value={modal.subtitle} onChange={e => setModal({ ...modal, subtitle: e.target.value })} /></div>
              <div className="admin-grid admin-grid-2">
                <div className="admin-form-group"><label className="admin-label">CTA Text</label><input className="admin-input" value={modal.cta_text} onChange={e => setModal({ ...modal, cta_text: e.target.value })} /></div>
                <div className="admin-form-group"><label className="admin-label">CTA Link</label><input className="admin-input" value={modal.cta_link} onChange={e => setModal({ ...modal, cta_link: e.target.value })} /></div>
              </div>
              <div className="admin-form-group"><label className="admin-label">Desktop Image URL</label><input className="admin-input" value={modal.desktop_image_url} onChange={e => setModal({ ...modal, desktop_image_url: e.target.value })} /></div>
              <div className="admin-form-group"><label className="admin-label">Mobile Image URL</label><input className="admin-input" value={modal.mobile_image_url} onChange={e => setModal({ ...modal, mobile_image_url: e.target.value })} /></div>
              <div className="admin-grid admin-grid-2">
                <div className="admin-form-group"><label className="admin-label">Type</label><select className="admin-select" value={modal.type} onChange={e => setModal({ ...modal, type: e.target.value })}><option value="hero">Hero</option><option value="promo">Promo</option><option value="category">Category</option></select></div>
                <div className="admin-form-group"><label className="admin-label">Order</label><input className="admin-input" type="number" value={modal.display_order} onChange={e => setModal({ ...modal, display_order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="admin-grid admin-grid-2">
                <div className="admin-form-group"><label className="admin-label">Start Date</label><input className="admin-input" type="datetime-local" value={modal.starts_at} onChange={e => setModal({ ...modal, starts_at: e.target.value })} /></div>
                <div className="admin-form-group"><label className="admin-label">End Date</label><input className="admin-input" type="datetime-local" value={modal.ends_at} onChange={e => setModal({ ...modal, ends_at: e.target.value })} /></div>
              </div>
              <label className="admin-flex admin-gap-8" style={{ fontSize: 13 }}><button className={`admin-toggle ${modal.is_active ? 'active' : ''}`} onClick={() => setModal({ ...modal, is_active: !modal.is_active })} type="button" /> Active</label>
            </div>
            <div className="admin-modal-footer"><button className="admin-btn admin-btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={handleSave}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
