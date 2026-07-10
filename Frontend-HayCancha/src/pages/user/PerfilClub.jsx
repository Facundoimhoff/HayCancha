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
        <Link to="/" className="btn-volver">
          <ArrowLeft size={20} />
        </Link>
        <img 
          src={club.imagen_url} 
          alt={`Foto de ${club.nombre}`} 
          className="banner-imagen" 
        />
      </div>

      {/* --- INFO DEL CLUB --- */}
      <div className="info-club-tarjeta">
        <h1 className="info-club-nombre">{club.nombre}</h1>
        
        <div className="info-club-direccion" style={{ display: 'flex', alignItems: 'center', color: '#4b5563' }}>
          <MapPin size={16} style={{ marginRight: '8px' }} />
          <span>{club.direccion}</span>
        </div>

        <div className="info-club-telefono" style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
          <Phone size={16} style={{ marginRight: '8px', color: '#2563eb' }} />
          <a 
            href={`https://wa.me/${club.telefono_contacto}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
          >
            {club.telefono_contacto}
          </a>
        </div>

        {club?.estacionamiento === true && (
          <div className="info-club-estacionamiento" style={{ marginTop: '10px', color: '#16a34a', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>🚗</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Estacionamiento disponible</span>
          </div>
        )}
      </div>

      {/* --- LISTA DE CANCHAS --- */}
      <div className="canchas-seccion" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '15px' }}>Canchas Disponibles</h2>
        
        {canchas.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Este club aún no tiene canchas registradas.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {canchas.map((cancha) => (
              <div 
                key={cancha.id} 
                style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  padding: '15px', 
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>{cancha.nombre}</h3>
                  <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {cancha.tipo}
                  </span>
                </div>
                <p style={{ color: '#10b981', fontWeight: 'bold', marginTop: '10px', marginBottom: 0 }}>
                  ${cancha.precio_hora} <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 'normal' }}>/ hora</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilClub;