import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Loader2, Building } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { resumenPorClub } from '../../services/resenas';
import HeaderCliente from './HeaderCliente';
import TarjetaClub from '../../components/user/TarjetaClub';
import FiltrosClubes from '../../components/user/FiltrosClubes';
import { sanitizarBusqueda } from '../../utils/validaciones';
import { filtrarYOrdenar, hayFiltros, FILTROS_INICIALES } from '../../utils/filtrosClubes';
import './Buscar.css';

export default function Buscar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [queryPrevia, setQueryPrevia] = useState(query);
  // Si cambia la búsqueda (por la URL), el cuadro de texto la refleja
  if (query !== queryPrevia) {
    setQueryPrevia(query);
    setInputValue(query);
  }
  const termino = sanitizarBusqueda(query);
  const [clubes, setClubes] = useState([]);
  const [resumenes, setResumenes] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  useEffect(() => {
    let cancelado = false;

    const buscarEnSupabase = async () => {
      // Los filtros .or() se arman como texto: se limpia el input para que no pueda inyectar filtros extra
      if (!termino) return;

      setCargando(true);
      setError(null);

      try {
        const { data, error: sbError } = await supabase
          .from('clubes')
          .select('*, canchas(*)')
          .or(`nombre.ilike.%${termino}%,ciudad.ilike.%${termino}%,provincia.ilike.%${termino}%`);
        if (sbError) throw sbError;
        if (cancelado) return;

        const lista = (data || []).map((c) => ({ ...c, canchas: (c.canchas || []).filter((k) => k.activa !== false) }));
        setClubes(lista);
        setCargando(false);

        const calificaciones = await resumenPorClub(lista.map((c) => c.id));
        if (!cancelado) setResumenes(calificaciones);
      } catch (err) {
        console.error('Error al buscar en Supabase:', err);
        if (!cancelado) {
          setError('Hubo un problema al consultar la base de datos.');
          setCargando(false);
        }
      }
    };

    buscarEnSupabase();
    return () => { cancelado = true; };
  }, [termino]);

  const manejarNuevaBusqueda = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      navigate(`/buscar?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const resultados = useMemo(() => (termino ? clubes : []), [termino, clubes]);
  const visibles = useMemo(() => filtrarYOrdenar(resultados, filtros, resumenes), [resultados, filtros, resumenes]);

  return (
    <div className="buscar-page">
      <HeaderCliente />

      <header className="buscar-header">
        <div className="buscar-nav">
          <button className="btn-back" onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="buscar-header-content">
          <form className="search-box-internal" onSubmit={manejarNuevaBusqueda}>
            <Search className="search-icon" size={24} />
            <input
              type="text"
              placeholder="Buscar club, ciudad, deporte..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn-search">BUSCAR</button>
          </form>

          {query && !cargando && (
            <h2 className="buscar-resultado-titulo">
              Clubes en <strong>&ldquo;{query}&rdquo;</strong>
            </h2>
          )}

          {resultados.length > 0 && <FiltrosClubes filtros={filtros} onCambio={setFiltros} />}
        </div>
      </header>

      <main className="buscar-main">
        {cargando ? (
          <div className="buscar-estado">
            <Loader2 size={48} className="buscar-spinner" />
            <h2>Buscando clubes...</h2>
          </div>
        ) : error ? (
          <div className="buscar-estado buscar-estado--error" role="alert">
            <h2>No pudimos completar la búsqueda</h2>
            <p>{error}</p>
          </div>
        ) : resultados.length === 0 && query ? (
          <div className="buscar-estado">
            <Building size={48} />
            <h2>No encontramos resultados</h2>
            <p>No hay clubes registrados para &ldquo;{query}&rdquo; todavía.</p>
          </div>
        ) : visibles.length === 0 && resultados.length > 0 ? (
          <div className="buscar-estado">
            <Search size={48} />
            <h2>No hay clubes con esos filtros</h2>
            {hayFiltros(filtros) && (
              <button type="button" className="gp-btn gp-btn--primario" onClick={() => setFiltros(FILTROS_INICIALES)}>Limpiar filtros</button>
            )}
          </div>
        ) : (
          <div className="buscar-grilla">
            {visibles.map((club) => <TarjetaClub key={club.id} club={club} resumen={resumenes[club.id]} />)}
          </div>
        )}
      </main>
    </div>
  );
}
