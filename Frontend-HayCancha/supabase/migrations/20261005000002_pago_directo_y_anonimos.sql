-- =============================================================================
-- GridPlay — Pago directo (cuenta anónima) y blindaje contra sesiones anónimas
-- =============================================================================
-- Habilitar "Anonymous Sign-Ins" en Supabase hace que cualquier visitante pueda
-- conseguir un JWT con role=authenticated sin mail ni fricción. Eso es justo lo que
-- necesitamos para el botón "Pagar" (manda a Mercado Pago sin pedir nada antes; la
-- cuenta se "reclama" con mail/contraseña recién al volver, junto con los datos del
-- club), pero abre una puerta: cualquier RPC que solo pida "estar autenticado" ahora
-- también la puede llamar una cuenta anónima creada al voleo.
--
-- private.es_anonimo(): lee el claim is_anonymous del JWT.
-- Se endurecen las acciones que antes tenían como fricción mínima "un mail real":
-- reservar (crear_reserva), dejar reseña (calificar_club), editar extras de una
-- reserva (actualizar_extras), marcar favoritos, e iniciar la prueba gratis
-- (iniciar_prueba) — esta última porque si no, una cuenta anónima podría generar
-- clubes de prueba gratis ilimitados sin pagar ni dar un mail.
-- registrar_club NO se toca: tiene que seguir funcionando para una cuenta anónima
-- que ya pagó (es la base del flujo "pagar primero, cuenta y club después").
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

create or replace function private.es_anonimo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;
revoke all on function private.es_anonimo() from public;
grant execute on function private.es_anonimo() to authenticated;

-- -----------------------------------------------------------------------------
-- 1. Prueba gratis: exige una cuenta real (no alcanza con una sesión anónima)
-- -----------------------------------------------------------------------------
create or replace function public.iniciar_prueba()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_vence timestamptz;
begin
  if v_uid is null then raise exception 'SESION_REQUERIDA'; end if;
  if private.es_anonimo() then raise exception 'CUENTA_REQUERIDA'; end if;
  if exists (select 1 from public.suscripciones where user_id = v_uid and plan = 'prueba') then
    raise exception 'PRUEBA_YA_USADA';
  end if;
  if private.suscripcion_vigente(v_uid) then raise exception 'YA_TIENE_SUSCRIPCION'; end if;

  insert into public.suscripciones (user_id, plan, estado, monto, vence_en)
  values (v_uid, 'prueba', 'activa', 0, now() + interval '30 days')
  returning vence_en into v_vence;

  return v_vence;
