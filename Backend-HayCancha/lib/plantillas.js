// Textos de los mails automáticos. Funciones puras: reciben datos y devuelven { asunto, html, texto }.
// Todo lo que viene de un usuario (nombre del club, del jugador, de la cancha) pasa por `esc` antes de ir al HTML.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

// El asunto es texto plano: sin saltos de línea (no se pueden colar encabezados) y con largo razonable
const paraAsunto = (valor) => String(valor ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80);

const moneda = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
/** "2026-10-17" -> "sábado 17 de octubre" (sin pasar por zonas horarias: la fecha del turno es la del club) */
export const fechaLarga = (iso) => {
  const [anio, mes, dia] = String(iso || '').split('-').map(Number);
  if (!anio || !mes || !dia) return String(iso || '');
  return `${DIAS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()]} ${dia} de ${MESES[mes - 1]}`;
};

const boton = (url, texto) => `<p style="margin:28px 0"><a href="${esc(url)}" style="background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px;display:inline-block">${esc(texto)}</a></p>`;

const marco = ({ titulo, cuerpo, pie }) => `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <p style="margin:0 0 16px;font-size:20px;font-weight:800;font-style:italic">GridPlay<span style="color:#22c55e">.</span></p>
  <div style="background:#ffffff;border-radius:14px;padding:28px 24px;border:1px solid #e2e8f0">
    <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3">${titulo}</h1>
    <div style="font-size:15px;line-height:1.6;color:#334155">${cuerpo}</div>
  </div>
  <p style="margin:16px 4px 0;font-size:12px;line-height:1.5;color:#64748b">${pie}</p>
</div>
</body></html>`;

const PIE_CLUB = 'Recibís este mail porque tenés un club registrado en GridPlay.';
const PIE_JUGADOR = 'Recibís este mail porque hiciste una reserva con tu cuenta de GridPlay.';

/** Al crear el club. `enPrueba`: true si arrancó con la prueba gratis. */
export function bienvenidaClub({ club, panelUrl, enPrueba, diasPrueba = 30 }) {
  const nombre = club || 'tu club';
  const pasos = [
    'Cargá tus canchas con precio y horarios (Canchas → Agregar cancha).',
    'Completá Mi club: fotos, dirección y el pin en el mapa.',
    'Compartí el link de tu club con tus jugadores para que reserven solos.',
  ];
  return {
    asunto: paraAsunto(`¡${nombre} ya está en GridPlay!`),
    html: marco({
      titulo: `¡${esc(nombre)} ya está en GridPlay!`,
      cuerpo: `<p style="margin:0 0 12px">Tu club quedó creado. ${enPrueba ? `Tenés <strong>${diasPrueba} días de prueba gratis</strong>, sin tarjeta.` : 'Tu plan ya está activo.'}</p>
<p style="margin:0 0 8px">Para empezar a recibir reservas te faltan tres cosas:</p>
<ol style="margin:0;padding-left:20px">${pasos.map((p) => `<li style="margin-bottom:6px">${esc(p)}</li>`).join('')}</ol>
${boton(panelUrl, 'Ir a mi panel')}
<p style="margin:0">¿Dudas? Respondé este mail y te ayudamos.</p>`,
      pie: PIE_CLUB,
    }),
    texto: `¡${nombre} ya está en GridPlay!\n\nTu club quedó creado. ${enPrueba ? `Tenés ${diasPrueba} días de prueba gratis, sin tarjeta.` : 'Tu plan ya está activo.'}\n\nPara empezar a recibir reservas:\n${pasos.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nTu panel: ${panelUrl}\n\n${PIE_CLUB}`,
  };
}

/** A la prueba le quedan pocos días. */
export function pruebaPorVencer({ club, dias, precio, panelUrl }) {
  const nombre = club || 'tu club';
  const quedan = dias === 1 ? 'queda 1 día' : `quedan ${dias} días`;
  const porMes = precio ? ` por ${moneda(precio)} al mes` : '';
  return {
    asunto: paraAsunto(`A la prueba gratis de ${nombre} le ${quedan}`),
    html: marco({
      titulo: `A tu prueba gratis le ${esc(quedan)}`,
      cuerpo: `<p style="margin:0 0 12px">La prueba de <strong>${esc(nombre)}</strong> está por terminar. Cuando termine, tu club deja de recibir reservas nuevas hasta que te suscribas.</p>
<p style="margin:0">Suscribite${esc(porMes)} desde tu panel y seguís sin interrupciones. Sin permanencia: te das de baja cuando quieras, desde el mismo panel.</p>
${boton(panelUrl, 'Suscribirme')}
<p style="margin:0">Tus canchas, tus turnos y tus clientes quedan guardados pase lo que pase.</p>`,
      pie: PIE_CLUB,
    }),
    texto: `A la prueba gratis de ${nombre} le ${quedan}.\n\nCuando termine, tu club deja de recibir reservas nuevas hasta que te suscribas${porMes}. Sin permanencia: te das de baja cuando quieras.\n\nSuscribite desde tu panel: ${panelUrl}\n\nTus datos quedan guardados pase lo que pase.\n\n${PIE_CLUB}`,
  };
}

