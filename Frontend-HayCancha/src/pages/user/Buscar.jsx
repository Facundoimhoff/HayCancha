import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase'; // 1. IMPORTAMOS SUPABASE AQUÍ
import './Buscar.css';

export default function Buscar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [inputValue, setInputValue] = useState(query);
  
  const [resultados, setResultados] = useState({ clubes: [], ciudades: [], provincias: [] });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // 2. REEMPLAZAMOS EL FETCH POR LA BÚSQUEDA DIRECTA EN SUPABASE
  useEffect(() => {
    const buscarEnSupabase = async () => {
      if (!query.trim()) {
        setResultados({ clubes: [], ciudades: [], provincias: [] });
        return;
      }

      setCargando(true);
      setError(null);

      try {
        // Consultamos directo a tu tabla 'clubes' en Supabase buscando por nombre o ciudad
        const { data, error: sbError } = await supabase
          .from('clubes')
          .select('*')
          .or(`nombre.ilike.%${query}%,ciudad.ilike.%${query}%`);

        if (sbError) throw sbError;
        
        // Guardamos los resultados (los clubes vienen de la base, ciudades/provincias quedan vacías por ahora)
        setResultados({
          clubes: data || [],
          ciudades: [],
          provincias: []
        });

      } catch (err) {
        console.error("Error al buscar en Supabase:", err);
        setError("Hubo un problema al consultar la base de datos.");
      } finally {
        setCargando(false);
      }
    };

    buscarEnSupabase();
    setInputValue(query);
  }, [query]);

  // Manejar nueva búsqueda desde el input de esta misma página
  const manejarNuevaBusqueda = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      navigate(`/buscar?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const hayResultados = resultados.clubes.length > 0 || resultados.ciudades.length > 0 || resultados.provincias.length > 0;

  return (
    <div className="buscar-page">
      
      {/* HEADER OSCURO CON BUSCADOR */}
      <header className="buscar-header">
        <div className="buscar-nav">
          <button className="btn-back" onClick={() => navigate('/')}>
            <ArrowLeft size={24} />
          </button>
          <div className="logo" onClick={() => navigate('/')}>
            GridPlay<span className="text-green">.</span>
          </div>
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
            <p className="search-feedback">
              Resultados para: <strong>"{query}"</strong>
            </p>
          )}
        </div>
      </header>

      {/* RESULTADOS */}
      <main className="buscar-main">
        {/* ESTADO 1: CARGANDO */}
        {cargando ? (
          <div className="no-results">
            <Loader2 size={60} className="text-green spinner" style={{ animation: 'spin 1s linear infinite' }} />
            <h2>BUSCANDO EN LA RED...</h2>
          </div>
        ) : error ? (
          /* ESTADO 2: ERROR */
          <div className="no-results">
            <h2 style={{ color: '#ef4444' }}>ERROR</h2>
            <p>{error}</p>
          </div>
        ) : !hayResultados && query ? (
          /* ESTADO 3: SIN RESULTADOS */
          <div className="no-results">
            <Search size={60} className="text-soft" />
            <h2>NO ENCONTRAMOS RESULTADOS</h2>
            <p>Intentá buscar con otra palabra, nombre de ciudad o club.</p>
          </div>
        ) : (
          /* ESTADO 4: CON RESULTADOS */
          <div className="results-container">
            
            {resultados.clubes.length > 0 && (
              <section className="result-section">
                <h3 className="section-subtitle">CLUBES ENCONTRADOS</h3>
                <div className="results-grid">
                  {resultados.clubes.map(club => (
                    <div key={club.id} className="result-card club-card" onClick={() => navigate(`/club/${club.id}`)}>
                      <div className="card-info">
                        <span className="badge-deporte">{club.deporte || 'Multideporte'}</span>
                        <h4>{club.nombre}</h4>
                        <p><MapPin size={14}/> {club.direccion || club.ciudad}</p>
                      </div>
                      <ArrowRight className="card-arrow" size={20} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {resultados.ciudades.length > 0 && (
              <section className="result-section">
                <h3 className="section-subtitle">CIUDADES</h3>
                <div className="results-grid">
                  {resultados.ciudades.map(ciudad => (
                    <div key={ciudad.id} className="result-card" onClick={() => navigate(`/ciudades/${ciudad.id}`)}>
                      <div className="card-info">
                        <h4>{ciudad.nombre}</h4>
                        <p>{ciudad.provincia}</p>
                      </div>
                      <ArrowRight className="card-arrow" size={20} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {resultados.provincias.length > 0 && (
              <section className="result-section">
                <h3 className="section-subtitle">PROVINCIAS</h3>
                <div className="results-grid">
                  {resultados.provincias.map(prov => (
                    <div key={prov.id || prov.nombre} className="result-card" onClick={() => navigate('/seleccionar-ciudad')}>
                      <div className="card-info">
                        <h4>{prov.nombre || prov}</h4>
                        <p>Ver ciudades disponibles</p>
                      </div>
                      <ArrowRight className="card-arrow" size={20} />
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}