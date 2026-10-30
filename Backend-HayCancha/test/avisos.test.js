import test from 'node:test';
import assert from 'node:assert/strict';
import { avisoDePrueba, tienePlanPago, totalDeReserva, esReciente } from '../lib/avisos.js';
import { esc, fechaLarga, bienvenidaClub, pruebaPorVencer, pruebaVencida, reservaNuevaClub, reservaConfirmadaJugador } from '../lib/plantillas.js';
import { enviarCorreo, correoConfigurado, mailValido } from '../lib/correo.js';

const ahora = new Date('2026-10-13T12:00:00Z');
const enDias = (n) => new Date(ahora.getTime() + n * 86400000).toISOString();
const prueba = (dias, extra = {}) => ({ plan: 'prueba', estado: 'activa', vence_en: enDias(dias), ...extra });

test('avisoDePrueba: ventanas de 7 días, 2 días y vencida', () => {
  assert.equal(avisoDePrueba(prueba(20), ahora), null);
  assert.equal(avisoDePrueba(prueba(7.5), ahora), null);
  assert.deepEqual(avisoDePrueba(prueba(7), ahora), { tipo: 'prueba-7', dias: 7 });
  assert.deepEqual(avisoDePrueba(prueba(2.5), ahora), { tipo: 'prueba-7', dias: 3 });
  assert.deepEqual(avisoDePrueba(prueba(2), ahora), { tipo: 'prueba-2', dias: 2 });
  assert.deepEqual(avisoDePrueba(prueba(0.1), ahora), { tipo: 'prueba-2', dias: 1 });
  assert.deepEqual(avisoDePrueba(prueba(-0.5), ahora), { tipo: 'prueba-vencida', dias: 0 });
});

test('avisoDePrueba: no molesta a pruebas vencidas hace mucho ni a lo que no es una prueba activa', () => {
  assert.equal(avisoDePrueba(prueba(-6), ahora), null);
  assert.equal(avisoDePrueba(prueba(3, { plan: 'Full' }), ahora), null);
  assert.equal(avisoDePrueba(prueba(3, { estado: 'cancelada' }), ahora), null);
  assert.equal(avisoDePrueba({ plan: 'prueba', estado: 'activa', vence_en: null }, ahora), null);
  assert.equal(avisoDePrueba({ plan: 'prueba', estado: 'activa', vence_en: 'basura' }, ahora), null);
  assert.equal(avisoDePrueba(null, ahora), null);
});

test('tienePlanPago: activo, o dado de baja con el período pago vigente', () => {
  assert.equal(tienePlanPago([prueba(3)], ahora), false);
  assert.equal(tienePlanPago([prueba(-3), { plan: 'Full', estado: 'activa', vence_en: null }], ahora), true);
  assert.equal(tienePlanPago([{ plan: 'legado', estado: 'activa', vence_en: null }], ahora), true);
  assert.equal(tienePlanPago([{ plan: 'Full', estado: 'cancelada', vence_en: enDias(5) }], ahora), true);
  assert.equal(tienePlanPago([{ plan: 'Full', estado: 'cancelada', vence_en: enDias(-1) }], ahora), false);
  assert.equal(tienePlanPago([{ plan: 'Full', estado: 'pausada', vence_en: null }], ahora), false);
  assert.equal(tienePlanPago(null, ahora), false);
});

test('totalDeReserva suma la cancha y los extras', () => {
  assert.equal(totalDeReserva({ precio_final: 42000, extras: [{ subtotal: 6000 }, { subtotal: 5000 }] }), 53000);
  assert.equal(totalDeReserva({ precio_final: '42000', extras: null }), 42000);
  assert.equal(totalDeReserva(null), 0);
});

test('esReciente: solo reservas de los últimos 30 minutos', () => {
  assert.equal(esReciente(new Date(ahora.getTime() - 60000).toISOString(), ahora), true);
  assert.equal(esReciente(new Date(ahora.getTime() - 31 * 60000).toISOString(), ahora), false);
  assert.equal(esReciente(new Date(ahora.getTime() + 60000).toISOString(), ahora), false);
  assert.equal(esReciente('basura', ahora), false);
});

test('fechaLarga no depende de la zona horaria del servidor', () => {
  assert.equal(fechaLarga('2026-10-17'), 'sábado 17 de octubre');
  assert.equal(fechaLarga('2026-01-01'), 'jueves 1 de enero');
  assert.equal(fechaLarga('basura'), 'basura');
});

