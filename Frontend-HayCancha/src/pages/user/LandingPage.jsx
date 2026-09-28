import { useState } from 'react';
import { ArrowRight, Phone, Zap, MapPin, ChevronUp, X, Menu, Mail, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SeccionCercania from '../../components/user/SeccionCercania';
import ComoFunciona from '../../components/user/ComoFunciona';
import ResenasPortada from '../../components/user/ResenasPortada';
import './LandingPage.css';
import { createPortal } from 'react-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [mailCopiado, setMailCopiado] = useState(false);

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

  // Mail de contacto: mailto (abre la app de correo, en el celular también) y botón para copiarlo si no hay app configurada
  const mailContacto = 'supportgridplay@gmail.com';
  const linkMail = `mailto:${mailContacto}?subject=${encodeURIComponent('Consulta desde GridPlay')}`;
  const copiarMail = async () => {
    try {
      await navigator.clipboard.writeText(mailContacto);
    } catch {
      const campo = document.createElement('textarea');
      campo.value = mailContacto;
      campo.style.position = 'fixed';
      campo.style.opacity = '0';
      document.body.appendChild(campo);
      campo.select();
      try { document.execCommand('copy'); } catch { /* sin permiso para copiar: el mail queda visible para copiarlo a mano */ }
      document.body.removeChild(campo);
    }
    setMailCopiado(true);
    setTimeout(() => setMailCopiado(false), 2000);
  };

  return (
    <div className="landing-desktop">
      
      {sidebarAbierto && (
        <div className="sidebar-overlay-landing" onClick={() => setSidebarAbierto(false)}></div>
      )}
      
      <div className={`sidebar-landing ${sidebarAbierto ? 'abierto' : ''}`}>
        <div className="sidebar-landing-links">
          <button onClick={() => scrollToSection('top')}>Buscar cancha</button>
          <button onClick={() => scrollToSection('provincias')}>Explorar</button>
          <button onClick={() => { setSidebarAbierto(false); navigate('/funcionalidades'); }}>Conocé GridPlay</button>
          <button onClick={() => { setSidebarAbierto(false); navigate('/planes'); }}>Planes</button>
        </div>
        
        <div className="sidebar-landing-footer">
          <button className="btn-soy-admin-sidebar" onClick={() => navigate('/login-admin')}>
            SOY ADMIN
          </button>
        </div>
      </div>

      <main>
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
            <button className="btn-nav ocultar-movil" onClick={() => navigate('/funcionalidades')}>Conocé GridPlay</button>
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
        </div>

      </section>

      <SeccionCercania />

      <section className="landing-main" id="provincias">
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
      </section>

      <ComoFunciona />

      <ResenasPortada />

      {/* Todo lo de dueños de club (funcionalidades, preguntas frecuentes, alta) vive en /funcionalidades */}
      <section className="conoce-club-section">
        <p>¿Tenés un club?</p>
        <button type="button" className="gp-btn gp-btn--primario" onClick={() => navigate('/funcionalidades')}>
          Conocé GridPlay <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
      </main>

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
            <span className="footer-mail">
              <a href={linkMail} className="footer-link">
                <Mail size={18} /> {mailContacto}
              </a>
              <button type="button" className="footer-copiar" onClick={copiarMail} aria-label={mailCopiado ? 'Mail copiado' : 'Copiar el mail de contacto'} title="Copiar mail">
                {mailCopiado ? <Check size={16} /> : <Copy size={16} />}
                <span aria-live="polite">{mailCopiado ? 'Copiado' : 'Copiar'}</span>
              </button>
            </span>
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
        <aside className="menu-flotante-container" aria-label="Accesos rápidos">
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
          <button type="button" className={`menu-flotante-principal ${menuAbierto ? 'abierto' : ''}`} onClick={() => setMenuAbierto(!menuAbierto)} aria-label={menuAbierto ? 'Cerrar el menú de accesos rápidos' : 'Abrir el menú de accesos rápidos'} aria-expanded={menuAbierto}>
            {menuAbierto ? <X size={30} /> : <ChevronUp size={32} />}
          </button>
        </aside>,
        document.body /* <--- Esta es la magia que lo saca de la jaula */
      )}
      
    </div>
  );
}