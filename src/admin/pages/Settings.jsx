import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '../adminApi';
import { Save } from 'lucide-react';

const TABS = ['General', 'Shipping', 'Tax', 'Notifications', 'Social', 'Payments'];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('General');

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const { data } = await getSettings(); setSettings(data || {}); setLoading(false); }

  function val(key) { const v = settings[key]; return typeof v === 'string' ? v : JSON.stringify(v ?? ''); }
  function setVal(key, value) { setSettings(prev => ({ ...prev, [key]: value })); }

  async function handleSave() {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      await updateSetting(key, value);
    }
    setSaving(false);
  }

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="admin-flex-between admin-mb-24">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h1>
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save All'}</button>
      </div>

      <div className="admin-tabs">{TABS.map(t => <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}</div>

      <div className="admin-card">
        {tab === 'General' && <>
          <Field label="Store Name" value={val('store_name')} onChange={v => setVal('store_name', v)} />
          <Field label="Contact Email" value={val('contact_email')} onChange={v => setVal('contact_email', v)} />
          <Field label="Support Phone" value={val('support_phone')} onChange={v => setVal('support_phone', v)} />
          <Field label="Currency" value={val('currency')} onChange={v => setVal('currency', v)} />
        </>}
        {tab === 'Shipping' && <>
          <Field label="Free Shipping Threshold (₹)" value={val('free_shipping_threshold')} onChange={v => setVal('free_shipping_threshold', parseFloat(v) || 0)} type="number" />
          <Field label="Default Shipping Cost (₹)" value={val('default_shipping_cost')} onChange={v => setVal('default_shipping_cost', parseFloat(v) || 0)} type="number" />
          <Field label="Estimated Delivery (Min days)" value={val('estimated_delivery_min')} onChange={v => setVal('estimated_delivery_min', parseInt(v) || 0)} type="number" />
          <Field label="Estimated Delivery (Max days)" value={val('estimated_delivery_max')} onChange={v => setVal('estimated_delivery_max', parseInt(v) || 0)} type="number" />
        </>}
        {tab === 'Tax' && <>
          <Field label="Default GST Rate (%)" value={val('default_gst_rate')} onChange={v => setVal('default_gst_rate', parseFloat(v) || 0)} type="number" />
          <Toggle label="Tax Included in Price" value={settings.tax_included_in_price} onChange={v => setVal('tax_included_in_price', v)} />
        </>}
        {tab === 'Notifications' && <>
          <Toggle label="New Order Email" value={settings.notification_new_order} onChange={v => setVal('notification_new_order', v)} />
          <Toggle label="Low Stock Alert" value={settings.notification_low_stock} onChange={v => setVal('notification_low_stock', v)} />
          <Field label="Low Stock Threshold" value={val('notification_low_stock_threshold')} onChange={v => setVal('notification_low_stock_threshold', parseInt(v) || 5)} type="number" />
          <Toggle label="New Review Alert" value={settings.notification_new_review} onChange={v => setVal('notification_new_review', v)} />
        </>}
        {tab === 'Social' && <>
          <Field label="Instagram URL" value={val('social_instagram')} onChange={v => setVal('social_instagram', v)} />
          <Field label="Facebook URL" value={val('social_facebook')} onChange={v => setVal('social_facebook', v)} />
          <Field label="Twitter URL" value={val('social_twitter')} onChange={v => setVal('social_twitter', v)} />
          <Field label="Pinterest URL" value={val('social_pinterest')} onChange={v => setVal('social_pinterest', v)} />
        </>}
        {tab === 'Payments' && <>
          <Toggle label="Credit/Debit Card" value={settings.payment_card} onChange={v => setVal('payment_card', v)} />
          <Toggle label="UPI" value={settings.payment_upi} onChange={v => setVal('payment_upi', v)} />
          <Toggle label="Net Banking" value={settings.payment_netbanking} onChange={v => setVal('payment_netbanking', v)} />
          <Toggle label="Cash on Delivery" value={settings.payment_cod} onChange={v => setVal('payment_cod', v)} />
        </>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className="admin-form-group">
      <label className="admin-label">{label}</label>
      <input className="admin-input" type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="admin-form-group">
      <label className="admin-flex admin-gap-8" style={{ fontSize: 13, cursor: 'pointer' }}>
        <button className={`admin-toggle ${value ? 'active' : ''}`} onClick={() => onChange(!value)} type="button" />
        {label}
      </label>
    </div>
  );
}
