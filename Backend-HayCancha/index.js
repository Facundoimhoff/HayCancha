import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import { enviarCorreo, correoConfigurado, mailValido } from './lib/correo.js';
import { bienvenidaClub, pruebaPorVencer, pruebaVencida, reservaNuevaClub, reservaConfirmadaJugador } from './lib/plantillas.js';
import { avisoDePrueba, tienePlanPago, totalDeReserva, esReciente } from './lib/avisos.js';
import { verificarFirmaMP, estadoDesdeMP, planDesdeMotivo, buscarPlanCompatible, catalogoPublico, vigenciaTrasBaja, origenValido, PREFIJO_MOTIVO } from './lib/mercadopago.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // Render/Railway van detrás de un proxy: necesario para limitar por IP real

// CORS restringido a los orígenes propios (CORS_ORIGINS="https://a.com,https://b.com").
// IMPORTANTE: en Render definir CORS_ORIGINS con el dominio real del frontend en producción.
const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGINS || 'https://gridplay-x.vercel.app,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ORIGENES_PERMITIDOS.includes(origin)),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));
app.use(express.json({ limit: '10kb' }));

app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  next();
});

// Sin token no hay pagos: mejor no arrancar que fallar en el primer cobro.
if (!process.env.MP_ACCESS_TOKEN) {
  console.error('Falta la variable de entorno MP_ACCESS_TOKEN.');
  process.exit(1);
}
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Cliente de Supabase con service_role: SOLO en el servidor, ignora RLS. Nunca exponerlo al navegador.
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
if (!supabaseAdmin) {
  console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sin configurar: las suscripciones responderán 503.');
}

// Catálogo de planes: el precio vive en el servidor, NUNCA se acepta del cliente.
const PLANES = {
  Full: { precio: Number(process.env.PRECIO_PLAN_FULL) || 50000 },
};

const FRONTEND_URL = origenValido(process.env.FRONTEND_URL, 'https://gridplay-x.vercel.app');

const limitePagos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});

const limiteAvisos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});

const limiteWebhook = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/** Usuario de Supabase dueño del token `Authorization: Bearer <jwt>`, o null. */
async function usuarioDeLaSolicitud(req) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Precio de cada plan para mostrarlo en el frontend (la única fuente es PLANES / PRECIO_PLAN_FULL)
app.get('/api/planes', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ planes: catalogoPublico(PLANES) });
});

// --- 1) INICIAR SUSCRIPCIÓN: devuelve el link de pago de Mercado Pago ---
// Link de cada plan: variable de entorno (MP_PLAN_LINK_FULL) > caché en memoria > plan ya creado en Mercado Pago > plan nuevo.
// Se cachea la PROMESA para que pedidos simultáneos no creen planes repetidos, y se precalienta al arrancar.
const linksPlanes = new Map();

async function crearOReutilizarPlan(nombrePlan, plan) {
  const reason = `${PREFIJO_MOTIVO}${nombrePlan}`;
  // MP vuelve acá agregando ?preapproval_id=...; el frontend la verifica con /api/vincular-suscripcion
  const backUrl = `${FRONTEND_URL}/registro-club`;
  const planes = new PreApprovalPlan(client);

  try {
    const { results } = await planes.search({ options: { status: 'active', limit: 100 } });
    const existente = buscarPlanCompatible(results, { reason, precio: plan.precio, backUrl });
    if (existente) return existente.init_point;
  } catch (error) {
    console.warn('No se pudo buscar planes existentes en Mercado Pago; se crea uno nuevo:', error?.message || error);
  }

  const creado = await planes.create({
    body: {
      reason,
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: plan.precio, currency_id: 'ARS' },
      back_url: backUrl,
    },
  });
  return creado.init_point;
}

function linkDelPlan(nombrePlan) {
  const fijo = process.env[`MP_PLAN_LINK_${nombrePlan.toUpperCase()}`];
  if (fijo) return Promise.resolve(fijo);

  if (!linksPlanes.has(nombrePlan)) {
    const promesa = crearOReutilizarPlan(nombrePlan, PLANES[nombrePlan]);
    linksPlanes.set(nombrePlan, promesa);
    promesa.catch(() => linksPlanes.delete(nombrePlan)); // un fallo no queda cacheado
  }
  return linksPlanes.get(nombrePlan);
}

