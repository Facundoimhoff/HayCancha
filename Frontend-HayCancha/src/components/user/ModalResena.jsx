import { useState } from 'react';
import Hoja from './Hoja';
import { EstrellasInput } from './Estrellas';
import { calificarClub, borrarMiResena } from '../../services/resenas';
import { mensajeDeServidor } from '../../utils/validaciones';

const MAX_COMENTARIO = 600;

/**
 * Calificar un club (o editar/borrar la reseña propia).
 * `inicial` = { estrellas, comentario } si ya calificó. `onCambio(resenaOnull)` avisa el resultado.
 * El servidor decide si puede calificar (solo quien ya jugó ahí); su mensaje se muestra dentro del modal.
 */
export default function ModalResena({ club, inicial, onCerrar, onCambio }) {
  const [estrellas, setEstrellas] = useState(inicial?.estrellas || 0);
  const [comentario, setComentario] = useState(inicial?.comentario || '');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    if (!estrellas) { setError('Elegí una calificación de 1 a 5 estrellas.'); return; }
    setOcupado(true);
    setError('');
    try {
      await calificarClub(club.id, estrellas, comentario);
      onCambio({ estrellas, comentario: comentario.trim() || null });
      onCerrar();
    } catch (err) {
      setError(mensajeDeServidor(err, 'No pudimos guardar tu reseña. Intentá de nuevo.'));
      setOcupado(false);
    }
  };

  const borrar = async () => {
    setOcupado(true);
    setError('');
    try {
      await borrarMiResena(club.id);
      onCambio(null);
      onCerrar();
    } catch {
      setError('No pudimos eliminar tu reseña. Intentá de nuevo.');
      setOcupado(false);
    }
  };

  return (
    <Hoja
      titulo={inicial ? 'Editá tu reseña' : 'Calificá tu experiencia'}
      descripcion={club.nombre}
      onCerrar={onCerrar}
      pie={(
        <>
          {inicial && !confirmaBorrar && (
            <button type="button" className="gp-btn gp-btn--peligro-suave" onClick={() => setConfirmaBorrar(true)} disabled={ocupado}>Eliminar</button>
          )}
          {inicial && confirmaBorrar && (
            <button type="button" className="gp-btn gp-btn--peligro" onClick={borrar} disabled={ocupado}>Sí, eliminar</button>
          )}
          <span className="gp-espaciador" />
          <button type="button" className="gp-btn gp-btn--fantasma" onClick={onCerrar} disabled={ocupado}>Cancelar</button>
          <button type="submit" form="form-resena" className="gp-btn gp-btn--primario" disabled={ocupado || !estrellas}>
            {ocupado ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Publicar reseña'}
          </button>
        </>
      )}
    >
      <form id="form-resena" onSubmit={guardar} className="gp-form">
        <EstrellasInput valor={estrellas} onCambio={setEstrellas} />

        <label className="gp-campo">
          <span>Tu comentario <em>(opcional)</em></span>
          <textarea
            rows={4}
            maxLength={MAX_COMENTARIO}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Cómo estaba la cancha? ¿Y la atención?"
          />
          <small className="gp-contador">{comentario.length}/{MAX_COMENTARIO}</small>
        </label>

        {confirmaBorrar && <p className="gp-alerta gp-alerta--aviso" role="status">Se va a borrar tu reseña de {club.nombre}. Confirmalo con “Sí, eliminar”.</p>}
        {error && <p className="gp-alerta gp-alerta--error" role="alert">{error}</p>}
      </form>
    </Hoja>
  );
}
