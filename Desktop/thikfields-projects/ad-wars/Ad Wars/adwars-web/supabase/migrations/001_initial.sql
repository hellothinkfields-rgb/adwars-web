-- Ad Wars — initial schema
-- Run this in your Supabase SQL editor

-- Brands
create table if not exists brands (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  color       text not null default '#C0392B',
  domain      text,
  created_at  timestamptz default now()
);

-- Grid cells (sparse — only claimed cells stored)
create table if not exists grid_cells (
  cell_id     integer primary key check (cell_id >= 0 and cell_id < 4096),
  brand_id    uuid references brands(id) on delete set null,
  brand_name  text not null,
  color       text not null,
  price_paid  numeric(10,2) not null default 1.00,
  updated_at  timestamptz default now()
);

-- Pending transactions (created before Stripe payment, confirmed after)
create table if not exists pending_transactions (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid references brands(id),
  brand_name          text not null,
  cells               integer[] not null,
  total_amount        numeric(10,2) not null,
  charity_amount      numeric(10,2) not null,
  founder_amount      numeric(10,2) not null,
  stripe_session_id   text unique,
  status              text default 'pending' check (status in ('pending','completed','expired')),
  created_at          timestamptz default now()
);

-- Completed transactions (for history, leaderboard, Instagram posts)
create table if not exists transactions (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid references brands(id),
  brand_name          text not null,
  cells               integer[] not null,
  cells_conquered     integer not null,
  total_paid          numeric(10,2) not null,
  charity_amount      numeric(10,2) not null,
  founder_amount      numeric(10,2) not null,
  refund_amount       numeric(10,2) not null,
  stripe_session_id   text unique,
  created_at          timestamptz default now()
);

-- Global stats (single row)
create table if not exists stats (
  id                    integer primary key default 1,
  total_charity_donated numeric(10,2) default 0,
  total_volume          numeric(10,2) default 0,
  total_transactions    integer default 0
);
insert into stats (id) values (1) on conflict do nothing;

-- Enable Row Level Security
alter table brands enable row level security;
alter table grid_cells enable row level security;
alter table pending_transactions enable row level security;
alter table transactions enable row level security;
alter table stats enable row level security;

-- Public read access for everything
create policy "Public read brands"       on brands            for select using (true);
create policy "Public read grid"         on grid_cells        for select using (true);
create policy "Public read transactions" on transactions      for select using (true);
create policy "Public read stats"        on stats             for select using (true);

-- Anyone can register a brand (insert only, no update/delete without service role)
create policy "Public insert brands" on brands for insert with check (true);

-- Service role handles all writes to grid and transactions (via API routes)
-- No additional policies needed for service role

-- Enable Realtime on grid_cells so the live grid updates instantly
alter publication supabase_realtime add table grid_cells;
alter publication supabase_realtime add table stats;

-- Indexes
create index if not exists idx_grid_cells_brand_id on grid_cells(brand_id);
create index if not exists idx_transactions_brand_id on transactions(brand_id);
create index if not exists idx_transactions_created_at on transactions(created_at desc);
