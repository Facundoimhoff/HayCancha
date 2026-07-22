import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MoreVertical, LogOut } from 'lucide-react';
import './HeaderCliente.css';

const HeaderCliente = () => {
  const [nombre, setNombre] = useState('Cliente');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Buscamos los datos del usuario logueado
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        // Agarramos el primer nombre para que no quede larguísimo en la barra
        const primerNombre = user.user_metadata.full_name.split(' ')[0];
        setNombre(primerNombre);
      }
    };
    obtenerUsuario();
  }, []);

  const handleCerrarSesion = async () => {
    // Cerramos sesión en Supabase y lo pateamos al inicio
    await supabase.auth.signOut();
    navigate('/'); 
  };

  return (
    <header className="header-cliente-top">
      <div className="saludo-header">
        Hola, <strong>{nombre}</strong>
      </div>
      
      <div className="opciones-header">
        <button 
          className="btn-tres-puntos" 
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          <MoreVertical size={24} />
        </button>

        {/* Menú flotante que aparece al tocar los 3 puntitos */}
        {menuAbierto && (
          <div className="menu-desplegable-perfil">
            <button onClick={handleCerrarSesion} className="btn-cerrar-sesion">
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderCliente;