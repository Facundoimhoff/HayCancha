# CLAUDE.md — Memoria persistente de GridPlay

> Leer SIEMPRE al iniciar sesión. Actualizar al cerrar cada hito/sesión.

## Metodología
Agente autónomo por fases (Pensar → Herramientas → Observar → Actuar). Al terminar cada fase de investigación: reporte ejecutivo + plan, y esperar "ok" del usuario antes de modificar código. Al modificar: mostrar archivo, fragmento refactorizado y patrón aplicado. Idioma: español rioplatense. Nunca ejecutar SQL de escritura contra producción sin confirmación explícita (el clasificador de permisos lo bloquea, incluso dentro de una transacción con rollback).

## Estado actual (2026-09-24)
- Fase 1 (mapeo) y Fase 2 (auditoría) completadas. **Fase 2 implementada en la rama `fase-2-seguridad` (commits hechos, SIN push y SIN aplicar la migración a producción).**
- Rama `main` sin cambios. Producción (Vercel + Supabase `sghtbvoyeswtfmgqxwgw`) sigue con RLS desactivado hasta que se despliegue.

## Arquitectura
Monorepo sin workspaces, raíz `GridPlay/` (carpetas con nombre viejo "HayCancha"):
- `Frontend-HayCancha/` — React 19 + Vite 8 + react-router 7 (SPA, Vercel con rewrite a `/`). Proyecto Supabase CLI también acá (`supabase/`).
  - `src/services/supabase.js` (cliente único, falla si faltan env vars), `src/services/storage.js` (`subirImagen`: valida tipo/tamaño, sube a `imagenes/<uid>/<carpeta>/<uuid>.<ext>`).
  - `src/context/{authContext.js,AuthProvider.jsx}`: sesión + perfil (`public.usuarios.rol`) — fuente de verdad del rol. `recargarPerfil()` tras `registrar_club`.
  - `src/components/RutaProtegida.jsx`: `/panel` exige rol admin/superadmin, `/mis-reservas` exige sesión.
  - `src/utils/validaciones.js`: password (8+, letra y número), teléfono, `sanitizarBusqueda`, `mensajeDeServidor` (códigos de error de las RPC), `fechaLocalISO`.
  - Páginas en `src/pages/user/` (admin y jugador mezcladas; `DashboardAdmin.jsx` ~1600 líneas).
- `Backend-HayCancha/index.js` — Express 5 (Render). Solo `/api/crear-suscripcion` (MP PreApprovalPlan), `/health`. Precio por plan definido en servidor (`PLANES`), CORS por `CORS_ORIGINS`, rate limit, falla al arrancar sin `MP_ACCESS_TOKEN`.
- `supabase/functions/crear-pago` — Edge Function NO usada por el frontend (endurecida; conviene eliminarla).
- Dependencias de reportes (jspdf, jspdf-autotable, xlsx) ahora declaradas en `Frontend-HayCancha/package.json` (antes dependían del `node_modules` de la raíz que estaba commiteado). `package.json` de la raíz quedó redundante.

## Modelo de datos (Supabase) tras la migración `20260924000001_seguridad_base.sql`
- `usuarios(id→auth.users, nombre_completo, telefono, rol ∈ cliente|admin|superadmin, strikes)`: trigger `on_auth_user_created` crea la fila con rol `cliente` SIEMPRE. El usuario solo puede editar nombre/teléfono. Único camino a `admin`: RPC `registrar_club`.
- `clubes(admin_id → dueño)`: lectura pública, update solo del admin (columnas explícitas). `admin_email` ELIMINADA (identidad = `admin_id`). Alta solo por RPC.
- `canchas` (+`superficie`), `productos` (+`icono`, catálogo unificado; `kiosco` queda legado con RLS admin), `turnos` (+`usuario_id`, `precio_final` congelado, `created_at`, FK a canchas, `UNIQUE(cancha_id,fecha,hora_inicio)`, trigger de precio). `reservas` legacy: deny-all.
- RLS: turnos visibles solo para su dueño y el admin del club; jugadores reservan con `crear_reserva` (precio/extras/horario/anti-acaparamiento en servidor, máx 10 futuras) y ven disponibilidad con `disponibilidad_cancha` (solo slots ocupados). Cancelar: delete propio con fecha >= hoy.
- Helpers en schema `private` (no expuesto por PostgREST). Storage `imagenes`: solo jpeg/png/webp ≤5MB, escritura solo en carpeta `<uid>/`; sin listado público.
- Clubes reales: SPORT AUTOMOVIL CLUB (admin sport@gmail.com) y SANI (sani@gmail.com); sus `admin_id` apuntaban al dueño (facuimhoff2112) → la migración los reasigna por email. Dueño del proyecto pasa a rol `superadmin`.

## ORDEN DE DESPLIEGUE (crítico)
1. Revisar y aplicar la migración (Supabase → SQL editor / `supabase db push`) y **enseguida** desplegar el frontend de `fase-2-seguridad` (el frontend viejo se rompe apenas se activa RLS: reservas, panel, mis reservas).
2. Backend Render: definir `CORS_ORIGINS` (dominio real del frontend), `MP_ACCESS_TOKEN`, `FRONTEND_URL`; redeploy.
3. Supabase Auth (dashboard): password mínimo 8 + letras/dígitos, activar *Leaked password protection*, revisar *Redirect URLs* (`/login-admin`, `/login-cliente`, `/actualizar-password`) y decidir si se exige confirmación de mail.
4. Borrar la Edge Function `crear-pago` desplegada (v5, `verify_jwt=false`) o redeployarla con el código nuevo.

## Validación realizada
- Migración: parseo completo con libpg-query (120 sentencias, 4 cuerpos plpgsql OK). NO ejecutada contra la base (bloqueado por permisos). Pruebas de RLS con roles simulados pendientes: correrlas en una branch de Supabase o local antes de producción.
- Frontend: `npm run build` OK; ESLint limpio en archivos nuevos (el resto del repo tenía 43 errores previos de lint).

## Pendientes / deuda conocida
- **Registro de club sin pago verificado**: `registrar_club` está abierto a cualquier cuenta (TODO fase 2b: webhook de Mercado Pago + estado de suscripción). Hoy `/registro-club` ya no dice "¡Pago exitoso!".
- `xlsx@0.18.5` tiene advisories conocidos (prototype pollution/ReDoS); se reemplaza al rehacer reportes (Fase 7).
- `PerfilClub`/redes sociales: revisar que no armen `href` con input sin validar (Fase 3).
- Dashboard descarga TODOS los turnos históricos al navegador (Fase 7: `metricas_mensuales` + poda).
- `hora_inicio` es text y hay columna basura `turnos.horarios_disponibles` (no se eliminó por prudencia).
- Registro con confirmación de mail: el flujo continúa en `/login-admin` → `/registro-club` (paso 2).
- `LoginCliente`/`ReservaCancha` distinguen "email ya registrado" (enumeración de cuentas, riesgo bajo).

## Próximo paso
Esperar decisión del usuario sobre: (a) aplicar la migración (idealmente primero en una branch de Supabase con las pruebas de RLS), (b) merge/deploy, (c) arrancar Fase 3 (UX/UI Stripe/Linear) o el gating de pagos (Fase 2b).
