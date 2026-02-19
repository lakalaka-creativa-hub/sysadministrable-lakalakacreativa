-- Enable RLS and allow authenticated users full access.

alter table public.agenda_settings enable row level security;
create policy agenda_settings_all on public.agenda_settings
  for all to authenticated
  using (true)
  with check (true);

alter table public.app_users enable row level security;
create policy app_users_all on public.app_users
  for all to authenticated
  using (true)
  with check (true);

alter table public.appointment_notes enable row level security;
create policy appointment_notes_all on public.appointment_notes
  for all to authenticated
  using (true)
  with check (true);

alter table public.appointments enable row level security;
create policy appointments_all on public.appointments
  for all to authenticated
  using (true)
  with check (true);

alter table public.branding_settings enable row level security;
create policy branding_settings_all on public.branding_settings
  for all to authenticated
  using (true)
  with check (true);

alter table public.cliente_notas enable row level security;
create policy cliente_notas_all on public.cliente_notas
  for all to authenticated
  using (true)
  with check (true);

alter table public.clientes enable row level security;
create policy clientes_all on public.clientes
  for all to authenticated
  using (true)
  with check (true);

alter table public.cotizacion_items enable row level security;
create policy cotizacion_items_all on public.cotizacion_items
  for all to authenticated
  using (true)
  with check (true);

alter table public.cotizaciones enable row level security;
create policy cotizaciones_all on public.cotizaciones
  for all to authenticated
  using (true)
  with check (true);

alter table public.expenses enable row level security;
create policy expenses_all on public.expenses
  for all to authenticated
  using (true)
  with check (true);

alter table public.inventory_entries enable row level security;
create policy inventory_entries_all on public.inventory_entries
  for all to authenticated
  using (true)
  with check (true);

alter table public.kit_items enable row level security;
create policy kit_items_all on public.kit_items
  for all to authenticated
  using (true)
  with check (true);

alter table public.products enable row level security;
create policy products_all on public.products
  for all to authenticated
  using (true)
  with check (true);

alter table public.provider_products enable row level security;
create policy provider_products_all on public.provider_products
  for all to authenticated
  using (true)
  with check (true);

alter table public.provider_supplies enable row level security;
create policy provider_supplies_all on public.provider_supplies
  for all to authenticated
  using (true)
  with check (true);

alter table public.providers enable row level security;
create policy providers_all on public.providers
  for all to authenticated
  using (true)
  with check (true);

alter table public.remision_items enable row level security;
create policy remision_items_all on public.remision_items
  for all to authenticated
  using (true)
  with check (true);

alter table public.remisiones enable row level security;
create policy remisiones_all on public.remisiones
  for all to authenticated
  using (true)
  with check (true);

alter table public.roles enable row level security;
create policy roles_all on public.roles
  for all to authenticated
  using (true)
  with check (true);

alter table public.supplies enable row level security;
create policy supplies_all on public.supplies
  for all to authenticated
  using (true)
  with check (true);