end;
$$;
revoke all on function public.iniciar_prueba() from public, anon;
grant execute on function public.iniciar_prueba() to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Reservar: exige una cuenta real
-- -----------------------------------------------------------------------------
create or replace function public.crear_reserva(
  p_cancha_id uuid,
  p_fecha date,
  p_hora text,
  p_nombre text,
  p_telefono text,
  p_extras jsonb default '[]'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_tz      constant text := 'America/Argentina/Cordoba';
  v_ahora   timestamp := now() at time zone v_tz;
  v_hoy     date := (now() at time zone v_tz)::date;
  v_cancha  public.canchas%rowtype;
  v_hora_h  int;
  v_ap_h    int;
  v_ci_h    int;
  v_extras  jsonb := '[]'::jsonb;
  v_item    jsonb;
  v_prod    public.productos%rowtype;
  v_cant    int;
  v_id      bigint;
begin
  if v_uid is null then
    raise exception 'SESION_REQUERIDA';
  end if;
  if private.es_anonimo() then raise exception 'CUENTA_REQUERIDA'; end if;

  p_nombre := left(trim(coalesce(p_nombre, '')), 80);
  p_telefono := trim(coalesce(p_telefono, ''));
  if char_length(p_nombre) < 2 then raise exception 'NOMBRE_INVALIDO'; end if;
  if p_telefono !~ '^[0-9+()\s-]{6,20}$' then raise exception 'TELEFONO_INVALIDO'; end if;
  if p_hora is null or p_hora !~ '^([01][0-9]|2[0-3]):00$' then raise exception 'HORA_INVALIDA'; end if;
  if p_fecha is null or p_fecha < v_hoy or p_fecha > v_hoy + 60 then raise exception 'FECHA_INVALIDA'; end if;

  select * into v_cancha from public.canchas where id = p_cancha_id;
  if not found or coalesce(v_cancha.activa, true) = false then raise exception 'CANCHA_NO_DISPONIBLE'; end if;

  v_hora_h := split_part(p_hora, ':', 1)::int;
  v_ap_h := extract(hour from coalesce(v_cancha.hora_apertura, time '08:00'))::int;
  v_ci_h := extract(hour from coalesce(v_cancha.hora_cierre, time '23:00'))::int;
  if v_hora_h < v_ap_h or v_hora_h >= v_ci_h then raise exception 'FUERA_DE_HORARIO'; end if;

  if (p_fecha + p_hora::time) <= v_ahora then raise exception 'TURNO_PASADO'; end if;

  -- Anti-acaparamiento: máximo de reservas futuras por jugador
  if (select count(*) from public.turnos t
       where t.usuario_id = v_uid and t.fecha >= v_hoy) >= 10 then
    raise exception 'LIMITE_RESERVAS';
  end if;

  -- Extras: precio y nombre salen de la base, nunca del cliente
  if p_extras is not null and jsonb_typeof(p_extras) = 'array' then
    if jsonb_array_length(p_extras) > 15 then raise exception 'EXTRAS_INVALIDOS'; end if;
    for v_item in select * from jsonb_array_elements(p_extras) loop
      if coalesce(v_item ->> 'id', '') !~ '^[0-9]{1,18}$' or coalesce(v_item ->> 'cantidad', '') !~ '^[0-9]{1,2}$' then
        raise exception 'EXTRAS_INVALIDOS';
      end if;
      v_cant := (v_item ->> 'cantidad')::int;
      continue when v_cant = 0;

      select * into v_prod
        from public.productos
       where id = (v_item ->> 'id')::bigint
         and club_id = v_cancha.club_id
         and activo is not false;
      if not found then raise exception 'EXTRAS_INVALIDOS'; end if;

      v_extras := v_extras || jsonb_build_object(
        'id', v_prod.id,
        'nombre', v_prod.nombre,
        'precio_unitario', v_prod.precio,
        'cantidad', v_cant,
        'subtotal', v_prod.precio * v_cant
      );
    end loop;
  end if;

  begin
    insert into public.turnos (cancha_id, fecha, hora_inicio, nombre_cliente, telefono_cliente, extras, usuario_id, precio_final)
    values (p_cancha_id, p_fecha, p_hora, p_nombre, p_telefono,
            case when jsonb_array_length(v_extras) > 0 then v_extras else null end,
            v_uid, v_cancha.precio_hora)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'SLOT_OCUPADO';
  end;

  return v_id;
end;
$$;
revoke all on function public.crear_reserva(uuid, date, text, text, text, jsonb) from public, anon;
grant execute on function public.crear_reserva(uuid, date, text, text, text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Reseñas: exige una cuenta real
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
  if private.es_anonimo() then raise exception 'CUENTA_REQUERIDA'; end if;
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
-- 4. Extras de una reserva: exige una cuenta real
-- -----------------------------------------------------------------------------
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
  if private.es_anonimo() then raise exception 'CUENTA_REQUERIDA'; end if;

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

-- -----------------------------------------------------------------------------
-- 5. Favoritos: exige una cuenta real
-- -----------------------------------------------------------------------------
drop policy if exists favoritos_insert_propios on public.favoritos;
create policy favoritos_insert_propios on public.favoritos
  for insert to authenticated
  with check (usuario_id = (select auth.uid()) and not private.es_anonimo());

commit;
