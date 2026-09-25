# CLAUDE.md — Memoria persistente de GridPlay

> Leer SIEMPRE al iniciar sesión. Actualizar al cerrar cada hito/sesión.

## Metodología
Agente autónomo por fases (Pensar → Herramientas → Observar → Actuar). Al terminar cada fase de investigación: reporte ejecutivo + plan, y esperar "ok" del usuario antes de modificar código. Al modificar: mostrar archivo, fragmento refactorizado y patrón aplicado. Idioma: español rioplatense. Nunca ejecutar SQL de escritura contra producción sin confirmación explícita (el clasificador de permisos lo bloquea, incluso dentro de una transacción con rollback).

## Estado actual (cierre de sesión 2026-09-25)
**En producción y verificado:**
- Fase 1 (mapeo) y Fase 2 (seguridad): RLS en todas las tablas, roles por servidor, reservas por RPC, storage restringido. Migración `seguridad_base` aplicada.
- Fase 2b (pago verificado): migración `suscripciones` aplicada; backend en Render con `/api/crear-suscripcion`, `/api/vincular-suscripcion` y webhook firmado; `registrar_club` exige suscripción activa. El usuario probó el pago real con `PRECIO_PLAN_FULL=50` y "funciona todo"; ya revirtió el precio y canceló la suscripción de prueba. Función Edge `crear-pago` borrada. Supabase Auth: contraseña 8+ con mayúscula/minúscula/número/símbolo; captcha apagado; "leaked passwords" NO disponible (plan Pro).
- Fase 3 etapas 1-3 (tokens, vidrio, animaciones) publicadas.

**Guardado en `main` local, SIN subir (el usuario debe correr `git push origin main`):** 4 commits — panel de administración rediseñado (ver sección Fase 3 más abajo), corrección del bug del menú lateral, modo demo, y este archivo. Tras el push verificar en https://gridplay-x.vercel.app/panel con sani@gmail.com o sport@gmail.com (no se pudo probar con datos reales).

**Reglas de la herramienta:** el clasificador bloquea escrituras a producción (SQL/migraciones a veces sí pasan si el usuario lo pide explícitamente en ese turno), `git push` y logins en dashboards; el usuario los hace a mano. Nunca pedir ni mostrar claves secretas; service_role solo en Render.

**Pendiente de configuración del usuario:** confirmar en Render las variables SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MP_WEBHOOK_SECRET, CORS_ORIGINS, FRONTEND_URL, y que PRECIO_PLAN_FULL esté en 50000 o borrada. Tabla suscripciones: puede tener una fila de prueba (plan Full) de la cuenta que hizo el pago.

