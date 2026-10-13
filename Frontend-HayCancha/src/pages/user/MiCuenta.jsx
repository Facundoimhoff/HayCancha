import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Heart, LogOut, Phone, UserRound } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/authContext';
import { CampoTexto, CampoPassword } from '../../components/user/Formulario';
import { evaluarPassword, validarTelefono } from '../../utils/validaciones';
import './MiCuenta.css';

const MAIL_SOPORTE = 'supportgridplay@gmail.com';

/** Datos de la cuenta del jugador: nombre, teléfono, contraseña y cierre de sesión. Ruta protegida. */
const MiCuenta = () => {
  const navigate = useNavigate();
  const { user, perfil, recargarPerfil } = useAuth();

  // Solo se guarda lo que el usuario edita; si no tocó nada, se muestra lo del perfil
  const [nombreEditado, setNombreEditado] = useState(null);
  const [telefonoEditado, setTelefonoEditado] = useState(null);
  const nombre = nombreEditado ?? (perfil?.nombre_completo || user.user_metadata?.full_name || '');
  const telefono = telefonoEditado ?? (perfil?.telefono || '');
  const [erroresDatos, setErroresDatos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [avisoDatos, setAvisoDatos] = useState(null); // { tipo: 'exito' | 'error', texto }

  const [password, setPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [avisoPassword, setAvisoPassword] = useState(null);

  // Quien entró solo con Google no tiene contraseña en GridPlay
  const proveedores = user.app_metadata?.providers || [user.app_metadata?.provider].filter(Boolean);
  const usaPassword = proveedores.length === 0 || proveedores.includes('email');

  const guardarDatos = async (e) => {
    e.preventDefault();
    setAvisoDatos(null);

    const errores = {};
    if (nombre.trim().length < 2) errores.nombre = 'Ingresá tu nombre y apellido.';
    if (telefono.trim() && !validarTelefono(telefono)) errores.telefono = 'Solo números, entre 6 y 20 dígitos.';
    setErroresDatos(errores);
    if (Object.keys(errores).length) return;

    setGuardando(true);
    // .select() detecta el caso "RLS filtró la fila": sin error pero sin nada guardado
    const { data, error } = await supabase
      .from('usuarios')
      .update({ nombre_completo: nombre.trim(), telefono: telefono.trim() || null })
      .eq('id', user.id)
      .select('id');
    setGuardando(false);

    if (error || !data?.length) {
      console.error('No se pudieron guardar los datos de la cuenta:', error);
      setAvisoDatos({ tipo: 'error', texto: 'No pudimos guardar tus datos. Intentá de nuevo en unos minutos.' });
      return;
    }
    recargarPerfil();
    setAvisoDatos({ tipo: 'exito', texto: 'Guardamos tus datos.' });
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setAvisoPassword(null);
    setErrorPassword('');
    if (!evaluarPassword(password).valida) { setErrorPassword('Completá todos los requisitos de la contraseña.'); return; }

    setCambiando(true);
    const { error } = await supabase.auth.updateUser({ password });
    setCambiando(false);

    if (error) {
      console.error('No se pudo cambiar la contraseña:', error);
      const texto = error.message || '';
      if (error.code === 'weak_password' || texto.toLowerCase().includes('password should')) setErrorPassword('La contraseña no cumple los requisitos de seguridad.');
      else if (texto.includes('same') || texto.includes('different')) setErrorPassword('La nueva contraseña tiene que ser distinta de la anterior.');
      else setAvisoPassword({ tipo: 'error', texto: 'No pudimos cambiar la contraseña. Cerrá sesión, volvé a ingresar e intentá de nuevo.' });
      return;
    }
    setPassword('');
    setAvisoPassword({ tipo: 'exito', texto: 'Tu contraseña se cambió.' });
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="mc-pagina">
      <main className="mc-contenedor">
        <header className="mc-cabecera">
          <div>
            <h1>Mi cuenta</h1>
            <p>{user.email}</p>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="gp-btn gp-btn--fantasma gp-btn--chico"><ArrowLeft size={16} /> Volver</button>
        </header>

        <nav className="mc-atajos" aria-label="Tus secciones">
          <Link to="/mis-reservas" className="gp-btn gp-btn--secundario"><Calendar size={17} /> Mis reservas</Link>
          <Link to="/favoritos" className="gp-btn gp-btn--secundario"><Heart size={17} /> Favoritos</Link>
        </nav>

        <section className="mc-tarjeta" aria-labelledby="mc-datos">
          <h2 id="mc-datos">Tus datos</h2>
          <p className="mc-ayuda">Son los que ve el club cuando reservás.</p>
          <form onSubmit={guardarDatos} className="gp-form" noValidate>
            <CampoTexto etiqueta="Nombre y apellido" icono={UserRound} autoComplete="name" maxLength={80} value={nombre}
              onChange={(e) => { setNombreEditado(e.target.value); setErroresDatos((p) => ({ ...p, nombre: undefined })); }} error={erroresDatos.nombre} required />
            <CampoTexto etiqueta="Teléfono (WhatsApp)" icono={Phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="Ej: 3564123456" value={telefono}
              onChange={(e) => { setTelefonoEditado(e.target.value); setErroresDatos((p) => ({ ...p, telefono: undefined })); }} error={erroresDatos.telefono} />
            {avisoDatos && <p className={`gp-alerta gp-alerta--${avisoDatos.tipo}`} role={avisoDatos.tipo === 'error' ? 'alert' : 'status'}>{avisoDatos.texto}</p>}
            <button type="submit" className="gp-btn gp-btn--primario mc-boton" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
          </form>
        </section>

        <section className="mc-tarjeta" aria-labelledby="mc-password">
          <h2 id="mc-password">Contraseña</h2>
          {usaPassword ? (
            <form onSubmit={cambiarPassword} className="gp-form" noValidate>
              <CampoPassword etiqueta="Nueva contraseña" valor={password} onCambio={(v) => { setPassword(v); setErrorPassword(''); }} nueva medidor error={errorPassword} placeholder="Elegí una contraseña nueva" />
              {avisoPassword && <p className={`gp-alerta gp-alerta--${avisoPassword.tipo}`} role={avisoPassword.tipo === 'error' ? 'alert' : 'status'}>{avisoPassword.texto}</p>}
              <button type="submit" className="gp-btn gp-btn--primario mc-boton" disabled={cambiando || !password}>{cambiando ? 'Cambiando…' : 'Cambiar contraseña'}</button>
            </form>
          ) : (
            <p className="mc-ayuda">Ingresás con tu cuenta de Google: la contraseña se cambia desde Google, no desde GridPlay.</p>
          )}
        </section>

        <section className="mc-tarjeta" aria-labelledby="mc-sesion">
          <h2 id="mc-sesion">Sesión</h2>
          <button type="button" className="gp-btn gp-btn--fantasma mc-boton" onClick={cerrarSesion}><LogOut size={17} /> Cerrar sesión</button>
          <p className="mc-ayuda mc-eliminar">
            ¿Querés eliminar tu cuenta y tus datos? Escribinos a{' '}
            <a href={`mailto:${MAIL_SOPORTE}?subject=${encodeURIComponent('Eliminar mi cuenta de GridPlay')}`}>{MAIL_SOPORTE}</a>{' '}
            desde el correo de tu cuenta y lo hacemos.
          </p>
        </section>
      </main>
    </div>
  );
};

export default MiCuenta;
