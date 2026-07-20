import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../services/supabase';
import './ActualizarPassword.css';

const ActualizarPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // Verificamos si el usuario realmente viene del link de recuperación
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('El enlace de recuperación no es válido o ya expiró. Por favor, solicitá uno nuevo.');
      }
    };
    verificarSesion();
  }, []);

  const handleActualizar = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);

    try {
      // Supabase actualiza la contraseña del usuario actualmente autenticado (el que entró por el link)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setExito(true);
      
      // Por seguridad, cerramos la sesión para obligarlo a entrar con su nueva clave
      await supabase.auth.signOut();
      
      // Lo mandamos al inicio después de 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      console.error("Error al actualizar contraseña:", err.message);
      setError('Hubo un error al guardar. Es posible que el enlace haya expirado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="actualizar-container">
      <div className="actualizar-card dark-mode">
        
        <div className="form-header-premium">
          <div className="icono-header-wrapper">
            {exito ? <CheckCircle size={26} color="#22c55e" /> : <KeyRound size={26} />}
          </div>
          <h2 style={{color: '#ffffff'}}>Nueva Contraseña</h2>
          <p style={{color: '#9ca3af'}}>
            {exito ? '¡Todo listo!' : 'Ingresá una nueva clave para tu cuenta'}
          </p>
        </div>

        {error && <div className="alerta-error">{error}</div>}

        {exito ? (
          <div className="mensaje-exito-final">
            <p>Tu contraseña se actualizó correctamente.</p>
            <p className="redireccion-texto">Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <form onSubmit={handleActualizar} className="login-form">
            <div className="form-group">
              <label className="form-label">Nueva Contraseña</label>
              <div className="input-con-icono">
                <Lock size={18} className="input-icono" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Mínimo 6 caracteres" 
                  className="form-input con-padding" 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Contraseña</label>
              <div className="input-con-icono">
                <Lock size={18} className="input-icono" />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Repetí la contraseña" 
                  className="form-input con-padding" 
                  required 
                />
              </div>
            </div>

            <div className="login-acciones" style={{marginTop: '25px'}}>
              <button 
                type="button" 
                onClick={() => navigate('/')} 
                className="btn-volver-sutil" 
                disabled={cargando}
              >
                <ArrowLeft size={18} /> Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-entrar-principal verde" 
                disabled={cargando || !!error.includes('expiró')}
              >
                {cargando ? 'Guardando...' : 'Actualizar Clave'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ActualizarPassword;