import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { postApi } from '../../services/api';
import { subirImagen, TIPOS_IMAGEN_ACEPTADOS } from '../../services/storage';
import { useAuth } from '../../context/authContext';
import { validarPassword, validarTelefono, mensajeDeServidor, AYUDA_PASSWORD } from '../../utils/validaciones';
import { CheckCircle2, ImagePlus, MapPin, Lock, Mail, Building2, Car } from 'lucide-react';
import './RegistroClub.css';

const ROLES_ADMIN = ['admin', 'superadmin'];

const AceptaTerminos = ({ checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '10px', backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
    <input
      type="checkbox"
      id="terminos"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer', accentColor: '#22c55e' }}
    />
    <label htmlFor="terminos" style={{ fontSize: '0.95rem', color: '#334155', cursor: 'pointer', lineHeight: '1.4' }}>
      He leído y acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: '600' }}>Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: '600' }}>Política de Privacidad</a> de GridPlay. Entiendo mis derechos como consumidor.
    </label>
  </div>
);

/**
 * Alta de club en dos pasos:
 *  1) Cuenta (email + contraseña) -> supabase.auth.signUp. El rol siempre nace 'cliente'.
 *  2) Con sesión iniciada, datos del club -> RPC registrar_club, que fija el rol 'admin' en el servidor.
 * Si el proyecto exige confirmar el mail, el paso 2 continúa después de iniciar sesión en /login-admin.
 */
