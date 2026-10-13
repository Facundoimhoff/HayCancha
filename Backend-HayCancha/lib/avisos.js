// Reglas de los avisos automáticos (qué mandar y cuándo). Funciones puras, con pruebas.

const MS_DIA = 86400000;
const DIAS_AVISO_LARGO = 7;
const DIAS_AVISO_CORTO = 2;
// Una prueba vencida hace más que esto no se avisa: evita escribirle a cuentas viejas el día que se enciende el sistema
const DIAS_MAXIMOS_VENCIDA = 5;

/**
 * Qué aviso le corresponde HOY a una suscripción de prueba.
 * Devuelve { tipo, dias } o null. tipo: 'prueba-7' | 'prueba-2' | 'prueba-vencida'.
 * Cada tipo se manda una sola vez (lo garantiza la tabla avisos_enviados); acá solo se decide la ventana.
 */
export function avisoDePrueba(suscripcion, ahora = new Date()) {
  if (!suscripcion || suscripcion.plan !== 'prueba' || suscripcion.estado !== 'activa' || !suscripcion.vence_en) return null;
  const vence = new Date(suscripcion.vence_en);
  if (Number.isNaN(vence.getTime())) return null;

  const restante = vence - ahora;
  if (restante <= 0) {
    return -restante <= DIAS_MAXIMOS_VENCIDA * MS_DIA ? { tipo: 'prueba-vencida', dias: 0 } : null;
  }
  const dias = Math.ceil(restante / MS_DIA);
  if (dias <= DIAS_AVISO_CORTO) return { tipo: 'prueba-2', dias };
  if (dias <= DIAS_AVISO_LARGO) return { tipo: 'prueba-7', dias };
  return null;
}

/** ¿La cuenta tiene un plan pago vigente? (mismo criterio que private.suscripcion_vigente, sin contar la prueba) */
export function tienePlanPago(filas, ahora = new Date()) {
  return (filas || []).some((f) => f.plan !== 'prueba' && (
    (f.estado === 'activa' && (!f.vence_en || new Date(f.vence_en) > ahora))
    || (f.estado === 'cancelada' && f.vence_en && new Date(f.vence_en) > ahora)
  ));
}

/** Total de una reserva: cancha + extras (los extras guardan su subtotal ya calculado por la base). */
export function totalDeReserva(turno) {
  const extras = Array.isArray(turno?.extras) ? turno.extras : [];
  return (Number(turno?.precio_final) || 0) + extras.reduce((a, e) => a + (Number(e?.subtotal) || 0), 0);
}

/** Solo se avisa de reservas recién hechas: evita que alguien dispare mails de turnos viejos. */
export function esReciente(creado, ahora = new Date(), minutos = 30) {
  const fecha = new Date(creado);
  return !Number.isNaN(fecha.getTime()) && ahora - fecha >= 0 && ahora - fecha <= minutos * 60000;
}
