import { createContext, useContext } from 'react';

export const AuthContext = createContext({
  session: null,
  user: null,
  perfil: null, // fila de public.usuarios (el rol vive acá, no en user_metadata)
  rol: null,
  cargando: true,
  recargarPerfil: () => {},
});

export const useAuth = () => useContext(AuthContext);
