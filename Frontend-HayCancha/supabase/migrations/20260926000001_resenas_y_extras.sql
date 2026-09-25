-- =============================================================================
-- GridPlay — Reseñas de clubes y edición de extras de una reserva
-- =============================================================================
--  * public.resenas: una reseña (1-5 estrellas + comentario) por jugador y club, editable.
--    Solo puede calificar quien ya jugó un turno en ese club. La tabla NO se lee directo desde
--    el público: se lee con RPC (nombre abreviado del autor, sin exponer ids ni datos personales).
--  * public.actualizar_extras: el jugador agrega/cambia/quita extras (bebidas, alquileres) de una
--    reserva futura suya. Precios y nombres salen de la base, nunca del cliente.
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

-- -----------------------------------------------------------------------------
-- 1. Tabla de reseñas
-- -----------------------------------------------------------------------------
create table if not exists public.resenas (
  id          bigint generated always as identity primary key,
  club_id     uuid not null references public.clubes (id) on delete cascade,
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  estrellas   smallint not null check (estrellas between 1 and 5),
  comentario  text check (comentario is null or char_length(comentario) <= 600),
  oculta      boolean not null default false,   -- moderación: solo la cambia el dueño del proyecto
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint resenas_una_por_jugador unique (club_id, usuario_id)
);

create index if not exists resenas_club_idx on public.resenas (club_id, created_at desc) where not oculta;

alter table public.resenas enable row level security;

-- El jugador ve y borra la suya. Alta/edición: solo por public.calificar_club(). Lectura pública: por RPC.
revoke all on public.resenas from anon, authenticated;
grant select, delete on public.resenas to authenticated;

drop policy if exists resenas_select_propia on public.resenas;
create policy resenas_select_propia on public.resenas
  for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists resenas_delete_propia on public.resenas;
create policy resenas_delete_propia on public.resenas
  for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 2. RPC: calificar un club (crea o actualiza la reseña propia)
