import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  MapPin, ArrowLeft, Clock, ChevronLeft, ChevronRight, X, CalendarDays, 
  Image as ImageIcon, Phone, Mail, Instagram, Facebook, Video, CheckCircle2, 
  Users, Layers, CloudRain 
} from 'lucide-react';
import './PerfilClub.css';

const PerfilClub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [club, setClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el Modal (Visor Detallado)
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [imagenActualIdx, setImagenActualIdx] = useState(0);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Cargar datos del club
        const { data: clubData, error: clubError } = await supabase
          .from('clubes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (clubError) throw clubError;
        setClub(clubData);

        // 2. Cargar canchas del club
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

  // Funciones del Modal y Carrusel
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
    <div className="perfil-cliente-page">
      
      {/* HEADER DEL CLUB DINÁMICO (COLOR Y LOGO) */}
      <div 
        className="perfil-header-banner" 
        style={{ backgroundColor: club.color_primario || '#0f172a' }}
      >
        <button onClick={() => navigate(-1)} className="btn-volver-cliente">
          <ArrowLeft size={20} /> Volver
        </button>
        
        <div className="perfil-header-info-con-logo">
          {club.imagen_url && (
            <img src={club.imagen_url} alt="Logo del Club" className="club-logo-redondo" />
          )}
          <div className="perfil-textos-header">
            <h1>{club.nombre}</h1>
            <p><MapPin size={18} /> {club.ciudad}, {club.provincia}</p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN NUEVA: VIDRIERA DEL CLUB (CONTACTO Y SERVICIOS)   */}
      {/* ========================================================= */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 0 20px' }}>
        
        {/* Redes y Botones de Contacto */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '15px', alignItems: 'center' }}>
          
          {club.telefono_contacto && (
            <a href={`https://wa.me/${club.telefono_contacto.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#166534', fontWeight: '600', backgroundColor: '#dcf8c6', padding: '8px 16px', borderRadius: '25px', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
              <Phone size={18} /> WhatsApp
            </a>
          )}
          
          {club.correo_contacto && (
            <a href={`mailto:${club.correo_contacto}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#374151', fontWeight: '600', backgroundColor: '#f3f4f6', padding: '8px 16px', borderRadius: '25px', fontSize: '0.9rem', border: '1px solid #e5e7eb' }}>
              <Mail size={18} /> Correo
            </a>
          )}

          {/* Iconos de Redes Sociales */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            {club.redes_sociales?.instagram && (
              <a href={club.redes_sociales.instagram.includes('http') ? club.redes_sociales.instagram : `https://instagram.com/${club.redes_sociales.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#E1306C', display: 'flex', alignItems: 'center', backgroundColor: '#fce7f3', padding: '10px', borderRadius: '50%', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <Instagram size={20} />
              </a>
            )}
            {club.redes_sociales?.tiktok && (
              <a href={club.redes_sociales.tiktok.includes('http') ? club.redes_sociales.tiktok : `https://tiktok.com/@${club.redes_sociales.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', backgroundColor: '#e2e8f0', padding: '10px', borderRadius: '50%', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <Video size={20} />
              </a>
            )}
            {club.redes_sociales?.facebook && (
              <a href={club.redes_sociales.facebook.includes('http') ? club.redes_sociales.facebook : `https://facebook.com/search/top/?q=${club.redes_sociales.facebook}`} target="_blank" rel="noreferrer" style={{ color: '#1877F2', display: 'flex', alignItems: 'center', backgroundColor: '#dbeafe', padding: '10px', borderRadius: '50%', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <Facebook size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Banner de Servicios */}
        {club.servicios && (
          <div style={{ padding: '15px 20px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', marginBottom: '10px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} /> Servicios del predio
            </h3>
            <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {club.servicios}
            </p>
          </div>
        )}
      </div>

      {/* GRILLA DE CANCHAS */}
      <div className="canchas-disponibles-container">
        <h2 className="titulo-canchas">Canchas Disponibles</h2>
        
        {canchas.length === 0 ? (
          <p className="no-canchas-msg">Este club aún no tiene canchas registradas.</p>
        ) : (
          <div className="canchas-galeria-grid">
            {canchas.map((cancha) => (
              <div key={cancha.id} className="cancha-tarjeta-premium" onClick={() => abrirModalDetalle(cancha)}>
                
                {/* Foto Previa en la Tarjeta */}
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

                {/* Info de la Tarjeta */}
                <div className="cancha-tarjeta-body">
                  <h3 className="cancha-tarjeta-titulo">{cancha.nombre}</h3>
                  
                  {/* NUEVO: Mini Detalles en la tarjeta */}
                  <div style={{ display: 'flex', gap: '12px', color: '#64748b', fontSize: '0.85rem', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Jugadores"><Users size={14}/> {cancha.cantidad_jugadores}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Superficie"><Layers size={14}/> {cancha.superficie || 'Sintético'}</span>
                    {cancha.techada && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb' }} title="Techada"><CloudRain size={14}/> Techada</span>}
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

      {/* ========================================================= */}
      {/* MODAL DETALLE DE CANCHA (CARRUSEL E INFO)                 */}
      {/* ========================================================= */}
      {canchaSeleccionada && (
        <div className="modal-cancha-overlay" onClick={cerrarModal}>
          <div className="modal-cancha-content" onClick={(e) => e.stopPropagation()}>
            
            <button className="btn-cerrar-modal" onClick={cerrarModal}>
              <X size={24} />
            </button>

            {/* ZONA SUPERIOR: CARRUSEL DE IMÁGENES */}
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

            {/* ZONA INFERIOR: INFO Y BOTÓN DE RESERVA */}
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
                
                {/* NUEVO: Especificaciones detalladas de la cancha */}
                <div className="detalle-bloque">
                  <span className="detalle-lbl">Especificaciones</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px', color: '#334155', fontSize: '0.95rem' }}>
                    <span><strong style={{color:'#0f172a'}}>Jugadores:</strong> {canchaSeleccionada.cantidad_jugadores} personas</span>
                    <span><strong style={{color:'#0f172a'}}>Tipo de piso:</strong> {canchaSeleccionada.superficie || 'No especificado'}</span>
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