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
