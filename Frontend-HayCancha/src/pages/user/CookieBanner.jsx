import { useState } from 'react';
import { activarAnalitica } from '../../services/analitica';
import './CookieBanner.css';

const guardar = (valor) => {
  try { localStorage.setItem('gridplay_cookies', valor); } catch { /* sin almacenamiento no queda consentimiento guardado: no se mide */ }
};

export default function CookieBanner() {
  // Se muestra solo si el usuario todavía no contestó (si el navegador bloquea el almacenamiento, también se muestra)
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem('gridplay_cookies'); } catch { return true; }
  });

  const aceptarCookies = () => {
    guardar('accepted');
    setVisible(false);
    activarAnalitica(); // recién acá se cargan Google Analytics y el píxel de Meta
  };

  const rechazarCookies = () => {
    guardar('rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner-container">
      <div className="cookie-content">
        <p>
          <strong>Valoramos tu privacidad.</strong> Si aceptás, usamos cookies de terceros (Google Analytics y Meta)
          para medir las visitas y nuestros anuncios. Si las rechazás, el sitio funciona igual.{' '}
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
