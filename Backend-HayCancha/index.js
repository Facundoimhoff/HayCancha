import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import { verificarFirmaMP, estadoDesdeMP, planDesdeMotivo, PREFIJO_MOTIVO } from './lib/mercadopago.js';

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

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gridplay-x.vercel.app';

const limitePagos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
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

// --- 1) INICIAR SUSCRIPCIÓN: devuelve el link de pago de Mercado Pago (requiere sesión) ---
// El plan de Mercado Pago se crea una sola vez por proceso (evita llenar la cuenta de planes repetidos).
const planesMP = new Map();

app.post('/api/crear-suscripcion', limitePagos, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Pagos no disponibles por el momento' });

  const user = await usuarioDeLaSolicitud(req);
  if (!user) return res.status(401).json({ error: 'Iniciá sesión para suscribirte' });

  const nombrePlan = req.body?.plan;
  const plan = PLANES[nombrePlan];
  if (!plan) return res.status(400).json({ error: 'Plan inválido' });

  try {
    if (!planesMP.has(nombrePlan)) {
      const creado = await new PreApprovalPlan(client).create({
        body: {
          reason: `${PREFIJO_MOTIVO}${nombrePlan}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: plan.precio,
            currency_id: 'ARS',
          },
          // MP vuelve acá agregando ?preapproval_id=...; el frontend la verifica con /api/vincular-suscripcion
          back_url: `${FRONTEND_URL}/registro-club`,
        },
      });
      planesMP.set(nombrePlan, creado.init_point);
    }

    res.json({ linkPago: planesMP.get(nombrePlan) });
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

// --- 3) WEBHOOK: Mercado Pago avisa cambios (cancelación, pausa, etc.). Solo actualiza suscripciones ya vinculadas ---
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
    const { error } = await supabaseAdmin
      .from('suscripciones')
      .update({ estado: estadoDesdeMP(suscripcion.status), updated_at: new Date().toISOString() })
      .eq('mp_preapproval_id', suscripcion.id);
    if (error) throw error;
    res.sendStatus(200);
  } catch (error) {
    console.error('Error al procesar el webhook:', error);
    res.sendStatus(500); // Mercado Pago reintenta
  }
});

// Las rutas /api/buscar y /api/clubes/:id devolvían datos de prueba fijos y no las usa el frontend
// (consulta Supabase directamente, protegido por RLS): se eliminaron para no exponer respuestas falsas.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend de GridPlay escuchando en puerto ${PORT}`);
});
