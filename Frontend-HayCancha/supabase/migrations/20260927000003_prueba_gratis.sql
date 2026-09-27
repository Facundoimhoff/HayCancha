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
