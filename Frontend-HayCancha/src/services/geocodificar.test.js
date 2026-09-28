import test from 'node:test';
import assert from 'node:assert/strict';
import { armarConsultas, primerResultado } from './geocodificar.js';

test('armarConsultas: dirección completa (estructurada + texto libre) y respaldo por ciudad', () => {
  assert.deepEqual(armarConsultas({ direccion: ' Av.  Urquiza 332 ', ciudad: 'San Francisco', provincia: 'Córdoba' }), [
    { estructurada: { calle: 'Av. Urquiza 332', ciudad: 'San Francisco', provincia: 'Córdoba' }, exacta: true },
    { texto: 'Av. Urquiza 332, San Francisco, Córdoba, Argentina', exacta: true },
    { texto: 'San Francisco, Córdoba, Argentina', exacta: false },
  ]);
});

test('armarConsultas: sin dirección solo busca la ciudad', () => {
  assert.deepEqual(armarConsultas({ direccion: '', ciudad: 'Freyre', provincia: 'Córdoba' }), [
    { texto: 'Freyre, Córdoba, Argentina', exacta: false },
  ]);
});

test('armarConsultas: sin ciudad o provincia no hay nada que buscar', () => {
  assert.deepEqual(armarConsultas({ direccion: 'Calle 1', ciudad: '', provincia: 'Córdoba' }), []);
  assert.deepEqual(armarConsultas({ direccion: 'Calle 1', ciudad: 'Freyre', provincia: '  ' }), []);
  assert.deepEqual(armarConsultas({}), []);
});

test('primerResultado: convierte y redondea a 5 decimales', () => {
  assert.deepEqual(primerResultado([{ lat: '-31.424551234', lon: '-62.096081234' }]), { lat: -31.42455, lng: -62.09608 });
});

test('primerResultado: respuestas vacías o inválidas devuelven null', () => {
  assert.equal(primerResultado([]), null);
  assert.equal(primerResultado(null), null);
  assert.equal(primerResultado([{ lat: 'x', lon: '1' }]), null);
  assert.equal(primerResultado([{ lat: '95', lon: '1' }]), null);
});
