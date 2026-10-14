-- =============================================================================
-- GridPlay — Turnos fijos (un turno o un bloqueo que se repite todas las semanas)
-- =============================================================================
-- Cómo funciona:
--  * public.turnos_fijos guarda la regla: cancha, día de la semana, hora, cliente, desde/hasta y precio.
--  * Cada semana se materializa como una fila común en public.turnos (con turno_fijo_id), hasta 63 días
--    adelante: más que los 60 que puede reservar un jugador, así nadie le gana el horario al turno fijo.
--    Disponibilidad, reportes, ingresos y recordatorios siguen funcionando sin cambios.
--  * generado_hasta marca la última fecha ya generada y nunca se regenera hacia atrás: si el dueño
--    cancela "solo este día", ese día no vuelve a aparecer.
--  * Si una semana el horario ya está ocupado, se saltea y se informa.
--  * Las semanas nuevas las agregan public.extender_turnos_fijos() (backend, cada hora) y
--    public.extender_mis_turnos_fijos() (el panel, al abrirse).
--  * El precio queda en la regla: si el dueño cambia el precio de la cancha, elige si pasar los turnos
--    fijos al precio nuevo con public.actualizar_precio_turnos_fijos().
--  * Un club sin suscripción vigente no genera semanas nuevas (igual que los turnos manuales).
-- Escritura solo por RPC (security definer). Idempotente: se puede volver a correr.
-- =============================================================================
begin;

