import { supabase } from './supabase';
import { postApi } from './api';

/** Suscripciones de la cuenta (RLS: solo lee las propias). Devuelve [] si falla. */
export const leerMisSuscripciones = async (userId) => {
  const { data, error } = await supabase.from('suscripciones').select('plan, estado, vence_en, monto, created_at').eq('user_id', userId);
  if (error) {
    console.warn('No se pudo leer la suscripción:', error.message);
    return [];
  }
  return data || [];
};

/** Arranca la prueba gratis de 30 días (una sola vez por cuenta). Lanza el error del servidor. */
export const iniciarPrueba = async () => {
  const { error } = await supabase.rpc('iniciar_prueba');
  if (error) throw error;
};

/**
 * Da de baja el plan pago de la cuenta: deja de cobrarse y sigue vigente hasta el fin del período ya pago.
 * Devuelve la fecha hasta la que sigue (ISO). Lanza un Error con el mensaje del servidor.
 */
export const cancelarSuscripcion = async () => {
  const { ok, data } = await postApi('/api/cancelar-suscripcion');
  if (!ok) throw new Error(data?.error || 'No pudimos dar de baja el plan. Intentá de nuevo en unos minutos.');
  return data.vence_en;
};

/** ¿El club puede recibir reservas? Ante cualquier duda (base sin la función, red) responde que sí. */
export const clubRecibeReservas = async (clubId) => {
  const { data, error } = await supabase.rpc('club_recibe_reservas', { p_club_id: clubId });
  return error ? true : data !== false;
};