## Rama `fase-3-reservas` (2026-09-25; pago rápido, reseñas, reserva, Mis reservas y cierre de la Fase 3)
- **Pago rápido (bloque A)**: backend reutiliza el plan de MP (`MP_PLAN_LINK_FULL` opcional > caché de promesa > búsqueda de plan activo compatible > crear) y lo precalienta al arrancar; frontend `precalentarApi()` (GET /health) en Planes/RegistroClub/LoginAdmin, `postApi` con timeout 60 s + 1 reintento + `onLento`; Planes con progreso y errores inline. El cold start de Render (plan gratis) solo se elimina con un ping externo (UptimeRobot a `/health`, cada 5 min) o plan pago. Sin probar contra MP real (la búsqueda de planes cae a crear si falla).
- **Reseñas + extras editables — MIGRACIÓN `20260926000001_resenas_y_extras.sql` NO APLICADA a producción** (la aplica el usuario; probada en réplica local, `npm run test:db` 100/100). Tabla `resenas` (una por jugador y club, solo quien ya jugó, `oculta` para moderación manual del dueño), RPC `calificar_club`, `resumen_resenas`, `distribucion_resenas`, `resenas_club` (autor abreviado) y `actualizar_extras` (lista completa deseada; cantidad 0 quita). Mientras no se aplique, la UI degrada a "Sin reseñas todavía" y "Agregar extras" falla con mensaje.
- **UI del jugador** (`src/components/user/`, estilos `componentes.css`, prefijo `gp-`): Estrellas/Calificacion/EstrellasInput, Hoja (modal), EditorExtras, TarjetaClub (compartida por Explorar y Buscar), FiltrosClubes, ModalResena, SeccionResenas (en la ficha del club), ModalExtras, AuthReserva. `ReservaCancha` (prefijo `rc-`) y `MisReservas` (`mr-`) reescritas; `HomeUsuario` (`hu-`) y `Buscar` usan las tarjetas nuevas. Lógica pura con tests en `src/utils/reservas.js` y `filtrosClubes.js` (`npm run test:unit`, 22).
- **Modo demo** (`npm run dev:demo`) ahora cubre el jugador: `/explorar/Córdoba/Freyre`, `/club/demo-club-freyre`, `/reservar/cf1`, `/mis-reservas` (RPC simuladas en `supabaseDemo.js`). Ojo: el plugin de Vite solo reemplaza `services/supabase` y `./supabase` dentro de `src/services`.
- **Fase 3 CERRADA (etapas 4 y 5)**: formularios con errores inline por campo (`components/user/Formulario.jsx`: CampoTexto, CampoPassword + MedidorPassword, Pasos; `evaluarPassword` en utils/validaciones), registro de club en 3 pasos visibles (Cuenta → Plan → Club) con detección de cuenta ya existente y pago directo desde el paso 2, `FormularioAcceso` compartido (reserva + LoginCliente), hooks `usePagoPlan`/`usePrecioPlan`/`useFormspree` (0 alert() en el proyecto), backend `GET /api/planes` (el precio ya no está en el JSX). Etapa 5: PerfilClub reescrita (0 estilos en línea; `utils/enlaces.js` arregló un XSS en los links de redes: antes `includes('http')` dejaba pasar `javascript:`), `views/MiClub.jsx` y `views/Kiosco.jsx` reescritos con el sistema `dash-` (se borraron GestorKiosco y ConfiguracionClub), `index.css` 1010 → 56 líneas, 169 hex → tokens, FAQ sin azul Bootstrap, CiudadesPorProvincia/HeaderCliente/SeleccionUbicacion limpios, DashboardAdmin con `React.lazy` (bundle principal 1.767 → 594 kB). **Lint del proyecto: 0 problemas** (antes 43).
- **Accesibilidad**: auditoría con axe-core (WCAG 2.1 AA + buenas prácticas) sobre Landing, explorar, ficha, reserva (4 estados), Mis reservas y modales, registro (3 pasos y errores), accesos, Planes, Contacto y todo el panel: **0 violaciones** tras corregir `<main>`/landmarks, títulos, botones sin nombre, tabla con encabezado vacío, barras de progreso sin etiqueta y foco atrapado en modales (`Hoja` y `Modal` del panel). Para repetirla: copiar `axe.min.js` de `node_modules/axe-core` a `Frontend-HayCancha/public/` (temporal, borrar después) y correr `axe.run` en el modo demo.
- Demo: `localStorage.setItem('demoRol', 'anon' | 'cliente' | 'cliente-pago')` para ver los pasos 1/2/3 del registro; `removeItem` para volver al admin.
- Decisiones pendientes del usuario: política de anticipación para cancelar (hoy libre hasta que el turno empieza); moderación de reseñas (hoy solo manual por SQL); si el admin puede responder reseñas.

## Arquitectura
Monorepo sin workspaces, raíz `GridPlay/` (carpetas con nombre viejo "HayCancha"):
- `Frontend-HayCancha/` — React 19 + Vite 8 + react-router 7 (SPA, Vercel con rewrite a `/`). Proyecto Supabase CLI también acá (`supabase/`).
  - `src/services/supabase.js` (cliente único, falla si faltan env vars), `src/services/storage.js` (`subirImagen`: valida tipo/tamaño, sube a `imagenes/<uid>/<carpeta>/<uuid>.<ext>`).
  - `src/context/{authContext.js,AuthProvider.jsx}`: sesión + perfil (`public.usuarios.rol`) — fuente de verdad del rol. `recargarPerfil()` tras `registrar_club`.
  - `src/components/RutaProtegida.jsx`: `/panel` exige rol admin/superadmin, `/mis-reservas` exige sesión.
  - `src/utils/validaciones.js`: password (8+, minúscula, mayúscula, número y símbolo), teléfono, `sanitizarBusqueda`, `mensajeDeServidor` (códigos de error de las RPC), `fechaLocalISO`.
  - Páginas de jugador/landing en `src/pages/user/`; panel de administración en `src/pages/admin/` (ver Fase 3).
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
Etapas 1-5 HECHAS (tokens, vidrio, animaciones, formularios, limpieza). Ver la sección de la rama `fase-3-reservas`.
- `src/styles/tokens.css`: única fuente de colores/tipografía/radios/sombras/vidrio/movimiento/z-index. Incluye alias legacy (--turf, --ink, --paper, --line…). Cargado antes que todo (main.jsx). Fallback sin backdrop-filter vía @supports.
- `src/styles/glass.css`: `.glass`, `.glass--strong`, `.glass--dark`, `.aurora-bg`. El vidrio solo se nota sobre color: las pantallas de auth/planes usan `var(--aurora-bg)`.
- Aplicado: tarjetas de LoginAdmin/LoginCliente/RegistroClub/ActualizarPassword/Planes, barra de Planes (sticky), navbar de Landing (vidrio oscuro), tooltip del menú flotante, banner de cookies (vidrio oscuro, compacto en celular), overlays de modales (--overlay-bg/--overlay-filter).
- Animación de ruta ahora SOLO opacidad (`pageFade`): un `transform` en un ancestro rompe `position: fixed` de los hijos. `prefers-reduced-motion` respetado. Foco visible global y `:active` scale(.98) en botones.
- Tipografía cargada una sola vez en index.html (Inter + Montserrat); html usa --font-body; `*{font-family:inherit}`. Se borró App.css (plantilla Vite) y los @import/:root duplicados.
- (Resuelto en la etapa 5; era la deuda detectada) 40 clases CSS repetidas entre archivos (globales, se pisan; ej. .opcion-tooltip y .menu-flotante-container están en Landing y Dashboard), 77 colores hex distintos, 122 estilos inline en DashboardAdmin (53 en PerfilClub), FAQ.css usa azul Bootstrap (fuera de marca), Planes muestra $50000 fijo en el JSX (debería venir del backend), varios alert() en formularios.