const RegistroClub = () => {
  const navigate = useNavigate();
  const { user, rol, cargando: cargandoSesion, recargarPerfil } = useAuth();
  const [searchParams] = useSearchParams();
  const idPago = searchParams.get('preapproval_id'); // Mercado Pago lo agrega al volver de pagar

  // Estado de la suscripción de esta cuenta: cargando | activa | ninguna | verificando
  const [suscripcion, setSuscripcion] = useState('cargando');
  const [errorPago, setErrorPago] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [imagenFile, setImagenFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [cuenta, setCuenta] = useState({ email: '', password: '' });
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    provincia: '',
    ciudad: '',
    direccion: '',
    telefono_contacto: '',
    estacionamiento: false,
    servicios: '',
    instagram: '',
    tiktok: '',
    facebook: '',
  });

  // Un admin que ya tiene club no tiene nada que registrar.
  useEffect(() => {
    if (!cargandoSesion && user && ROLES_ADMIN.includes(rol)) navigate('/panel', { replace: true });
  }, [cargandoSesion, user, rol, navigate]);

  useEffect(() => () => { if (previewLogo) URL.revokeObjectURL(previewLogo); }, [previewLogo]);

  const leerSuscripcion = async (userId) => {
    const { data } = await supabase
      .from('suscripciones')
      .select('estado')
      .eq('user_id', userId)
      .eq('estado', 'activa')
      .limit(1);
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
        if (!ok) setErrorPago(data?.error || 'No pudimos verificar el pago.');
      }
      const estado = await leerSuscripcion(user.id);
      if (!cancelado) setSuscripcion(estado);
    })();

    return () => { cancelado = true; };
  }, [cargandoSesion, user, rol, idPago]);

  // Botón "Ya pagué": el servidor busca la suscripción autorizada de esta cuenta en Mercado Pago
  const verificarPago = async () => {
    setErrorPago('');
    setSuscripcion('verificando');
    const { ok, data } = await postApi('/api/vincular-suscripcion', {});
    if (!ok) setErrorPago(data?.error || 'No pudimos verificar el pago.');
    setSuscripcion(await leerSuscripcion(user.id));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setPreviewLogo(URL.createObjectURL(file));
  };

  // PASO 1 — crear la cuenta
  const handleCrearCuenta = async (e) => {
    e.preventDefault();
    setError('');
    setAviso('');

    const errorPassword = validarPassword(cuenta.password);
    if (errorPassword) { setError(errorPassword); return; }

    setCargando(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: cuenta.email.trim(),
        password: cuenta.password,
        options: { emailRedirectTo: `${window.location.origin}/login-admin` },
      });
      if (authError) throw authError;

      if (!data.session) {
        setAviso('Te enviamos un correo para confirmar tu cuenta. Después de confirmarla, ingresá desde "Panel de Clubes" para completar los datos de tu complejo.');
      }
      // Con sesión iniciada, AuthProvider actualiza el estado y se muestra el paso 2.
    } catch (err) {
      console.error('Error al crear la cuenta:', err);
      setError(err?.message?.includes('rate') ? 'Demasiados intentos. Esperá un momento y probá de nuevo.' : 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // PASO 2 — registrar el club
  const handleRegistrarClub = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarTelefono(formData.telefono_contacto)) {
      setError('Ingresá un teléfono válido (solo números, entre 6 y 20 dígitos).');
      return;
    }

    setCargando(true);

    let logoUrl = '';
    if (imagenFile) {
      try {
        logoUrl = await subirImagen(imagenFile, 'logos');
      } catch (err) {
        setError(err.message || 'No pudimos subir el logo. Probá con otra imagen.');
        setCargando(false);
        return;
      }
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
      setError(mensajeDeServidor(err, 'No pudimos registrar tu club. Intentá de nuevo.'));
    } finally {
      setCargando(false);
    }
  };

  if (cargandoSesion) return <div className="estado-carga">Cargando...</div>;

  const encabezado = (
    <div className="registro-header">
      <div className="icono-exito-wrapper">
        <CheckCircle2 size={48} />
      </div>
      <h1 className="registro-titulo">{user ? 'Completá tu complejo' : 'Creá tu cuenta de club'}</h1>
      <p className="registro-subtitulo">
        {user
          ? 'Completá el perfil de tu complejo para empezar a recibir reservas.'
          : 'Primero creamos tu cuenta de administrador; después cargás los datos del complejo.'}
      </p>
    </div>
  );

  const mensajes = (
    <>
      {error && <div className="alerta-error" role="alert" style={{ color: '#dc2626', margin: '12px 0', fontSize: '0.95rem' }}>{error}</div>}
      {aviso && <div className="alerta-exito" role="status" style={{ color: '#16a34a', margin: '12px 0', fontSize: '0.95rem' }}>{aviso}</div>}
    </>
  );

  if (!user) {
    return (
      <div className="registro-club-container">
        <div className="registro-club-card">
          {encabezado}
          <form onSubmit={handleCrearCuenta} className="registro-form">
            <div className="registro-seccion cuenta-admin-seccion">
              <h3 className="seccion-titulo"><Lock size={18} /> Tu cuenta de administrador</h3>
              <p className="seccion-descripcion">Con este correo y contraseña vas a ingresar a tu panel de control.</p>

              <div className="grid-2-col">
                <div className="input-group">
                  <label htmlFor="email">Correo electrónico</label>
                  <div className="input-con-icono">
                    <Mail size={18} />
                    <input id="email" type="email" name="email" autoComplete="email" placeholder="admin@tuclub.com" required
                      value={cuenta.email} onChange={(e) => setCuenta((c) => ({ ...c, email: e.target.value }))} className="form-input-reg" />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="password">Contraseña</label>
                  <div className="input-con-icono">
                    <Lock size={18} />
                    <input id="password" type="password" name="password" autoComplete="new-password" placeholder={AYUDA_PASSWORD} required minLength={8}
                      value={cuenta.password} onChange={(e) => setCuenta((c) => ({ ...c, password: e.target.value }))} className="form-input-reg" />
                  </div>
                </div>
              </div>
            </div>

            <AceptaTerminos checked={aceptaTerminos} onChange={setAceptaTerminos} />
            {mensajes}

            <button type="submit" disabled={cargando || !aceptaTerminos} className={`btn-submit-registro ${(cargando || !aceptaTerminos) ? 'cargando' : 'activo'}`}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>
              ¿Ya tenés cuenta? <a href="/login-admin" style={{ color: '#16a34a', fontWeight: 600 }}>Ingresá</a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Sin suscripción activa no se puede registrar el club (la base de datos también lo rechaza)
  if (suscripcion !== 'activa') {
    const verificando = suscripcion === 'cargando' || suscripcion === 'verificando';
    return (
      <div className="registro-club-container">
        <div className="registro-club-card">
          <div className="registro-header">
            <h1 className="registro-titulo">{verificando ? 'Verificando tu suscripción...' : 'Elegí tu plan'}</h1>
            <p className="registro-subtitulo">
              {verificando
                ? 'Estamos confirmando el pago con Mercado Pago.'
                : 'Para registrar tu complejo necesitás una suscripción activa. Es un pago mensual y podés cancelarlo cuando quieras.'}
            </p>
          </div>

          {errorPago && <div className="alerta-error" role="alert" style={{ color: '#dc2626', margin: '12px 0', fontSize: '0.95rem' }}>{errorPago}</div>}

          {!verificando && (
            <>
              <button type="button" className="btn-submit-registro activo" onClick={() => navigate('/planes')}>
                Ver planes y suscribirme
              </button>
              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>
                ¿Ya pagaste? <button type="button" onClick={verificarPago} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer' }}>Verificar mi pago</button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="registro-club-container">
      <div className="registro-club-card">
        {encabezado}

        <form onSubmit={handleRegistrarClub} className="registro-form">
          <div className="registro-seccion">
            <h3 className="seccion-titulo"><Building2 size={18} /> 1. Perfil del Club</h3>
            <div className="club-perfil-layout">
              <div className="logo-upload-col">
                <label className="logo-upload-box" htmlFor="logo-upload">
                  {previewLogo ? (
                    <img src={previewLogo} alt="Vista previa del logo" className="logo-preview-img" />
                  ) : (
                    <div className="logo-upload-placeholder">
                      <ImagePlus size={32} />
                      <span>Subir Logo</span>
                    </div>
                  )}
                  <input id="logo-upload" type="file" accept={TIPOS_IMAGEN_ACEPTADOS} onChange={handleImageChange} required style={{ display: 'none' }} />
                </label>
                <p className="logo-ayuda">JPG, PNG o WebP, hasta 5 MB.</p>
              </div>

              <div className="texto-info-col">
                <div className="input-group">
                  <label htmlFor="nombre">Nombre del Complejo</label>
                  <input id="nombre" type="text" name="nombre" maxLength={120} placeholder="Ej: Sport Automóvil Club" required onChange={handleChange} className="form-input-reg" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="descripcion">Descripción (Visible para los clientes)</label>
                  <textarea id="descripcion" name="descripcion" maxLength={2000} placeholder="Contale a los jugadores sobre tus instalaciones, iluminación, bar, etc..." onChange={handleChange} className="form-input-reg form-textarea-reg" />
                </div>
              </div>
            </div>
          </div>

          <div className="registro-seccion">
            <h3 className="seccion-titulo"><MapPin size={18} /> 2. Detalles, Contacto y Servicios</h3>

            <div className="grid-2-col">
              <div className="input-group">
                <label htmlFor="provincia">Provincia</label>
                <input id="provincia" type="text" name="provincia" placeholder="Ej: Córdoba" required onChange={handleChange} className="form-input-reg" />
              </div>
              <div className="input-group">
                <label htmlFor="ciudad">Ciudad</label>
                <input id="ciudad" type="text" name="ciudad" placeholder="Ej: San Francisco" required onChange={handleChange} className="form-input-reg" />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="input-group">
                <label htmlFor="direccion">Dirección Exacta</label>
                <input id="direccion" type="text" name="direccion" placeholder="Ej: Av. Urquiza 332" required onChange={handleChange} className="form-input-reg" />
              </div>
              <div className="input-group">
                <label htmlFor="telefono_contacto">Teléfono (WhatsApp)</label>
                <input id="telefono_contacto" type="tel" name="telefono_contacto" placeholder="Ej: 3564609641" required onChange={handleChange} className="form-input-reg" />
              </div>
            </div>

            <label className="toggle-servicio-container" style={{ marginBottom: '15px' }}>
              <div className="toggle-info">
                <Car size={20} className={formData.estacionamiento ? 'text-green' : 'text-gray'} />
                <div>
                  <strong>Estacionamiento Privado</strong>
                  <p>Indicá si los jugadores tienen lugar para estacionar dentro del predio.</p>
                </div>
              </div>
              <div className="toggle-switch">
                <input type="checkbox" name="estacionamiento" onChange={handleChange} />
                <span className="slider"></span>
              </div>
            </label>

            <div className="input-group">
              <label htmlFor="servicios">Servicios del Predio (Separados por coma)</label>
              <input id="servicios" type="text" name="servicios" maxLength={500} placeholder="Ej: Parrillas, Vestuarios, Cantina, Techado" onChange={handleChange} className="form-input-reg" />
            </div>

            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#334155' }}>Redes Sociales (Opcionales)</h4>
              <div className="grid-2-col">
                <div className="input-group">
                  <label htmlFor="instagram">Instagram</label>
                  <input id="instagram" type="text" name="instagram" maxLength={60} placeholder="@miclub" onChange={handleChange} className="form-input-reg" />
                </div>
                <div className="input-group">
                  <label htmlFor="tiktok">TikTok</label>
                  <input id="tiktok" type="text" name="tiktok" maxLength={60} placeholder="@miclub" onChange={handleChange} className="form-input-reg" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label htmlFor="facebook">Facebook</label>
                <input id="facebook" type="text" name="facebook" maxLength={60} placeholder="Mi Club" onChange={handleChange} className="form-input-reg" />
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Cuenta de administrador: <strong>{user.email}</strong></p>

          <AceptaTerminos checked={aceptaTerminos} onChange={setAceptaTerminos} />
          {mensajes}

          <button type="submit" disabled={cargando || !aceptaTerminos} className={`btn-submit-registro ${(cargando || !aceptaTerminos) ? 'cargando' : 'activo'}`}>
            {cargando ? 'Configurando tu club...' : 'Finalizar Configuración'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistroClub;
