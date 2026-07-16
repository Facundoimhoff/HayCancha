import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Lock, Mail, KeyRound } from 'lucide-react';
import { supabase } from '../../services/supabase';

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
        // MUY IMPORTANTE: Esta es la ruta a donde volverá el usuario cuando toque el link en su correo
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
                <User size={24} style={{ marginRight: '15px' }} />

                <div>
                  <strong style={{ fontSize: '1.1rem' }}>
                    Entrar como Cliente
                  </strong>

                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'normal', marginTop: '2px' }}>
                    Quiero buscar y reservar canchas
                  </span>
                </div>

                <ArrowRight size={20} style={{ marginLeft: 'auto' }} />
              </button>

              <button onClick={() => setMostrarLogin(true)} className="btn-admin">
                <ShieldCheck size={24} style={{ marginRight: '15px' }} />

                <div>
                  <strong style={{ fontSize: '1.1rem' }}>
                    Entrar como Administrador
                  </strong>

                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'normal', marginTop: '2px' }}>
                    Quiero gestionar mi club y turnos
                  </span>
                </div>

                <ArrowRight size={20} style={{ marginLeft: 'auto' }} />
              </button>
            </div>

            <div className="bloque-empresa">
              <h3>¿Administrás un club o complejo deportivo?</h3>
              <p>
                Descubrí cómo <strong>Hay Cancha</strong> puede ayudarte a gestionar reservas, clientes y turnos desde una única plataforma.
              </p>
              <Link to="/contacto" className="btn-contacto-empresa">
                Ir al formulario
              </Link>
            </div>
          </>
        ) : (
          <div className="animacion-acordeon">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#1e3a8a', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
              {mostrarRecuperar ? (
                <><KeyRound size={18} style={{ marginRight: '8px' }} /> Recuperar Contraseña</>
              ) : (
                <><Lock size={18} style={{ marginRight: '8px' }} /> Acceso Administrativo</>
              )}
            </h2>

            {error && (
              <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {error}
              </div>
            )}
            
            {mensajeExito && (
              <div style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {mensajeExito}
              </div>
            )}

            {!mostrarRecuperar ? (
              // FORMULARIO DE LOGIN NORMAL
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="input-login" required />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Contraseña</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-login" required />
                </div>

                {/* BOTÓN OLVIDÉ CONTRASEÑA */}
                <div style={{ marginBottom: '25px', textAlign: 'right' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setError('');
                      setMensajeExito('');
                      setMostrarRecuperar(true);
                    }} 
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
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
                <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '20px' }}>
                  Ingresá el correo electrónico con el que te registraste y te enviaremos un enlace para que puedas cambiar tu contraseña.
                </p>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>Email de recuperación</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="input-login" style={{ paddingLeft: '40px' }} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setMostrarRecuperar(false)} className="btn-volver-login" disabled={cargando}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-entrar-login" style={{ backgroundColor: '#10b981' }} disabled={cargando}>
                    {cargando ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            )}

            {!mostrarRecuperar && (
              <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
                  ¿No tenés una cuenta?{' '}
                  <Link to="/planes" style={{ color: '#1e3a8a', fontWeight: 'bold', textDecoration: 'none' }}>
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