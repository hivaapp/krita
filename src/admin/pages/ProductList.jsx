import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct, getCategories, updateProduct } from '../adminApi';
import { Plus, Search, Pencil, Trash2, Copy, MoreVertical } from 'lucide-react';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [categories, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleteModal, setDeleteModal] = useState(null);
  const navigate = useNavigate();
  const perPage = 20;

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts(); }, [page, search, category, status, sort]);

  async function loadCategories() {
    const { data } = await getCategories();
    setCats(data || []);
  }

  async function loadProducts() {
    setLoading(true);
    const { data, count } = await getProducts({ page, perPage, search, category, status, sort });
    setProducts(data || []);
    setTotal(count || 0);
    setLoading(false);
  }

  function getPrimaryImage(product) {
    const imgs = product.product_images || [];
    const primary = imgs.find(i => i.is_primary);
    return primary?.image_url || imgs[0]?.image_url || '';
  }

  function getTotalStock(product) {
    return (product.product_variants || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  }

  function stockBadge(stock) {
    if (stock === 0) return <span className="admin-badge admin-badge-danger">Out of Stock</span>;
    if (stock <= 10) return <span className="admin-badge admin-badge-warning">{stock}</span>;
    return <span className="admin-badge admin-badge-success">{stock}</span>;
  }

  async function handleDelete() {
    if (!deleteModal) return;
    await deleteProduct(deleteModal);
    setDeleteModal(null);
    loadProducts();
  }

  async function handleBulkAction(action) {
    for (const id of selected) {
      if (action === 'activate') await updateProduct(id, { is_active: true });
      if (action === 'deactivate') await updateProduct(id, { is_active: false });
      if (action === 'delete') await deleteProduct(id);
    }
    setSelected([]);
    loadProducts();
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Products</h1>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary" style={{ textDecoration: 'none' }}>
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--admin-text-muted)' }} />
          <input className="admin-input" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 32, maxWidth: 260 }} />
        </div>
        <select className="admin-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="admin-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        <select className="admin-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="name-asc">Name A-Z</option>
        </select>
        {selected.length > 0 && (
          <div className="admin-toolbar-right">
            <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{selected.length} selected</span>
            <button className="admin-btn admin-btn-secondary" onClick={() => handleBulkAction('activate')}>Activate</button>
            <button className="admin-btn admin-btn-secondary" onClick={() => handleBulkAction('deactivate')}>Deactivate</button>
            <button className="admin-btn admin-btn-danger" onClick={() => handleBulkAction('delete')}>Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /></div>
        ) : products.length === 0 ? (
          <div className="admin-empty"><Package size={40} /><h3>No products found</h3><p>Try adjusting your filters</p></div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.length === products.length && products.length > 0} onChange={e => setSelected(e.target.checked ? products.map(p => p.id) : [])} />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const stock = getTotalStock(p);
                  return (
                    <tr key={p.id}>
                      <td><input type="checkbox" checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(s => s !== p.id))} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {getPrimaryImage(p) ? <img src={getPrimaryImage(p)} className="admin-img-thumb" alt="" /> : <div className="admin-img-thumb" />}
                          <div>
                            <Link to={`/admin/products/${p.id}/edit`} style={{ fontWeight: 500, color: 'var(--admin-text)', textDecoration: 'none' }}>{p.name}</Link>
                            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.categories?.name || '—'}</td>
                      <td>
                        <div>₹{Number(p.price).toLocaleString('en-IN')}</div>
                        {p.original_price && p.original_price > p.price && (
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textDecoration: 'line-through' }}>₹{Number(p.original_price).toLocaleString('en-IN')}</div>
                        )}
                      </td>
                      <td>{stockBadge(stock)}</td>
                      <td>
                        <span className={`admin-badge ${p.is_active ? 'admin-badge-success' : 'admin-badge-gray'}`}>
                          {p.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="admin-flex admin-gap-8">
                          <button className="admin-btn-icon" onClick={() => navigate(`/admin/products/${p.id}/edit`)} title="Edit"><Pencil size={15} /></button>
                          <button className="admin-btn-icon" onClick={() => setDeleteModal(p.id)} title="Delete" style={{ color: 'var(--admin-danger)' }}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="admin-pagination">
              <span>Showing {(page-1)*perPage+1}–{Math.min(page*perPage, total)} of {total}</span>
              <div className="admin-pagination-btns">
                <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button key={i+1} className={`admin-page-btn ${page === i+1 ? 'active' : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                ))}
                <button className="admin-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="admin-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Delete Product</h3>
              <button className="admin-btn-icon" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 14 }}>Are you sure you want to delete this product? This action cannot be undone. All variants and images will also be deleted.</p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete}>Delete Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
