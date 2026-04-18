import React, { useState, useEffect } from 'react';
import { getCollections, createCollection, updateCollection, deleteCollection, getProducts, setCollectionProducts, getCollection } from '../adminApi';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const { data } = await getCollections(); setCollections(data || []); setLoading(false); }

  function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  async function openNew() {
    const { data } = await getProducts({ perPage: 100 });
    setAllProducts(data || []);
    setSelectedProducts([]);
    setModal({ name: '', slug: '', description: '', is_active: true, is_featured: false });
  }

  async function openEdit(col) {
    const [prods, detail] = await Promise.all([getProducts({ perPage: 100 }), getCollection(col.id)]);
    setAllProducts(prods.data || []);
    const existingIds = (detail.data?.collection_products || []).map(cp => cp.product_id);
    setSelectedProducts(existingIds);
    setModal({ id: col.id, name: col.name, slug: col.slug, description: col.description || '', is_active: col.is_active, is_featured: col.is_featured });
  }

  async function handleSave() {
    if (!modal.name) return;
    const data = { name: modal.name, slug: modal.slug || slugify(modal.name), description: modal.description, is_active: modal.is_active, is_featured: modal.is_featured };
    let colId = modal.id;
    if (modal.id) { await updateCollection(modal.id, data); } else {
      const { data: created } = await createCollection(data);
      colId = created?.id;
    }
    if (colId) await setCollectionProducts(colId, selectedProducts);
    setModal(null); load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this collection?')) return;
    await deleteCollection(id); load();
  }

  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Collections</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}><Plus size={16} /> New Collection</button>
      </div>

      <div className="admin-grid admin-grid-3">
        {collections.map(c => (
          <div key={c.id} className="admin-card">
            {c.cover_image_url && <img src={c.cover_image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--admin-radius-sm)', marginBottom: 12 }} />}
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{c.name}</h3>
            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{c.productCount} products</div>
            <div className="admin-flex admin-gap-8">
              <span className={`admin-badge ${c.is_active ? 'admin-badge-success' : 'admin-badge-gray'}`}>{c.is_active ? 'Active' : 'Draft'}</span>
              {c.is_featured && <span className="admin-badge admin-badge-info">Featured</span>}
            </div>
            <div className="admin-flex admin-gap-8" style={{ marginTop: 12 }}>
              <button className="admin-btn admin-btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => openEdit(c)}><Pencil size={12} /> Edit</button>
              <button className="admin-btn admin-btn-danger" style={{ fontSize: 12 }} onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {collections.length === 0 && <div className="admin-empty" style={{ gridColumn: '1/-1' }}><h3>No collections yet</h3></div>}
      </div>

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{modal.id ? 'Edit' : 'New'} Collection</h3>
              <button className="admin-btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group"><label className="admin-label">Name</label><input className="admin-input" value={modal.name} onChange={e => setModal({ ...modal, name: e.target.value, slug: modal.id ? modal.slug : slugify(e.target.value) })} /></div>
              <div className="admin-form-group"><label className="admin-label">Slug</label><input className="admin-input admin-mono" value={modal.slug} onChange={e => setModal({ ...modal, slug: e.target.value })} /></div>
              <div className="admin-form-group"><label className="admin-label">Description</label><textarea className="admin-textarea" value={modal.description} onChange={e => setModal({ ...modal, description: e.target.value })} rows={3} /></div>
              <div className="admin-flex admin-gap-16" style={{ marginBottom: 16 }}>
                <label className="admin-flex admin-gap-8" style={{ fontSize: 13 }}><button className={`admin-toggle ${modal.is_active ? 'active' : ''}`} onClick={() => setModal({ ...modal, is_active: !modal.is_active })} type="button" /> Active</label>
                <label className="admin-flex admin-gap-8" style={{ fontSize: 13 }}><button className={`admin-toggle ${modal.is_featured ? 'active' : ''}`} onClick={() => setModal({ ...modal, is_featured: !modal.is_featured })} type="button" /> Featured</label>
              </div>

              <label className="admin-label">Products ({selectedProducts.length})</label>
              <div className="admin-flex admin-gap-8" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                {selectedProducts.map(pid => {
                  const p = allProducts.find(pr => pr.id === pid);
                  return <span key={pid} className="admin-badge admin-badge-info" style={{ cursor: 'pointer', padding: '4px 8px' }} onClick={() => setSelectedProducts(prev => prev.filter(i => i !== pid))}>{p?.name || pid.slice(0,8)} ×</span>;
                })}
              </div>
              <input className="admin-input" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} style={{ marginBottom: 8 }} />
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)' }}>
                {filteredProducts.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--admin-border)', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={e => setSelectedProducts(e.target.checked ? [...selectedProducts, p.id] : selectedProducts.filter(i => i !== p.id))} />
                    {p.name}
                  </label>
                ))}
              </div>
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