// Sin sesión: el link de pago no es personal (es el mismo plan de Mercado Pago para todos), así que
// no hace falta cuenta todavía. El pago se vincula a una cuenta recién al volver (vincular-suscripcion).
app.post('/api/crear-suscripcion', limitePagos, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Pagos no disponibles por el momento' });

  const nombrePlan = req.body?.plan;
  if (!Object.hasOwn(PLANES, nombrePlan)) return res.status(400).json({ error: 'Plan inválido' });

  try {
    res.json({ linkPago: await linkDelPlan(nombrePlan) });
  } catch (error) {
    console.error('Error en Mercado Pago:', error);
    res.status(500).json({ error: 'Fallo al crear la suscripción' });
  }
});

// --- 2) VINCULAR: el usuario vuelve de pagar; se VERIFICA con Mercado Pago (no se confía en el navegador) ---
app.post('/api/vincular-suscripcion', limitePagos, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Pagos no disponibles por el momento' });

  const user = await usuarioDeLaSolicitud(req);
  if (!user) return res.status(401).json({ error: 'Iniciá sesión' });

  const idSolicitado = typeof req.body?.preapproval_id === 'string' ? req.body.preapproval_id.trim() : '';
  if (idSolicitado && !/^[A-Za-z0-9_-]{8,64}$/.test(idSolicitado)) {
    return res.status(400).json({ error: 'Identificador de suscripción inválido' });
  }

  try {
    const preapprovals = new PreApproval(client);
    let suscripcion = null;

    if (idSolicitado) {
      // Con nuestro access token solo se pueden leer suscripciones de NUESTRA cuenta de Mercado Pago.
      suscripcion = await preapprovals.get({ id: idSolicitado });
    } else if (user.email) {
      // Respaldo: si MP no devolvió el id, se busca la última suscripción autorizada con el mail de la cuenta.
      const encontrados = await preapprovals.search({ options: { payer_email: user.email, status: 'authorized' } });
      suscripcion = (encontrados?.results || []).find((s) => planDesdeMotivo(s.reason)) ?? null;
    }

    const nombrePlan = planDesdeMotivo(suscripcion?.reason);
    if (!suscripcion || !nombrePlan || !PLANES[nombrePlan]) {
      return res.status(404).json({ error: 'No encontramos una suscripción de GridPlay para esta cuenta' });
    }
    if (suscripcion.status !== 'authorized') {
      return res.status(402).json({ error: 'El pago todavía no fue autorizado', estado: estadoDesdeMP(suscripcion.status) });
    }

    // Una suscripción de Mercado Pago solo puede pertenecer a una cuenta.
    const { data: existente, error: errorLectura } = await supabaseAdmin
      .from('suscripciones')
      .select('user_id')
      .eq('mp_preapproval_id', suscripcion.id)
      .maybeSingle();
    if (errorLectura) throw errorLectura;
    if (existente && existente.user_id !== user.id) {
      return res.status(409).json({ error: 'Esta suscripción ya está asociada a otra cuenta' });
    }

    const { error: errorGuardado } = await supabaseAdmin.from('suscripciones').upsert({
      user_id: user.id,
      mp_preapproval_id: suscripcion.id,
      plan: nombrePlan,
      estado: 'activa',
      vence_en: null,
      monto: suscripcion.auto_recurring?.transaction_amount ?? PLANES[nombrePlan].precio,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'mp_preapproval_id' });
    if (errorGuardado) throw errorGuardado;

    res.json({ estado: 'activa', plan: nombrePlan });
  } catch (error) {
    // Un id que no existe en nuestra cuenta de MP llega acá como error 404 del SDK
    if (error?.status === 404 || error?.error === 'not_found') {
      return res.status(404).json({ error: 'No encontramos esa suscripción' });
    }
    console.error('Error al vincular la suscripción:', error);
    res.status(500).json({ error: 'No pudimos verificar el pago. Intentá de nuevo en unos minutos.' });
  }
});

