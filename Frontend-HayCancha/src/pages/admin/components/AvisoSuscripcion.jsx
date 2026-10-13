import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { usePagoPlan } from '../../../hooks/usePagoPlan';
import { usePrecioPlan } from '../../../hooks/usePlanes';
import { moneda } from '../../../utils/reservas';
import { fechaLocalISO } from '../../../utils/validaciones';
import { fechaCorta } from '../lib/formato.js';

const DIAS_ALERTA = 7;

/**
 * Cartel del panel según la suscripción del club:
 *  - prueba en curso: días que quedan (más llamativo cuando faltan pocos)
 *  - sin suscripción vigente (prueba vencida, plan cancelado o pausado): el club no recibe reservas nuevas
 *  - baja pedida: hasta qué día sigue el plan (con el botón para volver cuando falta poco)
 *  - al volver de Mercado Pago: resultado del pago
 * Con plan pago y sin novedades no muestra nada.
 * estado: resultado de estadoDeSuscripcion(); pago: 'ok' | 'error' | null (query ?pago= al volver de pagar).
 */
export default function AvisoSuscripcion({ estado, pago }) {
  const { iniciar, cargando, servidorLento, error } = usePagoPlan('Full');
  const { precio } = usePrecioPlan('Full');

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
  const enBaja = estado?.tipo === 'pago' && Boolean(estado.finaliza);
  if (!estado || (estado.tipo !== 'prueba' && estado.tipo !== 'vencida' && !enBaja)) return null;

  const vencida = estado.tipo === 'vencida';
  const pocos = !vencida && estado.diasRestantes !== null && estado.diasRestantes <= DIAS_ALERTA;
  const clase = vencida ? 'dash-suscripcion--vencida' : pocos ? 'dash-suscripcion--pocos' : 'dash-suscripcion--info';
  const Icono = vencida ? AlertTriangle : Clock;
  const porMes = precio ? ` por ${moneda(precio)}/mes` : '';

  let titulo;
  let texto;
  if (enBaja) {
    titulo = `Diste de baja tu plan: sigue activo hasta el ${fechaCorta(fechaLocalISO(new Date(estado.finaliza)))}`;
    texto = 'Después de esa fecha tu club deja de recibir reservas nuevas. Tus datos y tus turnos quedan guardados.';
  } else if (vencida) {
    titulo = estado.motivo === 'plan' ? 'Tu suscripción no está activa' : 'Tu prueba gratis terminó';
    texto = `Tu club no recibe reservas nuevas hasta que te suscribas${porMes}. Tus datos y tus turnos siguen acá.`;
  } else {
    titulo = `Prueba gratis: te ${estado.diasRestantes === 1 ? 'queda 1 día' : `quedan ${estado.diasRestantes} días`}`;
    texto = `Suscribite${porMes} antes de que termine para que tu club siga recibiendo reservas sin interrupciones.`;
  }
  // Con la baja pedida y varios días por delante no se ofrece pagar de nuevo: se superpondría con lo ya pago.
  const ofrecePago = !enBaja || pocos;

  return (
    <div className={`dash-suscripcion ${clase}`} role={vencida ? 'alert' : 'status'}>
      <Icono size={22} aria-hidden="true" />
      <div className="dash-suscripcion-texto">
        <strong>{titulo}</strong>
        <p>{texto}</p>
        {cargando && servidorLento && <p>Estamos despertando el servidor, puede tardar unos segundos.</p>}
        {error && <p role="alert">{error}</p>}
      </div>
      {ofrecePago && (
        <button type="button" className="dash-btn dash-btn--primario" onClick={iniciar} disabled={cargando}>
          {cargando ? 'Conectando…' : enBaja ? 'Volver a suscribirme' : 'Suscribirme'}
        </button>
      )}
    </div>
  );
}
