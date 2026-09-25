# CLAUDE.md — Memoria persistente de GridPlay

> Leer SIEMPRE al iniciar sesión. Actualizar al cerrar cada hito/sesión.

## Metodología
Agente autónomo por fases (Pensar → Herramientas → Observar → Actuar). Al terminar cada fase de investigación: reporte ejecutivo + plan, y esperar "ok" del usuario antes de modificar código. Al modificar: mostrar archivo, fragmento refactorizado y patrón aplicado. Idioma: español rioplatense. Nunca ejecutar SQL de escritura contra producción sin confirmación explícita (el clasificador de permisos lo bloquea, incluso dentro de una transacción con rollback).

## Estado actual (2026-09-24)
- Fases 1 y 2 completas y **EN PRODUCCIÓN**: migración `seguridad_base` aplicada en Supabase (pegada por el usuario en el SQL Editor porque el clasificador bloquea escrituras a producción) y frontend mergeado a `main` y pusheado por el usuario (Vercel: https://gridplay-x.vercel.app).
- Verificado en vivo: RLS activo en las 7 tablas, 23 policies, roles (sani/sport=admin, dueño=superadmin), /panel sin sesión redirige a /login-admin, /registro-club en dos pasos, lista de clubes y disponibilidad de canchas cargan.
- Nota: el clasificador de la herramienta bloquea escrituras a producción y `git push`; el usuario los ejecuta a mano.
- Commit local pendiente de push: actualización de este archivo.

## Arquitectura
Monorepo sin workspaces, raíz `GridPlay/` (carpetas con nombre viejo "HayCancha"):
- `Frontend-HayCancha/` — React 19 + Vite 8 + react-router 7 (SPA, Vercel con rewrite a `/`). Proyecto Supabase CLI también acá (`supabase/`).
  - `src/services/supabase.js` (cliente único, falla si faltan env vars), `src/services/storage.js` (`subirImagen`: valida tipo/tamaño, sube a `imagenes/<uid>/<carpeta>/<uuid>.<ext>`).
  - `src/context/{authContext.js,AuthProvider.jsx}`: sesión + perfil (`public.usuarios.rol`) — fuente de verdad del rol. `recargarPerfil()` tras `registrar_club`.
  - `src/components/RutaProtegida.jsx`: `/panel` exige rol admin/superadmin, `/mis-reservas` exige sesión.
  - `src/utils/validaciones.js`: password (8+, minúscula, mayúscula, número y símbolo), teléfono, `sanitizarBusqueda`, `mensajeDeServidor` (códigos de error de las RPC), `fechaLocalISO`.
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

## Fase 2b — Pago verificado (CÓDIGO LISTO, sin desplegar; commits locales)
- Tabla `suscripciones(user_id, mp_preapproval_id UNIQUE, plan, estado pendiente|activa|pausada|cancelada, monto)`: solo la escribe el backend (service_role); el usuario lee la suya. Migración `20260925000001_suscripciones.sql` (los clubes existentes quedan con plan `legado` activo). `registrar_club` exige suscripción activa o rol superadmin (error SUSCRIPCION_REQUERIDA).
- Flujo: cuenta (paso 1) → /planes → `POST /api/crear-suscripcion` (JWT) → link de MP → vuelve a /registro-club?preapproval_id=… → `POST /api/vincular-suscripcion` (el backend consulta a MP con su access token que exista y esté `authorized`; una suscripción = una cuenta) → paso 2 (datos del club). Botón "Verificar mi pago" (busca por mail) por si MP no devuelve el id. `POST /api/webhooks/mercadopago` (firma x-signature HMAC-SHA256) mantiene el estado (cancelada/pausada).
- Backend: env nuevas SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (¡secreta!), MP_WEBHOOK_SECRET. Sin ellas los endpoints responden 503. Tests: `npm test` (Backend) y `npm run test:db` (Frontend, 73 casos).
- Pendiente de decisión de negocio: qué pasa con un club cuya suscripción se cancela (hoy solo se registra el estado; no se bloquean reservas).
- Supuesto no verificado en vivo: que MP devuelva `preapproval_id` en la back_url del plan (si no, funciona el botón de verificación por mail).

## Fase 3 — UX/UI Stripe/Linear (rama `fase-3-diseno`)
Etapas 1-3 HECHAS (tokens, vidrio, animaciones); 4 (formularios) y 5 (limpieza CSS) PENDIENTES.
- `src/styles/tokens.css`: única fuente de colores/tipografía/radios/sombras/vidrio/movimiento/z-index. Incluye alias legacy (--turf, --ink, --paper, --line…). Cargado antes que todo (main.jsx). Fallback sin backdrop-filter vía @supports.
- `src/styles/glass.css`: `.glass`, `.glass--strong`, `.glass--dark`, `.aurora-bg`. El vidrio solo se nota sobre color: las pantallas de auth/planes usan `var(--aurora-bg)`.
- Aplicado: tarjetas de LoginAdmin/LoginCliente/RegistroClub/ActualizarPassword/Planes, barra de Planes (sticky), navbar de Landing (vidrio oscuro), tooltip del menú flotante, banner de cookies (vidrio oscuro, compacto en celular), overlays de modales (--overlay-bg/--overlay-filter).
- Animación de ruta ahora SOLO opacidad (`pageFade`): un `transform` en un ancestro rompe `position: fixed` de los hijos. `prefers-reduced-motion` respetado. Foco visible global y `:active` scale(.98) en botones.
- Tipografía cargada una sola vez en index.html (Inter + Montserrat); html usa --font-body; `*{font-family:inherit}`. Se borró App.css (plantilla Vite) y los @import/:root duplicados.
- Deuda detectada (etapa 5): 40 clases CSS repetidas entre archivos (globales, se pisan; ej. .opcion-tooltip y .menu-flotante-container están en Landing y Dashboard), 77 colores hex distintos, 122 estilos inline en DashboardAdmin (53 en PerfilClub), FAQ.css usa azul Bootstrap (fuera de marca), Planes muestra $50000 fijo en el JSX (debería venir del backend), varios alert() en formularios.

## Fase 3 — Panel de administración rediseñado (rama `fase-3-dashboard`)
- Reemplaza `pages/user/DashboardAdmin.jsx/.css` (1600 líneas con componentes anidados que se remontaban en cada render, 122 estilos en línea y un bug: un bloque de CSS de celular pegado dos veces quedó fuera del @media y escondía el menú lateral en escritorio).
- Nueva estructura `src/pages/admin/`: `DashboardAdmin.jsx` (shell + carga de datos + operaciones Supabase), `dashboard.css` (todo bajo `.dash`, clases con prefijo `dash-`, usa tokens), `lib/` (`metricas.js` funciones puras + tests, `formato.js`, `deportes.js`), `components/ui.jsx` (Panel, KpiCard, Sparkline, Chip, Modal, Campo, MenuAcciones, TooltipGrafico…), `views/` (VistaGeneral, Reportes, Clientes, Canchas, MiClub), `modals/modales.jsx` (Turno, Bloqueo, Detalles, Cancha crear/editar unificado, Confirmar).
- Métricas nuevas: variación contra el período anterior, ocupación por cancha, mapa de calor día×hora, ranking de clientes, "reservado a futuro". Ingresos = solo turnos con fecha <= hoy (antes incluía el mes completo). Períodos: hoy / semana (lunes→hoy) / mes / 30 días.
- `window.confirm/alert` reemplazados por modales con error inline. El FAB de la Landing (menu flotante) vivía en DashboardAdmin.css y se movió a LandingPage.css.
- Pendiente en el panel: `MiClub.jsx` (53 estilos en línea) y `GestorKiosco.jsx` (29) siguen con markup viejo pero se ven bien gracias a clases de compatibilidad en dashboard.css; reescribirlos.
- Herramientas: `npm run dev:demo` (puerto 5174, datos de ejemplo sin sesión, ver src/services/supabaseDemo.js), `npm run test:unit` (13 tests de métricas), `npm run test:db` (73 de RLS). Para capturas en el navegador integrado: viewport 1000×N y `scale` 0.78 muestra el ancho completo; llamar a tabs_select antes de cada screenshot.

## Pendientes de configuración (manuales, dashboards)
1. Render (backend): variables CORS_ORIGINS=https://gridplay-x.vercel.app, FRONTEND_URL=https://gridplay-x.vercel.app, MP_ACCESS_TOKEN; redeploy (el backend nuevo falla al arrancar sin MP_ACCESS_TOKEN).
2. Supabase Auth: password mínimo 8 con minúscula+mayúscula+dígito+símbolo (YA CONFIGURADO por el usuario; el front lo valida igual), NO activar Captcha (rompería login: la web no envía captchaToken), Leaked password protection (en Email provider; puede ser función de pago), Redirect URLs (/login-admin, /login-cliente, /actualizar-password, /), decidir confirmación de mail.
3. Borrar la Edge Function crear-pago desplegada (v5, verify_jwt=false; no la usa el frontend).

## Validación realizada
- Migración: 65 pruebas de RLS en réplica local con PGlite (`npm run test:db` en Frontend-HayCancha) y verificación posterior en la base real (RLS, policies, roles, bucket).
- Frontend: `npm run build` OK; ESLint limpio en archivos nuevos (el resto del repo tenía 43 errores previos de lint).

## Pendientes / deuda conocida
- Registro de club sin pago verificado: RESUELTO en código (Fase 2b), falta desplegar y probar con un pago real.
- `xlsx@0.18.5` tiene advisories conocidos (prototype pollution/ReDoS); se reemplaza al rehacer reportes (Fase 7).
- `PerfilClub`/redes sociales: revisar que no armen `href` con input sin validar (Fase 3).
- Dashboard descarga TODOS los turnos históricos al navegador (Fase 7: `metricas_mensuales` + poda).
- `hora_inicio` es text y hay columna basura `turnos.horarios_disponibles` (no se eliminó por prudencia).
- Registro con confirmación de mail: el flujo continúa en `/login-admin` → `/registro-club` (paso 2).
- `LoginCliente`/`ReservaCancha` distinguen "email ya registrado" (enumeración de cuentas, riesgo bajo).

## Próximo paso
Subir a producción (git push origin main). Luego: reescribir MiClub y GestorKiosco con el sistema nuevo; formularios con errores inline y stepper en registro (Fase 3 etapa 4); limpieza de CSS de las demás pantallas (40 clases repetidas, 77 colores); revisar Landing/Reserva/PerfilClub con el mismo criterio visual. Después Fase 4 (n8n/webhooks) y Fase 7 (reportes y poda).
