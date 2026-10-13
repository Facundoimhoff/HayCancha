-- =============================================================================
-- GridPlay — Registro de avisos automáticos ya enviados (mails)
-- =============================================================================
-- El backend manda mails automáticos (bienvenida al crear el club, avisos de que la prueba gratis
-- está por terminar, reserva nueva). Esta tabla garantiza que cada aviso salga UNA sola vez:
-- antes de mandar, el backend inserta la clave; si ya existía, no manda.
--   clave: '<tipo>:<id>'  ej. 'prueba-7:<id de suscripción>', 'bienvenida:<id de club>',
--          'reserva-club:<id de turno>', 'reserva-jugador:<id de turno>'
-- Solo la usa el backend (service_role, que ignora RLS). Nadie más la lee ni la escribe.
-- Idempotente: se puede volver a correr.
-- =============================================================================
begin;

create table if not exists public.avisos_enviados (
  clave      text primary key check (char_length(clave) between 3 and 120),
  tipo       text not null,
  created_at timestamptz not null default now()
);

create index if not exists avisos_enviados_fecha_idx on public.avisos_enviados (created_at);

alter table public.avisos_enviados enable row level security;
revoke all on public.avisos_enviados from anon, authenticated;

commit;
