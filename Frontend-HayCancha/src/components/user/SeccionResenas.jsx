import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareText, PenLine } from 'lucide-react';
import { Estrellas } from './Estrellas';
import ModalResena from './ModalResena';
import { useAuth } from '../../context/authContext';
import { formatoPromedio } from '../../utils/reservas';
import { resumenPorClub, distribucionDeClub, resenasDeClub, misResenas } from '../../services/resenas';
import './componentes.css';

const POR_PAGINA = 6;

const fechaResena = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Reseñas de un club para su ficha pública: promedio, barras por puntaje y lista paginada. */
export default function SeccionResenas({ club, onResumen }) {
  const { user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [distribucion, setDistribucion] = useState(null);
  const [lista, setLista] = useState([]);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [miResena, setMiResena] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const alResumen = useRef(onResumen);
  useEffect(() => { alResumen.current = onResumen; });

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const [resumenes, dist, primeras, mias] = await Promise.all([
        resumenPorClub([club.id]),
        distribucionDeClub(club.id),
        resenasDeClub(club.id, { limite: POR_PAGINA }),
        user ? misResenas([club.id]) : Promise.resolve({}),
      ]);
      if (cancelado) return;
      setResumen(resumenes[club.id] || null);
      alResumen.current?.(resumenes[club.id] || null);
      setDistribucion(dist);
      setLista(primeras);
      setHayMas(primeras.length === POR_PAGINA);
      setMiResena(mias[club.id] || null);
      setCargando(false);
    })();

    return () => { cancelado = true; };
  }, [club.id, user, recarga]);

  const verMas = async () => {
    setCargandoMas(true);
    const siguientes = await resenasDeClub(club.id, { limite: POR_PAGINA, desde: lista.length });
    setLista((actual) => [...actual, ...siguientes]);
    setHayMas(siguientes.length === POR_PAGINA);
    setCargandoMas(false);
  };

  const total = resumen?.cantidad || 0;

  return (
    <section className="gp-rs" aria-labelledby="titulo-resenas">
      <div className="gp-rs-cabecera">
        <h3 id="titulo-resenas">Reseñas</h3>
        {user ? (
          <button type="button" className="gp-btn gp-btn--secundario" onClick={() => setModalAbierto(true)}>
            <PenLine size={16} /> {miResena ? 'Editar mi reseña' : 'Calificar este club'}
          </button>
        ) : (
          <Link to="/login-cliente" className="gp-btn gp-btn--secundario">Ingresá para calificar</Link>
        )}
      </div>

      {cargando ? (
        <p className="gp-rs-estado">Cargando reseñas…</p>
      ) : total === 0 ? (
        <div className="gp-rs-vacio">
          <MessageSquareText size={32} aria-hidden="true" />
          <p><strong>Todavía no hay reseñas.</strong> Después de jugar acá, contá cómo te fue: ayudás a otros jugadores a elegir.</p>
        </div>
      ) : (
        <>
          <div className="gp-rs-resumen">
            <div className="gp-rs-promedio">
              <span className="gp-rs-numero">{formatoPromedio(resumen.promedio)}</span>
              <Estrellas valor={resumen.promedio} tam={20} />
              <span className="gp-rs-total">{total} {total === 1 ? 'reseña' : 'reseñas'}</span>
            </div>
            <ul className="gp-rs-barras" aria-label="Distribución de calificaciones">
              {[5, 4, 3, 2, 1].map((n) => (
                <li key={n}>
                  <span>{n} ★</span>
                  <div className="gp-rs-barra"><div style={{ width: `${total ? ((distribucion?.[n] || 0) / total) * 100 : 0}%` }} /></div>
                  <span className="gp-rs-cuenta">{distribucion?.[n] || 0}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="gp-rs-lista">
            {lista.map((r) => (
              <li key={r.id} className={`gp-rs-item ${r.es_mia ? 'mia' : ''}`}>
                <div className="gp-rs-item-cabecera">
                  <span className="gp-rs-avatar" aria-hidden="true">{r.autor.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{r.autor}{r.es_mia && <em> · Tu reseña</em>}</strong>
                    <time dateTime={r.created_at}>{fechaResena(r.created_at)}</time>
                  </div>
                  <Estrellas valor={r.estrellas} tam={15} />
                </div>
                {r.comentario && <p>{r.comentario}</p>}
              </li>
            ))}
          </ul>

          {hayMas && (
            <button type="button" className="gp-btn gp-btn--fantasma gp-rs-mas" onClick={verMas} disabled={cargandoMas}>
              {cargandoMas ? 'Cargando…' : 'Ver más reseñas'}
            </button>
          )}
        </>
      )}

      {modalAbierto && (
        <ModalResena
          club={club}
          inicial={miResena}
          onCerrar={() => setModalAbierto(false)}
          onCambio={() => setRecarga((n) => n + 1)}
        />
      )}
    </section>
  );
}
