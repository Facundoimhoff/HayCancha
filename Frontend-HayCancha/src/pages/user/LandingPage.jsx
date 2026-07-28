import React, { useState } from 'react';
import { Search, ArrowRight, Send, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; 

export default function LandingPage() {
  const navigate = useNavigate();
  
  // Estado para el formulario de contacto
  const [enviado, setEnviado] = useState(false);
  
  // NUEVO: Estado para guardar lo que se escribe en el buscador
  const [busqueda, setBusqueda] = useState('');

  const [slideIndex, setSlideIndex] = useState(0);
  
  const deportes = [
    { 
      nombre: "FÚTBOL", 
      img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop" 
    },
    { 
      nombre: "TENIS", 
      img: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=2000&auto=format&fit=crop" // <-- La que antes estaba en pádel
    },
    { 
      nombre: "PÁDEL", 
      img: "https://images.unsplash.com/photo-1625510657159-26c36780825c?q=80&w=2000&auto=format&fit=crop" // <-- Una paleta de pádel real con la reja/blindex
    },
    { 
      nombre: "VÓLEY", 
      img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2000&auto=format&fit=crop" 
    },
    { 
      nombre: "BEACH VÓLEY", 
      img: "https://images.unsplash.com/photo-1593510526084-2a6cfa029202?q=80&w=2000&auto=format&fit=crop" // <-- Una foto clara de Beach Vóley en la arena
    }
  ];

  const nextSlide = () => {
    setSlideIndex((prev) => (prev === deportes.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev === 0 ? deportes.length - 1 : prev - 1));
  };

  const provincias = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
    "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego",
    "Tucumán", "Ciudad Autónoma de Buenos Aires"
  ];

  // NUEVO: Lógica para ejecutar la búsqueda
  const manejarBusqueda = (e) => {
    e.preventDefault(); // Evita que la página se recargue sola
    if (busqueda.trim() !== '') {
      // Te redirige a tu pantalla de búsqueda pasando el texto por URL
      // (Ejemplo: misitio.com/buscar?q=padel)
      navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  // Lógica de Formspree integrada
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

  return (
    <div className="landing-desktop">
      
      {/* --- PARTE DE ARRIBA (HERO OSCURO) --- */}
      <section className="hero-section">
        <nav className="navbar">
          <div className="logo">
            HayCancha<span className="text-green">.</span>
          </div>
          <div className="nav-buttons">
            <button 
              className="btn-admin"
              onClick={() => navigate('/login-admin')}
            >
              Acceso Administrador
            </button>
          </div>
        </nav>

        <div className="hero-content">
          <p className="hero-subtitle">
            <span className="dot-green"></span>
            El directorio de canchas de tu zona
          </p>
          
          <h1 className="hero-title">
            Tu próximo<br />
            partido<br />
            <span className="text-green">empieza acá.</span>
          </h1>
          
          <p className="hero-description">
            Encontrá clubes y canchas de tenis, pádel y fútbol. Gratis y sin vueltas.
          </p>

          {/* NUEVO: Buscador convertido en formulario interactivo */}
          <form className="search-box" onSubmit={manejarBusqueda}>
            <Search className="search-icon" size={24} />
            <input 
              type="text" 
              placeholder="Barrio, ciudad o nombre del club..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button type="submit" className="btn-search">BUSCAR</button>
          </form>
          
        </div>
      </section>

      {/* --- PARTE DEL MEDIO (PROVINCIAS CLARO) --- */}
      <main className="landing-main">
        <h2 className="section-title">EXPLORÁ POR PROVINCIA</h2>

        <div className="provincias-grid">
          {provincias.map((provincia) => (
            <div
              key={provincia}
              className="provincia-card"
              onClick={() => navigate('/seleccionar-ciudad')} 
            >
              <div>
                <h4>{provincia}</h4>
                <p>Ver ciudades</p>
              </div>
              <ArrowRight className="city-arrow" size={20} />
            </div>
          ))}
        </div>
      </main>

{/* --- NUEVO: CARRUSEL DE DEPORTES --- */}
      <section className="sports-carousel-section">
        <h2 className="section-title">¿QUÉ DEPORTE JUGÁS?</h2>
        
        <div className="carousel-container">
          <button onClick={prevSlide} className="carousel-btn left" type="button">
            <ChevronLeft size={28} />
          </button>
          
          <div className="carousel-track-wrapper">
            <div 
              className="carousel-track" 
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              {deportes.map((dep, idx) => (
                <div key={idx} className="carousel-slide">
                  <img src={dep.img} alt={dep.nombre} />
                  <div className="slide-overlay">
                    <h3>{dep.nombre}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={nextSlide} className="carousel-btn right" type="button">
            <ChevronRight size={28} />
          </button>
        </div>
      </section>
      
      {/* --- PARTE DE ABAJO (CONTACTO/NEWSLETTER) --- */}
      <section className="contact-section">
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
                  <input 
                    type="text" 
                    name="nombre" 
                    required 
                    placeholder="Tu Nombre / Empresa" 
                    className="sport-input" 
                  />
                </div>
                
                <div className="form-group">
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    placeholder="Email de contacto" 
                    className="sport-input" 
                  />
                </div>

                <div className="form-group">
                  <textarea 
                    name="mensaje" 
                    required 
                    rows="4" 
                    placeholder="Dejanos tu comentario..." 
                    className="sport-input sport-textarea"
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit-sport">
                  ENVIAR MENSAJE <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      
    </div>
  );
}