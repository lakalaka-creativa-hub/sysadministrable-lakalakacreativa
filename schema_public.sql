create table public.agenda_settings (
  id uuid not null default gen_random_uuid(),
  key text not null,
  default_channel text not null default 'Web'::text,
  default_duration_min integer not null default 30,
  default_type text not null default 'cita'::text,
  default_status text not null default 'Pendiente'::text,
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  channels text[] not null default '{Web,WhatsApp,Llamada,Mostrador}'::text[],
  status_colors jsonb not null default '{"Cancelada": "#FDA4AF", "Pendiente": "#FCD34D", "Confirmada": "#6EE7B7", "Finalizada": "#D6D3D1", "En progreso": "#7DD3FC"}'::jsonb,
  types text[] not null default '{cita,reunion,entrega}'::text[],
  statuses text[] not null default '{Pendiente,Confirmada,"En progreso",Finalizada,Cancelada}'::text[]
);

create table public.app_users (
  created_at timestamp with time zone not null default now(),
  email_internal text,
  username text not null,
  password_hash text not null,
  role_id uuid not null,
  id uuid not null default gen_random_uuid(),
  is_active boolean not null default true,
  auth_user_id uuid
);

create table public.appointment_notes (
  id uuid not null default gen_random_uuid(),
  title text not null,
  date date not null,
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  tag text not null default 'Recordatorio'::text,
  detail text
);

create table public.appointments (
  date date not null,
  "time" time without time zone not null,
  title text not null,
  client_name text,
  channel text,
  id uuid not null default gen_random_uuid(),
  type text not null default 'cita'::text,
  status text not null default 'Pendiente'::text,
  duration_min integer not null default 30,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.branding_settings (
  theme_name text,
  pdf_text text,
  pdf_soft text,
  pdf_accent text,
  pdf_primary_dark text,
  pdf_primary text,
  app_text text,
  app_secondary text,
  app_primary text,
  app_card text,
  app_bg text,
  contact_email text,
  contact_phone text,
  id text not null,
  logo_url text,
  social_1_network text,
  access_4_url text,
  access_5_label text,
  access_5_url text,
  business_name text,
  access_1_url text,
  access_1_label text,
  footer_info text,
  social_1_value text,
  footer_closing text,
  social_2_network text,
  social_2_value text,
  social_3_value text,
  terms text,
  updated_at timestamp with time zone default now(),
  contact_address text,
  social_4_network text,
  social_4_value text,
  access_2_label text,
  access_2_url text,
  access_3_label text,
  contact_web text,
  footer_thanks text,
  footer_social text,
  social_3_network text,
  access_3_url text,
  access_4_label text,
  pdf_border text,
  pdf_text_light text
);

create table public.cliente_notas (
  nota text not null,
  cliente_id uuid not null,
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now()
);

create table public.clientes (
  correo text,
  direccion text,
  canal text,
  created_at timestamp with time zone not null default now(),
  nombre text not null,
  colonia text,
  codigo_postal text,
  estado text,
  ciudad text,
  telefono text,
  id uuid not null default gen_random_uuid()
);

create table public.cotizacion_items (
  quantity numeric not null default 1,
  product_name text not null,
  id uuid not null default gen_random_uuid(),
  subtotal numeric not null default 0,
  price numeric not null default 0,
  cotizacion_id uuid not null,
  product_id uuid
);

create table public.cotizaciones (
  folio text not null,
  cliente text not null,
  cliente_id uuid,
  direccion text,
  telefono text,
  id uuid not null default gen_random_uuid(),
  total numeric not null default 0,
  status text not null default 'ABIERTA'::text,
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  remision_id uuid,
  fecha date not null
);

create table public.expenses (
  description text,
  amount numeric(12,2) not null,
  notes text,
  id uuid not null default gen_random_uuid(),
  active boolean default true,
  created_at timestamp with time zone default now(),
  date date not null,
  category text not null,
  subcategory text
);

create table public.inventory_entries (
  quantity integer not null,
  cost_unit numeric,
  created_at timestamp with time zone not null default now(),
  note text,
  id uuid not null default gen_random_uuid(),
  entry_date date not null default CURRENT_DATE,
  supply_id uuid not null
);

create table public.kit_items (
  id uuid not null default gen_random_uuid(),
  component_supply_id uuid not null,
  created_at timestamp with time zone default now(),
  quantity numeric not null,
  kit_product_id uuid not null
);

create table public.products (
  price numeric not null,
  name text not null,
  cost numeric,
  id uuid not null default gen_random_uuid(),
  created_at timestamp without time zone default now(),
  active boolean default true
);

create table public.provider_products (
  id uuid not null default gen_random_uuid(),
  active boolean default true,
  created_at timestamp with time zone default now(),
  provider_id uuid not null,
  product_id uuid not null,
  supplier_price numeric not null,
  notes text
);

create table public.provider_supplies (
  created_at timestamp with time zone default now(),
  active boolean default true,
  id uuid not null default gen_random_uuid(),
  provider_id uuid not null,
  supply_id uuid not null,
  supplier_price numeric not null
);

create table public.providers (
  active boolean default true,
  id uuid not null default gen_random_uuid(),
  address text,
  notes text,
  email text,
  created_at timestamp with time zone default now(),
  phone text,
  name text not null
);

create table public.remision_items (
  subtotal numeric not null,
  product_id uuid,
  id uuid not null default gen_random_uuid(),
  remision_id uuid not null,
  product_name text not null,
  price numeric not null,
  quantity numeric not null default '1'::numeric,
  created_at timestamp without time zone not null default now()
);

create table public.remisiones (
  cliente_id uuid,
  anticipo numeric(10,2) default 0,
  total_cost numeric default 0,
  profit numeric default 0,
  delivered boolean default false,
  delivered_at timestamp with time zone,
  id uuid not null default gen_random_uuid(),
  folio text not null,
  cliente text not null default 'Venta mostrador'::text,
  fecha date default now(),
  total numeric not null,
  status text not null default 'Pendiente'::text,
  created_at timestamp without time zone not null default now(),
  estado text not null default 'activa'::text,
  telefono text,
  direccion text,
  payment_method text
);

create table public.roles (
  permissions jsonb not null default '{}'::jsonb,
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone not null default now()
);

create table public.supplies (
  unit text not null default 'pieza'::text,
  cost_unit numeric not null default 0,
  name text not null,
  active boolean default true,
  created_at timestamp with time zone default now(),
  id uuid not null default gen_random_uuid(),
  stock numeric not null default 0,
  stock_min numeric not null default 0
);

alter table public.products add constraint product_pkey PRIMARY KEY (id);

alter table public.remisiones add constraint remisiones_pkey PRIMARY KEY (id);

alter table public.remision_items add constraint remision_items_pkey PRIMARY KEY (id);

alter table public.remision_items add constraint remision_items_remision_id_fkey FOREIGN KEY (remision_id) REFERENCES remisiones(id) ON DELETE CASCADE;

alter table public.remision_items add constraint remision_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

alter table public.remisiones add constraint remisiones_folio_unique UNIQUE (folio);

alter table public.providers add constraint providers_pkey PRIMARY KEY (id);

alter table public.provider_products add constraint provider_products_pkey PRIMARY KEY (id);

alter table public.provider_products add constraint provider_products_provider_id_product_id_key UNIQUE (provider_id, product_id);

alter table public.provider_products add constraint provider_products_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE;

alter table public.provider_products add constraint provider_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

alter table public.kit_items add constraint kit_items_quantity_check CHECK ((quantity > (0)::numeric));

alter table public.kit_items add constraint kit_items_pkey PRIMARY KEY (id);

alter table public.kit_items add constraint kit_items_kit_product_id_fkey FOREIGN KEY (kit_product_id) REFERENCES products(id) ON DELETE CASCADE;

alter table public.supplies add constraint supplies_pkey PRIMARY KEY (id);

alter table public.provider_supplies add constraint provider_supplies_pkey PRIMARY KEY (id);

alter table public.provider_supplies add constraint provider_supplies_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id);

