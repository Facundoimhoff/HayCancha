// Dirección -> coordenadas con Nominatim (OpenStreetMap). Es gratis y sin clave; pide uso moderado
// (una consulta por acción del usuario, nunca en ráfaga). Las funciones puras tienen pruebas.

const URL_BUSQUEDA = 'https://nominatim.openstreetmap.org/search';
const TIEMPO_MAXIMO_MS = 6000;

const limpiar = (texto) => (texto || '').replace(/\s+/g, ' ').trim();

/**
 * Consultas a probar, de la más precisa a la más general. Sin ciudad y provincia no hay nada que buscar.
 * La primera va con los campos separados (calle/ciudad/provincia): Nominatim ubica mejor así que con
 * todo junto en un solo texto libre, sobre todo con calles poco comunes o direcciones sobre rutas.
 * La segunda repite lo mismo como texto libre por si la búsqueda estructurada no encuentra nada.
 */
export const armarConsultas = ({ direccion, ciudad, provincia }) => {
  const c = limpiar(ciudad);
  const p = limpiar(provincia);
  if (!c || !p) return [];
  const d = limpiar(direccion);
  const consultas = [];
  if (d) consultas.push({ estructurada: { calle: d, ciudad: c, provincia: p }, exacta: true });
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

/** Arma la URL de Nominatim: con campos separados (más preciso) o con un texto libre. */
const armarUrl = ({ texto, estructurada }) => {
  const params = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'ar', 'accept-language': 'es' });
  if (estructurada) {
    params.set('street', estructurada.calle);
    params.set('city', estructurada.ciudad);
    params.set('state', estructurada.provincia);
    params.set('country', 'Argentina');
  } else {
    params.set('q', texto);
  }
  return `${URL_BUSQUEDA}?${params.toString()}`;
};

const consultar = async (consulta) => {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  try {
    const r = await fetch(armarUrl(consulta), { signal: control.signal });
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
  for (const consulta of armarConsultas(datos)) {
    const punto = await consultar(consulta);
    if (punto) return { ...punto, exacta: consulta.exacta };
  }
  return null;
};
