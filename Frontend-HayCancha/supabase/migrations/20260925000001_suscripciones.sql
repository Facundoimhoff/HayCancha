-- =============================================================================
-- GridPlay · Fase 2b · Suscripciones verificadas (Mercado Pago)
-- =============================================================================
-- Un club solo se puede registrar si la cuenta tiene una suscripción 'activa'.
-- La tabla la escribe ÚNICAMENTE el backend (service_role) después de verificar la
-- suscripción contra la API de Mercado Pago; los clientes solo pueden leer la suya.
-- =============================================================================

begin;

create table if not exists public.suscripciones (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  mp_preapproval_id text unique,
  plan              text not null,
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente', 'activa', 'pausada', 'cancelada')),
  monto             numeric check (monto >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists suscripciones_user_id_idx on public.suscripciones (user_id);

alter table public.suscripciones enable row level security;

-- Sin grants de escritura: el rol service_role (backend) ignora RLS y es el único que escribe.
revoke all on public.suscripciones from anon, authenticated;
grant select on public.suscripciones to authenticated;

drop policy if exists suscripciones_select_propia on public.suscripciones;
create policy suscripciones_select_propia on public.suscripciones
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Los clubes que ya existen quedan con suscripción activa ('legado').
insert into public.suscripciones (user_id, plan, estado)
select distinct c.admin_id, 'legado', 'activa'
from public.clubes c
where not exists (
  select 1 from public.suscripciones s where s.user_id = c.admin_id
);

-- registrar_club: ahora exige suscripción activa (o rol superadmin)
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

  if not exists (select 1 from public.suscripciones s where s.user_id = v_uid and s.estado = 'activa')
     and not exists (select 1 from public.usuarios u where u.id = v_uid and u.rol = 'superadmin') then
    raise exception 'SUSCRIPCION_REQUERIDA';
  end if;

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

commit;
