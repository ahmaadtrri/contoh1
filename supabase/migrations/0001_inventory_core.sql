create extension if not exists "pgcrypto";

create type app_role as enum ('admin', 'produksi', 'owner');
create type transaction_type as enum ('inbound', 'outbound');
create type production_request_status as enum ('pending', 'approved', 'issued', 'rejected');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role app_role not null default 'produksi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  symbol text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  unit_id uuid not null references units(id) on delete restrict,
  item_type text not null check (item_type in ('raw_material', 'finished_goods')),
  name text not null,
  description text,
  photo_url text,
  reorder_point numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  model text,
  color text,
  size text,
  sku text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_levels (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  item_id uuid not null references items(id) on delete restrict,
  variant_id uuid references item_variants(id) on delete set null,
  quantity numeric(18,2) not null default 0,
  updated_at timestamptz not null default now()
);
create unique index if not exists stock_levels_unique_idx
  on stock_levels (warehouse_id, item_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type transaction_type not null,
  source_type text not null,
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  supplier_id uuid references suppliers(id) on delete set null,
  reference_no text,
  notes text,
  created_by uuid not null references profiles(id) on delete restrict,
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_transaction_lines (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references inventory_transactions(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  variant_id uuid references item_variants(id) on delete set null,
  quantity numeric(18,2) not null,
  unit_cost numeric(18,2) not null default 0,
  line_cost numeric(18,2) not null default 0,
  lot_number text,
  batch_number text,
  created_at timestamptz not null default now()
);

create table if not exists production_requests (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  requested_by uuid not null references profiles(id) on delete restrict,
  approved_by uuid references profiles(id) on delete set null,
  issued_by uuid references profiles(id) on delete set null,
  issued_transaction_id uuid references inventory_transactions(id) on delete set null,
  status production_request_status not null default 'pending',
  notes text,
  approved_at timestamptz,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists production_request_lines (
  id uuid primary key default gen_random_uuid(),
  production_request_id uuid not null references production_requests(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  variant_id uuid references item_variants(id) on delete set null,
  quantity numeric(18,2) not null,
  note text
);

create table if not exists stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  reason text not null,
  notes text,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists stock_adjustment_lines (
  id uuid primary key default gen_random_uuid(),
  stock_adjustment_id uuid not null references stock_adjustments(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  variant_id uuid references item_variants(id) on delete set null,
  system_qty numeric(18,2) not null,
  physical_qty numeric(18,2) not null,
  delta_qty numeric(18,2) not null,
  note text
);

create table if not exists fifo_layers (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id) on delete restrict,
  item_id uuid not null references items(id) on delete restrict,
  variant_id uuid references item_variants(id) on delete set null,
  source_transaction_id uuid references inventory_transactions(id) on delete set null,
  source_transaction_line_id uuid references inventory_transaction_lines(id) on delete set null,
  quantity numeric(18,2) not null,
  remaining_qty numeric(18,2) not null,
  unit_cost numeric(18,2) not null,
  lot_number text,
  batch_number text,
  created_at timestamptz not null default now()
);

create table if not exists fifo_consumptions (
  id uuid primary key default gen_random_uuid(),
  outbound_transaction_line_id uuid not null references inventory_transaction_lines(id) on delete cascade,
  fifo_layer_id uuid not null references fifo_layers(id) on delete restrict,
  quantity numeric(18,2) not null,
  unit_cost numeric(18,2) not null,
  line_cost numeric(18,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists product_labels (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references item_variants(id) on delete cascade,
  barcode_value text not null unique,
  template_name text not null default 'default-finished-goods',
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns app_role
language sql
stable
as $$
  select role from profiles where id = auth.uid()
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table units enable row level security;
alter table suppliers enable row level security;
alter table warehouses enable row level security;
alter table items enable row level security;
alter table item_variants enable row level security;
alter table stock_levels enable row level security;
alter table inventory_transactions enable row level security;
alter table inventory_transaction_lines enable row level security;
alter table production_requests enable row level security;
alter table production_request_lines enable row level security;
alter table stock_adjustments enable row level security;
alter table stock_adjustment_lines enable row level security;
alter table fifo_layers enable row level security;
alter table fifo_consumptions enable row level security;
alter table product_labels enable row level security;
alter table audit_logs enable row level security;

create policy "profiles_read_self_or_owner" on profiles
for select using (auth.uid() = id or current_user_role() = 'owner');

create policy "owner_admin_manage_profiles" on profiles
for all using (current_user_role() in ('owner', 'admin'))
with check (current_user_role() in ('owner', 'admin'));

create policy "master_read_all_roles" on categories for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "master_write_admin_owner_categories" on categories for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "master_read_units" on units for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "master_write_units" on units for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "master_read_suppliers" on suppliers for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "master_write_suppliers" on suppliers for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "master_read_warehouses" on warehouses for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "master_write_warehouses" on warehouses for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "master_read_items" on items for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "master_write_items" on items for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "master_read_variants" on item_variants for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "master_write_variants" on item_variants for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));

create policy "stock_levels_read_all" on stock_levels for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "stock_levels_write_admin_owner" on stock_levels for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));

create policy "inventory_tx_read_all" on inventory_transactions for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "inventory_tx_write_admin_owner" on inventory_transactions for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "inventory_lines_read_all" on inventory_transaction_lines for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "inventory_lines_write_admin_owner" on inventory_transaction_lines for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));

create policy "production_request_read_all" on production_requests for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "production_request_write_role_based" on production_requests for all using (current_user_role() in ('admin', 'produksi', 'owner')) with check (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "production_request_lines_read_all" on production_request_lines for select using (current_user_role() in ('admin', 'produksi', 'owner'));
create policy "production_request_lines_write_role_based" on production_request_lines for all using (current_user_role() in ('admin', 'produksi', 'owner')) with check (current_user_role() in ('admin', 'produksi', 'owner'));

create policy "adjustment_read_all" on stock_adjustments for select using (current_user_role() in ('admin', 'owner'));
create policy "adjustment_write_admin_owner" on stock_adjustments for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "adjustment_lines_read_all" on stock_adjustment_lines for select using (current_user_role() in ('admin', 'owner'));
create policy "adjustment_lines_write_admin_owner" on stock_adjustment_lines for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));

create policy "fifo_read_owner_admin" on fifo_layers for select using (current_user_role() in ('admin', 'owner'));
create policy "fifo_write_owner_admin" on fifo_layers for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));
create policy "fifo_consumptions_read_owner_admin" on fifo_consumptions for select using (current_user_role() in ('admin', 'owner'));
create policy "fifo_consumptions_write_owner_admin" on fifo_consumptions for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));

create policy "labels_read_all" on product_labels for select using (current_user_role() in ('admin', 'owner', 'produksi'));
create policy "labels_write_admin_owner" on product_labels for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));

create policy "audit_read_owner_admin" on audit_logs for select using (current_user_role() in ('admin', 'owner'));
create policy "audit_write_owner_admin" on audit_logs for all using (current_user_role() in ('admin', 'owner')) with check (current_user_role() in ('admin', 'owner'));

