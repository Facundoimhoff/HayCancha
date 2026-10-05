-- =============================================================================
-- GridPlay — Favoritos del jugador
-- =============================================================================
--  * public.favoritos: clubes que un jugador marcó para encontrarlos rápido después.
--    Tabla simple de dueño (sin lógica de negocio): el jugador inserta, lee y borra
--    únicamente sus propias filas. No hace falta RPC.
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

create table if not exists public.favoritos (
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  club_id     uuid not null references public.clubes (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (usuario_id, club_id)
);

create index if not exists favoritos_usuario_idx on public.favoritos (usuario_id, created_at desc);

alter table public.favoritos enable row level security;

revoke all on public.favoritos from anon, authenticated;
grant select, insert, delete on public.favoritos to authenticated;

drop policy if exists favoritos_select_propios on public.favoritos;
create policy favoritos_select_propios on public.favoritos
  for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists favoritos_insert_propios on public.favoritos;
create policy favoritos_insert_propios on public.favoritos
  for insert to authenticated
  with check (usuario_id = (select auth.uid()));

drop policy if exists favoritos_delete_propios on public.favoritos;
create policy favoritos_delete_propios on public.favoritos
  for delete to authenticated
  using (usuario_id = (select auth.uid()));

commit;
