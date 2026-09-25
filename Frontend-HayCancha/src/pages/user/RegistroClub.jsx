import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { postApi, precalentarApi } from '../../services/api';
import { subirImagen, TIPOS_IMAGEN_ACEPTADOS } from '../../services/storage';
import { useAuth } from '../../context/authContext';
import { usePagoPlan } from '../../hooks/usePagoPlan';
import { usePrecioPlan } from '../../hooks/usePlanes';
import { CampoTexto, CampoPassword, Pasos } from '../../components/user/Formulario';
import { evaluarPassword, validarTelefono, mensajeDeServidor } from '../../utils/validaciones';
import { moneda } from '../../utils/reservas';
import { CheckCircle2, ImagePlus, MapPin, Mail, Building2, Car, Zap } from 'lucide-react';
import './RegistroClub.css';

const ROLES_ADMIN = ['admin', 'superadmin'];
const PASOS = ['Cuenta', 'Plan', 'Club'];
const BENEFICIOS = ['Canchas y reservas ilimitadas', 'Panel de administración privado', 'Métricas de ingresos y ocupación'];

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
 * Alta de club en tres pasos visibles:
 *  1) Cuenta (email + contraseña) -> supabase.auth.signUp. El rol siempre nace 'cliente'.
 *  2) Plan -> suscripción verificada con Mercado Pago (el backend confirma el pago).
 *  3) Club -> RPC registrar_club, que fija el rol 'admin' en el servidor.
 * Si el proyecto exige confirmar el mail, el paso 2 continúa después de iniciar sesión en /login-admin.
 */
