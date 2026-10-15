-- =========================================================
-- Jadwal Puasa 16:8 — skema database Supabase
-- Jalankan sekali di Supabase Dashboard → SQL Editor.
-- =========================================================

-- Pengaturan per pengguna
create table if not exists public.settings (
  user_id       uuid primary key references auth.users on delete cascade default auth.uid(),
  program_start date not null default current_date,   -- untuk menghitung tahap adaptasi
  kamis_flex    boolean not null default false,       -- jendela makan Kamis 10.00–18.00
  notifications boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- Satu baris per "minggu" checklist. Minggu aktif = ended_at is null.
create table if not exists public.weeks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade default auth.uid(),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  done_count  int,
  total_count int not null default 42,                -- 7 hari × 6 item
  percentage  numeric(5,2)
);
create unique index if not exists weeks_one_active on public.weeks (user_id) where ended_at is null;
create index if not exists weeks_user_started on public.weeks (user_id, started_at desc);

-- Centangan checklist, kunci: <kodeHari>-<idItem>
create table if not exists public.checklist (
  week_id    uuid not null references public.weeks on delete cascade,
  user_id    uuid not null references auth.users on delete cascade default auth.uid(),
  item_key   text not null check (item_key ~ '^(sen|sel|rab|kam|jum|sab|min)-(pagi|m1|cm|m2|tutup|air)$'),
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (week_id, item_key)
);

-- Penghitung gelas air per hari dalam satu minggu
create table if not exists public.water (
  week_id    uuid not null references public.weeks on delete cascade,
  user_id    uuid not null references auth.users on delete cascade default auth.uid(),
  day_code   text not null check (day_code in ('sen','sel','rab','kam','jum','sab','min')),
  glasses    int not null default 0 check (glasses between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (week_id, day_code)
);

-- ---------------------------------------------------------
-- Row Level Security: setiap pengguna hanya melihat datanya sendiri
-- ---------------------------------------------------------
alter table public.settings  enable row level security;
alter table public.weeks     enable row level security;
alter table public.checklist enable row level security;
alter table public.water     enable row level security;

drop policy if exists "own settings"  on public.settings;
drop policy if exists "own weeks"     on public.weeks;
drop policy if exists "own checklist" on public.checklist;
drop policy if exists "own water"     on public.water;

create policy "own settings"  on public.settings  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own weeks"     on public.weeks     for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own checklist" on public.checklist for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
    and exists (select 1 from public.weeks w where w.id = week_id and w.user_id = auth.uid()));
create policy "own water"     on public.water     for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
    and exists (select 1 from public.weeks w where w.id = week_id and w.user_id = auth.uid()));

-- ---------------------------------------------------------
-- RPC
-- ---------------------------------------------------------

-- Ambil (atau buat) minggu aktif + baris settings untuk pengguna saat ini
create or replace function public.active_week()
returns public.weeks
language plpgsql
security invoker
set search_path = public
as $$
declare
  w public.weeks;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.settings (user_id) values (auth.uid())
  on conflict (user_id) do nothing;

  insert into public.weeks (user_id) values (auth.uid())
  on conflict (user_id) where ended_at is null do nothing;

  select * into w from public.weeks
  where user_id = auth.uid() and ended_at is null;

  return w;
end;
$$;

-- Tutup minggu aktif (simpan persentase ke riwayat) lalu buka minggu baru
create or replace function public.start_new_week()
returns public.weeks
language plpgsql
security invoker
set search_path = public
as $$
declare
  w   public.weeks;
  cnt int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select count(*) into cnt
  from public.checklist c
  join public.weeks wk on wk.id = c.week_id
  where wk.user_id = auth.uid() and wk.ended_at is null and c.done;

  update public.weeks
  set ended_at   = now(),
      done_count = cnt,
      percentage = round(cnt * 100.0 / total_count, 2)
  where user_id = auth.uid() and ended_at is null;

  insert into public.weeks (user_id) values (auth.uid()) returning * into w;
  return w;
end;
$$;

revoke execute on function public.active_week()    from anon;
revoke execute on function public.start_new_week() from anon;
grant  execute on function public.active_week()    to authenticated;
grant  execute on function public.start_new_week() to authenticated;
