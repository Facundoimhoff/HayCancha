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

// Respaldo si el backend (Render) está dormido o falla la red: mejor mostrar el precio de
// siempre que dejar al usuario viendo "Consultar" o una carga que nunca llega. Se actualiza
// solo si el backend responde con un valor distinto.
const PRECIOS_RESPALDO = { Full: 50000 };

/** Precio mensual de un plan. Arranca con el valor de respaldo y lo corrige si el backend responde otra cosa. */
export function usePrecioPlan(nombre = 'Full') {
  const [precio, setPrecio] = useState(PRECIOS_RESPALDO[nombre] ?? null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    cargarPlanes().then((planes) => {
      if (cancelado) return;
      const delBackend = planes?.[nombre]?.precio;
      if (delBackend) setPrecio(delBackend);
      setCargando(false);
    });
    return () => { cancelado = true; };
  }, [nombre]);

  return { precio, cargando };
}
