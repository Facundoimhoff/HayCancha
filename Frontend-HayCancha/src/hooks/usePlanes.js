import { useEffect, useState } from 'react';
import { getApi } from '../services/api';

// Una sola consulta por carga de página, compartida por todas las pantallas
let consulta = null;
const cargarPlanes = () => {
  consulta ??= getApi('/api/planes').then(({ ok, data }) => {
    if (!ok || !data?.planes) { consulta = null; return null; } // si falló, la próxima pantalla reintenta
    return data.planes;
  });
  return consulta;
};

/** Precio mensual de un plan según el backend. `precio` es null mientras carga o si no hay conexión. */
export function usePrecioPlan(nombre = 'Full') {
  const [precio, setPrecio] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    cargarPlanes().then((planes) => {
      if (cancelado) return;
      setPrecio(planes?.[nombre]?.precio ?? null);
      setCargando(false);
    });
    return () => { cancelado = true; };
  }, [nombre]);

  return { precio, cargando };
}
