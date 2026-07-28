import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Ojo acá: Asegurate de que la "P" de LandingPage.css sea igual al nombre de tu archivo.
import './LandingPage.css'; 

export default function LandingPage() {
  const navigate = useNavigate();

  const provincias = [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
    "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego",
    "Tucumán", "Ciudad Autónoma de Buenos Aires"
  ];

  return (
    <div className="landing-desktop">
      
      {/* --- PARTE DE ARRIBA (BLOQUE GRIS) --- */}
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

          <div className="search-box">
            <Search className="search-icon" size={24} />
            <input type="text" placeholder="Barrio, ciudad o nombre del club..." />
            <button className="btn-search">BUSCAR</button>
          </div>
        </div>
      </section>

      {/* --- PARTE DE ABAJO (SCROLL HACIA LAS PROVINCIAS) --- */}
      <main className="landing-main">
        <h2 className="section-title">EXPLORÁ POR PROVINCIA</h2>

        <div className="provincias-grid">
          {provincias.map((provincia) => (
            <div
              key={provincia}
              className="provincia-card"
              // Esto arranca el flujo hacia la siguiente pantalla
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
      
    </div>
  );
}