import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Trash2, Copy, Check, Image as ImageIcon, Film } from 'lucide-react';

const BUCKET = 'product-media';
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime';

function isVideoFile(name) {
  return /\.(mp4|webm|mov)$/i.test(name);
}

export default function Media() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadFiles(); }, []);

  async function listRecursive(folder = '', depth = 0) {
    if (depth > 3) return []; // safety limit
    const { data } = await supabase.storage.from(BUCKET).list(folder, { limit: 200 });
    if (!data) return [];

    const results = [];
    for (const item of data) {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      if (item.id) {
        // It's a file
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
        results.push({
          name: item.name,
          path: fullPath,
          url: publicUrl,
          size: item.metadata?.size,
          created: item.created_at,
          isVideo: isVideoFile(item.name),
        });
      } else {
        // It's a folder — recurse
        const sub = await listRecursive(fullPath, depth + 1);
        results.push(...sub);
      }
    }
    return results;
  }

  async function loadFiles() {
    setLoading(true);
    const allFiles = await listRecursive();
    // Sort newest first
    allFiles.sort((a, b) => (b.created || '').localeCompare(a.created || ''));
    setFiles(allFiles);
    setLoading(false);
  }

  async function handleUpload(e) {
    const uploadFiles = Array.from(e.target.files);
    if (!uploadFiles.length) return;
    setUploading(true);

    for (const file of uploadFiles) {
      const ext = file.name.split('.').pop().toLowerCase();
      const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
      const folder = isVideo ? 'uploads/videos' : 'uploads/images';
      const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600' });
    }

    setUploading(false);
    loadFiles();
  }

  async function handleDelete(file) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    await supabase.storage.from(BUCKET).remove([file.path]);
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
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept={ACCEPT} multiple onChange={handleUpload} />
          <button className="admin-btn admin-btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Media'}
          </button>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginBottom: 16 }}>
        {files.length} file{files.length !== 1 ? 's' : ''} — Images & Videos (max 50MB per video)
      </div>

      {files.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <ImageIcon size={48} />
            <h3>No media yet</h3>
            <p>Upload images or videos to get started</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {files.map(f => (
            <div key={f.path} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1', overflow: 'hidden', background: 'var(--admin-bg)', position: 'relative' }}>
                {f.isVideo ? (
                  <>
                    <video src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                      <Film size={28} color="#fff" />
                    </div>
                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>VIDEO</div>
                  </>
                ) : (
                  <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                )}
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
