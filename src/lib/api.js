import { supabase } from './supabase';

// ── Error Handling ──────────────────────────────────────────

export function handleSupabaseError(error) {
  const message = error?.message || 'An unexpected error occurred';
  console.error('[Supabase Error]', message, error);
  return message;
}

// ── Categories ──────────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

// ── Products ────────────────────────────────────────────────

export async function getProducts({ category, minPrice, maxPrice, sizes, colors, minRating, sort, page = 1, limit = 12 } = {}) {
  let query = supabase
    .from('products')
    .select(`
      *,
      categories!inner(name, slug),
      product_images(image_url, display_order, is_primary)
    `, { count: 'exact' })
    .eq('is_active', true);

  if (category) {
    query = query.eq('categories.slug', category);
  }
  if (minPrice) query = query.gte('price', minPrice);
  if (maxPrice) query = query.lte('price', maxPrice);
  if (minRating) query = query.gte('rating', minRating);

  // Sorting
  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return { data: null, error: handleSupabaseError(error), count: 0 };

  // Normalize: flatten images and category
  const normalized = (data || []).map(p => ({
    ...p,
    category: p.categories?.name || '',
    categorySlug: p.categories?.slug || '',
    images: (p.product_images || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map(img => img.image_url),
    primaryImage: p.product_images?.find(img => img.is_primary)?.image_url || p.product_images?.[0]?.image_url || '',
  }));

  return { data: normalized, error: null, count: count || 0 };
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(id, image_url, display_order, is_primary),
      product_variants(id, size, color, color_hex, stock_quantity, sku)
    `)
    .eq('slug', slug)
    .single();

  if (error) return { data: null, error: handleSupabaseError(error) };

  const normalized = {
    ...data,
    category: data.categories?.name || '',
    categorySlug: data.categories?.slug || '',
    images: (data.product_images || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map(img => img.image_url),
    variants: data.product_variants || [],
    sizes: [...new Set((data.product_variants || []).map(v => v.size).filter(Boolean))],
    colors: [...new Set((data.product_variants || []).map(v => v.color).filter(Boolean))],
    colorHexMap: Object.fromEntries(
      (data.product_variants || [])
        .filter(v => v.color && v.color_hex)
        .map(v => [v.color, v.color_hex])
    ),
    inStock: (data.product_variants || []).some(v => v.stock_quantity > 0),
  };

  return { data: normalized, error: null };
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(id, image_url, display_order, is_primary),
      product_variants(id, size, color, color_hex, stock_quantity, sku)
    `)
    .eq('id', id)
    .single();

  if (error) return { data: null, error: handleSupabaseError(error) };

  const normalized = {
    ...data,
    category: data.categories?.name || '',
    categorySlug: data.categories?.slug || '',
    images: (data.product_images || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map(img => img.image_url),
    variants: data.product_variants || [],
    sizes: [...new Set((data.product_variants || []).map(v => v.size).filter(Boolean))],
    colors: [...new Set((data.product_variants || []).map(v => v.color).filter(Boolean))],
    colorHexMap: Object.fromEntries(
      (data.product_variants || [])
        .filter(v => v.color && v.color_hex)
        .map(v => [v.color, v.color_hex])
    ),
    inStock: (data.product_variants || []).some(v => v.stock_quantity > 0),
  };

  return { data: normalized, error: null };
}

export async function getNewArrivals(limit = 8) {
  return getProducts({ sort: 'newest', limit, page: 1 });
}

export async function getSaleProducts(limit = 8) {
  const { data, error, count } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(image_url, display_order, is_primary)
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('is_sale', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: handleSupabaseError(error), count: 0 };

  const normalized = (data || []).map(p => ({
    ...p,
    category: p.categories?.name || '',
    images: (p.product_images || []).sort((a, b) => a.display_order - b.display_order).map(img => img.image_url),
    primaryImage: p.product_images?.find(img => img.is_primary)?.image_url || p.product_images?.[0]?.image_url || '',
  }));

  return { data: normalized, error: null, count };
}

export async function getRelatedProducts(categoryId, excludeId, limit = 4) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(image_url, display_order, is_primary)
    `)
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .limit(limit);

  if (error) return { data: null, error: handleSupabaseError(error) };

  const normalized = (data || []).map(p => ({
    ...p,
    category: p.categories?.name || '',
    images: (p.product_images || []).sort((a, b) => a.display_order - b.display_order).map(img => img.image_url),
    primaryImage: p.product_images?.find(img => img.is_primary)?.image_url || '',
  }));

  return { data: normalized, error: null };
}

export async function searchProducts(query, limit = 20) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(image_url, display_order, is_primary)
    `)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (error) return { data: null, error: handleSupabaseError(error) };

  const normalized = (data || []).map(p => ({
    ...p,
    category: p.categories?.name || '',
    images: (p.product_images || []).sort((a, b) => a.display_order - b.display_order).map(img => img.image_url),
    primaryImage: p.product_images?.find(img => img.is_primary)?.image_url || '',
  }));

  return { data: normalized, error: null };
}

// ── Reviews ─────────────────────────────────────────────────

