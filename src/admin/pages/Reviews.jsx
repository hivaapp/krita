import React, { useState, useEffect } from 'react';
import { getReviews, updateReview, deleteReview } from '../adminApi';
import { Check, X, Trash2, Star } from 'lucide-react';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => { load(); }, [filter, ratingFilter]);
  async function load() { setLoading(true); const { data } = await getReviews({ status: filter, rating: ratingFilter }); setReviews(data || []); setLoading(false); }

  async function approve(id) { await updateReview(id, { is_approved: true }); load(); }
  async function reject(id) { await updateReview(id, { is_approved: false }); load(); }
  async function remove(id) { if (confirm('Delete this review permanently?')) { await deleteReview(id); load(); } }

  async function bulkAction(action) {
    for (const id of selected) {
      if (action === 'approve') await updateReview(id, { is_approved: true });
      if (action === 'reject') await updateReview(id, { is_approved: false });
      if (action === 'delete') await deleteReview(id);
    }
    setSelected([]); load();
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Reviews</h1>
      <div className="admin-toolbar">
        <select className="admin-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
        <select className="admin-select" value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
          <option value="">All Ratings</option>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
        </select>
        {selected.length > 0 && (
          <div className="admin-toolbar-right">
            <span style={{ fontSize: 12 }}>{selected.length} selected</span>
            <button className="admin-btn admin-btn-secondary" onClick={() => bulkAction('approve')}>Approve</button>
            <button className="admin-btn admin-btn-secondary" onClick={() => bulkAction('reject')}>Reject</button>
            <button className="admin-btn admin-btn-danger" onClick={() => bulkAction('delete')}>Delete</button>
          </div>
        )}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th style={{ width: 40 }}><input type="checkbox" onChange={e => setSelected(e.target.checked ? reviews.map(r => r.id) : [])} /></th><th>Product</th><th>Customer</th><th>Rating</th><th>Title</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id}>
                <td><input type="checkbox" checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(s => s !== r.id))} /></td>
                <td>
                  <div className="admin-flex admin-gap-8">
                    {r.products?.product_images?.[0]?.image_url && <img src={r.products.product_images[0].image_url} className="admin-img-thumb" alt="" />}
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{r.products?.name}</span>
                  </div>
                </td>
                <td>{r.profiles?.full_name || 'Anonymous'}</td>
                <td>
                  <div className="admin-flex admin-gap-8">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= r.rating ? '#F59E0B' : 'none'} color={s <= r.rating ? '#F59E0B' : '#D1D5DB'} />)}
                  </div>
                </td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || r.body?.slice(0, 40)}</td>
                <td style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td><span className={`admin-badge ${r.is_approved ? 'admin-badge-success' : 'admin-badge-warning'}`}>{r.is_approved ? 'Approved' : 'Pending'}</span></td>
                <td>
                  <div className="admin-flex admin-gap-8">
                    {!r.is_approved && <button className="admin-btn-icon" onClick={() => approve(r.id)} title="Approve" style={{ color: 'var(--admin-success)' }}><Check size={16} /></button>}
                    {r.is_approved && <button className="admin-btn-icon" onClick={() => reject(r.id)} title="Reject" style={{ color: 'var(--admin-warning)' }}><X size={16} /></button>}
                    <button className="admin-btn-icon" onClick={() => remove(r.id)} style={{ color: 'var(--admin-danger)' }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <div className="admin-empty"><h3>No reviews found</h3></div>}
      </div>
    </div>
  );
}
