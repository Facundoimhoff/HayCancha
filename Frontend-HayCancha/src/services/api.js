import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://haycancha.onrender.com';

/**
 * POST autenticado al backend de GridPlay. Envía el JWT de la sesión de Supabase;
 * el backend lo valida antes de hacer nada. Devuelve { ok, status, data }.
 */
export const postApi = async (ruta, cuerpo = {}) => {
  const { data: { session } } = await supabase.auth.getSession();

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(cuerpo),
  });

  const data = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, status: respuesta.status, data };
};
