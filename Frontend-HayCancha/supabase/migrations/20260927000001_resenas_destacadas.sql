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
