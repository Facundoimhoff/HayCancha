import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Lock, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { supabase } from '../../services/supabase';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const { error: errorAuth } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (errorAuth) throw errorAuth;

      navigate('/panel');
    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      setError('Correo o contraseña incorrectos. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

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

      setMensajeExito('¡Te enviamos un enlace! Revisá tu correo electrónico para cambiar la contraseña.');
    } catch (error) {
      console.error("Error al recuperar:", error.message);
      setError('Hubo un problema al enviar el correo. Verificá que esté bien escrito.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="landing-container">
      {/* Si mostrarLogin es true, le agregamos la clase 'dark-mode' a la tarjeta */}
      <div className={`landing-card ${mostrarLogin ? 'dark-mode' : ''}`}>
        
        {!mostrarLogin ? (
          <div className="animacion-acordeon">
            <h1 className="landing-titulo">¡Bienvenido a Hay Cancha!</h1>
            <p className="landing-subtitulo">¿Cómo querés ingresar hoy?</p>

            <div className="landing-opciones">
              <button onClick={() => navigate('/seleccionar-ubicacion')} className="btn-cliente">
                <User size={24} className="btn-icono" />
                <div className="btn-text-content">
                  <strong className="btn-text-title">Entrar como Cliente</strong>
                  <span className="btn-text-desc">Quiero buscar y reservar canchas</span>
                </div>
                <ArrowRight size={20} className="btn-flecha" />
              </button>

              <button onClick={() => setMostrarLogin(true)} className="btn-admin">
                <ShieldCheck size={24} className="btn-icono" />
                <div className="btn-text-content">
                  <strong className="btn-text-title">Entrar como Administrador</strong>
                  <span className="btn-text-desc">Quiero gestionar mi club y turnos</span>
                </div>
                <ArrowRight size={20} className="btn-flecha" />
              </button>
            </div>

            <div className="bloque-empresa">
              <h3>¿Administrás un club o complejo deportivo?</h3>
              <p>Descubrí cómo <strong>Hay Cancha</strong> puede ayudarte a gestionar reservas, clientes y turnos desde una única plataforma.</p>
              
              {/* ENLACE A PLANES CORREGIDO */}
              <Link to="/planes" className="btn-contacto-empresa">
                Conocé nuestros planes
              </Link>
            </div>
          </div>
        ) : (
          
          <div className="login-premium-container animacion-acordeon">
            <div className="login-header">
              <div className="icono-admin-wrapper">
                {mostrarRecuperar ? <KeyRound size={28} className="icono-admin" /> : <Lock size={28} className="icono-admin" />}
              </div>
              <h2 className="login-titulo">
                {mostrarRecuperar ? 'Recuperar Contraseña' : 'Acceso Administrativo'}
              </h2>
              <p className="login-subtitulo">
                {mostrarRecuperar ? 'Te enviaremos un enlace de recuperación' : 'Ingresá tus credenciales para gestionar tu club'}
              </p>
            </div>

            {error && <div className="alerta-error">{error}</div>}
            {mensajeExito && <div className="alerta-exito">{mensajeExito}</div>}

            {!mostrarRecuperar ? (
              // --- FORMULARIO DE LOGIN ---
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="tu@correo.com" 
                    className="form-input" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="form-input" 
                    required 
                  />
                </div>

                <div className="olvide-password-container">
                  <button 
                    type="button" 
                    onClick={() => {
                      setError('');
                      setMensajeExito('');
                      setMostrarRecuperar(true);
                    }} 
                    className="link-olvide-password"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="login-acciones">
                  <button type="button" onClick={() => setMostrarLogin(false)} className="btn-volver-sutil" disabled={cargando}>
                    <ArrowLeft size={18} /> Volver
                  </button>
                  <button type="submit" className="btn-entrar-principal" disabled={cargando}>
                    {cargando ? 'Verificando...' : 'Ingresar al sistema'}
                  </button>
                </div>
              </form>
            ) : (
              // --- FORMULARIO DE RECUPERACIÓN ---
              <form onSubmit={handleRecuperarPassword} className="login-form">
                <div className="form-group">
                  <label className="form-label">Email de recuperación</label>
                  <div className="input-con-icono">
                    <Mail size={18} className="input-icono" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="tu@correo.com" 
                      className="form-input con-padding" 
                      required 
                    />
                  </div>
                </div>

                <div className="login-acciones">
                  <button type="button" onClick={() => setMostrarRecuperar(false)} className="btn-volver-sutil" disabled={cargando}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-entrar-principal" disabled={cargando}>
                    {cargando ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            )}

            {!mostrarRecuperar && (
              <div className="login-footer">
                <div className="linea-separadora"></div>
                <p className="texto-footer">
                  ¿No tenés una cuenta?{' '}
                  {/* ENLACE A PLANES CORREGIDO */}
                  <Link to="/planes" className="link-destacado">
                    Conocé nuestros planes
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;