import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ArrowLeft, Loader2, Building } from 'lucide-react';
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
    <div className="buscar-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      <HeaderCliente />

      <header className="buscar-header" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '30px' }}>
        <div className="buscar-nav">
          <button className="btn-back" onClick={() => navigate(-1)}>
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
            <h2 style={{ margin: '20px 0', fontSize: '1.5rem', color: '#0f172a' }}>
              Clubes en <strong>"{query}"</strong>
            </h2>
          )}

          {/* 👇 BARRA DE FILTROS MEJORADA Y MODERNA 👇 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <select 
              value={filtroDeporte} 
              onChange={(e) => setFiltroDeporte(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: '1', minWidth: '140px', outline: 'none', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
            >
              <option value="">Deporte: Todos</option>
              <option value="Fútbol">Fútbol</option>
              <option value="Pádel">Pádel</option>
              <option value="Tenis">Tenis</option>
            </select>

            <select 
              value={filtroJugadores} 
              onChange={(e) => setFiltroJugadores(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: '1', minWidth: '140px', outline: 'none', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
            >
              <option value="">Jugadores</option>
              <option value="5">Fútbol 5</option>
              <option value="7">Fútbol 7</option>
              <option value="11">Fútbol 11</option>
              <option value="4">Dobles (Pádel/Tenis)</option>
            </select>

            <select 
              value={ordenPrecio} 
              onChange={(e) => setOrdenPrecio(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: '1', minWidth: '140px', outline: 'none', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
            >
              <option value="">Ordenar por precio</option>
              <option value="menor">Menor a mayor</option>
              <option value="mayor">Mayor a menor</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: filtroTechada ? '#dcfce7' : '#f8fafc', borderRadius: '8px', border: `1px solid ${filtroTechada ? '#22c55e' : '#cbd5e1'}`, transition: 'all 0.2s', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={filtroTechada} 
                onChange={(e) => setFiltroTechada(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '600', color: filtroTechada ? '#16a34a' : '#475569' }}>Cancha Techada</span>
            </label>
          </div>
          {/* 👆 FIN BARRA DE FILTROS 👆 */}

        </div>
      </header>

      <main className="buscar-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {cargando ? (
          <div className="no-results" style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 size={60} className="text-green spinner" style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: '#22c55e' }} />
            <h2 style={{ marginTop: '20px', color: '#334155' }}>Buscando clubes...</h2>
          </div>
        ) : error ? (
          <div className="no-results" style={{ textAlign: 'center', padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#ef4444' }}>
            <h2>ERROR</h2>
            <p><strong>{error}</strong></p>
          </div>
        ) : clubes.length === 0 && query ? (
          <div className="no-results" style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Building size={60} color="#cbd5e1" style={{ margin: '0 auto' }} />
            <h2 style={{ marginTop: '20px', color: '#0f172a' }}>NO ENCONTRAMOS RESULTADOS</h2>
            <p style={{ color: '#64748b' }}>No hay clubes registrados para "{query}" todavía.</p>
          </div>
        ) : clubesFiltrados.length === 0 ? (
          <div className="no-results" style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={60} color="#cbd5e1" style={{ margin: '0 auto' }} />
            <h2 style={{ marginTop: '20px', color: '#0f172a' }}>NO HAY CLUBES CON ESOS FILTROS</h2>
            <p style={{ color: '#64748b' }}>Intentá quitar algunos filtros para ver más resultados.</p>
            <button 
              onClick={() => {setFiltroDeporte(''); setFiltroJugadores(''); setFiltroTechada(false); setOrdenPrecio('');}} 
              style={{ marginTop: '20px', padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="results-container">
            <section className="result-section">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {clubesFiltrados.map(club => (
                  <div 
                    key={club.id} 
                    onClick={() => navigate(`/club/${club.id}`)}
                    style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s ease', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ height: '160px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {club.imagen_url ? (
                        <img src={club.imagen_url.split(',')[0]} alt={club.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Building size={40} color="#94a3b8" />
                      )}
                    </div>
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: '1' }}>
                      <div>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>
                          {club.deporte || 'Multideporte'}
                        </span>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: '800' }}>{club.nombre}</h4>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={16} /> {club.direccion || club.ciudad}
                        </p>
                      </div>
                      <ArrowRight size={20} color="#22c55e" />
                    </div>
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