## Fase 3 — Panel de administración rediseñado (rama `fase-3-dashboard`)
- Reemplaza `pages/user/DashboardAdmin.jsx/.css` (1600 líneas con componentes anidados que se remontaban en cada render, 122 estilos en línea y un bug: un bloque de CSS de celular pegado dos veces quedó fuera del @media y escondía el menú lateral en escritorio).
- Nueva estructura `src/pages/admin/`: `DashboardAdmin.jsx` (shell + carga de datos + operaciones Supabase), `dashboard.css` (todo bajo `.dash`, clases con prefijo `dash-`, usa tokens), `lib/` (`metricas.js` funciones puras + tests, `formato.js`, `deportes.js`), `components/ui.jsx` (Panel, KpiCard, Sparkline, Chip, Modal, Campo, MenuAcciones, TooltipGrafico…), `views/` (VistaGeneral, Reportes, Clientes, Canchas, MiClub), `modals/modales.jsx` (Turno, Bloqueo, Detalles, Cancha crear/editar unificado, Confirmar).
- Métricas nuevas: variación contra el período anterior, ocupación por cancha, mapa de calor día×hora, ranking de clientes, "reservado a futuro". Ingresos = solo turnos con fecha <= hoy (antes incluía el mes completo). Períodos: hoy / semana (lunes→hoy) / mes / 30 días.
- `window.confirm/alert` reemplazados por modales con error inline. El FAB de la Landing (menu flotante) vivía en DashboardAdmin.css y se movió a LandingPage.css.
- MiClub y Kiosco ya se reescribieron (etapa 5): viven en `views/MiClub.jsx` y `views/Kiosco.jsx`.
- Herramientas: `npm run dev:demo` (puerto 5174, datos de ejemplo sin sesión, ver src/services/supabaseDemo.js), `npm run test:unit` (13 tests de métricas), `npm run test:db` (73 de RLS). Para capturas en el navegador integrado: viewport 1000×N y `scale` 0.78 muestra el ancho completo; llamar a tabs_select antes de cada screenshot.

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

## Próximo paso (por orden)
0. **El usuario**: `git push` de `main` y `fase-3-reservas` (merge a main; en Render y Vercel se redespliega solo), **aplicar la migración `20260926000001_resenas_y_extras.sql`** en Supabase (SQL Editor o `supabase db push`) y probar en producción: pago, registro de club en 3 pasos, reservar, "Mis reservas", agregar extras, calificar, Mi club y Kiosco. Opcional: UptimeRobot a `https://haycancha.onrender.com/health` cada 5 min para evitar el arranque en frío de Render.
1. Ajustar lo que el usuario vea en producción.
2. **Fase 4** (webhooks/n8n, WhatsApp: avisos de reserva confirmada/cancelada y recordatorios; definir antes el proveedor: WhatsApp Cloud API oficial o n8n con un tercero).
3. Fase 6 (social/rachas) y Fase 7 (reportes profesionales, metricas_mensuales, poda de turnos >30 días conservando total_reservas_historicas).
- **DESCARTADAS por el usuario (2026-09-25):** Fase 5 completa — "Second Brain" y precios dinámicos. No retomar salvo pedido explícito.
Deuda: xlsx@0.18.5 con advisories (se reemplaza en Fase 7); dashboard descarga todos los turnos (Fase 7); enumeración de cuentas en login/registro (riesgo bajo).
