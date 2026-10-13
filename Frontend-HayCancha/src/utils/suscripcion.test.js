import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoDeSuscripcion, tieneSuscripcionVigente, DIAS_PRUEBA } from './suscripcion.js';

const ahora = new Date('2026-09-26T12:00:00Z');
const enDias = (n) => new Date(ahora.getTime() + n * 86400000).toISOString();
const estado = (campos) => ({ diasRestantes: null, pruebaUsada: false, finaliza: null, motivo: null, ...campos });

test('prueba de 30 días: quedan 30', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'activa', vence_en: enDias(DIAS_PRUEBA) }], ahora);
  assert.deepEqual(r, estado({ tipo: 'prueba', diasRestantes: 30, pruebaUsada: true }));
});

test('prueba: los días se redondean hacia arriba (quedan 2 horas = 1 día)', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'activa', vence_en: new Date(ahora.getTime() + 2 * 3600000).toISOString() }], ahora);
  assert.equal(r.tipo, 'prueba');
  assert.equal(r.diasRestantes, 1);
});

test('prueba vencida sin otra suscripción', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'activa', vence_en: enDias(-1) }], ahora);
  assert.deepEqual(r, estado({ tipo: 'vencida', diasRestantes: 0, pruebaUsada: true, motivo: 'prueba' }));
  assert.equal(tieneSuscripcionVigente([{ plan: 'prueba', estado: 'activa', vence_en: enDias(-1) }], ahora), false);
});

test('plan pago activo gana sobre una prueba vencida', () => {
  const r = estadoDeSuscripcion([
    { plan: 'prueba', estado: 'activa', vence_en: enDias(-10) },
    { plan: 'Full', estado: 'activa', vence_en: null },
  ], ahora);
  assert.deepEqual(r, estado({ tipo: 'pago', pruebaUsada: true }));
});

test('plan "legado" cuenta como pago', () => {
  assert.equal(estadoDeSuscripcion([{ plan: 'legado', estado: 'activa', vence_en: null }], ahora).tipo, 'pago');
});

test('plan pago cancelado o pausado: vencida, y el motivo es el plan', () => {
  for (const fila of [
    { plan: 'Full', estado: 'cancelada', vence_en: null },
    { plan: 'Full', estado: 'cancelada', vence_en: enDias(-1) },
    { plan: 'Full', estado: 'pausada', vence_en: null },
    { plan: 'Full', estado: 'pendiente', vence_en: null },
  ]) {
    assert.deepEqual(estadoDeSuscripcion([fila], ahora), estado({ tipo: 'vencida', diasRestantes: 0, motivo: 'plan' }));
    assert.equal(tieneSuscripcionVigente([fila], ahora), false);
  }
});

test('baja pedida: el plan sigue hasta el fin del período ya pago', () => {
  const filas = [{ plan: 'prueba', estado: 'activa', vence_en: enDias(-40) }, { plan: 'Full', estado: 'cancelada', vence_en: enDias(12) }];
  assert.deepEqual(estadoDeSuscripcion(filas, ahora), estado({ tipo: 'pago', diasRestantes: 12, pruebaUsada: true, finaliza: enDias(12) }));
  assert.equal(tieneSuscripcionVigente(filas, ahora), true);
});

test('un plan activo gana sobre una baja anterior', () => {
  const r = estadoDeSuscripcion([{ plan: 'Full', estado: 'cancelada', vence_en: enDias(3) }, { plan: 'Full', estado: 'activa', vence_en: null }], ahora);
  assert.deepEqual(r, estado({ tipo: 'pago' }));
});

test('sin filas: ninguna y sin prueba usada', () => {
  assert.deepEqual(estadoDeSuscripcion([], ahora), estado({ tipo: 'ninguna' }));
  assert.deepEqual(estadoDeSuscripcion(null, ahora), estado({ tipo: 'ninguna' }));
  assert.equal(tieneSuscripcionVigente(null, ahora), false);
});

test('prueba cancelada: cuenta como usada y no como período pago', () => {
  const r = estadoDeSuscripcion([{ plan: 'prueba', estado: 'cancelada', vence_en: enDias(5) }], ahora);
  assert.deepEqual(r, estado({ tipo: 'vencida', diasRestantes: 0, pruebaUsada: true, motivo: 'prueba' }));
});