alter table public.provider_supplies add constraint provider_supplies_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES supplies(id);

alter table public.kit_items add constraint kit_items_component_supply_id_fkey FOREIGN KEY (component_supply_id) REFERENCES supplies(id);

alter table public.expenses add constraint expenses_pkey PRIMARY KEY (id);

alter table public.inventory_entries add constraint inventory_entries_quantity_check CHECK ((quantity > 0));

alter table public.inventory_entries add constraint inventory_entries_pkey PRIMARY KEY (id);

alter table public.inventory_entries add constraint inventory_entries_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES supplies(id);

alter table public.branding_settings add constraint branding_settings_pkey PRIMARY KEY (id);

alter table public.clientes add constraint clientes_pkey PRIMARY KEY (id);

alter table public.cliente_notas add constraint cliente_notas_pkey PRIMARY KEY (id);

alter table public.cliente_notas add constraint cliente_notas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

alter table public.remisiones add constraint remisiones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;

alter table public.roles add constraint roles_pkey PRIMARY KEY (id);

alter table public.roles add constraint roles_name_key UNIQUE (name);

alter table public.app_users add constraint app_users_pkey PRIMARY KEY (id);

alter table public.app_users add constraint app_users_username_key UNIQUE (username);

alter table public.app_users add constraint app_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id);

alter table public.app_users add constraint app_users_email_internal_key UNIQUE (email_internal);

alter table public.app_users add constraint app_users_email_internal_chk CHECK (((email_internal IS NULL) OR (email_internal ~~ '%@%.%'::text)));

alter table public.cotizaciones add constraint cotizaciones_pkey PRIMARY KEY (id);

alter table public.cotizaciones add constraint cotizaciones_folio_key UNIQUE (folio);

alter table public.cotizaciones add constraint cotizaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;

alter table public.cotizaciones add constraint cotizaciones_remision_id_fkey FOREIGN KEY (remision_id) REFERENCES remisiones(id) ON DELETE SET NULL;

