import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import '../../components/user/componentes.css';
import './Auth.css';

/** Cualquier dirección que no existe: antes quedaba la pantalla en blanco. */
const NoEncontrada = () => (
  <div className="au-pagina">
    <main className="au-card">
      <div className="au-header">
        <div className="au-icono"><Compass size={30} aria-hidden="true" /></div>
        <h1>No encontramos esa página</h1>
        <p>Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      </div>
      <div className="au-form">
        <Link to="/" className="gp-btn gp-btn--primario">Buscar una cancha</Link>
        <Link to="/funcionalidades" className="gp-btn gp-btn--secundario">Tengo un club</Link>
      </div>
    </main>
  </div>
);

export default NoEncontrada;
