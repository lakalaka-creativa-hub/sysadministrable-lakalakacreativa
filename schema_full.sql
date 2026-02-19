create type auth.aal_level as enum ('aal1', 'aal2', 'aal3');

create type auth.code_challenge_method as enum ('s256', 'plain');

create type auth.factor_status as enum ('unverified', 'verified');

create type auth.factor_type as enum ('totp', 'webauthn', 'phone');

create type auth.oauth_authorization_status as enum ('pending', 'approved', 'denied', 'expired');

create type auth.oauth_client_type as enum ('public', 'confidential');

create type auth.oauth_registration_type as enum ('dynamic', 'manual');

create type auth.oauth_response_type as enum ('code');

create type auth.one_time_token_type as enum ('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');

create type realtime.action as enum ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');

create type realtime.equality_op as enum ('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');

create type storage.buckettype as enum ('STANDARD', 'ANALYTICS', 'VECTOR');

create table auth.audit_log_entries (
  payload json,
  created_at timestamp with time zone,
  id uuid not null,
  instance_id uuid,
  ip_address character varying(64) not null default ''::character varying
);

create table auth.flow_state (
  invite_token text,
  referrer text,
  oauth_client_state_id uuid,
  auth_code_issued_at timestamp with time zone,
  authentication_method text not null,
  updated_at timestamp with time zone,
  created_at timestamp with time zone,
  provider_refresh_token text,
  provider_access_token text,
  provider_type text not null,
  linking_target_id uuid,
  email_optional boolean not null default false,
  id uuid not null,
  code_challenge text,
  user_id uuid,
  code_challenge_method auth.code_challenge_method,
  auth_code text
);

create table auth.identities (
  provider text not null,
  email text default lower((identity_data ->> 'email'::text)),
  provider_id text not null,
  updated_at timestamp with time zone,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  identity_data jsonb not null,
  user_id uuid not null,
  id uuid not null default gen_random_uuid()
);

create table auth.instances (
  updated_at timestamp with time zone,
  created_at timestamp with time zone,
  raw_base_config text,
  uuid uuid,
  id uuid not null
);

create table auth.mfa_amr_claims (
  created_at timestamp with time zone not null,
  authentication_method text not null,
  updated_at timestamp with time zone not null,
  id uuid not null,
  session_id uuid not null
);

create table auth.mfa_challenges (
  created_at timestamp with time zone not null,
  verified_at timestamp with time zone,
  ip_address inet not null,
  otp_code text,
  web_authn_session_data jsonb,
  id uuid not null,
  factor_id uuid not null
);

create table auth.mfa_factors (
  id uuid not null,
  last_webauthn_challenge_data jsonb,
  web_authn_aaguid uuid,
  web_authn_credential jsonb,
  last_challenged_at timestamp with time zone,
  phone text,
  user_id uuid not null,
  friendly_name text,
  factor_type auth.factor_type not null,
  status auth.factor_status not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  secret text
);

create table auth.oauth_authorizations (
  id uuid not null,
  authorization_id text not null,
  client_id uuid not null,
  user_id uuid,
  redirect_uri text not null,
  scope text not null,
  state text,
  resource text,
  approved_at timestamp with time zone,
  authorization_code text,
  code_challenge_method auth.code_challenge_method,
  code_challenge text,
  nonce text,
  expires_at timestamp with time zone not null default (now() + '00:03:00'::interval),
  created_at timestamp with time zone not null default now(),
  status auth.oauth_authorization_status not null default 'pending'::auth.oauth_authorization_status,
  response_type auth.oauth_response_type not null default 'code'::auth.oauth_response_type
);

create table auth.oauth_client_states (
  id uuid not null,
  provider_type text not null,
  code_verifier text,
  created_at timestamp with time zone not null
);

create table auth.oauth_clients (
  grant_types text not null,
  registration_type auth.oauth_registration_type not null,
  id uuid not null,
  logo_uri text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  client_secret_hash text,
  token_endpoint_auth_method text not null,
  client_type auth.oauth_client_type not null default 'confidential'::auth.oauth_client_type,
  client_uri text,
  client_name text,
  redirect_uris text not null
);

create table auth.oauth_consents (
  revoked_at timestamp with time zone,
  scopes text not null,
  client_id uuid not null,
  user_id uuid not null,
  granted_at timestamp with time zone not null default now(),
  id uuid not null
);

