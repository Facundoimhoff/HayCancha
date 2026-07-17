import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { supabase } from '../../services/supabase';
// IMPORTANTE: Importar CSS
import './ActualizarPassword.css';

const ActualizarPassword = () => {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleActualizar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: nuevaPassword
      });

      if (updateError) throw updateError;

      alert("¡Contraseña actualizada con éxito! Ya podés entrar a tu panel.");
      navigate('/'); 

    } catch (error) {
      setError("Hubo un error al actualizar la contraseña: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="actualizar-pass-container">
      <div className="actualizar-pass-card">
        
        <h2 className="actualizar-pass-header">
          <KeyRound size={24} /> Crear nueva contraseña
        </h2>
        <p className="actualizar-pass-desc">
          Escribí tu nueva contraseña para acceder al panel de tu club.
        </p>

        {error && (
          <div className="actualizar-pass-error">
            {error}
          </div>
        )}

        <form onSubmit={handleActualizar} className="actualizar-pass-form">
          <div>
            <label className="form-label-pass">Nueva Contraseña</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="form-input-pass"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando || nuevaPassword.length < 6}
            className="btn-actualizar-pass"
          >
            {cargando ? 'Guardando...' : 'Guardar y Continuar'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ActualizarPassword;