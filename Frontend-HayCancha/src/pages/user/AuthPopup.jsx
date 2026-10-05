import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

/**
 * Vuelta del login de Google cuando se abrió en un popup (ver FormularioAcceso). El cliente de
 * Supabase ya procesó el token de la URL al cargar esta página; getSession() espera a que termine.
 * Con ventana que la abrió: solo se cierra (la pestaña principal se entera sola, por localStorage).
 * Sin ventana (el navegador bloqueó el popup y se usó la pestaña entera): sigue a destino.
 */
export default function AuthPopup() {
  const [params] = useSearchParams();

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      if (window.opener) window.close();
      else window.location.href = params.get('volver') || '/';
    });
  }, [params]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>
      Conectando con Google…
    </div>
  );
}
