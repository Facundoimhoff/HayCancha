import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/authContext';
import { misFavoritos, marcarFavorito, quitarFavorito } from '../services/favoritos';

/** Set de ids de clubes favoritos del jugador logueado, con un alternar() optimista (revierte si falla). */
export function useFavoritos() {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState(new Set());

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const ids = user ? await misFavoritos() : [];
      if (!cancelado) setFavoritos(new Set(ids));
    })();
    return () => { cancelado = true; };
  }, [user]);

  const alternar = useCallback(async (clubId, nuevoValor) => {
    setFavoritos((actuales) => {
      const siguientes = new Set(actuales);
      if (nuevoValor) siguientes.add(clubId); else siguientes.delete(clubId);
      return siguientes;
    });
    try {
      if (nuevoValor) await marcarFavorito(clubId); else await quitarFavorito(clubId);
    } catch (err) {
      console.error('No se pudo actualizar el favorito:', err);
      setFavoritos((actuales) => {
        const siguientes = new Set(actuales);
        if (nuevoValor) siguientes.delete(clubId); else siguientes.add(clubId);
        return siguientes;
      });
    }
  }, []);

  return { favoritos, esFavorito: (id) => favoritos.has(id), alternar };
}
