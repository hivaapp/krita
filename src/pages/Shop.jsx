import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import * as api from '../lib/api';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDrawer, setFilterDrawer] = useState(false);
  const [activeCategory, setActiveCategory] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category');
  const urlSale = searchParams.get('sale');

  useEffect(() => {
    if (urlCategory && !activeCategory.includes(urlCategory)) {
      setActiveCategory([urlCategory]);
    }
  }, [urlCategory]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, sort, query, urlSale]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let result;
      if (query) {
        result = await api.searchProducts(query);
        setProducts(result.data || []);
        setTotalCount(result.data?.length || 0);
      } else if (urlSale === 'true') {
        result = await api.getSaleProducts(50);
        setProducts(result.data || []);
        setTotalCount(result.data?.length || 0);
      } else {
        const sortMap = { 'newest': 'newest', 'Price: Low to High': 'price_asc', 'Price: High to Low': 'price_desc', 'Top Rated': 'rating' };
        result = await api.getProducts({
          category: activeCategory[0] || null,
          sort: sortMap[sort] || sort,
          page,
          limit: 12,
        });
        if (page === 1) {
          setProducts(result.data || []);
        } else {
          setProducts(prev => [...prev, ...(result.data || [])]);
        }
        setTotalCount(result.count || 0);
      }
      setLoading(false);
    }
    load();
  }, [activeCategory, sort, page, query, urlSale]);

  const toggleCategory = (cat) => {
    setActiveCategory(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [cat]);
  };

  const hasMore = products.length < totalCount;

  return (
    <div className="container section">
      <div style={{ display: 'flex', gap: '32px' }}>
        <aside style={{ width: '240px', display: 'none', '@media(min-width: 1024px)': { display: 'block' }, flexShrink: 0 }}>
          <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Filters</h3>
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Category</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['women', 'men', 'accessories', 'kids'].map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', textTransform: 'capitalize' }}>
                  <input type="checkbox" checked={activeCategory.includes(c)} onChange={() => toggleCategory(c)} /> {c}
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setActiveCategory([])}>Clear All</button>
        </aside>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              {query && <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Search results for "{query}"</h2>}
              {urlSale === 'true' && <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Sale Items</h2>}
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Showing {products.length} of {totalCount} products</div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-outline" style={{ height: '36px', padding: '0 16px' }} onClick={() => setFilterDrawer(true)}>Filter</button>
              <select className="form-input" style={{ width: 'auto', height: '36px' }} value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {!loading && products.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '16px' }}>No products found</h3>
              <button className="btn btn-primary" onClick={() => setActiveCategory([])}>Clear Filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {loading && page === 1 ? Array(8).fill(null).map((_, i) => (
                <div key={i} className="product-card">
                  <div className="product-image-container skeleton"></div>
                  <div className="skeleton" style={{ height: '12px', width: '40%', marginBottom: '8px' }}></div>
                  <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '8px' }}></div>
                  <div className="skeleton" style={{ height: '14px', width: '30%' }}></div>
                </div>
              )) : products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {hasMore && (
            <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-outline" style={{ minWidth: '200px' }} onClick={() => setPage(p => p + 1)} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>

      {filterDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '300px', background: 'var(--color-surface)', padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>Filters</h3>
              <button onClick={() => setFilterDrawer(false)}><X /></button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Category</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['women', 'men', 'accessories', 'kids'].map(c => (
                  <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', textTransform: 'capitalize' }}>
                    <input type="checkbox" checked={activeCategory.includes(c)} onChange={() => toggleCategory(c)} /> {c}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => setFilterDrawer(false)}>Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}
