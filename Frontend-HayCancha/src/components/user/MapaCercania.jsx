import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ordenarPorCercania } from '../../utils/cercania';
import './seccionesLanding.css';

const CENTRO_ARGENTINA = [-36.5, -64];
const ZOOM_ARGENTINA = 4;
const CANTIDAD_CERCANOS = 3;

const iconoPosicion = L.divIcon({ className: 'sc-pin', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
const iconoClub = L.divIcon({ className: 'sc-club', html: '<span></span>', iconSize: [30, 30], iconAnchor: [15, 30] });

const reducirMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Mapa de OpenStreetMap (Leaflet) con los clubes que ya cargaron su ubicación.
 * Sin posición del jugador encuadra los clubes; con posición marca el punto y encuadra los más cercanos.
 * clubes: [{ id, nombre, latitud, longitud, ... }] (solo con ubicación válida)
 */
export default function MapaCercania({ posicion, clubes = [], alElegirClub }) {
  const lienzo = useRef(null);
  const mapa = useRef(null);
  const capaClubes = useRef(null);
  const marcador = useRef(null);
  const alElegir = useRef(alElegirClub);
  useEffect(() => { alElegir.current = alElegirClub; });

  useEffect(() => {
    const m = L.map(lienzo.current, {
      center: CENTRO_ARGENTINA,
      zoom: ZOOM_ARGENTINA,
      scrollWheelZoom: false,          // no le roba el scroll a la página
      dragging: !L.Browser.mobile,     // en el celular un dedo desplaza la página, no el mapa
      worldCopyJump: true,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(m);
    capaClubes.current = L.layerGroup().addTo(m);
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; capaClubes.current = null; marcador.current = null; };
  }, []);

  // Pines de los clubes
  useEffect(() => {
    const capa = capaClubes.current;
    if (!capa) return;
    capa.clearLayers();
    for (const club of clubes) {
      L.marker([club.latitud, club.longitud], { icon: iconoClub, title: club.nombre, alt: club.nombre, keyboard: true })
        .on('click', () => alElegir.current?.(club))
        .addTo(capa);
    }
  }, [clubes]);

  // Encuadre: al jugador y sus clubes más cercanos, o a todos los clubes
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    marcador.current?.remove();
    marcador.current = null;

    if (posicion) {
      marcador.current = L.marker([posicion.lat, posicion.lng], { icon: iconoPosicion, interactive: false, keyboard: false }).addTo(m);
    }
    const puntos = posicion
      ? [[posicion.lat, posicion.lng], ...ordenarPorCercania(clubes, posicion).slice(0, CANTIDAD_CERCANOS).map((c) => [c.latitud, c.longitud])]
      : clubes.map((c) => [c.latitud, c.longitud]);
    if (puntos.length === 0) return;

    if (puntos.length === 1) {
      if (reducirMovimiento()) m.setView(puntos[0], 12, { animate: false });
      else m.flyTo(puntos[0], 12, { duration: 1.2 });
      return;
    }
    const opciones = { padding: [50, 50], maxZoom: posicion ? 14 : 10 };
    if (reducirMovimiento() || !posicion) m.fitBounds(puntos, { ...opciones, animate: false });
    else m.flyToBounds(puntos, { ...opciones, duration: 1.2 });
  }, [posicion, clubes]);

  return <div ref={lienzo} className="sc-lienzo" role="region" aria-label="Mapa de clubes" />;
}
