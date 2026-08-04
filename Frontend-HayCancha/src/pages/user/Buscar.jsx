import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import HeaderCliente from './HeaderCliente'; 
import './Buscar.css';

export default function Buscar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [inputValue, setInputValue] = useState(query);
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para los filtros
  const [filtroDeporte, setFiltroDeporte] = useState('');
  const [filtroJugadores, setFiltroJugadores] = useState('');
  const [filtroTechada, setFiltroTechada] = useState(false);
  const [ordenPrecio, setOrdenPrecio] = useState(''); 

  useEffect(() => {
    const buscarEnSupabase = async () => {
      if (!query.trim()) {
        setClubes([]);
        return;
      }

      setCargando(true);
      setError(null);

      try {
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

  // Aplicamos los filtros a la lista original
  let clubesFiltrados = [...clubes];

  if (filtroDeporte) {
    clubesFiltrados = clubesFiltrados.filter(c => c.deporte?.toLowerCase() === filtroDeporte.toLowerCase());
  }
  
  if (filtroJugadores) {
    clubesFiltrados = clubesFiltrados.filter(c => c.cantidad_jugadores === parseInt(filtroJugadores));
  }
  
  if (filtroTechada) {
    clubesFiltrados = clubesFiltrados.filter(c => c.techada === true);
  }

  // Ordenamiento por precio
  if (ordenPrecio === 'menor') {
    clubesFiltrados.sort((a, b) => (a.precio_hora || 0) - (b.precio_hora || 0));
  } else if (ordenPrecio === 'mayor') {
    clubesFiltrados.sort((a, b) => (b.precio_hora || 0) - (a.precio_hora || 0));
  }

  return (
    <div className="buscar-page">
      <header className="buscar-header">
        <div className="buscar-nav">
          <button className="btn-back" onClick={() => navigate('/')}>
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

          {/* BARRA DE FILTROS AVANZADOS */}
          <div className="barra-filtros">
            <select 
              className="filtro-select" 
              value={filtroDeporte} 
              onChange={(e) => setFiltroDeporte(e.target.value)}
            >
              <option value="">Todos los deportes</option>
              <option value="Fútbol">Fútbol</option>
              <option value="Pádel">Pádel</option>
              <option value="Tenis">Tenis</option>
            </select>

            <select 
              className="filtro-select" 
              value={filtroJugadores} 
              onChange={(e) => setFiltroJugadores(e.target.value)}
            >
              <option value="">Jugadores</option>
              <option value="5">Fútbol 5</option>
              <option value="7">Fútbol 7</option>
              <option value="11">Fútbol 11</option>
              <option value="4">Dobles (Pádel/Tenis)</option>
            </select>

            <select 
              className="filtro-select" 
              value={ordenPrecio} 
              onChange={(e) => setOrdenPrecio(e.target.value)}
            >
              <option value="">Ordenar por precio</option>
              <option value="menor">Menor a mayor</option>
              <option value="mayor">Mayor a menor</option>
            </select>

            <label className="filtro-checkbox">
              <input 
                type="checkbox" 
                checked={filtroTechada} 
                onChange={(e) => setFiltroTechada(e.target.checked)}
              />
              <span>Techada</span>
            </label>
          </div>
          
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
        ) : clubesFiltrados.length === 0 ? (
          <div className="no-results">
            <Search size={60} className="text-soft" />
            <h2>NO HAY CLUBES CON ESOS FILTROS</h2>
            <p>Intentá quitar algunos filtros para ver más resultados.</p>
          </div>
        ) : (
          <div className="results-container">
            <section className="result-section">
              <h3 className="section-subtitle">CLUBES ENCONTRADOS</h3>
              <div className="results-grid">
                {/* ACÁ ESTABA EL ERROR: AHORA USAMOS clubesFiltrados EN LUGAR DE clubes */}
                {clubesFiltrados.map(club => (
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
          </div>
        )}
      </main>
    </div>
  );
}