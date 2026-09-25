import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, ArrowLeft, CalendarCheck, TrendingUp, Users, Smartphone, MessageCircleQuestion, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { precalentarApi } from '../../services/api';
import { useAuth } from '../../context/authContext';
import { usePagoPlan } from '../../hooks/usePagoPlan';
import { usePrecioPlan } from '../../hooks/usePlanes';
import { useFormspree } from '../../hooks/useFormspree';
import './Planes.css';

const Planes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { iniciar: iniciarPago, cargando, servidorLento, error: errorPago } = usePagoPlan('Full');
  const { precio, cargando: cargandoPrecio } = usePrecioPlan('Full');
  const { enviar: manejarEnvioDuda, enviando: enviandoDuda, enviado, error: errorDuda } = useFormspree('https://formspree.io/f/xrengjgv', { mensajeOk: 5000 });

  // Carrusel de imágenes
  const [imagenIndex, setImagenIndex] = useState(0);
  const imagenes = [
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000&auto=format&fit=crop", // Padel
    "https://images.unsplash.com/photo-1545809074-59472b3f5ecc?q=80&w=2000&auto=format&fit=crop", // Tenis
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop"  // Fútbol
  ];

  const nextImg = () => setImagenIndex((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
  const prevImg = () => setImagenIndex((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));

  // Despierta el backend (Render) mientras el usuario lee el plan, así el clic en "Comenzar" no espera el arranque en frío.
  useEffect(() => { precalentarApi(); }, []);

  const comenzar = () => {
    // Hace falta una cuenta: la suscripción se asocia a tu usuario cuando volvés de pagar.
    if (!user) { navigate('/registro-club'); return; }
    iniciarPago();
  };

  return (
    <div className="planes-page-modern">
      
      <nav className="planes-nav">
        <button onClick={() => navigate(-1)} className="btn-volver-modern">
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="planes-logo">
          GridPlay<span className="text-green">.</span>
        </div>
      </nav>

      <main className="planes-layout">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="planes-info-section">
          <span className="badge-exclusivo">PARA COMPLEJOS DEPORTIVOS</span>
          <h1 className="planes-titulo-main">
            ADMINISTRÁ TU CLUB DE <br/>LA MEJOR MANERA.
          </h1>
          <p className="planes-descripcion-main">
            Olvidate del papel y el lápiz. Digitalizá tus canchas, automatizá tus reservas y aumentá tus ingresos. Todo desde un solo lugar.
          </p>

          <div className="beneficios-grid">
            <div className="beneficio-item">
              <div className="ben-icon"><CalendarCheck size={24} /></div>
              <div>
                <h2>Reservas 24/7</h2>
                <p>Tus clientes reservan solos, incluso cuando dormís.</p>
              </div>
            </div>
            
            <div className="beneficio-item">
              <div className="ben-icon"><TrendingUp size={24} /></div>
              <div>
                <h2>Control de Ingresos</h2>
                <p>Métricas claras para saber cuánto rinde cada cancha.</p>
              </div>
            </div>
            
            <div className="beneficio-item">
              <div className="ben-icon"><Users size={24} /></div>
              <div>
                <h2>Base de Clientes</h2>
                <p>Conocé a tus jugadores y fidelizalos fácilmente.</p>
              </div>
            </div>
            
            <div className="beneficio-item">
              <div className="ben-icon"><Smartphone size={24} /></div>
              <div>
                <h2>Gestión Móvil</h2>
                <p>Administrá bloqueos y turnos desde tu celular.</p>
              </div>
            </div>
          </div>

          {/* NUEVO: CARRUSEL DE IMÁGENES EN LUGAR DE FOTO ESTÁTICA */}
          <div className="planes-carousel-contexto">
            <button onClick={prevImg} className="planes-car-btn left" type="button" aria-label="Foto anterior"><ChevronLeft size={24}/></button>
            <img 
              src={imagenes[imagenIndex]} 
              alt="Canchas" 
              className="planes-img-carousel"
            />
            <button onClick={nextImg} className="planes-car-btn right" type="button" aria-label="Foto siguiente"><ChevronRight size={24}/></button>
            
            {/* Indicadores (Puntitos) */}
            <div className="planes-car-dots">
              {imagenes.map((_, i) => (
                <span key={i} className={`car-dot ${i === imagenIndex ? 'active' : ''}`} onClick={() => setImagenIndex(i)}></span>
              ))}
            </div>

            <div className="overlay-imagen">
              <p>Sumate a los clubes que ya modernizaron su gestión.</p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (Tarjeta) */}
        <div className="planes-card-section">
          <div className="plan-card-premium">
            
            <div className="plan-badge-top">
              <Zap size={16} fill="currentColor" /> PLAN FULL
            </div>

            <div className="plan-precio-header">
              <h2 className="plan-nombre">Suscripción Mensual</h2>
              <div className="plan-precio-wrapper">
                <span className="plan-moneda">$</span>
                <span className="plan-monto">{cargandoPrecio ? '…' : precio ? precio.toLocaleString('es-AR') : 'Consultar'}</span>
                <span className="plan-periodo">/mes</span>
              </div>
              <p className="plan-sub-precio">Facturación mensual. Cancelá cuando quieras.</p>
            </div>

            <div className="plan-divisor"></div>

            <h3 className="plan-lista-titulo">¿Qué incluye?</h3>
            <div className="plan-beneficios-lista">
              {[
                'Canchas y reservas ilimitadas', 
                'Panel de administrador privado', 
                'Métricas de finanzas y ocupación', 
                'Bloqueo de horarios por mantenimiento', 
                'Soporte técnico prioritario 24/7',
                'Visibilidad en nuestra App'
              ].map((beneficio, index) => (
                <div key={index} className="plan-beneficio-row">
                  <CheckCircle size={20} className="check-verde" />
                  <span>{beneficio}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={comenzar}
              disabled={cargando}
              className={`btn-comprar-modern ${cargando ? 'cargando' : 'activo'}`}
            >
              {cargando ? 'Conectando con Mercado Pago…' : 'Comenzar ahora'}
            </button>
            {cargando && servidorLento && (
              <p className="pago-aviso" role="status">Estamos despertando el servidor, puede tardar unos segundos. No cierres esta página.</p>
            )}
            {errorPago && <p className="pago-error" role="alert">{errorPago}</p>}
            <p className="texto-seguro">Pago 100% seguro a través de Mercado Pago.</p>
          </div>
        </div>
      </main>

      {/* SECCIÓN FORMULARIO DE DUDAS (AHORA MODO OSCURO) */}
      <section className="planes-dudas-section oscuro" aria-labelledby="planes-dudas-titulo">
        <div className="planes-dudas-container">
          <div className="dudas-header">
            <MessageCircleQuestion size={48} className="icon-duda text-green" />
            <h2 id="planes-dudas-titulo">¿Tenés dudas antes de sumarte?</h2>
            <p>Dejanos tu consulta o tu teléfono y nuestro equipo se contactará con vos para asesorarte sin compromiso.</p>
          </div>

          {enviado ? (
            <div className="dudas-exito">
              <CheckCircle size={40} color="#22c55e" />
              <h3>¡Consulta enviada!</h3>
              <p>Nos vamos a comunicar con vos a la brevedad.</p>
            </div>
          ) : (
            <form onSubmit={manejarEnvioDuda} className="dudas-form">
              <div className="dudas-inputs-row">
                <input type="text" name="nombre_club" placeholder="Nombre de tu Club" required className="duda-input" />
                <input type="email" name="email" placeholder="Tu Email o Teléfono" required className="duda-input" />
              </div>
              <textarea name="mensaje" placeholder="Escribí tu duda acá..." required rows="4" className="duda-input duda-textarea"></textarea>
              {errorDuda && <p className="pago-error" role="alert">{errorDuda}</p>}
              <button type="submit" className="btn-enviar-duda" disabled={enviandoDuda}>
                {enviandoDuda ? 'Enviando…' : 'Enviar consulta'} <Send size={18} />
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
};

export default Planes;