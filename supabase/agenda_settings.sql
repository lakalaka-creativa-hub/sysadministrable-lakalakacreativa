-- Agenda settings (global defaults)

create table if not exists agenda_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  statuses text[] not null default '{Pendiente,Confirmada,En progreso,Finalizada,Cancelada}',
  types text[] not null default '{cita,reunion,entrega}',
  channels text[] not null default '{Web,WhatsApp,Llamada,Mostrador}',
  default_status text not null default 'Pendiente',
  default_type text not null default 'cita',
  default_channel text not null default 'Web',
  default_duration_min integer not null default 30,
  status_colors jsonb not null default '{"Pendiente":"#FCD34D","Confirmada":"#6EE7B7","En progreso":"#7DD3FC","Finalizada":"#D6D3D1","Cancelada":"#FDA4AF"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into agenda_settings (key)
values ('default')
on conflict (key) do nothing;

create index if not exists idx_agenda_settings_key on agenda_settings(key);
