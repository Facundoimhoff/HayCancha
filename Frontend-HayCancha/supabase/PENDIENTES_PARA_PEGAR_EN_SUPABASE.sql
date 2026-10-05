-- =============================================================================
-- GridPlay: migraciones PENDIENTES juntas, para pegar de una vez en Supabase
-- (Dashboard > SQL Editor > New query > pegar todo > Run).
-- Son copia de supabase/migrations/. Todas son idempotentes: si alguna ya estaba aplicada, no pasa nada.
-- Borrá este archivo cuando las hayas aplicado.
-- =============================================================================

-- >>>>>>>>>> 20260926000001_resenas_y_extras.sql
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

-- >>>>>>>>>> 20261005000001_favoritos.sql
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

-- >>>>>>>>>> 20260927000001_resenas_destacadas.sql
-- =============================================================================
-- GridPlay — Reseñas destacadas para la portada
-- =============================================================================
-- Requiere 20260926000001_resenas_y_extras.sql (tabla public.resenas).
-- public.resenas_destacadas: las últimas reseñas buenas (4-5 estrellas, con comentario) de
-- cualquier club, para mostrar en la portada. Igual que el resto de las lecturas públicas:
-- autor abreviado ("Lucas P."), sin ids de usuario y sin las reseñas ocultas por moderación.
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

create or replace function public.resenas_destacadas(p_limite int default 6)
returns table (id bigint, estrellas int, comentario text, created_at timestamptz, autor text,
               club_id uuid, club_nombre text, club_ciudad text)
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
         c.id,
         c.nombre,
         c.ciudad
    from public.resenas r
    join public.clubes c on c.id = r.club_id
    left join public.usuarios u on u.id = r.usuario_id
   where not r.oculta
     and r.estrellas >= 4
     and char_length(btrim(coalesce(r.comentario, ''))) >= 20
   order by r.created_at desc
   limit least(greatest(coalesce(p_limite, 6), 1), 12);
$$;
revoke all on function public.resenas_destacadas(int) from public;
grant execute on function public.resenas_destacadas(int) to anon, authenticated;

commit;

-- >>>>>>>>>> 20260927000002_ubicacion_clubes.sql
-- =============================================================================
-- GridPlay — Ubicación de los clubes en el mapa
-- =============================================================================
-- Agrega latitud y longitud a public.clubes. Las coordenadas son públicas (el club quiere que lo
-- encuentren), igual que el resto de la ficha. Solo el dueño del club puede cargarlas o cambiarlas,
-- desde "Mi club" (la política clubes_update_admin ya limita la edición a su propio club).
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

alter table public.clubes
  add column if not exists latitud  double precision,
  add column if not exists longitud double precision;

-- O las dos o ninguna, y dentro del rango del planeta (ojo: un CHECK con resultado NULL pasa,
-- por eso se exige "is not null" en la segunda rama)
alter table public.clubes drop constraint if exists clubes_ubicacion_valida;
alter table public.clubes add constraint clubes_ubicacion_valida check (
  (latitud is null and longitud is null)
  or (latitud is not null and longitud is not null
      and latitud between -90 and 90 and longitud between -180 and 180)
);

-- El dueño edita solo columnas explícitas: se suman estas dos
grant update (latitud, longitud) on public.clubes to authenticated;

commit;

-- >>>>>>>>>> 20260927000003_prueba_gratis.sql
-- =============================================================================
-- GridPlay — Prueba gratis de 30 días, sin tarjeta
-- =============================================================================
--  * suscripciones.vence_en: fecha de fin. Nula = sin vencimiento (planes pagos y "legado").
--  * public.iniciar_prueba(): el dueño arranca su prueba de 30 días. Una sola vez por cuenta.
--  * Al vencer, el club deja de recibir reservas nuevas (trigger sobre turnos). El panel sigue abierto
--    para que el dueño vea sus datos y se suscriba. Al pagar (suscripción vigente) se reactiva solo.
--  * public.club_recibe_reservas(): lo usa la web para avisar al jugador antes de intentar reservar.
-- Alcance: solo afecta a clubes que pasaron por una prueba vencida sin suscripción vigente.
-- Los clubes con plan pago o "legado", y las cuentas superadmin, no cambian.
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

alter table public.suscripciones add column if not exists vence_en timestamptz;

-- -----------------------------------------------------------------------------
-- 1. Helpers privados
-- -----------------------------------------------------------------------------
-- ¿Tiene una suscripción activa y no vencida?
create or replace function private.suscripcion_vigente(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.suscripciones s
     where s.user_id = p_user
       and s.estado = 'activa'
       and (s.vence_en is null or s.vence_en > now())
  );
$$;

-- ¿Puede este club recibir reservas? Solo dice que NO si su dueño tiene una prueba vencida y ninguna
-- suscripción vigente (y no es superadmin).
create or replace function private.club_recibe_reservas(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not coalesce((
    select exists (
             select 1 from public.suscripciones s
              where s.user_id = c.admin_id and s.plan = 'prueba' and s.vence_en <= now()
           )
       and not private.suscripcion_vigente(c.admin_id)
       and not exists (select 1 from public.usuarios u where u.id = c.admin_id and u.rol = 'superadmin')
      from public.clubes c
     where c.id = p_club
  ), false);
$$;

revoke all on function private.suscripcion_vigente(uuid) from public;
revoke all on function private.club_recibe_reservas(uuid) from public;
grant execute on function private.suscripcion_vigente(uuid) to anon, authenticated;
grant execute on function private.club_recibe_reservas(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Lectura pública: ¿este club recibe reservas?
-- -----------------------------------------------------------------------------
create or replace function public.club_recibe_reservas(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.club_recibe_reservas(p_club_id);
$$;
revoke all on function public.club_recibe_reservas(uuid) from public;
grant execute on function public.club_recibe_reservas(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Iniciar la prueba
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
-- 4. Un club con la prueba vencida no recibe turnos nuevos (ni de jugadores ni cargados a mano)
-- -----------------------------------------------------------------------------
create or replace function private.turnos_exige_suscripcion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_club uuid;
begin
  select club_id into v_club from public.canchas where id = new.cancha_id;
  if v_club is not null and not private.club_recibe_reservas(v_club) then
    raise exception 'CLUB_SIN_SUSCRIPCION';
  end if;
  return new;
end;
$$;

drop trigger if exists turnos_exige_suscripcion on public.turnos;
create trigger turnos_exige_suscripcion
  before insert on public.turnos
  for each row execute function private.turnos_exige_suscripcion();

commit;

-- >>>>>>>>>> 20261005000002_pago_directo_y_anonimos.sql
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

