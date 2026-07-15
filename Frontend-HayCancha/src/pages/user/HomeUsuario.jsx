import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, Calendar, Star, ChevronRight, ArrowLeft } from 'lucide-react';

const HomeUsuario = () => {
  const { provincia, ciudad } = useParams(); // Agarramos la ciudad de la URL
  const navigate = useNavigate();
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarClubes = async () => {
      const { data, error } = await supabase
        .from('clubes')
        .select('*')
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* NAVBAR SUPERIOR */}
      <div style={{ backgroundColor: '#ffffff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/seleccionar-ubicacion')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#64748b' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' }}>
              Hay<span style={{ color: '#3b82f6' }}>Cancha</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {ciudad}, {provincia === 'Córdoba' ? 'CBA' : provincia.substring(0,3).toUpperCase()}
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/mis-reservas')}
          style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Calendar size={16} /> Mis Reservas
        </button>
      </div>

      {/* LISTA DE CLUBES */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {cargando ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>Buscando clubes en {ciudad}...</p>
        ) : clubes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>No hay clubes disponibles en esta ciudad.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {clubes.map(club => (
              
              // TARJETA DEL CLUB
              <div key={club.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                
                {/* PARTE SUPERIOR: IMAGEN Y DEGRADADO */}
                <div style={{ position: 'relative', height: '220px', backgroundColor: '#e2e8f0' }}>
                  {/* Acá iría la foto del club si la tenés. Por ahora ponemos un gris de fondo o una de prueba */}
                  <img 
                    src={club.imagen_url || "https://images.unsplash.com/photo-1574629810360-7efbb1925536?q=80&w=1000&auto=format&fit=crop"} 
                    alt={club.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {/* Degradado negro para que el texto blanco se lea perfecto */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 80%)' }}></div>

                  {/* Etiqueta verde superior */}
                  <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'white', color: '#16a34a', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    RESERVAS ABIERTAS
                  </div>

                  {/* Nombre y Dirección */}
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', right: '15px' }}>
                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {club.nombre}
                    </h2>
                    <p style={{ margin: '5px 0 0 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                      <MapPin size={16} /> {club.direccion || ciudad}
                    </p>
                  </div>
                </div>

                {/* PARTE INFERIOR: BOTONES */}
                <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={14} color="#eab308" fill="#eab308" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569' }}>NUEVO EN APP</span>
                  </div>

                  <button 
                    onClick={() => navigate(`/club/${club.id}`)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
                  >
                    Ver turnos <ChevronRight size={18} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeUsuario;