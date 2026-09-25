import { supabase } from './supabase';

// Reseñas de clubes. Las lecturas nunca rompen la pantalla: si la base todavía no tiene las funciones
// (migración pendiente) o falla la red, devuelven "sin datos" y la interfaz muestra "Sin reseñas todavía".

/** Promedio y cantidad por club: { [clubId]: { promedio: 4.7, cantidad: 32 } } */
export const resumenPorClub = async (clubIds) => {
  if (!clubIds?.length) return {};
  const { data, error } = await supabase.rpc('resumen_resenas', { p_club_ids: clubIds });
  if (error) {
    console.warn('No se pudieron cargar las calificaciones:', error.message);
    return {};
  }
  return Object.fromEntries((data || []).map((r) => [r.club_id, { promedio: Number(r.promedio), cantidad: Number(r.cantidad) }]));
};

/** Cuántas reseñas hay de cada puntaje: { 5: 20, 4: 8, 3: 1, 2: 0, 1: 0 } */
export const distribucionDeClub = async (clubId) => {
  const base = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const { data, error } = await supabase.rpc('distribucion_resenas', { p_club_id: clubId });
  if (error) return base;
  for (const fila of data || []) base[fila.estrellas] = Number(fila.cantidad);
  return base;
};

/** Reseñas paginadas del club (más nuevas primero). Devuelve [] si falla. */
export const resenasDeClub = async (clubId, { limite = 10, desde = 0 } = {}) => {
  const { data, error } = await supabase.rpc('resenas_club', { p_club_id: clubId, p_limite: limite, p_desde: desde });
  if (error) return [];
  return data || [];
};

/** Reseñas propias de los clubes indicados: { [clubId]: { estrellas, comentario } } */
export const misResenas = async (clubIds) => {
  if (!clubIds?.length) return {};
  const { data, error } = await supabase.from('resenas').select('club_id, estrellas, comentario').in('club_id', clubIds);
  if (error) return {};
  return Object.fromEntries((data || []).map((r) => [r.club_id, { estrellas: r.estrellas, comentario: r.comentario }]));
};

/** Crea o actualiza la reseña propia. Lanza el error del servidor (SIN_TURNO_JUGADO, ESTRELLAS_INVALIDAS…). */
export const calificarClub = async (clubId, estrellas, comentario) => {
  const { error } = await supabase.rpc('calificar_club', { p_club_id: clubId, p_estrellas: estrellas, p_comentario: comentario || null });
  if (error) throw error;
};

export const borrarMiResena = async (clubId) => {
  const { error } = await supabase.from('resenas').delete().eq('club_id', clubId);
  if (error) throw error;
};
