import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';
import { supabase } from '../../services/supabase';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  
  // Estado para saber si el cliente ya está logueado
  const [sesionCliente, setSesionCliente] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // Verificamos si ya hay una sesión activa para no pedirle Google de nuevo
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSesionCliente(true);
      }
    };
    verificarSesion();
  }, []);

  // --- NUEVA FUNCIÓN PARA EL CLIENTE ---
  const handleEntrarComoCliente = async () => {
    if (sesionCliente) {
      navigate('/seleccionar-ubicacion');
    } else {
      // Lo mandamos a la nueva pantalla de Login de Cliente
      navigate('/login-cliente');
    }
  };

  const handleLoginAdmin = async (e) => {
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
        
        {!mostrarLogin && (
          <>
            <h1 className="landing-titulo">¡Bienvenido a Hay Cancha!</h1>
            <p className="landing-subtitulo">¿Cómo querés ingresar hoy?</p>
          </>
        )}

        {!mostrarLogin ? (
          <>
            <div className="landing-opciones">
              
              {/* ACÁ APLICAMOS EL NUEVO INGRESO DE CLIENTE */}
              <button onClick={handleEntrarComoCliente} className="btn-cliente">
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
              <h3>¿Querés sumar tu complejo a Hay Cancha?</h3>
              <p>
                Digitalizá tu club, olvidate de la agenda de papel y empezá a recibir reservas automáticas las 24 horas.
              </p>
              <Link to="/contacto" className="btn-contacto-empresa">
                Sumar mi club
              </Link>
            </div>
          </>
        ) : (
          <div className="animacion-acordeon fix-layout-vertical">
            
            <div className="form-header-premium">
              <div className="icono-header-wrapper">
                {mostrarRecuperar ? <KeyRound size={26} /> : <Lock size={26} />}
              </div>
              <h2>{mostrarRecuperar ? 'Recuperar Contraseña' : 'Acceso Administrativo'}</h2>
              <p>{mostrarRecuperar ? 'Te enviaremos un enlace de recuperación' : 'Ingresá tus datos para gestionar tu club'}</p>
            </div>

            {error && <div className="alerta-error">{error}</div>}
            {mensajeExito && <div className="alerta-exito">{mensajeExito}</div>}

            {!mostrarRecuperar ? (
              // FORMULARIO DE LOGIN NORMAL ADMIN
              <form onSubmit={handleLoginAdmin}>
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
              // FORMULARIO DE RECUPERACIÓN DE CONTRASEÑA ADMIN
              <form onSubmit={handleRecuperarPassword}>
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

                <div className="btn-group" style={{ marginTop: '30px' }}>
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
                  <Link to="/planes" className="link-registro">
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