import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';
import { Estrellas } from './Estrellas';
import { resenasDestacadas } from '../../services/resenas';
import './seccionesLanding.css';

/**
 * Reseñas reales de jugadores (solo pueden opinar quienes ya jugaron en el club), sacadas de la base.
 * Si todavía no hay ninguna (o la base no tiene la función), la sección no aparece.
 */
export default function ResenasPortada() {
  const [resenas, setResenas] = useState([]);

  useEffect(() => {
    let vigente = true;
    resenasDestacadas(6).then((lista) => { if (vigente) setResenas(lista); });
    return () => { vigente = false; };
  }, []);

  if (resenas.length === 0) return null;

  return (
    <section className="rp" aria-labelledby="rp-titulo">
      <div className="rp-contenedor">
        <h2 id="rp-titulo" className="rp-titulo">Lo que dicen los jugadores</h2>
        <p className="rp-subtitulo">Reseñas de personas que reservaron y jugaron en los clubes de GridPlay.</p>
        <ul className="rp-lista">
          {resenas.map((r) => (
            <li key={r.id} className="rp-tarjeta">
              <Quote size={22} className="rp-comilla" aria-hidden="true" />
              <Estrellas valor={r.estrellas} tam={16} />
              <blockquote>{r.comentario}</blockquote>
              <footer>
                <strong>{r.autor}</strong>
                <Link to={`/club/${r.club_id}`}>{r.club_nombre}{r.club_ciudad ? ` · ${r.club_ciudad}` : ''}</Link>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
