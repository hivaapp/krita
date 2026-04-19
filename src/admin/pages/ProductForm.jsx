import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, getCategories, upsertVariants, upsertProductImages, uploadProductMedia } from '../adminApi';
import { Save, X, Plus, Trash2, GripVertical, Star, Upload, Film } from 'lucide-react';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', brand: '', slug: '', category_id: '', description: '', short_description: '',
    price: '', original_price: '', tax_rate: '0', is_active: true, is_new: false, is_sale: false,
    features: [], meta_title: '', meta_description: '', specifications: {},
  });
  const [images, setImages] = useState([]); // { url, isPrimary, file?, media_type? }
  const [variants, setVariants] = useState([{ size: '', color: '', color_hex: '', sku: '', stock_quantity: 0 }]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [categories, setCats] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCategories().then(({ data }) => setCats(data || []));
    if (isEdit) loadProduct();
  }, [id]);

  async function loadProduct() {
    setLoading(true);
    const { data, error } = await getProduct(id);
    if (error || !data) { navigate('/admin/products'); return; }
    setForm({
      name: data.name || '', brand: data.brand || '', slug: data.slug || '',
      category_id: data.category_id || '', description: data.description || '',
      short_description: data.short_description || '', price: data.price || '',
      original_price: data.original_price || '', tax_rate: data.tax_rate || '0',
      is_active: data.is_active, is_new: data.is_new, is_sale: data.is_sale,
      features: data.features || [], meta_title: data.meta_title || '',
      meta_description: data.meta_description || '', specifications: data.specifications || {},
    });
    setImages((data.product_images || []).sort((a, b) => a.display_order - b.display_order).map(img => ({
      url: img.image_url, isPrimary: img.is_primary, id: img.id, media_type: img.media_type || 'image',
    })));
    const vrs = data.product_variants || [];
    setVariants(vrs.length > 0 ? vrs.map(v => ({
      size: v.size || '', color: v.color || '', color_hex: v.color_hex || '#000',
      sku: v.sku || '', stock_quantity: v.stock_quantity || 0, id: v.id,
    })) : [{ size: '', color: '', color_hex: '', sku: '', stock_quantity: 0 }]);
    // Extract unique sizes and colors from existing variants
    const existingSizes = [...new Set((data.product_variants || []).map(v => v.size).filter(Boolean))];
    const existingColors = [...new Set((data.product_variants || []).map(v => v.color).filter(Boolean))];
    setSizes(existingSizes);
    setColors(existingColors.map(c => {
      const v = data.product_variants.find(vr => vr.color === c);
      return { name: c, hex: v?.color_hex || '#000' };
    }));
    setLoading(false);
  }

  function updateField(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !isEdit) next.slug = slugify(value);
      return next;
    });
  }

  function addSize() {
    if (!sizeInput.trim() || sizes.includes(sizeInput.trim())) return;
    setSizes([...sizes, sizeInput.trim()]);
    setSizeInput('');
  }

  function addColor() {
    if (!colorInput.trim()) return;
    setColors([...colors, { name: colorInput.trim(), hex: colorHex }]);
    setColorInput(''); setColorHex('#000000');
  }

  function generateVariants() {
    const newVariants = [];
    const szs = sizes.length ? sizes : [''];
    const cls = colors.length ? colors : [{ name: '', hex: '' }];
    
    for (const sz of szs) {
      for (const cl of cls) {
        const existing = variants.find(v => v.size === sz && v.color === cl.name);
        const skuSuffix = (sz || cl.name) ? `-${sz}-${cl.name}` : '';
        newVariants.push({
          size: sz, color: cl.name, color_hex: cl.hex,
          sku: existing?.sku || `${form.slug || 'SKU'}${skuSuffix}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, ''),
          stock_quantity: existing?.stock_quantity || 0,
        });
      }
    }
    setVariants(newVariants.length > 0 ? newVariants : [{ size: '', color: '', color_hex: '', sku: '', stock_quantity: 0 }]);
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 8) { alert('Maximum 8 media files allowed'); return; }
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
      const tempUrl = URL.createObjectURL(file);
      setImages(prev => [...prev, {
        url: tempUrl, isPrimary: !isVideo && prev.length === 0,
        file, media_type: isVideo ? 'video' : 'image',
      }]);
    }
  }

  function setPrimaryImage(index) {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  function addFeature() {
    if (!featureInput.trim()) return;
    updateField('features', [...form.features, featureInput.trim()]);
    setFeatureInput('');
  }

  function addSpec() {
    if (!specKey.trim()) return;
    updateField('specifications', { ...form.specifications, [specKey]: specVal });
    setSpecKey(''); setSpecVal('');
  }

  async function handleSave(publish = true) {
    setSaving(true);
    try {
      const productData = {
        name: form.name, brand: form.brand, slug: form.slug,
        category_id: form.category_id || null, description: form.description,
        short_description: form.short_description, price: parseFloat(form.price) || 0,
        original_price: parseFloat(form.original_price) || null,
        tax_rate: parseFloat(form.tax_rate) || 0,
        is_active: publish ? true : false, is_new: form.is_new, is_sale: form.is_sale,
        features: form.features, meta_title: form.meta_title,
        meta_description: form.meta_description, specifications: form.specifications,
      };

      let productId = id;
      if (isEdit) {
        await updateProduct(id, productData);
      } else {
        const { data, error } = await createProduct(productData);
        if (error) { alert('Error: ' + error.message); setSaving(false); return; }
        productId = data.id;
      }

      // Upload new media (images + videos)
      const finalImages = [];
      for (const img of images) {
        if (img.file) {
          const { url, media_type, error } = await uploadProductMedia(productId, img.file);
          if (error) { console.error('Upload error:', error); continue; }
          if (url) finalImages.push({ url, isPrimary: img.isPrimary, media_type: media_type || 'image' });
        } else {
          finalImages.push({ url: img.url, isPrimary: img.isPrimary, media_type: img.media_type || 'image' });
        }
      }
      await upsertProductImages(productId, finalImages);

      // Save variants
      const variantRows = variants.map(v => ({
        size: v.size || null, color: v.color || null, color_hex: v.color_hex || null,
        sku: v.sku || null, stock_quantity: parseInt(v.stock_quantity) || 0,
      }));
      await upsertVariants(productId, variantRows);

      navigate('/admin/products');
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  const discountPct = form.original_price && form.price && form.original_price > form.price
    ? Math.round((form.original_price - form.price) / form.original_price * 100) : 0;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <div className="admin-flex admin-gap-8">
          <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/products')}>Cancel</button>
          <button className="admin-btn admin-btn-secondary" onClick={() => handleSave(false)} disabled={saving}>Save as Draft</button>
          <button className="admin-btn admin-btn-primary" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Publish Product')}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="admin-card admin-mb-16">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Basic Information</h3>
        <div className="admin-grid admin-grid-2">
          <div className="admin-form-group">
            <label className="admin-label">Product Name *</label>
            <input className="admin-input" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g., Cotton T-Shirt" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Brand</label>
            <input className="admin-input" value={form.brand} onChange={e => updateField('brand', e.target.value)} placeholder="e.g., Nike" />
          </div>
        </div>
        <div className="admin-grid admin-grid-2">
          <div className="admin-form-group">
            <label className="admin-label">Slug</label>
            <input className="admin-input admin-mono" value={form.slug} onChange={e => updateField('slug', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Category</label>
            <select className="admin-select" value={form.category_id} onChange={e => updateField('category_id', e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-flex admin-gap-16">
          <label className="admin-flex admin-gap-8" style={{ fontSize: 13, cursor: 'pointer' }}>
            <button className={`admin-toggle ${form.is_active ? 'active' : ''}`} onClick={() => updateField('is_active', !form.is_active)} type="button" />
            Active
          </label>
          <label className="admin-flex admin-gap-8" style={{ fontSize: 13, cursor: 'pointer' }}>
            <button className={`admin-toggle ${form.is_new ? 'active' : ''}`} onClick={() => updateField('is_new', !form.is_new)} type="button" />
            New Arrival
          </label>
          <label className="admin-flex admin-gap-8" style={{ fontSize: 13, cursor: 'pointer' }}>
            <button className={`admin-toggle ${form.is_sale ? 'active' : ''}`} onClick={() => updateField('is_sale', !form.is_sale)} type="button" />
            On Sale
          </label>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="admin-card admin-mb-16">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Pricing & Stock Summary</h3>
        <div className="admin-grid admin-grid-4">
          <div className="admin-form-group">
            <label className="admin-label">Selling Price (₹) *</label>
            <input className="admin-input" type="number" value={form.price} onChange={e => updateField('price', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Original Price (₹)</label>
            <input className="admin-input" type="number" value={form.original_price} onChange={e => updateField('original_price', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Discount</label>
            <div className="admin-input" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-secondary)' }}>{discountPct}% off</div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Total Stock</label>
            <div className={`admin-input ${variants.reduce((s, v) => s + (v.stock_quantity || 0), 0) === 0 ? 'admin-text-danger' : 'admin-text-success'}`} style={{ background: 'var(--admin-bg)', fontWeight: 600 }}>
              {variants.reduce((s, v) => s + (v.stock_quantity || 0), 0)} units
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="admin-card admin-mb-16">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Description</h3>
        <div className="admin-form-group">
          <label className="admin-label">Short Description (max 200 chars)</label>
          <textarea className="admin-textarea" value={form.short_description} onChange={e => updateField('short_description', e.target.value.slice(0, 200))} maxLength={200} rows={2} />
          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>{form.short_description.length}/200</div>
        </div>
        <div className="admin-form-group">
          <label className="admin-label">Full Description</label>
          <textarea className="admin-textarea" value={form.description} onChange={e => updateField('description', e.target.value)} rows={6} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label">Key Features</label>
          <div className="admin-flex admin-gap-8" style={{ marginBottom: 8 }}>
            <input className="admin-input" value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFeature()} placeholder="Add a feature..." />
            <button className="admin-btn admin-btn-secondary" onClick={addFeature}><Plus size={14} /></button>
          </div>
          {form.features.map((f, i) => (
            <div key={i} className="admin-flex admin-gap-8" style={{ marginBottom: 4, fontSize: 13 }}>
              <span>•</span> <span style={{ flex: 1 }}>{f}</span>
              <button className="admin-btn-icon" onClick={() => updateField('features', form.features.filter((_, j) => j !== i))}><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="admin-card admin-mb-16">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Media ({images.length}/8) — Images & Videos</h3>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" multiple onChange={handleImageUpload} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--admin-radius)', overflow: 'hidden', border: img.isPrimary ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)' }}>
              {img.media_type === 'video' ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <Film size={24} color="#fff" />
                  </div>
                </div>
              ) : (
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                {img.media_type !== 'video' && (
                  <button className="admin-btn-icon" style={{ background: 'white', boxShadow: 'var(--admin-shadow)', width: 24, height: 24 }} onClick={() => setPrimaryImage(i)} title="Set as primary">
                    <Star size={12} fill={img.isPrimary ? 'var(--admin-accent)' : 'none'} color={img.isPrimary ? 'var(--admin-accent)' : 'var(--admin-text-muted)'} />
                  </button>
                )}
                <button className="admin-btn-icon" style={{ background: 'white', boxShadow: 'var(--admin-shadow)', width: 24, height: 24 }} onClick={() => removeImage(i)}>
                  <X size={12} />
                </button>
              </div>
              {img.media_type === 'video' && (
                <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>VIDEO</div>
              )}
            </div>
          ))}
          {images.length < 8 && (
            <div onClick={() => fileInputRef.current?.click()} style={{ aspectRatio: '1', border: '2px dashed var(--admin-border)', borderRadius: 'var(--admin-radius)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--admin-text-muted)', fontSize: 12 }}>
              <Upload size={20} style={{ marginBottom: 4 }} />
              Upload
              <span style={{ fontSize: 10, marginTop: 2 }}>Images & Videos</span>
            </div>
          )}
        </div>
      </div>

      {/* Inventory & Variants */}
      <div className="admin-card admin-mb-16">
        <div className="admin-flex-between admin-mb-16">
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Inventory & Variants</h3>
          {variants.length > 1 && <span className="admin-badge admin-badge-info">{variants.length} Variants</span>}
        </div>
        
        <div className="admin-grid admin-grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="admin-label">Sizes (Optional)</label>
            <div className="admin-flex admin-gap-8" style={{ marginBottom: 8 }}>
              <input className="admin-input" value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSize()} placeholder="e.g., S, M, L" />
              <button className="admin-btn admin-btn-secondary" onClick={addSize}><Plus size={14} /></button>
            </div>
            <div className="admin-flex admin-gap-8" style={{ flexWrap: 'wrap' }}>
              {sizes.map(s => (
                <span key={s} className="admin-badge admin-badge-gray" style={{ cursor: 'pointer', padding: '4px 10px' }} onClick={() => setSizes(sizes.filter(x => x !== s))}>{s} ×</span>
              ))}
            </div>
          </div>
          <div>
            <label className="admin-label">Colors (Optional)</label>
            <div className="admin-flex admin-gap-8" style={{ marginBottom: 8 }}>
              <input className="admin-input" value={colorInput} onChange={e => setColorInput(e.target.value)} placeholder="e.g., Red" style={{ flex: 1 }} />
              <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} style={{ width: 36, height: 36, border: 'none', cursor: 'pointer' }} />
              <button className="admin-btn admin-btn-secondary" onClick={addColor}><Plus size={14} /></button>
            </div>
            <div className="admin-flex admin-gap-8" style={{ flexWrap: 'wrap' }}>
              {colors.map(c => (
                <span key={c.name} className="admin-badge admin-badge-gray" style={{ cursor: 'pointer', padding: '4px 10px' }} onClick={() => setColors(colors.filter(x => x.name !== c.name))}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.hex, display: 'inline-block', marginRight: 4 }} /> {c.name} ×
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className="admin-btn admin-btn-secondary admin-mb-16" onClick={generateVariants}>
          <Plus size={14} /> Update Variants List
        </button>

        <div className="admin-table-wrap" style={{ border: '1px solid var(--admin-border)' }}>
          <table className="admin-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>{variants.length > 1 ? 'Size / Color' : 'Type'}</th>
                <th>SKU</th>
                <th>Stock Quantity</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={i}>
                  <td style={{ minWidth: 150 }}>
                    {(!v.size && !v.color) ? (
                      <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>Standard / No Variants</span>
                    ) : (
                      <div className="admin-flex admin-gap-8">
                        {v.size && <span className="admin-badge admin-badge-gray">{v.size}</span>}
                        {v.color && (
                          <div className="admin-flex admin-gap-4">
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: v.color_hex, border: '1px solid var(--admin-border)' }} />
                            <span>{v.color}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <input className="admin-input admin-mono" value={v.sku} onChange={e => setVariants(prev => prev.map((vr, j) => j === i ? { ...vr, sku: e.target.value } : vr))} style={{ fontSize: 11, height: 32 }} placeholder="Auto-generated" />
                  </td>
                  <td>
                    <div className="admin-flex admin-gap-8">
                      <input className="admin-input" type="number" value={v.stock_quantity} onChange={e => setVariants(prev => prev.map((vr, j) => j === i ? { ...vr, stock_quantity: parseInt(e.target.value) || 0 } : vr))} style={{ maxWidth: 100, height: 32, textAlign: 'center', fontWeight: 600 }} />
                      <span style={{ fontSize: 11, color: v.stock_quantity <= 5 ? 'var(--admin-danger)' : 'var(--admin-text-muted)' }}>
                        {v.stock_quantity <= 5 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {variants.length > 1 && (
                      <button className="admin-btn-icon" onClick={() => setVariants(variants.filter((_, j) => j !== i))} style={{ color: 'var(--admin-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO */}
      <div className="admin-card admin-mb-16">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>SEO</h3>
        <div className="admin-form-group">
          <label className="admin-label">Meta Title</label>
          <input className="admin-input" value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label className="admin-label">Meta Description (max 160)</label>
          <textarea className="admin-textarea" value={form.meta_description} onChange={e => updateField('meta_description', e.target.value.slice(0, 160))} rows={2} />
          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>{form.meta_description.length}/160</div>
        </div>
      </div>

      {/* Specifications */}
      <div className="admin-card admin-mb-16">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Specifications</h3>
        <div className="admin-flex admin-gap-8" style={{ marginBottom: 12 }}>
          <input className="admin-input" value={specKey} onChange={e => setSpecKey(e.target.value)} placeholder="Key (e.g., Material)" style={{ maxWidth: 200 }} />
          <input className="admin-input" value={specVal} onChange={e => setSpecVal(e.target.value)} placeholder="Value (e.g., Cotton)" style={{ flex: 1 }} />
          <button className="admin-btn admin-btn-secondary" onClick={addSpec}><Plus size={14} /></button>
        </div>
        {Object.entries(form.specifications).map(([k, v]) => (
          <div key={k} className="admin-flex admin-gap-8" style={{ marginBottom: 4, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--admin-border)' }}>
            <span style={{ fontWeight: 500, width: 150 }}>{k}</span>
            <span style={{ flex: 1, color: 'var(--admin-text-secondary)' }}>{v}</span>
            <button className="admin-btn-icon" onClick={() => { const specs = { ...form.specifications }; delete specs[k]; updateField('specifications', specs); }}><X size={14} /></button>
          </div>
        ))}
      </div>

      {/* Sticky Save Bar */}
      <div style={{ position: 'sticky', bottom: 0, padding: '12px 0', background: 'var(--admin-bg)', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/products')}>Cancel</button>
        <button className="admin-btn admin-btn-secondary" onClick={() => handleSave(false)} disabled={saving}>Save as Draft</button>
        <button className="admin-btn admin-btn-primary" onClick={() => handleSave(true)} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving...' : (isEdit ? 'Update' : 'Publish')}
        </button>
      </div>
    </div>
  );
}