test('plantillas: lo que escribe un usuario no puede inyectar HTML ni encabezados', () => {
  const malo = '<img src=x onerror=alert(1)>"Club"';
  assert.equal(esc(malo), '&lt;img src=x onerror=alert(1)&gt;&quot;Club&quot;');

  const mails = [
    bienvenidaClub({ club: malo, panelUrl: 'https://x.com/panel', enPrueba: true }),
    pruebaPorVencer({ club: malo, dias: 2, precio: 50000, panelUrl: 'https://x.com/panel' }),
    pruebaVencida({ club: malo, precio: 50000, panelUrl: 'https://x.com/panel' }),
    reservaNuevaClub({ club: malo, cancha: malo, fecha: '2026-10-17', hora: '20:00', jugador: malo, telefono: malo, extras: [{ nombre: malo, cantidad: 2 }], total: 1, panelUrl: 'https://x.com/panel' }),
    reservaConfirmadaJugador({ club: malo, cancha: malo, fecha: '2026-10-17', hora: '20:00', direccion: malo, extras: [{ nombre: malo, cantidad: 1 }], total: 1, reservasUrl: 'https://x.com/mis-reservas' }),
  ];
  for (const mail of mails) {
    assert.equal(mail.html.includes('<img'), false);
    assert.equal(/[\r\n]/.test(mail.asunto), false);
    assert.ok(mail.asunto.length <= 80);
    assert.ok(mail.texto.length > 20);
  }
  assert.equal(/[\r\n]/.test(bienvenidaClub({ club: 'Club\r\nBcc: otro@x.com', panelUrl: 'https://x.com' }).asunto), false);
});

test('plantillas: dicen lo que tienen que decir', () => {
  const b = bienvenidaClub({ club: 'Sport Club', panelUrl: 'https://gp.com/panel', enPrueba: true });
  assert.equal(b.asunto, '¡Sport Club ya está en GridPlay!');
  assert.ok(b.html.includes('30 días de prueba gratis') && b.html.includes('https://gp.com/panel'));
  assert.ok(bienvenidaClub({ club: 'X', panelUrl: 'u', enPrueba: false }).texto.includes('Tu plan ya está activo.'));

  assert.equal(pruebaPorVencer({ club: 'Sport Club', dias: 1, precio: 50000, panelUrl: 'u' }).asunto, 'A la prueba gratis de Sport Club le queda 1 día');
  assert.ok(pruebaPorVencer({ club: 'Sport Club', dias: 7, precio: 50000, panelUrl: 'u' }).texto.includes('por $50.000 al mes'));
  assert.equal(pruebaVencida({ club: 'Sport Club', precio: 50000, panelUrl: 'u' }).asunto, 'La prueba gratis de Sport Club terminó');

  const r = reservaNuevaClub({ club: 'Sport Club', cancha: 'Fútbol 5', fecha: '2026-10-17', hora: '20:00', jugador: 'Juan Pérez', telefono: '3564123456', extras: [{ nombre: 'Agua', cantidad: 2 }, { nombre: 'Nada', cantidad: 0 }], total: 47000, panelUrl: 'u' });
  assert.equal(r.asunto, 'Reserva nueva: Fútbol 5, sábado 17 de octubre a las 20:00 hs');
  assert.ok(r.texto.includes('Jugador: Juan Pérez') && r.texto.includes('Extras: 2 × Agua') && r.texto.includes('Total a cobrar: $47.000'));
  assert.equal(r.texto.includes('Nada'), false);

  const j = reservaConfirmadaJugador({ club: 'Sport Club', cancha: 'Fútbol 5', fecha: '2026-10-17', hora: '20:00', direccion: 'Cabrera 4012, Freyre', extras: null, total: 42000, reservasUrl: 'https://gp.com/mis-reservas' });
  assert.ok(j.texto.includes('Dónde: Fútbol 5 · Sport Club') && j.texto.includes('$42.000 (se paga en el club)'));
  assert.equal(j.texto.includes('Extras'), false);
});

