// Dirección -> coordenadas con Nominatim (OpenStreetMap). Es gratis y sin clave; pide uso moderado
// (una consulta por acción del usuario, nunca en ráfaga). Las funciones puras tienen pruebas.

const URL_BUSQUEDA = 'https://nominatim.openstreetmap.org/search';
const TIEMPO_MAXIMO_MS = 6000;

const limpiar = (texto) => (texto || '').replace(/\s+/g, ' ').trim();

/** Consultas a probar, de la más precisa a la más general. Sin ciudad y provincia no hay nada que buscar. */
export const armarConsultas = ({ direccion, ciudad, provincia }) => {
  const c = limpiar(ciudad);
  const p = limpiar(provincia);
  if (!c || !p) return [];
  const d = limpiar(direccion);
  const consultas = [];
  if (d) consultas.push({ texto: `${d}, ${c}, ${p}, Argentina`, exacta: true });
  consultas.push({ texto: `${c}, ${p}, Argentina`, exacta: false });
  return consultas;
};

// 5 decimales = poco más de 1 metro
const redondear = (n) => Math.round(n * 1e5) / 1e5;

/** Toma la respuesta de Nominatim (lista) y devuelve { lat, lng } o null. */
export const primerResultado = (respuesta) => {
  const primero = Array.isArray(respuesta) ? respuesta[0] : null;
  const lat = Number(primero?.lat);
  const lng = Number(primero?.lon);
  if (!primero || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: redondear(lat), lng: redondear(lng) };
};

const consultar = async (texto) => {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  try {
    const url = `${URL_BUSQUEDA}?format=jsonv2&limit=1&countrycodes=ar&accept-language=es&q=${encodeURIComponent(texto)}`;
    const r = await fetch(url, { signal: control.signal });
    if (!r.ok) throw new Error(`nominatim ${r.status}`);
    return primerResultado(await r.json());
  } finally {
    clearTimeout(corte);
  }
};

/**
 * Ubica un club por su dirección. Devuelve { lat, lng, exacta } o null si no lo encuentra.
 * exacta=false significa que se ubicó el centro de la ciudad (no se encontró la calle).
 * Lanza error si falla la red.
 */
export const geocodificarClub = async (datos) => {
  for (const { texto, exacta } of armarConsultas(datos)) {
    const punto = await consultar(texto);
    if (punto) return { ...punto, exacta };
  }
  return null;
};
