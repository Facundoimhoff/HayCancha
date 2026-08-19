import React, { useState } from 'react';
import { Search, ArrowRight, Send, CheckCircle, Phone, Zap, MapPin, ChevronUp, X, Menu, Mail, BarChart3, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FAQ from './FAQ';
import './LandingPage.css'; 
import { createPortal } from 'react-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [enviado, setEnviado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // --- Buscador de provincias en mobile (reemplaza al <select>) ---
  const [busquedaProvinciaMobile, setBusquedaProvinciaMobile] = useState('');

  const provincias = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
    "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego",
    "Tucumán", "Ciudad Autónoma de Buenos Aires"
  ];

  const provinciasFiltradasMobile = provincias.filter((p) =>
    p.toLowerCase().includes(busquedaProvinciaMobile.trim().toLowerCase())
  );

  const manejarBusqueda = (e) => {
    e.preventDefault(); 
    if (busqueda.trim() !== '') {
      navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/xzeppakb", {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        setEnviado(true);
        form.reset();
        setTimeout(() => setEnviado(false), 4000); 
      }
    } catch (error) {
      alert("Hubo un error al enviar el mensaje.");
    }
  };

  const scrollToSection = (id) => {
    setSidebarAbierto(false); 
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const numeroWhatsApp = "5493564609641"; 
  const mensajeWhatsApp = "Hola GridPlay! Tengo un complejo deportivo y me gustaría conocer más sobre el sistema para sumar mi club.";
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="landing-desktop">
      
      {sidebarAbierto && (
        <div className="sidebar-overlay-landing" onClick={() => setSidebarAbierto(false)}></div>
      )}
      
      <div className={`sidebar-landing ${sidebarAbierto ? 'abierto' : ''}`}>
        <div className="sidebar-landing-links">
          <button onClick={() => scrollToSection('top')}>Buscar cancha</button>
          <button onClick={() => scrollToSection('provincias')}>Explorar</button>
          <button onClick={() => scrollToSection('contacto')}>Contacto</button>
          <button onClick={() => scrollToSection('faq')}>Preguntas Frecuentes</button>
          <button onClick={() => { setSidebarAbierto(false); navigate('/planes'); }}>Planes</button>
        </div>
        
        <div className="sidebar-landing-footer">
          <button className="btn-soy-admin-sidebar" onClick={() => navigate('/login-admin')}>
            SOY ADMIN
          </button>
        </div>
      </div>

      <section className="hero-section" id="top">
        <nav className="navbar">
          <button className="btn-hamburguesa-landing" onClick={() => setSidebarAbierto(true)}>
            <Menu size={28} />
          </button>

          {/* LOGO CON ESTILO (Clickeable para ir arriba) */}
          <div className="logo" onClick={() => scrollToSection('top')} style={{ cursor: 'pointer' }}>
            GridPlay<span className="text-green">.</span>
          </div>

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="nav-buttons">
            <button className="btn-nav ocultar-movil" onClick={() => scrollToSection('provincias')}>Explorar</button>
            <button className="btn-nav ocultar-movil" onClick={() => scrollToSection('contacto')}>Contacto</button>
            <button className="btn-nav ocultar-movil" onClick={() => scrollToSection('faq')}>Preguntas Frecuentes</button>
            <button className="btn-nav ocultar-movil" onClick={() => navigate('/planes')}>Planes</button>
            <button className="btn-nav btn-soy-admin ocultar-movil" onClick={() => navigate('/login-admin')}>
              Soy Admin
            </button>
          </div>
        </nav>

        <div className="hero-content">
          <p className="hero-subtitle">
            <span className="dot-green"></span>
            Tu próximo partido empieza acá.
          </p>
          <h1 className="hero-title">
            La red que<br />conecta<br /><span className="text-green">complejos deportivos</span>
          </h1>
          <p className="hero-description">
            Encontrá clubes y canchas de tenis, pádel y fútbol, etc. Gratis y sin vueltas.
          </p>

          {/* BUSCADOR CENTRAL (MOBILE/TABLET) */}
          <form className="search-box-mobile" onSubmit={manejarBusqueda}>
            <div className="input-wrapper-mobile">
              <Search className="search-icon-mobile" size={20} />
              <input 
                type="text" 
                placeholder="Buscar club, ciudad..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-search-mobile">BUSCAR</button>
          </form>
        </div>

      </section>

      <main className="landing-main" id="provincias">
        <div className="provincias-container-modern">
          <h2 className="section-title">ELEGÍ TU UBICACIÓN</h2>
          <p className="section-subtitle">Seleccioná tu provincia para ver los clubes disponibles.</p>
          
          {/* GRILLA DE PROVINCIAS — SOLO DESKTOP (≥1024px) */}
          <div className="provincias-grid-desktop">
            {provincias.map((prov) => (
              <button 
                key={prov} 
                className="provincia-card-btn"
                onClick={() => navigate(`/seleccionar-ubicacion/${encodeURIComponent(prov)}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={20} className="provincia-icon" />
                  <span>{prov}</span>
                </div>
                <ArrowRight size={18} className="arrow-icon" />
              </button>
            ))}
          </div>

          {/* BUSCADOR DE PROVINCIAS — SOLO MÓVIL/TABLET (<1024px) */}
          <div className="buscador-provincia-mobile-wrapper provincias-dropdown-mobile">
            <div className="input-buscar-provincia">
              <MapPin size={20} className="icono-pin-prov" />
              <input
                type="text"
                placeholder="Buscar tu provincia..."
                value={busquedaProvinciaMobile}
                onChange={(e) => setBusquedaProvinciaMobile(e.target.value)}
              />
            </div>

            <div className="lista-provincias-mobile">
              {provinciasFiltradasMobile.length > 0 ? (
                provinciasFiltradasMobile.map((provincia) => (
                  <button
                    key={provincia}
                    className="provincia-item-mobile"
                    onClick={() => navigate(`/seleccionar-ubicacion/${encodeURIComponent(provincia)}`)}
                  >
                    <span>{provincia}</span>
                    <ArrowRight size={16} />
                  </button>
                ))
              ) : (
                <p className="provincia-sin-resultados">No encontramos "{busquedaProvinciaMobile}"</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- NUEVA SECCIÓN: FUNCIONALIDADES / SOFTWARE --- */}
      <section className="software-highlight-section">
        <div className="software-container">
          
          {/* Lado Izquierdo: Gráfico/Mockup */}
          <div className="software-visual">
            <div className="mockup-dashboard">
              <div className="mockup-header">
                <div className="dots"><span></span><span></span><span></span></div>
                <div className="mockup-title-bar">Panel Administrativo</div>
              </div>
              <div className="mockup-body">
                <div className="mockup-card-metric">
                  <div className="metric-icon bg-blue"><CalendarDays size={20} color="#2563eb"/></div>
                  <div className="metric-text">
                    <span>Turnos de Hoy</span>
                    <strong>24 Reservas</strong>
                  </div>
                </div>
                <div className="mockup-card-metric">
                  <div className="metric-icon bg-green"><BarChart3 size={20} color="#16a34a"/></div>
                  <div className="metric-text">
                    <span>Ingresos</span>
                    <strong>$145.000</strong>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notificaciones Flotantes */}
            <div className="mockup-floating f-left">
              <CheckCircle size={18} color="#16a34a"/> Nuevo turno 20:00hs
            </div>
            <div className="mockup-floating f-right">
              <Zap size={18} color="#eab308"/> Venta Kiosco
            </div>
          </div>

          {/* Lado Derecho: Textos y Botones */}
          <div className="software-text">
            <span className="software-eyebrow">SISTEMA DE GESTIÓN INTELIGENTE</span>
            <h2 className="software-title">
              Llevá tu complejo al <span className="text-green">siguiente nivel.</span>
            </h2>
            <p className="software-desc">
              Olvidate del cuaderno, los mensajes perdidos y los choques de horarios. Con GridPlay, tus clientes pueden consultar disponibilidad y reservar online las 24 hs. 
              <br/><br/>
              Además, controlá el kiosco, bloqueá horarios por mantenimiento y accedé a reportes financieros automáticos desde cualquier dispositivo. Sin instalar nada.
            </p>
            
            <div className="software-actions">
              <button className="btn-software-primary" onClick={() => navigate('/planes')}>
                Conocé los Planes <ArrowRight size={18} />
              </button>
              <button className="btn-software-secondary" onClick={() => navigate('/funcionalidades')}>
                Ver Funcionalidades
              </button>
            </div>
          </div>

        </div>
      </section>

      <section className="contact-section" id="contacto">
        <div className="contact-container">
          <div className="contact-text-block">
            <h2 className="contact-title">¿TENÉS UN CLUB?</h2>
            <h2 className="contact-title text-green">SUMATE A LA RED.</h2>
            <p className="contact-description">
              Dejanos tus datos, sugerencias o dudas y nuestro equipo se va a poner en contacto con vos para digitalizar tus reservas.
            </p>
          </div>
          <div className="contact-form-block">
            {enviado ? (
              <div className="contact-success">
                <CheckCircle size={60} color="#22c55e" />
                <h3>¡MENSAJE ENVIADO!</h3>
                <p>Nos contactaremos a la brevedad.</p>
              </div>
            ) : (
              <form onSubmit={manejarEnvio} className="contact-form">
                <div className="form-group">
                  <input type="text" name="nombre" required placeholder="Tu Nombre / Empresa" className="sport-input" />
                </div>
                <div className="form-group">
                  <input type="email" name="email" required placeholder="Email de contacto" className="sport-input" />
                </div>
                <div className="form-group">
                  <textarea name="mensaje" required rows="4" placeholder="Dejanos tu comentario..." className="sport-input sport-textarea"></textarea>
                </div>
                <button type="submit" className="btn-submit-sport">ENVIAR MENSAJE <Send size={18} /></button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- SECCIÓN: PREGUNTAS FRECUENTES (FAQ) --- */}
      <div id="faq">
        <FAQ />
      </div>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">GridPlay<span className="text-green">.</span></div>
          <p className="footer-tagline">Hecho 100% para complejos deportivos.</p>
          
          <div className="footer-contacto">
            <a href="https://www.instagram.com/gridplay.app/" target="_blank" rel="noreferrer" className="footer-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              @gridplay.app
            </a>
            <a href={linkWhatsApp} target="_blank" rel="noreferrer" className="footer-link">
              <Phone size={20} /> 3564-609641
            </a>
            <a 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=supportgridplay@gmail.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              <Mail size={18} /> supportgridplay@gmail.com
            </a>
          </div>
          
          <div className="footer-divisor"></div>
          <div className="footer-copyright" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div className="enlaces-legales" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => navigate('/terminos')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>Términos y Condiciones</button>
              <button onClick={() => navigate('/privacidad')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>Política de Privacidad</button>
            </div>
            <p style={{ margin: 0 }}>© 2026 GridPlay. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {createPortal(
        <div className="menu-flotante-container">
          <div className={`menu-flotante-opciones ${menuAbierto ? 'abierto' : ''}`}>
            
            <button onClick={() => navigate('/planes')} className="opcion-flotante btn-planes">
              <span className="opcion-tooltip">Conocé los planes</span>
              <div className="icon-circle bg-dark">
                <Zap size={22} color="#f59e0b" />
              </div>
            </button>
            
            <a href={linkWhatsApp} target="_blank" rel="noreferrer" className="opcion-flotante btn-wp">
              <span className="opcion-tooltip">Escribinos al WhatsApp</span>
              <div className="icon-circle bg-whatsapp">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                  alt="WhatsApp"
                  className="whatsapp-logo-img" 
                />
              </div>
            </a>

          </div>
          <button className={`menu-flotante-principal ${menuAbierto ? 'abierto' : ''}`} onClick={() => setMenuAbierto(!menuAbierto)}>
            {menuAbierto ? <X size={30} /> : <ChevronUp size={32} />}
          </button>
        </div>,
        document.body /* <--- Esta es la magia que lo saca de la jaula */
      )}
      
    </div>
  );
}