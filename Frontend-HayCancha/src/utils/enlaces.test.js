import test from 'node:test';
import assert from 'node:assert/strict';
import { enlaceRed, enlaceCorreo, colorClub, textoSobre, listaImagenes } from './enlaces.js';

test('enlaceRed arma el link desde un usuario o desde una URL de la red', () => {
  assert.equal(enlaceRed('instagram', '@miclub'), 'https://instagram.com/miclub');
  assert.equal(enlaceRed('instagram', 'mi.club_1'), 'https://instagram.com/mi.club_1');
  assert.equal(enlaceRed('tiktok', '@miclub'), 'https://www.tiktok.com/@miclub');
  assert.equal(enlaceRed('facebook', 'Mi-Club'), 'https://www.facebook.com/Mi-Club');
  assert.equal(enlaceRed('instagram', 'https://www.instagram.com/miclub/'), 'https://www.instagram.com/miclub/');
});

test('enlaceRed rechaza esquemas peligrosos, otros dominios y basura', () => {
  assert.equal(enlaceRed('instagram', "javascript:alert('http')"), null);
  assert.equal(enlaceRed('instagram', 'data:text/html,http'), null);
  assert.equal(enlaceRed('instagram', 'http://instagram.com/x'), null);
  assert.equal(enlaceRed('instagram', 'https://evil.com/instagram.com'), null);
  assert.equal(enlaceRed('instagram', 'https://instagram.com.evil.com/x'), null);
  assert.equal(enlaceRed('instagram', '//evil.com'), null);
  assert.equal(enlaceRed('instagram', 'mi club con espacios'), null);
  assert.equal(enlaceRed('instagram', ''), null);
  assert.equal(enlaceRed('twitter', '@x'), null);
});

test('enlaceCorreo', () => {
  assert.equal(enlaceCorreo('club@ejemplo.com'), 'https://mail.google.com/mail/?view=cm&fs=1&to=club%40ejemplo.com');
  assert.equal(enlaceCorreo('no es un correo'), null);
  assert.equal(enlaceCorreo('a@b.com&cc=otro@x.com'), null); // no se puede colar otro destinatario ni parámetros
  assert.equal(enlaceCorreo('a@b.com&bcc=x.com'), 'https://mail.google.com/mail/?view=cm&fs=1&to=a%40b.com%26bcc%3Dx.com'); // si pasa, va codificado
  assert.equal(enlaceCorreo(''), null);
});

test('colorClub valida el hex y textoSobre elige el contraste', () => {
  assert.equal(colorClub('#22c55e'), '#22c55e');
  assert.equal(colorClub('red; background:url(x)'), '#0f172a');
  assert.equal(colorClub(null), '#0f172a');
  assert.equal(textoSobre('#0f172a'), '#ffffff');
  assert.equal(textoSobre('#ffffff'), '#0f172a');
  assert.equal(textoSobre('#facc15'), '#0f172a');
  assert.equal(textoSobre('#1d4ed8'), '#ffffff');
  assert.equal(textoSobre('basura'), '#ffffff');
});

test('listaImagenes deja solo URLs https', () => {
  assert.deepEqual(listaImagenes('https://a.com/1.jpg, https://b.com/2.png ,, javascript:x, http://c.com/3.jpg'), ['https://a.com/1.jpg', 'https://b.com/2.png']);
  assert.deepEqual(listaImagenes(null), []);
});
