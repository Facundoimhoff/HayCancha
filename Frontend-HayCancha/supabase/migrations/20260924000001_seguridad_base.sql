-- =============================================================================
-- GridPlay · Fase 2 · Seguridad base (RLS, roles, reservas server-side, storage)
-- =============================================================================
-- Estado previo (auditado 2026-09-24): 7 tablas en public SIN RLS, bucket
-- `imagenes` con policies abiertas al rol `public`, rol de usuario falsificable
-- vía user_metadata, clubes.admin_id apuntando al dueño del proyecto.
--
-- Esta migración es transaccional e idempotente en lo posible. Orden de despliegue:
--   1) aplicar esta migración  2) desplegar el frontend de la rama fase-2-seguridad
--   (el frontend viejo deja de funcionar apenas se activa RLS: reservas, panel y
--    "mis reservas" pasan a requerir sesión y RPCs).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Esquema privado para helpers (no expuesto por PostgREST)
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Roles: usuarios.rol solo lo escribe el servidor
-- -----------------------------------------------------------------------------
update public.usuarios set rol = 'superadmin' where rol = 'DUEÑO DEL PROYECTO';
update public.usuarios set rol = 'cliente' where rol is null;

alter table public.usuarios alter column rol set default 'cliente';
alter table public.usuarios alter column rol set not null;
alter table public.usuarios alter column strikes set default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'usuarios_rol_check') then
    alter table public.usuarios
      add constraint usuarios_rol_check check (rol in ('cliente', 'admin', 'superadmin'));
  end if;
end $$;

-- Backfill: toda cuenta de auth debe tener fila en usuarios
insert into public.usuarios (id, nombre_completo, rol)
select u.id,
       left(coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)), 80),
       'cliente'
from auth.users u
where not exists (select 1 from public.usuarios x where x.id = u.id);

-- Trigger: cada alta en auth.users crea su perfil con rol 'cliente' (nunca desde metadata)
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios (id, nombre_completo, rol)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Usuario'), 80),
    'cliente'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Clubes: identidad del admin = admin_id (auth.users.id)
-- -----------------------------------------------------------------------------
-- Los clubes existentes tenían admin_id = dueño del proyecto y el admin real solo
-- figuraba en admin_email. Se reasigna por email y luego se elimina la columna.
update public.clubes c
   set admin_id = u.id
  from auth.users u
 where c.admin_email is not null
   and lower(u.email) = lower(c.admin_email)
   and c.admin_id is distinct from u.id;

update public.usuarios
   set rol = 'admin'
 where rol = 'cliente'
   and id in (select admin_id from public.clubes);

alter table public.clubes drop column if exists admin_email;

-- -----------------------------------------------------------------------------
-- 3. Helpers de autorización (SECURITY DEFINER, esquema privado)
-- -----------------------------------------------------------------------------
create or replace function private.es_admin_de_club(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.clubes c
    where c.id = p_club and c.admin_id = (select auth.uid())
  );
$$;

create or replace function private.es_admin_de_cancha(p_cancha uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.canchas ca
    join public.clubes c on c.id = ca.club_id
    where ca.id = p_cancha and c.admin_id = (select auth.uid())
  );
$$;

