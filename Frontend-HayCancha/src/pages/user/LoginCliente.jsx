import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Mail, Lock, User as UserIcon, CalendarDays, KeyRound } from 'lucide-react';
import './LoginCliente.css';

const LoginCliente = () => {
  const navigate = useNavigate();
  const [esRegistro, setEsRegistro] = useState(false);
  
  // Estado para controlar si mostramos la vista de recuperar contraseña
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false); 
  const [mensajeExito, setMensajeExito] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Función original de Iniciar Sesión / Registro
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      if (esRegistro) {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: nombre, rol: 'cliente' },
            // Acá agregamos la redirección automática al login tras confirmar el mail
            emailRedirectTo: window.location.origin + '/login-cliente'
          }
        });
        
        if (errorRegistro) throw errorRegistro;
        
        if (data.user && !data.session) {
          setError('✅ ¡Cuenta creada! Revisá tu correo (y el spam) para confirmar tu cuenta y poder entrar.');
          setEsRegistro(false);
          return;
        }
        if (data.user) navigate('/seleccionar-ubicacion');

      } else {
        const { data, error: errorLogin } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (errorLogin) throw errorLogin;
        if (data.user) navigate('/seleccionar-ubicacion');
      }
    } catch (err) {
      if (err.message.includes('Invalid login')) setError('Email o contraseña incorrectos.');
      else if (err.message.includes('already registered')) setError('Este email ya tiene una cuenta.');
      else setError('Error: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para recuperar la contraseña del cliente
  const handleRecuperarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');
    setCargando(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/actualizar-password', 
      });

      if (error) throw error;

      setMensajeExito('✅ ¡Te enviamos un enlace! Revisá tu correo (y el spam) para cambiar la contraseña.');
    } catch (error) {
      console.error("Error al recuperar:", error.message);
      setError('Hubo un problema al enviar el correo. Verificá que esté bien escrito.');
    } finally {
      setCargando(false);
    }
  };

  const handleGoogleLogin = async () => {
    alert("El inicio con Google se activará próximamente. Por favor, usá tu email y contraseña.");
  };

  return (
    <div className="login-cli-container">
      
      <button onClick={() => navigate('/')} className="btn-volver-flotante">
        <ArrowLeft size={20} /> Volver
      </button>

      <div className="login-cli-card">
        <div className="login-cli-header">
          <div className="icono-cli-wrapper">
            {mostrarRecuperar ? <KeyRound size={32} /> : <CalendarDays size={32} />}
          </div>
          
          <h2>
            {mostrarRecuperar 
              ? 'Recuperar Contraseña' 
              : (esRegistro ? 'Creá tu cuenta' : '¡Hola de nuevo!')}
          </h2>
          <p>
            {mostrarRecuperar 
              ? 'Ingresá tu mail y te enviaremos un link para crear una nueva.' 
              : (esRegistro ? 'Registrate para empezar a reservar canchas' : 'Ingresá a tu cuenta para gestionar tus turnos')}
          </p>
        </div>

        {error && <div className={`alerta-error-cli ${error.includes('✅') ? 'exito' : ''}`} style={error.includes('✅') ? {backgroundColor: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0'} : {}}>{error}</div>}
        {mensajeExito && <div className="alerta-error-cli exito" style={{backgroundColor: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0'}}>{mensajeExito}</div>}

        {/* SI ESTÁ EN MODO RECUPERAR CONTRASEÑA */}
        {mostrarRecuperar ? (
          <form onSubmit={handleRecuperarPassword} className="login-cli-form">
            <div className="form-group-cli">
              <label>Email de recuperación</label>
              <div className="input-box-cli">
                <Mail size={18} className="input-icon-cli" />
                <input 
                  type="email" 
                  required 
                  placeholder="tu@correo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primario-cli" style={{backgroundColor: '#16a34a'}} disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar enlace'}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setMostrarRecuperar(false); setError(''); setMensajeExito(''); }} 
              className="btn-switch-modo" 
              style={{marginTop: '15px'}}
            >
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          
          /* SI ESTÁ EN MODO NORMAL (LOGIN O REGISTRO) */
          <>
            <form onSubmit={handleSubmit} className="login-cli-form">
              {esRegistro && (
                <div className="form-group-cli">
                  <label>Nombre y Apellido</label>
                  <div className="input-box-cli">
                    <UserIcon size={18} className="input-icon-cli" />
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Lucas Pérez" 
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="form-group-cli">
                <label>Email</label>
                <div className="input-box-cli">
                  <Mail size={18} className="input-icon-cli" />
                  <input 
                    type="email" 
                    required 
                    placeholder="tu@correo.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-cli">
                <label>Contraseña</label>
                <div className="input-box-cli">
                  <Lock size={18} className="input-icon-cli" />
                  <input 
                    type="password" 
                    required 
                    placeholder="Mínimo 6 caracteres" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
                {!esRegistro && (
                  <div className="olvide-pass-link">
                    <button type="button" onClick={() => { setMostrarRecuperar(true); setError(''); }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primario-cli" disabled={cargando}>
                {cargando ? 'Procesando...' : (esRegistro ? 'Registrarme' : 'Iniciar Sesión')}
              </button>
            </form>

            <div className="divisor-cli">
              <span>O ingresá con</span>
            </div>

            <button onClick={handleGoogleLogin} className="btn-google-cli" type="button">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
              Google
            </button>

            <div className="login-cli-footer">
              <p>
                {esRegistro ? '¿Ya tenés una cuenta?' : '¿No tenés una cuenta?'}
                <button 
                  type="button"
                  onClick={() => { setEsRegistro(!esRegistro); setError(''); }} 
                  className="btn-switch-modo"
                >
                  {esRegistro ? 'Iniciá sesión' : 'Registrate gratis'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginCliente;