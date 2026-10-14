// Turnos fijos: textos y lógica pura que usa el panel (las reglas viven en la migración turnos_fijos).
import { desdeISO, fechaCorta, pluralizar } from './formato.js';

const DIAS_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

/** "Todos los martes a las 20:00" a partir de la fecha del primer turno. */
export const textoRepeticion = (fecha, hora) =>
  fecha ? `Todos los ${DIAS_PLURAL[desdeISO(fecha).getDay()]}${hora ? ` a las ${hora}` : ''}` : '';

/** Descripción corta de una regla guardada (tabla turnos_fijos). */
export const describirTurnoFijo = (fijo) => `Todos los ${DIAS_PLURAL[fijo.dia_semana]} · ${fijo.hora_inicio} hs`;

/** Mensaje para el dueño después de crear un turno fijo. */
export function resumenCreacion({ creados = 0, ocupadas = [] } = {}) {
  const partes = [creados ? `Se cargaron ${pluralizar(creados, 'turno', 'turnos')} de las próximas semanas.` : 'No se pudo cargar ninguna semana: todos esos horarios ya estaban ocupados.'];
  if (ocupadas.length) {
    partes.push(`${ocupadas.length === 1 ? 'Esta fecha ya estaba ocupada y se salteó' : 'Estas fechas ya estaban ocupadas y se saltearon'}: ${ocupadas.map(fechaCorta).join(', ')}.`);
  }
  return partes.join(' ');
}

/** Turnos fijos activos de una cancha que cobran (los bloqueos no tienen precio). */
export const fijosConPrecio = (fijos, canchaId) => fijos.filter((f) => f.cancha_id === canchaId && f.activo && !f.es_bloqueo);

const ERRORES = {
  NO_PERMITIDO: 'No tenés permiso para modificar ese turno fijo.',
  HORA_INVALIDA: 'Revisá la hora.',
  FECHA_INVALIDA: 'Revisá las fechas: el primer turno no puede ser en el pasado y la fecha de fin tiene que ser posterior.',
  NOMBRE_INVALIDO: 'Ingresá el nombre del cliente.',
  TELEFONO_INVALIDO: 'Ingresá un teléfono válido (solo números, entre 6 y 20 dígitos).',
  CLUB_SIN_SUSCRIPCION: 'Tu club no tiene un plan vigente: no se pueden cargar turnos nuevos.',
};

/** Traduce el error de una función de turnos fijos a un mensaje para el dueño. */
export function mensajeTurnoFijo(error, porDefecto = 'No se pudo guardar el turno fijo. Intentá de nuevo.') {
  const texto = `${error?.message || ''} ${error?.code || ''}`;
  if (/PGRST202|PGRST205|42883|42P01/.test(texto)) return 'Los turnos fijos todavía no están activados en tu cuenta. Probá de nuevo más tarde.';
  const codigo = Object.keys(ERRORES).find((c) => texto.includes(c));
  return codigo ? ERRORES[codigo] : porDefecto;
}
