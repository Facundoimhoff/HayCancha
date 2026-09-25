import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import './componentes.css';

/**
 * Carrusel de fotos con flechas, puntos y navegación por teclado (flechas izquierda/derecha).
 * Con una sola foto no muestra controles; sin fotos muestra `vacio`.
 */
export default function Carrusel({ imagenes, etiqueta, vacio = 'No hay fotos disponibles', className = '' }) {
  const [indice, setIndice] = useState(0);
  const total = imagenes.length;

  if (total === 0) {
    return (
      <div className={`gp-carrusel gp-carrusel--vacio ${className}`}>
        <ImageIcon size={44} aria-hidden="true" />
        <span>{vacio}</span>
      </div>
    );
  }

  const actual = Math.min(indice, total - 1);
  const ir = (delta) => setIndice((i) => (Math.min(i, total - 1) + delta + total) % total);
  const alTeclear = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
  };

  return (
    <div className={`gp-carrusel ${className}`} role="group" aria-roledescription="carrusel" aria-label={etiqueta} tabIndex={total > 1 ? 0 : undefined} onKeyDown={alTeclear}>
      <img src={imagenes[actual]} alt={`${etiqueta} — foto ${actual + 1} de ${total}`} loading="lazy" />
      {total > 1 && (
        <>
          <button type="button" className="gp-carrusel-flecha izq" onClick={() => ir(-1)} aria-label="Foto anterior"><ChevronLeft size={22} /></button>
          <button type="button" className="gp-carrusel-flecha der" onClick={() => ir(1)} aria-label="Foto siguiente"><ChevronRight size={22} /></button>
          <div className="gp-carrusel-puntos">
            {imagenes.map((_, i) => (
              <button key={i} type="button" className={i === actual ? 'activo' : ''} onClick={() => setIndice(i)} aria-label={`Ir a la foto ${i + 1}`} aria-current={i === actual ? 'true' : undefined} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
