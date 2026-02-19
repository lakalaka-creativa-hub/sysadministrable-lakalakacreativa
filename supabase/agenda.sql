-- Agenda: citas, reuniones y entregas

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time time not null,
  title text not null,
  type text not null default 'cita',
  client_name text,
  status text not null default 'Pendiente',
  channel text,
  duration_min integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointment_notes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  detail text,
  tag text not null default 'Recordatorio',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appointments_date on appointments(date);
create index if not exists idx_appointments_status on appointments(status);
create index if not exists idx_appointments_type on appointments(type);
create index if not exists idx_appointment_notes_date on appointment_notes(date);
