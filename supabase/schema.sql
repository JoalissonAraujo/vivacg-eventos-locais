-- Modelo preparado para PostgreSQL/Supabase.
-- Execute no SQL Editor somente quando decidir conectar um backend real.

create extension if not exists "pgcrypto";

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null unique,
  slug varchar(60) not null unique,
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  address varchar(220) not null,
  city varchar(80) not null default 'Campina Grande',
  state char(2) not null default 'PB',
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  venue_id uuid not null references public.venues(id),
  title varchar(120) not null,
  summary varchar(180) not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price numeric(10, 2) not null default 0 check (price >= 0),
  capacity integer not null check (capacity > 0),
  image_url text,
  status varchar(20) not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint valid_event_period check (ends_at is null or ends_at > starts_at)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  attendee_name varchar(80) not null check (char_length(trim(attendee_name)) >= 3),
  attendee_email varchar(120) not null,
  quantity smallint not null default 1 check (quantity between 1 and 4),
  status varchar(20) not null default 'confirmed' check (status in ('confirmed', 'waitlist', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint one_reservation_per_email unique (event_id, attendee_email)
);

create table public.reservation_guests (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  guest_name varchar(80),
  created_at timestamptz not null default now(),
  constraint valid_optional_guest_name check (guest_name is null or char_length(trim(guest_name)) between 1 and 80)
);

create index events_starts_at_idx on public.events (starts_at);
create index events_category_id_idx on public.events (category_id);
create index reservations_event_id_idx on public.reservations (event_id);
create index reservation_guests_reservation_id_idx on public.reservation_guests (reservation_id);

alter table public.categories enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_guests enable row level security;

create policy "Public can read categories"
  on public.categories for select to anon using (true);

create policy "Public can read venues"
  on public.venues for select to anon using (true);

create policy "Public can read published events"
  on public.events for select to anon using (status = 'published');

-- Reservas devem ser criadas por uma Edge Function/API, não diretamente pelo navegador.
-- Dessa forma, e-mails não recebem política pública de leitura e não ficam expostos.
