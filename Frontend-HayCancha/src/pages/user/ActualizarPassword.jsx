import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { KeyRound, Lock, ArrowLeft } from 'lucide-react';
import './ActualizarPassword.css'; 

const ActualizarPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    // 1. Validamos que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Verificalas por favor.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);

    try {
      // 2. Le pedimos a Supabase que actualice la clave del usuario actual
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // 3. Éxito: Mostramos mensaje y redirigimos al Login Admin
      setMensaje('¡Contraseña actualizada con éxito! Redirigiendo...');
      
      // Esperamos 2 segundos para que el usuario lea el mensaje y lo mandamos al login
      setTimeout(() => {
        navigate('/login-admin');
      }, 2000);

    } catch (error) {
      console.error("Error al actualizar:", error);
      setError('Hubo un error al actualizar tu contraseña. Es posible que el enlace haya expirado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="actualizar-page">
      <div className="actualizar-card">
        
        <div className="actualizar-header">
          <div className="icono-wrapper">
            <KeyRound size={32} />
          </div>
          <h1>Nueva Contraseña</h1>
          <p>Ingresá una nueva clave para tu cuenta</p>
        </div>

        {error && <div className="alerta-error">{error}</div>}
        {mensaje && <div className="alerta-exito">{mensaje}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group-act">
            <label>Nueva Contraseña</label>
            <div className="input-box-act">
              <Lock size={20} className="input-icon-act" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={mensaje !== null} // Se bloquea si ya tuvo éxito
              />
            </div>
          </div>

          <div className="form-group-act">
            <label>Confirmar Contraseña</label>
            <div className="input-box-act">
              <Lock size={20} className="input-icon-act" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                disabled={mensaje !== null}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-actualizar" 
            disabled={cargando || mensaje !== null}
          >
            {cargando ? 'Guardando...' : 'Actualizar Clave'}
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate('/login-admin')} 
            className="btn-cancelar"
            disabled={cargando || mensaje !== null}
          >
            <ArrowLeft size={16} /> Cancelar y volver
          </button>

        </form>
      </div>
    </div>
  );
};

export default ActualizarPassword;