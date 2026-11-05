import ImageField from '@/components/admin/ImageField';
import { adminSettings } from '@/lib/adminData';
import ThemePicker from '@/components/admin/ThemePicker';
import { saveSettings } from '../../actions';

export default async function SettingsAdmin() {
  const s = await adminSettings();
  const T = (name: string, label: string, v: string | number, extra: Record<string, string | number | boolean> = {}) => (
    <label className="block"><span className="label-lux">{label}</span><input name={name} defaultValue={v} className="input-lux" {...extra} /></label>
  );
  return (
    <form action={saveSettings} className="max-w-3xl space-y-6">
      <h1 className="font-serif text-4xl text-gold">Store settings</h1>

      <ThemePicker current={s.theme} />

      <section className="grid gap-4 rounded-2xl border border-gold/25 bg-coal p-5 sm:grid-cols-2">
        <h2 className="font-serif text-xl sm:col-span-2">WhatsApp ordering</h2>
        {T('whatsapp_number', 'WhatsApp number (international)', s.whatsappNumber, { placeholder: '923435295541', required: true })}
        <p className="self-end text-xs text-mute">Digits with country code, no “+”. Every ORDER ON WHATSAPP button, the cart checkout and the floating chat button use this number.</p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-gold/25 bg-coal p-5 sm:grid-cols-2">
        <h2 className="font-serif text-xl sm:col-span-2">Pricing &amp; shipping</h2>
        {T('currency', 'Currency code', s.currency, { maxLength: 8 })}
        {T('currency_symbol', 'Currency symbol', s.currencySymbol, { maxLength: 4 })}
        {T('shipping_flat', 'Shipping charge (0 = free)', s.shippingFlat, { type: 'number', min: 0, step: '0.01' })}
        {T('free_shipping_over', 'Free shipping over (0 = no threshold)', s.freeShippingOver, { type: 'number', min: 0, step: '0.01' })}
      </section>

      <section className="grid gap-4 rounded-2xl border border-gold/25 bg-coal p-5 sm:grid-cols-2">
        <h2 className="font-serif text-xl sm:col-span-2">Store information</h2>
        {T('store_name', 'Store name', s.storeName)}
        {T('tagline', 'Tagline', s.tagline)}
        {T('email', 'Public email', s.email, { type: 'email' })}
        {T('phone', 'Phone / WhatsApp (display)', s.phone)}
        <label className="block sm:col-span-2"><span className="label-lux">Address</span><textarea name="address" defaultValue={s.address} className="input-lux" /></label>
        <div className="sm:col-span-2"><ImageField name="logo_url" defaultValue={s.logoUrl} label="Logo (transparent PNG recommended)" /></div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-gold/25 bg-coal p-5 sm:grid-cols-2">
        <h2 className="font-serif text-xl sm:col-span-2">Social links (https://…)</h2>
        {T('instagram', 'Instagram', s.instagram)}
        {T('tiktok', 'TikTok', s.tiktok)}
        {T('youtube', 'YouTube', s.youtube)}
        {T('pinterest', 'Pinterest', s.pinterest)}
        {T('facebook', 'Facebook', s.facebook)}
      </section>

      <button className="btn-gold">Save settings</button>
    </form>
  );
}