/** La prueba terminó y no hay plan. */
export function pruebaVencida({ club, precio, panelUrl }) {
  const nombre = club || 'tu club';
  const porMes = precio ? ` por ${moneda(precio)} al mes` : '';
  return {
    asunto: paraAsunto(`La prueba gratis de ${nombre} terminó`),
    html: marco({
      titulo: 'Tu prueba gratis terminó',
      cuerpo: `<p style="margin:0 0 12px"><strong>${esc(nombre)}</strong> ya no está recibiendo reservas nuevas. Tus canchas, turnos y clientes siguen guardados.</p>
<p style="margin:0">Suscribite${esc(porMes)} y tu club vuelve a recibir reservas en el momento.</p>
${boton(panelUrl, 'Reactivar mi club')}
<p style="margin:0">Si GridPlay no te sirvió, contanos por qué respondiendo este mail: nos ayuda a mejorarlo.</p>`,
      pie: PIE_CLUB,
    }),
    texto: `La prueba gratis de ${nombre} terminó.\n\nTu club ya no recibe reservas nuevas. Tus datos siguen guardados.\n\nSuscribite${porMes} y vuelve a recibir reservas en el momento: ${panelUrl}\n\nSi GridPlay no te sirvió, contanos por qué respondiendo este mail.\n\n${PIE_CLUB}`,
  };
}

const lineaExtras = (extras) => (Array.isArray(extras) ? extras : [])
  .filter((e) => e && Number(e.cantidad) > 0)
  .map((e) => `${Number(e.cantidad)} × ${e.nombre}`);

/** Al club: entró una reserva nueva. */
export function reservaNuevaClub({ club, cancha, fecha, hora, jugador, telefono, extras, total, panelUrl }) {
  const cuando = `${fechaLarga(fecha)} a las ${hora} hs`;
  const lista = lineaExtras(extras);
  const filas = [
    ['Cancha', cancha],
    ['Cuándo', cuando],
    ['Jugador', jugador],
    ['Teléfono', telefono],
    ...(lista.length ? [['Extras', lista.join(', ')]] : []),
    ['Total a cobrar', moneda(total)],
  ];
  return {
    asunto: paraAsunto(`Reserva nueva: ${cancha}, ${cuando}`),
    html: marco({
      titulo: 'Tenés una reserva nueva',
      cuerpo: `<p style="margin:0 0 14px">Entró una reserva en <strong>${esc(club)}</strong>:</p>
<table style="width:100%;border-collapse:collapse;font-size:15px">${filas.map(([k, v]) => `<tr><td style="padding:7px 0;color:#64748b;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:7px 0;font-weight:700">${esc(v)}</td></tr>`).join('')}</table>
${boton(panelUrl, 'Ver en mi panel')}`,
      pie: PIE_CLUB,
    }),
    texto: `Tenés una reserva nueva en ${club}\n\n${filas.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nVer en tu panel: ${panelUrl}\n\n${PIE_CLUB}`,
  };
}

/** Al jugador: su reserva quedó confirmada. */
export function reservaConfirmadaJugador({ club, cancha, fecha, hora, direccion, extras, total, reservasUrl }) {
  const cuando = `${fechaLarga(fecha)} a las ${hora} hs`;
  const lista = lineaExtras(extras);
  const filas = [
    ['Dónde', [cancha, club].filter(Boolean).join(' · ')],
    ...(direccion ? [['Dirección', direccion]] : []),
    ['Cuándo', cuando],
    ...(lista.length ? [['Extras', lista.join(', ')]] : []),
    ['Total', `${moneda(total)} (se paga en el club)`],
  ];
  return {
    asunto: paraAsunto(`Reserva confirmada: ${cuando}`),
    html: marco({
      titulo: '¡Tu reserva está confirmada!',
      cuerpo: `<table style="width:100%;border-collapse:collapse;font-size:15px">${filas.map(([k, v]) => `<tr><td style="padding:7px 0;color:#64748b;width:30%;vertical-align:top">${esc(k)}</td><td style="padding:7px 0;font-weight:700">${esc(v)}</td></tr>`).join('')}</table>
${boton(reservasUrl, 'Ver mis reservas')}
<p style="margin:0">Si no podés ir, cancelala desde "Mis reservas" así el horario queda libre para otro.</p>`,
      pie: PIE_JUGADOR,
    }),
    texto: `¡Tu reserva está confirmada!\n\n${filas.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nSi no podés ir, cancelala desde "Mis reservas": ${reservasUrl}\n\n${PIE_JUGADOR}`,
  };
}
