import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, CarFront, ArrowLeft, Loader2 } from 'lucide-react';
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
        const clubId = parseInt(id, 10);
        
        // 1. Buscamos la info del club
        const { data: clubData, error: clubError } = await supabase
          .from('clubes')
          .select('*')
          .eq('id', clubId)
          .single();

        if (clubError) throw clubError;
        setClub(clubData);

        // 2. Buscamos las canchas de este club específico
        const { data: canchasData, error: canchasError } = await supabase
          .from('canchas')
          .select('*')
          .eq('club_id', clubId);

        if (canchasError) {
          console.error("Error al cargar las canchas:", canchasError);
          setCanchas([]); 
        } else {
          setCanchas(canchasData || []);
        }
        
      } catch (error) {
        console.error("Error crítico al cargar los datos:", error);
        setClub(null);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, [id]);

  if (cargando) {
    return (
      <div className="perfil-loading">
        <Loader2 size={50} className="spinner text-green" />
        <h2>Cargando perfil...</h2>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="perfil-error">
        <h2>Club no encontrado</h2>
        <button onClick={() => navigate(-1)} className="btn-volver-error">Volver atrás</button>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      
      {/* BOTÓN VOLVER FLOTANTE */}
      <button onClick={() => navigate(-1)} className="btn-flotante-volver">
        <ArrowLeft size={18} /> Volver
      </button>

      {/* --- BANNER Y FOTO --- */}
      <div className="banner-club">
        <img 
          src={club.imagen_url || "https://images.unsplash.com/photo-1574629810360-7efbb1925536?q=80&w=2000&auto=format&fit=crop"} 
          alt={`Foto de ${club.nombre}`} 
          className="banner-imagen" 
        />
        <div className="banner-overlay"></div>
      </div>

    {/* --- INFO DEL CLUB --- */}
      <div className="info-club-wrapper">
        <div className="info-club-tarjeta">
          <h1 className="info-club-nombre">{club.nombre}</h1>
          
          <div className="info-club-direccion">
            <MapPin size={20} className="icono-margen" />
            <span>{club.direccion || club.ciudad}</span>
          </div>

          <div className="info-club-telefono">
            <Phone size={20} className="icono-margen" />
            <a 
              href={`https://wa.me/${club.telefono_contacto?.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
            >
              {club.telefono_contacto}
            </a>
          </div>

          {club?.estacionamiento === true && (
            <div className="info-club-estacionamiento">
              <CarFront size={20} className="icono-margen" />
              <span className="texto-estacionamiento">Estacionamiento disponible</span>
            </div>
          )}
        </div>
      </div>
      
      {/* --- LISTA DE CANCHAS --- */}
      <div className="canchas-seccion">
        <h2 className="canchas-titulo">Canchas Disponibles</h2>
        
        {canchas.length === 0 ? (
          <div className="mensaje-sin-canchas">
            <p>Este club aún no tiene canchas registradas.</p>
          </div>
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
                    <span className="cancha-tipo">{cancha.deporte}</span>
                  </div>
                  <div className="cancha-body">
                    <p className="cancha-precio">
                      ${cancha.precio_hora} <span className="cancha-precio-hora">/ hora</span>
                    </p>
                    <span className="btn-reservar-cancha">VER TURNOS</span>
                  </div>
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