import { useState } from 'react';
import { Star } from 'lucide-react';
import { formatoPromedio } from '../../utils/reservas';
import './componentes.css';

const FilaEstrellas = ({ tam }) => (
  <span className="gp-estrellas-fila" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={tam} fill="currentColor" strokeWidth={0} />)}
  </span>
);

/** Estrellas de solo lectura, con relleno parcial (4,3 llena cuatro y un 30 % de la quinta). */
export function Estrellas({ valor = 0, tam = 16 }) {
  const porcentaje = Math.max(0, Math.min(5, Number(valor) || 0)) * 20;
  return (
    <span className="gp-estrellas" role="img" aria-label={`${formatoPromedio(valor)} de 5 estrellas`}>
      <FilaEstrellas tam={tam} />
      <span className="gp-estrellas-llenas" style={{ width: `${porcentaje}%` }}>
        <FilaEstrellas tam={tam} />
      </span>
    </span>
  );
}

/** Chip compacto "★ 4,7 (32)" o "Sin reseñas" para tarjetas y encabezados. */
export function Calificacion({ resumen, className = '' }) {
  if (!resumen || !resumen.cantidad) {
    return (
      <span className={`gp-calif gp-calif--vacia ${className}`}>
        <Star size={14} strokeWidth={2} /> Sin reseñas todavía
      </span>
    );
  }
  return (
    <span className={`gp-calif ${className}`} title={`${formatoPromedio(resumen.promedio)} de 5 · ${resumen.cantidad} reseñas`}>
      <Star size={14} fill="currentColor" strokeWidth={0} />
      <strong>{formatoPromedio(resumen.promedio)}</strong>
      <span>({resumen.cantidad})</span>
    </span>
  );
}

const TEXTOS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

/** Selector de 1 a 5 estrellas (radiogroup: se maneja con mouse, toque y flechas del teclado). */
export function EstrellasInput({ valor, onCambio, etiqueta = 'Tu calificación' }) {
  const [previa, setPrevia] = useState(0);
  const activa = previa || valor;

  const alTeclear = (e) => {
    if (['ArrowRight', 'ArrowUp'].includes(e.key)) { e.preventDefault(); onCambio(Math.min(5, (valor || 0) + 1)); }
    if (['ArrowLeft', 'ArrowDown'].includes(e.key)) { e.preventDefault(); onCambio(Math.max(1, (valor || 1) - 1)); }
  };

  return (
    <div className="gp-est-input">
      <div role="radiogroup" aria-label={etiqueta} className="gp-est-input-fila" onMouseLeave={() => setPrevia(0)} onKeyDown={alTeclear}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            tabIndex={valor === n || (!valor && n === 1) ? 0 : -1}
            className={activa >= n ? 'activa' : ''}
            onMouseEnter={() => setPrevia(n)}
            onClick={() => onCambio(n)}
          >
            <Star size={36} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </div>
      <span className="gp-est-input-texto" aria-live="polite">{TEXTOS[activa] || 'Tocá una estrella'}</span>
    </div>
  );
}