export async function getReviews(productId, { page = 1, limit = 10, sortBy = 'created_at' } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles(full_name, avatar_url)
    `, { count: 'exact' })
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order(sortBy, { ascending: false })
    .range(from, to);

  if (error) return { data: null, error: handleSupabaseError(error), count: 0 };

  const normalized = (data || []).map(r => ({
    ...r,
    name: r.profiles?.full_name || 'Anonymous',
    avatarUrl: r.profiles?.avatar_url || '',
  }));

  return { data: normalized, error: null, count: count || 0 };
}

export async function getRatingSummary(productId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true);

  if (error) return { data: null, error: handleSupabaseError(error) };

  const total = data.length;
  const avg = total > 0 ? (data.reduce((a, r) => a + r.rating, 0) / total).toFixed(1) : '0';
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  data.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

  return {
    data: { average: parseFloat(avg), total, breakdown },
    error: null,
  };
}

export async function submitReview(productId, userId, { rating, title, body }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      user_id: userId,
      rating,
      title,
      body,
    })
    .select()
    .single();

  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

// ── Cart ────────────────────────────────────────────────────

export async function getCart(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      products(*,
        product_images(image_url, display_order, is_primary)
      ),
      product_variants(size, color, color_hex, stock_quantity)
    `)
    .eq('user_id', userId)
    .order('created_at');

  if (error) return { data: null, error: handleSupabaseError(error) };

  const normalized = (data || []).map(item => ({
    ...item,
    name: item.products?.name || '',
    brand: item.products?.brand || '',
    price: item.products?.price || 0,
    originalPrice: item.products?.original_price || null,
    images: (item.products?.product_images || [])
      .sort((a, b) => a.display_order - b.display_order)
      .map(img => img.image_url),
    size: item.product_variants?.size || '',
    color: item.product_variants?.color || '',
    colorHex: item.product_variants?.color_hex || '',
    stockQuantity: item.product_variants?.stock_quantity || 0,
    qty: item.quantity,
  }));

  return { data: normalized, error: null };
}

export async function addToCart(userId, productId, variantId, quantity = 1) {
  // Upsert: if item exists, add to quantity
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('variant_id', variantId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return { data: null, error: handleSupabaseError(error) };
    return { data, error: null };
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({ user_id: userId, product_id: productId, variant_id: variantId, quantity })
    .select()
    .single();

  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function updateCartQuantity(cartItemId, quantity) {
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function removeFromCart(cartItemId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  if (error) return { error: handleSupabaseError(error) };
  return { error: null };
}

export async function clearCart(userId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  if (error) return { error: handleSupabaseError(error) };
  return { error: null };
}

// ── Wishlist ────────────────────────────────────────────────

export async function getWishlist(userId) {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      products(*,
        categories(name, slug),
        product_images(image_url, display_order, is_primary),
        product_variants(id, size, color, color_hex, stock_quantity)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: handleSupabaseError(error) };

  const normalized = (data || []).map(item => ({
    ...item.products,
    wishlistId: item.id,
    category: item.products?.categories?.name || '',
    images: (item.products?.product_images || []).sort((a, b) => a.display_order - b.display_order).map(img => img.image_url),
    sizes: [...new Set((item.products?.product_variants || []).map(v => v.size).filter(Boolean))],
    colors: [...new Set((item.products?.product_variants || []).map(v => v.color).filter(Boolean))],
    inStock: (item.products?.product_variants || []).some(v => v.stock_quantity > 0),
  }));

  return { data: normalized, error: null };
}

export async function addToWishlist(userId, productId) {
  const { data, error } = await supabase
    .from('wishlists')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
    .select()
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function removeFromWishlist(userId, productId) {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  if (error) return { error: handleSupabaseError(error) };
  return { error: null };
}

// ── Orders ──────────────────────────────────────────────────

export async function placeOrder(shippingAddress, paymentMethod = 'card', couponCode = null) {
  const { data, error } = await supabase.rpc('place_order', {
    p_shipping_address: shippingAddress,
    p_payment_method: paymentMethod,
    p_coupon_code: couponCode,
  });
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function validateCoupon(code, cartTotal) {
  const { data, error } = await supabase.rpc('validate_coupon', {
    p_code: code,
    p_cart_total: cartTotal,
  });
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function getOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*)
    `)
    .eq('id', orderId)
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

// ── Profile & Addresses ─────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function getAddresses(userId) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function addAddress(userId, address) {
  const { data, error } = await supabase
    .from('addresses')
    .insert({ ...address, user_id: userId })
    .select()
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function updateAddress(addressId, updates) {
  const { data, error } = await supabase
    .from('addresses')
    .update(updates)
    .eq('id', addressId)
    .select()
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

export async function deleteAddress(addressId) {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId);
  if (error) return { error: handleSupabaseError(error) };
  return { error: null };
}

export async function setDefaultAddress(userId, addressId) {
  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) return { data: null, error: handleSupabaseError(error) };
  return { data, error: null };
}

// ── Realtime ────────────────────────────────────────────────

export function subscribeToOrderStatus(orderId, callback) {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