// --- 3) BAJA: el dueño cancela su plan desde el panel. Deja de cobrarse y sigue vigente hasta el fin del período ya pago ---
app.post('/api/cancelar-suscripcion', limitePagos, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Pagos no disponibles por el momento' });

  const user = await usuarioDeLaSolicitud(req);
  if (!user) return res.status(401).json({ error: 'Iniciá sesión' });

  try {
    // Solo las suscripciones de ESTA cuenta: el id de Mercado Pago sale de la base, nunca del navegador.
    const { data: activas, error: errorLectura } = await supabaseAdmin
      .from('suscripciones')
      .select('id, mp_preapproval_id')
      .eq('user_id', user.id)
      .eq('estado', 'activa')
      .not('mp_preapproval_id', 'is', null);
    if (errorLectura) throw errorLectura;
    if (!activas?.length) return res.status(404).json({ error: 'No tenés un plan pago activo para dar de baja' });

    const preapprovals = new PreApproval(client);
    let venceEn = null;
    for (const fila of activas) {
      const suscripcion = await preapprovals.get({ id: fila.mp_preapproval_id });
      const vence = vigenciaTrasBaja(suscripcion);
      if (suscripcion.status !== 'cancelled') {
        await preapprovals.update({ id: fila.mp_preapproval_id, body: { status: 'cancelled' } });
      }
      const { error: errorGuardado } = await supabaseAdmin
        .from('suscripciones')
        .update({ estado: 'cancelada', vence_en: vence, updated_at: new Date().toISOString() })
        .eq('id', fila.id);
      if (errorGuardado) throw errorGuardado;
      if (!venceEn || vence > venceEn) venceEn = vence;
    }

    res.json({ estado: 'cancelada', vence_en: venceEn });
  } catch (error) {
    console.error('Error al cancelar la suscripción:', error);
    res.status(500).json({ error: 'No pudimos dar de baja el plan. Intentá de nuevo en unos minutos.' });
  }
});

// --- 4) WEBHOOK: Mercado Pago avisa cambios (cancelación, pausa, etc.). Solo actualiza suscripciones ya vinculadas ---
app.post('/api/webhooks/mercadopago', limiteWebhook, async (req, res) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !supabaseAdmin) return res.sendStatus(503);

  const dataId = req.query['data.id'] ?? req.body?.data?.id;
  const firmaOk = verificarFirmaMP({
    secret,
    xSignature: req.get('x-signature'),
    xRequestId: req.get('x-request-id'),
    dataId: req.query['data.id'], // la firma se arma con el id de la URL
  });
  if (!firmaOk) return res.sendStatus(401);

  const tipo = req.query.type ?? req.body?.type;
  if (tipo !== 'subscription_preapproval' || !dataId) return res.sendStatus(200); // otros eventos: se ignoran

  try {
    const suscripcion = await new PreApproval(client).get({ id: String(dataId) });
    const estado = estadoDesdeMP(suscripcion.status);
    const { error } = await supabaseAdmin
      .from('suscripciones')
      // Al volver a estar activa se borra cualquier fecha de fin que haya dejado una baja anterior.
      .update({ estado, updated_at: new Date().toISOString(), ...(estado === 'activa' ? { vence_en: null } : {}) })
      .eq('mp_preapproval_id', suscripcion.id);
    if (error) throw error;

    // Baja hecha desde Mercado Pago (no desde el panel): sigue vigente hasta el fin del período ya pago.
    // Si el panel ya había guardado la fecha, no se pisa.
    if (estado === 'cancelada') {
      const { error: errorFecha } = await supabaseAdmin
        .from('suscripciones')
        .update({ vence_en: vigenciaTrasBaja(suscripcion) })
        .eq('mp_preapproval_id', suscripcion.id)
        .is('vence_en', null);
      if (errorFecha) throw errorFecha;
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al procesar el webhook:', error);
    res.sendStatus(500); // Mercado Pago reintenta
  }
});

