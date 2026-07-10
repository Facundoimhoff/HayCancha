import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import TarjetaClub from '../../components/user/TarjetaClub';

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
        <div className="header-contenido">
          <div>
            <h1 className="header-titulo">
              Hay<span>Cancha</span>
            </h1>
            <p className="header-subtitulo">San Francisco, Cba</p>
          </div>
          <div className="avatar-placeholder"></div>
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