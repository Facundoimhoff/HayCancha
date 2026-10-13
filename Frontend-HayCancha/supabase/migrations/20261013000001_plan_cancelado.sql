-- =============================================================================
-- GridPlay — Qué pasa cuando un plan pago se cancela o se pausa
-- =============================================================================
-- Requiere 20260927000003_prueba_gratis.sql.
-- Antes solo se frenaban las reservas de un club con la PRUEBA vencida: un club que pagaba y
-- después cancelaba seguía recibiendo reservas para siempre.
--  * Baja de un plan pago: el backend guarda en vence_en el fin del período ya pago. Hasta esa fecha
--    la suscripción sigue contando como vigente; después, no.
--  * Un club deja de recibir reservas nuevas cuando su dueño tuvo alguna suscripción y ya no tiene
--    ninguna vigente (prueba vencida, plan cancelado, pausado o pendiente).
-- No cambian: los clubes con plan activo o "legado", las cuentas superadmin y los clubes cuyo dueño
-- no tiene ninguna fila de suscripción.
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

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
       and (
         (s.estado = 'activa' and (s.vence_en is null or s.vence_en > now()))
         -- baja pedida de un plan pago: sigue hasta el fin del período que ya pagó
         or (s.estado = 'cancelada' and s.plan <> 'prueba' and s.vence_en > now())
       )
  );
$$;

create or replace function private.club_recibe_reservas(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not coalesce((
    select exists (select 1 from public.suscripciones s where s.user_id = c.admin_id)
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

commit;