alter table public.cotizacion_items add constraint cotizacion_items_pkey PRIMARY KEY (id);

alter table public.cotizacion_items add constraint cotizacion_items_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE;

alter table public.cotizacion_items add constraint cotizacion_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

alter table public.appointments add constraint appointments_pkey PRIMARY KEY (id);

alter table public.appointment_notes add constraint appointment_notes_pkey PRIMARY KEY (id);

alter table public.agenda_settings add constraint agenda_settings_pkey PRIMARY KEY (id);

alter table public.agenda_settings add constraint agenda_settings_key_key UNIQUE (key);

CREATE INDEX idx_supplies_active ON public.supplies USING btree (active);

CREATE INDEX idx_supplies_stock ON public.supplies USING btree (stock);

CREATE INDEX clientes_nombre_idx ON public.clientes USING btree (nombre);

CREATE INDEX remisiones_cliente_id_idx ON public.remisiones USING btree (cliente_id);

CREATE INDEX app_users_auth_user_id_idx ON public.app_users USING btree (auth_user_id);

CREATE INDEX idx_cotizaciones_fecha ON public.cotizaciones USING btree (fecha);

CREATE INDEX idx_cotizaciones_status ON public.cotizaciones USING btree (status);

CREATE INDEX idx_cotizacion_items_cotizacion_id ON public.cotizacion_items USING btree (cotizacion_id);

CREATE INDEX idx_appointments_date ON public.appointments USING btree (date);

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);

CREATE INDEX idx_appointments_type ON public.appointments USING btree (type);

CREATE INDEX idx_appointment_notes_date ON public.appointment_notes USING btree (date);

CREATE INDEX idx_agenda_settings_key ON public.agenda_settings USING btree (key);

CREATE OR REPLACE FUNCTION public.add_inventory_entry(p_supply_id uuid, p_quantity integer, p_cost_unit numeric, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- validar existencia
  IF NOT EXISTS (SELECT 1 FROM supplies WHERE id = p_supply_id) THEN
    RAISE EXCEPTION 'Supply not found';
  END IF;

  INSERT INTO inventory_entries (
    supply_id,
    quantity,
    cost_unit,
    note,
    entry_date
  )
  VALUES (
    p_supply_id,
    p_quantity,
    p_cost_unit,
    p_note,
    now()
  );

  UPDATE supplies
  SET
    stock = stock + p_quantity,
    cost_unit = COALESCE(p_cost_unit, cost_unit)
  WHERE id = p_supply_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.app_users au
    join public.roles r on r.id = au.role_id
    where au.auth_user_id = auth.uid()
      and au.is_active = true
      and r.name = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_cost(p_product_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
declare
  total_cost numeric := 0;
  product_name text;
begin
  -- nombre del producto
  select name into product_name
  from products
  where id = p_product_id;

  -- ¿ES KIT?
  if exists (
    select 1 from kit_items where kit_product_id = p_product_id
  ) then
    -- SUMA DE INSUMOS DEL KIT
    select coalesce(sum(
      ki.quantity *
      (
        select min(ps.supplier_price)
        from provider_supplies ps
        where ps.supply_id = ki.component_supply_id
          and ps.active = true
      )
    ), 0)
    into total_cost
    from kit_items ki
    where ki.kit_product_id = p_product_id;

    return total_cost;
  end if;

  -- PRODUCTO SIMPLE: buscar insumo por nombre
  select min(ps.supplier_price)
  into total_cost
  from supplies s
  join provider_supplies ps on ps.supply_id = s.id
  where lower(s.name) = lower(product_name)
    and ps.active = true;

  return coalesce(total_cost, 0);
end;
$function$;

CREATE OR REPLACE FUNCTION public.consume_inventory_for_remision(p_remision_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  r RECORD;
  v_count integer := 0;
BEGIN
  -- Calcular consumo por supply
  FOR r IN
    SELECT
      ki.component_supply_id AS supply_id,
      SUM(ki.quantity * ri.quantity)::numeric AS total_needed
    FROM remision_items ri
    JOIN kit_items ki
      ON ki.kit_product_id = ri.product_id
    WHERE ri.remision_id = p_remision_id
    GROUP BY ki.component_supply_id
  LOOP
    v_count := v_count + 1;

    -- validar stock suficiente
    IF (SELECT stock FROM supplies WHERE id = r.supply_id) < r.total_needed THEN
      RAISE EXCEPTION
        'Stock insuficiente para supply %, requerido %, disponible %',
        r.supply_id,
        r.total_needed,
        (SELECT stock FROM supplies WHERE id = r.supply_id);
    END IF;

    -- descontar stock (fila por fila, nunca silencioso)
    UPDATE supplies
    SET stock = stock - r.total_needed
    WHERE id = r.supply_id;
  END LOOP;

  -- Si no hubo ningún consumo, es un error lógico
  IF v_count = 0 THEN
    RAISE EXCEPTION 'La remisión no tiene kits con receta para consumir inventario';
  END IF;
END;
$function$;

create trigger trg_cotizaciones_updated_at BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
