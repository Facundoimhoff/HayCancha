import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  MapPin, ArrowLeft, Clock, ChevronLeft, ChevronRight, X, CalendarDays, 
  Image as ImageIcon, Phone, Mail, CheckCircle2, Car,
  Users, Layers, CloudRain 
} from 'lucide-react';
import './PerfilClub.css';

const PerfilClub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [club, setClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [imagenActualIdx, setImagenActualIdx] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { data: clubData, error: clubError } = await supabase
          .from('clubes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (clubError) throw clubError;
        setClub(clubData);

        const { data: canchasData, error: canchasError } = await supabase
          .from('canchas')
          .select('*')
          .eq('club_id', id)
          .order('precio_hora', { ascending: true });
        
        if (canchasError) throw canchasError;
        setCanchas(canchasData || []);

      } catch (error) {
        console.error("Error al cargar el club:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [id]);

  const abrirModalDetalle = (cancha) => {
    setCanchaSeleccionada(cancha);
    setImagenActualIdx(0);
  };

  const cerrarModal = () => {
    setCanchaSeleccionada(null);
  };

  const irAReservar = () => {
    navigate(`/reservar/${canchaSeleccionada.id}`);
  };

  const avanzarImagen = (imagenes) => {
    setImagenActualIdx((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
  };

  const retrocederImagen = (imagenes) => {
    setImagenActualIdx((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
  };

  if (cargando) return <div className="cargando-vista">Cargando complejo...</div>;
  if (!club) return <div className="cargando-vista">No se encontró el club.</div>;

  return (
    <div className="perfil-cliente-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* 1. NOMBRE DEL CLUB (BANNER) */}
      <div 
        className="perfil-header-banner" 
        style={{ backgroundColor: club.color_primario || '#0f172a' }}
      >
        <button onClick={() => navigate(-1)} className="btn-volver-cliente">
          <ArrowLeft size={20} /> Volver
        </button>
        
        <div className="perfil-header-info-con-logo">
          {club.imagen_url && (
            <img src={club.imagen_url} alt="Logo del Club" className="club-logo-redondo" style={{ border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
          )}
          <div className="perfil-textos-header">
            <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{club.nombre}</h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        {/* 2. CELULAR | UBICACION | ESTACIONAMIENTO (Arriba de todo) */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'white', 
          padding: '15px 20px', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '30px'
        }}>
          
          {club.telefono_contacto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
              <Phone size={20} color="#16a34a" />
              <a href={`https://wa.me/${club.telefono_contacto.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#16a34a', fontWeight: 'bold' }}>
                {club.telefono_contacto}
              </a>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
            <MapPin size={20} color="#2563eb" />
            <span>
              {club.direccion ? `${club.direccion}, ` : ''}{club.ciudad}, {club.provincia}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', color: '#334155', fontWeight: '500' }}>
            <Car size={20} color="#64748b" />
            <span>{club.estacionamiento ? 'Estacionamiento Disponible' : 'Estacionamiento en calle'}</span>
          </div>
        </div>

        {/* 3. CANCHAS DISPONIBLES (En el medio) */}
        <div className="canchas-disponibles-container" style={{ padding: '0', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            Canchas Disponibles
          </h2>
          
          {canchas.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <ImageIcon size={48} color="#cbd5e1" style={{ margin: '0 auto 15px' }} />
              <p className="no-canchas-msg" style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>Este club aún no tiene canchas registradas.</p>
            </div>
          ) : (
            <div className="canchas-galeria-grid">
              {canchas.map((cancha) => (
                <div key={cancha.id} className="cancha-tarjeta-premium" onClick={() => abrirModalDetalle(cancha)}>
                  <div className="cancha-tarjeta-img-box">
                    {cancha.imagen_url ? (
                      <img src={cancha.imagen_url.split(',')[0]} alt={cancha.nombre} className="cancha-tarjeta-img" />
                    ) : (
                      <div className="cancha-tarjeta-placeholder">
                        <ImageIcon size={32} color="#94a3b8" />
                      </div>
                    )}
                    <div className="cancha-badge-deporte">{cancha.deporte}</div>
                  </div>
                  <div className="cancha-tarjeta-body">
                    <h3 className="cancha-tarjeta-titulo">{cancha.nombre}</h3>
                    <div style={{ display: 'flex', gap: '12px', color: '#64748b', fontSize: '0.85rem', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14}/> {cancha.cantidad_jugadores || '5'} jug.</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={14}/> {cancha.superficie || (cancha.deporte === 'Pádel' ? 'Blindex / Sintético' : 'Sintético')}</span>
                      {cancha.techada && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}><CloudRain size={14}/> Techada</span>}
                    </div>
                    <div className="cancha-tarjeta-precio">
                      <span className="precio-numero">${cancha.precio_hora}</span>
                      <span className="precio-texto">/ hora</span>
                    </div>
                    <button className="btn-ver-detalle">Ver info y horarios</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. SERVICIOS Y REDES SOCIALES (Abajo, en 2 columnas) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', borderTop: '2px solid #e2e8f0', paddingTop: '30px' }}>
          
          {/* Columna Izquierda: SERVICIOS */}
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Servicios
            </h3>
            {club.servicios ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {club.servicios.split(',').map((servicio, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e2e8f0', color: '#334155', padding: '8px 16px', borderRadius: '20px', fontSize: '0.95rem', fontWeight: '500' }}>
                    <CheckCircle2 size={18} color="#475569" />
                    {servicio.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '1rem', fontStyle: 'italic' }}>No hay servicios detallados.</p>
            )}
          </div>

          {/* Columna Derecha: REDES SOCIALES Y CORREO */}
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Redes Sociales y Correo
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {club.correo_contacto && (
                <a href={`mailto:${club.correo_contacto}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#475569', fontSize: '1rem', fontWeight: '500', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  <Mail size={24} />
                  {club.correo_contacto}
                </a>
              )}

              {club.redes_sociales?.instagram && (
                <a href={club.redes_sociales.instagram.includes('http') ? club.redes_sociales.instagram : `https://instagram.com/${club.redes_sociales.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#E1306C', fontSize: '1rem', fontWeight: '500', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Insta" style={{ width: '24px', height: '24px' }} />
                  {club.redes_sociales.instagram}
                </a>
              )}
              
              {club.redes_sociales?.tiktok && (
                <a href={club.redes_sociales.tiktok.includes('http') ? club.redes_sociales.tiktok : `https://tiktok.com/@${club.redes_sociales.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#0f172a', fontSize: '1rem', fontWeight: '500', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style={{ width: '24px', height: '24px' }} />
                  {club.redes_sociales.tiktok}
                </a>
              )}
              
              {club.redes_sociales?.facebook && (
                <a href={club.redes_sociales.facebook.includes('http') ? club.redes_sociales.facebook : `https://facebook.com/search/top/?q=${club.redes_sociales.facebook}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#1877F2', fontSize: '1rem', fontWeight: '500', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Face" style={{ width: '24px', height: '24px' }} />
                  {club.redes_sociales.facebook}
                </a>
              )}

              {(!club.redes_sociales?.instagram && !club.redes_sociales?.tiktok && !club.redes_sociales?.facebook && !club.correo_contacto) && (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>Sin redes sociales cargadas.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MODAL DETALLE DE CANCHA                                */}
      {/* ========================================================= */}
      {canchaSeleccionada && (
        <div className="modal-cancha-overlay" onClick={cerrarModal}>
          <div className="modal-cancha-content" onClick={(e) => e.stopPropagation()}>
            
            <button className="btn-cerrar-modal" onClick={cerrarModal}>
              <X size={24} />
            </button>

            <div className="modal-carrusel-container">
              {(() => {
                const imagenes = canchaSeleccionada.imagen_url 
                  ? canchaSeleccionada.imagen_url.split(',').filter(url => url.trim() !== '') 
                  : [];

                if (imagenes.length === 0) {
                  return (
                    <div className="carrusel-placeholder">
                      <ImageIcon size={48} color="#94a3b8" />
                      <p>Sin fotos disponibles</p>
                    </div>
                  );
                }

                return (
                  <>
                    <img 
                      src={imagenes[imagenActualIdx]} 
                      alt={`Cancha ${imagenActualIdx + 1}`} 
                      className="carrusel-img-activa"
                    />
                    
                    {imagenes.length > 1 && (
                      <>
                        <button className="carrusel-btn left" onClick={() => retrocederImagen(imagenes)}>
                          <ChevronLeft size={24} color="#0f172a" />
                        </button>
                        <button className="carrusel-btn right" onClick={() => avanzarImagen(imagenes)}>
                          <ChevronRight size={24} color="#0f172a" />
                        </button>
                        <div className="carrusel-indicadores">
                          {imagenes.map((_, idx) => (
                            <div key={idx} className={`indicador-punto ${idx === imagenActualIdx ? 'activo' : ''}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="modal-cancha-info">
              <div className="modal-info-header">
                <h2>{canchaSeleccionada.nombre}</h2>
                <span className="badge-deporte-grande">{canchaSeleccionada.deporte}</span>
              </div>
              
              <div className="modal-info-detalles">
                <div className="detalle-bloque">
                  <span className="detalle-lbl">Precio por turno</span>
                  <span className="detalle-val precio-destacado">${canchaSeleccionada.precio_hora} <small>/ hora</small></span>
                </div>
                
                <div className="detalle-bloque divisor"></div>
                
                <div className="detalle-bloque">
                  <span className="detalle-lbl">Especificaciones</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px', color: '#334155', fontSize: '0.95rem' }}>
                    <span><strong style={{color:'#0f172a'}}>Jugadores:</strong> {canchaSeleccionada.cantidad_jugadores || '5'} jugadores</span>
                    <span><strong style={{color:'#0f172a'}}>Tipo de piso:</strong> {canchaSeleccionada.superficie || (canchaSeleccionada.deporte === 'Pádel' ? 'Blindex / Sintético' : 'Sintético')}</span>
                    <span><strong style={{color:'#0f172a'}}>Infraestructura:</strong> {canchaSeleccionada.techada ? 'Totalmente Techada' : 'Descubierta / Al aire libre'}</span>
                  </div>
                </div>

                <div className="detalle-bloque divisor"></div>
                
                <div className="detalle-bloque">
                  <span className="detalle-lbl">Horario de atención</span>
                  <span className="detalle-val con-icono">
                    <Clock size={18} className="txt-azul"/> 
                    {canchaSeleccionada.hora_apertura} a {canchaSeleccionada.hora_cierre} hs
                  </span>
                </div>
              </div>

              <button className="btn-reservar-gigante" onClick={irAReservar}>
                <CalendarDays size={20} /> Elegir Horario
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PerfilClub;