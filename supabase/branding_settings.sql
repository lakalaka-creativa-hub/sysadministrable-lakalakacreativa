-- Branding settings table (single row: id = 'default')
create table if not exists public.branding_settings (
  id text primary key,
  business_name text,
  logo_url text,
  contact_phone text,
  contact_email text,
  contact_web text,
  contact_address text,
  footer_thanks text,
  footer_info text,
  footer_social text,
  footer_closing text,
  terms text,
  access_1_label text,
  access_1_url text,
  access_2_label text,
  access_2_url text,
  access_3_label text,
  access_3_url text,
  access_4_label text,
  access_4_url text,
  access_5_label text,
  access_5_url text,
  social_1_network text,
  social_1_value text,
  social_2_network text,
  social_2_value text,
  social_3_network text,
  social_3_value text,
  social_4_network text,
  social_4_value text,
  theme_name text,
  app_bg text,
  app_card text,
  app_primary text,
  app_secondary text,
  app_text text,
  pdf_primary text,
  pdf_primary_dark text,
  pdf_accent text,
  pdf_soft text,
  pdf_text text,
  pdf_text_light text,
  pdf_border text,
  updated_at timestamptz default now()
);

-- Disable RLS for quick start (you can enable later with policies)
alter table public.branding_settings disable row level security;

-- Ensure the singleton row exists
insert into public.branding_settings (id)
values ('default')
on conflict (id) do nothing;
