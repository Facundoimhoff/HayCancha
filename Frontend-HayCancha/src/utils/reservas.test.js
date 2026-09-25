import test from 'node:test';
import assert from 'node:assert/strict';
import {
  proximosDias, fechaLarga, cuandoEs, totalDeTurno, totalSeleccion, extrasParaEnviar, cantidadesDesdeExtras,
  enlaceWhatsApp, enlaceMapa, enlaceCalendario, precioDesde, deportesDelClub, yaEmpezo, partesDeFecha, fechaCorta,
} from './reservas.js';
import { filtrarYOrdenar, FILTROS_INICIALES } from './filtrosClubes.js';

const ahora = new Date(2026, 8, 30, 15, 30); // 30/09/2026 15:30 (miércoles)

test('proximosDias arranca hoy y marca Hoy/Mañana', () => {
  const dias = proximosDias(14, ahora);
  assert.equal(dias.length, 14);
  assert.deepEqual(dias[0], { fecha: '2026-09-30', corto: 'mié', numero: 30, mes: 'sep', etiqueta: 'Hoy' });
  assert.equal(dias[1].etiqueta, 'Mañana');
  assert.equal(dias[2].etiqueta, null);
  assert.equal(dias[2].fecha, '2026-10-02');
});

test('fechaLarga y cuandoEs', () => {
  assert.equal(fechaLarga('2026-09-30', ahora), 'Hoy, miércoles 30 de septiembre');
  assert.equal(fechaLarga('2026-10-01', ahora), 'Mañana, jueves 1 de octubre');
  assert.equal(fechaLarga('2026-10-05', ahora), 'Lunes 5 de octubre');
  assert.equal(cuandoEs('2026-09-30', '20:00', ahora), 'Hoy a las 20:00 hs');
  assert.equal(cuandoEs('2026-09-30', '10:00', ahora), 'Hoy');
  assert.equal(cuandoEs('2026-10-03', '20:00', ahora), 'En 3 días');
  assert.equal(cuandoEs('2026-09-27', '20:00', ahora), 'Hace 3 días');
  assert.deepEqual(partesDeFecha('2026-10-05'), { dia: 5, mes: 'oct', semana: 'lun' });
  assert.equal(fechaCorta('2026-09-30'), 'mié 30 sep');
});

test('yaEmpezo compara con la hora del turno', () => {
  assert.equal(yaEmpezo('2026-09-30', '15:00', ahora), true);
  assert.equal(yaEmpezo('2026-09-30', '16:00', ahora), false);
});

test('totales: cancha + extras y selección del editor', () => {
  const turno = { precio_final: 42000, extras: [{ subtotal: 12000 }, { subtotal: 2500 }] };
  assert.equal(totalDeTurno(turno), 56500);
  assert.equal(totalDeTurno({ precio_final: null, extras: null }), 0);
  const productos = [{ id: 1, precio: 6000 }, { id: 2, precio: 2500 }];
  assert.equal(totalSeleccion(productos, { 1: 2, 2: 1 }), 14500);
  assert.deepEqual(extrasParaEnviar({ 1: 2, 2: 0 }), [{ id: 1, cantidad: 2 }, { id: 2, cantidad: 0 }]);
  assert.deepEqual(cantidadesDesdeExtras([{ id: 1, cantidad: 2 }]), { 1: 2 });
});

test('enlaces: WhatsApp, mapa y calendario', () => {
  assert.equal(enlaceWhatsApp('(3564) 60-9641', 'Hola'), 'https://wa.me/3564609641?text=Hola');
  assert.equal(enlaceWhatsApp(''), null);
  assert.match(enlaceMapa({ nombre: 'Club', direccion: 'Cabrera 4012', ciudad: 'Freyre' }), /query=Club%2C%20Cabrera%204012%2C%20Freyre$/);
  assert.equal(enlaceMapa({}), null);
  const url = enlaceCalendario({ fecha: '2026-10-02', hora: '20:00', titulo: 'Fútbol 5', lugar: 'Cabrera 4012' });
  assert.match(url, /dates=20261002T200000%2F20261002T210000/);
  assert.match(url, /ctz=America%2FArgentina%2FCordoba/);
});

const clubes = [
  { id: 'a', nombre: 'A', canchas: [{ deporte: 'Fútbol', precio_hora: 50000, cantidad_jugadores: 10 }] },
  { id: 'b', nombre: 'B', canchas: [{ deporte: 'Pádel', precio_hora: 20000, cantidad_jugadores: 4, techada: true }, { deporte: 'Pádel', precio_hora: 30000, activa: false }] },
  { id: 'c', nombre: 'C', deporte: 'Tenis', precio_hora: 10000, canchas: [] },
];

test('precioDesde y deportesDelClub', () => {
  assert.equal(precioDesde(clubes[1]), 20000);
  assert.equal(precioDesde(clubes[2]), 10000);
  assert.equal(precioDesde({}), 0);
  assert.deepEqual(deportesDelClub(clubes[1]), ['Pádel']);
  assert.deepEqual(deportesDelClub(clubes[2]), ['Tenis']);
});

test('filtrarYOrdenar: deporte sin tildes, jugadores, techada', () => {
  assert.deepEqual(filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, deporte: 'Futbol' }).map((c) => c.id), ['a']);
  assert.deepEqual(filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, deporte: 'Pádel' }).map((c) => c.id), ['b']);
  assert.deepEqual(filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, jugadores: '4' }).map((c) => c.id), ['b']);
  assert.deepEqual(filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, techada: true }).map((c) => c.id), ['b']);
});

test('filtrarYOrdenar: orden por precio y por calificación (sin reseñas al final)', () => {
  assert.deepEqual(filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, orden: 'menor' }).map((c) => c.id), ['c', 'b', 'a']);
  assert.deepEqual(filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, orden: 'mayor' }).map((c) => c.id), ['a', 'b', 'c']);
  const resumenes = { a: { promedio: 4.2, cantidad: 30 }, b: { promedio: 4.8, cantidad: 3 } };
  assert.deepEqual(filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, orden: 'mejor' }, resumenes).map((c) => c.id), ['b', 'a', 'c']);
});

test('filtrarYOrdenar no muta la lista original', () => {
  const copia = clubes.map((c) => c.id);
  filtrarYOrdenar(clubes, { ...FILTROS_INICIALES, orden: 'mayor' });
  assert.deepEqual(clubes.map((c) => c.id), copia);
});
