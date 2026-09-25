import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Zap, KeyRound, Store } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { precalentarApi } from '../../services/api';
import { CampoTexto, CampoPassword } from '../../components/user/Formulario';
import './Auth.css';

const ROLES_ADMIN = ['admin', 'superadmin'];

/** Ingreso al panel de clubes (y recuperación de contraseña). Las cuentas sin club siguen su alta en /registro-club. */
const LoginAdmin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoRecuperar, setModoRecuperar] = useState(false);

  // Desde acá se llega a Planes y al pago: se despierta el backend con anticipación.
  useEffect(() => { precalentarApi(); }, []);

  const cambiarModo = (recuperar) => { setModoRecuperar(recuperar); setError(''); setMensaje(''); };

  const ingresar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const { data, error: errorLogin } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (errorLogin) throw errorLogin;

      // El rol sale de public.usuarios (lo escribe el servidor)
      const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', data.user.id).maybeSingle();
      navigate(ROLES_ADMIN.includes(perfil?.rol) ? '/panel' : '/registro-club');
    } catch (err) {
      const texto = err?.message || '';
      if (texto.includes('not confirmed')) setError('Tenés que confirmar tu correo antes de ingresar. Revisá tu bandeja de entrada.');
      else if (texto.includes('rate')) setError('Demasiados intentos. Esperá un momento y probá de nuevo.');
      else setError('Email o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  const recuperar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');
    try {
      const { error: errorRecuperar } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/actualizar-password`,
      });
      if (errorRecuperar) throw errorRecuperar;
      setMensaje('Te enviamos un enlace a tu correo. Revisá tu bandeja de entrada y el spam.');
    } catch {
      setError('No pudimos enviar el correo. Verificá que esté bien escrito.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="au-pagina">
      <button type="button" onClick={() => navigate('/')} className="au-volver">
        <ArrowLeft size={18} /> Volver al inicio
      </button>

      <main className="au-card">
        <div className="au-header">
          <div className="au-icono">{modoRecuperar ? <KeyRound size={30} aria-hidden="true" /> : <Store size={30} aria-hidden="true" />}</div>
          <h1>{modoRecuperar ? 'Recuperar contraseña' : 'Panel de clubes'}</h1>
          <p>{modoRecuperar ? 'Ingresá tu correo y te enviamos un enlace para crear una nueva.' : 'Ingresá para gestionar tus reservas y canchas.'}</p>
        </div>

        <div className="au-mensajes">
          {error && <p className="gp-alerta gp-alerta--error" role="alert">{error}</p>}
          {mensaje && <p className="gp-alerta gp-alerta--exito" role="status">{mensaje}</p>}
        </div>

        <form onSubmit={modoRecuperar ? recuperar : ingresar} className="au-form">
          <CampoTexto etiqueta="Email del administrador" icono={Mail} type="email" required autoComplete="email" placeholder="admin@tuclub.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          {!modoRecuperar && (
            <>
              <CampoPassword valor={password} onCambio={setPassword} required placeholder="Tu contraseña" />
              <button type="button" className="au-enlace" onClick={() => cambiarModo(true)}>¿Olvidaste tu contraseña?</button>
            </>
          )}

          <button type="submit" disabled={cargando} className="gp-btn gp-btn--primario">
            {cargando ? (modoRecuperar ? 'Enviando enlace…' : 'Ingresando…') : (modoRecuperar ? 'Enviar enlace de recuperación' : 'Iniciar sesión')}
          </button>

          {modoRecuperar && (
            <button type="button" className="gp-btn gp-btn--fantasma" onClick={() => cambiarModo(false)}>
              <ArrowLeft size={16} /> Volver a iniciar sesión
            </button>
          )}
        </form>

        {!modoRecuperar && (
          <>
            <div className="au-divisor"><span>o</span></div>
            <div className="au-sumate">
              <p>¿Todavía no sumaste tu complejo?</p>
              <button type="button" onClick={() => navigate('/planes')} className="gp-btn gp-btn--secundario">
                <Zap size={18} /> Ver planes y sumarme
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LoginAdmin;
