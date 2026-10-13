import { useEffect, useState } from 'react';
import { Eye, EyeOff, MessageSquareText, Star } from 'lucide-react';
import { Panel, Chip, Vacio } from '../components/ui.jsx';
import { Estrellas } from '../../../components/user/Estrellas';
import { resenasDeMiClub, moderarResena } from '../../../services/resenas';
import { mensajeDeServidor } from '../../../utils/validaciones';
import { formatoPromedio } from '../../../utils/reservas';
import { pluralizar } from '../lib/formato.js';

const fechaResena = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Reseñas del club: lo que opinan los jugadores y la posibilidad de ocultar un comentario fuera de lugar. */
const Resenas = () => {
  const [lista, setLista] = useState(null); // null = todavía no cargó o no disponible
  const [cargando, setCargando] = useState(true);
  const [enCurso, setEnCurso] = useState(null); // id de la reseña que se está moderando
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const datos = await resenasDeMiClub();
      if (cancelado) return;
      setLista(datos);
      setCargando(false);
    })();
    return () => { cancelado = true; };
  }, []);

  const alternar = async (resena) => {
    setError('');
    setEnCurso(resena.id);
    try {
      await moderarResena(resena.id, !resena.oculta);
      setLista((actual) => actual.map((r) => (r.id === resena.id ? { ...r, oculta: !resena.oculta } : r)));
    } catch (err) {
      console.error('No se pudo moderar la reseña:', err);
      setError(mensajeDeServidor(err, 'No pudimos guardar el cambio. Intentá de nuevo.'));
    } finally {
      setEnCurso(null);
    }
  };

  const total = lista?.length || 0;
  const promedio = total ? lista.reduce((a, r) => a + r.estrellas, 0) / total : 0;
  const ocultas = lista?.filter((r) => r.oculta).length || 0;

  return (
    <>
      <header className="dash-page-head">
        <div>
          <h1>Reseñas</h1>
          <p>Lo que opinan los jugadores que ya pasaron por tu club</p>
        </div>
      </header>

      {total > 0 && (
        <div className="dash-resumen-chips">
          <Chip tono="ambar"><Star size={14} fill="currentColor" strokeWidth={0} /> {formatoPromedio(promedio)} de promedio</Chip>
          <Chip tono="azul"><MessageSquareText size={14} /> {pluralizar(total, 'reseña', 'reseñas')}</Chip>
          {ocultas > 0 && <Chip tono="neutro"><EyeOff size={14} /> {pluralizar(ocultas, 'comentario oculto', 'comentarios ocultos')}</Chip>}
        </div>
      )}

      <Panel
        titulo="Todas las reseñas"
        descripcion="Podés ocultar un comentario fuera de lugar. Las estrellas siguen contando en tu promedio."
        flush
      >
        {error && <p className="dash-error dash-error--panel" role="alert">{error}</p>}

        {cargando ? (
          <div className="dash-mensaje dash-mensaje--chico">Cargando reseñas…</div>
        ) : lista === null ? (
          <Vacio icono={MessageSquareText} titulo="No pudimos cargar las reseñas" texto="Probá de nuevo en unos minutos." />
        ) : total === 0 ? (
          <Vacio icono={MessageSquareText} titulo="Todavía no hay reseñas" texto="Cuando un jugador califique tu club después de jugar, la vas a ver acá." />
        ) : (
          <ul className="dash-resenas">
            {lista.map((r) => (
              <li key={r.id} className={`dash-resena ${r.oculta ? 'oculta' : ''}`}>
                <span className="dash-avatar" aria-hidden="true">{r.autor.charAt(0).toUpperCase()}</span>
                <div className="dash-resena-cuerpo">
                  <div className="dash-resena-cabecera">
                    <strong>{r.autor}</strong>
                    <Estrellas valor={r.estrellas} tam={15} />
                    <time dateTime={r.created_at}>{fechaResena(r.created_at)}</time>
                    {r.oculta && <Chip tono="neutro">Comentario oculto</Chip>}
                  </div>
                  {r.comentario
                    ? <p>{r.comentario}</p>
                    : <p className="dash-resena-sin-texto">Sin comentario.</p>}
                </div>
                {r.comentario && (
                  <button type="button" className="dash-btn dash-btn--secundario dash-btn--chico" onClick={() => alternar(r)} disabled={enCurso === r.id}>
                    {r.oculta ? <><Eye size={14} /> Volver a mostrar</> : <><EyeOff size={14} /> Ocultar comentario</>}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
};

export default Resenas;
