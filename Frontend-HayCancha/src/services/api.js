import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://haycancha.onrender.com';

const TIMEOUT_MS = 60_000; // un servidor dormido en Render puede tardar ~30-60 s en despertar
const AVISO_LENTO_MS = 3_000;
const ESTADOS_REINTENTABLES = [502, 503, 504];

/**
 * Despierta el backend en segundo plano (Render duerme el servicio tras un rato sin tráfico).
 * Se llama al entrar a las pantallas de pago para que, cuando el usuario decide pagar, el servidor ya esté listo.
 * No espera ni falla: es solo un GET a /health, como mucho una vez cada 4 minutos.
 */
let ultimoPrecalentado = 0;
export const precalentarApi = () => {
  const ahora = Date.now();
  if (ahora - ultimoPrecalentado < 4 * 60_000) return;
  ultimoPrecalentado = ahora;
  fetch(`${API_URL}/health`, { cache: 'no-store' }).catch(() => {});
};

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/**
 * POST autenticado al backend de GridPlay. Envía el JWT de la sesión de Supabase;
 * el backend lo valida antes de hacer nada. Devuelve { ok, status, data }.
 *
 * - Timeout de 60 s y un reintento si el servidor todavía estaba despertando (red caída, 502/503/504).
 * - `onLento` se ejecuta si la respuesta tarda más de 3 s (para avisar "estamos despertando el servidor").
 * Nunca lanza: un fallo de red devuelve { ok: false, status: 0, data: { error } }.
 */
export const postApi = async (ruta, cuerpo = {}, { onLento } = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const temporizadorLento = onLento ? setTimeout(onLento, AVISO_LENTO_MS) : null;

  const intentar = async () => {
    const control = new AbortController();
    const corte = setTimeout(() => control.abort(), TIMEOUT_MS);
    try {
      const respuesta = await fetch(`${API_URL}${ruta}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(cuerpo),
        signal: control.signal,
      });
      const data = await respuesta.json().catch(() => ({}));
      return { ok: respuesta.ok, status: respuesta.status, data };
    } catch {
      return { ok: false, status: 0, data: { error: 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.' } };
    } finally {
      clearTimeout(corte);
    }
  };

  try {
    let resultado = await intentar();
    if (resultado.status === 0 || ESTADOS_REINTENTABLES.includes(resultado.status)) {
      await esperar(1_500);
      resultado = await intentar();
    }
    return resultado;
  } finally {
    clearTimeout(temporizadorLento);
  }
};
