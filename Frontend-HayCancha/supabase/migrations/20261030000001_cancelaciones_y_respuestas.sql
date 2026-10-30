-- =============================================================================
-- GridPlay — Avisos de cancelación y respuestas del dueño a las reseñas
-- =============================================================================
-- 1. public.turnos_cancelados: cada turno FUTURO que se borra queda registrado, para que el backend
--    avise por mail (jugador canceló → al club; club canceló → al jugador). Lo llena un trigger, así
--    no importa desde dónde se cancele (Mis reservas, el panel, terminar un turno fijo).
--    No se registran: bloqueos, turnos que ya empezaron (borrar historial) ni turnos que el club
--    cargó a mano y canceló él mismo (no hay a quién avisar).
--    Solo la lee el backend (service_role); nadie más la ve.
-- 2. public.resenas.respuesta: el dueño responde una reseña de su club (public.responder_resena).
--    La respuesta se publica debajo de la reseña. resenas_club y resenas_de_mi_club la devuelven.
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

-- -----------------------------------------------------------------------------
-- 1. Registro de cancelaciones
-- -----------------------------------------------------------------------------
create table if not exists public.turnos_cancelados (
  id               bigint generated always as identity primary key,
  turno_id         bigint not null,
  cancha_id        uuid not null,
  fecha            date not null,
  hora_inicio      text not null,
  nombre_cliente   text,
  telefono_cliente text,
  usuario_id       uuid,   -- jugador dueño del turno (null si lo cargó el club a mano)
  cancelado_por    text not null check (cancelado_por in ('jugador', 'club')),
  created_at       timestamptz not null default now()
);
create index if not exists turnos_cancelados_fecha_idx on public.turnos_cancelados (created_at);

alter table public.turnos_cancelados enable row level security;
revoke all on public.turnos_cancelados from anon, authenticated;

create or replace function private.registrar_cancelacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_por text;
begin
  if old.telefono_cliente = 'BLOQUEO' or v_uid is null then return old; end if;
  if (old.fecha + old.hora_inicio::time) <= (now() at time zone 'America/Argentina/Cordoba') then return old; end if;

  if old.usuario_id is not null and old.usuario_id = v_uid then
    v_por := 'jugador';
  elsif old.usuario_id is not null and private.es_admin_de_cancha(old.cancha_id) then
    v_por := 'club';
  else
    return old;
  end if;

  insert into public.turnos_cancelados (turno_id, cancha_id, fecha, hora_inicio, nombre_cliente, telefono_cliente, usuario_id, cancelado_por)
  values (old.id, old.cancha_id, old.fecha, old.hora_inicio, old.nombre_cliente, old.telefono_cliente, old.usuario_id, v_por);
  return old;
end;
$$;
revoke all on function private.registrar_cancelacion() from public, anon, authenticated;

drop trigger if exists turnos_registrar_cancelacion on public.turnos;
create trigger turnos_registrar_cancelacion
  after delete on public.turnos
  for each row execute function private.registrar_cancelacion();

-- -----------------------------------------------------------------------------
-- 2. Respuestas del dueño a las reseñas
-- -----------------------------------------------------------------------------
alter table public.resenas add column if not exists respuesta text;
alter table public.resenas add column if not exists respondida_en timestamptz;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resenas_respuesta_largo') then
    alter table public.resenas add constraint resenas_respuesta_largo
      check (respuesta is null or char_length(respuesta) between 1 and 500);
  end if;
end $$;

/** Responde (o con texto vacío, borra la respuesta de) una reseña del club del dueño. */
create or replace function public.responder_resena(p_resena_id bigint, p_respuesta text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_texto text := nullif(btrim(coalesce(p_respuesta, '')), '');
  v_fecha timestamptz := case when v_texto is null then null else now() end;
begin
  if (select auth.uid()) is null then raise exception 'SESION_REQUERIDA'; end if;
  if char_length(coalesce(v_texto, '')) > 500 then raise exception 'RESPUESTA_LARGA'; end if;

  update public.resenas r
     set respuesta = v_texto, respondida_en = v_fecha
   where r.id = p_resena_id
     and private.es_admin_de_club(r.club_id);
  if not found then raise exception 'RESENA_NO_ENCONTRADA'; end if;

  return v_fecha;
end;
$$;
revoke all on function public.responder_resena(bigint, text) from public, anon;
grant execute on function public.responder_resena(bigint, text) to authenticated;

-- Las lecturas suman la respuesta (cambia el tipo de retorno: hay que borrarlas y crearlas de nuevo)
drop function if exists public.resenas_club(uuid, int, int);
create function public.resenas_club(p_club_id uuid, p_limite int default 20, p_desde int default 0)
returns table (id bigint, estrellas int, comentario text, created_at timestamptz, autor text, es_mia boolean,
               respuesta text, respondida_en timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         r.estrellas::int,
         case when r.oculta then null else r.comentario end,
         r.created_at,
         coalesce(nullif(split_part(btrim(u.nombre_completo), ' ', 1), ''), 'Jugador')
           || case when split_part(btrim(u.nombre_completo), ' ', 2) <> ''
                   then ' ' || upper(left(split_part(btrim(u.nombre_completo), ' ', 2), 1)) || '.'
                   else '' end,
         coalesce(r.usuario_id = (select auth.uid()), false),
         r.respuesta,
         r.respondida_en
    from public.resenas r
    left join public.usuarios u on u.id = r.usuario_id
   where r.club_id = p_club_id
   order by r.created_at desc
   limit least(greatest(coalesce(p_limite, 20), 1), 50)
  offset greatest(coalesce(p_desde, 0), 0);
$$;
revoke all on function public.resenas_club(uuid, int, int) from public;
grant execute on function public.resenas_club(uuid, int, int) to anon, authenticated;

drop function if exists public.resenas_de_mi_club();
create function public.resenas_de_mi_club()
returns table (id bigint, estrellas int, comentario text, oculta boolean, created_at timestamptz, autor text,
               respuesta text, respondida_en timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         r.estrellas::int,
         r.comentario,
         r.oculta,
         r.created_at,
         coalesce(nullif(split_part(btrim(u.nombre_completo), ' ', 1), ''), 'Jugador')
           || case when split_part(btrim(u.nombre_completo), ' ', 2) <> ''
                   then ' ' || upper(left(split_part(btrim(u.nombre_completo), ' ', 2), 1)) || '.'
                   else '' end,
         r.respuesta,
         r.respondida_en
    from public.resenas r
    join public.clubes c on c.id = r.club_id
    left join public.usuarios u on u.id = r.usuario_id
   where c.admin_id = (select auth.uid())
   order by r.created_at desc
   limit 500;
$$;
revoke all on function public.resenas_de_mi_club() from public, anon;
grant execute on function public.resenas_de_mi_club() to authenticated;

commit;
