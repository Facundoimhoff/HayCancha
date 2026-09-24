import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { AuthContext } from './authContext';

/**
 * Única fuente de verdad de sesión y rol para toda la app.
 * El rol se lee de public.usuarios (solo escribible por el servidor), nunca de user_metadata.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [sesionLista, setSesionLista] = useState(false);
  const [perfil, setPerfil] = useState(null);
  // id del usuario para el que ya se resolvió el perfil (null = pendiente). Evita el parpadeo
  // "hay sesión pero todavía no hay rol" que mandaría a un admin a la pantalla equivocada.
  const [perfilPara, setPerfilPara] = useState(null);
  const [versionPerfil, setVersionPerfil] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSesionLista(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      setSesionLista(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  // El perfil se pide en un efecto aparte: no se deben hacer llamadas a supabase dentro del callback de onAuthStateChange.
  useEffect(() => {
    if (!userId) return undefined;

    let cancelado = false;
    supabase
      .from('usuarios')
      .select('id, nombre_completo, telefono, rol')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return;
        setPerfil(data ?? null);
        setPerfilPara(userId);
      });

    return () => { cancelado = true; };
  }, [userId, versionPerfil]);

  // Se llama después de acciones que cambian el rol en el servidor (ej. registrar_club).
  const recargarPerfil = useCallback(() => {
    setPerfilPara(null);
    setVersionPerfil((v) => v + 1);
  }, []);

  const valor = useMemo(() => {
    // Un perfil solo vale para el usuario con el que se pidió (evita filtrar el rol de una sesión anterior)
    const perfilActual = userId && perfilPara === userId ? perfil : null;
    return {
      session,
      user: session?.user ?? null,
      perfil: perfilActual,
      rol: perfilActual?.rol ?? null,
      cargando: !sesionLista || (userId !== null && perfilPara !== userId),
      recargarPerfil,
    };
  }, [session, perfil, sesionLista, userId, perfilPara, recargarPerfil]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
