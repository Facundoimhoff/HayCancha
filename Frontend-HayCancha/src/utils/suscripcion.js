// Estado de la suscripción de un club (prueba gratis, plan pago o sin suscripción). Funciones puras, con pruebas.

export const DIAS_PRUEBA = 30;
const MS_DIA = 86400000;

const vigente = (fila, ahora) => !fila.vence_en || new Date(fila.vence_en) > ahora;
const diasHasta = (fecha, ahora) => Math.ceil((new Date(fecha) - ahora) / MS_DIA);

/**
 * filas: [{ plan, estado, vence_en }] (las suscripciones de la cuenta).
 * Devuelve { tipo, diasRestantes, pruebaUsada, finaliza, motivo }:
 *  - 'pago': plan pago (o "legado") vigente. Si el dueño pidió la baja, `finaliza` es la fecha hasta la que
 *    sigue (el fin del período ya pago) y `diasRestantes` los días que faltan
 *  - 'prueba': prueba gratis en curso (con los días que quedan, redondeados hacia arriba)
 *  - 'vencida': tuvo una suscripción y ya no hay ninguna vigente; el club no recibe reservas nuevas.
 *    `motivo`: 'prueba' (terminó la prueba gratis) o 'plan' (el plan pago se canceló o se pausó)
 *  - 'ninguna': nunca tuvo nada
 * Tiene que coincidir con private.suscripcion_vigente / private.club_recibe_reservas de la base.
 */
export const estadoDeSuscripcion = (filas, ahora = new Date()) => {
  const lista = filas || [];
  const pruebaUsada = lista.some((f) => f.plan === 'prueba');
  const base = { diasRestantes: null, pruebaUsada, finaliza: null, motivo: null };
  const pagas = lista.filter((f) => f.plan !== 'prueba');

  if (pagas.some((f) => f.estado === 'activa' && vigente(f, ahora))) return { ...base, tipo: 'pago' };

  const enBaja = pagas.find((f) => f.estado === 'cancelada' && f.vence_en && new Date(f.vence_en) > ahora);
  if (enBaja) return { ...base, tipo: 'pago', diasRestantes: diasHasta(enBaja.vence_en, ahora), finaliza: enBaja.vence_en };

  const prueba = lista.find((f) => f.plan === 'prueba' && f.estado === 'activa');
  if (prueba && vigente(prueba, ahora)) {
    return { ...base, tipo: 'prueba', diasRestantes: prueba.vence_en ? diasHasta(prueba.vence_en, ahora) : null };
  }

  if (lista.length) return { ...base, tipo: 'vencida', diasRestantes: 0, motivo: pagas.length ? 'plan' : 'prueba' };
  return { ...base, tipo: 'ninguna' };
};

/** true si puede seguir el registro/usar el panel con normalidad: plan pago o prueba en curso. */
export const tieneSuscripcionVigente = (filas, ahora) => {
  const { tipo } = estadoDeSuscripcion(filas, ahora);
  return tipo === 'pago' || tipo === 'prueba';
};
