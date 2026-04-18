import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../adminApi';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [modal, setModal] = useState(null); // null | { id?, name, slug, is_active, display_order, image_url }
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const { data } = await getCategories();
    setCats(data || []);
    setLoading(false);
  }

  function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  function openNew() {
    setModal({ name: '', slug: '', is_active: true, display_order: cats.length, image_url: '' });
  }

  function openEdit(c) {
    setModal({ id: c.id, name: c.name, slug: c.slug, is_active: c.is_active, display_order: c.display_order, image_url: c.image_url || '' });
  }

  async function handleSave() {
    if (!modal.name) return;
    const data = { name: modal.name, slug: modal.slug || slugify(modal.name), is_active: modal.is_active, display_order: modal.display_order, image_url: modal.image_url || null };
    if (modal.id) await updateCategory(modal.id, data);
    else await createCategory(data);
    setModal(null);
    load();
  }

  async function handleDelete() {
    const cat = cats.find(c => c.id === deleteModal);
    if (cat && cat.productCount > 0) { alert(`Cannot delete: ${cat.productCount} products use this category.`); setDeleteModal(null); return; }
    await deleteCategory(deleteModal);
    setDeleteModal(null);
    load();
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Categories</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}><Plus size={16} /> Add Category</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Name</th><th>Slug</th><th>Products</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id}>
                <td>{c.image_url ? <img src={c.image_url} className="admin-img-thumb" alt="" /> : <div className="admin-img-thumb" />}</td>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td className="admin-mono">{c.slug}</td>
                <td>{c.productCount}</td>
                <td>{c.display_order}</td>
                <td><span className={`admin-badge ${c.is_active ? 'admin-badge-success' : 'admin-badge-gray'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="admin-flex admin-gap-8">
                    <button className="admin-btn-icon" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                    <button className="admin-btn-icon" style={{ color: 'var(--admin-danger)' }} onClick={() => setDeleteModal(c.id)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{modal.id ? 'Edit' : 'Add'} Category</h3>
              <button className="admin-btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group"><label className="admin-label">Name *</label><input className="admin-input" value={modal.name} onChange={e => setModal({ ...modal, name: e.target.value, slug: modal.id ? modal.slug : slugify(e.target.value) })} /></div>
              <div className="admin-form-group"><label className="admin-label">Slug</label><input className="admin-input admin-mono" value={modal.slug} onChange={e => setModal({ ...modal, slug: e.target.value })} /></div>
              <div className="admin-form-group"><label className="admin-label">Image URL</label><input className="admin-input" value={modal.image_url} onChange={e => setModal({ ...modal, image_url: e.target.value })} /></div>
              <div className="admin-form-group"><label className="admin-label">Display Order</label><input className="admin-input" type="number" value={modal.display_order} onChange={e => setModal({ ...modal, display_order: parseInt(e.target.value) || 0 })} /></div>
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

      {deleteModal && (
        <div className="admin-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header"><h3 className="admin-modal-title">Delete Category</h3></div>
            <div className="admin-modal-body"><p>Are you sure? Categories with products cannot be deleted.</p></div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
