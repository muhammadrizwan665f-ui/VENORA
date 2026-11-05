-- VENORA JEWELRY — Supabase schema.
-- Run this whole file once in Supabase Dashboard → SQL Editor.
-- The browser only ever uses the ANON key, which can read the public catalogue and nothing else.
-- Orders, subscribers and every write go through server code with the SERVICE ROLE key (bypasses RLS).

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  image text not null default '',
  description text not null default '',
  sort int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_slug text references public.categories(slug) on update cascade on delete restrict,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  images jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,   -- [{ "name": "Length", "options": ["16\"","18\""] }]
  stock int not null default 0 check (stock >= 0),
  status text not null default 'active' check (status in ('active','draft')),
  badge text check (badge in ('Hot','New')),
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  review_count int not null default 0,
  best_seller boolean not null default false,
  sku text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_slug);
create index if not exists products_status_idx on public.products(status);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  source text not null default 'whatsapp-cart' check (source in ('whatsapp-cart','manual')),
  status text not null default 'Pending'
    check (status in ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled')),
  customer_name text not null,
  whatsapp text not null,
  country text not null default '',
  city text not null default '',
  address text not null default '',
  notes text not null default '',
  items jsonb not null default '[]'::jsonb,       -- [{productId,slug,name,price,qty,variant}]
  subtotal numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_whatsapp_idx on public.orders(whatsapp);

create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'VENORA JEWELRY',
  tagline text not null default 'Elegance With An Edge.',
  whatsapp_number text not null default '923435295541',
  currency text not null default 'USD',
  currency_symbol text not null default '$',
  shipping_flat numeric(10,2) not null default 0,
  free_shipping_over numeric(10,2) not null default 0,
  logo_url text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  instagram text not null default '',
  tiktok text not null default '',
  youtube text not null default '',
  pinterest text not null default '',
  facebook text not null default '',
  theme text not null default 'noir-gold' check (theme in ('noir-gold','emerald-royale','burgundy-velvet','platinum-noir','rose-gold'))
);
insert into public.store_settings (id, phone) values (1, '+92 343 5295541') on conflict (id) do nothing;

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.orders          enable row level security;
alter table public.store_settings  enable row level security;
alter table public.subscribers     enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products for select using (status = 'active');

drop policy if exists "public read settings" on public.store_settings;
create policy "public read settings" on public.store_settings for select using (true);

-- orders + subscribers: NO policies => anon/authenticated users can neither read nor write them.

-- ---------- Storage bucket for product / logo images ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public bucket: image URLs work without a SELECT policy (and listing the bucket stays blocked).
-- Uploads happen server-side with the service role key after an admin check.
