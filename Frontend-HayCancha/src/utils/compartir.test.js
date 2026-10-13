import test from 'node:test';
import assert from 'node:assert/strict';
import { enlaceDelClub, mensajeParaCompartir, enlaceWhatsAppCompartir, nombreDeArchivo, partirEnRenglones } from './compartir.js';

test('enlaceDelClub arma la dirección de la ficha', () => {
  assert.equal(enlaceDelClub('https://gridplay.app', 'abc-123'), 'https://gridplay.app/club/abc-123');
  assert.equal(enlaceDelClub('https://gridplay.app/', 'a/b'), 'https://gridplay.app/club/a%2Fb');
});

test('el mensaje incluye el club y el link, y viaja bien por WhatsApp', () => {
  const mensaje = mensajeParaCompartir('Sport Club', 'https://gridplay.app/club/1');
  assert.ok(mensaje.includes('Sport Club') && mensaje.endsWith('https://gridplay.app/club/1'));
  assert.ok(mensajeParaCompartir('', 'u').includes('nuestro club'));
  const wa = enlaceWhatsAppCompartir('¡Hola! a&b');
  assert.equal(wa, 'https://wa.me/?text=%C2%A1Hola!%20a%26b');
});

test('nombreDeArchivo saca acentos, espacios y símbolos', () => {
  assert.equal(nombreDeArchivo('Sport Automóvil Club'), 'sport-automovil-club');
  assert.equal(nombreDeArchivo('  Pádel & Fútbol / 5 '), 'padel-futbol-5');
  assert.equal(nombreDeArchivo('???'), 'club');
  assert.equal(nombreDeArchivo(null), 'club');
});

test('partirEnRenglones respeta el ancho y corta con puntos suspensivos', () => {
  const medir = (t) => t.length * 10;
  assert.deepEqual(partirEnRenglones('Sport Club', medir, 200), ['Sport Club']);
  assert.deepEqual(partirEnRenglones('Sport Automóvil Club', medir, 150), ['Sport Automóvil', 'Club']);
  const largo = partirEnRenglones('Complejo Deportivo Municipal Los Amigos del Barrio Norte', medir, 150, 2);
  assert.equal(largo.length, 2);
  assert.ok(largo[1].endsWith('…') && medir(largo[1]) <= 150);
  assert.deepEqual(partirEnRenglones('', medir, 100), []);
  assert.deepEqual(partirEnRenglones('Supercalifragilístico', medir, 50, 1), ['Supercalifragilístico']);
});
