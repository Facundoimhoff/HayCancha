import { partirEnRenglones } from '../../../utils/compartir.js';

// Dibuja el cartel con el QR del club en un <canvas>. Dos formatos:
//  - 'a4': para imprimir y pegar en el club (1240 × 1754, A4 a 150 puntos por pulgada)
//  - 'historia': para subir a una historia de Instagram o al estado de WhatsApp (1080 × 1920)
export const FORMATOS = {
  a4: { ancho: 1240, alto: 1754, nombre: 'cartel' },
  historia: { ancho: 1080, alto: 1920, nombre: 'historia' },
};

const OSCURO = '#0d3b36';
const VERDE = '#22c55e';
const TEXTO = '#0f172a';
const GRIS = '#475569';

const fuente = (peso, px, familia = 'Montserrat') => `${peso} ${px}px ${familia}, Arial, sans-serif`;

const rectRedondeado = (ctx, x, y, ancho, alto, radio) => {
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, radio);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, radio);
  ctx.arcTo(x, y + alto, x, y, radio);
  ctx.arcTo(x, y, x + ancho, y, radio);
  ctx.closePath();
};

/** Dibuja el QR módulo por módulo (bordes nítidos a cualquier tamaño). `qr` es el resultado de QRCode.create(). */
const dibujarQR = (ctx, qr, x, y, lado) => {
  const n = qr.modules.size;
  const celda = lado / n;
  ctx.fillStyle = TEXTO;
  for (let fila = 0; fila < n; fila++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.data[fila * n + col]) {
        // +0.5 de solape: sin eso quedan líneas blancas finitas entre módulos al escalar
        ctx.fillRect(x + col * celda, y + fila * celda, celda + 0.5, celda + 0.5);
      }
    }
  }
};

/**
 * Pinta el cartel en `canvas`. Devuelve el canvas.
 * datos: { club, url, qr } — `qr` viene de la librería `qrcode` (QRCode.create(url, { errorCorrectionLevel: 'M' })).
 */
export function dibujarCartel(canvas, formato, { club, url, qr }) {
  const { ancho, alto } = FORMATOS[formato];
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  const u = ancho / 1080; // unidad: todo se pensó sobre 1080 de ancho
  const centro = ancho / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Fondo: franja oscura arriba, clara abajo
  const altoFranja = alto * 0.36;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.fillStyle = OSCURO;
  ctx.fillRect(0, 0, ancho, altoFranja);

  // Título
  ctx.fillStyle = VERDE;
  ctx.font = fuente(800, 34 * u);
  ctx.fillText('SIN LLAMAR · SIN ESPERAR', centro, altoFranja * 0.2);
  ctx.fillStyle = '#ffffff';
  ctx.font = fuente(900, 104 * u);
  ctx.fillText('RESERVÁ', centro, altoFranja * 0.2 + 120 * u);
  ctx.fillText('TU CANCHA', centro, altoFranja * 0.2 + 228 * u);

  // Tarjeta blanca con el QR, montada sobre el borde de la franja
  const ladoTarjeta = Math.min(ancho * 0.66, alto * 0.42);
  const xTarjeta = centro - ladoTarjeta / 2;
  const yTarjeta = altoFranja - ladoTarjeta * 0.22;
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = 50 * u;
  ctx.shadowOffsetY = 18 * u;
  ctx.fillStyle = '#ffffff';
  rectRedondeado(ctx, xTarjeta, yTarjeta, ladoTarjeta, ladoTarjeta, 44 * u);
  ctx.fill();
  ctx.restore();
  const margenQR = ladoTarjeta * 0.09;
  dibujarQR(ctx, qr, xTarjeta + margenQR, yTarjeta + margenQR, ladoTarjeta - margenQR * 2);

  // Instrucción y nombre del club
  let y = yTarjeta + ladoTarjeta + 92 * u;
  ctx.fillStyle = GRIS;
  ctx.font = fuente(600, 38 * u, 'Inter');
  ctx.fillText('Apuntá con la cámara de tu celular', centro, y);
  y += 100 * u;
  ctx.fillStyle = TEXTO;
  ctx.font = fuente(900, 66 * u);
  const renglones = partirEnRenglones(club, (t) => ctx.measureText(t).width, ancho * 0.84, 2);
  for (const renglon of renglones) {
    ctx.fillText(renglon, centro, y);
    y += 78 * u;
  }

  // Pie: dirección corta y marca
  const yPie = alto - 70 * u;
  ctx.fillStyle = GRIS;
  ctx.font = fuente(500, 28 * u, 'Inter');
  ctx.fillText(url.replace(/^https?:\/\//, ''), centro, yPie - 62 * u);
  ctx.font = `italic ${fuente(900, 46 * u)}`;
  const marca = 'GridPlay';
  const anchoMarca = ctx.measureText(marca).width;
  ctx.fillStyle = TEXTO;
  ctx.fillText(marca, centro - 6 * u, yPie);
  ctx.fillStyle = VERDE;
  ctx.fillText('.', centro + anchoMarca / 2 + 4 * u, yPie);

  return canvas;
}

/** Descarga el contenido de un canvas como PNG. */
export const descargarCanvas = (canvas, nombre) => new Promise((resolver, rechazar) => {
  canvas.toBlob((blob) => {
    if (!blob) { rechazar(new Error('No se pudo generar la imagen.')); return; }
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${nombre}.png`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    resolver();
  }, 'image/png');
});
