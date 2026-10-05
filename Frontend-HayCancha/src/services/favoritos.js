import { supabase } from './supabase';

// Favoritos del jugador. Las lecturas nunca rompen la pantalla: si falla la red
// devuelven "sin datos" y la interfaz se comporta como si no hubiera favoritos.

/** IDs de los clubes que el jugador marcó como favoritos. */
export const misFavoritos = async () => {
  const { data, error } = await supabase.from('favoritos').select('club_id');
  if (error) return [];
  return (data || []).map((f) => f.club_id);
};

/** Clubes favoritos completos (para la página de Favoritos), más recientes primero. */
export const misClubesFavoritos = async () => {
  const { data, error } = await supabase
    .from('favoritos')
    .select('club_id, created_at, clubes ( *, canchas ( * ) )')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((f) => f.clubes).filter(Boolean);
};

export const marcarFavorito = async (clubId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('SESION_REQUERIDA');
  const { error } = await supabase.from('favoritos').insert({ usuario_id: user.id, club_id: clubId });
  if (error) throw error;
};

export const quitarFavorito = async (clubId) => {
  const { error } = await supabase.from('favoritos').delete().eq('club_id', clubId);
  if (error) throw error;
};
