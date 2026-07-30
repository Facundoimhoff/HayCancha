import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Lock, Mail, Zap, KeyRound } from 'lucide-react';
import './LoginAdmin.css'; // Importamos el nuevo diseño

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  
  // Estado para alternar entre "Iniciar Sesión" y "Recuperar Contraseña"
  const [modoRecuperar, setModoRecuperar] = useState(false);

  // FUNCIÓN 1: INICIAR SESIÓN NORMAL
  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensaje(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/panel');
      
    } catch (error) {
      setError('Credenciales incorrectas. Por favor, intentá nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  // FUNCIÓN 2: ENVIAR MAIL DE RECUPERACIÓN
  const handleRecuperarPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, ingresá tu email arriba para recuperar la contraseña.");
      return;
    }

    setCargando(true);
    setError(null);
    setMensaje(null);

    try {
      // Supabase envía el mail y redirige a la ruta que ya tenés creada (actualizar-password)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/actualizar-password`,
      });

      if (error) throw error;
      
      setMensaje("Te enviamos un enlace a tu correo. Revisá tu bandeja de entrada o spam.");
      // Limpiamos el campo para que quede prolijo
      setPassword(''); 
      
    } catch (error) {
      setError("Hubo un error al intentar enviar el correo. Verificá que esté bien escrito.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="admin-login-page">
      
      {/* BOTÓN VOLVER */}
      <button onClick={() => navigate('/')} className="btn-volver-inicio">
        <ArrowLeft size={20} /> Volver al inicio
      </button>

      <div className="admin-login-card">
        
        <div className="admin-login-header">
          <h1>{modoRecuperar ? 'Recuperar Contraseña' : 'Panel de Clubes'}</h1>
          <p>
            {modoRecuperar 
              ? 'Ingresá tu correo y te enviaremos un enlace para crear una nueva.' 
              : 'Ingresá para gestionar tus reservas y canchas.'}
          </p>
        </div>

        {error && <div className="alerta-error">{error}</div>}
        {mensaje && <div className="alerta-exito">{mensaje}</div>}

        {/* EL FORMULARIO CAMBIA SEGÚN EL MODO (LOGIN O RECUPERAR) */}
        <form onSubmit={modoRecuperar ? handleRecuperarPassword : handleLogin}>
          
          <div className="admin-form-group">
            <label>Email del Administrador</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tuclub.com"
              />
            </div>
          </div>

          {!modoRecuperar && (
            <div className="admin-form-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <span 
                className="link-olvido" 
                onClick={() => { setModoRecuperar(true); setError(null); setMensaje(null); }}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </div>
          )}

          <button type="submit" disabled={cargando} className="btn-admin-submit">
            {cargando 
              ? (modoRecuperar ? 'Enviando enlace...' : 'Ingresando...') 
              : (modoRecuperar ? 'Enviar enlace de recuperación' : 'Iniciar Sesión')}
          </button>
        </form>

        {/* BOTÓN PARA VOLVER A LOGIN (Si está en modo recuperar) */}
        {modoRecuperar && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span 
              className="link-olvido" 
              style={{ display: 'inline-block', color: '#64748b' }}
              onClick={() => { setModoRecuperar(false); setError(null); setMensaje(null); }}
            >
              <ArrowLeft size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}/> 
              Volver a Iniciar Sesión
            </span>
          </div>
        )}

        {/* SECCIÓN DE REGISTRO / PLANES (Solo se muestra en Login) */}
        {!modoRecuperar && (
          <>
            <div className="admin-divider">
              <div className="line"></div>
              <span>o</span>
              <div className="line"></div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '12px' }}>
                ¿Todavía no sumaste tu complejo?
              </p>
              <button 
                onClick={() => navigate('/planes')}
                className="btn-admin-planes"
              >
                <Zap size={20} /> Ver Planes y Sumarme
              </button>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
};

export default LoginAdmin;