test('correo: sin configurar no manda nada, y valida el destinatario', async () => {
  const antes = { clave: process.env.RESEND_API_KEY, remitente: process.env.CORREO_REMITENTE };
  delete process.env.RESEND_API_KEY;
  delete process.env.CORREO_REMITENTE;
  assert.equal(correoConfigurado(), false);
  assert.deepEqual(await enviarCorreo({ para: 'a@b.com', asunto: 'x', html: 'x', texto: 'x' }), { enviado: false, motivo: 'sin-configurar' });

  process.env.RESEND_API_KEY = 'clave-de-prueba';
  process.env.CORREO_REMITENTE = 'GridPlay <avisos@ejemplo.com>';
  for (const malo of [null, undefined, '', 'sin-arroba', 'a@b', 'a@b.com, otro@c.com', 'a@b.com\r\nBcc: x@y.com']) {
    assert.deepEqual(await enviarCorreo({ para: malo, asunto: 'x', html: 'x', texto: 'x' }), { enviado: false, motivo: 'destinatario-invalido' });
  }
  assert.equal(mailValido('dueno@club.com.ar'), true);

  if (antes.clave === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = antes.clave;
  if (antes.remitente === undefined) delete process.env.CORREO_REMITENTE; else process.env.CORREO_REMITENTE = antes.remitente;
});

test('fechaArgentina / horaArgentina: UTC-3 sin horario de verano', async () => {
  const { fechaArgentina, horaArgentina } = await import('../lib/avisos.js');
  const tarde = new Date('2026-10-31T02:30:00Z'); // 23:30 del 30/10 en Argentina
  assert.equal(fechaArgentina(tarde), '2026-10-30');
  assert.equal(fechaArgentina(tarde, 1), '2026-10-31');
  assert.equal(horaArgentina(tarde), 23);
});

test('correspondeRecordatorio: desde las 10 del día anterior, solo reservas de jugadores y no recién hechas', async () => {
  const { correspondeRecordatorio } = await import('../lib/avisos.js');
  const turno = { fecha: '2026-10-31', usuario_id: 'u1', telefono_cliente: '3564', created_at: '2026-10-20T12:00:00Z' };
  const a10 = new Date('2026-10-30T13:00:00Z'); // 10:00 en Argentina
  const a9 = new Date('2026-10-30T12:00:00Z');  // 09:00
  assert.equal(correspondeRecordatorio(turno, a10), true);
  assert.equal(correspondeRecordatorio(turno, a9), false);
  assert.equal(correspondeRecordatorio({ ...turno, fecha: '2026-11-01' }, a10), false);
  assert.equal(correspondeRecordatorio({ ...turno, usuario_id: null }, a10), false); // cargado a mano por el club
  assert.equal(correspondeRecordatorio({ ...turno, telefono_cliente: 'BLOQUEO' }, a10), false);
  assert.equal(correspondeRecordatorio({ ...turno, created_at: '2026-10-30T11:00:00Z' }, a10), false); // reservó hace 2 horas
  assert.equal(correspondeRecordatorio({ ...turno, created_at: '2026-10-30T06:00:00Z' }, a10), true);  // hace 7 horas
});

test('plantillas nuevas: recordatorio, cancelaciones y respuesta escapan lo que escribe el usuario', async () => {
  const { recordatorioJugador, cancelacionClub, cancelacionJugador, respuestaResena } = await import('../lib/plantillas.js');
  const r = recordatorioJugador({ club: 'Club <b>', cancha: 'Cancha 1', fecha: '2026-10-31', hora: '21:00', total: 42000, reservaUrl: 'https://x/mis-reservas?turno=5' });
  assert.match(r.asunto, /^Mañana tenés turno a las 21:00 hs/);
  assert.match(r.html, /Ver o cancelar mi turno/);
  assert.match(r.html, /mis-reservas\?turno=5/);
  assert.ok(!r.html.includes('<b>') && r.html.includes('&lt;b&gt;'));
  const c = cancelacionClub({ club: 'Club', cancha: 'Cancha 1', fecha: '2026-10-31', hora: '21:00', jugador: '<script>', telefono: '1', panelUrl: 'https://x/panel' });
  assert.ok(!c.html.includes('<script>'));
  assert.match(cancelacionJugador({ club: 'Club', cancha: 'C', fecha: '2026-10-31', hora: '21:00', clubUrl: 'https://x/club/1' }).asunto, /Club canceló tu turno/);
  const resp = respuestaResena({ club: 'Club', respuesta: 'Gracias <3', clubUrl: 'https://x/club/1' });
  assert.ok(resp.html.includes('Gracias &lt;3') && resp.texto.includes('Gracias <3'));
});
