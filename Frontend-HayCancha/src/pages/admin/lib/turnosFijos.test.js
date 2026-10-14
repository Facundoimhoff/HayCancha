import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textoRepeticion, describirTurnoFijo, resumenCreacion, fijosConPrecio, mensajeTurnoFijo } from './turnosFijos.js';

test('textoRepeticion usa el día de la semana de la fecha', () => {
  assert.equal(textoRepeticion('2026-10-20', '20:00'), 'Todos los martes a las 20:00');
  assert.equal(textoRepeticion('2026-10-18'), 'Todos los domingos');
  assert.equal(textoRepeticion(''), '');
});

test('describirTurnoFijo arma el texto de la regla guardada', () => {
  assert.equal(describirTurnoFijo({ dia_semana: 6, hora_inicio: '09:00' }), 'Todos los sábados · 09:00 hs');
});

test('resumenCreacion informa las fechas salteadas', () => {
  assert.equal(resumenCreacion({ creados: 9, ocupadas: [] }), 'Se cargaron 9 turnos de las próximas semanas.');
  assert.equal(
    resumenCreacion({ creados: 8, ocupadas: ['2026-11-03'] }),
    'Se cargaron 8 turnos de las próximas semanas. Esta fecha ya estaba ocupada y se salteó: 03/11/2026.',
  );
  assert.match(resumenCreacion({ creados: 0, ocupadas: ['2026-11-03', '2026-11-10'] }), /^No se pudo cargar ninguna semana.*Estas fechas.*03\/11\/2026, 10\/11\/2026\.$/);
});

test('fijosConPrecio deja afuera bloqueos, inactivos y otras canchas', () => {
  const fijos = [
    { id: 1, cancha_id: 'a', activo: true, es_bloqueo: false },
    { id: 2, cancha_id: 'a', activo: true, es_bloqueo: true },
    { id: 3, cancha_id: 'a', activo: false, es_bloqueo: false },
    { id: 4, cancha_id: 'b', activo: true, es_bloqueo: false },
  ];
  assert.deepEqual(fijosConPrecio(fijos, 'a').map((f) => f.id), [1]);
});

test('mensajeTurnoFijo traduce los códigos de la base', () => {
  assert.equal(mensajeTurnoFijo({ message: 'NO_PERMITIDO' }), 'No tenés permiso para modificar ese turno fijo.');
  assert.match(mensajeTurnoFijo({ code: 'PGRST202', message: 'Could not find the function' }), /todavía no están activados/);
  assert.equal(mensajeTurnoFijo({ message: 'otra cosa' }, 'Por defecto'), 'Por defecto');
});
