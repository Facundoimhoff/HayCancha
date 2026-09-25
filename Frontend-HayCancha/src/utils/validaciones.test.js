import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluarPassword, validarPassword, validarTelefono } from './validaciones.js';

test('evaluarPassword: vacía no tiene fuerza y ninguna regla cumplida', () => {
  const r = evaluarPassword('');
  assert.equal(r.fuerza, 0);
  assert.equal(r.cumplidas, 0);
  assert.equal(r.valida, false);
  assert.equal(r.reglas.length, 5);
});

test('evaluarPassword: marca regla por regla', () => {
  const r = evaluarPassword('hola');
  assert.deepEqual(r.reglas.map((x) => x.cumple), [false, true, false, false, false]);
  assert.equal(r.valida, false);
  assert.equal(r.fuerza, 1);
});

test('evaluarPassword: válida solo si cumple todas y coincide con validarPassword', () => {
  for (const clave of ['Hola123!', 'hola1234', 'HOLA1234!', 'Hola!!!!', 'Ho1!', 'Una-Clave-Muy-Larga-9']) {
    assert.equal(evaluarPassword(clave).valida, validarPassword(clave) === null, clave);
  }
  assert.equal(evaluarPassword('Hola123!').fuerza, 3);
  assert.equal(evaluarPassword('Una-Clave-Muy-Larga-9').fuerza, 4);
});

test('validarTelefono', () => {
  assert.equal(validarTelefono('3564 12-3456'), true);
  assert.equal(validarTelefono('123'), false);
  assert.equal(validarTelefono('abc123456'), false);
});
