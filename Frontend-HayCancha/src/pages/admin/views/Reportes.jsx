import { useMemo, useState } from 'react';
import { FileText, Download, Receipt, Ticket, CalendarCheck, Gauge, LineChart } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { KpiCard, Panel, Segmentado, Vacio, Chip, TooltipGrafico } from '../components/ui.jsx';
import { moneda, monedaCompacta, pluralizar, iniciales } from '../lib/formato.js';
import {
  rangoPeriodo, enRango, resumen, variacion, serieDiaria, ocupacionPorCancha, ocupacionGlobal, mapaCalor, clientesDe,
} from '../lib/metricas.js';

const PERIODOS = [
  { valor: 'hoy', texto: 'Hoy' },
  { valor: 'semana', texto: 'Semana' },
  { valor: 'mes', texto: 'Mes' },
  { valor: '30d', texto: '30 días' },
];

// Paleta de categorías (canchas): el verde de marca primero, después colores bien distinguibles
const CATEGORIAS = ['#16a34a', '#2563eb', '#f59e0b', '#7c3aed', '#db2777', '#0d9488'];
const COLOR_CANCHAS = '#16a34a';
const COLOR_KIOSCO = '#f59e0b';
const EJE = { fill: 'var(--color-slate-500)', fontSize: 12 };
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const MapaCalor = ({ turnos }) => {
  const { matriz, max, horaMin, horaMax } = useMemo(() => mapaCalor(turnos), [turnos]);
  const horas = Array.from({ length: horaMax - horaMin + 1 }, (_, i) => horaMin + i);

  return (
    <div className="dash-calor" style={{ '--columnas': horas.length }}>
      <div className="dash-calor-fila dash-calor-fila--cabecera">
        <span />
        {horas.map((h) => <span key={h} className="dash-calor-hora">{h}</span>)}
      </div>
      {matriz.map((fila, dia) => (
        <div key={dia} className="dash-calor-fila">
          <span className="dash-calor-dia">{DIAS_CORTOS[dia]}</span>
          {horas.map((h) => {
            const n = fila[h];
            return (
              <span
                key={h}
                className={`dash-calor-celda ${n ? 'con-datos' : ''}`}
                style={{ '--i': max ? n / max : 0 }}
                title={`${DIAS_LARGOS[dia]} ${h}:00 hs — ${pluralizar(n, 'turno', 'turnos')}`}
              />
            );
          })}
        </div>
      ))}
      <div className="dash-calor-leyenda"><span>Menos</span><i /><span>Más pedidos</span></div>
    </div>
  );
};

