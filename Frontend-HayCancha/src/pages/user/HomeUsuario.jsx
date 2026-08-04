import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, Calendar, LayoutGrid, ChevronRight, ArrowLeft } from 'lucide-react';
import './HomeUsuario.css';

const HomeUsuario = () => {
  const { provincia, ciudad } = useParams();
  const navigate = useNavigate();
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 👇 1. ESTADOS PARA LOS FILTROS 👇
  const [filtroDeporte, setFiltroDeporte] = useState('');
  const [filtroJugadores, setFiltroJugadores] = useState('');
  const [filtroTechada, setFiltroTechada] = useState(false);
  const [ordenPrecio, setOrdenPrecio] = useState(''); 

  useEffect(() => {
    const cargarClubes = async () => {
      const { data, error } = await supabase
        .from('clubes')
        .select('*, canchas(id)') 
        .eq('provincia', provincia)
        .eq('ciudad', ciudad);

      if (!error) {
        setClubes(data || []);
      }
      setCargando(false);
    };
    cargarClubes();
  }, [provincia, ciudad]);

  // 👇 2. LÓGICA DE FILTRADO 👇
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
  if (ordenPrecio === 'menor') {
    clubesFiltrados.sort((a, b) => (a.precio_hora || 0) - (b.precio_hora || 0));
  } else if (ordenPrecio === 'mayor') {
    clubesFiltrados.sort((a, b) => (b.precio_hora || 0) - (a.precio_hora || 0));
  }

  return (
    <div className="home-usuario-container">
      
      {/* NAVBAR SUPERIOR */}
      <div className="navbar-superior">
        <div className="navbar-izq">
          <button onClick={() => navigate(-1)} className="btn-volver-home">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="titulo-app">
              Hay<span className="titulo-resalte">Cancha</span>
            </h1>
            <p className="subtitulo-ubicacion">
              {ciudad}, {provincia === 'Córdoba' ? 'CBA' : provincia.substring(0,3).toUpperCase()}
            </p>
          </div>
        </div>

        <button onClick={() => navigate('/mis-reservas')} className="btn-mis-reservas">
          <Calendar size={16} /> Mis Reservas
        </button>
      </div>

      {/* 👇 3. BARRA DE FILTROS VISUAL 👇 */}
      {!cargando && clubes.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto 20px auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            
            <select 
              value={filtroDeporte} 
              onChange={(e) => setFiltroDeporte(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: '1', minWidth: '140px', outline: 'none', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
            >
              <option value="">Todos los deportes</option>
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
              <span style={{ fontWeight: '600', color: filtroTechada ? '#16a34a' : '#475569' }}>Techada</span>
            </label>

          </div>
        </div>
      )}

      {/* LISTA DE CLUBES */}
      <div className="lista-clubes-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {cargando ? (
          <p className="texto-estado">Buscando clubes en {ciudad}...</p>
        ) : clubes.length === 0 ? (
          <p className="texto-estado">No hay clubes disponibles en esta ciudad.</p>
        ) : clubesFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>No hay clubes con esos filtros</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Intentá quitar algunos filtros para ver más opciones.</p>
            <button 
              onClick={() => {setFiltroDeporte(''); setFiltroJugadores(''); setFiltroTechada(false); setOrdenPrecio('');}}
              style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid-clubes">
            {/* 👇 4. USAMOS LA LISTA FILTRADA EN VEZ DE LA LISTA ORIGINAL 👇 */}
            {clubesFiltrados.map(club => {
              const cantidadCanchas = club.canchas ? club.canchas.length : 0;

              return (
                <div key={club.id} className="tarjeta-club" onClick={() => navigate(`/club/${club.id}`)} style={{cursor: 'pointer'}}>
                  
                  <div className="tarjeta-imagen-wrapper">
                    <img 
                      src={club.imagen_url || "https://images.unsplash.com/photo-1574629810360-7efbb1925536?q=80&w=1000&auto=format&fit=crop"} 
                      alt={club.nombre}
                      className="tarjeta-imagen"
                    />
                    
                    <div className="tarjeta-degradado"></div>

                    <div className="etiqueta-reservas">
                      RESERVAS ABIERTAS
                    </div>

                    <div className="info-superior">
                      <h2 className="tarjeta-nombre">
                        {club.nombre}
                      </h2>
                      <p className="tarjeta-direccion">
                        <MapPin size={16} /> {club.direccion || ciudad}
                      </p>
                    </div>
                  </div>

                  <div className="tarjeta-footer">
                    <div className="etiqueta-canchas">
                      <LayoutGrid size={16} className="icono-canchas" />
                      <span className="texto-canchas">
                        {cantidadCanchas} {cantidadCanchas === 1 ? 'cancha' : 'canchas'}
                      </span>
                    </div>

                    <button className="btn-ver-turnos">
                      Ver turnos <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeUsuario;