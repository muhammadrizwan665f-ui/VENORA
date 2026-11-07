-- Add per-option-combination pricing, inventory and images for VENORA products.
-- Safe to run on existing Supabase projects; preserves all current products.
alter table public.products
  add column if not exists variant_combinations jsonb not null default '[]'::jsonb;

comment on column public.products.variant_combinations is
  'Array of sellable option combinations: options, price, salePrice, sku, stock and images.';
