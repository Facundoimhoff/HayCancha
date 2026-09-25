// Enlaces y colores que salen de datos cargados por los clubes. Nunca se arma un href con texto sin validar.

const REDES = {
  instagram: { dominio: 'instagram.com', base: 'https://instagram.com/', usuario: /^[A-Za-z0-9._]{1,30}$/ },
  tiktok: { dominio: 'tiktok.com', base: 'https://www.tiktok.com/@', usuario: /^[A-Za-z0-9._]{1,24}$/ },
  facebook: { dominio: 'facebook.com', base: 'https://www.facebook.com/', usuario: /^[A-Za-z0-9.\-_]{1,50}$/ },
};

const perteneceA = (hostname, dominio) => hostname === dominio || hostname.endsWith(`.${dominio}`);

/**
 * Convierte lo que escribió el club ("@miclub", "miclub" o una URL) en un enlace https seguro de esa red,
 * o null si no es válido. Solo se aceptan URLs https del dominio de la red (nunca javascript:, data:, otros sitios).
 */
export const enlaceRed = (red, valor) => {
  const cfg = REDES[red];
  const texto = String(valor || '').trim();
  if (!cfg || !texto) return null;

  if (/^[a-z][a-z0-9+.-]*:/i.test(texto) || texto.startsWith('//')) {
    try {
      const url = new URL(texto);
      return url.protocol === 'https:' && perteneceA(url.hostname.toLowerCase(), cfg.dominio) ? url.href : null;
    } catch {
      return null;
    }
  }

  const usuario = texto.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  return cfg.usuario.test(usuario) ? `${cfg.base}${usuario}` : null;
};

/** Enlace para escribir un mail (compone en Gmail). null si el correo no parece válido. */
export const enlaceCorreo = (correo) => {
  const c = String(correo || '').trim();
  return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(c)
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c)}`
    : null;
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Color de marca del club si es un hex válido; si no, el neutro oscuro de GridPlay. */
export const colorClub = (hex, porDefecto = '#0f172a') => (HEX.test(String(hex || '').trim()) ? hex.trim() : porDefecto);

/** '#fff' o '#0f172a' según cuál se lee mejor sobre el color dado (luminancia relativa WCAG). */
export const textoSobre = (hex) => {
  const limpio = colorClub(hex).slice(1);
  const c = limpio.length === 3 ? limpio.split('').map((x) => x + x).join('') : limpio;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminancia > 0.35 ? '#0f172a' : '#ffffff';
};

/** Lista de URLs a partir de un campo "url1,url2" (imagen_url / fotos_club), solo https. */
export const listaImagenes = (campo) =>
  String(campo || '').split(',').map((u) => u.trim()).filter((u) => /^https:\/\//i.test(u));