create table auth.one_time_tokens (
  user_id uuid not null,
  token_type auth.one_time_token_type not null,
  token_hash text not null,
  relates_to text not null,
  updated_at timestamp without time zone not null default now(),
  created_at timestamp without time zone not null default now(),
  id uuid not null
);

create table auth.refresh_tokens (
  revoked boolean,
  created_at timestamp with time zone,
  parent character varying(255),
  session_id uuid,
  updated_at timestamp with time zone,
  id bigint not null default nextval('auth.refresh_tokens_id_seq'::regclass),
  instance_id uuid,
  user_id character varying(255),
  token character varying(255)
);

create table auth.saml_providers (
  entity_id text not null,
  metadata_xml text not null,
  metadata_url text,
  name_id_format text,
  attribute_mapping jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  id uuid not null,
  sso_provider_id uuid not null
);

create table auth.saml_relay_states (
  sso_provider_id uuid not null,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  redirect_to text,
  flow_state_id uuid,
  for_email text,
  request_id text not null,
  id uuid not null
);

create table auth.schema_migrations (
  version character varying(255) not null
);

create table auth.sessions (
  user_id uuid not null,
  id uuid not null,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  factor_id uuid,
  aal auth.aal_level,
  not_after timestamp with time zone,
  refreshed_at timestamp without time zone,
  user_agent text,
  ip inet,
  tag text,
  oauth_client_id uuid,
  refresh_token_hmac_key text,
  refresh_token_counter bigint,
  scopes text
);

create table auth.sso_domains (
  id uuid not null,
  sso_provider_id uuid not null,
  domain text not null,
  updated_at timestamp with time zone,
  created_at timestamp with time zone
);

create table auth.sso_providers (
  updated_at timestamp with time zone,
  disabled boolean,
  resource_id text,
  id uuid not null,
  created_at timestamp with time zone
);

create table auth.users (
  email_confirmed_at timestamp with time zone,
  deleted_at timestamp with time zone,
  reauthentication_sent_at timestamp with time zone,
  reauthentication_token character varying(255) default ''::character varying,
  banned_until timestamp with time zone,
  email_change_confirm_status smallint default 0,
  email_change_token_current character varying(255) default ''::character varying,
  is_sso_user boolean not null default false,
  is_anonymous boolean not null default false,
  phone_change text default ''::character varying,
  phone text default NULL::character varying,
  confirmed_at timestamp with time zone default LEAST(email_confirmed_at, phone_confirmed_at),
  phone_change_sent_at timestamp with time zone,
  phone_change_token character varying(255) default ''::character varying,
  phone_confirmed_at timestamp with time zone,
  email_change_token_new character varying(255),
  updated_at timestamp with time zone,
  created_at timestamp with time zone,
  is_super_admin boolean,
  raw_user_meta_data jsonb,
  raw_app_meta_data jsonb,
  last_sign_in_at timestamp with time zone,
  email_change_sent_at timestamp with time zone,
  email_change character varying(255),
  recovery_sent_at timestamp with time zone,
  recovery_token character varying(255),
  confirmation_sent_at timestamp with time zone,
  confirmation_token character varying(255),
  invited_at timestamp with time zone,
  encrypted_password character varying(255),
  email character varying(255),
  role character varying(255),
  aud character varying(255),
  id uuid not null,
  instance_id uuid
);

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

create table realtime.messages (
  topic text not null,
  id uuid not null default gen_random_uuid(),
  private boolean default false,
  updated_at timestamp without time zone not null default now(),
  extension text not null,
  payload jsonb,
  event text,
  inserted_at timestamp without time zone not null default now()
);

create table realtime.messages_2026_02_17 (
  event text,
  payload jsonb,
  updated_at timestamp without time zone not null default now(),
  private boolean default false,
  extension text not null,
  id uuid not null default gen_random_uuid(),
  topic text not null,
  inserted_at timestamp without time zone not null default now()
);

create table realtime.messages_2026_02_18 (
  id uuid not null default gen_random_uuid(),
  updated_at timestamp without time zone not null default now(),
  private boolean default false,
  event text,
  payload jsonb,
  extension text not null,
  topic text not null,
  inserted_at timestamp without time zone not null default now()
);

create table realtime.messages_2026_02_19 (
  payload jsonb,
  event text,
  private boolean default false,
  updated_at timestamp without time zone not null default now(),
  inserted_at timestamp without time zone not null default now(),
  topic text not null,
  id uuid not null default gen_random_uuid(),
  extension text not null
);

