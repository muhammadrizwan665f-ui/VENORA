# VENORA JEWELRY — luxury serpent jewelry store

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage).
Ordering is **WhatsApp-first**: every product card and page has its own **ORDER ON WHATSAPP** button, and the cart ends in **CHECKOUT VIA WHATSAPP**. No payments are taken and no order is ever auto-confirmed or marked paid.

WhatsApp number in use: **+92 343 5295541** (`https://wa.me/923435295541`). It lives in one place (Admin → Settings, default in `src/lib/seed.ts`) and is used by every button.

## Run it

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev                    # http://localhost:3000
npm test                       # unit tests for WhatsApp messages + cart maths
npm run build && npm start
```

Without any Supabase keys the **storefront already works** with the built-in sample catalogue (cart, wishlist, product pages, WhatsApp buttons). Admin, order recording, order tracking and newsletter need Supabase.

## What you must provide

1. **Supabase project** → run `supabase/schema.sql` in the SQL editor (tables, RLS, `product-images` storage bucket).
2. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only, never exposed to the browser), `NEXT_PUBLIC_SITE_URL` (your domain; used in WhatsApp product links, sitemap, SEO).
3. **Admin login**: create a user in Supabase → Authentication → Users, then put that email in `ADMIN_EMAILS`. Sign in at `/admin/login`. Then use *Dashboard → Import sample catalogue* (or add your own products).
4. **Real product photography.** The images in `public/images` are crops of your reference mock-up, upscaled, so they are low resolution. Upload real photos per product in Admin → Products.
5. Review the policy pages (`/shipping-policy`, `/return-policy`, `/privacy-policy`, `/terms-and-conditions`) and the FAQ. They are sensible drafts (30-day returns, as in your reference), not legal advice.
6. Social links, email and address: Admin → Settings.

## Deploy on Cloudflare (Workers + OpenNext)

1. Push this folder to a GitHub repo (`.env.local` and `.dev.vars` are git-ignored).
2. `npm install`, then `npm run preview` to test locally in the Cloudflare runtime (copy `.dev.vars.example` to `.dev.vars` first).
3. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick the repo.
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
4. Environment variables (Worker → Settings):
   - **Build → Variables** (needed at build time): `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **Variables and Secrets** (runtime): the same three as plain variables, plus `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAILS` as **Secrets**.
5. **Settings → Domains & Routes → Add custom domain**; then set `NEXT_PUBLIC_SITE_URL` to that domain and redeploy.
6. In Supabase → Authentication → URL configuration, add your domain.

Worker size limit: 3 MiB gzipped on Cloudflare Free, 10 MiB on Paid. If the build is too large, upgrade the plan.
Or deploy from your computer: `npm run deploy` (after `npx wrangler login`).

## How WhatsApp ordering works

- Card / product page button → `wa.me/<number>?text=…` with product, price (sale price when discounted), quantity, selected variant and product URL (`src/lib/whatsapp.ts`).
- Cart → name, WhatsApp number, country, city, address, notes → one formatted message with all items, totals and an order reference (`VEN-YYMMDD-XXXX`). The checkout is also recorded as **Pending** in Supabase (prices re-read server-side), so it appears in Admin → Orders. Customers can use the reference on `/track-order`.
- You change statuses by hand (Pending → Confirmed → … → Delivered / Cancelled).

## Notes

- Star ratings show only when you enter a real rating on a product (no invented reviews).
- Shipping is free by default (matches the announcement bar). Set a charge / free-over threshold in Settings.
- `/necklaces`, `/bracelets`, `/rings`, `/earrings`, `/anklets`, `/jewelry-sets` rewrite to `/collections/<slug>`.
- Rate limiting is in-memory (per server instance); add firewall rules at your host for production.
- Security: admin routes are guarded by middleware **and** re-checked in every page/server action/upload route; the service-role key is only read in server code.

## Deploying
Cloudflare Workers Builds deploys every push to `main` automatically (Worker name: `venora`). Do not use "Retry build" on an old
build: it redeploys that old commit over the newer one. To roll back deliberately use Deployments → ⋯ → Rollback.
After a deploy, the admin product form shows "Product form v2 · build <commit>" so you can see which commit is live.
