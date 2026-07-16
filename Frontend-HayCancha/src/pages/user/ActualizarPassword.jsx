import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { supabase } from '../../services/supabase';

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
      // Le decimos a Supabase que le cambie la contraseña al usuario
      const { error: updateError } = await supabase.auth.updateUser({
        password: nuevaPassword
      });

      if (updateError) throw updateError;

      alert("¡Contraseña actualizada con éxito! Ya podés entrar a tu panel.");
      navigate('/'); // Lo mandamos al inicio para que inicie sesión con la nueva clave

    } catch (error) {
      setError("Hubo un error al actualizar la contraseña: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e3a8a', marginTop: 0 }}>
          <KeyRound size={24} /> Crear nueva contraseña
        </h2>
        <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '20px' }}>
          Escribí tu nueva contraseña para acceder al panel de tu club.
        </p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleActualizar} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Nueva Contraseña</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando || nuevaPassword.length < 6}
            style={{ 
              marginTop: '10px', backgroundColor: '#2563eb', color: 'white', padding: '12px', 
              border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: (cargando || nuevaPassword.length < 6) ? 0.6 : 1
            }}
          >
            {cargando ? 'Guardando...' : 'Guardar y Continuar'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ActualizarPassword;