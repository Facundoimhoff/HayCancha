import { eventoGoogle, eventoMeta, idGoogleValido, idMetaValido } from '../utils/eventos';

// Medición del sitio: Google Analytics 4 y píxel de Meta (el que usan los anuncios de Instagram).
//  - Solo se cargan si la persona ACEPTÓ las cookies. Si las rechaza o todavía no contestó, no se carga nada.
//  - Los identificadores son públicos y vienen de las variables VITE_GA_ID y VITE_META_PIXEL_ID (Vercel).
//    Sin esas variables, todo esto no hace nada.
const ID_GOOGLE = idGoogleValido(import.meta.env.VITE_GA_ID) ? import.meta.env.VITE_GA_ID : null;
const ID_META = idMetaValido(import.meta.env.VITE_META_PIXEL_ID) ? import.meta.env.VITE_META_PIXEL_ID : null;
const CLAVE_COOKIES = 'gridplay_cookies';

let activa = false;

const consintio = () => {
  try { return localStorage.getItem(CLAVE_COOKIES) === 'accepted'; } catch { return false; }
};

const cargarScript = (src) => {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const iniciarGoogle = () => {
  window.dataLayer = window.dataLayer || [];
  // gtag exige el objeto `arguments` tal cual (no un array)
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // Las vistas de página se mandan a mano en cada cambio de pantalla (es una app de una sola página)
  window.gtag('config', ID_GOOGLE, { send_page_view: false, anonymize_ip: true });
  cargarScript(`https://www.googletagmanager.com/gtag/js?id=${ID_GOOGLE}`);
};

const iniciarMeta = () => {
  if (window.fbq) return;
  const fbq = function fbq() { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  cargarScript('https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', ID_META);
};

/** Enciende la medición si hay consentimiento. Se llama al abrir la app y cuando se aceptan las cookies. */
export const activarAnalitica = () => {
  if (activa || !consintio() || (!ID_GOOGLE && !ID_META)) return;
  activa = true;
  if (ID_GOOGLE) iniciarGoogle();
  if (ID_META) iniciarMeta();
  registrarVista(window.location.pathname);
};

/** Una pantalla vista. Solo la ruta: sin parámetros, que pueden traer el id de un pago. */
export const registrarVista = (ruta) => {
  if (!activa) return;
  if (ID_GOOGLE) window.gtag('event', 'page_view', { page_path: ruta, page_location: window.location.origin + ruta });
  if (ID_META) window.fbq('track', 'PageView');
};

/** Un paso del embudo (ver utils/eventos.js). `datos` admite solo plan, modo, valor y deporte. */
export const registrarEvento = (nombre, datos) => {
  if (!activa) return;
  if (ID_GOOGLE) {
    const google = eventoGoogle(nombre, datos);
    window.gtag('event', google.nombre, google.parametros);
  }
  if (ID_META) {
    const meta = eventoMeta(nombre, datos);
    window.fbq(meta.estandar ? 'track' : 'trackCustom', meta.nombre, meta.parametros);
  }
};
