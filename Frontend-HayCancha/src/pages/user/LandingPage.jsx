import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const provincias = [
    { nombre: "Ciudad Autónoma de Buenos Aires", codigo: "CABA" },
    { nombre: "Buenos Aires", codigo: "BUE" },
    { nombre: "Catamarca", codigo: "CAT" },
    { nombre: "Chaco", codigo: "CHA" },
    { nombre: "Chubut", codigo: "CHU" },
    { nombre: "Córdoba", codigo: "CBA" },
    { nombre: "Corrientes", codigo: "COR" },
    { nombre: "Entre Ríos", codigo: "ENT" },
    { nombre: "Formosa", codigo: "FOR" },
    { nombre: "Jujuy", codigo: "JUJ" },
    { nombre: "La Pampa", codigo: "LAP" },
    { nombre: "La Rioja", codigo: "LAR" },
    { nombre: "Mendoza", codigo: "MZA" },
    { nombre: "Misiones", codigo: "MIS" },
    { nombre: "Neuquén", codigo: "NEU" },
    { nombre: "Río Negro", codigo: "RIO" },
    { nombre: "Salta", codigo: "SAL" },
    { nombre: "San Juan", codigo: "SJU" },
    { nombre: "San Luis", codigo: "SLU" },
    { nombre: "Santa Cruz", codigo: "SCR" },
    { nombre: "Santa Fe", codigo: "SFE" },
    { nombre: "Santiago del Estero", codigo: "SDE" },
    { nombre: "Tierra del Fuego", codigo: "TDF" },
    { nombre: "Tucumán", codigo: "TUC" },
  ];

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

          <div className="search-box">
            <Search className="search-icon" size={22} />
            <input type="text" placeholder="Barrio, ciudad o nombre del club..." />
            <button className="btn-search">BUSCAR</button>
          </div>
        </div>
      </section>

      {/* --- PARTE DE ABAJO (PROVINCIAS) --- */}
      <main className="landing-main">
        <h2 className="section-title">Explorá por provincia</h2>

        <div className="provincias-grid">
          {provincias.map(({ nombre, codigo }) => (
            <div
              key={nombre}
              className="provincia-card"
              onClick={() => navigate('/seleccionar-ciudad')}
            >
              <div>
                <div className="provincia-info">
                  <span className="provincia-codigo">{codigo}</span>
                  <h4>{nombre}</h4>
                </div>
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