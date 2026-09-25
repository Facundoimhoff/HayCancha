import { useEffect, useState } from 'react';
import { postApi } from '../services/api';

/**
 * Inicia el pago de un plan: pide el link a Mercado Pago (vía backend) y redirige.
 * Expone `cargando`, `servidorLento` (tarda más de 3 s: Render está despertando) y `error` para mostrarlos inline.
 */
export function usePagoPlan(plan = 'Full') {
  const [cargando, setCargando] = useState(false);
  const [servidorLento, setServidorLento] = useState(false);
  const [error, setError] = useState('');

  // Al volver atrás desde Mercado Pago el navegador puede restaurar la página con el botón trabado en "cargando"
  useEffect(() => {
    const restaurar = (e) => { if (e.persisted) { setCargando(false); setServidorLento(false); } };
    window.addEventListener('pageshow', restaurar);
    return () => window.removeEventListener('pageshow', restaurar);
  }, []);

  const iniciar = async () => {
    setError('');
    setCargando(true);
    setServidorLento(false);

    // El precio lo define el backend según el plan: el cliente solo indica cuál quiere.
    const { ok, data } = await postApi('/api/crear-suscripcion', { plan }, { onLento: () => setServidorLento(true) });

    if (ok && data?.linkPago) {
      window.location.href = data.linkPago; // a Mercado Pago; el botón queda en "cargando" hasta que cambie la página
      return;
    }

    setError(data?.error || 'No pudimos conectar con Mercado Pago. Intentá de nuevo en unos segundos.');
    setCargando(false);
    setServidorLento(false);
  };

  return { iniciar, cargando, servidorLento, error };
}
