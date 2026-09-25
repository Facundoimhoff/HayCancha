// Filtros y orden de la lista de clubes (HomeUsuario y Buscar). Funciones puras, con pruebas.
import { precioDesde } from './reservas.js';

export const FILTROS_INICIALES = { deporte: '', jugadores: '', techada: false, orden: '' };

/** Quita tildes y mayúsculas: "Fútbol" -> "futbol". */
export const normalizar = (texto) =>
  (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const algunaCancha = (club, condicion) => (club.canchas || []).some(condicion);

/**
 * clubes: [{ ..., canchas: [...] }]; resumenes: { [clubId]: { promedio, cantidad } }
 * orden: '' (como vienen) | 'mejor' (mejor calificados) | 'menor' | 'mayor' (por precio "desde")
 */
export const filtrarYOrdenar = (clubes, filtros = FILTROS_INICIALES, resumenes = {}) => {
  let lista = [...(clubes || [])];

  if (filtros.deporte) {
    const buscado = normalizar(filtros.deporte);
    lista = lista.filter((c) =>
      normalizar(c.deporte).includes(buscado) || algunaCancha(c, (k) => normalizar(k.deporte).includes(buscado)));
  }

  if (filtros.jugadores) {
    const cantidad = Number(filtros.jugadores);
    lista = lista.filter((c) => c.cantidad_jugadores === cantidad || algunaCancha(c, (k) => k.cantidad_jugadores === cantidad));
  }

  if (filtros.techada) {
    lista = lista.filter((c) => c.techada === true || algunaCancha(c, (k) => k.techada === true));
  }

  if (filtros.orden === 'menor') {
    lista.sort((a, b) => precioDesde(a) - precioDesde(b));
  } else if (filtros.orden === 'mayor') {
    lista.sort((a, b) => precioDesde(b) - precioDesde(a));
  } else if (filtros.orden === 'mejor') {
    // Sin reseñas al final; entre iguales, el que tiene más reseñas
    const puntaje = (c) => resumenes[c.id]?.promedio ?? -1;
    const cantidad = (c) => resumenes[c.id]?.cantidad ?? 0;
    lista.sort((a, b) => puntaje(b) - puntaje(a) || cantidad(b) - cantidad(a));
  }

  return lista;
};

export const hayFiltros = (filtros) => Boolean(filtros.deporte || filtros.jugadores || filtros.techada || filtros.orden);
