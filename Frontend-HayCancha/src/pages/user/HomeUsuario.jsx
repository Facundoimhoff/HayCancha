import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
// IMPORTANTE: Cambiamos Star por LayoutGrid
import { MapPin, Calendar, LayoutGrid, ChevronRight, ArrowLeft } from 'lucide-react';
import './HomeUsuario.css';

const HomeUsuario = () => {
  const { provincia, ciudad } = useParams();
  const navigate = useNavigate();
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarClubes = async () => {
      // MAGIA DE SUPABASE: Pedimos los clubes y al mismo tiempo las canchas que tienen vinculadas
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

  return (
    <div className="home-usuario-container">
      
      {/* NAVBAR SUPERIOR */}
      <div className="navbar-superior">
        <div className="navbar-izq">
          <button onClick={() => navigate('/seleccionar-ubicacion')} className="btn-volver-home">
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

      {/* LISTA DE CLUBES */}
      <div className="lista-clubes-container">
        {cargando ? (
          <p className="texto-estado">Buscando clubes en {ciudad}...</p>
        ) : clubes.length === 0 ? (
          <p className="texto-estado">No hay clubes disponibles en esta ciudad.</p>
        ) : (
          <div className="grid-clubes">
            {clubes.map(club => {
              // Calculamos la cantidad de canchas en base a lo que nos devolvió Supabase
              const cantidadCanchas = club.canchas ? club.canchas.length : 0;

              return (
                // TARJETA DEL CLUB
                <div key={club.id} className="tarjeta-club" onClick={() => navigate(`/club/${club.id}`)} style={{cursor: 'pointer'}}>
                  
                  {/* PARTE SUPERIOR: IMAGEN Y DEGRADADO */}
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

                  {/* PARTE INFERIOR: BOTONES */}
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