import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/authContext';
import '../../components/user/componentes.css';

/** Barra de sesión del jugador. Si no hay nadie logueado no se muestra. */
const HeaderCliente = () => {
  const navigate = useNavigate();
  const { user, perfil } = useAuth();

  if (!user) return null;

  const nombre = (perfil?.nombre_completo || user.user_metadata?.full_name || '').trim().split(' ')[0] || 'Cliente';

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="gp-barra-usuario">
      <span>Hola, <strong>{nombre}</strong></span>
      <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
    </header>
  );
};

export default HeaderCliente;
