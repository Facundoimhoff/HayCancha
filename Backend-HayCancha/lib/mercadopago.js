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

export const PREFIJO_MOTIVO = 'GridPlay - Plan ';

/** Devuelve el nombre del plan a partir del motivo de la suscripción, o null si no es de GridPlay. */
export function planDesdeMotivo(reason) {
  return typeof reason === 'string' && reason.startsWith(PREFIJO_MOTIVO)
    ? reason.slice(PREFIJO_MOTIVO.length).trim()
    : null;
}
