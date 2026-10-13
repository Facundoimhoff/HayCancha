import crypto from 'node:crypto';

/**
 * Valida la firma de un webhook de Mercado Pago.
 * Header `x-signature`: "ts=<timestamp>,v1=<hmac>". La firma es HMAC-SHA256 (hex) del manifest
 * "id:<data.id en minúsculas>;request-id:<x-request-id>;ts:<ts>;" con la clave secreta del webhook.
 */
export function verificarFirmaMP({ secret, xSignature, xRequestId, dataId }) {
  if (!secret || !xSignature) return false;

  const partes = Object.fromEntries(
    String(xSignature)
      .split(',')
      .map((p) => p.trim().split('='))
      .filter((kv) => kv.length === 2)
  );
  const { ts, v1 } = partes;
  if (!ts || !v1) return false;

  let manifest = '';
  if (dataId) manifest += `id:${String(dataId).toLowerCase()};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const esperada = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(esperada, 'utf8');
  const b = Buffer.from(String(v1), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Estado de una suscripción de Mercado Pago -> estado interno (tabla suscripciones). */
export function estadoDesdeMP(status) {
  switch (status) {
    case 'authorized': return 'activa';
    case 'paused': return 'pausada';
    case 'cancelled': return 'cancelada';
    default: return 'pendiente';
  }
}

const MS_DIA = 86400000;
const MAXIMO_DIAS_PAGOS = 31; // el plan es mensual: nunca queda más de un mes ya pago

/**
 * Hasta cuándo sigue vigente una suscripción que se da de baja: el próximo cobro que ya no se va a hacer
 * (el dueño ya pagó hasta ese día). Si Mercado Pago no informa esa fecha, o ya pasó, la baja corta en el momento.
 * Devuelve la fecha en formato ISO.
 */
export function vigenciaTrasBaja(suscripcion, ahora = new Date()) {
  const proximoCobro = new Date(suscripcion?.next_payment_date ?? NaN);
  if (Number.isNaN(proximoCobro.getTime()) || proximoCobro <= ahora) return ahora.toISOString();
  const tope = new Date(ahora.getTime() + MAXIMO_DIAS_PAGOS * MS_DIA);
  return (proximoCobro < tope ? proximoCobro : tope).toISOString();
}

export const PREFIJO_MOTIVO = 'GridPlay - Plan ';

/** Devuelve el nombre del plan a partir del motivo de la suscripción, o null si no es de GridPlay. */
export function planDesdeMotivo(reason) {
  return typeof reason === 'string' && reason.startsWith(PREFIJO_MOTIVO)
    ? reason.slice(PREFIJO_MOTIVO.length).trim()
    : null;
}

/**
 * Entre los planes que devuelve la búsqueda de Mercado Pago, elige uno reutilizable: activo, con el mismo motivo,
 * precio y back_url. Si cambia el precio o el dominio del frontend, no coincide y se crea uno nuevo.
 */
export function buscarPlanCompatible(planes, { reason, precio, backUrl }) {
  return (planes || []).find((p) =>
    p?.status === 'active'
    && p.reason === reason
    && Number(p.auto_recurring?.transaction_amount) === Number(precio)
    && p.back_url === backUrl
    && typeof p.init_point === 'string' && p.init_point.startsWith('https://')
  ) ?? null;
}

/** Catálogo público de planes (solo lo que el frontend puede mostrar): { Full: { precio: 50000 } } */
export function catalogoPublico(planes) {
  return Object.fromEntries(Object.entries(planes).map(([nombre, { precio }]) => [nombre, { precio }]));
}

/**
 * Deja la dirección del frontend lista para armar la back_url de Mercado Pago, que exige una URL completa:
 * tolera que la variable venga sin "https://", con espacios, comillas o barra final. Si no sirve, usa la de respaldo.
 */
export function origenValido(valor, respaldo) {
  const limpio = String(valor ?? '').trim().replace(/^["']|["']$/g, '').trim();
  if (!limpio) return respaldo;
  try {
    const url = new URL(/^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`);
    return url.hostname.includes('.') ? url.origin : respaldo;
  } catch {
    return respaldo;
  }
}