create table realtime.messages_2026_02_20 (
  extension text not null,
  id uuid not null default gen_random_uuid(),
  inserted_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  private boolean default false,
  event text,
  payload jsonb,
  topic text not null
);

create table realtime.messages_2026_02_21 (
  topic text not null,
  extension text not null,
  payload jsonb,
  event text,
  private boolean default false,
  updated_at timestamp without time zone not null default now(),
  inserted_at timestamp without time zone not null default now(),
  id uuid not null default gen_random_uuid()
);

create table realtime.schema_migrations (
  inserted_at timestamp(0) without time zone,
  version bigint not null
);

create table realtime.subscription (
  action_filter text default '*'::text,
  claims_role regrole not null default realtime.to_regrole((claims ->> 'role'::text)),
  claims jsonb not null,
  subscription_id uuid not null,
  created_at timestamp without time zone not null default timezone('utc'::text, now()),
  filters realtime.user_defined_filter[] not null default '{}'::realtime.user_defined_filter[],
  entity regclass not null,
  id bigint not null
);

create table storage.buckets (
  created_at timestamp with time zone default now(),
  owner uuid,
  avif_autodetection boolean default false,
  public boolean default false,
  owner_id text,
  name text not null,
  file_size_limit bigint,
  id text not null,
  type storage.buckettype not null default 'STANDARD'::storage.buckettype,
  allowed_mime_types text[],
  updated_at timestamp with time zone default now()
);

create table storage.buckets_analytics (
  name text not null,
  deleted_at timestamp with time zone,
  id uuid not null default gen_random_uuid(),
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  format text not null default 'ICEBERG'::text,
  type storage.buckettype not null default 'ANALYTICS'::storage.buckettype
);

create table storage.buckets_vectors (
  type storage.buckettype not null default 'VECTOR'::storage.buckettype,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  id text not null
);

create table storage.migrations (
  name character varying(100) not null,
  executed_at timestamp without time zone default CURRENT_TIMESTAMP,
  hash character varying(40) not null,
  id integer not null
);

create table storage.objects (
  owner uuid,
  metadata jsonb,
  version text,
  id uuid not null default gen_random_uuid(),
  name text,
  user_metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_accessed_at timestamp with time zone default now(),
  bucket_id text,
  path_tokens text[] default string_to_array(name, '/'::text),
  owner_id text
);

create table storage.s3_multipart_uploads (
  bucket_id text not null,
  key text not null,
  version text not null,
  owner_id text,
  upload_signature text not null,
  id text not null,
  in_progress_size bigint not null default 0,
  user_metadata jsonb,
  created_at timestamp with time zone not null default now()
);

create table storage.s3_multipart_uploads_parts (
  upload_id text not null,
  created_at timestamp with time zone not null default now(),
  size bigint not null default 0,
  id uuid not null default gen_random_uuid(),
  version text not null,
  owner_id text,
  etag text not null,
  key text not null,
  bucket_id text not null,
  part_number integer not null
);

create table storage.vector_indexes (
  updated_at timestamp with time zone not null default now(),
  distance_metric text not null,
  dimension integer not null,
  metadata_configuration jsonb,
  id text not null default gen_random_uuid(),
  data_type text not null,
  bucket_id text not null,
  name text not null,
  created_at timestamp with time zone not null default now()
);

create table vault.secrets (
  id uuid not null default gen_random_uuid(),
  key_id uuid,
  secret text not null,
  name text,
  updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  nonce bytea default vault._crypto_aead_det_noncegen(),
  description text not null default ''::text
);

alter table auth.users add constraint users_pkey PRIMARY KEY (id);

alter table auth.refresh_tokens add constraint refresh_tokens_pkey PRIMARY KEY (id);

alter table auth.instances add constraint instances_pkey PRIMARY KEY (id);

alter table auth.audit_log_entries add constraint audit_log_entries_pkey PRIMARY KEY (id);

alter table auth.schema_migrations add constraint schema_migrations_pkey PRIMARY KEY (version);

alter table vault.secrets add constraint secrets_pkey PRIMARY KEY (id);

alter table auth.users add constraint users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)));

alter table auth.identities add constraint identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table auth.refresh_tokens add constraint refresh_tokens_token_unique UNIQUE (token);

alter table auth.sessions add constraint sessions_pkey PRIMARY KEY (id);

alter table auth.sessions add constraint sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table auth.refresh_tokens add constraint refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;

