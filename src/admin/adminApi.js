import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'pranitha@gmail.com';

export function isAdminEmail(email) {
  return email === ADMIN_EMAIL;
}

// ===== Dashboard =====
export async function getDashboardStats() {
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  return { data, error };
}

export async function getRevenueChart(days = 30) {
  const { data, error } = await supabase.rpc('admin_revenue_chart', { days });
  return { data, error };
}

export async function getTopProducts(lim = 5) {
  const { data, error } = await supabase.rpc('admin_top_products', { lim });
  return { data, error };
}

export async function getRevenueByCategory() {
  const { data, error } = await supabase.rpc('admin_revenue_by_category');
  return { data, error };
}

export async function getRecentOrders(limit = 10) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function getLowStockVariants() {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*, products(name, id)')
    .lt('stock_quantity', 5)
    .order('stock_quantity', { ascending: true })
    .limit(20);
  return { data, error };
}

export async function getRecentCustomers(limit = 5) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

// ===== Products =====
export async function getProducts({ page = 1, perPage = 20, search = '', category = '', status = '', sort = 'newest' } = {}) {
  let query = supabase
    .from('products')
    .select('*, categories(name), product_images(image_url, is_primary), product_variants(id, stock_quantity)', { count: 'exact' });

  if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
  if (category) query = query.eq('category_id', category);
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'draft') query = query.eq('is_active', false);

  const sortMap = {
    newest: ['created_at', { ascending: false }],
    oldest: ['created_at', { ascending: true }],
    'price-asc': ['price', { ascending: true }],
    'price-desc': ['price', { ascending: false }],
    'name-asc': ['name', { ascending: true }],
  };
  const [col, opts] = sortMap[sort] || sortMap.newest;
  query = query.order(col, opts);
  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data, count, error } = await query;
  return { data, count, error };
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name), product_images(*), product_variants(*)')
    .eq('id', id)
    .single();
  return { data, error };
}

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  return { data, error };
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return { data, error };
}

export async function deleteProduct(id) {
  await supabase.from('product_images').delete().eq('product_id', id);
  await supabase.from('product_variants').delete().eq('product_id', id);
  const { error } = await supabase.from('products').delete().eq('id', id);
  return { error };
}

export async function upsertVariants(productId, variants) {
  // Delete existing variants then insert new ones
  await supabase.from('product_variants').delete().eq('product_id', productId);
  if (variants.length === 0) return { error: null };
  const rows = variants.map(v => ({ ...v, product_id: productId }));
  const { error } = await supabase.from('product_variants').insert(rows);
  return { error };
}

export async function upsertProductImages(productId, images) {
  await supabase.from('product_images').delete().eq('product_id', productId);
  if (images.length === 0) return { error: null };
  const rows = images.map((img, i) => ({ product_id: productId, image_url: img.url, display_order: i, is_primary: img.isPrimary || i === 0 }));
  const { error } = await supabase.from('product_images').insert(rows);
  return { error };
}

