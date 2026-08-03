import React, { useState } from 'react';
import { Search, ArrowRight, Send, CheckCircle, ChevronLeft, ChevronRight, Phone, Zap, MapPin, ChevronUp, X, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; 

export default function LandingPage() {
  const navigate = useNavigate();
  
  const [enviado, setEnviado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const provincias = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
    "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego",
    "Tucumán", "Ciudad Autónoma de Buenos Aires"
  ];

  const deportes = [
    { nombre: "FÚTBOL", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop" },
    { nombre: "TENIS", img: "https://images.unsplash.com/photo-1545809074-59472b3f5ecc?q=80&w=2000&auto=format&fit=crop" },
    { nombre: "PÁDEL", img: "https://plus.unsplash.com/premium_photo-1708692919998-e3dc853ef8a8?q=80&w=2000&auto=format&fit=crop" },
    { nombre: "VÓLEY", img: "https://plus.unsplash.com/premium_photo-1708696216326-0317bac37b82?q=80&w=2000&auto=format&fit=crop" },
    { nombre: "BEACH VÓLEY", img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2000&auto=format&fit=crop" }
  ];

  const nextSlide = () => setSlideIndex((prev) => (prev === deportes.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setSlideIndex((prev) => (prev === 0 ? deportes.length - 1 : prev - 1));

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
      const response = await fetch("https://formspree.io/f/xrengjgv", {
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
          
          {/* 👇 NUEVO BOTÓN PLANES EN MÓVIL 👇 */}
          <button onClick={() => { setSidebarAbierto(false); navigate('/planes'); }}>Planes</button>
          
          <button onClick={() => scrollToSection('contacto')}>Contacto</button>
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

          <div className="logo">
            GridPlay<span className="text-green">.</span>
          </div>

          <div className="nav-buttons">
            <button className="btn-nav ocultar-movil" onClick={() => scrollToSection('provincias')}>Explorar</button>
            
            {/* 👇 NUEVO BOTÓN PLANES EN PC 👇 */}
            <button className="btn-nav ocultar-movil" onClick={() => navigate('/planes')}>Planes</button>
            
            <button className="btn-nav ocultar-movil" onClick={() => scrollToSection('contacto')}>Contacto</button>
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

          <form className="search-box" onSubmit={manejarBusqueda}>
            <Search className="search-icon" size={24} />
            <input 
              type="text" 
              placeholder="Barrio, ciudad o club..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button type="submit" className="btn-search">BUSCAR</button>
          </form>
        </div>
      </section>

      <main className="landing-main" id="provincias">
        <div className="provincias-container-modern">
          <h2 className="section-title">ELEGÍ TU UBICACIÓN</h2>
          <p className="section-subtitle">Seleccioná tu provincia para ver los clubes disponibles.</p>
          
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

          <div className="selector-provincia-wrapper provincias-dropdown-mobile">
            <MapPin size={24} className="icono-pin-prov" />
            <select 
              className="select-provincia"
              onChange={(e) => {
                if (e.target.value) {
                  navigate(`/seleccionar-ubicacion/${encodeURIComponent(e.target.value)}`);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Tocá acá para elegir tu provincia...</option>
              {provincias.map((provincia) => (
                <option key={provincia} value={provincia}>{provincia}</option>
              ))}
            </select>
          </div>

        </div>
      </main>

      <section className="sports-carousel-section">
        <h2 className="section-title">¿QUÉ DEPORTE VAS A JUGAR?</h2>
        <div className="carousel-container">
          <button onClick={prevSlide} className="carousel-btn left" type="button"><ChevronLeft size={28} /></button>
          <div className="carousel-track-wrapper">
            <div className="carousel-track" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
              {deportes.map((dep, idx) => (
                <div key={idx} className="carousel-slide">
                  <img src={dep.img} alt={dep.nombre} />
                  <div className="slide-overlay"><h3>{dep.nombre}</h3></div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={nextSlide} className="carousel-btn right" type="button"><ChevronRight size={28} /></button>
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

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">GridPlay<span className="text-green">.</span></div>
          <p className="footer-tagline">Hecho 100% para complejos deportivos.</p>
          
          <div className="footer-contacto">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-link">
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
          </div>
          
         <div className="footer-divisor"></div>
          <div className="footer-copyright" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div className="enlaces-legales" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              
              {/* Cambiamos las etiquetas <a> por botones invisibles usando navigate */}
              <button onClick={() => navigate('/terminos')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>Términos y Condiciones</button>
              
              <button onClick={() => navigate('/privacidad')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>Política de Privacidad</button>
              
            </div>
            <p style={{ margin: 0 }}>© 2026 GridPlay. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <div className="menu-flotante-container">
        <div className={`menu-flotante-opciones ${menuAbierto ? 'abierto' : ''}`}>
          <button onClick={() => navigate('/planes')} className="opcion-flotante btn-planes">
            <span className="opcion-tooltip">Conocé los planes</span>
            <Zap size={22} />
          </button>
          <a href={linkWhatsApp} target="_blank" rel="noreferrer" className="opcion-flotante btn-wp">
            <span className="opcion-tooltip">Escribinos al WhatsApp</span>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.12.553 4.183 1.603 6L.516 23.484l5.603-1.47c1.745.96 3.722 1.47 5.912 1.47 6.646 0 12.031-5.385 12.031-12.031C24 5.385 18.615 0 12.031 0zm3.625 17.156c-.156.44-1.281 1.094-1.844 1.156-.563.063-1.094.22-3.156-.562-2.47-1-4.063-3.625-4.188-3.781-.125-.156-1-1.344-1-2.563s.625-1.781.844-2.031c.219-.25.563-.312.75-.312.188 0 .375.031.531.406.188.438.625 1.563.688 1.688.063.125.125.312.031.5-.094.188-.156.281-.281.438-.125.156-.281.344-.375.438-.125.125-.281.25-.125.531.156.281.688 1.156 1.469 1.844.969.875 1.813 1.156 2.094 1.281.281.125.438.094.625-.094.188-.188.75-.875.938-1.188.188-.312.375-.25.625-.156.25.094 1.563.75 1.844.875.281.125.469.188.531.281.063.125.063.688-.094 1.125z"/>
            </svg>
          </a>
        </div>
        <button className={`menu-flotante-principal ${menuAbierto ? 'abierto' : ''}`} onClick={() => setMenuAbierto(!menuAbierto)}>
          {menuAbierto ? <X size={30} /> : <ChevronUp size={32} />}
        </button>
      </div>
      
    </div>
  );
}