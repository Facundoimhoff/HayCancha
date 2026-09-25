// Cálculos del panel de administración. Funciones puras (sin React ni Supabase) para poder probarlas.
import { desdeISO, diasEntre, fechaISO, sumarDias, diaMes } from './formato.js';

export const esBloqueo = (t) => t.telefono_cliente === 'BLOQUEO';

const horaEntera = (hora, porDefecto) => {
  const n = parseInt(String(hora ?? '').slice(0, 2), 10);
  return Number.isFinite(n) ? n : porDefecto;
};

/**
 * Suma a cada turno lo necesario para mostrarlo y sumarlo:
 * precio (cancha, congelado al reservar), extras (kiosco) y total. Los bloqueos no facturan.
 */
export function enriquecerTurnos(turnos, canchas) {
  const porId = new Map(canchas.map((c) => [c.id, c]));
  return turnos.map((t) => {
    const cancha = porId.get(t.cancha_id);
    const bloqueo = esBloqueo(t);
    const precio = bloqueo ? 0 : Number(t.precio_final ?? cancha?.precio_hora ?? 0);
    const extrasTotal = bloqueo || !Array.isArray(t.extras)
      ? 0
      : t.extras.reduce((acc, e) => acc + Number(e.subtotal || 0), 0);
    return {
      ...t,
      esBloqueo: bloqueo,
      nombre_cancha: cancha?.nombre || '—',
      deporte: cancha?.deporte,
      precio,
      extrasTotal,
      total: precio + extrasTotal,
    };
  });
}

/** Rango del período elegido y el período anterior de igual duración (para comparar). */
export function rangoPeriodo(clave, hoy = fechaISO()) {
  const d = desdeISO(hoy);

  if (clave === 'hoy') {
    const ayer = sumarDias(hoy, -1);
    return { clave, etiqueta: 'Hoy', desde: hoy, hasta: hoy, desdePrev: ayer, hastaPrev: ayer, comparaCon: 'ayer' };
  }

  if (clave === 'semana') {
    const lunes = sumarDias(hoy, -((d.getDay() + 6) % 7));
    return { clave, etiqueta: 'Esta semana', desde: lunes, hasta: hoy, desdePrev: sumarDias(lunes, -7), hastaPrev: sumarDias(hoy, -7), comparaCon: 'la semana pasada' };
  }

  if (clave === '30d') {
    const desde = sumarDias(hoy, -29);
    return { clave, etiqueta: 'Últimos 30 días', desde, hasta: hoy, desdePrev: sumarDias(desde, -30), hastaPrev: sumarDias(desde, -1), comparaCon: 'los 30 días anteriores' };
  }

  // mes (por defecto): del 1 hasta hoy vs. el mismo tramo del mes anterior
  const primero = fechaISO(new Date(d.getFullYear(), d.getMonth(), 1));
  const ultimoPrev = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
  const primeroPrev = fechaISO(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const hastaPrev = fechaISO(new Date(d.getFullYear(), d.getMonth() - 1, Math.min(d.getDate(), ultimoPrev)));
  return { clave: 'mes', etiqueta: 'Este mes', desde: primero, hasta: hoy, desdePrev: primeroPrev, hastaPrev, comparaCon: 'el mes pasado' };
}

export const enRango = (turnos, desde, hasta) => turnos.filter((t) => t.fecha >= desde && t.fecha <= hasta);

/** Totales de un conjunto de turnos (sin bloqueos). */
export function resumen(turnos) {
  const validos = turnos.filter((t) => !t.esBloqueo);
  const canchas = validos.reduce((a, t) => a + t.precio, 0);
  const kiosco = validos.reduce((a, t) => a + t.extrasTotal, 0);
  const total = canchas + kiosco;
  return {
    canchas,
    kiosco,
    ingresos: total,
    turnos: validos.length,
    ticket: validos.length ? Math.round(total / validos.length) : 0,
  };
}

/** Variación porcentual entre dos valores. `pct` es null cuando no hay base de comparación. */
export function variacion(actual, previo) {
  if (!previo) return { pct: null, direccion: actual > 0 ? 'nuevo' : 'igual' };
  const pct = ((actual - previo) / previo) * 100;
  if (Math.abs(pct) < 0.5) return { pct: 0, direccion: 'igual' };
  return { pct: Math.round(pct), direccion: pct > 0 ? 'sube' : 'baja' };
}

/** Una fila por día del rango (con ceros), para que los gráficos no salteen días sin actividad. */
export function serieDiaria(turnos, desde, hasta) {
  const dias = diasEntre(desde, hasta);
  const mapa = new Map();
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);
    mapa.set(fecha, { fecha, etiqueta: diaMes(fecha), canchas: 0, kiosco: 0, total: 0, turnos: 0 });
  }
  for (const t of turnos) {
    const fila = mapa.get(t.fecha);
    if (!fila || t.esBloqueo) continue;
    fila.canchas += t.precio;
    fila.kiosco += t.extrasTotal;
    fila.total += t.total;
    fila.turnos += 1;
  }
  return [...mapa.values()];
}