alter table auth.mfa_factors add constraint mfa_factors_pkey PRIMARY KEY (id);

alter table auth.mfa_factors add constraint mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table auth.mfa_challenges add constraint mfa_challenges_pkey PRIMARY KEY (id);

alter table auth.mfa_challenges add constraint mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;

alter table auth.mfa_amr_claims add constraint mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);

alter table auth.mfa_amr_claims add constraint mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;

alter table auth.mfa_amr_claims add constraint amr_id_pk PRIMARY KEY (id);

alter table auth.sso_providers add constraint "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)));

alter table auth.sso_providers add constraint sso_providers_pkey PRIMARY KEY (id);

alter table auth.sso_domains add constraint "domain not empty" CHECK ((char_length(domain) > 0));

alter table auth.sso_domains add constraint sso_domains_pkey PRIMARY KEY (id);

alter table auth.sso_domains add constraint sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;

alter table auth.saml_providers add constraint "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0));

alter table auth.saml_providers add constraint "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0)));

alter table auth.saml_providers add constraint "entity_id not empty" CHECK ((char_length(entity_id) > 0));

alter table auth.saml_providers add constraint saml_providers_pkey PRIMARY KEY (id);

alter table auth.saml_providers add constraint saml_providers_entity_id_key UNIQUE (entity_id);

alter table auth.saml_providers add constraint saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;

alter table auth.saml_relay_states add constraint "request_id not empty" CHECK ((char_length(request_id) > 0));

alter table auth.saml_relay_states add constraint saml_relay_states_pkey PRIMARY KEY (id);

alter table auth.saml_relay_states add constraint saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;

alter table auth.users add constraint users_phone_key UNIQUE (phone);

alter table auth.flow_state add constraint flow_state_pkey PRIMARY KEY (id);

alter table auth.saml_relay_states add constraint saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;

alter table auth.identities add constraint identities_pkey PRIMARY KEY (id);

alter table auth.identities add constraint identities_provider_id_provider_unique UNIQUE (provider_id, provider);

alter table auth.one_time_tokens add constraint one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0));

alter table auth.one_time_tokens add constraint one_time_tokens_pkey PRIMARY KEY (id);

alter table auth.one_time_tokens add constraint one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table auth.mfa_factors add constraint mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);

alter table auth.oauth_clients add constraint oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024));

alter table auth.oauth_clients add constraint oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048));

alter table auth.oauth_clients add constraint oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048));

alter table auth.oauth_clients add constraint oauth_clients_pkey PRIMARY KEY (id);

alter table auth.oauth_authorizations add constraint oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048));

alter table auth.oauth_authorizations add constraint oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096));

alter table auth.oauth_authorizations add constraint oauth_authorizations_state_length CHECK ((char_length(state) <= 4096));

alter table auth.oauth_authorizations add constraint oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048));

alter table auth.oauth_authorizations add constraint oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128));

alter table auth.oauth_authorizations add constraint oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255));

alter table auth.oauth_authorizations add constraint oauth_authorizations_expires_at_future CHECK ((expires_at > created_at));

alter table auth.oauth_authorizations add constraint oauth_authorizations_pkey PRIMARY KEY (id);

alter table auth.oauth_authorizations add constraint oauth_authorizations_authorization_id_key UNIQUE (authorization_id);

alter table auth.oauth_authorizations add constraint oauth_authorizations_authorization_code_key UNIQUE (authorization_code);

alter table auth.oauth_authorizations add constraint oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;

alter table auth.oauth_authorizations add constraint oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table auth.oauth_consents add constraint oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048));

alter table auth.oauth_consents add constraint oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0));

alter table auth.oauth_consents add constraint oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at)));

alter table auth.oauth_consents add constraint oauth_consents_pkey PRIMARY KEY (id);

alter table auth.oauth_consents add constraint oauth_consents_user_client_unique UNIQUE (user_id, client_id);

alter table auth.oauth_consents add constraint oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table auth.oauth_consents add constraint oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;

alter table auth.sessions add constraint sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;

alter table auth.oauth_authorizations add constraint oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255));

alter table auth.sessions add constraint sessions_scopes_length CHECK ((char_length(scopes) <= 4096));

alter table auth.oauth_client_states add constraint oauth_client_states_pkey PRIMARY KEY (id);

alter table realtime.schema_migrations add constraint schema_migrations_pkey PRIMARY KEY (version);

