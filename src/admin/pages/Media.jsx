import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Trash2, Copy, Check, Image as ImageIcon } from 'lucide-react';

export default function Media() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadFiles(); }, []);

  async function loadFiles() {
    setLoading(true);
    const allFiles = [];

    // List product-images bucket
    const { data: folders } = await supabase.storage.from('product-images').list('', { limit: 100 });
    if (folders) {
      for (const folder of folders) {
        if (folder.id) {
          // It's a file at root
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(folder.name);
          allFiles.push({ name: folder.name, path: folder.name, url: publicUrl, size: folder.metadata?.size, created: folder.created_at, bucket: 'product-images' });
        } else {
          // It's a folder, list its contents
          const { data: subFiles } = await supabase.storage.from('product-images').list(folder.name, { limit: 50 });
          if (subFiles) {
            for (const sf of subFiles) {
              if (sf.id) {
                const fullPath = `${folder.name}/${sf.name}`;
                const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fullPath);
                allFiles.push({ name: sf.name, path: fullPath, url: publicUrl, size: sf.metadata?.size, created: sf.created_at, bucket: 'product-images' });
              }
            }
          }
        }
      }
    }

    setFiles(allFiles);
    setLoading(false);
  }

  async function handleUpload(e) {
    const uploadFiles = Array.from(e.target.files);
    if (!uploadFiles.length) return;
    setUploading(true);

    for (const file of uploadFiles) {
      const path = `uploads/${Date.now()}-${file.name}`;
      await supabase.storage.from('product-images').upload(path, file);
    }

    setUploading(false);
    loadFiles();
  }

  async function handleDelete(file) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    await supabase.storage.from(file.bucket).remove([file.path]);
    loadFiles();
  }

  function copyUrl(url) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Media Library</h1>
        <div className="admin-flex admin-gap-8">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" multiple onChange={handleUpload} />
          <button className="admin-btn admin-btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <ImageIcon size={48} />
            <h3>No images yet</h3>
            <p>Upload images to get started</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {files.map(f => (
            <div key={f.path} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1', overflow: 'hidden', background: 'var(--admin-bg)' }}>
                <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{formatSize(f.size)}</div>
                <div className="admin-flex admin-gap-8">
                  <button className="admin-btn-icon" onClick={() => copyUrl(f.url)} title="Copy URL" style={{ flex: 1 }}>
                    {copied === f.url ? <Check size={14} color="var(--admin-success)" /> : <Copy size={14} />}
                  </button>
                  <button className="admin-btn-icon" onClick={() => handleDelete(f)} style={{ color: 'var(--admin-danger)' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