/** Ocupación = turnos reservados / horas disponibles (horario de la cancha menos bloqueos). */
export function ocupacionPorCancha(turnos, canchas, desde, hasta) {
  const dias = diasEntre(desde, hasta);
  return canchas.map((c) => {
    const horasPorDia = Math.max(0, horaEntera(c.hora_cierre, 23) - horaEntera(c.hora_apertura, 8));
    const propios = turnos.filter((t) => t.cancha_id === c.id);
    const bloqueados = propios.filter((t) => t.esBloqueo).length;
    const ocupados = propios.filter((t) => !t.esBloqueo).length;
    const disponibles = Math.max(0, horasPorDia * dias - bloqueados);
    const ingresos = propios.reduce((a, t) => a + (t.esBloqueo ? 0 : t.total), 0);
    return {
      id: c.id,
      nombre: c.nombre,
      deporte: c.deporte,
      ocupados,
      disponibles,
      porcentaje: disponibles ? Math.min(100, Math.round((ocupados / disponibles) * 100)) : 0,
      ingresos,
    };
  });
}

export function ocupacionGlobal(porCancha) {
  const ocupados = porCancha.reduce((a, c) => a + c.ocupados, 0);
  const disponibles = porCancha.reduce((a, c) => a + c.disponibles, 0);
  return disponibles ? Math.min(100, Math.round((ocupados / disponibles) * 100)) : 0;
}

/** Matriz día de la semana (lunes=0) × hora con la cantidad de turnos: muestra los horarios más pedidos. */
export function mapaCalor(turnos) {
  const matriz = Array.from({ length: 7 }, () => Array(24).fill(0));
  let max = 0;
  let horaMin = 23;
  let horaMax = 0;
  for (const t of turnos) {
    if (t.esBloqueo) continue;
    const dia = (desdeISO(t.fecha).getDay() + 6) % 7;
    const hora = horaEntera(t.hora_inicio, 0);
    matriz[dia][hora] += 1;
    max = Math.max(max, matriz[dia][hora]);
    horaMin = Math.min(horaMin, hora);
    horaMax = Math.max(horaMax, hora);
  }
  return { matriz, max, horaMin: max ? horaMin : 16, horaMax: max ? horaMax : 23 };
}

/** Clientes agrupados por teléfono, del que más gastó al que menos. */
export function clientesDe(turnos) {
  const mapa = new Map();
  for (const t of turnos) {
    if (t.esBloqueo) continue;
    const actual = mapa.get(t.telefono_cliente) || { nombre: t.nombre_cliente, telefono: t.telefono_cliente, turnos: 0, gastado: 0, ultima: '' };
    actual.turnos += 1;
    actual.gastado += t.total;
    if (t.fecha >= actual.ultima) { actual.ultima = t.fecha; actual.nombre = t.nombre_cliente; }
    mapa.set(t.telefono_cliente, actual);
  }
  return [...mapa.values()].sort((a, b) => b.gastado - a.gastado || b.turnos - a.turnos);
}

const porFechaHora = (a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio);

export const proximosTurnos = (turnos, hoy = fechaISO()) =>
  turnos.filter((t) => t.fecha >= hoy).sort(porFechaHora);

export const historialTurnos = (turnos, hoy = fechaISO()) =>
  turnos.filter((t) => t.fecha < hoy).sort((a, b) => porFechaHora(b, a));

/** Ingresos ya reservados para días posteriores a hoy. */
export const reservadoFuturo = (turnos, hoy = fechaISO()) =>
  resumen(turnos.filter((t) => t.fecha > hoy)).ingresos;