create table if not exists public.turnos_fijos (
  id               bigint generated always as identity primary key,
  cancha_id        uuid not null references public.canchas (id) on delete cascade,
  dia_semana       smallint not null check (dia_semana between 0 and 6),  -- 0 = domingo (como extract(dow))
  hora_inicio      text not null check (hora_inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  nombre_cliente   text not null check (char_length(nombre_cliente) between 2 and 100),
  telefono_cliente text not null,
  es_bloqueo       boolean not null default false,
  precio           numeric check (precio >= 0),
  desde            date not null,
  hasta            date,
  generado_hasta   date,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  check (hasta is null or hasta >= desde)
);
create index if not exists turnos_fijos_cancha_idx on public.turnos_fijos (cancha_id) where activo;

alter table public.turnos add column if not exists turno_fijo_id bigint references public.turnos_fijos (id) on delete set null;
create index if not exists turnos_turno_fijo_idx on public.turnos (turno_fijo_id) where turno_fijo_id is not null;

alter table public.turnos_fijos enable row level security;
revoke all on public.turnos_fijos from anon, authenticated;
grant select on public.turnos_fijos to authenticated;

drop policy if exists turnos_fijos_select on public.turnos_fijos;
create policy turnos_fijos_select on public.turnos_fijos
  for select to authenticated
  using (private.es_admin_de_cancha(cancha_id));

-- -----------------------------------------------------------------------------
-- Genera las semanas que faltan de un turno fijo, hasta 63 días adelante.
-- Devuelve {"creados": n, "ocupadas": [fechas salteadas]}.
-- -----------------------------------------------------------------------------
create or replace function private.generar_turnos_fijos(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz       constant text := 'America/Argentina/Cordoba';
  v_ahora    timestamp := now() at time zone v_tz;
  v_hoy      date := (now() at time zone v_tz)::date;
  v_tope     date := v_hoy + 63;
  v_fijo     public.turnos_fijos%rowtype;
  v_club     uuid;
  v_fecha    date;
  v_fin      date;
  v_creados  int := 0;
  v_ocupadas jsonb := '[]'::jsonb;
begin
  select * into v_fijo from public.turnos_fijos where id = p_id for update;
  if not found or not v_fijo.activo then
    return jsonb_build_object('creados', 0, 'ocupadas', v_ocupadas);
  end if;

  select club_id into v_club from public.canchas where id = v_fijo.cancha_id;
  if v_club is null or not private.club_recibe_reservas(v_club) then
    return jsonb_build_object('creados', 0, 'ocupadas', v_ocupadas, 'sin_suscripcion', true);
  end if;

  v_fin := least(v_tope, coalesce(v_fijo.hasta, v_tope));
  v_fecha := greatest(v_fijo.desde, v_hoy, coalesce(v_fijo.generado_hasta + 1, v_fijo.desde));
  v_fecha := v_fecha + ((v_fijo.dia_semana - extract(dow from v_fecha)::int + 7) % 7);

  while v_fecha <= v_fin loop
    if (v_fecha + v_fijo.hora_inicio::time) > v_ahora then
      begin
        insert into public.turnos (cancha_id, fecha, hora_inicio, nombre_cliente, telefono_cliente, precio_final, turno_fijo_id)
        values (v_fijo.cancha_id, v_fecha, v_fijo.hora_inicio, v_fijo.nombre_cliente,
                case when v_fijo.es_bloqueo then 'BLOQUEO' else v_fijo.telefono_cliente end,
                case when v_fijo.es_bloqueo then null else v_fijo.precio end,
                v_fijo.id);
        v_creados := v_creados + 1;
      exception when unique_violation then
        v_ocupadas := v_ocupadas || to_jsonb(v_fecha);
      end;
    end if;
    v_fecha := v_fecha + 7;
  end loop;

  update public.turnos_fijos
     set generado_hasta = greatest(coalesce(generado_hasta, v_fin), v_fin)
   where id = p_id;

  return jsonb_build_object('creados', v_creados, 'ocupadas', v_ocupadas);
end;
$$;
revoke all on function private.generar_turnos_fijos(bigint) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Alta de un turno fijo desde el panel. Para un bloqueo, p_nombre es el motivo (opcional).
-- -----------------------------------------------------------------------------
create or replace function public.crear_turno_fijo(
  p_cancha_id uuid,
  p_desde     date,
  p_hora      text,
  p_nombre    text,
  p_telefono  text,
  p_hasta     date default null,
  p_bloqueo   boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hoy    date := (now() at time zone 'America/Argentina/Cordoba')::date;
  v_cancha public.canchas%rowtype;
  v_nombre text;
  v_tel    text;
  v_id     bigint;
begin
  if (select auth.uid()) is null then raise exception 'SESION_REQUERIDA'; end if;
  if not private.es_admin_de_cancha(p_cancha_id) then raise exception 'NO_PERMITIDO'; end if;
  if p_hora is null or p_hora !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'HORA_INVALIDA'; end if;
  if p_desde is null or p_desde < v_hoy or (p_hasta is not null and p_hasta < p_desde) then raise exception 'FECHA_INVALIDA'; end if;

  if coalesce(p_bloqueo, false) then
    v_nombre := 'Bloqueo por: ' || coalesce(nullif(left(trim(coalesce(p_nombre, '')), 80), ''), 'Mantenimiento');
    v_tel := 'BLOQUEO';
  else
    v_nombre := left(trim(coalesce(p_nombre, '')), 80);
    v_tel := trim(coalesce(p_telefono, ''));
    if char_length(v_nombre) < 2 then raise exception 'NOMBRE_INVALIDO'; end if;
    if v_tel !~ '^[0-9+()\s-]{6,20}$' then raise exception 'TELEFONO_INVALIDO'; end if;
  end if;

  select * into v_cancha from public.canchas where id = p_cancha_id;
  if not private.club_recibe_reservas(v_cancha.club_id) then raise exception 'CLUB_SIN_SUSCRIPCION'; end if;

  insert into public.turnos_fijos (cancha_id, dia_semana, hora_inicio, nombre_cliente, telefono_cliente, es_bloqueo, precio, desde, hasta)
  values (p_cancha_id, extract(dow from p_desde)::smallint, p_hora, v_nombre, v_tel, coalesce(p_bloqueo, false),
          case when coalesce(p_bloqueo, false) then null else v_cancha.precio_hora end, p_desde, p_hasta)
  returning id into v_id;

  return private.generar_turnos_fijos(v_id) || jsonb_build_object('id', v_id);
end;
$$;
revoke all on function public.crear_turno_fijo(uuid, date, text, text, text, date, boolean) from public, anon;
grant execute on function public.crear_turno_fijo(uuid, date, text, text, text, date, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Termina un turno fijo: no genera más semanas y borra los turnos que todavía no se jugaron.
-- Devuelve cuántos turnos borró.
-- -----------------------------------------------------------------------------
create or replace function public.terminar_turno_fijo(p_id bigint)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz     constant text := 'America/Argentina/Cordoba';
  v_ahora  timestamp := now() at time zone v_tz;
  v_cancha uuid;
  v_n      int;
begin
  select cancha_id into v_cancha from public.turnos_fijos where id = p_id;
  if v_cancha is null or not private.es_admin_de_cancha(v_cancha) then raise exception 'NO_PERMITIDO'; end if;

  update public.turnos_fijos
     set activo = false, hasta = greatest(desde, least(coalesce(hasta, v_ahora::date), v_ahora::date))
   where id = p_id;

  delete from public.turnos
   where turno_fijo_id = p_id
     and (fecha + hora_inicio::time) > v_ahora;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.terminar_turno_fijo(bigint) from public, anon;
grant execute on function public.terminar_turno_fijo(bigint) to authenticated;

-- -----------------------------------------------------------------------------
-- Extensión semanal: el panel la pide al abrirse (solo los turnos fijos del propio club) y el
-- backend la corre cada hora para todos. Devuelven cuántos turnos crearon.
-- -----------------------------------------------------------------------------
create or replace function private.extender_turnos_fijos(p_solo_propios boolean)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tope date := (now() at time zone 'America/Argentina/Cordoba')::date + 63;
  v_id   bigint;
  v_n    int := 0;
begin
  for v_id in
    select f.id from public.turnos_fijos f
     where f.activo
       and (f.generado_hasta is null or f.generado_hasta < least(v_tope, coalesce(f.hasta, v_tope)))
       and (not p_solo_propios or private.es_admin_de_cancha(f.cancha_id))
  loop
    v_n := v_n + coalesce((private.generar_turnos_fijos(v_id) ->> 'creados')::int, 0);
  end loop;
  return v_n;
end;
$$;
revoke all on function private.extender_turnos_fijos(boolean) from public, anon, authenticated;

create or replace function public.extender_mis_turnos_fijos()
returns int
language sql
security definer
set search_path = ''
as $$
  select case when (select auth.uid()) is null then 0 else private.extender_turnos_fijos(true) end;
$$;
revoke all on function public.extender_mis_turnos_fijos() from public, anon;
grant execute on function public.extender_mis_turnos_fijos() to authenticated;

create or replace function public.extender_turnos_fijos()
returns int
language sql
security definer
set search_path = ''
as $$
  select private.extender_turnos_fijos(false);
$$;
revoke all on function public.extender_turnos_fijos() from public, anon, authenticated;
grant execute on function public.extender_turnos_fijos() to service_role;

-- -----------------------------------------------------------------------------
-- El dueño cambió el precio de la cancha y eligió pasar sus turnos fijos al precio nuevo:
-- cambia el precio de las reglas y el de los turnos fijos que todavía no se jugaron.
-- Devuelve cuántos turnos actualizó.
-- -----------------------------------------------------------------------------
create or replace function public.actualizar_precio_turnos_fijos(p_cancha_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ahora  timestamp := now() at time zone 'America/Argentina/Cordoba';
  v_precio numeric;
  v_n      int;
begin
  if not private.es_admin_de_cancha(p_cancha_id) then raise exception 'NO_PERMITIDO'; end if;
  select precio_hora into v_precio from public.canchas where id = p_cancha_id;

  update public.turnos_fijos
     set precio = v_precio
   where cancha_id = p_cancha_id and activo and not es_bloqueo;

  update public.turnos t
     set precio_final = v_precio
    from public.turnos_fijos f
   where f.id = t.turno_fijo_id
     and f.cancha_id = p_cancha_id
     and f.activo and not f.es_bloqueo
     and (t.fecha + t.hora_inicio::time) > v_ahora;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.actualizar_precio_turnos_fijos(uuid) from public, anon;
grant execute on function public.actualizar_precio_turnos_fijos(uuid) to authenticated;

commit;
