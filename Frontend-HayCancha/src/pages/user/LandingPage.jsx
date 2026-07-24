import React, { useState, useEffect } from 'react';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Landingpage.css';

export default function Landingpage() {
  const navigate = useNavigate();

  const [ciudades, setCiudades] = useState([]);
  const [ciudadesPopulares, setCiudadesPopulares] = useState([]);
  const provincias = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
  "Ciudad Autónoma de Buenos Aires"
];

  useEffect(() => {
  }, []);

  return (
    <div className="landing-desktop">
      <section className="hero-section">
        <div className="hero-overlay"></div>
        
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
            <button 
              className="btn-client"
              onClick={() => navigate('/login-cliente')}
            >
              Entrar como Cliente
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

          <div className="quick-cities">
            {ciudadesPopulares.map(city => (
              <button key={city.id} className="btn-city-chip">
                <MapPin size={14} className="icon-green" /> {city.nombre}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="landing-main">
        <div className="section-divider">
          <hr /><span>ENCONTRÁ POR DEPORTE</span><hr />
        </div>

        <h2 className="section-title">EXPLORÁ POR PROVINCIA</h2>

<div className="provincias-grid">
  {provincias.map((provincia) => (
    <div
      key={provincia}
      className="provincia-card"
      onClick={() => console.log(provincia)}
    >
      <div>
        <h4>{provincia}</h4>
        <p>Ver ciudades</p>
      </div>

      <ArrowRight className="city-arrow" size={20} />
    </div>
  ))}
</div>

<h2 className="section-title" style={{ marginTop: '80px' }}>
  EXPLORÁ POR CIUDAD
</h2>

        <h2 className="section-title">EXPLORÁ POR CIUDAD</h2>
        
        <div className="cities-grid">
          {ciudades.length > 0 ? (
            ciudades.map(city => (
              <div key={city.id} className="city-card">
                <div>
                  <h4><span className="city-id">{city.codigo || city.id}</span> {city.nombre}</h4>
                  <p>{city.cantidad_canchas || 0} canchas</p>
                </div>
                <ArrowRight className="city-arrow" size={20} />
              </div>
            ))
          ) : (
            <p style={{ color: '#64748b', fontWeight: '500' }}>Cargando ciudades...</p>
          )}
        </div>
      </main>
    </div>
  );
}