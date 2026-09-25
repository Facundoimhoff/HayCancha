import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { CampoPassword } from '../../components/user/Formulario';
import { evaluarPassword } from '../../utils/validaciones';
import './Auth.css';

/** Cambio de contraseña desde el enlace del correo de recuperación. */
const ActualizarPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [listo, setListo] = useState(false);
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const enviar = async (e) => {
    e.preventDefault();
    setErrorGeneral('');

    const nuevos = {};
    if (!evaluarPassword(password).valida) nuevos.password = 'Completá todos los requisitos de la contraseña.';
    if (password !== confirmacion) nuevos.confirmacion = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setCargando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setListo(true);
      temporizador.current = setTimeout(() => navigate('/login-admin'), 2000);
    } catch (err) {
      console.error('Error al actualizar la contraseña:', err);
      const texto = err?.message || '';
      if (err?.code === 'weak_password' || texto.toLowerCase().includes('password should')) setErrores({ password: 'La contraseña no cumple los requisitos de seguridad.' });
      else if (texto.includes('same')) setErrores({ password: 'La nueva contraseña tiene que ser distinta de la anterior.' });
      else setErrorGeneral('No pudimos actualizar tu contraseña. Es posible que el enlace haya expirado: pedí uno nuevo desde “¿Olvidaste tu contraseña?”.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="au-pagina">
      <main className="au-card">
        <div className="au-header">
          <div className="au-icono"><KeyRound size={30} aria-hidden="true" /></div>
          <h1>Nueva contraseña</h1>
          <p>Elegí una clave segura para tu cuenta.</p>
        </div>

        <div className="au-mensajes">
          {errorGeneral && <p className="gp-alerta gp-alerta--error" role="alert">{errorGeneral}</p>}
          {listo && <p className="gp-alerta gp-alerta--exito" role="status">¡Contraseña actualizada! Te llevamos al ingreso…</p>}
        </div>

        <form onSubmit={enviar} className="au-form" noValidate>
          <CampoPassword
            etiqueta="Nueva contraseña"
            valor={password}
            onCambio={(v) => { setPassword(v); setErrores((p) => ({ ...p, password: undefined })); }}
            nueva
            medidor
            required
            disabled={listo}
            error={errores.password}
          />
          <CampoPassword
            etiqueta="Confirmar contraseña"
            valor={confirmacion}
            onCambio={(v) => { setConfirmacion(v); setErrores((p) => ({ ...p, confirmacion: undefined })); }}
            nueva
            required
            disabled={listo}
            placeholder="Repetí la contraseña"
            error={errores.confirmacion}
          />

          <button type="submit" className="gp-btn gp-btn--primario" disabled={cargando || listo}>
            {cargando ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
          <button type="button" onClick={() => navigate('/login-admin')} className="gp-btn gp-btn--fantasma" disabled={cargando || listo}>
            <ArrowLeft size={16} /> Cancelar y volver
          </button>
        </form>
      </main>
    </div>
  );
};

export default ActualizarPassword;
