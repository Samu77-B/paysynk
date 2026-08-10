-- PaySynk multi-tenant schema for Supabase
-- Run in Supabase SQL Editor after creating a project.
-- Every tenant-scoped table uses merchant_id + RLS.

create extension if not exists "pgcrypto";

-- Plan tiers match marketing pricing
create type public.plan_tier as enum ('standard', 'retail_pos');
create type public.order_status as enum (
  'pending',
  'paid',
  'unfulfilled',
  'fulfilled',
  'refunded',
  'cancelled'
);

-- Profiles mirror auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  plan_tier public.plan_tier not null default 'standard',
  stripe_connect_id text,
  paypal_merchant_id text,
  payments_active boolean not null default false,
  billing_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index merchants_owner_id_idx on public.merchants (owner_id);

-- Staff memberships (unlimited on retail_pos)
create table public.merchant_members (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  unique (merchant_id, user_id)
);

create index merchant_members_user_id_idx on public.merchant_members (user_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null default '',
  price_in_pence integer not null check (price_in_pence >= 0),
  compare_at_price_in_pence integer,
  sku text,
  stock_quantity integer not null default 0,
  images text[] not null default '{}',
  tags text[] not null default '{}',
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (merchant_id, slug)
);

create index products_merchant_id_idx on public.products (merchant_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  title text not null,
  sku text,
  price_override integer,
  stock_quantity integer not null default 0,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants (product_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  customer_email text,
  customer_name text,
  status public.order_status not null default 'pending',
  total_in_pence integer not null default 0,
  currency text not null default 'gbp',
  items_json jsonb not null default '[]'::jsonb,
  shipping_address jsonb,
  stripe_payment_id text,
  channel text not null default 'online' check (channel in ('online', 'pos')),
  created_at timestamptz not null default now()
);

create index orders_merchant_id_idx on public.orders (merchant_id);
create index orders_status_idx on public.orders (status);

create table public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  amount_in_pence integer not null,
  currency text not null default 'gbp',
  status text not null default 'paid',
  invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Helpers -----------------------------------------------------------------

create or replace function public.is_merchant_member(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.merchant_members m
    where m.merchant_id = mid
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-create merchant + membership on signup (optional bootstrap)
create or replace function public.create_merchant_for_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
  base_slug text;
begin
  base_slug := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'store_name', split_part(new.email, '@', 1)), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'store';
  end if;

  insert into public.merchants (name, slug, owner_id, plan_tier)
  values (
    coalesce(new.raw_user_meta_data->>'store_name', 'My PaySynk Store'),
    base_slug || '-' || substr(new.id::text, 1, 6),
    new.id,
    'standard'
  )
  returning id into mid;

  insert into public.merchant_members (merchant_id, user_id, role)
  values (mid, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_create_merchant on auth.users;
create trigger on_auth_user_create_merchant
  after insert on auth.users
  for each row execute function public.create_merchant_for_owner();

-- RLS ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.merchant_members enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.billing_invoices enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "merchants_select_member"
  on public.merchants for select
  using (public.is_merchant_member(id) or owner_id = auth.uid());

create policy "merchants_update_owner"
  on public.merchants for update
  using (owner_id = auth.uid());

create policy "members_select_own"
  on public.merchant_members for select
  using (user_id = auth.uid() or public.is_merchant_member(merchant_id));

create policy "products_all_member"
  on public.products for all
  using (public.is_merchant_member(merchant_id))
  with check (public.is_merchant_member(merchant_id));

create policy "variants_all_member"
  on public.product_variants for all
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and public.is_merchant_member(p.merchant_id)
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and public.is_merchant_member(p.merchant_id)
    )
  );

create policy "orders_all_member"
  on public.orders for all
  using (public.is_merchant_member(merchant_id))
  with check (public.is_merchant_member(merchant_id));

create policy "invoices_select_member"
  on public.billing_invoices for select
  using (public.is_merchant_member(merchant_id));