// --- 5) AVISOS POR MAIL (bienvenida, prueba por vencer, reserva nueva) ---
// Apagados hasta que existan RESEND_API_KEY y CORREO_REMITENTE. Cada aviso sale una sola vez (tabla avisos_enviados).
const PANEL_URL = `${FRONTEND_URL}/panel`;
// Los mails salen de una dirección que no recibe: las respuestas van a la casilla de soporte
const CORREO_RESPUESTAS = process.env.CORREO_RESPUESTAS || 'supportgridplay@gmail.com';

/**
 * Manda un aviso si no se había mandado antes. Primero reserva la clave (así dos pedidos simultáneos
 * no lo duplican) y, si el envío falla, la libera para reintentar más tarde.
 */
async function enviarUnaVez(clave, tipo, correo) {
  if (!supabaseAdmin || !correoConfigurado()) return false;

  const { error } = await supabaseAdmin.from('avisos_enviados').insert({ clave, tipo });
  if (error) {
    if (error.code !== '23505') console.error('No se pudo registrar el aviso', clave, error.message);
    return false; // 23505 = ya se había mandado
  }
  const { enviado } = await enviarCorreo(correo);
  if (!enviado) await supabaseAdmin.from('avisos_enviados').delete().eq('clave', clave);
  return enviado;
}

async function mailDeUsuario(userId) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  return error ? null : data?.user?.email ?? null;
}