alter table realtime.subscription add constraint pk_subscription PRIMARY KEY (id);

alter table storage.migrations add constraint migrations_pkey PRIMARY KEY (id);

alter table storage.migrations add constraint migrations_name_key UNIQUE (name);

alter table storage.buckets add constraint buckets_pkey PRIMARY KEY (id);

alter table storage.objects add constraint objects_pkey PRIMARY KEY (id);

alter table storage.objects add constraint "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);

alter table storage.s3_multipart_uploads add constraint s3_multipart_uploads_pkey PRIMARY KEY (id);

alter table storage.s3_multipart_uploads add constraint s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);

alter table storage.s3_multipart_uploads_parts add constraint s3_multipart_uploads_parts_pkey PRIMARY KEY (id);

alter table storage.s3_multipart_uploads_parts add constraint s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;

alter table storage.s3_multipart_uploads_parts add constraint s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);

alter table storage.buckets_vectors add constraint buckets_vectors_pkey PRIMARY KEY (id);

alter table storage.vector_indexes add constraint vector_indexes_pkey PRIMARY KEY (id);

alter table storage.vector_indexes add constraint vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);

alter table storage.buckets_analytics add constraint buckets_analytics_pkey PRIMARY KEY (id);

alter table realtime.messages add constraint messages_pkey PRIMARY KEY (id, inserted_at);

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

alter table realtime.subscription add constraint subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])));

alter table auth.oauth_clients add constraint oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])));

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

alter table realtime.messages_2026_02_17 add constraint messages_2026_02_17_pkey PRIMARY KEY (id, inserted_at);

alter table realtime.messages_2026_02_18 add constraint messages_2026_02_18_pkey PRIMARY KEY (id, inserted_at);

alter table realtime.messages_2026_02_19 add constraint messages_2026_02_19_pkey PRIMARY KEY (id, inserted_at);

alter table realtime.messages_2026_02_20 add constraint messages_2026_02_20_pkey PRIMARY KEY (id, inserted_at);

alter table realtime.messages_2026_02_21 add constraint messages_2026_02_21_pkey PRIMARY KEY (id, inserted_at);

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));

CREATE INDEX idx_supplies_active ON public.supplies USING btree (active);

CREATE INDEX idx_supplies_stock ON public.supplies USING btree (stock);

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");

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

CREATE INDEX messages_2026_02_17_inserted_at_topic_idx ON realtime.messages_2026_02_17 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));

CREATE INDEX messages_2026_02_18_inserted_at_topic_idx ON realtime.messages_2026_02_18 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));

CREATE INDEX messages_2026_02_19_inserted_at_topic_idx ON realtime.messages_2026_02_19 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));

CREATE INDEX messages_2026_02_20_inserted_at_topic_idx ON realtime.messages_2026_02_20 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));

CREATE INDEX messages_2026_02_21_inserted_at_topic_idx ON realtime.messages_2026_02_21 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));

create or replace view extensions.pg_stat_statements_info as  SELECT dealloc,
    stats_reset
   FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);;

create or replace view extensions.pg_stat_statements as  SELECT userid,
    dbid,
    toplevel,
    queryid,
    query,
    plans,
    total_plan_time,
    min_plan_time,
    max_plan_time,
    mean_plan_time,
    stddev_plan_time,
    calls,
    total_exec_time,
    min_exec_time,
    max_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read,
    shared_blks_dirtied,
    shared_blks_written,
    local_blks_hit,
    local_blks_read,
    local_blks_dirtied,
    local_blks_written,
    temp_blks_read,
    temp_blks_written,
    shared_blk_read_time,
    shared_blk_write_time,
    local_blk_read_time,
    local_blk_write_time,
    temp_blk_read_time,
    temp_blk_write_time,
    wal_records,
    wal_fpi,
    wal_bytes,
    jit_functions,
    jit_generation_time,
    jit_inlining_count,
    jit_inlining_time,
    jit_optimization_count,
    jit_optimization_time,
    jit_emission_count,
    jit_emission_time,
    jit_deform_count,
    jit_deform_time,
    stats_since,
    minmax_stats_since
   FROM pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since);;

create or replace view vault.decrypted_secrets as  SELECT id,
    name,
    description,
    secret,
    convert_from(vault._crypto_aead_det_decrypt(message => decode(secret, 'base64'::text), additional => convert_to(id::text, 'utf8'::name), key_id => 0::bigint, context => '\x7067736f6469756d'::bytea, nonce => nonce), 'utf8'::name) AS decrypted_secret,
    key_id,
    nonce,
    created_at,
    updated_at
   FROM vault.secrets s;;

