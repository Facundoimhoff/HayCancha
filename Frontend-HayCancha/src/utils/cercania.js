// Ubicación del jugador -> ciudad/provincia -> clubes de GridPlay. Funciones puras, con pruebas.
import { normalizar } from './filtrosClubes.js';

const CLAVES_LOCALIDAD = ['city', 'town', 'village', 'municipality', 'city_district', 'suburb', 'county'];

/**
 * Interpreta la respuesta de Nominatim (reverse geocoding) y devuelve
 * { provincia, localidades: [...] } o null si no se pudo ubicar en Argentina.
 * "localidades" son los nombres posibles de la ciudad, del más específico al más general.
 */
export const interpretarDireccion = (respuesta) => {
  const direccion = respuesta?.address;
  if (!direccion || (direccion.country_code && direccion.country_code.toLowerCase() !== 'ar')) return null;

  const provincia = (direccion.state || direccion.region || '').replace(/^Provincia (de |del )?/i, '').trim();
  if (!provincia) return null;

  const localidades = [];
  for (const clave of CLAVES_LOCALIDAD) {
    const nombre = (direccion[clave] || '').replace(/^(Departamento|Partido|Municipio) (de |del )?/i, '').trim();
    // Las pedanías (Córdoba) son subdivisiones rurales, no ciudades donde haya clubes
    if (/^Pedan[ií]a\b/i.test(nombre)) continue;
    if (nombre && !localidades.some((l) => normalizar(l) === normalizar(nombre))) localidades.push(nombre);
  }
  return { provincia, localidades };
};

/**
 * Cruza la ubicación con los clubes cargados (filas { provincia, ciudad }).
 *  - { tipo: 'ciudad', provincia, ciudad }: hay clubes en su ciudad (nombres tal como están en la base)
 *  - { tipo: 'provincia', provincia, ciudades }: hay clubes en su provincia, pero no en su ciudad
 *  - { tipo: 'ninguno' }: todavía no hay clubes en su provincia
 */
export const ubicarEnClubes = (ubicacion, filas) => {
  if (!ubicacion) return { tipo: 'ninguno' };
  const provinciaBuscada = normalizar(ubicacion.provincia);
  const deLaProvincia = (filas || []).filter((f) => f.provincia && f.ciudad && normalizar(f.provincia) === provinciaBuscada);
  if (deLaProvincia.length === 0) return { tipo: 'ninguno' };

  const provincia = deLaProvincia[0].provincia;
  const localidades = ubicacion.localidades.map(normalizar);
  const coincidencia = deLaProvincia.find((f) => localidades.includes(normalizar(f.ciudad)));
  if (coincidencia) return { tipo: 'ciudad', provincia, ciudad: coincidencia.ciudad };

  const ciudades = [...new Set(deLaProvincia.map((f) => f.ciudad))].sort((a, b) => a.localeCompare(b, 'es'));
  return { tipo: 'provincia', provincia, ciudades };
};

// ---------- Distancias ----------
const RADIO_TIERRA_KM = 6371;
const aRadianes = (grados) => (grados * Math.PI) / 180;

const esNumero = (valor) => valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor));

/** true si latitud y longitud son números dentro del rango del planeta. */
export const coordenadasValidas = (lat, lng) =>
  esNumero(lat) && esNumero(lng) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;

/** Distancia en km entre dos puntos { lat, lng } (fórmula del haversine). */
export const distanciaKm = (a, b) => {
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Clubes con ubicación cargada, del más cerca al más lejos del punto { lat, lng }, con "distanciaKm". */
export const ordenarPorCercania = (clubes, punto) =>
  (clubes || [])
    .filter((c) => coordenadasValidas(c.latitud, c.longitud))
    .map((c) => {
      const club = { ...c, latitud: Number(c.latitud), longitud: Number(c.longitud) };
      return { ...club, distanciaKm: distanciaKm(punto, { lat: club.latitud, lng: club.longitud }) };
    })
    .sort((a, b) => a.distanciaKm - b.distanciaKm);

/** "850 m", "3,2 km", "120 km". */
export const formatoDistancia = (km) => {
  if (km < 1) return `${Math.max(10, Math.round(km * 100) * 10)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
};
