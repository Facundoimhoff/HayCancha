import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, SearchX } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { resumenPorClub } from '../../services/resenas';
import { filtrarYOrdenar, hayFiltros, FILTROS_INICIALES } from '../../utils/filtrosClubes';
import TarjetaClub from '../../components/user/TarjetaClub';
import FiltrosClubes from '../../components/user/FiltrosClubes';
import './HomeUsuario.css';

const HomeUsuario = () => {
  const { provincia, ciudad } = useParams();
  const navigate = useNavigate();
  const [clubes, setClubes] = useState([]);
  const [resumenes, setResumenes] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      setCargando(true);
      setError('');
      const { data, error: errorClubes } = await supabase
        .from('clubes')
        .select('*, canchas(*)')
        .eq('provincia', provincia)
        .eq('ciudad', ciudad);
      if (cancelado) return;

      if (errorClubes) {
        console.error('Error al cargar los clubes:', errorClubes);
        setError('No pudimos cargar los clubes. Revisá tu conexión e intentá de nuevo.');
        setCargando(false);
        return;
      }

      const lista = (data || []).map((c) => ({ ...c, canchas: (c.canchas || []).filter((k) => k.activa !== false) }));
      setClubes(lista);
      setCargando(false);

      // Las calificaciones llegan aparte: la lista no espera por ellas
      const calificaciones = await resumenPorClub(lista.map((c) => c.id));
      if (!cancelado) setResumenes(calificaciones);
    })();

    return () => { cancelado = true; };
  }, [provincia, ciudad]);

  const visibles = useMemo(() => filtrarYOrdenar(clubes, filtros, resumenes), [clubes, filtros, resumenes]);

  return (
    <div className="hu-pagina">
      <header className="hu-navbar">
        <div className="hu-navbar-izq">
          <button type="button" onClick={() => navigate(-1)} className="hu-volver" aria-label="Volver">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="hu-titulo">Hay<span>Cancha</span></h1>
            <p className="hu-ubicacion">{ciudad}, {provincia === 'Córdoba' ? 'CBA' : provincia.substring(0, 3).toUpperCase()}</p>
          </div>
        </div>

        <button type="button" onClick={() => navigate('/mis-reservas')} className="hu-mis-reservas">
          <Calendar size={16} /> Mis Reservas
        </button>
      </header>

      <main className="hu-contenido">
        {!cargando && clubes.length > 0 && (
          <div className="hu-filtros">
            <FiltrosClubes filtros={filtros} onCambio={setFiltros} />
            <p className="hu-conteo" aria-live="polite">
              {visibles.length} {visibles.length === 1 ? 'club' : 'clubes'} en {ciudad}
            </p>
          </div>
        )}

        {cargando ? (
          <div className="hu-grilla" aria-busy="true" aria-label="Buscando clubes">
            {[0, 1, 2].map((i) => <div key={i} className="hu-esqueleto" />)}
          </div>
        ) : error ? (
          <div className="hu-vacio" role="alert">
            <h2>{error}</h2>
            <button type="button" className="gp-btn gp-btn--primario" onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        ) : clubes.length === 0 ? (
          <div className="hu-vacio">
            <SearchX size={40} aria-hidden="true" />
            <h2>Todavía no hay clubes en {ciudad}</h2>
            <p>Probá con otra ciudad o volvé más tarde.</p>
          </div>
        ) : visibles.length === 0 ? (
          <div className="hu-vacio">
            <SearchX size={40} aria-hidden="true" />
            <h2>No hay clubes con esos filtros</h2>
            {hayFiltros(filtros) && <button type="button" className="gp-btn gp-btn--primario" onClick={() => setFiltros(FILTROS_INICIALES)}>Limpiar filtros</button>}
          </div>
        ) : (
          <div className="hu-grilla">
            {visibles.map((club) => <TarjetaClub key={club.id} club={club} resumen={resumenes[club.id]} />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomeUsuario;
