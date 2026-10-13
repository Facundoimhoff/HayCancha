import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENTOS, datosSeguros, eventoGoogle, eventoMeta, idGoogleValido, idMetaValido } from './eventos.js';

test('datosSeguros descarta todo lo que no esté en la lista (nunca viajan datos personales)', () => {
  assert.deepEqual(
    datosSeguros({ plan: 'Full', modo: 'prueba', valor: 50000, email: 'a@b.com', nombre: 'Juan', telefono: '3564' }),
    { plan: 'Full', modo: 'prueba', valor: 50000 },
  );
  assert.deepEqual(datosSeguros({ valor: NaN, plan: '   ', modo: { x: 1 } }), {});
  assert.deepEqual(datosSeguros(null), {});
  assert.equal(datosSeguros({ deporte: 'x'.repeat(100) }).deporte.length, 40);
});

test('eventoGoogle: el valor viaja como value + currency', () => {
  assert.deepEqual(eventoGoogle(EVENTOS.PLAN_PAGADO, { plan: 'Full', valor: 50000 }), {
    nombre: 'plan_pagado',
    parametros: { plan: 'Full', value: 50000, currency: 'ARS' },
  });
  assert.deepEqual(eventoGoogle(EVENTOS.VER_PLANES), { nombre: 'ver_planes', parametros: {} });
});

test('eventoMeta: traduce a los eventos estándar de Meta', () => {
  assert.equal(eventoMeta(EVENTOS.VER_PLANES).nombre, 'ViewContent');
  assert.equal(eventoMeta(EVENTOS.INICIAR_PAGO).nombre, 'InitiateCheckout');
  assert.equal(eventoMeta(EVENTOS.CLUB_CREADO).nombre, 'Lead');
  assert.equal(eventoMeta(EVENTOS.REGISTRO_JUGADOR).nombre, 'CompleteRegistration');
  assert.equal(eventoMeta(EVENTOS.RESERVA_CONFIRMADA).nombre, 'Schedule');
  assert.deepEqual(eventoMeta(EVENTOS.PLAN_PAGADO, { valor: 15 }), { nombre: 'Subscribe', parametros: { value: 15, currency: 'ARS' }, estandar: true });
});

test('eventoMeta: un evento desconocido va como personalizado', () => {
  assert.deepEqual(eventoMeta('otra_cosa', { modo: 'x' }), { nombre: 'otra_cosa', parametros: { modo: 'x' }, estandar: false });
  assert.equal(eventoMeta('constructor').estandar, false);
});

test('identificadores: solo se aceptan con el formato esperado', () => {
  assert.equal(idGoogleValido('G-ABC123DEF4'), true);
  for (const malo of ['', undefined, 'UA-123', 'G-abc', 'G-1";alert(1)//']) assert.equal(idGoogleValido(malo), false);
  assert.equal(idMetaValido('1234567890123456'), true);
  for (const malo of ['', undefined, '123', '12345678901a', "1234567890');x("]) assert.equal(idMetaValido(malo), false);
});
