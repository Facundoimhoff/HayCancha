import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoDeSuscripcion, tieneSuscripcionVigente, DIAS_PRUEBA } from './suscripcion.js';

const ahora = new Date('2026-09-26T12:00:00Z');
const enDias = (n) => new Date(ahora.getTime() + n * 86400000).toISOString();

test('prueba de 30 días: quedan 30', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'activa', vence_en: enDias(DIAS_PRUEBA) }], ahora);
  assert.deepEqual(r, { tipo: 'prueba', diasRestantes: 30, pruebaUsada: true });
});

test('prueba: los días se redondean hacia arriba (quedan 2 horas = 1 día)', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'activa', vence_en: new Date(ahora.getTime() + 2 * 3600000).toISOString() }], ahora);
  assert.equal(r.tipo, 'prueba');
  assert.equal(r.diasRestantes, 1);
});

test('prueba vencida sin otra suscripción', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'activa', vence_en: enDias(-1) }], ahora);
  assert.deepEqual(r, { tipo: 'vencida', diasRestantes: 0, pruebaUsada: true });
  assert.equal(tieneSuscripcionVigente([{ plan: 'prueba', estado: 'activa', vence_en: enDias(-1) }], ahora), false);
});

test('plan pago activo gana sobre una prueba vencida', () => {
  const r = estadoDeSuscripcion([
    { plan: 'prueba', estado: 'activa', vence_en: enDias(-10) },
    { plan: 'Full', estado: 'activa', vence_en: null },
  ], ahora);
  assert.deepEqual(r, { tipo: 'pago', diasRestantes: null, pruebaUsada: true });
});

test('plan "legado" cuenta como pago; una suscripción cancelada no cuenta', () => {
  assert.equal(estadoDeSuscripcion([{ plan: 'legado', estado: 'activa', vence_en: null }], ahora).tipo, 'pago');
  assert.equal(estadoDeSuscripcion([{ plan: 'Full', estado: 'cancelada', vence_en: null }], ahora).tipo, 'ninguna');
  assert.equal(estadoDeSuscripcion([{ plan: 'Full', estado: 'pausada', vence_en: null }], ahora).tipo, 'ninguna');
});

test('sin filas: ninguna y sin prueba usada', () => {
  assert.deepEqual(estadoDeSuscripcion([], ahora), { tipo: 'ninguna', diasRestantes: null, pruebaUsada: false });
  assert.deepEqual(estadoDeSuscripcion(null, ahora), { tipo: 'ninguna', diasRestantes: null, pruebaUsada: false });
  assert.equal(tieneSuscripcionVigente(null, ahora), false);
});

test('prueba cancelada igual cuenta como usada', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'cancelada', vence_en: enDias(5) }], ahora);
  assert.equal(r.tipo, 'ninguna');
  assert.equal(r.pruebaUsada, true);
});
