import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enriquecerTurnos, rangoPeriodo, enRango, resumen, variacion, serieDiaria,
  ocupacionPorCancha, ocupacionGlobal, mapaCalor, clientesDe, proximosTurnos, historialTurnos, reservadoFuturo,
} from './metricas.js';
import { monedaCompacta, sumarDias, diasEntre, etiquetaDia, iniciales } from './formato.js';

const canchas = [
  { id: 'a', nombre: 'Cancha A', deporte: 'Fútbol', precio_hora: 1000, hora_apertura: '08:00', hora_cierre: '12:00' },
  { id: 'b', nombre: 'Cancha B', deporte: 'Pádel', precio_hora: 500, hora_apertura: null, hora_cierre: null },
];

const crudos = [
  { id: 1, cancha_id: 'a', fecha: '2026-09-10', hora_inicio: '09:00', nombre_cliente: 'Ana', telefono_cliente: '111', precio_final: 1200, extras: [{ subtotal: 300 }, { subtotal: 200 }] },
  { id: 2, cancha_id: 'a', fecha: '2026-09-10', hora_inicio: '10:00', nombre_cliente: 'Beto', telefono_cliente: '222', precio_final: null, extras: null },
  { id: 3, cancha_id: 'a', fecha: '2026-09-11', hora_inicio: '09:00', nombre_cliente: 'Bloqueo por: x', telefono_cliente: 'BLOQUEO', precio_final: null, extras: null },
  { id: 4, cancha_id: 'b', fecha: '2026-09-15', hora_inicio: '20:00', nombre_cliente: 'Ana Pérez', telefono_cliente: '111', precio_final: 500, extras: [{ subtotal: 100 }] },
  { id: 5, cancha_id: 'b', fecha: '2026-08-05', hora_inicio: '20:00', nombre_cliente: 'Carla', telefono_cliente: '333', precio_final: 400, extras: null },
];
const turnos = enriquecerTurnos(crudos, canchas);

test('enriquecer: precio congelado, precio de la cancha como respaldo, extras y bloqueos', () => {
  assert.equal(turnos[0].precio, 1200);
  assert.equal(turnos[0].extrasTotal, 500);
  assert.equal(turnos[0].total, 1700);
  assert.equal(turnos[1].precio, 1000); // sin precio_final: usa el de la cancha
  assert.equal(turnos[2].esBloqueo, true);
  assert.equal(turnos[2].total, 0);
  assert.equal(turnos[3].nombre_cancha, 'Cancha B');
});

test('resumen: no cuenta bloqueos y calcula ticket promedio', () => {
  const r = resumen(turnos);
  assert.equal(r.turnos, 4);
  assert.equal(r.canchas, 1200 + 1000 + 500 + 400); // 3100
  assert.equal(r.kiosco, 600);
  assert.equal(r.ingresos, 3700);
  assert.equal(r.ticket, 925);
});

test('rangoPeriodo: mes compara el mismo tramo del mes anterior', () => {
  const r = rangoPeriodo('mes', '2026-09-15');
  assert.deepEqual([r.desde, r.hasta, r.desdePrev, r.hastaPrev], ['2026-09-01', '2026-09-15', '2026-08-01', '2026-08-15']);
});

test('rangoPeriodo: el mes anterior más corto no se pasa de día (31/03 vs febrero)', () => {
  const r = rangoPeriodo('mes', '2026-03-31');
  assert.equal(r.hastaPrev, '2026-02-28');
});

test('rangoPeriodo: semana arranca el lunes y compara con la anterior', () => {
  // 2026-09-16 es miércoles
  const r = rangoPeriodo('semana', '2026-09-16');
  assert.deepEqual([r.desde, r.hasta, r.desdePrev, r.hastaPrev], ['2026-09-14', '2026-09-16', '2026-09-07', '2026-09-09']);
});

test('rangoPeriodo: hoy y 30 días', () => {
  const h = rangoPeriodo('hoy', '2026-09-16');
  assert.deepEqual([h.desde, h.desdePrev], ['2026-09-16', '2026-09-15']);
  const d = rangoPeriodo('30d', '2026-09-30');
  assert.deepEqual([d.desde, d.hasta, d.desdePrev, d.hastaPrev], ['2026-09-01', '2026-09-30', '2026-08-02', '2026-08-31']);
  assert.equal(diasEntre(d.desde, d.hasta), 30);
  assert.equal(diasEntre(d.desdePrev, d.hastaPrev), 30);
});

