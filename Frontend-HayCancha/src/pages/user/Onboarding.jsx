import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Building2, Mail, Lock, CheckCircle2 } from 'lucide-react';
// IMPORTANTE: Importar CSS
import './OnBoarding.css';

const OnBoarding = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [nombreClub, setNombreClub] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registrarClub = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      const { error: clubError } = await supabase
        .from('clubes')
        .insert([{ nombre: nombreClub, admin_email: email }]);

      if (clubError) throw clubError;

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
    <div className="onboarding-container">
      <div className="onboarding-card">
        
        <div className="onboarding-header">
          <CheckCircle2 size={50} color="#10b981" className="onboarding-icono" />
          <h1 className="onboarding-titulo">¡Pago Exitoso!</h1>
          <p className="onboarding-subtitulo">Configuremos los datos de tu complejo para que puedas empezar a gestionar tus turnos.</p>
        </div>

        {error && <div className="alerta-error">{error}</div>}

        <form onSubmit={registrarClub} className="onboarding-form">
          <div className="form-group">
            <label className="form-label">
              <Building2 size={18} /> Nombre del Complejo
            </label>
            <input 
              type="text" 
              required
              value={nombreClub}
              onChange={(e) => setNombreClub(e.target.value)}
              placeholder="Ej: Sport Automóvil"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={18} /> Correo Electrónico (Tu usuario)
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuclub.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={18} /> Crea una Contraseña
            </label>
            <input 
              type="password" 
              required
              minLength="6"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`btn-submit ${cargando ? 'cargando' : 'activo'}`}
          >
            {cargando ? 'Creando cuenta...' : 'Finalizar Configuración'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;