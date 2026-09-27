import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LocateFixed, Loader2, Search, ArrowRight, MapPin, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { interpretarDireccion, ubicarEnClubes, coordenadasValidas, ordenarPorCercania, formatoDistancia } from '../../utils/cercania';
import './seccionesLanding.css';

// El mapa (Leaflet) pesa bastante: se baja recién cuando la sección está por aparecer en pantalla.
const MapaCercania = lazy(() => import('./MapaCercania'));

const CANTIDAD_CERCANOS = 3;

const consultarDireccion = async ({ lat, lng }) => {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), 8000);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=12&accept-language=es&lat=${lat}&lon=${lng}`;
    const r = await fetch(url, { signal: control.signal });
    if (!r.ok) throw new Error(`nominatim ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(corte);
  }
};

// Datos públicos de los clubes para ubicarlos. Si la base todavía no tiene las columnas de coordenadas
// (migración pendiente), se sigue con provincia y ciudad: el mapa queda sin pines pero todo lo demás anda.
const cargarClubes = async () => {
  const completo = await supabase.from('clubes').select('id, nombre, provincia, ciudad, direccion, latitud, longitud');
  if (!completo.error) return completo.data || [];
  const basico = await supabase.from('clubes').select('id, nombre, provincia, ciudad, direccion');
  if (basico.error) throw basico.error;
  return basico.data || [];
};

const MENSAJES_ERROR = {
  denegado: 'No pudimos usar tu ubicación porque el permiso está bloqueado. Podés habilitarlo desde el candado de la barra de direcciones, o buscar por ciudad.',
  error: 'No pudimos ubicarte. Probá de nuevo o buscá por ciudad.',
  'sin-soporte': 'Tu navegador no permite usar la ubicación. Buscá por ciudad.',
};

