import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- Agregamos Link acá
import { User, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../../services/supabase';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mostrarLogin, setMostrarLogin] = useState(false);
  
  // Estados para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setCargando(true);
    
    try {
      const { data, error: errorAuth } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (errorAuth) throw errorAuth;

      navigate('/dashboard'); 

    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      setError('Correo o contraseña incorrectos. Probá de nuevo.');
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
            <button onClick={() => navigate('/home')} className="btn-cliente">
              <User size={24} style={{ marginRight: '15px' }} />
              <div>
                <strong style={{ fontSize: '1.1rem' }}>Entrar como Cliente</strong>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 'normal',
                    marginTop: '2px',
                  }}
                >
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
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 'normal',
                    marginTop: '2px',
                  }}
                >
                  Quiero gestionar mi club y turnos
                </span>
              </div>
              <ArrowRight size={20} style={{ marginLeft: 'auto' }} />
            </button>
          </div>

          {/* NUEVO BLOQUE */}
          <div
            style={{
              marginTop: '25px',
              padding: '18px',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#1e3a8a',
                fontSize: '1.05rem',
              }}
            >
              ¿Sos un club o empresa y querés sumar nuestro sistema?
            </h3>

            <p
              style={{
                margin: '8px 0 18px',
                color: '#4b5563',
                fontSize: '.95rem',
              }}
            >
              Contactanos y conocé cómo implementar Hay Cancha en tu institución.
            </p>

            <button
              onClick={() =>
                document
                  .getElementById('contacto')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Contacto
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleLogin} className="animacion-acordeon">
          <h2
            style={{
              fontSize: '1.2rem',
              marginBottom: '20px',
              color: '#1e3a8a',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '10px',
            }}
          >
            <Lock size={18} style={{ marginRight: '8px' }} /> Acceso
            Administrativo
          </h2>

          {error && (
            <div
              style={{
                color: '#ef4444',
                backgroundColor: '#fee2e2',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#374151',
              }}
            >
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="input-login"
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#374151',
              }}
            >
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-login"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setMostrarLogin(false)}
              className="btn-volver-login"
              disabled={cargando}
            >
              Volver
            </button>

            <button
              type="submit"
              className="btn-entrar-login"
              disabled={cargando}
            >
              {cargando ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </div>

          <div
            style={{
              marginTop: '25px',
              textAlign: 'center',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '20px',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '0.95rem',
              }}
            >
              ¿No tenés una cuenta?{' '}
              <Link
                to="/planes"
                style={{
                  color: '#1e3a8a',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                Conocé nuestros planes
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>

    <div
      id="contacto"
      style={{
        padding: '50px 20px',
        backgroundColor: '#f9fafb',
      }}
    >
      <FormularioContacto />
    </div>
  </div>
  );
};

export default LandingPage;