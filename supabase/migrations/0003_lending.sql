-- Lending / borrowing tracking
create table if not exists lending (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('lend', 'settle')),
  date date not null default current_date,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_lending_person on lending (person_name);
create index if not exists idx_lending_date on lending (date);

alter table lending enable row level security;

create policy "authenticated all lending" on lending
  for all using (auth.role() = 'authenticated');