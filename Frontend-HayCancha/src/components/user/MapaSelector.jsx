import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './seccionesLanding.css';

const CENTRO_ARGENTINA = [-36.5, -64];
const ZOOM_ARGENTINA = 4;
const ZOOM_CLUB = 16;

const iconoClub = L.divIcon({ className: 'sc-club', html: '<span></span>', iconSize: [30, 30], iconAnchor: [15, 30] });

// 5 decimales = poco más de 1 metro: alcanza para ubicar la puerta de un club
const redondear = (n) => Math.round(n * 1e5) / 1e5;

/**
 * Mapa para que el dueño del club marque dónde está. Click en el mapa o arrastrar el pin.
 * valor: { lat, lng } | null; foco: { lat, lng, n } (cambia "n" para pedir que el mapa vuele a ese punto).
 */
export default function MapaSelector({ valor, foco, alElegir }) {
  const lienzo = useRef(null);
  const mapa = useRef(null);
  const marcador = useRef(null);
  const alElegirRef = useRef(alElegir);
  useEffect(() => { alElegirRef.current = alElegir; });
  const inicial = useRef(valor);

  useEffect(() => {
    const punto = inicial.current;
    const m = L.map(lienzo.current, {
      center: punto ? [punto.lat, punto.lng] : CENTRO_ARGENTINA,
      zoom: punto ? ZOOM_CLUB : ZOOM_ARGENTINA,
      scrollWheelZoom: false,
      worldCopyJump: true,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(m);
    m.on('click', (e) => alElegirRef.current?.({ lat: redondear(e.latlng.lat), lng: redondear(e.latlng.lng) }));
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; marcador.current = null; };
  }, []);

  // El pin sigue al valor
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    if (!valor) { marcador.current?.remove(); marcador.current = null; return; }
    const punto = [valor.lat, valor.lng];
    if (marcador.current) {
      marcador.current.setLatLng(punto);
      return;
    }
    marcador.current = L.marker(punto, { icon: iconoClub, draggable: true, keyboard: false, title: 'Tu club: arrastralo para ajustar' })
      .on('dragend', (e) => {
        const p = e.target.getLatLng();
        alElegirRef.current?.({ lat: redondear(p.lat), lng: redondear(p.lng) });
      })
      .addTo(m);
  }, [valor]);

  // Vuelo a una búsqueda o a la ubicación actual
  useEffect(() => {
    const m = mapa.current;
    if (!m || !foco) return;
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducido) m.setView([foco.lat, foco.lng], ZOOM_CLUB, { animate: false });
    else m.flyTo([foco.lat, foco.lng], ZOOM_CLUB, { duration: 1 });
  }, [foco]);

  return <div ref={lienzo} className="sc-lienzo sc-lienzo--selector" role="region" aria-label="Mapa para marcar la ubicación de tu club" />;
}
