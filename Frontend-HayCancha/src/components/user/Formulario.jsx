import { useId, useState } from 'react';
import { Eye, EyeOff, Lock, Check, Circle } from 'lucide-react';
import { evaluarPassword } from '../../utils/validaciones';
import './componentes.css';

/**
 * Campo de texto con etiqueta, icono opcional y error/ayuda debajo (asociados con aria para lectores de pantalla).
 * `lateral` es un nodo opcional pegado a la derecha del input (ej. el ojo de la contraseña).
 */
export function CampoTexto({ etiqueta, icono: Icono, error, ayuda, lateral, className = '', ...propsInput }) {
  const id = useId();
  const idMensaje = `${id}-msg`;
  return (
    <div className={`gp-campo ${className}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className={`gp-input-icono ${Icono ? '' : 'sin-icono'}`}>
        {Icono && <Icono size={18} aria-hidden="true" />}
        <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error || ayuda ? idMensaje : undefined} className={error ? 'invalido' : ''} {...propsInput} />
        {lateral}
      </div>
      {error
        ? <small id={idMensaje} className="gp-campo-error" role="alert">{error}</small>
        : ayuda && <small id={idMensaje} className="gp-campo-ayuda">{ayuda}</small>}
    </div>
  );
}

const NIVELES = ['', 'Débil', 'Media', 'Buena', 'Fuerte'];

/** Barra de fuerza + lista de reglas de la contraseña, en vivo. */
export function MedidorPassword({ password }) {
  const { reglas, fuerza } = evaluarPassword(password);
  return (
    <div className="gp-medidor" aria-live="polite">
      <div className="gp-medidor-barra" data-nivel={fuerza} aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <span key={n} className={fuerza >= n ? 'activa' : ''} />)}
      </div>
      <p className="gp-medidor-nivel">{password ? `Seguridad: ${NIVELES[fuerza]}` : 'Elegí una contraseña segura'}</p>
      <ul className="gp-medidor-reglas">
        {reglas.map((r) => (
          <li key={r.id} className={r.cumple ? 'cumple' : ''}>
            {r.cumple ? <Check size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
            <span>{r.texto}<span className="gp-solo-lector">{r.cumple ? ' (cumplido)' : ' (falta)'}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Contraseña con botón para mostrarla. `medidor` agrega las reglas en vivo (para crear/cambiar contraseñas). */
export function CampoPassword({ etiqueta = 'Contraseña', valor, onCambio, nueva = false, medidor = false, error, ...resto }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <CampoTexto
        etiqueta={etiqueta}
        icono={Lock}
        type={visible ? 'text' : 'password'}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        autoComplete={nueva ? 'new-password' : 'current-password'}
        error={error}
        lateral={(
          <button type="button" className="gp-input-ojo" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}>
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
        {...resto}
      />
      {medidor && <MedidorPassword password={valor} />}
    </>
  );
}

/** Indicador de pasos (ej. Cuenta → Plan → Club). `actual` es 1-based. */
export function Pasos({ pasos, actual, etiqueta = 'Progreso' }) {
  return (
    <ol className="gp-pasos" aria-label={etiqueta}>
      {pasos.map((nombre, i) => (
        <li key={nombre} className={actual === i + 1 ? 'actual' : actual > i + 1 ? 'hecho' : ''} aria-current={actual === i + 1 ? 'step' : undefined}>
          <span aria-hidden="true">{actual > i + 1 ? '✓' : i + 1}</span>{nombre}
        </li>
      ))}
    </ol>
  );
}