/** Reportes financieros: indicadores comparados, evolución diaria, ranking por cancha, mapa de horarios y clientes. */
const Reportes = ({ turnos, canchas, hoy, onExportarPDF, onExportarExcel }) => {
  const [clave, setClave] = useState('mes');

  const d = useMemo(() => {
    const periodo = rangoPeriodo(clave, hoy);
    const actuales = enRango(turnos, periodo.desde, periodo.hasta);
    const previos = enRango(turnos, periodo.desdePrev, periodo.hastaPrev);
    const actual = resumen(actuales);
    const previo = resumen(previos);
    const diaria = serieDiaria(actuales, periodo.desde, periodo.hasta);
    const porCancha = ocupacionPorCancha(actuales, canchas, periodo.desde, periodo.hasta);
    return {
      periodo,
      actuales,
      actual,
      diaria,
      porCancha,
      ocupacion: ocupacionGlobal(porCancha),
      ranking: [...porCancha].sort((a, b) => b.ingresos - a.ingresos),
      clientes: clientesDe(actuales).slice(0, 5),
      vIngresos: variacion(actual.ingresos, previo.ingresos),
      vTurnos: variacion(actual.turnos, previo.turnos),
      vTicket: variacion(actual.ticket, previo.ticket),
      serieIngresos: diaria.map((x) => x.total),
      serieTurnos: diaria.map((x) => x.turnos),
    };
  }, [clave, turnos, canchas, hoy]);

  const sinDatos = d.actual.turnos === 0;
  const pctKiosco = d.actual.ingresos ? Math.round((d.actual.kiosco / d.actual.ingresos) * 100) : 0;
  const distribucion = d.porCancha.filter((c) => c.ocupados > 0);
  const totalTurnos = distribucion.reduce((a, c) => a + c.ocupados, 0);

  return (
    <>
      <header className="dash-page-head">
        <div>
          <h1>Reportes financieros</h1>
          <p>Ingresos, rendimiento y demanda · {d.periodo.etiqueta.toLowerCase()}</p>
        </div>
        <div className="dash-page-acciones">
          <Segmentado etiqueta="Período" opciones={PERIODOS} valor={clave} onCambio={setClave} />
          <button type="button" className="dash-btn dash-btn--secundario" onClick={onExportarPDF}><FileText size={16} /> PDF</button>
          <button type="button" className="dash-btn dash-btn--secundario" onClick={onExportarExcel}><Download size={16} /> Excel</button>
        </div>
      </header>

      <div className="dash-grid dash-grid--kpi">
        <KpiCard icono={Receipt} tono="verde" etiqueta="Ingresos totales" valor={moneda(d.actual.ingresos)}
          variacion={d.vIngresos} comparaCon={d.periodo.comparaCon} serie={d.serieIngresos} />
        <KpiCard icono={CalendarCheck} tono="azul" etiqueta="Turnos" valor={d.actual.turnos}
          variacion={d.vTurnos} comparaCon={d.periodo.comparaCon} serie={d.serieTurnos} />
        <KpiCard icono={Ticket} tono="ambar" etiqueta="Ticket promedio" valor={moneda(d.actual.ticket)}
          variacion={d.vTicket} comparaCon={d.periodo.comparaCon} />
        <KpiCard icono={Gauge} tono="violeta" etiqueta="Ocupación" valor={`${d.ocupacion}%`} ayuda="de las horas disponibles" />
      </div>

      <Panel
        titulo="Evolución de ingresos"
        descripcion="Facturación por día, separada entre alquiler de canchas y kiosco"
        acciones={
          <div className="dash-leyenda">
            <span><i style={{ background: COLOR_CANCHAS }} />Canchas <strong>{moneda(d.actual.canchas)}</strong></span>
            <span><i style={{ background: COLOR_KIOSCO }} />Kiosco <strong>{moneda(d.actual.kiosco)}</strong>{d.actual.kiosco > 0 && <Chip tono="neutro">{pctKiosco}%</Chip>}</span>
          </div>
        }
      >
        {sinDatos ? (
          <Vacio icono={LineChart} titulo="Sin movimientos en este período" texto="Probá con otro período para ver la evolución." />
        ) : (
          <div className="dash-grafico" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.diaria} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCanchas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_CANCHAS} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={COLOR_CANCHAS} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gKiosco" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR_KIOSCO} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={COLOR_KIOSCO} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="var(--color-slate-200)" />
                <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={EJE} minTickGap={28} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} tick={EJE} width={52} tickFormatter={monedaCompacta} />
                <Tooltip content={<TooltipGrafico formato={moneda} total />} cursor={{ stroke: 'var(--color-slate-300)', strokeDasharray: '4 4' }} />
                <Area type="monotone" stackId="1" name="Canchas" dataKey="canchas" stroke={COLOR_CANCHAS} strokeWidth={2.5} fill="url(#gCanchas)" />
                <Area type="monotone" stackId="1" name="Kiosco" dataKey="kiosco" stroke={COLOR_KIOSCO} strokeWidth={2.5} fill="url(#gKiosco)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="dash-grid dash-grid--dos">
        <Panel titulo="Ingresos por cancha" descripcion="Cuánto factura cada cancha en el período">
          {sinDatos ? (
            <Vacio titulo="Sin datos" texto="No hay turnos en este período." />
          ) : (
            <div className="dash-grafico" style={{ height: Math.max(180, d.ranking.length * 52) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.ranking} layout="vertical" margin={{ top: 4, right: 64, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 4" stroke="var(--color-slate-200)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nombre" axisLine={false} tickLine={false} width={158} tick={{ ...EJE, fill: 'var(--color-slate-700)' }} />
                  <Tooltip content={<TooltipGrafico formato={moneda} />} cursor={{ fill: 'var(--color-slate-100)' }} />
                  <Bar dataKey="ingresos" name="Ingresos" radius={[0, 8, 8, 0]} barSize={20}>
                    {d.ranking.map((c, i) => <Cell key={c.id} fill={CATEGORIAS[i % CATEGORIAS.length]} />)}
                    <LabelList dataKey="ingresos" position="right" formatter={monedaCompacta} className="dash-etiqueta-barra" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel titulo="Distribución de turnos" descripcion="Qué cancha se reserva más">
          {totalTurnos === 0 ? (
            <Vacio titulo="Sin datos" texto="No hay turnos en este período." />
          ) : (
            <div className="dash-dona">
              <div className="dash-dona-grafico">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribucion} dataKey="ocupados" nameKey="nombre" innerRadius="66%" outerRadius="94%" paddingAngle={3} cornerRadius={5} stroke="none">
                      {distribucion.map((c) => <Cell key={c.id} fill={CATEGORIAS[d.ranking.findIndex((r) => r.id === c.id) % CATEGORIAS.length]} />)}
                    </Pie>
                    <Tooltip content={<TooltipGrafico formato={(v) => pluralizar(v, 'turno', 'turnos')} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-dona-centro"><strong>{totalTurnos}</strong><span>turnos</span></div>
              </div>
              <ul className="dash-dona-leyenda">
                {[...distribucion].sort((a, b) => b.ocupados - a.ocupados).map((c) => (
                  <li key={c.id}>
                    <i style={{ background: CATEGORIAS[d.ranking.findIndex((r) => r.id === c.id) % CATEGORIAS.length] }} />
                    <span>{c.nombre}</span>
                    <strong>{Math.round((c.ocupados / totalTurnos) * 100)}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      <div className="dash-grid dash-grid--dos-desigual">
        <Panel titulo="Horarios más pedidos" descripcion="Cantidad de turnos por día y hora: útil para ajustar precios y promociones">
          {sinDatos ? <Vacio titulo="Sin datos" texto="No hay turnos en este período." /> : <MapaCalor turnos={d.actuales} />}
        </Panel>

        <Panel titulo="Mejores clientes" descripcion="Los que más gastaron en el período" flush>
          {d.clientes.length === 0 ? (
            <Vacio titulo="Sin datos" texto="No hay clientes en este período." />
          ) : (
            <ul className="dash-ranking">
              {d.clientes.map((c, i) => (
                <li key={c.telefono}>
                  <span className="dash-avatar">{iniciales(c.nombre)}</span>
                  <div>
                    <strong>{c.nombre}</strong>
                    <small>{pluralizar(c.turnos, 'turno', 'turnos')}</small>
                  </div>
                  <span className="dash-ranking-monto">{moneda(c.gastado)}</span>
                  {i === 0 && <Chip tono="verde">Top 1</Chip>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
};

export default Reportes;
