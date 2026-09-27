// Estado de la suscripción de un club (prueba gratis, plan pago o sin suscripción). Funciones puras, con pruebas.

export const DIAS_PRUEBA = 30;
const MS_DIA = 86400000;

const vigente = (fila, ahora) => !fila.vence_en || new Date(fila.vence_en) > ahora;

/**
 * filas: [{ plan, estado, vence_en }] (las suscripciones de la cuenta).
 * Devuelve { tipo, diasRestantes, pruebaUsada }:
 *  - 'pago': tiene una suscripción activa y vigente (plan pago o "legado")
 *  - 'prueba': prueba gratis en curso (con los días que quedan, redondeados hacia arriba)
 *  - 'vencida': la prueba terminó y no hay suscripción vigente
 *  - 'ninguna': nunca tuvo nada
 */
export const estadoDeSuscripcion = (filas, ahora = new Date()) => {
  const lista = filas || [];
  const pruebaUsada = lista.some((f) => f.plan === 'prueba');
  const activas = lista.filter((f) => f.estado === 'activa');

  if (activas.some((f) => f.plan !== 'prueba' && vigente(f, ahora))) return { tipo: 'pago', diasRestantes: null, pruebaUsada };

  const prueba = activas.find((f) => f.plan === 'prueba');
  if (prueba) {
    if (!prueba.vence_en) return { tipo: 'prueba', diasRestantes: null, pruebaUsada };
    const restante = new Date(prueba.vence_en) - ahora;
    return restante > 0
      ? { tipo: 'prueba', diasRestantes: Math.ceil(restante / MS_DIA), pruebaUsada }
      : { tipo: 'vencida', diasRestantes: 0, pruebaUsada };
  }
  return { tipo: 'ninguna', diasRestantes: null, pruebaUsada };
};

/** true si puede seguir el registro/usar el panel con normalidad: plan pago o prueba en curso. */
export const tieneSuscripcionVigente = (filas, ahora) => {
  const { tipo } = estadoDeSuscripcion(filas, ahora);
  return tipo === 'pago' || tipo === 'prueba';
};