revoke all on function private.es_admin_de_club(uuid) from public;
revoke all on function private.es_admin_de_cancha(uuid) from public;
grant execute on function private.es_admin_de_club(uuid) to anon, authenticated;
grant execute on function private.es_admin_de_cancha(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Esquema: columnas faltantes e integridad
-- -----------------------------------------------------------------------------
-- canchas.superficie: el panel la escribe y el perfil la lee, pero no existía.
alter table public.canchas add column if not exists superficie text;

-- productos: unifica el catálogo de kiosco (antes el panel escribía en `kiosco`
-- y la reserva leía `productos`, así que los productos nuevos nunca se veían).
alter table public.productos add column if not exists icono text;
update public.productos set activo = true where activo is null;
alter table public.productos alter column activo set default true;
alter table public.productos alter column nombre set not null;
alter table public.productos alter column precio set not null;
alter table public.productos alter column club_id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productos_club_id_fkey') then
    alter table public.productos
      add constraint productos_club_id_fkey foreign key (club_id) references public.clubes (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'productos_precio_check') then
    alter table public.productos add constraint productos_precio_check check (precio >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'canchas_precio_hora_check') then
    alter table public.canchas add constraint canchas_precio_hora_check check (precio_hora >= 0);
  end if;
end $$;

-- turnos: FK, unicidad de slot, dueño y precio congelado
alter table public.turnos add column if not exists usuario_id uuid references auth.users (id) on delete set null;
alter table public.turnos add column if not exists precio_final numeric;
alter table public.turnos add column if not exists created_at timestamptz not null default now();

alter table public.turnos alter column cancha_id set not null;
alter table public.turnos alter column fecha set not null;
alter table public.turnos alter column hora_inicio set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'turnos_cancha_id_fkey') then
    alter table public.turnos
      add constraint turnos_cancha_id_fkey foreign key (cancha_id) references public.canchas (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'turnos_slot_unico') then
    alter table public.turnos add constraint turnos_slot_unico unique (cancha_id, fecha, hora_inicio);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'turnos_hora_formato') then
    alter table public.turnos add constraint turnos_hora_formato check (hora_inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
  end if;
end $$;

create index if not exists turnos_usuario_id_idx on public.turnos (usuario_id) where usuario_id is not null;

-- Backfill del precio congelado (los bloqueos no facturan)
update public.turnos t
   set precio_final = c.precio_hora
  from public.canchas c
 where c.id = t.cancha_id
   and t.precio_final is null
   and t.telefono_cliente is distinct from 'BLOQUEO';

-- Los turnos cargados por el admin toman el precio vigente de la cancha si no lo traen
create or replace function private.turnos_set_precio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.precio_final is null and new.telefono_cliente is distinct from 'BLOQUEO' then
    select precio_hora into new.precio_final from public.canchas where id = new.cancha_id;
  end if;
  return new;
end;
$$;
revoke all on function private.turnos_set_precio() from public, anon, authenticated;

drop trigger if exists turnos_set_precio on public.turnos;
create trigger turnos_set_precio
  before insert on public.turnos
  for each row execute function private.turnos_set_precio();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.usuarios  enable row level security;
alter table public.clubes    enable row level security;
alter table public.canchas   enable row level security;
alter table public.turnos    enable row level security;
alter table public.productos enable row level security;
alter table public.kiosco    enable row level security;
alter table public.reservas  enable row level security;

-- Privilegios base: anon nunca escribe; authenticated solo lo que las policies permitan
revoke all on public.usuarios, public.clubes, public.canchas, public.turnos,
              public.productos, public.kiosco, public.reservas from anon, authenticated;

-- reservas (modelo legacy, vacío): deny-all
-- (sin grants ni policies)

-- usuarios: cada uno ve y edita solo su perfil; rol y strikes son de solo lectura
grant select on public.usuarios to authenticated;
grant update (nombre_completo, telefono) on public.usuarios to authenticated;

drop policy if exists usuarios_select_propio on public.usuarios;
create policy usuarios_select_propio on public.usuarios
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists usuarios_update_propio on public.usuarios;
create policy usuarios_update_propio on public.usuarios
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- clubes: lectura pública; solo el admin edita su club (columnas explícitas); alta vía RPC
grant select on public.clubes to anon, authenticated;
grant update (nombre, direccion, telefono_contacto, imagen_url, estacionamiento, provincia, ciudad,
              descripcion, color_primario, deporte, techada, cantidad_jugadores, precio_hora,
              servicios, correo_contacto, redes_sociales, fotos_club)
  on public.clubes to authenticated;

drop policy if exists clubes_select_publico on public.clubes;
create policy clubes_select_publico on public.clubes
  for select to anon, authenticated
  using (true);

drop policy if exists clubes_update_admin on public.clubes;
create policy clubes_update_admin on public.clubes
  for update to authenticated
  using (admin_id = (select auth.uid()))
  with check (admin_id = (select auth.uid()));

-- canchas: lectura pública; escritura del admin del club
grant select on public.canchas to anon, authenticated;
grant insert, update, delete on public.canchas to authenticated;

drop policy if exists canchas_select_publico on public.canchas;
create policy canchas_select_publico on public.canchas
  for select to anon, authenticated
  using (true);

drop policy if exists canchas_insert_admin on public.canchas;
create policy canchas_insert_admin on public.canchas
  for insert to authenticated
  with check (private.es_admin_de_club(club_id));

drop policy if exists canchas_update_admin on public.canchas;
create policy canchas_update_admin on public.canchas
  for update to authenticated
  using (private.es_admin_de_club(club_id))
  with check (private.es_admin_de_club(club_id));

drop policy if exists canchas_delete_admin on public.canchas;
create policy canchas_delete_admin on public.canchas
  for delete to authenticated
  using (private.es_admin_de_club(club_id));

-- productos: el público ve los activos; el admin gestiona los de su club
grant select on public.productos to anon, authenticated;
grant insert, update, delete on public.productos to authenticated;

drop policy if exists productos_select on public.productos;
create policy productos_select on public.productos
  for select to anon, authenticated
  using (activo is not false or private.es_admin_de_club(club_id));

drop policy if exists productos_insert_admin on public.productos;
create policy productos_insert_admin on public.productos
  for insert to authenticated
  with check (private.es_admin_de_club(club_id));

drop policy if exists productos_update_admin on public.productos;
create policy productos_update_admin on public.productos
  for update to authenticated
  using (private.es_admin_de_club(club_id))
  with check (private.es_admin_de_club(club_id));

drop policy if exists productos_delete_admin on public.productos;
create policy productos_delete_admin on public.productos
  for delete to authenticated
  using (private.es_admin_de_club(club_id));

-- kiosco (tabla legacy, reemplazada por productos): solo el admin del club
grant select, insert, update, delete on public.kiosco to authenticated;

drop policy if exists kiosco_admin on public.kiosco;
create policy kiosco_admin on public.kiosco
  for all to authenticated
  using (private.es_admin_de_club(club_id))
  with check (private.es_admin_de_club(club_id));

-- turnos: contienen datos personales. El jugador ve/cancela los suyos; el admin, los de su club.
-- Los jugadores NO insertan directo: reservan con public.crear_reserva().
grant select, insert, update, delete on public.turnos to authenticated;

drop policy if exists turnos_select on public.turnos;
create policy turnos_select on public.turnos
  for select to authenticated
  using (usuario_id = (select auth.uid()) or private.es_admin_de_cancha(cancha_id));

drop policy if exists turnos_insert_admin on public.turnos;
create policy turnos_insert_admin on public.turnos
  for insert to authenticated
  with check (private.es_admin_de_cancha(cancha_id));

drop policy if exists turnos_update_admin on public.turnos;
create policy turnos_update_admin on public.turnos
  for update to authenticated
  using (private.es_admin_de_cancha(cancha_id))
  with check (private.es_admin_de_cancha(cancha_id));

drop policy if exists turnos_delete on public.turnos;
create policy turnos_delete on public.turnos
  for delete to authenticated
  using (
    private.es_admin_de_cancha(cancha_id)
    or (usuario_id = (select auth.uid())
        and fecha >= (now() at time zone 'America/Argentina/Cordoba')::date)
  );

-- -----------------------------------------------------------------------------
-- 6. RPC: disponibilidad pública (solo slots ocupados, sin datos personales)
-- -----------------------------------------------------------------------------
create or replace function public.disponibilidad_cancha(p_cancha_id uuid, p_desde date, p_hasta date)
returns table (fecha date, hora_inicio text)
language sql
stable
security definer
set search_path = ''
as $$
  select t.fecha, t.hora_inicio
  from public.turnos t
  where t.cancha_id = p_cancha_id
    and t.fecha between p_desde and least(p_hasta, p_desde + 62);
$$;
revoke all on function public.disponibilidad_cancha(uuid, date, date) from public;
grant execute on function public.disponibilidad_cancha(uuid, date, date) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC: crear_reserva — todas las reglas y el precio se calculan en el servidor
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
-- 8. RPC: registrar_club — único camino para volverse admin (rol fijado por el servidor)
-- -----------------------------------------------------------------------------
-- TODO(fase 2b): exigir suscripción verificada (webhook de Mercado Pago) antes de crear el club.
create or replace function public.registrar_club(
  p_nombre text,
  p_descripcion text,
  p_provincia text,
  p_ciudad text,
  p_direccion text,
  p_telefono text,
  p_estacionamiento boolean,
  p_servicios text,
  p_redes jsonb,
  p_imagen_url text,
  p_correo text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if v_uid is null then raise exception 'SESION_REQUERIDA'; end if;
  if exists (select 1 from public.clubes where admin_id = v_uid) then raise exception 'CLUB_EXISTENTE'; end if;

  p_nombre := left(trim(coalesce(p_nombre, '')), 120);
  if char_length(p_nombre) < 2 then raise exception 'NOMBRE_INVALIDO'; end if;
  if coalesce(trim(p_provincia), '') = '' or coalesce(trim(p_ciudad), '') = '' or coalesce(trim(p_direccion), '') = '' then
    raise exception 'UBICACION_INVALIDA';
  end if;
  if coalesce(p_telefono, '') !~ '^[0-9+()\s-]{6,20}$' then raise exception 'TELEFONO_INVALIDO'; end if;
  if coalesce(p_imagen_url, '') <> '' and p_imagen_url !~ '^https://' then raise exception 'IMAGEN_INVALIDA'; end if;
  if p_redes is not null and jsonb_typeof(p_redes) <> 'object' then raise exception 'REDES_INVALIDAS'; end if;

  insert into public.usuarios (id, nombre_completo, rol)
  values (v_uid, left(p_nombre, 80), 'admin')
  on conflict (id) do nothing;

  insert into public.clubes (nombre, descripcion, provincia, ciudad, direccion, telefono_contacto,
                             estacionamiento, servicios, redes_sociales, imagen_url, correo_contacto, admin_id)
  values (p_nombre, left(p_descripcion, 2000), left(trim(p_provincia), 80), left(trim(p_ciudad), 80),
          left(trim(p_direccion), 200), trim(p_telefono), coalesce(p_estacionamiento, false),
          left(p_servicios, 500), coalesce(p_redes, '{}'::jsonb), nullif(p_imagen_url, ''),
          left(trim(p_correo), 200), v_uid)
  returning id into v_id;

  update public.usuarios set rol = 'admin' where id = v_uid and rol = 'cliente';
  return v_id;
end;
$$;
revoke all on function public.registrar_club(text, text, text, text, text, text, boolean, text, jsonb, text, text) from public, anon;
grant execute on function public.registrar_club(text, text, text, text, text, text, boolean, text, jsonb, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Storage: bucket `imagenes` (solo imágenes ≤ 5 MB, escritura en carpeta propia)
-- -----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'imagenes';

drop policy if exists "Permitir todo 1ktc4f5_0" on storage.objects;
drop policy if exists "Permitir todo 1ktc4f5_1" on storage.objects;
drop policy if exists "Permitir todo 1ktc4f5_2" on storage.objects;
drop policy if exists "Permitir todo 1ktc4f5_3" on storage.objects;

-- Las URLs públicas (/object/public/imagenes/...) no requieren policy SELECT; se quita
-- el listado abierto del bucket.
drop policy if exists imagenes_insert_propias on storage.objects;
create policy imagenes_insert_propias on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagenes' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists imagenes_select_propias on storage.objects;
create policy imagenes_select_propias on storage.objects
  for select to authenticated
  using (bucket_id = 'imagenes' and owner_id = (select auth.uid())::text);

drop policy if exists imagenes_update_propias on storage.objects;
create policy imagenes_update_propias on storage.objects
  for update to authenticated
  using (bucket_id = 'imagenes' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'imagenes' and owner_id = (select auth.uid())::text);

drop policy if exists imagenes_delete_propias on storage.objects;
create policy imagenes_delete_propias on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagenes' and owner_id = (select auth.uid())::text);

commit;
