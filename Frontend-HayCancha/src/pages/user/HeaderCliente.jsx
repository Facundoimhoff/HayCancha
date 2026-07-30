import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const HeaderCliente = () => {
  const [sesion, setSesion] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Chequeamos si hay una sesión activa apenas carga la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
    });

    // 2. Nos quedamos escuchando cambios (por si inicia o cierra sesión en ese momento)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Lo mandamos al inicio después de cerrar sesión
  };

  // MAGIA ACÁ: Si no hay nadie logueado, devolvemos "null" (la barra se oculta por completo)
  if (!sesion) {
    return null;
  }

  // Si hay sesión, dibujamos la barra
  return (
    <header className="header-cliente" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
      
      <div style={{ fontSize: '1rem', color: '#111827' }}>
        Hola, <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Cliente</span>
      </div>
      
      <button 
        onClick={handleCerrarSesion} 
        style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
      >
        Cerrar sesión
      </button>

    </header>
  );
};

export default HeaderCliente;