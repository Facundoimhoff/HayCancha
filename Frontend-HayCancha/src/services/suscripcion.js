import { supabase } from './supabase';

/** Suscripciones de la cuenta (RLS: solo lee las propias). Devuelve [] si falla. */
export const leerMisSuscripciones = async (userId) => {
  const { data, error } = await supabase.from('suscripciones').select('plan, estado, vence_en').eq('user_id', userId);
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

/** ¿El club puede recibir reservas? Ante cualquier duda (base sin la función, red) responde que sí. */
export const clubRecibeReservas = async (clubId) => {
  const { data, error } = await supabase.rpc('club_recibe_reservas', { p_club_id: clubId });
  return error ? true : data !== false;
};
