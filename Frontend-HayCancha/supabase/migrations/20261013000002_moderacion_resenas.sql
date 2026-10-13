-- =============================================================================
-- GridPlay — El dueño ve las reseñas de su club y puede ocultar un comentario
-- =============================================================================
-- Requiere 20260926000001_resenas_y_extras.sql.
--  * public.resenas_de_mi_club(): todas las reseñas del club del dueño (para su panel).
--  * public.moderar_resena(): el dueño oculta o vuelve a mostrar el COMENTARIO de una reseña de su club.
--  * `oculta` pasa a significar "comentario oculto": las estrellas siguen contando en el promedio y en
--    la distribución, y la reseña sigue en la lista pública sin el texto. Así el dueño puede sacar un
--    insulto, pero no puede mejorar su puntaje escondiendo las reseñas malas.
--  * La portada (resenas_destacadas) no cambia: nunca muestra reseñas con el comentario oculto.
-- Para eliminar del todo una reseña falsa sigue haciendo falta borrarla a mano (dueño del proyecto).
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

create index if not exists resenas_club_fecha_idx on public.resenas (club_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 1. Lecturas públicas: las estrellas cuentan siempre; el comentario oculto no se publica
-- -----------------------------------------------------------------------------
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
   group by r.club_id;
$$;
revoke all on function public.resumen_resenas(uuid[]) from public;
grant execute on function public.resumen_resenas(uuid[]) to anon, authenticated;

create or replace function public.distribucion_resenas(p_club_id uuid)
returns table (estrellas int, cantidad int)
language sql
stable
security definer
set search_path = ''
as $$
  select r.estrellas::int, count(*)::int
    from public.resenas r
   where r.club_id = p_club_id
   group by r.estrellas;
$$;
revoke all on function public.distribucion_resenas(uuid) from public;
grant execute on function public.distribucion_resenas(uuid) to anon, authenticated;

create or replace function public.resenas_club(p_club_id uuid, p_limite int default 20, p_desde int default 0)
returns table (id bigint, estrellas int, comentario text, created_at timestamptz, autor text, es_mia boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         r.estrellas::int,
         case when r.oculta then null else r.comentario end,
         r.created_at,
         coalesce(nullif(split_part(btrim(u.nombre_completo), ' ', 1), ''), 'Jugador')
           || case when split_part(btrim(u.nombre_completo), ' ', 2) <> ''
                   then ' ' || upper(left(split_part(btrim(u.nombre_completo), ' ', 2), 1)) || '.'
                   else '' end,
         coalesce(r.usuario_id = (select auth.uid()), false)
    from public.resenas r
    left join public.usuarios u on u.id = r.usuario_id
   where r.club_id = p_club_id
   order by r.created_at desc
   limit least(greatest(coalesce(p_limite, 20), 1), 50)
  offset greatest(coalesce(p_desde, 0), 0);
$$;
revoke all on function public.resenas_club(uuid, int, int) from public;
grant execute on function public.resenas_club(uuid, int, int) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Panel del dueño: las reseñas de su club (con el autor abreviado, igual que en público)
-- -----------------------------------------------------------------------------
create or replace function public.resenas_de_mi_club()
returns table (id bigint, estrellas int, comentario text, oculta boolean, created_at timestamptz, autor text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
         r.estrellas::int,
         r.comentario,
         r.oculta,
         r.created_at,
         coalesce(nullif(split_part(btrim(u.nombre_completo), ' ', 1), ''), 'Jugador')
           || case when split_part(btrim(u.nombre_completo), ' ', 2) <> ''
                   then ' ' || upper(left(split_part(btrim(u.nombre_completo), ' ', 2), 1)) || '.'
                   else '' end
    from public.resenas r
    join public.clubes c on c.id = r.club_id
    left join public.usuarios u on u.id = r.usuario_id
   where c.admin_id = (select auth.uid())
   order by r.created_at desc
   limit 500;
$$;
revoke all on function public.resenas_de_mi_club() from public, anon;
grant execute on function public.resenas_de_mi_club() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Panel del dueño: ocultar o volver a mostrar el comentario de una reseña de su club
-- -----------------------------------------------------------------------------
create or replace function public.moderar_resena(p_resena_id bigint, p_oculta boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'SESION_REQUERIDA'; end if;

  update public.resenas r
     set oculta = coalesce(p_oculta, false)
   where r.id = p_resena_id
     and private.es_admin_de_club(r.club_id);

  if not found then raise exception 'RESENA_NO_ENCONTRADA'; end if;
end;
$$;
revoke all on function public.moderar_resena(bigint, boolean) from public, anon;
grant execute on function public.moderar_resena(bigint, boolean) to authenticated;

commit;
