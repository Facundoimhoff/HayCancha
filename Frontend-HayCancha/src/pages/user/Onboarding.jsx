import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Building2, Mail, Lock, CheckCircle2 } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Estados del formulario
  const [nombreClub, setNombreClub] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registrarClub = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      // 1. Creamos el usuario en la bóveda de seguridad de Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Registramos el club en nuestra tabla pública vinculado a ese email
      const { error: clubError } = await supabase
        .from('clubes')
        .insert([
          {
            nombre: nombreClub,
            admin_email: email,
          }
        ]);

      if (clubError) throw clubError;

      // 3. ¡Todo listo! Lo mandamos al login para que entre por primera vez
      alert('¡Club registrado con éxito! Ya podés iniciar sesión.');
      navigate('/'); 

    } catch (error) {
      console.error("Error en el registro:", error);
      setError(error.message || 'Hubo un error al configurar tu club. Intentá nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui' }}>
      
      <div style={{ maxWidth: '500px', width: '100%', backgroundColor: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <CheckCircle2 size={50} color="#10b981" style={{ margin: '0 auto 15px auto' }} />
          <h1 style={{ fontSize: '1.8rem', color: '#111827', margin: '0 0 10px 0' }}>¡Pago Exitoso!</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Configuremos los datos de tu complejo para que puedas empezar a gestionar tus turnos.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={registrarClub} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              <Building2 size={18} /> Nombre del Complejo
            </label>
            <input 
              type="text" 
              required
              value={nombreClub}
              onChange={(e) => setNombreClub(e.target.value)}
              placeholder="Ej: Sport Automóvil"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              <Mail size={18} /> Correo Electrónico (Tu usuario)
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuclub.com"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              <Lock size={18} /> Crea una Contraseña
            </label>
            <input 
              type="password" 
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '1rem' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            style={{ marginTop: '10px', padding: '15px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1 }}
          >
            {cargando ? 'Creando cuenta...' : 'Finalizar Configuración'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Onboarding;