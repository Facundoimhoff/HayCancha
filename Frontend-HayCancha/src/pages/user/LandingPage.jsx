import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';
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
      <div className="landing-card">
        <h1 className="landing-titulo">¡Bienvenido a Hay Cancha!</h1>
        <p className="landing-subtitulo">¿Cómo querés ingresar hoy?</p>

        {!mostrarLogin ? (
          <>
            <div className="landing-opciones">
              <button onClick={() => navigate('/seleccionar-ubicacion')} className="btn-cliente">
                <User size={24} className="btn-icono" />

                <div className="btn-text-content">
                  <strong className="btn-text-title">
                    Entrar como Cliente
                  </strong>
                  <span className="btn-text-desc">
                    Quiero buscar y reservar canchas
                  </span>
                </div>

                <ArrowRight size={20} className="btn-flecha" />
              </button>

              <button onClick={() => setMostrarLogin(true)} className="btn-admin">
                <ShieldCheck size={24} className="btn-icono" />

                <div className="btn-text-content">
                  <strong className="btn-text-title">
                    Entrar como Administrador
                  </strong>
                  <span className="btn-text-desc">
                    Quiero gestionar mi club y turnos
                  </span>
                </div>

                <ArrowRight size={20} className="btn-flecha" />
              </button>
            </div>

            <div className="bloque-empresa">
              <h3>¿Administrás un club o complejo deportivo?</h3>
              <p>
                Descubrí cómo <strong>Hay Cancha</strong> puede ayudarte a gestionar reservas, clientes y turnos desde una única plataforma.
              </p>
              {/* ACÁ CORREGIMOS EL LINK Y EL TEXTO */}
              <Link to="/contacto" className="btn-contacto-empresa">
                Ir al formulario
              </Link>
            </div>
          </>
        ) : (
          <div className="animacion-acordeon">
            <h2 className="form-header">
              {mostrarRecuperar ? (
                <><KeyRound size={18} className="form-header-icon" /> Recuperar Contraseña</>
              ) : (
                <><Lock size={18} className="form-header-icon" /> Acceso Administrativo</>
              )}
            </h2>

            {error && <div className="alerta-error">{error}</div>}
            
            {mensajeExito && <div className="alerta-exito">{mensajeExito}</div>}

            {!mostrarRecuperar ? (
              // FORMULARIO DE LOGIN NORMAL
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="tu@correo.com" 
                    className="input-login" 
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
                    className="input-login" 
                    required 
                  />
                </div>

                <div className="forgot-password-container">
                  <button 
                    type="button" 
                    onClick={() => {
                      setError('');
                      setMensajeExito('');
                      setMostrarRecuperar(true);
                    }} 
                    className="btn-link-simple"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="btn-group">
                  <button type="button" onClick={() => setMostrarLogin(false)} className="btn-volver-login" disabled={cargando}>
                    Volver
                  </button>
                  <button type="submit" className="btn-entrar-login" disabled={cargando}>
                    {cargando ? 'Verificando...' : 'Ingresar al sistema'}
                  </button>
                </div>
              </form>
            ) : (
              // FORMULARIO DE RECUPERACIÓN DE CONTRASEÑA
              <form onSubmit={handleRecuperarPassword}>
                <p className="texto-ayuda">
                  Ingresá el correo electrónico con el que te registraste y te enviaremos un enlace para que puedas cambiar tu contraseña.
                </p>

                <div className="form-group">
                  <label className="form-label">Email de recuperación</label>
                  <div className="input-con-icono">
                    <Mail size={18} className="input-icono" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="tu@correo.com" 
                      className="input-login con-padding" 
                      required 
                    />
                  </div>
                </div>

                <div className="btn-group">
                  <button type="button" onClick={() => setMostrarRecuperar(false)} className="btn-volver-login" disabled={cargando}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-entrar-login verde" disabled={cargando}>
                    {cargando ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            )}

            {!mostrarRecuperar && (
              <div className="footer-registro">
                <p className="footer-texto">
                  ¿No tenés una cuenta?{' '}
                  {/* ACÁ TAMBIÉN CORREGIMOS EL LINK Y EL TEXTO */}
                  <Link to="/contacto" className="link-registro">
                    Contactanos
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