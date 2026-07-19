import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, CarFront } from 'lucide-react';
import { supabase } from '../../services/supabase'; 
import './PerfilClub.css';

const PerfilClub = () => {
  const { id } = useParams();
  const navigate = useNavigate(); 
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
      
      {/* BOTÓN VOLVER FLOTANTE */}
      <button onClick={() => navigate(-1)} className="btn-flotante-volver">
        <ArrowLeft size={18} /> Volver
      </button>

      {/* --- BANNER Y FOTO --- */}
      <div className="banner-club">
        <img 
          src={club.imagen_url || "https://images.unsplash.com/photo-1574629810360-7efbb1925536?q=80&w=1000&auto=format&fit=crop"} 
          alt={`Foto de ${club.nombre}`} 
          className="banner-imagen" 
        />
      </div>

    {/* --- INFO DEL CLUB --- */}
      <div className="info-club-tarjeta">
        <h1 className="info-club-nombre">{club.nombre}</h1>
        
        <div className="info-club-direccion">
          <MapPin size={20} className="icono-margen" />
          <span>{club.direccion || club.ciudad}</span>
        </div>

        <div className="info-club-telefono">
          {/* Le sacamos el color hardcodeado para que lo maneje el CSS (.icono-margen) */}
          <Phone size={20} className="icono-margen" />
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
            {/* Reemplazamos el emoji 🚗 por el icono de Lucide */}
            <CarFront size={20} className="icono-margen" />
            <span className="texto-estacionamiento">Estacionamiento disponible</span>
          </div>
        )}
      </div>
      
      {/* --- LISTA DE CANCHAS --- */}
      <div className="canchas-seccion">
        <h2 className="canchas-titulo">Canchas Disponibles</h2>
        
        {canchas.length === 0 ? (
          <p className="mensaje-sin-canchas">Este club aún no tiene canchas registradas.</p>
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
                    <span className="cancha-tipo" data-deporte={cancha.deporte}>
                      {cancha.deporte}
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