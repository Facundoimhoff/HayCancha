import { useState } from 'react';
import { CreditCard, CheckCircle2, CircleSlash } from 'lucide-react';
import { Panel, Chip } from '../components/ui.jsx';
import { ModalConfirmar } from '../modals/modales.jsx';
import { moneda, fechaCorta } from '../lib/formato.js';
import { usePagoPlan } from '../../../hooks/usePagoPlan';
import { usePrecioPlan } from '../../../hooks/usePlanes';
import { cancelarSuscripcion } from '../../../services/suscripcion';
import { fechaLocalISO } from '../../../utils/validaciones';
import { DIAS_PRUEBA } from '../../../utils/suscripcion';

const INCLUYE = [
  'Canchas y reservas ilimitadas',
  'Panel con turnos, clientes y reportes',
  'Kiosco y extras en cada reserva',
  'Tu club en el buscador y en el mapa de GridPlay',
  'Soporte por WhatsApp',
];

const fecha = (iso) => fechaCorta(fechaLocalISO(new Date(iso)));
const PLANES_SIN_COBRO = ['prueba', 'legado'];

/**
 * Mi plan: estado de la suscripción del club, alta del plan pago y baja.
 * estado: resultado de estadoDeSuscripcion(); filas: las suscripciones de la cuenta; onCambio: vuelve a leerlas.
 */
const MiPlan = ({ estado, filas, onCambio }) => {
  const { iniciar, cargando, servidorLento, error: errorPago } = usePagoPlan('Full');
  const { precio } = usePrecioPlan('Full');
  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const [bajaHecha, setBajaHecha] = useState('');

  if (!estado) return <div className="dash-mensaje">Cargando tu plan…</div>;

  const activa = filas.find((f) => f.estado === 'activa' && !PLANES_SIN_COBRO.includes(f.plan));
  const cortesia = estado.tipo === 'pago' && !estado.finaliza && !activa;
  const enBaja = estado.tipo === 'pago' && Boolean(estado.finaliza);
  const porMes = precio ? `${moneda(precio)} por mes` : 'un pago mensual';

  let chip;
  let titulo;
  let texto;
  if (enBaja) {
    chip = <Chip tono="ambar">Baja pedida</Chip>;
    titulo = `Tu plan sigue activo hasta el ${fecha(estado.finaliza)}`;
    texto = 'Ya no se te va a cobrar. Después de esa fecha tu club deja de recibir reservas nuevas; tus datos y tus turnos quedan guardados.';
  } else if (cortesia) {
    chip = <Chip tono="verde">Activo</Chip>;
    titulo = 'Plan de cortesía';
    texto = 'Tu club tiene GridPlay sin cargo. No hay nada que pagar ni que dar de baja.';
  } else if (estado.tipo === 'pago') {
    chip = <Chip tono="verde">Activo</Chip>;
    titulo = 'Plan Full';
    texto = `Se cobra ${moneda(activa.monto ?? precio ?? 0)} por mes con Mercado Pago${activa.created_at ? `, desde el ${fecha(activa.created_at)}` : ''}.`;
  } else if (estado.tipo === 'prueba') {
    chip = <Chip tono="azul">Prueba gratis</Chip>;
    titulo = estado.diasRestantes === null
      ? `Prueba gratis de ${DIAS_PRUEBA} días`
      : `Te ${estado.diasRestantes === 1 ? 'queda 1 día' : `quedan ${estado.diasRestantes} días`} de prueba gratis`;
    texto = `Cuando termine, tu club deja de recibir reservas nuevas hasta que te suscribas. El plan Full sale ${porMes}.`;
  } else if (estado.tipo === 'vencida') {
    chip = <Chip tono="rojo">Sin plan activo</Chip>;
    titulo = estado.motivo === 'plan' ? 'Tu suscripción no está activa' : 'Tu prueba gratis terminó';
    texto = `Tu club no recibe reservas nuevas. Suscribite por ${porMes} y vuelve a recibirlas en el momento; tus datos y tus turnos siguen acá.`;
  } else {
    chip = <Chip tono="neutro">Sin plan</Chip>;
    titulo = 'Todavía no tenés un plan';
    texto = `El plan Full sale ${porMes}.`;
  }

  // Con la baja pedida no se ofrece pagar de nuevo hasta la última semana: se superpondría con lo ya pago.
  const ofrecePago = !cortesia && (estado.tipo !== 'pago' || (enBaja && estado.diasRestantes <= 7));

  const darDeBaja = async () => {
    const vence = await cancelarSuscripcion();
    await onCambio();
    setConfirmarBaja(false);
    setBajaHecha(vence ? `Listo: diste de baja tu plan. Sigue activo hasta el ${fecha(vence)}.` : 'Listo: diste de baja tu plan.');
  };

  return (
    <>
      <header className="dash-page-head">
        <div>
          <h1>Mi plan</h1>
          <p>Tu suscripción a GridPlay</p>
        </div>
      </header>

      <div className="dash-grid dash-grid--dos-desigual">
        <Panel titulo="Estado de tu plan" acciones={chip}>
          <div className="dash-plan">
            <span className="dash-plan-icono"><CreditCard size={22} aria-hidden="true" /></span>
            <div>
              <strong>{titulo}</strong>
              <p>{texto}</p>
            </div>
          </div>

          {bajaHecha && <p className="dash-aviso-ok" role="status">{bajaHecha}</p>}
          {cargando && servidorLento && <p className="dash-plan-nota">Estamos despertando el servidor, puede tardar unos segundos.</p>}
          {errorPago && <p className="dash-error" role="alert">{errorPago}</p>}

          {(ofrecePago || activa) && (
            <div className="dash-plan-acciones">
              {ofrecePago && (
                <button type="button" className="dash-btn dash-btn--primario" onClick={iniciar} disabled={cargando}>
                  {cargando ? 'Conectando con Mercado Pago…' : enBaja ? 'Volver a suscribirme' : `Suscribirme${precio ? ` por ${moneda(precio)}/mes` : ''}`}
                </button>
              )}
              {activa && (
                <button type="button" className="dash-btn dash-btn--peligro-suave" onClick={() => { setBajaHecha(''); setConfirmarBaja(true); }}>
                  <CircleSlash size={15} /> Dar de baja
                </button>
              )}
            </div>
          )}

          {!cortesia && (
            <p className="dash-plan-nota">
              Podés darte de baja cuando quieras, desde acá y sin llamar a nadie. Seguís usando GridPlay hasta el final del período que ya pagaste y no se te vuelve a cobrar.
            </p>
          )}
        </Panel>

        <Panel titulo="Qué incluye" descripcion="Plan Full">
          <ul className="dash-plan-incluye">
            {INCLUYE.map((item) => <li key={item}><CheckCircle2 size={16} aria-hidden="true" /> {item}</li>)}
          </ul>
        </Panel>
      </div>

      {confirmarBaja && (
        <ModalConfirmar
          titulo="Dar de baja el plan"
          texto="Mercado Pago deja de cobrarte. Tu club sigue recibiendo reservas hasta el final del período que ya pagaste; después deja de recibir reservas nuevas. Tus datos quedan guardados y podés volver a suscribirte cuando quieras."
          textoBoton="Sí, dar de baja"
          onConfirmar={darDeBaja}
          onCerrar={() => setConfirmarBaja(false)}
        />
      )}
    </>
  );
};

export default MiPlan;
