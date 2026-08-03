import React, { useState, useEffect } from 'react';
import './CookieBanner.css';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Revisamos si el usuario ya contestó antes
    const consent = localStorage.getItem('gridplay_cookies');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const aceptarCookies = () => {
    localStorage.setItem('gridplay_cookies', 'accepted');
    setVisible(false);
    // Acá podés habilitar Google Analytics en el futuro
  };

  const rechazarCookies = () => {
    localStorage.setItem('gridplay_cookies', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner-container">
      <div className="cookie-content">
        <p>
          <strong>Valoramos tu privacidad.</strong> Utilizamos cookies propias y de terceros (como Google Analytics) 
          para analizar el tráfico y mejorar tu experiencia. Podés aceptar su uso o rechazar el rastreo no esencial. 
          Leé nuestra <a href="/privacidad">Política de Privacidad</a>.
        </p>
        <div className="cookie-botones">
          <button onClick={rechazarCookies} className="btn-cookie rechazar">Rechazar</button>
          <button onClick={aceptarCookies} className="btn-cookie aceptar">Aceptar</button>
        </div>
      </div>
    </div>
  );
}