const RegistroClub = () => {
  const navigate = useNavigate();
  const { user, rol, cargando: cargandoSesion, recargarPerfil } = useAuth();
  const [searchParams] = useSearchParams();
  const idPago = searchParams.get('preapproval_id'); // Mercado Pago lo agrega al volver de pagar

  // Estado de la suscripción de esta cuenta: cargando | activa | ninguna | verificando
  const [suscripcion, setSuscripcion] = useState('cargando');
  const [errorVerificacion, setErrorVerificacion] = useState('');
  const pago = usePagoPlan('Full');
  const { precio, cargando: cargandoPrecio } = usePrecioPlan('Full');

  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [aviso, setAviso] = useState('');
  const [errores, setErrores] = useState({});
  const [imagenFile, setImagenFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [cuenta, setCuenta] = useState({ email: '', password: '' });
  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', provincia: '', ciudad: '', direccion: '', telefono_contacto: '',
    estacionamiento: false, servicios: '', instagram: '', tiktok: '', facebook: '',
  });

  // Un admin que ya tiene club no tiene nada que registrar.
  useEffect(() => {
    if (!cargandoSesion && user && ROLES_ADMIN.includes(rol)) navigate('/panel', { replace: true });
  }, [cargandoSesion, user, rol, navigate]);

  useEffect(() => () => { if (previewLogo) URL.revokeObjectURL(previewLogo); }, [previewLogo]);

  // Al volver de Mercado Pago (o antes de ir a pagar) el backend tiene que estar despierto.
  useEffect(() => { precalentarApi(); }, []);

  const leerSuscripcion = async (userId) => {
    const { data } = await supabase.from('suscripciones').select('estado').eq('user_id', userId).eq('estado', 'activa').limit(1);
    return data?.length ? 'activa' : 'ninguna';
  };

  // Si vuelve de Mercado Pago, el servidor VERIFICA el pago; después se lee el estado real (RLS: solo la propia).
  useEffect(() => {
    if (cargandoSesion || !user || ROLES_ADMIN.includes(rol)) return undefined;
    let cancelado = false;

    (async () => {
      if (idPago) {
        const { ok, data } = await postApi('/api/vincular-suscripcion', { preapproval_id: idPago });
        if (cancelado) return;
        if (!ok) setErrorVerificacion(data?.error || 'No pudimos verificar el pago.');
      }
      const estado = await leerSuscripcion(user.id);
      if (!cancelado) setSuscripcion(estado);
    })();

    return () => { cancelado = true; };
  }, [cargandoSesion, user, rol, idPago]);

  // Botón "Ya pagué": el servidor busca la suscripción autorizada de esta cuenta en Mercado Pago
  const verificarPago = async () => {
    setErrorVerificacion('');
    setSuscripcion('verificando');
    const { ok, data } = await postApi('/api/vincular-suscripcion', {});
    if (!ok) setErrorVerificacion(data?.error || 'No pudimos verificar el pago.');
    setSuscripcion(await leerSuscripcion(user.id));
  };

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

  // PASO 1 — crear la cuenta
  const crearCuenta = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    setAviso('');

    const nuevosErrores = {};
    if (!evaluarPassword(cuenta.password).valida) nuevosErrores.password = 'Completá todos los requisitos de la contraseña.';
    if (!aceptaTerminos) nuevosErrores.terminos = 'Tenés que aceptar los términos para continuar.';
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    setCargando(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: cuenta.email.trim(),
        password: cuenta.password,
        options: { emailRedirectTo: `${window.location.origin}/login-admin` },
      });
      if (authError) throw authError;

      // Con confirmación de mail, Supabase no avisa que el email ya existe: devuelve un usuario sin identidades.
      if (data.user && data.user.identities?.length === 0) {
        setErrores({ email: 'Ya existe una cuenta con este email.', emailExistente: true });
        return;
      }

      if (!data.session) {
        setAviso('Te enviamos un correo para confirmar tu cuenta. Después de confirmarla, ingresá desde "Panel de Clubes" para seguir con el plan y los datos de tu complejo.');
      }
      // Con sesión iniciada, AuthProvider actualiza el estado y se muestra el paso 2.
    } catch (err) {
      console.error('Error al crear la cuenta:', err);
      const mensaje = err?.message || '';
      if (mensaje.includes('already registered')) setErrores({ email: 'Ya existe una cuenta con este email.', emailExistente: true });
      else if (mensaje.includes('rate')) setErrorGeneral('Demasiados intentos. Esperá un momento y probá de nuevo.');
      else if (err?.code === 'weak_password' || mensaje.toLowerCase().includes('password')) setErrores({ password: 'La contraseña no cumple los requisitos de seguridad.' });
      else setErrorGeneral('No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // PASO 3 — registrar el club
  const registrarClub = async (e) => {
    e.preventDefault();
    setErrorGeneral('');

    const nuevosErrores = {};
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

    let logoUrl;
    try {
      logoUrl = await subirImagen(imagenFile, 'logos');
    } catch (err) {
      setErrores({ logo: err.message || 'No pudimos subir el logo. Probá con otra imagen.' });
      setCargando(false);
      return;
    }

    try {
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
        p_correo: user.email,
      });
      if (clubError) throw clubError;

      recargarPerfil();
      navigate('/panel', { replace: true });
    } catch (err) {
      console.error('Error al registrar el club:', err);
      setErrorGeneral(mensajeDeServidor(err, 'No pudimos registrar tu club. Intentá de nuevo.'));
    } finally {
      setCargando(false);
    }
  };

  if (cargandoSesion) return <div className="estado-carga">Cargando...</div>;

  const paso = !user ? 1 : suscripcion === 'activa' ? 3 : 2;
  const titulos = {
    1: ['Creá tu cuenta de club', 'Primero creamos tu cuenta de administrador; después elegís el plan y cargás los datos del complejo.'],
    2: ['Elegí tu plan', 'Para registrar tu complejo necesitás una suscripción activa. Es un pago mensual y podés cancelarlo cuando quieras.'],
    3: ['Completá tu complejo', 'Completá el perfil de tu complejo para empezar a recibir reservas.'],
  }[paso];
  const verificando = suscripcion === 'cargando' || suscripcion === 'verificando';

  return (
    <div className="registro-club-container">
      <main className="registro-club-card">
        <div className="registro-header">
          <div className="icono-exito-wrapper"><CheckCircle2 size={44} aria-hidden="true" /></div>
          <h1 className="registro-titulo">{verificando && paso === 2 ? 'Verificando tu suscripción…' : titulos[0]}</h1>
          <p className="registro-subtitulo">{verificando && paso === 2 ? 'Estamos confirmando el pago con Mercado Pago.' : titulos[1]}</p>
        </div>

        <Pasos pasos={PASOS} actual={paso} etiqueta="Pasos del registro" />

        {/* ---------------- PASO 1: CUENTA ---------------- */}
        {paso === 1 && (
          <form onSubmit={crearCuenta} className="gp-form" noValidate>
            <CampoTexto
              etiqueta="Correo electrónico"
              icono={Mail}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="admin@tuclub.com"
              required
              value={cuenta.email}
              onChange={(e) => { setCuenta((c) => ({ ...c, email: e.target.value })); setErrores((p) => ({ ...p, email: undefined, emailExistente: false })); }}
              error={errores.email}
              ayuda="Con este correo vas a ingresar a tu panel de control."
            />
            {errores.emailExistente && (
              <p className="gp-alerta gp-alerta--aviso">¿Ya tenés cuenta? <Link to="/login-admin">Ingresá con ese correo</Link> y seguimos con tu plan y tu club.</p>
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

            <AceptaTerminos checked={aceptaTerminos} onChange={(v) => { setAceptaTerminos(v); setErrores((p) => ({ ...p, terminos: undefined })); }} error={errores.terminos} />

            {errorGeneral && <p className="gp-alerta gp-alerta--error" role="alert">{errorGeneral}</p>}
            {aviso && <p className="gp-alerta gp-alerta--exito" role="status">{aviso}</p>}

            <button type="submit" disabled={cargando} className="gp-btn gp-btn--primario rg-enviar">{cargando ? 'Creando cuenta…' : 'Crear cuenta y continuar'}</button>
            <p className="rg-pie">¿Ya tenés cuenta? <Link to="/login-admin">Ingresá</Link></p>
          </form>
        )}

        {/* ---------------- PASO 2: PLAN ---------------- */}
        {paso === 2 && !verificando && (
          <div className="rg-plan">
            <div className="rg-plan-tarjeta">
              <span className="rg-plan-badge"><Zap size={14} fill="currentColor" /> PLAN FULL</span>
              <p className="rg-plan-precio"><strong>{cargandoPrecio ? '…' : precio ? moneda(precio) : 'Consultar'}</strong>{precio ? <span>/ mes</span> : null}</p>
              <ul>{BENEFICIOS.map((b) => <li key={b}><CheckCircle2 size={16} aria-hidden="true" /> {b}</li>)}</ul>
              <button type="button" className="gp-btn gp-btn--primario rg-enviar" onClick={pago.iniciar} disabled={pago.cargando}>
                {pago.cargando ? 'Conectando con Mercado Pago…' : 'Suscribirme con Mercado Pago'}
              </button>
              {pago.cargando && pago.servidorLento && <p className="gp-alerta gp-alerta--aviso" role="status">Estamos despertando el servidor, puede tardar unos segundos. No cierres esta página.</p>}
              {pago.error && <p className="gp-alerta gp-alerta--error" role="alert">{pago.error}</p>}
              <small>Pago seguro a través de Mercado Pago. Cancelás cuando quieras.</small>
            </div>

            {errorVerificacion && <p className="gp-alerta gp-alerta--error" role="alert">{errorVerificacion}</p>}
            <p className="rg-pie">
              ¿Ya pagaste? <button type="button" className="rg-enlace" onClick={verificarPago}>Verificar mi pago</button> · <Link to="/planes">Ver detalles del plan</Link>
            </p>
          </div>
        )}

        {/* ---------------- PASO 3: CLUB ---------------- */}
        {paso === 3 && (
          <form onSubmit={registrarClub} className="gp-form rg-form-club" noValidate>
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

            <p className="rg-cuenta">Cuenta de administrador: <strong>{user.email}</strong></p>

            <AceptaTerminos checked={aceptaTerminos} onChange={(v) => { setAceptaTerminos(v); setErrores((p) => ({ ...p, terminos: undefined })); }} error={errores.terminos} />

            {errorGeneral && <p className="gp-alerta gp-alerta--error" role="alert">{errorGeneral}</p>}

            <button type="submit" disabled={cargando} className="gp-btn gp-btn--primario rg-enviar">{cargando ? 'Configurando tu club…' : 'Finalizar configuración'}</button>
          </form>
        )}
      </main>
    </div>
  );
};

export default RegistroClub;
