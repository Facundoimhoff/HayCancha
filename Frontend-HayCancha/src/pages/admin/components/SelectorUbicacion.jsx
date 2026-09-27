import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { LocateFixed, Search, Loader2 } from 'lucide-react';
import { geocodificarClub } from '../../../services/geocodificar';

const MapaSelector = lazy(() => import('../../../components/user/MapaSelector'));

const formato = (n) => n.toFixed(5).replace('.', ',');

/**
 * Ubicación del club en el mapa. El pin sale solo a partir de la dirección, la ciudad y la provincia;
 * el dueño puede ajustarlo: click en el mapa, arrastrar el pin, "Buscar mi dirección" o "Estoy en el club".
 * valor: { lat, lng } | null. onCambiar(punto, origen): origen 'auto' (salió de la dirección) o 'manual'.
 */
export default function SelectorUbicacion({ valor, onCambiar, direccion, ciudad, provincia, direccionCambiada }) {
  const [foco, setFoco] = useState(null);
  const [ocupado, setOcupado] = useState('');
  const [aviso, setAviso] = useState('');
  const buscarRef = useRef(null);
  // Al abrir la pantalla, si el club todavía no tiene pin y ya tiene ciudad y provincia, se ubica solo
  const alAbrir = useRef({ sinPin: !valor, hayDatos: Boolean(ciudad?.trim() && provincia?.trim()) });

  const marcar = (punto, origen) => { setAviso(''); onCambiar(punto, origen); };
  const marcarYVolar = (punto, origen) => { marcar(punto, origen); setFoco({ ...punto, n: Date.now() }); };

  const buscar = async () => {
    if (!ciudad?.trim() || !provincia?.trim()) { setAviso('Completá la provincia y la ciudad para buscar tu dirección.'); return; }
    setOcupado('buscar');
    setAviso('');
    try {
      const punto = await geocodificarClub({ direccion, ciudad, provincia });
      if (!punto) {
        setAviso('No encontramos esa dirección. Marcá el lugar haciendo click en el mapa.');
      } else {
        marcarYVolar({ lat: punto.lat, lng: punto.lng }, 'auto');
        setAviso(punto.exacta
          ? 'Ubicamos tu club según su dirección. Revisá que el pin esté en el lugar correcto y tocá “Guardar”.'
          : `No encontramos la calle, así que pusimos el pin en el centro de ${ciudad.trim()}. Arrastralo hasta tu cancha y tocá “Guardar”.`);
      }
    } catch {
      setAviso('No pudimos buscar la dirección ahora. Marcá el lugar haciendo click en el mapa.');
    } finally {
      setOcupado('');
    }
  };

  useEffect(() => { buscarRef.current = buscar; });
  useEffect(() => {
    if (alAbrir.current.sinPin && alAbrir.current.hayDatos) buscarRef.current?.();
  }, []);

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) { setAviso('Tu navegador no permite usar la ubicación.'); return; }
    setOcupado('ubicacion');
    setAviso('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        marcarYVolar({ lat: Math.round(pos.coords.latitude * 1e5) / 1e5, lng: Math.round(pos.coords.longitude * 1e5) / 1e5 }, 'manual');
        setOcupado('');
      },
      (err) => {
        setAviso(err.code === 1 ? 'El permiso de ubicación está bloqueado en tu navegador.' : 'No pudimos obtener tu ubicación.');
        setOcupado('');
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const estado = () => {
    if (aviso) return aviso;
    if (ocupado === 'buscar') return 'Buscando tu dirección…';
    if (!valor) return 'Todavía no hay un pin. Tocá “Buscar mi dirección” o hacé click en el mapa donde queda tu complejo. Los jugadores lo van a ver en la portada.';
    const base = `Pin marcado (${formato(valor.lat)}, ${formato(valor.lng)}). Podés arrastrarlo para ajustarlo. Se guarda con el botón “Guardar”.`;
    return direccionCambiada ? `Cambiaste la dirección: revisá que el pin siga en el lugar correcto o tocá “Buscar mi dirección”. ${base}` : base;
  };

  return (
    <div className="dash-ubicacion">
      <div className="dash-ubicacion-acciones">
        <button type="button" className="dash-btn dash-btn--secundario" onClick={buscar} disabled={ocupado !== ''}>
          {ocupado === 'buscar' ? <Loader2 size={16} className="dash-giro" /> : <Search size={16} />} Buscar mi dirección
        </button>
        <button type="button" className="dash-btn dash-btn--secundario" onClick={usarMiUbicacion} disabled={ocupado !== ''}>
          {ocupado === 'ubicacion' ? <Loader2 size={16} className="dash-giro" /> : <LocateFixed size={16} />} Estoy en el club
        </button>
      </div>

      <Suspense fallback={<div className="sc-lienzo sc-lienzo--selector sc-lienzo--cargando" aria-busy="true" />}>
        <MapaSelector valor={valor} foco={foco} alElegir={(punto) => marcar(punto, 'manual')} />
      </Suspense>

      <p className="dash-ubicacion-estado" aria-live="polite">{estado()}</p>
    </div>
  );
}
