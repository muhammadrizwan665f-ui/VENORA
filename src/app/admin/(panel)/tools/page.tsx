const downloads = [
  ['Full backup (JSON)', 'Products, categories, orders, subscribers and settings in one file. Download one regularly and keep it somewhere safe.', '/api/admin/export?type=backup'],
  ['Orders (CSV)', 'Every order, ready for Excel or Google Sheets.', '/api/admin/export?type=orders'],
  ['Products (CSV)', 'Catalogue with prices, stock and status.', '/api/admin/export?type=products'],
  ['Customers (CSV)', 'Customers grouped by WhatsApp number with order counts and totals.', '/api/admin/export?type=customers'],
  ['Subscribers (CSV)', 'Newsletter email list.', '/api/admin/export?type=subscribers'],
] as const;

const tips = [
  ['Ctrl + K (⌘ K on Mac)', 'Quick search: jump to any admin page, product, order or customer.'],
  ['Orders page', 'Tick several orders, choose a status and press “Apply to selected”. Use the WhatsApp buttons to message a customer with a ready-made text.'],
  ['Products page', 'Edit price, stock and status directly in the table. Use “Duplicate” to copy a product as a draft.'],
  ['Settings → Theme', 'Preview and switch the look of the whole store.'],
] as const;

export default function ToolsAdmin() {
  return (
    <div className="space-y-8">
      <h1 className="font-serif text-4xl text-gold">Tools &amp; backup</h1>
      <section aria-labelledby="dl">
        <h2 id="dl" className="mb-3 font-serif text-xl">Downloads</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {downloads.map(([title, text, href]) => (
            <div key={href} className="flex flex-col justify-between gap-3 rounded-2xl border border-gold/25 bg-coal p-5">
              <div>
                <p className="font-medium text-ivory">{title}</p>
                <p className="mt-1 text-sm text-mute">{text}</p>
              </div>
              <a href={href} className="btn-outline !py-2 self-start text-xs">Download</a>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-mute">Downloads contain customer details. Store them privately.</p>
      </section>
      <section aria-labelledby="tips">
        <h2 id="tips" className="mb-3 font-serif text-xl">Shortcuts &amp; tips</h2>
        <dl className="space-y-3 text-sm">
          {tips.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-gold/20 bg-coal px-4 py-3">
              <dt className="text-gold">{k}</dt>
              <dd className="text-mute">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
