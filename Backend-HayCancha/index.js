import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';

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

app.get('/health', (_req, res) => res.json({ ok: true }));

// --- RUTA DE PAGOS (MERCADO PAGO) ---
app.post('/api/crear-suscripcion', limitePagos, async (req, res) => {
  const plan = PLANES[req.body?.plan];
  if (!plan) {
    return res.status(400).json({ error: 'Plan inválido' });
  }

  try {
    const preApprovalPlan = new PreApprovalPlan(client);

    const response = await preApprovalPlan.create({
      body: {
        reason: `GridPlay - Plan ${req.body.plan}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.precio,
          currency_id: 'ARS',
        },
        back_url: `${FRONTEND_URL}/onboarding`,
      },
    });

    res.json({ linkPago: response.init_point });
  } catch (error) {
    console.error('Error en Mercado Pago:', error);
    res.status(500).json({ error: 'Fallo al crear la suscripción' });
  }
});

// Las rutas /api/buscar y /api/clubes/:id devolvían datos de prueba fijos y no las usa el frontend
// (consulta Supabase directamente, protegido por RLS): se eliminaron para no exponer respuestas falsas.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend de GridPlay escuchando en puerto ${PORT}`);
});