export async function uploadProductImage(productId, file) {
  const ext = file.name.split('.').pop();
  const path = `product-images/${productId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
  if (uploadError) return { url: null, error: uploadError };
  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
  return { url: publicUrl, error: null };
}

// ===== Categories =====
export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*, products(id)').order('display_order');
  return { data: data?.map(c => ({ ...c, productCount: c.products?.length || 0 })), error };
}

export async function createCategory(cat) {
  const { data, error } = await supabase.from('categories').insert(cat).select().single();
  return { data, error };
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
  return { data, error };
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return { error };
}

// ===== Collections =====
export async function getCollections() {
  const { data, error } = await supabase.from('collections').select('*, collection_products(product_id)').order('display_order');
  return { data: data?.map(c => ({ ...c, productCount: c.collection_products?.length || 0 })), error };
}

export async function getCollection(id) {
  const { data, error } = await supabase.from('collections').select('*, collection_products(*, products(*))').eq('id', id).single();
  return { data, error };
}

export async function createCollection(col) {
  const { data, error } = await supabase.from('collections').insert(col).select().single();
  return { data, error };
}

export async function updateCollection(id, updates) {
  const { data, error } = await supabase.from('collections').update(updates).eq('id', id).select().single();
  return { data, error };
}

export async function deleteCollection(id) {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  return { error };
}

export async function setCollectionProducts(collectionId, productIds) {
  await supabase.from('collection_products').delete().eq('collection_id', collectionId);
  if (productIds.length === 0) return { error: null };
  const rows = productIds.map((pid, i) => ({ collection_id: collectionId, product_id: pid, display_order: i }));
  const { error } = await supabase.from('collection_products').insert(rows);
  return { error };
}

// ===== Orders =====
export async function getOrders({ page = 1, perPage = 20, search = '', status = '', sort = 'newest' } = {}) {
  let query = supabase
    .from('orders')
    .select('*, profiles(full_name, avatar_url, phone)', { count: 'exact' });

  if (search) query = query.or(`order_number.ilike.%${search}%`);
  if (status && status !== 'all') query = query.eq('status', status);
  query = query.order('created_at', { ascending: sort === 'oldest' });
  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data, count, error } = await query;
  return { data, count, error };
}

export async function getOrder(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles(full_name, avatar_url, phone), order_items(*, products(name)), coupons(code, discount_type, discount_value)')
    .eq('id', id)
    .single();
  return { data, error };
}

export async function updateOrder(id, updates) {
  const { data, error } = await supabase.from('orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return { data, error };
}

export async function addOrderEvent(orderId, status, note = '') {
  const { error } = await supabase.from('order_events').insert({ order_id: orderId, status, note });
  return { error };
}

export async function getOrderEvents(orderId) {
  const { data, error } = await supabase.from('order_events').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
  return { data, error };
}

// ===== Coupons =====
export async function getCoupons() {
  const { data, error } = await supabase.from('coupons').select('*').order('is_active', { ascending: false });
  return { data, error };
}

export async function createCoupon(coupon) {
  const { data, error } = await supabase.from('coupons').insert(coupon).select().single();
  return { data, error };
}

export async function updateCoupon(id, updates) {
  const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select().single();
  return { data, error };
}

export async function deleteCoupon(id) {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  return { error };
}

// ===== Customers =====
export async function getCustomers({ page = 1, perPage = 20, search = '' } = {}) {
  let query = supabase.from('profiles').select('*', { count: 'exact' });
  if (search) query = query.or(`full_name.ilike.%${search}%`);
  query = query.order('created_at', { ascending: false });
  query = query.range((page - 1) * perPage, page * perPage - 1);
  const { data, count, error } = await query;
  return { data, count, error };
}

export async function getCustomer(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  return { data, error };
}

export async function getCustomerOrders(userId) {
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return { data, error };
}

// ===== Reviews =====
export async function getReviews({ status = '', rating = '' } = {}) {
  let query = supabase.from('reviews').select('*, products(name, id, product_images(image_url, is_primary)), profiles(full_name)');
  if (status === 'approved') query = query.eq('is_approved', true);
  if (status === 'pending') query = query.eq('is_approved', false);
  if (rating) query = query.eq('rating', parseInt(rating));
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  return { data, error };
}

export async function updateReview(id, updates) {
  const { error } = await supabase.from('reviews').update(updates).eq('id', id);
  return { error };
}

export async function deleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  return { error };
}

// ===== Banners =====
export async function getBanners() {
  const { data, error } = await supabase.from('banners').select('*').order('display_order');
  return { data, error };
}

export async function createBanner(banner) {
  const { data, error } = await supabase.from('banners').insert(banner).select().single();
  return { data, error };
}

export async function updateBanner(id, updates) {
  const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().single();
  return { data, error };
}

export async function deleteBanner(id) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  return { error };
}

// ===== Settings =====
export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) return { data: {}, error };
  const settingsMap = {};
  data.forEach(s => { settingsMap[s.key] = s.value; });
  return { data: settingsMap, error: null };
}

export async function updateSetting(key, value) {
  const { error } = await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
  return { error };
}

// ===== Notifications =====
export async function getNotifications(limit = 20) {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function markNotificationsRead() {
  const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
  return { error };
}

export async function getUnreadNotifCount() {
  const { count, error } = await supabase.from('admin_notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
  return { count: count || 0, error };
}

// ===== Storage / Media =====
export async function listStorageFiles(bucket = 'product-images', folder = '') {
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  return { data, error };
}

export async function deleteStorageFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
}