CREATE OR REPLACE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$;
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$function$;
CREATE OR REPLACE FUNCTION public.add_inventory_entry(p_supply_id uuid, p_quantity integer, p_cost_unit numeric, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$;
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
AS $function$;
  select exists (
    select 1
    from public.app_users au
    join public.roles r on r.id = au.role_id
    where au.auth_user_id = auth.uid()
      and au.is_active = true
      and r.name = 'admin'
  );
$function$;
CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$;
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$;
begin
  new.updated_at = now();
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.get_product_cost(p_product_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$;
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
CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$;


CREATE OR REPLACE FUNCTION extensions.digest(text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$;


CREATE OR REPLACE FUNCTION extensions.digest(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$;


CREATE OR REPLACE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text)
 RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$;
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$function$;
CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$;
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;
CREATE OR REPLACE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text)
 RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$;
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$function$;
CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$;
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$;
CREATE OR REPLACE FUNCTION public.consume_inventory_for_remision(p_remision_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$;
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
CREATE OR REPLACE FUNCTION storage.protect_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$;
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$;
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$;
CREATE OR REPLACE FUNCTION extensions.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$;


CREATE OR REPLACE FUNCTION extensions.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$;


CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$;
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$;


CREATE OR REPLACE FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$;


CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(integer)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_random_bytes$function$;


CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/pgcrypto', $function$pg_random_uuid$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.hmac(text, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$;


CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$;


CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$function$;
CREATE OR REPLACE FUNCTION extensions.pgrst_drop_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$;
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$;


CREATE OR REPLACE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$;
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$;
CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$;
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$function$;
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_encrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_encrypt_by_id$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$;


CREATE OR REPLACE FUNCTION vault._crypto_aead_det_noncegen()
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_noncegen$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_key_id(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_key_id_w$function$;


CREATE OR REPLACE FUNCTION extensions.armor(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$;


CREATE OR REPLACE FUNCTION extensions.armor(bytea, text[], text[])
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$;


CREATE OR REPLACE FUNCTION extensions.dearmor(text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_dearmor$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text)
 RETURNS SETOF record
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_armor_headers$function$;


CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone)
 RETURNS record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_info$function$;


CREATE OR REPLACE FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone)
 RETURNS SETOF record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_1_11$function$;


CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$;
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$function$;
CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$;
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$;
CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL::text, new_description text DEFAULT ''::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$;
DECLARE
  rec record;
BEGIN
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    new_secret,
    new_name,
    new_description
  )
  RETURNING * INTO rec;
  UPDATE vault.secrets s
  SET secret = encode(vault._crypto_aead_det_encrypt(
    message := convert_to(rec.secret, 'utf8'),
    additional := convert_to(s.id::text, 'utf8'),
    key_id := 0,
    context := 'pgsodium'::bytea,
    nonce := rec.nonce
  ), 'base64')
  WHERE id = rec.id;
  RETURN rec.id;
END
$function$;
CREATE OR REPLACE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$;
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $function$;
CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL::text, new_name text DEFAULT NULL::text, new_description text DEFAULT NULL::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$;
DECLARE
  decrypted_secret text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = secret_id);
BEGIN
  UPDATE vault.secrets s
  SET
    secret = CASE WHEN new_secret IS NULL THEN s.secret
                  ELSE encode(vault._crypto_aead_det_encrypt(
                    message := convert_to(new_secret, 'utf8'),
                    additional := convert_to(s.id::text, 'utf8'),
                    key_id := 0,
                    context := 'pgsodium'::bytea,
                    nonce := s.nonce
                  ), 'base64') END,
    name = coalesce(new_name, s.name),
    description = coalesce(new_description, s.description),
    updated_at = now()
  WHERE s.id = secret_id;
END
$function$;
CREATE OR REPLACE FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_decrypt_by_id$function$;


CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_reset(userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0, minmax_only boolean DEFAULT false)
 RETURNS timestamp with time zone
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_reset_1_11$function$;


CREATE OR REPLACE FUNCTION extensions.crypt(text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_crypt$function$;


CREATE OR REPLACE FUNCTION extensions.gen_salt(text)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt$function$;


CREATE OR REPLACE FUNCTION extensions.gen_salt(text, integer)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$;


CREATE OR REPLACE FUNCTION extensions.encrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt$function$;


CREATE OR REPLACE FUNCTION extensions.decrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$;


CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$;


CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$;
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$function$;
CREATE OR REPLACE FUNCTION extensions.pgrst_ddl_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$;
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$;


CREATE OR REPLACE FUNCTION graphql.increment_schema_version()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$;
begin
    perform pg_catalog.nextval('graphql.seq_schema_version');
end;
$function$;
CREATE OR REPLACE FUNCTION graphql.get_schema_version()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
AS $function$;
    select last_value from graphql.seq_schema_version;
$function$;
CREATE OR REPLACE FUNCTION storage.filename(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$;
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$function$;
CREATE OR REPLACE FUNCTION storage.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$;
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$function$;
CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$;
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$function$;
CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$;
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$function$;
CREATE OR REPLACE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE sql
AS $function$;
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $function$;
CREATE OR REPLACE FUNCTION graphql.exception(message text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$;
begin
    raise exception using errcode='22000', message=message;
end;
$function$;
CREATE OR REPLACE FUNCTION graphql.comment_directive(comment_ text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
AS $function$;
    /*
    comment on column public.account.name is '@graphql.name: myField'
    */
    select
        coalesce(
            (
                regexp_match(
                    comment_,
                    '@graphql\((.+)\)'
                )
            )[1]::jsonb,
            jsonb_build_object()
        )
$function$;
CREATE OR REPLACE FUNCTION graphql._internal_resolve(query text, variables jsonb DEFAULT '{}'::jsonb, "operationName" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE c
AS '$libdir/pg_graphql', $function$resolve_wrapper$function$;


CREATE OR REPLACE FUNCTION graphql.resolve(query text, variables jsonb DEFAULT '{}'::jsonb, "operationName" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$;
declare
    res jsonb;
    message_text text;
begin
  begin
    select graphql._internal_resolve("query" := "query",
                                     "variables" := "variables",
                                     "operationName" := "operationName",
                                     "extensions" := "extensions") into res;
    return res;
  exception
    when others then
    get stacked diagnostics message_text = message_text;
    return
    jsonb_build_object('data', null,
                       'errors', jsonb_build_array(jsonb_build_object('message', message_text)));
  end;
end;
$function$;
CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)
 RETURNS TABLE(key text, id text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$;
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$function$;
CREATE OR REPLACE FUNCTION storage.operation()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$;
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$function$;
CREATE OR REPLACE FUNCTION storage.get_level(name text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$;
SELECT array_length(string_to_array("name", '/'), 1);
$function$;
CREATE OR REPLACE FUNCTION storage.get_prefix(name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$;
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$function$;
CREATE OR REPLACE FUNCTION storage.get_prefixes(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$;
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$function$;
CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$;
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$function$;
CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE(size bigint, bucket_id text)
 LANGUAGE plpgsql
 STABLE
AS $function$;
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$function$;
CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$;
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$;
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)
 RETURNS TABLE(username text, password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$;
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $function$;
CREATE OR REPLACE FUNCTION realtime."cast"(val text, type_ regtype)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$;
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $function$;
CREATE OR REPLACE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024))
 RETURNS SETOF realtime.wal_rls
 LANGUAGE plpgsql
AS $function$;
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$function$;
CREATE OR REPLACE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$;
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$function$;
CREATE OR REPLACE FUNCTION realtime.to_regrole(role_name text)
 RETURNS regrole
 LANGUAGE sql
 IMMUTABLE
AS $function$ select role_name::regrole $function$;


CREATE OR REPLACE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[])
 RETURNS text
 LANGUAGE sql
AS $function$;
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $function$;
CREATE OR REPLACE FUNCTION realtime.quote_wal2json(entity regclass)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$;
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $function$;
CREATE OR REPLACE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer)
 RETURNS SETOF realtime.wal_rls
 LANGUAGE sql
 SET log_min_messages TO 'fatal'
AS $function$;
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $function$;
CREATE OR REPLACE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$;
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $function$;
CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$;
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $function$;
CREATE OR REPLACE FUNCTION realtime.topic()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$;
select nullif(current_setting('realtime.topic', true), '')::text;
$function$;
CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
AS $function$;
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$function$;
create trigger tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();

create trigger update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

create trigger enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

create trigger protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

create trigger protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

create trigger trg_cotizaciones_updated_at BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();

