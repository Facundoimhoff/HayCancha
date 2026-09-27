import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { usePagoPlan } from '../../../hooks/usePagoPlan';

const DIAS_ALERTA = 7;

/**
 * Cartel del panel según la suscripción del club:
 *  - prueba en curso: días que quedan (más llamativo cuando faltan pocos)
 *  - prueba vencida: el club no recibe reservas nuevas hasta suscribirse
 *  - al volver de Mercado Pago: resultado del pago
 * Con plan pago y sin novedades no muestra nada.
 * estado: resultado de estadoDeSuscripcion(); pago: 'ok' | 'error' | null (query ?pago= al volver de pagar).
 */
export default function AvisoSuscripcion({ estado, pago }) {
  const { iniciar, cargando, servidorLento, error } = usePagoPlan('Full');

  if (pago === 'ok' && estado?.tipo === 'pago') {
    return (
      <div className="dash-suscripcion dash-suscripcion--ok" role="status">
        <CheckCircle2 size={22} aria-hidden="true" />
        <div><strong>¡Listo! Tu suscripción está activa.</strong><p>Tu club sigue recibiendo reservas. Gracias por sumarte a GridPlay.</p></div>
      </div>
    );
  }
  if (pago === 'error' && estado?.tipo !== 'pago') {
    return (
      <div className="dash-suscripcion dash-suscripcion--vencida" role="alert">
        <AlertTriangle size={22} aria-hidden="true" />
        <div>
          <strong>Todavía no pudimos confirmar tu pago.</strong>
          <p>Si ya pagaste, esperá unos minutos y recargá la página. Si sigue igual, escribinos por WhatsApp y lo resolvemos.</p>
        </div>
      </div>
    );
  }
  if (!estado || (estado.tipo !== 'prueba' && estado.tipo !== 'vencida')) return null;

  const vencida = estado.tipo === 'vencida';
  const pocos = !vencida && estado.diasRestantes !== null && estado.diasRestantes <= DIAS_ALERTA;
  const clase = vencida ? 'dash-suscripcion--vencida' : pocos ? 'dash-suscripcion--pocos' : 'dash-suscripcion--info';
  const Icono = vencida ? AlertTriangle : Clock;

  return (
    <div className={`dash-suscripcion ${clase}`} role={vencida ? 'alert' : 'status'}>
      <Icono size={22} aria-hidden="true" />
      <div className="dash-suscripcion-texto">
        <strong>
          {vencida
            ? 'Tu prueba gratis terminó'
            : `Prueba gratis: te ${estado.diasRestantes === 1 ? 'queda 1 día' : `quedan ${estado.diasRestantes} días`}`}
        </strong>
        <p>
          {vencida
            ? 'Tu club no recibe reservas nuevas hasta que te suscribas. Tus datos y tus turnos siguen acá.'
            : 'Suscribite antes de que termine para que tu club siga recibiendo reservas sin interrupciones.'}
        </p>
        {cargando && servidorLento && <p>Estamos despertando el servidor, puede tardar unos segundos.</p>}
        {error && <p role="alert">{error}</p>}
      </div>
      <button type="button" className="dash-btn dash-btn--primario" onClick={iniciar} disabled={cargando}>
        {cargando ? 'Conectando…' : 'Suscribirme'}
      </button>
    </div>
  );
}