// Bienvenida: la pide el frontend apenas se crea el club
app.post('/api/avisos/club-creado', limiteAvisos, async (req, res) => {
  if (!supabaseAdmin) return res.sendStatus(503);
  const user = await usuarioDeLaSolicitud(req);
  if (!user) return res.status(401).json({ error: 'Iniciá sesión' });

  try {
    const { data: club } = await supabaseAdmin.from('clubes').select('id, nombre').eq('admin_id', user.id).limit(1).maybeSingle();
    if (!club) return res.status(404).json({ error: 'No encontramos tu club' });

    const { data: filas } = await supabaseAdmin.from('suscripciones').select('plan, estado, vence_en').eq('user_id', user.id);
    await enviarUnaVez(`bienvenida:${club.id}`, 'bienvenida', {
      para: user.email,
      responderA: CORREO_RESPUESTAS,
      ...bienvenidaClub({ club: club.nombre, panelUrl: PANEL_URL, enPrueba: !tienePlanPago(filas) }),
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error en el aviso de bienvenida:', error);
    res.status(500).json({ error: 'No se pudo enviar el aviso' });
  }
});

// Reserva nueva: aviso al club y confirmación al jugador. Solo la puede pedir quien hizo la reserva, y recién hecha.
app.post('/api/avisos/reserva', limiteAvisos, async (req, res) => {
  if (!supabaseAdmin) return res.sendStatus(503);
  const user = await usuarioDeLaSolicitud(req);
  if (!user) return res.status(401).json({ error: 'Iniciá sesión' });

  const idTurno = Number(req.body?.turno_id);
  if (!Number.isSafeInteger(idTurno) || idTurno <= 0) return res.status(400).json({ error: 'Reserva inválida' });

  try {
    const { data: turno } = await supabaseAdmin
      .from('turnos')
      .select('id, cancha_id, fecha, hora_inicio, nombre_cliente, telefono_cliente, precio_final, extras, usuario_id, created_at')
      .eq('id', idTurno)
      .maybeSingle();
    if (!turno || turno.usuario_id !== user.id || !esReciente(turno.created_at)) {
      return res.status(404).json({ error: 'No encontramos esa reserva' });
    }

    const { data: cancha } = await supabaseAdmin.from('canchas').select('nombre, club_id').eq('id', turno.cancha_id).maybeSingle();
    const { data: club } = cancha
      ? await supabaseAdmin.from('clubes').select('nombre, direccion, ciudad, correo_contacto, admin_id').eq('id', cancha.club_id).maybeSingle()
      : { data: null };
    if (!cancha || !club) return res.status(404).json({ error: 'No encontramos esa reserva' });

    const hora = String(turno.hora_inicio).slice(0, 5);
    const total = totalDeReserva(turno);
    const mailClub = mailValido(club.correo_contacto) ? club.correo_contacto : await mailDeUsuario(club.admin_id);

    await Promise.all([
      enviarUnaVez(`reserva-club:${turno.id}`, 'reserva-club', {
        para: mailClub,
        ...reservaNuevaClub({
          club: club.nombre, cancha: cancha.nombre, fecha: turno.fecha, hora,
          jugador: turno.nombre_cliente, telefono: turno.telefono_cliente, extras: turno.extras, total, panelUrl: PANEL_URL,
        }),
      }),
      enviarUnaVez(`reserva-jugador:${turno.id}`, 'reserva-jugador', {
        para: user.email,
        responderA: mailClub,
        ...reservaConfirmadaJugador({
          club: club.nombre, cancha: cancha.nombre, fecha: turno.fecha, hora,
          direccion: [club.direccion, club.ciudad].filter(Boolean).join(', '),
          extras: turno.extras, total, reservasUrl: `${FRONTEND_URL}/mis-reservas`,
        }),
      }),
    ]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error en el aviso de reserva:', error);
    res.status(500).json({ error: 'No se pudo enviar el aviso' });
  }
});

// Pruebas gratis por vencer o recién vencidas: se revisan cada hora. A cada club le llega cada aviso una sola vez.
async function revisarPruebas() {
  if (!supabaseAdmin || !correoConfigurado()) return;
  const ahora = new Date();
  const dia = 86400000;

  const { data: pruebas, error } = await supabaseAdmin
    .from('suscripciones')
    .select('id, user_id, plan, estado, vence_en')
    .eq('plan', 'prueba')
    .eq('estado', 'activa')
    .gte('vence_en', new Date(ahora.getTime() - 6 * dia).toISOString())
    .lte('vence_en', new Date(ahora.getTime() + 8 * dia).toISOString());
  if (error) { console.error('No se pudieron leer las pruebas gratis:', error.message); return; }

  for (const prueba of pruebas || []) {
    const aviso = avisoDePrueba(prueba, ahora);
    if (!aviso) continue;

    const { data: filas } = await supabaseAdmin.from('suscripciones').select('plan, estado, vence_en').eq('user_id', prueba.user_id);
    if (tienePlanPago(filas, ahora)) continue; // ya se suscribió: no hay nada que avisar

    const { data: club } = await supabaseAdmin.from('clubes').select('nombre').eq('admin_id', prueba.user_id).limit(1).maybeSingle();
    if (!club) continue;

    const datos = { club: club.nombre, precio: PLANES.Full.precio, panelUrl: PANEL_URL };
    await enviarUnaVez(`${aviso.tipo}:${prueba.id}`, aviso.tipo, {
      para: await mailDeUsuario(prueba.user_id),
      responderA: CORREO_RESPUESTAS,
      ...(aviso.tipo === 'prueba-vencida' ? pruebaVencida(datos) : pruebaPorVencer({ ...datos, dias: aviso.dias })),
    });
  }
}

const revisarPruebasSinRomper = () => revisarPruebas().catch((error) => console.error('Error al revisar las pruebas gratis:', error));

// Las rutas /api/buscar y /api/clubes/:id devolvían datos de prueba fijos y no las usa el frontend
// (consulta Supabase directamente, protegido por RLS): se eliminaron para no exponer respuestas falsas.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend de GridPlay escuchando en puerto ${PORT}`);
  // Deja listos los links de pago: el primer usuario que paga después de un arranque no espera a Mercado Pago.
  for (const nombre of Object.keys(PLANES)) {
    linkDelPlan(nombre).catch((error) => console.warn(`No se pudo precalentar el plan ${nombre}:`, error?.message || error));
  }
  console.log(correoConfigurado() ? 'Avisos por mail: encendidos' : 'Avisos por mail: apagados (faltan RESEND_API_KEY / CORREO_REMITENTE)');
  setTimeout(revisarPruebasSinRomper, 60_000).unref();
  setInterval(revisarPruebasSinRomper, 60 * 60_000).unref();
});
