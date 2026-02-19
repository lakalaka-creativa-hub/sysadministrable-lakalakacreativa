-- Cotizaciones (modulo separado de remisiones)

create table if not exists cotizaciones (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  cliente text not null,
  cliente_id uuid references clientes(id) on delete set null,
  telefono text,
  direccion text,
  fecha date not null,
  total numeric not null default 0,
  status text not null default 'ABIERTA',
  remision_id uuid references remisiones(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cotizacion_items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price numeric not null default 0,
  quantity numeric not null default 1,
  subtotal numeric not null default 0
);

create index if not exists idx_cotizaciones_fecha on cotizaciones(fecha);
create index if not exists idx_cotizaciones_status on cotizaciones(status);
create index if not exists idx_cotizacion_items_cotizacion_id on cotizacion_items(cotizacion_id);
