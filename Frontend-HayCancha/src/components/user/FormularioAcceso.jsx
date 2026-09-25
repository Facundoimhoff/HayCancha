import { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { validarPassword, AYUDA_PASSWORD } from '../../utils/validaciones';
import './componentes.css';

/**
 * Ingresar / crear cuenta / recuperar contraseña dentro del flujo de reserva.
 * No devuelve nada: al iniciar sesión, AuthProvider actualiza la sesión y la pantalla que lo contiene continúa sola.
 */
export default function AuthReserva() {
  const [modo, setModo] = useState('ingresar'); // ingresar | crear | recuperar
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cambiarModo = (nuevo) => { setModo(nuevo); setError(''); setAviso(''); };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setAviso('');

    if (modo === 'crear') {
      const errorPassword = validarPassword(password);
      if (errorPassword) { setError(errorPassword); return; }
    }

    setOcupado(true);
    try {
      if (modo === 'crear') {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: nombre.trim() }, emailRedirectTo: window.location.origin },
        });
        if (errorRegistro) throw errorRegistro;
        if (data.user && !data.session) {
          setAviso('¡Cuenta creada! Revisá tu correo para confirmarla y después ingresá para terminar tu reserva.');
          setModo('ingresar');
        }
      } else if (modo === 'ingresar') {
        const { error: errorLogin } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (errorLogin) throw errorLogin;
      } else {
        const { error: errorRecuperar } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/actualizar-password`,
        });
        if (errorRecuperar) throw errorRecuperar;
        setAviso('Te enviamos un enlace para restablecer tu contraseña. Revisá tu correo (y el spam).');
      }
    } catch (err) {
      const mensaje = err?.message || '';
      if (mensaje.includes('Invalid login')) setError('Email o contraseña incorrectos.');
      else if (mensaje.includes('not confirmed')) setError('Tenés que confirmar tu correo antes de ingresar. Revisá tu bandeja de entrada.');
      else if (mensaje.includes('rate')) setError('Demasiados intentos. Esperá un momento y probá de nuevo.');
      else if (modo === 'recuperar') setError('No pudimos enviar el correo. Verificá que esté bien escrito.');
      else setError(mensaje || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  const conGoogle = async () => {
    setError('');
    const { error: errorGoogle } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (errorGoogle) setError('No pudimos conectar con Google. Probá con tu correo.');
  };

  return (
    <div className="gp-auth">
      {modo !== 'recuperar' && (
        <div className="gp-auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={modo === 'ingresar'} className={modo === 'ingresar' ? 'activo' : ''} onClick={() => cambiarModo('ingresar')}>Ingresar</button>
          <button type="button" role="tab" aria-selected={modo === 'crear'} className={modo === 'crear' ? 'activo' : ''} onClick={() => cambiarModo('crear')}>Crear cuenta</button>
        </div>
      )}

      {modo === 'recuperar' && (
        <div className="gp-auth-recuperar">
          <strong>Recuperar contraseña</strong>
          <p>Ingresá tu correo y te mandamos un enlace para crear una nueva.</p>
        </div>
      )}

      <form onSubmit={enviar} className="gp-form">
        {modo === 'crear' && (
          <label className="gp-campo">
            <span>Nombre y apellido</span>
            <div className="gp-input-icono">
              <UserIcon size={18} />
              <input type="text" required autoComplete="name" maxLength={80} placeholder="Ej: Lucas Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          </label>
        )}

        <label className="gp-campo">
          <span>Email</span>
          <div className="gp-input-icono">
            <Mail size={18} />
            <input type="email" required autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </label>

        {modo !== 'recuperar' && (
          <label className="gp-campo">
            <span>Contraseña</span>
            <div className="gp-input-icono">
              <Lock size={18} />
              <input
                type={verPassword ? 'text' : 'password'}
                required
                minLength={modo === 'crear' ? 8 : undefined}
                autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
                placeholder={modo === 'crear' ? AYUDA_PASSWORD : 'Tu contraseña'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="gp-input-ojo" onClick={() => setVerPassword((v) => !v)} aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {modo === 'ingresar' && (
              <button type="button" className="gp-auth-link" onClick={() => cambiarModo('recuperar')}>¿Olvidaste tu contraseña?</button>
            )}
          </label>
        )}

        {error && <p className="gp-alerta gp-alerta--error" role="alert">{error}</p>}
        {aviso && <p className="gp-alerta gp-alerta--exito" role="status">{aviso}</p>}

        <button type="submit" className="gp-btn gp-btn--primario" disabled={ocupado}>
          {ocupado ? 'Procesando…' : modo === 'crear' ? 'Crear cuenta y continuar' : modo === 'ingresar' ? 'Ingresar y continuar' : 'Enviar enlace'}
        </button>

        {modo === 'recuperar' && (
          <button type="button" className="gp-btn gp-btn--fantasma" onClick={() => cambiarModo('ingresar')}>Volver a ingresar</button>
        )}
      </form>

      {modo !== 'recuperar' && (
        <>
          <div className="gp-auth-o"><span>o</span></div>
          <button type="button" className="gp-btn gp-btn--fantasma gp-auth-google" onClick={conGoogle}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" width="20" height="20" />
            Continuar con Google
          </button>
        </>
      )}
    </div>
  );
}
