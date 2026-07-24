import React, { useState } from 'react';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // Asegurate de que coincida mayúsculas/minúsculas

export default function LandingPage() {
  const navigate = useNavigate();

  // Datos iniciales para que la pantalla se vea completa y profesional
  const [provincias] = useState([
    { id: 'CBA', nombre: 'Córdoba', cantidad_canchas: 432 },
    { id: 'BUE', nombre: 'Buenos Aires', cantidad_canchas: 1250 },
    { id: 'SFE', nombre: 'Santa Fe', cantidad_canchas: 380 },
    { id: 'MZA', nombre: 'Mendoza', cantidad_canchas: 215 },
    { id: 'TUC', nombre: 'Tucumán', cantidad_canchas: 145 },
    { id: 'SLA', nombre: 'Salta', cantidad_canchas: 98 },
    { id: 'NQN', nombre: 'Neuquén', cantidad_canchas: 87 },
    { id: 'CABA', nombre: 'Capital Federal', cantidad_canchas: 512 },
  ]);

  const [cantidadCanchas] = useState({
    futbol: 1268,
    padel: 981,
    tenis: 385
  });

  // Esta función inicia el flujo: Provincia -> Ciudad -> Club -> Cancha
  const iniciarReserva = (provincia) => {
    // Acá podés mandarlo a tu próxima pantalla. 
    // Podrías pasarle el ID de la provincia por URL si querés.
    navigate('/seleccionar-ciudad'); 
  };

  return (
    <div className="landing-desktop">
      
      {/* SECCIÓN 1: HERO */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        
        {/* BARRA DE NAVEGACIÓN */}
        <nav className="navbar">
          <div className="logo">
            HayCancha<span className="text-green">.</span>
          </div>
          <div className="nav-buttons">
            {/* Solo dejamos el acceso para el dueño del predio */}
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
            <input type="text" placeholder="Provincia, ciudad o nombre del club..." />
            <button className="btn-search">BUSCAR</button>
          </div>

          <div className="quick-cities">
            {/* Chips rápidos debajo del buscador */}
            {['Córdoba', 'Capital Federal', 'Rosario', 'Mendoza'].map(prov => (
              <button key={prov} className="btn-city-chip">
                <MapPin size={14} className="icon-green" /> {prov}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: DEPORTES */}
      <main className="landing-main">
        <div className="section-divider">
          <hr /><span>ENCONTRÁ POR DEPORTE</span><hr />
        </div>

        <div className="sports-grid">
          <div className="sport-card active">
            <div className="sport-dot dot-green"></div>
            <h2>FÚTBOL</h2>
            <p className="sport-count">{cantidadCanchas.futbol} canchas</p>
            <p className="sport-link text-green">Ver Todas <ArrowRight size={16}/></p>
          </div>
          
          <div className="sport-card">
            <div className="sport-dot dot-cyan"></div>
            <h2>PÁDEL</h2>
            <p className="sport-count">{cantidadCanchas.padel} canchas</p>
            <p className="sport-link text-cyan">Ver Todas <ArrowRight size={16}/></p>
          </div>
          
          <div className="sport-card">
            <div className="sport-dot dot-lime"></div>
            <h2>TENIS</h2>
            <p className="sport-count">{cantidadCanchas.tenis} canchas</p>
            <p className="sport-link text-lime">Ver Todas <ArrowRight size={16}/></p>
          </div>
        </div>

        {/* SECCIÓN 3: PROVINCIAS */}
        <h2 className="section-title">EXPLORÁ POR PROVINCIA</h2>
        
        <div className="cities-grid">
          {provincias.map(provincia => (
            <div 
              key={provincia.id} 
              className="city-card"
              onClick={() => iniciarReserva(provincia)}
            >
              <div>
                <h4><span className="city-id">{provincia.id}</span> {provincia.nombre}</h4>
                <p>{provincia.cantidad_canchas} canchas</p>
              </div>
              <ArrowRight className="city-arrow" size={20} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}