import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { postApi, precalentarApi } from '../../services/api';
import { geocodificarClub } from '../../services/geocodificar';
import { iniciarPrueba } from '../../services/suscripcion';
import { DIAS_PRUEBA } from '../../utils/suscripcion';
import { subirImagen, TIPOS_IMAGEN_ACEPTADOS } from '../../services/storage';
import { useAuth } from '../../context/authContext';
import { usePrecioPlan } from '../../hooks/usePlanes';
import { CampoTexto, CampoPassword } from '../../components/user/Formulario';
import { evaluarPassword, validarTelefono, mensajeDeServidor } from '../../utils/validaciones';
import { moneda } from '../../utils/reservas';
import { CheckCircle2, ImagePlus, MapPin, Mail, Building2, Car } from 'lucide-react';
import './RegistroClub.css';

const ROLES_ADMIN = ['admin', 'superadmin'];
const CLAVE_PENDIENTE = 'gridplay_club_pendiente';

// { club: {...formData}, preapprovalId: string|null }
const guardarPendiente = (datos) => { try { localStorage.setItem(CLAVE_PENDIENTE, JSON.stringify(datos)); } catch { /* localStorage puede fallar (modo privado): no es crítico */ } };
const leerPendiente = () => { try { return JSON.parse(localStorage.getItem(CLAVE_PENDIENTE) || 'null'); } catch { return null; } };
const borrarPendiente = () => { try { localStorage.removeItem(CLAVE_PENDIENTE); } catch { /* idem */ } };

const AceptaTerminos = ({ checked, onChange, error }) => (
  <div className={`rg-terminos ${error ? 'con-error' : ''}`}>
    <input type="checkbox" id="terminos" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={error ? true : undefined} aria-describedby={error ? 'terminos-error' : undefined} />
    <div>
      <label htmlFor="terminos">
        He leído y acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer">Política de Privacidad</a> de GridPlay. Entiendo mis derechos como consumidor.
      </label>
      {error && <small id="terminos-error" className="gp-campo-error" role="alert">{error}</small>}
    </div>
  </div>
);

/**
 * Alta de club en UNA sola pantalla: cuenta (si hace falta) + datos del club, juntos.
 * El plan ya se eligió en /planes, sin necesitar cuenta todavía (el link de pago no es personal):
 *  - Prueba gratis: /planes manda directo acá, sin sesión. Al enviar: signUp -> iniciar_prueba -> registrar_club.
 *  - Pago: /planes manda derecho a Mercado Pago. Se vuelve con ?preapproval_id=… y TODAVÍA sin cuenta;
 *    esta pantalla pide mail/contraseña y los datos del club juntos. Al enviar: signUp -> se vincula el
 *    pago con ese preapproval_id (recién ahí se confirma) -> registrar_club.
 * Si Supabase exige confirmar el mail antes de dar sesión, se guardan los datos del club (y el
 * preapproval_id, si venía pagando) para no pedirlos de nuevo cuando vuelva ya confirmado.
 */
