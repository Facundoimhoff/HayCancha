import { Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

/** Corazón para marcar/desmarcar un club como favorito. Sin sesión, manda a loguearse y vuelve acá. */
export default function BotonFavorito({ clubId, favorito, onAlternar, className = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const clic = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login-cliente', { state: { from: location.pathname } }); return; }
    onAlternar(clubId, !favorito);
  };

  return (
    <button
      type="button"
      onClick={clic}
      className={`gp-favorito ${favorito ? 'gp-favorito--activo' : ''} ${className}`}
      aria-pressed={favorito}
      aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart size={18} fill={favorito ? 'currentColor' : 'none'} />
    </button>
  );
}
