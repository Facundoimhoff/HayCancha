import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function PerfilClub() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatosDelClub = async () => {
      const { data: dataClub } = await supabase
        .from('clubes')
        .select('*')
        .eq('id', id)
        .single();
      
      setClub(dataClub);

      if (dataClub) {
        const { data: dataCanchas } = await supabase
          .from('canchas')
          .select('*')
          .eq('club_id', id);
        
        setCanchas(dataCanchas || []);
      }
      setCargando(false);
    };

    obtenerDatosDelClub();
  }, [id]);

  if (cargando) return <div className="mensaje-vacio">Cargando club...</div>;
  if (!club) return <div className="mensaje-vacio">Club no encontrado.</div>;

  return (
    <div className="perfil-container">
      
      {/* 1. Banner superior con la foto (reutilizamos la que cargaste antes) */}
      <div className="banner-club">
        <Link to="/" className="btn-volver">
          <ArrowLeft size={20} />
        </Link>
        <img 
          src={club.imagen_url} 
          alt={`Foto de ${club.nombre}`} 
          className="banner-imagen"
        />
        <div className="banner-overlay"></div>
      </div>

      {/* 2. Tarjeta flotante superpuesta con los datos del club */}
      <div className="info-club-contenedor">
        <div className="info-club-tarjeta">
          <h1 className="info-club-nombre">{club.nombre}</h1>
          <div className="info-club-direccion">
            <MapPin size={16} className="icono-direccion" />
            <span>{club.direccion}</span>
          </div>
        </div>
      </div>

      {/* 3. Lista de Canchas */}
      <div className="seccion-canchas">
        <h2 className="titulo-seccion">Canchas Disponibles</h2>
        
        {canchas.length === 0 ? (
          <div className="mensaje-vacio">
            <p>Este club todavía no cargó sus canchas.</p>
          </div>
        ) : (
          <div className="lista-canchas">
            {canchas.map(cancha => {
              // Verificamos si es pádel para cambiarle el color a la etiqueta
              const esPadel = cancha.deporte.toLowerCase().includes('padel') || cancha.deporte.toLowerCase().includes('pádel');
              
              return (
                <div key={cancha.id} className="cancha-tarjeta">
                  <div className="cancha-info-basica">
                    <span className={`badge-deporte ${esPadel ? 'padel' : ''}`}>
                      {cancha.deporte}
                    </span>
                    <h3 className="cancha-nombre">{cancha.nombre}</h3>
                  </div>
                  <div className="cancha-precio-contenedor">
                    <p className="cancha-precio">${cancha.precio_hora}</p>
                    <p className="cancha-precio-hora">por hora</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
    </div>
  );
}