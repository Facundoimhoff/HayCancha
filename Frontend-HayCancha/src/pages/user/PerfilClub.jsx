import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, ArrowLeft, Clock, ChevronLeft, ChevronRight, X, CalendarDays, Image as ImageIcon } from 'lucide-react';
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
                // ACÁ SEPARAMOS LAS FOTOS POR COMA
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