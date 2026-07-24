import React, { useState } from 'react';
import { Search, MapPin, ArrowRight, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const provincias = [
    { id: 'CABA', nombre: 'Capital Federal' },
    { id: 'BUE', nombre: 'Buenos Aires' },
    { id: 'CAT', nombre: 'Catamarca' },
    { id: 'CHA', nombre: 'Chaco' },
    { id: 'CHU', nombre: 'Chubut' },
    { id: 'CBA', nombre: 'Córdoba' },
    { id: 'COR', nombre: 'Corrientes' },
    { id: 'ENT', nombre: 'Entre Ríos' },
    { id: 'FOR', nombre: 'Formosa' },
    { id: 'JUJ', nombre: 'Jujuy' },
    { id: 'LAP', nombre: 'La Pampa' },
    { id: 'LAR', nombre: 'La Rioja' },
    { id: 'MZA', nombre: 'Mendoza' },
    { id: 'MIS', nombre: 'Misiones' },
    { id: 'NEU', nombre: 'Neuquén' },
    { id: 'RIO', nombre: 'Río Negro' },
    { id: 'SAL', nombre: 'Salta' },
    { id: 'SJU', nombre: 'San Juan' },
    { id: 'SLU', nombre: 'San Luis' },
    { id: 'SCR', nombre: 'Santa Cruz' },
    { id: 'SFE', nombre: 'Santa Fe' },
    { id: 'SDE', nombre: 'Santiago del Estero' },
    { id: 'TDF', nombre: 'Tierra del Fuego' },
    { id: 'TUC', nombre: 'Tucumán' }
  ];

  const iniciarReserva = (provincia) => {
    navigate('/seleccionar-ciudad'); 
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-overlay"></div>
        
        <nav className="navbar">
          <div className="logo">
            HayCancha<span className="text-green">.</span>
          </div>
          
          <div className="nav-buttons desktop-only">
            <button 
              className="btn-admin"
              onClick={() => navigate('/login-admin')}
            >
              Acceso Administrador
            </button>
          </div>

          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMobileMenuOpen ? <X size={28} color="white" /> : <Menu size={28} color="white" />}
          </button>

          <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <button 
              className="btn-admin-mobile"
              onClick={() => {
                toggleMenu();
                navigate('/login-admin');
              }}
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
            {['Córdoba', 'Capital Federal', 'Rosario', 'Mendoza'].map(prov => (
              <button key={prov} className="btn-city-chip">
                <MapPin size={14} className="icon-green" /> {prov}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="landing-main">
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
              </div>
              <ArrowRight className="city-arrow" size={20} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}