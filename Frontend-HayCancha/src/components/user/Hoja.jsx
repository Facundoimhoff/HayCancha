import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './componentes.css';

const FOCUSABLES = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Ventana modal accesible (en celular se muestra como hoja desde abajo).
 * Cierra con Escape o tocando el fondo, bloquea el scroll de la página y devuelve el foco al cerrar.
 */
export default function Hoja({ titulo, descripcion, onCerrar, children, pie, ancho = 'md' }) {
  const idTitulo = useId();
  const dialogo = useRef(null);
  const cerrar = useRef(onCerrar);
  useEffect(() => { cerrar.current = onCerrar; });

  useEffect(() => {
    const previo = document.activeElement;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogo.current?.focus();

    const alTeclear = (e) => {
      if (e.key === 'Escape') { cerrar.current?.(); return; }
      if (e.key !== 'Tab' || !dialogo.current) return;
      const items = [...dialogo.current.querySelectorAll(FOCUSABLES)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const primero = items[0];
      const ultimo = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === dialogo.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', alTeclear);

    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
      previo?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="gp-hoja-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar.current?.(); }}>
      <div ref={dialogo} className={`gp-hoja gp-hoja--${ancho}`} role="dialog" aria-modal="true" aria-labelledby={idTitulo} tabIndex={-1}>
        <header className="gp-hoja-cabecera">
          <div>
            <h2 id={idTitulo}>{titulo}</h2>
            {descripcion && <p>{descripcion}</p>}
          </div>
          <button type="button" className="gp-hoja-cerrar" onClick={() => cerrar.current?.()} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        <div className="gp-hoja-cuerpo">{children}</div>
        {pie && <footer className="gp-hoja-pie">{pie}</footer>}
      </div>
    </div>,
    document.body,
  );
}
