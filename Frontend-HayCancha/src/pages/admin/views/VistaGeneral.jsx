import { useMemo, useState } from 'react';
import { Ban, Plus, DollarSign, CalendarCheck, Gauge, CalendarClock, Users, CheckCircle, Trash2, Inbox, MapPin } from 'lucide-react';
import { KpiCard, Panel, Chip, Vacio, Progreso, Segmentado, MenuAcciones } from '../components/ui.jsx';
import { moneda, etiquetaDia, pluralizar, desdeISO } from '../lib/formato.js';
import {
  rangoPeriodo, enRango, resumen, variacion, serieDiaria, ocupacionPorCancha, ocupacionGlobal,
  proximosTurnos, historialTurnos, reservadoFuturo,
} from '../lib/metricas.js';

const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const FilaTurno = ({ turno, hoy, club, historial, onDetalles, onCancelar }) => {
  const fecha = desdeISO(turno.fecha);
  const mensajeWhatsApp = `Hola! Te recordamos tu turno en ${club?.nombre} el día ${turno.fecha.split('-').reverse().join('/')} a las ${turno.hora_inicio}hs.`;

  const acciones = [
    !turno.esBloqueo && { icono: CheckCircle, texto: 'Enviar WhatsApp', href: `https://wa.me/${String(turno.telefono_cliente).replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWhatsApp)}` },
    { icono: Users, texto: 'Ver detalles', onClick: () => onDetalles(turno) },
    { icono: historial ? Trash2 : Ban, texto: turno.esBloqueo ? 'Liberar horario' : historial ? 'Eliminar registro' : 'Cancelar turno', onClick: () => onCancelar(turno), peligro: true },
  ];

  return (
    <li className={`dash-turno ${turno.esBloqueo ? 'dash-turno--bloqueo' : ''} ${historial ? 'dash-turno--pasado' : ''}`}>
      <div className="dash-turno-fecha" aria-label={etiquetaDia(turno.fecha, hoy)}>
        <span>{fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
        <strong>{fecha.getDate()}</strong>
      </div>
      <div className="dash-turno-info">
        <p className="dash-turno-nombre">
          {turno.esBloqueo ? <><Ban size={14} /> {turno.nombre_cliente.replace('Bloqueado:', 'Bloqueo por:')}</> : turno.nombre_cliente}
        </p>
        <p className="dash-turno-detalle">
          <span>{etiquetaDia(turno.fecha, hoy)} · {turno.hora_inicio} hs</span>
          <span className="dash-turno-cancha"><MapPin size={12} />{turno.nombre_cancha}</span>
        </p>
      </div>
      <div className="dash-turno-monto">
        {turno.esBloqueo ? <Chip tono="ambar">Bloqueo</Chip> : (
          <>
            <strong>{moneda(turno.total)}</strong>
            {turno.extrasTotal > 0 && <small>incl. {moneda(turno.extrasTotal)} de extras</small>}
          </>
        )}
      </div>
      <MenuAcciones items={acciones} etiqueta="Acciones del turno" />
    </li>
  );
};

/** Pantalla principal: indicadores del mes, próximos turnos / historial y ocupación por cancha. */
const VistaGeneral = ({ club, turnos, canchas, hoy, onNuevoTurno, onBloqueo, onDetalles, onCancelar }) => {
  const [pestana, setPestana] = useState('proximos');

  const datos = useMemo(() => {
    const periodo = rangoPeriodo('mes', hoy);
    const enMes = enRango(turnos, periodo.desde, periodo.hasta);
    const actual = resumen(enMes);
    const previo = resumen(enRango(turnos, periodo.desdePrev, periodo.hastaPrev));
    const diaria = serieDiaria(enMes, periodo.desde, periodo.hasta);
    const ocupacion = ocupacionPorCancha(enMes, canchas, periodo.desde, periodo.hasta);
    const futuros = proximosTurnos(turnos, hoy);
    return {
      periodo,
      actual,
      variacionIngresos: variacion(actual.ingresos, previo.ingresos),
      variacionTurnos: variacion(actual.turnos, previo.turnos),
      serieIngresos: diaria.map((d) => d.total),
      serieTurnos: diaria.map((d) => d.turnos),
      ocupacion,
      ocupacionTotal: ocupacionGlobal(ocupacion),
      futuros,
      futurosValidos: futuros.filter((t) => !t.esBloqueo).length,
      reservado: reservadoFuturo(turnos, hoy),
      historial: historialTurnos(turnos, hoy),
    };
  }, [turnos, canchas, hoy]);

  const lista = (pestana === 'proximos' ? datos.futuros : datos.historial).slice(0, 8);
  const fechaLarga = capitalizar(new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));

  return (
    <>
      <header className="dash-page-head">
        <div>
          <h1>Vista general</h1>
          <p>{fechaLarga} · resumen de {datos.periodo.etiqueta.toLowerCase()}</p>
        </div>
        <div className="dash-page-acciones">
          <button type="button" className="dash-btn dash-btn--secundario" onClick={onBloqueo}><Ban size={16} /> Bloquear horario</button>
          <button type="button" className="dash-btn dash-btn--primario" onClick={onNuevoTurno}><Plus size={16} /> Nuevo turno</button>
        </div>
      </header>

      <div className="dash-grid dash-grid--kpi">
        <KpiCard icono={DollarSign} tono="verde" etiqueta="Ingresos del mes" valor={moneda(datos.actual.ingresos)}
          variacion={datos.variacionIngresos} comparaCon={datos.periodo.comparaCon} serie={datos.serieIngresos} />
        <KpiCard icono={CalendarCheck} tono="azul" etiqueta="Turnos del mes" valor={datos.actual.turnos}
          variacion={datos.variacionTurnos} comparaCon={datos.periodo.comparaCon} serie={datos.serieTurnos} />
        <KpiCard icono={Gauge} tono="violeta" etiqueta="Ocupación" valor={`${datos.ocupacionTotal}%`} ayuda="de las horas disponibles este mes">
          <Progreso valor={datos.ocupacionTotal} tono="violeta" />
        </KpiCard>
        <KpiCard icono={CalendarClock} tono="ambar" etiqueta="Reservado a futuro" valor={moneda(datos.reservado)}
          ayuda={pluralizar(datos.futurosValidos, 'turno próximo', 'turnos próximos')} />
      </div>

      <div className="dash-grid dash-grid--principal">
        <Panel
          titulo="Turnos"
          descripcion={pestana === 'proximos' ? 'Lo que viene, ordenado por fecha' : 'Últimos turnos ya jugados'}
          acciones={<Segmentado etiqueta="Tipo de turnos" valor={pestana} onCambio={setPestana} opciones={[{ valor: 'proximos', texto: 'Próximos' }, { valor: 'historial', texto: 'Historial' }]} />}
          flush
        >
          {lista.length === 0 ? (
            <Vacio icono={Inbox} titulo={pestana === 'proximos' ? 'No hay turnos agendados' : 'Todavía no hay historial'}
              texto={pestana === 'proximos' ? 'Cuando alguien reserve o cargues un turno manual, va a aparecer acá.' : 'Los turnos pasados se van a listar acá.'}
              accion={pestana === 'proximos' && <button type="button" className="dash-btn dash-btn--primario" onClick={onNuevoTurno}><Plus size={16} /> Cargar turno</button>} />
          ) : (
            <ul className="dash-turnos">
              {lista.map((t) => (
                <FilaTurno key={t.id} turno={t} hoy={hoy} club={club} historial={pestana === 'historial'} onDetalles={onDetalles} onCancelar={onCancelar} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Ocupación por cancha" descripcion={`Horas reservadas de las disponibles · ${datos.periodo.etiqueta.toLowerCase()}`}>
          {datos.ocupacion.length === 0 ? (
            <Vacio titulo="Sin canchas cargadas" texto="Agregá tu primera cancha desde el menú Canchas." />
          ) : (
            <ul className="dash-ocupacion">
              {[...datos.ocupacion].sort((a, b) => b.porcentaje - a.porcentaje).map((c) => (
                <li key={c.id}>
                  <div className="dash-ocupacion-fila">
                    <span className="dash-ocupacion-nombre">{c.nombre}</span>
                    <strong>{c.porcentaje}%</strong>
                  </div>
                  <Progreso valor={c.porcentaje} tono={c.porcentaje >= 70 ? 'verde' : c.porcentaje >= 35 ? 'azul' : 'gris'} />
                  <div className="dash-ocupacion-pie">
                    <span>{pluralizar(c.ocupados, 'turno', 'turnos')}</span>
                    <span>{moneda(c.ingresos)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
};

export default VistaGeneral;