export default function SeccionCercania() {
  const navigate = useNavigate();
  const seccion = useRef(null);
  const carga = useRef(null);
  const [visible, setVisible] = useState(false);
  const [estado, setEstado] = useState('inicial'); // inicial | buscando | listo | denegado | error | sin-soporte
  const [posicion, setPosicion] = useState(null);
  const [resultado, setResultado] = useState(null); // { ubicacion, cerca } | null si no se supo la ciudad
  const [clubes, setClubes] = useState([]);
  const [elegido, setElegido] = useState(null);
  const [ciudad, setCiudad] = useState('');

  const obtenerClubes = useCallback(() => {
    if (!carga.current) {
      carga.current = cargarClubes().catch((e) => { carga.current = null; throw e; });
    }
    return carga.current;
  }, []);

  useEffect(() => {
    const nodo = seccion.current;
    if (!nodo || typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }
    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) { setVisible(true); observador.disconnect(); }
    }, { rootMargin: '400px' });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  // Los clubes se piden cuando la sección se acerca a la pantalla, así el mapa ya trae los pines
  useEffect(() => {
    if (!visible) return;
    let vigente = true;
    obtenerClubes().then((filas) => { if (vigente) setClubes(filas); }).catch((e) => console.warn('No se pudieron cargar los clubes:', e.message));
    return () => { vigente = false; };
  }, [visible, obtenerClubes]);

  const ubicados = useMemo(
    () => clubes.filter((c) => coordenadasValidas(c.latitud, c.longitud)).map((c) => ({ ...c, latitud: Number(c.latitud), longitud: Number(c.longitud) })),
    [clubes],
  );
  const cercanos = useMemo(
    () => (posicion ? ordenarPorCercania(ubicados, posicion).slice(0, CANTIDAD_CERCANOS) : []),
    [ubicados, posicion],
  );

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) { setEstado('sin-soporte'); return; }
    setEstado('buscando');
    setElegido(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const punto = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosicion(punto);
        try {
          const [direccion, filas] = await Promise.all([consultarDireccion(punto), obtenerClubes()]);
          setClubes(filas);
          const ubicacion = interpretarDireccion(direccion);
          setResultado(ubicacion ? { ubicacion, cerca: ubicarEnClubes(ubicacion, filas) } : null);
        } catch (e) {
          console.warn('No se pudo saber la ciudad:', e.message);
          setResultado(null);
        }
        setEstado('listo');
      },
      (err) => setEstado(err.code === 1 ? 'denegado' : 'error'),
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  const buscarPorCiudad = (e) => {
    e.preventDefault();
    if (ciudad.trim()) navigate(`/buscar?q=${encodeURIComponent(ciudad.trim())}`);
  };

  const irAExplorar = (provincia, nombreCiudad) =>
    navigate(`/explorar/${encodeURIComponent(provincia)}/${encodeURIComponent(nombreCiudad)}`);

  const renderResultado = () => {
    if (estado === 'buscando') {
      return <p className="sc-estado"><Loader2 size={18} className="sc-giro" aria-hidden="true" /><span>Buscando tu ubicación…</span></p>;
    }
    if (MENSAJES_ERROR[estado]) return <p className="sc-estado sc-estado--aviso">{MENSAJES_ERROR[estado]}</p>;
    if (estado !== 'listo') {
      return <p className="sc-estado">Activá tu ubicación y te mostramos los clubes de tu zona{ubicados.length ? ', del más cerca al más lejos' : ''}.</p>;
    }
    if (!resultado) {
      return <p className="sc-estado sc-estado--aviso">Te ubicamos en el mapa, pero no pudimos saber tu ciudad. Escribila acá abajo y buscamos los clubes.</p>;
    }
    const { ubicacion, cerca } = resultado;
    const lugar = ubicacion.localidades[0];

    if (cerca.tipo === 'ciudad') {
      return (
        <div className="sc-resultado">
          <p className="sc-estado"><MapPin size={18} aria-hidden="true" /><span>Estás en <strong>{cerca.ciudad}</strong>, {cerca.provincia}.</span></p>
          <button type="button" className="gp-btn gp-btn--primario sc-cta" onClick={() => irAExplorar(cerca.provincia, cerca.ciudad)}>
            Ver clubes en {cerca.ciudad} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      );
    }
    if (cerca.tipo === 'provincia') {
      return (
        <div className="sc-resultado">
          <p className="sc-estado"><MapPin size={18} aria-hidden="true" /><span>Todavía no hay clubes {lugar ? <>en <strong>{lugar}</strong></> : 'donde estás'}. Estas son las ciudades de {cerca.provincia} que ya están en GridPlay:</span></p>
          <ul className="sc-chips">
            {cerca.ciudades.map((c) => (
              <li key={c}><button type="button" className="sc-chip" onClick={() => irAExplorar(cerca.provincia, c)}>{c}</button></li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="sc-resultado">
        <p className="sc-estado"><MapPin size={18} aria-hidden="true" /><span>Todavía no llegamos a <strong>{ubicacion.provincia}</strong>. ¿Tenés un club allá?</span></p>
        <button type="button" className="gp-btn gp-btn--secundario sc-cta" onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}>
          Sumá tu club a la red
        </button>
      </div>
    );
  };

  return (
    <section className="sc" id="cerca" ref={seccion} aria-labelledby="sc-titulo">
      <div className="sc-contenedor">
        <div className="sc-texto">
          <span className="sc-eyebrow">Cerca tuyo</span>
          <h2 id="sc-titulo" className="sc-titulo">Encontrá clubes cerca de tu ubicación</h2>
          <p className="sc-subtitulo">Compartinos dónde estás y te mostramos los clubes de tu zona en el mapa.</p>

          <button type="button" className="gp-btn gp-btn--primario sc-cta" onClick={usarMiUbicacion} disabled={estado === 'buscando'}>
            <LocateFixed size={18} aria-hidden="true" /> {estado === 'listo' ? 'Actualizar mi ubicación' : 'Usar mi ubicación'}
          </button>
          <p className="sc-privacidad">
            No guardamos tu ubicación. Para saber tu ciudad la consultamos en OpenStreetMap. <Link to="/privacidad">Más info</Link>
          </p>

          <div className="sc-respuesta" aria-live="polite">
            {renderResultado()}
            {estado === 'listo' && cercanos.length > 0 && (
              <div className="sc-cercanos">
                <h3>{cercanos.length === 1 ? 'El club más cercano' : 'Los clubes más cercanos'}</h3>
                <ol>
                  {cercanos.map((c) => (
                    <li key={c.id}>
                      <Link to={`/club/${c.id}`}>
                        <span className="sc-cercano-datos"><strong>{c.nombre}</strong><small>{[c.ciudad, c.provincia].filter(Boolean).join(', ')}</small></span>
                        <span className="sc-cercano-km">{formatoDistancia(c.distanciaKm)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <form className="sc-buscar" onSubmit={buscarPorCiudad}>
            <label htmlFor="sc-ciudad">O buscá por ciudad o club</label>
            <div className="sc-buscar-fila">
              <span className="sc-buscar-campo">
                <Search size={18} aria-hidden="true" />
                <input id="sc-ciudad" type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej: San Francisco" autoComplete="off" />
              </span>
              <button type="submit" className="gp-btn gp-btn--secundario">Buscar</button>
            </div>
          </form>
        </div>

        <div className="sc-mapa">
          {visible ? (
            <Suspense fallback={<div className="sc-lienzo sc-lienzo--cargando" aria-busy="true" />}>
              <MapaCercania posicion={posicion} clubes={ubicados} alElegirClub={setElegido} />
            </Suspense>
          ) : (
            <div className="sc-lienzo sc-lienzo--cargando" aria-hidden="true" />
          )}
          {elegido && (
            <div className="sc-elegido" role="status">
              <div className="sc-elegido-datos">
                <strong>{elegido.nombre}</strong>
                <small>{[elegido.direccion, elegido.ciudad].filter(Boolean).join(' · ')}</small>
              </div>
              <Link to={`/club/${elegido.id}`} className="gp-btn gp-btn--primario gp-btn--chico">Ver club</Link>
              <button type="button" className="sc-elegido-cerrar" onClick={() => setElegido(null)} aria-label="Cerrar"><X size={18} aria-hidden="true" /></button>
            </div>
          )}
          {visible && clubes.length > 0 && ubicados.length === 0 && (
            <p className="sc-mapa-nota">Los clubes todavía están cargando su ubicación en el mapa.</p>
          )}
        </div>
      </div>
    </section>
  );
}