-- -----------------------------------------------------------------------------
create or replace function public.calificar_club(p_club_id uuid, p_estrellas int, p_comentario text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_ahora timestamp := now() at time zone 'America/Argentina/Cordoba';
begin
  if v_uid is null then raise exception 'SESION_REQUERIDA'; end if;
  if p_estrellas is null or p_estrellas not between 1 and 5 then raise exception 'ESTRELLAS_INVALIDAS'; end if;
  if not exists (select 1 from public.clubes where id = p_club_id) then raise exception 'CLUB_NO_ENCONTRADO'; end if;
  if private.es_admin_de_club(p_club_id) then raise exception 'NO_PERMITIDO'; end if;

  p_comentario := nullif(left(btrim(coalesce(p_comentario, '')), 600), '');

  -- Solo reseña quien ya jugó (turno propio, ya pasado, en una cancha de ese club)
  if not exists (
    select 1
      from public.turnos t
      join public.canchas c on c.id = t.cancha_id
     where c.club_id = p_club_id
       and t.usuario_id = v_uid
       and t.telefono_cliente is distinct from 'BLOQUEO'
       and (t.fecha + t.hora_inicio::time) < v_ahora
  ) then
    raise exception 'SIN_TURNO_JUGADO';
  end if;

  insert into public.resenas (club_id, usuario_id, estrellas, comentario)
  values (p_club_id, v_uid, p_estrellas, p_comentario)
  on conflict (club_id, usuario_id) do update
    set estrellas = excluded.estrellas,
        comentario = excluded.comentario,
        updated_at = now();
end;
$$;
revoke all on function public.calificar_club(uuid, int, text) from public, anon;
grant execute on function public.calificar_club(uuid, int, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC de lectura pública
-- -----------------------------------------------------------------------------
-- Promedio y cantidad para varios clubes a la vez (listas de clubes)
create or replace function public.resumen_resenas(p_club_ids uuid[])
returns table (club_id uuid, promedio numeric, cantidad int)
language sql
stable
security definer
set search_path = ''
as $$
  select r.club_id, round(avg(r.estrellas)::numeric, 1), count(*)::int
    from public.resenas r
   where r.club_id = any (p_club_ids[1:200])
     and not r.oculta
   group by r.club_id;
$$;
revoke all on function public.resumen_resenas(uuid[]) from public;
grant execute on function public.resumen_resenas(uuid[]) to anon, authenticated;

-- Cuántas reseñas hay de cada puntaje (barras de la ficha del club)
create or replace function public.distribucion_resenas(p_club_id uuid)
returns table (estrellas int, cantidad int)
language sql
stable
security definer
set search_path = ''
as $$
  select r.estrellas::int, count(*)::int
    from public.resenas r
   where r.club_id = p_club_id and not r.oculta
   group by r.estrellas;
$$;
revoke all on function public.distribucion_resenas(uuid) from public;
grant execute on function public.distribucion_resenas(uuid) to anon, authenticated;

-- Reseñas de un club, paginadas, con el autor abreviado ("Lucas P.")
create or replace function public.resenas_club(p_club_id uuid, p_limite int default 20, p_desde int default 0)
returns table (id bigint, estrellas int, comentario text, created_at timestamptz, autor text, es_mia boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         r.estrellas::int,
         r.comentario,
         r.created_at,
         coalesce(nullif(split_part(btrim(u.nombre_completo), ' ', 1), ''), 'Jugador')
           || case when split_part(btrim(u.nombre_completo), ' ', 2) <> ''
                   then ' ' || upper(left(split_part(btrim(u.nombre_completo), ' ', 2), 1)) || '.'
                   else '' end,
         coalesce(r.usuario_id = (select auth.uid()), false)
    from public.resenas r
    left join public.usuarios u on u.id = r.usuario_id
   where r.club_id = p_club_id and not r.oculta
   order by r.created_at desc
   limit least(greatest(coalesce(p_limite, 20), 1), 50)
  offset greatest(coalesce(p_desde, 0), 0);
$$;
revoke all on function public.resenas_club(uuid, int, int) from public;
grant execute on function public.resenas_club(uuid, int, int) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: actualizar los extras de una reserva futura propia (agrega, cambia o quita)
-- -----------------------------------------------------------------------------
-- p_extras = [{id, cantidad}, ...] es la lista COMPLETA deseada; cantidad 0 (o ausente) quita el extra.
create or replace function public.actualizar_extras(p_turno_id bigint, p_extras jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_ahora  timestamp := now() at time zone 'America/Argentina/Cordoba';
  v_turno  public.turnos%rowtype;
  v_club   uuid;
  v_extras jsonb := '[]'::jsonb;
  v_item   jsonb;
  v_actual jsonb;
  v_prod   public.productos%rowtype;
  v_pid    bigint;
  v_cant   int;
  v_vistos bigint[] := '{}';
begin
  if v_uid is null then raise exception 'SESION_REQUERIDA'; end if;

  select * into v_turno from public.turnos where id = p_turno_id and usuario_id = v_uid for update;
  if not found then raise exception 'TURNO_NO_ENCONTRADO'; end if;
  if (v_turno.fecha + v_turno.hora_inicio::time) <= v_ahora then raise exception 'TURNO_PASADO'; end if;

  select club_id into v_club from public.canchas where id = v_turno.cancha_id;

  if p_extras is null or jsonb_typeof(p_extras) <> 'array' or jsonb_array_length(p_extras) > 15 then
    raise exception 'EXTRAS_INVALIDOS';
  end if;

  for v_item in select * from jsonb_array_elements(p_extras) loop
    if coalesce(v_item ->> 'id', '') !~ '^[0-9]{1,18}$' or coalesce(v_item ->> 'cantidad', '') !~ '^[0-9]{1,2}$' then
      raise exception 'EXTRAS_INVALIDOS';
    end if;
    v_pid := (v_item ->> 'id')::bigint;
    v_cant := (v_item ->> 'cantidad')::int;
    if v_pid = any (v_vistos) then raise exception 'EXTRAS_INVALIDOS'; end if;   -- ids repetidos
    v_vistos := v_vistos || v_pid;
    continue when v_cant = 0;

    select * into v_prod
      from public.productos
     where id = v_pid and club_id = v_club and activo is not false;

    if found then
      v_extras := v_extras || jsonb_build_object(
        'id', v_prod.id, 'nombre', v_prod.nombre, 'precio_unitario', v_prod.precio,
        'cantidad', v_cant, 'subtotal', v_prod.precio * v_cant);
    else
      -- Producto dado de baja después de pedirlo: se conserva la línea existente, sin aumentar la cantidad
      select e into v_actual
        from jsonb_array_elements(coalesce(v_turno.extras, '[]'::jsonb)) e
       where e ->> 'id' = v_pid::text;
      if v_actual is null or v_cant > (v_actual ->> 'cantidad')::int then raise exception 'EXTRAS_INVALIDOS'; end if;
      v_extras := v_extras || jsonb_build_object(
        'id', v_pid, 'nombre', v_actual ->> 'nombre', 'precio_unitario', (v_actual ->> 'precio_unitario')::numeric,
        'cantidad', v_cant, 'subtotal', (v_actual ->> 'precio_unitario')::numeric * v_cant);
    end if;
  end loop;

  update public.turnos
     set extras = case when jsonb_array_length(v_extras) > 0 then v_extras else null end
   where id = p_turno_id;

  return v_extras;
end;
$$;
revoke all on function public.actualizar_extras(bigint, jsonb) from public, anon;
grant execute on function public.actualizar_extras(bigint, jsonb) to authenticated;

commit;
