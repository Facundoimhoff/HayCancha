// Genera un HTML con los cinco mails automáticos, con datos de ejemplo, para verlos antes de encenderlos.
// Uso: node vista-previa-mails.mjs [archivo-de-salida.html]
import fs from 'node:fs';
import { bienvenidaClub, pruebaPorVencer, pruebaVencida, reservaNuevaClub, reservaConfirmadaJugador, esc } from './lib/plantillas.js';

const sitio = 'https://gridplay-x.vercel.app';
const reserva = {
  club: 'Sport Automóvil Club', cancha: 'Fútbol 5 · Cancha 1', fecha: '2026-10-17', hora: '20:00',
  extras: [{ nombre: 'Agua 500 ml', cantidad: 2, subtotal: 5000 }], total: 47000,
};

const mails = [
  ['Al dueño, al crear el club', bienvenidaClub({ club: 'Sport Automóvil Club', panelUrl: `${sitio}/panel`, enPrueba: true })],
  ['Al dueño, cuando a la prueba le quedan 7 días', pruebaPorVencer({ club: 'Sport Automóvil Club', dias: 7, precio: 50000, panelUrl: `${sitio}/panel` })],
  ['Al dueño, cuando le quedan 2 días', pruebaPorVencer({ club: 'Sport Automóvil Club', dias: 2, precio: 50000, panelUrl: `${sitio}/panel` })],
  ['Al dueño, cuando la prueba venció', pruebaVencida({ club: 'Sport Automóvil Club', precio: 50000, panelUrl: `${sitio}/panel` })],
  ['Al club, por cada reserva nueva', reservaNuevaClub({ ...reserva, jugador: 'Juan Pérez', telefono: '3564 123456', panelUrl: `${sitio}/panel` })],
  ['Al jugador, al confirmar su reserva', reservaConfirmadaJugador({ ...reserva, direccion: 'Cabrera 4012, Freyre', reservasUrl: `${sitio}/mis-reservas` })],
];

const pagina = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mails automáticos de GridPlay</title></head>
<body style="margin:0;padding:24px 12px;background:#0f172a;font-family:Arial,Helvetica,sans-serif">
${mails.map(([cuando, mail]) => `<section style="max-width:600px;margin:0 auto 32px">
  <p style="margin:0 0 4px;color:#94a3b8;font-size:13px">${esc(cuando)}</p>
  <p style="margin:0 0 10px;color:#f8fafc;font-size:15px"><strong>Asunto:</strong> ${esc(mail.asunto)}</p>
  <iframe title="${esc(cuando)}" srcdoc="${esc(mail.html)}" style="width:100%;height:520px;border:0;border-radius:12px;background:#f1f5f9"></iframe>
</section>`).join('\n')}
</body></html>`;

const salida = process.argv[2] || 'vista-previa-mails.html';
fs.writeFileSync(salida, pagina);
console.log('Vista previa escrita en', salida);