const RegistroClub = () => {
  const navigate = useNavigate();
  const { user, rol, cargando: cargandoSesion, recargarPerfil } = useAuth();
  const [searchParams] = useSearchParams();
  const idPagoUrl = searchParams.get('preapproval_id'); // Mercado Pago lo agrega al volver de pagar
  const pendienteGuardado = leerPendiente();
  const idPago = idPagoUrl || pendienteGuardado?.preapprovalId || null;

  const { precio } = usePrecioPlan('Full');

  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [aviso, setAviso] = useState('');
  const [errores, setErrores] = useState({});
  const [imagenFile, setImagenFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [cuenta, setCuenta] = useState({ email: '', password: '' });
  // Si venía de confirmar el mail, recupera lo que ya había tipeado del club.
  const [formData, setFormData] = useState(() => ({
    nombre: '', descripcion: '', provincia: '', ciudad: '', direccion: '', telefono_contacto: '',
    estacionamiento: false, servicios: '', instagram: '', tiktok: '', facebook: '',
    ...(pendienteGuardado?.club || {}),
  }));

  const esAdmin = ROLES_ADMIN.includes(rol);
  const modo = idPago ? 'pagar' : 'prueba';
  const pideCredenciales = !user;

  // Un admin que ya tiene club no tiene nada que registrar.
  useEffect(() => {
    if (!cargandoSesion && user && esAdmin && !idPago) navigate('/panel', { replace: true });
  }, [cargandoSesion, user, esAdmin, idPago, navigate]);

  useEffect(() => () => { if (previewLogo) URL.revokeObjectURL(previewLogo); }, [previewLogo]);

  // Al volver de Mercado Pago (o antes de ir a pagar) el backend tiene que estar despierto.
  useEffect(() => { precalentarApi(); }, []);

  // Volviendo de pagar: un admin que YA tenía club (pasaba de prueba a pago) confirma y va al panel.
  // Una cuenta nueva (sin club todavía) completa todo junto en el formulario de abajo, al enviar.
  useEffect(() => {
    if (cargandoSesion || !user || !idPago || !esAdmin) return undefined;
    let cancelado = false;
    (async () => {
      const { ok } = await postApi('/api/vincular-suscripcion', { preapproval_id: idPago });
      if (!cancelado) navigate(`/panel?pago=${ok ? 'ok' : 'error'}`, { replace: true });
    })();
    return () => { cancelado = true; };
  }, [cargandoSesion, user, esAdmin, idPago, navigate]);

  const cambiarCampo = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrores((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const cambiarLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setPreviewLogo(URL.createObjectURL(file));
    setErrores((prev) => ({ ...prev, logo: undefined }));
  };

  const finalizar = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    setAviso('');

    const nuevosErrores = {};
    if (pideCredenciales) {
      if (!cuenta.email.trim()) nuevosErrores.email = 'Ingresá tu correo.';
      if (!evaluarPassword(cuenta.password).valida) nuevosErrores.password = 'Completá todos los requisitos de la contraseña.';
    }
    if (formData.nombre.trim().length < 2) nuevosErrores.nombre = 'Ingresá el nombre del complejo.';
    if (!formData.provincia.trim()) nuevosErrores.provincia = 'Ingresá la provincia.';
    if (!formData.ciudad.trim()) nuevosErrores.ciudad = 'Ingresá la ciudad.';
    if (!formData.direccion.trim()) nuevosErrores.direccion = 'Ingresá la dirección.';
    if (!validarTelefono(formData.telefono_contacto)) nuevosErrores.telefono_contacto = 'Solo números, entre 6 y 20 dígitos.';
    if (!imagenFile) nuevosErrores.logo = 'Subí el logo de tu club (JPG, PNG o WebP).';
    if (!aceptaTerminos) nuevosErrores.terminos = 'Tenés que aceptar los términos para continuar.';
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) {
      document.querySelector('[aria-invalid="true"], .gp-campo-error, .rg-logo-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setCargando(true);
    try {
      let cuentaUsuario = user;

      if (!user) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: cuenta.email.trim(),
          password: cuenta.password,
          options: { emailRedirectTo: `${window.location.origin}/login-admin` },
        });
        if (authError) throw authError;

        // Con confirmación de mail, Supabase no avisa que el email ya existe: devuelve un usuario sin identidades.
        if (data.user && data.user.identities?.length === 0) {
          setErrores({ email: 'Ya existe una cuenta con este email.', emailExistente: true });
          setCargando(false);
          return;
        }
        if (!data.session) {
          guardarPendiente({ club: formData, preapprovalId: idPago });
          setAviso(modo === 'pagar'
            ? '¡Ya pagaste! Te enviamos un correo para confirmar tu cuenta. Confirmala y volvé a entrar desde "Panel de Clubes": ahí vinculamos tu pago y creamos tu club, sin pedirte nada de nuevo.'
            : '¡Ya casi! Te enviamos un correo para confirmar tu cuenta. Confirmala y volvé a entrar desde "Panel de Clubes" para terminar: no vas a tener que volver a cargar los datos del club.');
          setCargando(false);
          return;
        }
        cuentaUsuario = data.session.user;
      }

      if (modo === 'pagar') {
        const { ok, data: datosPago } = await postApi('/api/vincular-suscripcion', { preapproval_id: idPago });
        if (!ok) throw new Error(datosPago?.error || 'No pudimos confirmar tu pago. Si ya pagaste, esperá unos segundos y volvé a intentar.');
      }

      let logoUrl;
      try {
        logoUrl = await subirImagen(imagenFile, 'logos');
      } catch (err) {
        setErrores({ logo: err.message || 'No pudimos subir el logo. Probá con otra imagen.' });
        setCargando(false);
        return;
      }

      if (modo === 'prueba') {
        try {
          await iniciarPrueba();
        } catch (err) {
          if (err?.message !== 'YA_TIENE_SUSCRIPCION') throw err; // si ya tenía una activa, seguimos igual
        }
      }

      const { error: clubError } = await supabase.rpc('registrar_club', {
        p_nombre: formData.nombre,
        p_descripcion: formData.descripcion,
        p_provincia: formData.provincia,
        p_ciudad: formData.ciudad,
        p_direccion: formData.direccion,
        p_telefono: formData.telefono_contacto,
        p_estacionamiento: formData.estacionamiento,
        p_servicios: formData.servicios,
        p_redes: { instagram: formData.instagram, tiktok: formData.tiktok, facebook: formData.facebook },
        p_imagen_url: logoUrl,
        p_correo: cuentaUsuario.email,
      });
      if (clubError) throw clubError;

      // El pin del club sale solo de su dirección. Sin esperar: si no encuentra la calle exacta, no guarda
      // nada (mejor sin pin que uno mal puesto en el centro de la ciudad) y el dueño lo ubica en "Mi club".
      geocodificarClub({ direccion: formData.direccion, ciudad: formData.ciudad, provincia: formData.provincia })
        .then((punto) => punto?.exacta && supabase.from('clubes').update({ latitud: punto.lat, longitud: punto.lng }).eq('admin_id', cuentaUsuario.id))
        .catch((errUbicacion) => console.warn('No se pudo ubicar el club en el mapa:', errUbicacion.message));

      borrarPendiente();
      recargarPerfil();
      navigate('/panel', { replace: true });
    } catch (err) {
      console.error('Error al finalizar el registro:', err);
      const mensaje = err?.message || '';
      if (mensaje.includes('already registered') || mensaje.includes('already been registered')) setErrores({ email: 'Ya existe una cuenta con este email.', emailExistente: true });
      else if (mensaje.includes('rate')) setErrorGeneral('Demasiados intentos. Esperá un momento y probá de nuevo.');
      else if (err?.code === 'weak_password' || mensaje.toLowerCase().includes('password')) setErrores({ password: 'La contraseña no cumple los requisitos de seguridad.' });
      else setErrorGeneral(mensajeDeServidor(err, 'No pudimos completar el registro. Intentá de nuevo.'));
    } finally {
      setCargando(false);
    }
  };

  if (cargandoSesion) return <div className="estado-carga">Cargando...</div>;
  if (user && esAdmin) return null; // los useEffect de arriba ya están navegando (a /panel, con o sin pago)

  const titulo = modo === 'pagar' ? 'Ya pagaste: completá tu club' : 'Creá tu cuenta y tu club';
  const subtitulo = modo === 'pagar'
    ? 'Contanos quién sos y cómo es tu complejo. Confirmamos tu pago al tocar el botón de abajo y entrás directo a tu panel.'
    : `Probá GridPlay ${DIAS_PRUEBA} días gratis, sin tarjeta. Completá tu cuenta y los datos de tu complejo de una vez.`;

  return (
    <div className="registro-club-container">
      <main className="registro-club-card">
        <div className="registro-header">
          <div className="icono-exito-wrapper"><CheckCircle2 size={44} aria-hidden="true" /></div>
          <h1 className="registro-titulo">{titulo}</h1>
          <p className="registro-subtitulo">{subtitulo}</p>
        </div>

        <form onSubmit={finalizar} className="gp-form rg-form-club" noValidate>
          {pideCredenciales && (
            <section className="rg-seccion">
              <h2><Mail size={18} aria-hidden="true" /> Tu cuenta de administrador</h2>
              <CampoTexto
                etiqueta="Correo electrónico"
                icono={Mail}
                type="email"
                autoComplete="email"
                placeholder="admin@tuclub.com"
                required
                value={cuenta.email}
                onChange={(e) => { setCuenta((c) => ({ ...c, email: e.target.value })); setErrores((p) => ({ ...p, email: undefined, emailExistente: false })); }}
                error={errores.email}
                ayuda="Con este correo vas a ingresar a tu panel de control."
              />
              {errores.emailExistente && (
                <p className="gp-alerta gp-alerta--aviso">¿Ya tenés cuenta? <Link to="/login-admin">Ingresá con ese correo</Link>.</p>
              )}
              <CampoPassword
                valor={cuenta.password}
                onCambio={(v) => { setCuenta((c) => ({ ...c, password: v })); setErrores((p) => ({ ...p, password: undefined })); }}
                nueva
                medidor
                required
                placeholder="Creá una contraseña"
                error={errores.password}
              />
            </section>
          )}

          {!pideCredenciales && <p className="rg-cuenta">Cuenta de administrador: <strong>{user.email}</strong></p>}

          <section className="rg-seccion">
            <h2><Building2 size={18} aria-hidden="true" /> Perfil del club</h2>
            <div className="rg-perfil">
              <div className="rg-logo-col">
                <label className={`rg-logo ${errores.logo ? 'con-error' : ''}`} htmlFor="logo-upload">
                  {previewLogo
                    ? <img src={previewLogo} alt="Vista previa del logo" />
                    : <span><ImagePlus size={30} aria-hidden="true" />Subir logo</span>}
                  <input id="logo-upload" type="file" accept={TIPOS_IMAGEN_ACEPTADOS} onChange={cambiarLogo} className="gp-solo-lector" aria-describedby="logo-ayuda" />
                </label>
                <small id="logo-ayuda" className={errores.logo ? 'gp-campo-error rg-logo-error' : 'gp-campo-ayuda'} role={errores.logo ? 'alert' : undefined}>
                  {errores.logo || 'JPG, PNG o WebP, hasta 5 MB.'}
                </small>
              </div>

              <div className="rg-perfil-texto">
                <CampoTexto etiqueta="Nombre del complejo" name="nombre" maxLength={120} placeholder="Ej: Sport Automóvil Club" value={formData.nombre} onChange={cambiarCampo} error={errores.nombre} required />
                <div className="gp-campo">
                  <label htmlFor="descripcion">Descripción <span className="gp-opcional">(la ven los clientes)</span></label>
                  <textarea id="descripcion" name="descripcion" maxLength={2000} rows={4} placeholder="Contale a los jugadores sobre tus instalaciones, iluminación, bar, etc." value={formData.descripcion} onChange={cambiarCampo} />
                </div>
              </div>
            </div>
          </section>

          <section className="rg-seccion">
            <h2><MapPin size={18} aria-hidden="true" /> Ubicación, contacto y servicios</h2>
            <div className="rg-fila-2">
              <CampoTexto etiqueta="Provincia" name="provincia" placeholder="Ej: Córdoba" value={formData.provincia} onChange={cambiarCampo} error={errores.provincia} required />
              <CampoTexto etiqueta="Ciudad" name="ciudad" placeholder="Ej: San Francisco" value={formData.ciudad} onChange={cambiarCampo} error={errores.ciudad} required />
            </div>
            <div className="rg-fila-2">
              <CampoTexto etiqueta="Dirección exacta" name="direccion" placeholder="Ej: Av. Urquiza 332" value={formData.direccion} onChange={cambiarCampo} error={errores.direccion} required />
              <CampoTexto etiqueta="Teléfono (WhatsApp)" name="telefono_contacto" type="tel" inputMode="tel" placeholder="Ej: 3564609641" value={formData.telefono_contacto} onChange={cambiarCampo} error={errores.telefono_contacto} required />
            </div>

            <label className="rg-toggle">
              <Car size={20} aria-hidden="true" />
              <span>
                <strong>Estacionamiento privado</strong>
                <small>Indicá si los jugadores tienen lugar para estacionar dentro del predio.</small>
              </span>
              <input type="checkbox" name="estacionamiento" checked={formData.estacionamiento} onChange={cambiarCampo} role="switch" />
            </label>

            <CampoTexto etiqueta="Servicios del predio" name="servicios" maxLength={500} placeholder="Ej: Parrillas, Vestuarios, Cantina, Techado" value={formData.servicios} onChange={cambiarCampo} ayuda="Separados por coma." />

            <fieldset className="rg-redes">
              <legend>Redes sociales (opcionales)</legend>
              <div className="rg-fila-2">
                <CampoTexto etiqueta="Instagram" name="instagram" maxLength={60} placeholder="@miclub" value={formData.instagram} onChange={cambiarCampo} />
                <CampoTexto etiqueta="TikTok" name="tiktok" maxLength={60} placeholder="@miclub" value={formData.tiktok} onChange={cambiarCampo} />
              </div>
              <CampoTexto etiqueta="Facebook" name="facebook" maxLength={60} placeholder="Mi Club" value={formData.facebook} onChange={cambiarCampo} />
            </fieldset>
          </section>

          <AceptaTerminos checked={aceptaTerminos} onChange={(v) => { setAceptaTerminos(v); setErrores((p) => ({ ...p, terminos: undefined })); }} error={errores.terminos} />

          {modo === 'prueba' && (
            <p className="gp-campo-ayuda">
              Al terminar los {DIAS_PRUEBA} días tu club deja de recibir reservas nuevas hasta que te suscribas
              {precio ? <> por <strong>{moneda(precio)}/mes</strong></> : null}. Tus datos quedan guardados.
            </p>
          )}

          {errorGeneral && <p className="gp-alerta gp-alerta--error" role="alert">{errorGeneral}</p>}
          {aviso && <p className="gp-alerta gp-alerta--exito" role="status">{aviso}</p>}

          <button type="submit" disabled={cargando} className="gp-btn gp-btn--primario rg-enviar">
            {cargando ? 'Configurando tu club…' : modo === 'pagar' ? 'Confirmar pago y crear mi club' : 'Empezar prueba gratis y crear mi club'}
          </button>
          {pideCredenciales && <p className="rg-pie">¿Ya tenés cuenta? <Link to="/login-admin">Ingresá</Link></p>}
        </form>
      </main>
    </div>
  );
};

export default RegistroClub;
