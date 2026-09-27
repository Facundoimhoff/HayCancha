import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretarDireccion, ubicarEnClubes, coordenadasValidas, distanciaKm, ordenarPorCercania, formatoDistancia } from './cercania.js';

const filas = [
  { provincia: 'Córdoba', ciudad: 'Freyre' },
  { provincia: 'Córdoba', ciudad: 'San Francisco' },
  { provincia: 'Córdoba', ciudad: 'San Francisco' },
  { provincia: 'Santa Fe', ciudad: 'Rafaela' },
];

test('interpretarDireccion: pueblo de Córdoba', () => {
  const r = interpretarDireccion({ address: { village: 'Freyre', county: 'Departamento San Justo', state: 'Córdoba', country_code: 'ar' } });
  assert.deepEqual(r, { provincia: 'Córdoba', localidades: ['Freyre', 'San Justo'] });
});

test('interpretarDireccion: saca "Provincia de" y evita repetidos', () => {
  const r = interpretarDireccion({ address: { city: 'Rafaela', municipality: 'rafaela', state: 'Provincia de Santa Fe', country_code: 'ar' } });
  assert.deepEqual(r, { provincia: 'Santa Fe', localidades: ['Rafaela'] });
});

test('interpretarDireccion: descarta las pedanías rurales de Córdoba', () => {
  const r = interpretarDireccion({ address: { municipality: 'Pedanía Libertad', county: 'Departamento San Justo', state: 'Córdoba', country_code: 'ar' } });
  assert.deepEqual(r, { provincia: 'Córdoba', localidades: ['San Justo'] });
});

test('interpretarDireccion: fuera de Argentina o sin provincia devuelve null', () => {
  assert.equal(interpretarDireccion({ address: { city: 'Montevideo', state: 'Montevideo', country_code: 'uy' } }), null);
  assert.equal(interpretarDireccion({ address: { city: 'X', country_code: 'ar' } }), null);
  assert.equal(interpretarDireccion(null), null);
  assert.equal(interpretarDireccion({}), null);
});

test('ubicarEnClubes: club en su ciudad (ignora tildes y mayúsculas)', () => {
  const r = ubicarEnClubes({ provincia: 'cordoba', localidades: ['san francisco'] }, filas);
  assert.deepEqual(r, { tipo: 'ciudad', provincia: 'Córdoba', ciudad: 'San Francisco' });
});

test('ubicarEnClubes: prueba con cada nombre posible de la localidad', () => {
  const r = ubicarEnClubes({ provincia: 'Córdoba', localidades: ['Barrio Norte', 'Freyre'] }, filas);
  assert.equal(r.tipo, 'ciudad');
  assert.equal(r.ciudad, 'Freyre');
});

test('ubicarEnClubes: hay clubes en la provincia pero no en su ciudad', () => {
  const r = ubicarEnClubes({ provincia: 'Córdoba', localidades: ['Villa María'] }, filas);
  assert.deepEqual(r, { tipo: 'provincia', provincia: 'Córdoba', ciudades: ['Freyre', 'San Francisco'] });
});

test('ubicarEnClubes: provincia sin clubes o ubicación desconocida', () => {
  assert.deepEqual(ubicarEnClubes({ provincia: 'Salta', localidades: ['Salta'] }, filas), { tipo: 'ninguno' });
  assert.deepEqual(ubicarEnClubes(null, filas), { tipo: 'ninguno' });
  assert.deepEqual(ubicarEnClubes({ provincia: 'Córdoba', localidades: [] }, []), { tipo: 'ninguno' });
});

test('coordenadasValidas: rango y tipos', () => {
  assert.equal(coordenadasValidas(-31.4, -62.08), true);
  assert.equal(coordenadasValidas('-31.4', '-62.08'), true);
  assert.equal(coordenadasValidas(null, -62), false);
  assert.equal(coordenadasValidas(-31, undefined), false);
  assert.equal(coordenadasValidas('', ''), false);
  assert.equal(coordenadasValidas(91, 0), false);
  assert.equal(coordenadasValidas(0, 181), false);
});

test('distanciaKm: valores conocidos', () => {
  const freyre = { lat: -31.1667, lng: -62.0833 };
  const sanFrancisco = { lat: -31.427, lng: -62.0827 };
  const d = distanciaKm(freyre, sanFrancisco);
  assert.ok(d > 28 && d < 30, `Freyre-San Francisco dio ${d}`);
  const bsas = { lat: -34.6037, lng: -58.3816 };
  const cordoba = { lat: -31.4201, lng: -64.1888 };
  const larga = distanciaKm(bsas, cordoba);
  assert.ok(larga > 640 && larga < 655, `Buenos Aires-Córdoba dio ${larga}`);
  assert.equal(distanciaKm(freyre, freyre), 0);
});

test('ordenarPorCercania: ordena, ignora clubes sin ubicación y no muta la lista', () => {
  const clubes = [
    { id: 'lejos', latitud: -31.427, longitud: -62.0827 },
    { id: 'sin', latitud: null, longitud: null },
    { id: 'cerca', latitud: '-31.17', longitud: '-62.09' },
  ];
  const r = ordenarPorCercania(clubes, { lat: -31.1667, lng: -62.0833 });
  assert.deepEqual(r.map((c) => c.id), ['cerca', 'lejos']);
  assert.ok(r[0].distanciaKm < 1);
  assert.equal(typeof r[0].latitud, 'number');
  assert.equal(clubes[2].latitud, '-31.17');
  assert.deepEqual(ordenarPorCercania(null, { lat: 0, lng: 0 }), []);
});

test('formatoDistancia', () => {
  assert.equal(formatoDistancia(0.004), '10 m');
  assert.equal(formatoDistancia(0.85), '850 m');
  assert.equal(formatoDistancia(3.24), '3,2 km');
  assert.equal(formatoDistancia(28.9), '29 km');
  assert.equal(formatoDistancia(646.3), '646 km');
});