test('variacion: sube, baja, igual y sin base', () => {
  assert.deepEqual(variacion(150, 100), { pct: 50, direccion: 'sube' });
  assert.deepEqual(variacion(50, 100), { pct: -50, direccion: 'baja' });
  assert.deepEqual(variacion(100, 100), { pct: 0, direccion: 'igual' });
  assert.deepEqual(variacion(10, 0), { pct: null, direccion: 'nuevo' });
  assert.deepEqual(variacion(0, 0), { pct: null, direccion: 'igual' });
});

test('serieDiaria: incluye los días sin actividad y suma por día', () => {
  const serie = serieDiaria(enRango(turnos, '2026-09-10', '2026-09-12'), '2026-09-10', '2026-09-12');
  assert.equal(serie.length, 3);
  assert.equal(serie[0].total, 1700 + 1000);
  assert.equal(serie[0].turnos, 2);
  assert.equal(serie[1].total, 0); // solo hay un bloqueo
  assert.equal(serie[2].total, 0);
  assert.equal(serie[0].etiqueta, '10/09');
});

test('ocupación: horas disponibles descuentan bloqueos y usa 8-23 si la cancha no tiene horario', () => {
  const enSemana = enRango(turnos, '2026-09-10', '2026-09-11');
  const oc = ocupacionPorCancha(enSemana, canchas, '2026-09-10', '2026-09-11');
  const a = oc.find((c) => c.id === 'a');
  assert.equal(a.disponibles, 4 * 2 - 1); // 4 h por día × 2 días − 1 bloqueo
  assert.equal(a.ocupados, 2);
  assert.equal(a.porcentaje, Math.round((2 / 7) * 100));
  const b = oc.find((c) => c.id === 'b');
  assert.equal(b.disponibles, 15 * 2);
  assert.equal(ocupacionGlobal(oc), Math.round((2 / (7 + 30)) * 100));
});

test('mapaCalor: cuenta por día (lunes=0) y hora, ignora bloqueos', () => {
  const m = mapaCalor(turnos);
  // 2026-09-10 es jueves (3): 09:00 y 10:00
  assert.equal(m.matriz[3][9], 1);
  assert.equal(m.matriz[3][10], 1);
  assert.equal(m.matriz[4][9], 0); // el bloqueo del viernes no cuenta
  assert.equal(m.max, 1);
  assert.equal(m.horaMin, 9);
  assert.equal(m.horaMax, 20);
});

test('clientesDe: agrupa por teléfono, ordena por gasto y toma el nombre más reciente', () => {
  const c = clientesDe(turnos);
  assert.equal(c[0].telefono, '111');
  assert.equal(c[0].turnos, 2);
  assert.equal(c[0].gastado, 1700 + 600);
  assert.equal(c[0].nombre, 'Ana Pérez');
  assert.equal(c[0].ultima, '2026-09-15');
  assert.ok(!c.some((x) => x.telefono === 'BLOQUEO'));
});

test('próximos / historial / reservado a futuro', () => {
  assert.deepEqual(proximosTurnos(turnos, '2026-09-11').map((t) => t.id), [3, 4]);
  assert.deepEqual(historialTurnos(turnos, '2026-09-11').map((t) => t.id), [2, 1, 5]);
  assert.equal(reservadoFuturo(turnos, '2026-09-11'), 600);
});

test('formato', () => {
  assert.equal(monedaCompacta(950), '$950');
  assert.equal(monedaCompacta(85000), '$85k');
  assert.equal(monedaCompacta(1250000), '$1,3M');
  assert.equal(monedaCompacta(12500000), '$13M');
  assert.equal(sumarDias('2026-09-30', 1), '2026-10-01');
  assert.equal(etiquetaDia('2026-09-16', '2026-09-16'), 'Hoy');
  assert.equal(etiquetaDia('2026-09-17', '2026-09-16'), 'Mañana');
  assert.equal(iniciales('lucas pérez gómez'), 'LP');
});
