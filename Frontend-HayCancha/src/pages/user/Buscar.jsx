import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import HeaderCliente from './HeaderCliente'; // 1. Importar el header
import './Buscar.css';

export default function Buscar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [inputValue, setInputValue] = useState(query);
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buscarEnSupabase = async () => {
      if (!query.trim()) {
        setClubes([]);
        return;
      }

      setCargando(true);
      setError(null);

      try {
        // Buscamos en la tabla 'clubes' donde el nombre O la ciudad incluyan lo que se buscó
        const { data, error: sbError } = await supabase
          .from('clubes')
          .select('*')
          .or(`nombre.ilike.%${query}%,ciudad.ilike.%${query}%,provincia.ilike.%${query}%`);

        if (sbError) throw sbError;
        
        setClubes(data || []);
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

  const manejarNuevaBusqueda = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      navigate(`/buscar?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  return (
    <div className="buscar-page">
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

      <main className="buscar-main">
        {cargando ? (
          <div className="no-results">
            <Loader2 size={60} className="text-green spinner" style={{ animation: 'spin 1s linear infinite' }} />
            <h2>BUSCANDO EN LA RED...</h2>
          </div>
        ) : error ? (
          <div className="no-results">
            <h2 style={{ color: '#ef4444' }}>ERROR</h2>
            <p>{error}</p>
          </div>
        ) : clubes.length === 0 && query ? (
          <div className="no-results">
            <Search size={60} className="text-soft" />
            <h2>NO ENCONTRAMOS RESULTADOS</h2>
            <p>Intentá buscar con otra palabra, nombre de ciudad o club.</p>
          </div>
        ) : (
          <div className="results-container">
            {clubes.length > 0 && (
              <section className="result-section">
                <h3 className="section-subtitle">CLUBES ENCONTRADOS</h3>
                <div className="results-grid">
                  {clubes.map(club => (
                    <div 
                      key={club.id} 
                      className="result-card club-card" 
                      onClick={() => navigate(`/club/${club.id}`)}
                    >
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
          </div>
        )}
      </main>
    </div>
  );
}