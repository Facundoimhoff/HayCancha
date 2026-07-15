import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { supabase } from '../../services/supabase'; 

const PerfilClub = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        setCargando(true);
        
        // 1. Buscamos la info del club
        const { data: clubData, error: clubError } = await supabase
          .from('clubes')
          .select('*')
          .eq('id', id)
          .single();

        if (clubError) throw clubError;
        setClub(clubData);

        // 2. Buscamos las canchas de este club específico
        const { data: canchasData, error: canchasError } = await supabase
          .from('canchas')
          .select('*')
          .eq('club_id', id);

        if (canchasError) throw canchasError;
        setCanchas(canchasData || []);
        
      } catch (error) {
        console.error("Error al cargar los datos:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [id]);

  if (cargando) return <div className="mensaje-vacio">Cargando perfil...</div>;
  if (!club) return <div className="mensaje-vacio">Club no encontrado</div>;

  return (
    <div className="perfil-container">
      {/* --- BANNER Y FOTO --- */}
      <div className="banner-club">
        {/* ACÁ ESTÁ EL CAMBIO: Ahora vuelve a /home */}
        <button onClick={() => navigate(-1)}>
  Volver
</button>
        <img 
          src={club.imagen_url} 
          alt={`Foto de ${club.nombre}`} 
          className="banner-imagen" 
        />
      </div>

      {/* --- INFO DEL CLUB --- */}
      <div className="info-club-tarjeta">
        <h1 className="info-club-nombre">{club.nombre}</h1>
        
        <div className="info-club-direccion">
          <MapPin size={16} className="icono-margen" />
          <span>{club.direccion}</span>
        </div>

        <div className="info-club-telefono">
          <Phone size={16} className="icono-margen" color="#2563eb" />
          <a 
            href={`https://wa.me/${club.telefono_contacto}`} 
            target="_blank" 
            rel="noopener noreferrer" 
          >
            {club.telefono_contacto}
          </a>
        </div>

        {club?.estacionamiento === true && (
          <div className="info-club-estacionamiento">
            <span className="icono-margen">🚗</span>
            <span className="texto-estacionamiento">Estacionamiento disponible</span>
          </div>
        )}
      </div>

      {/* --- LISTA DE CANCHAS --- */}
      <div className="canchas-seccion">
        <h2 className="canchas-titulo">Canchas Disponibles</h2>
        
        {canchas.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Este club aún no tiene canchas registradas.</p>
        ) : (
          <div className="canchas-grid">
            {canchas.map((cancha) => (
              <Link 
                to={`/reservar/${cancha.id}`} 
                key={cancha.id} 
                className="cancha-link"
              >
                <div className="cancha-tarjeta">
                  <div className="cancha-header">
                    <h3 className="cancha-nombre">{cancha.nombre}</h3>
                    <span className="cancha-tipo">
                      {cancha.tipo}
                    </span>
                  </div>
                  <p className="cancha-precio">
                    ${cancha.precio_hora} <span className="cancha-precio-hora">/ hora</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilClub;