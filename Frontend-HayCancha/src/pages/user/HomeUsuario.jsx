import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import TarjetaClub from '../../components/user/TarjetaClub';
import { Link } from 'react-router-dom';

export default function HomeUsuario() {
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerClubes = async () => {
      const { data, error } = await supabase
        .from('clubes')
        .select('*');
      
      if (error) {
        console.error('Error al traer los clubes:', error);
      } else {
        setClubes(data);
      }
      setCargando(false);
    };

    obtenerClubes();
  }, []);

  return (
    <div className="home-container">
      <header className="header-fijo">
        <div className="header-contenido" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          
          {/* ACÁ ESTÁ EL CAMBIO: El título ahora es un link a la Landing (/) */}
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <h1 className="header-titulo">
              Hay<span>Cancha</span>
            </h1>
            <p className="header-subtitulo">San Francisco, Cba</p>
          </Link>
          
          {/* Botón de Mis Reservas a la derecha */}
          <Link 
            to="/mis-reservas" 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px', 
              backgroundColor: '#111827', 
              color: '#fff', 
              textDecoration: 'none', 
              borderRadius: '20px', 
              fontWeight: '600',
              fontSize: '0.85rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🗓️ Mis Reservas
          </Link>
        </div>
      </header>

      {cargando ? (
        <div className="mensaje-vacio">Cargando clubes...</div>
      ) : clubes.length === 0 ? (
        <div className="mensaje-vacio">
          <p>Todavía no hay clubes adheridos.</p>
        </div>
      ) : (
        <div className="lista-clubes">
          {clubes.map((club) => (
            <TarjetaClub 
              key={club.id} 
              id={club.id} 
              nombre={club.nombre} 
              direccion={club.direccion} 
              imagenUrl={club.imagen_url}
            />
          ))}
        </div>
      )}
    </div>
  );
}