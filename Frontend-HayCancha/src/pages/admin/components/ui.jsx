import { useEffect, useRef, useState } from 'react';
import { MoreVertical, X, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/** Contenedor de sección con encabezado (título, descripción, acciones). */
export const Panel = ({ titulo, descripcion, acciones, className = '', flush = false, children }) => (
  <section className={`dash-panel ${className}`}>
    {(titulo || acciones) && (
      <header className="dash-panel-head">
        <div>
          {titulo && <h3 className="dash-panel-titulo">{titulo}</h3>}
          {descripcion && <p className="dash-panel-desc">{descripcion}</p>}
        </div>
        {acciones && <div className="dash-panel-acciones">{acciones}</div>}
      </header>
    )}
    <div className={flush ? 'dash-panel-body dash-panel-body--flush' : 'dash-panel-body'}>{children}</div>
  </section>
);

export const Chip = ({ tono = 'neutro', children, className = '' }) => (
  <span className={`dash-chip dash-chip--${tono} ${className}`}>{children}</span>
);

/** Indicador de cambio contra el período anterior: ▲ 12% / ▼ 8% / = / nuevo. */
export const Variacion = ({ variacion, comparaCon }) => {
  if (!variacion) return null;
  const { pct, direccion } = variacion;
  const Icono = direccion === 'sube' ? ArrowUpRight : direccion === 'baja' ? ArrowDownRight : Minus;
  const texto = direccion === 'nuevo' ? 'Nuevo' : direccion === 'igual' ? 'Sin cambios' : `${Math.abs(pct)}%`;
  return (
    <span className="dash-variacion" title={comparaCon ? `Comparado con ${comparaCon}` : undefined}>
      <span className={`dash-delta dash-delta--${direccion}`}><Icono size={14} strokeWidth={2.5} />{texto}</span>
      {comparaCon && <span className="dash-variacion-ref">vs {comparaCon}</span>}
    </span>
  );
};

/** Minigráfico sin ejes para las tarjetas de indicadores. */
export const Sparkline = ({ datos, color = 'var(--color-brand-500)' }) => {
  if (!datos || datos.length < 2) return null;
  const id = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div className="dash-spark" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos.map((v) => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const COLORES_SPARK = { verde: '#16a34a', azul: '#2563eb', ambar: '#d97706', violeta: '#7c3aed' };

/** Tarjeta de indicador: ícono, etiqueta, valor grande, variación y minigráfico. */
export const KpiCard = ({ icono: Icono, tono = 'verde', etiqueta, valor, ayuda, variacion, comparaCon, serie, children }) => (
  <article className={`dash-kpi dash-kpi--${tono} ${serie?.length > 1 ? 'dash-kpi--spark' : ''}`}>
    <div className="dash-kpi-top">
      <span className="dash-kpi-icono"><Icono size={18} strokeWidth={2.2} /></span>
      <span className="dash-kpi-etiqueta">{etiqueta}</span>
    </div>
    <div className="dash-kpi-valor">{valor}</div>
    <div className="dash-kpi-pie">
      {variacion ? <Variacion variacion={variacion} comparaCon={comparaCon} /> : <span className="dash-kpi-ayuda">{ayuda}</span>}
    </div>
    {children}
    <Sparkline datos={serie} color={COLORES_SPARK[tono]} />
  </article>
);

export const Vacio = ({ icono: Icono, titulo, texto, accion }) => (
  <div className="dash-vacio">
    {Icono && <span className="dash-vacio-icono"><Icono size={22} /></span>}
    <strong>{titulo}</strong>
    {texto && <p>{texto}</p>}
    {accion}
  </div>
);

/** Barra de progreso (ocupación). */
export const Progreso = ({ valor, tono }) => (
  <div className="dash-progreso" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
    <span className={`dash-progreso-barra ${tono ? `dash-progreso-barra--${tono}` : ''}`} style={{ width: `${Math.max(2, valor)}%` }} />
  </div>
);

/** Control segmentado (Hoy / Semana / Mes…). */
export const Segmentado = ({ opciones, valor, onCambio, etiqueta }) => (
  <div className="dash-segmentado" role="tablist" aria-label={etiqueta}>
    {opciones.map((o) => (
      <button
        key={o.valor}
        type="button"
        role="tab"
        aria-selected={valor === o.valor}
        className={valor === o.valor ? 'activo' : ''}
        onClick={() => onCambio(o.valor)}
      >
        {o.texto}
      </button>
    ))}
  </div>
);

/** Ventana emergente con cierre por Escape y por clic en el fondo. */
export const Modal = ({ titulo, icono: Icono, tono, descripcion, onCerrar, children, ancho = 'md' }) => {
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  return (
    <div className="dash-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className={`dash-modal dash-modal--${ancho}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="dash-modal-head">
          <div className="dash-modal-titulo">
            {Icono && <span className={`dash-modal-icono dash-modal-icono--${tono || 'verde'}`}><Icono size={18} /></span>}
            <div>
              <h3>{titulo}</h3>
              {descripcion && <p>{descripcion}</p>}
            </div>
          </div>
          <button type="button" className="dash-icon-btn" onClick={onCerrar} aria-label="Cerrar"><X size={18} /></button>
        </header>
        {children}
      </div>
    </div>
  );
};

export const ModalCuerpo = ({ children }) => <div className="dash-modal-body">{children}</div>;
export const ModalPie = ({ children }) => <footer className="dash-modal-pie">{children}</footer>;

export const Campo = ({ etiqueta, ayuda, children, className = '' }) => (
  <label className={`dash-campo ${className}`}>
    <span className="dash-campo-etiqueta">{etiqueta}</span>
    {children}
    {ayuda && <span className="dash-campo-ayuda">{ayuda}</span>}
  </label>
);

/** Menú de tres puntos con acciones. items: [{ icono, texto, onClick?, href?, peligro? }] */
export const MenuAcciones = ({ items, etiqueta = 'Acciones' }) => {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrar = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false); };
    const alTeclear = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', alTeclear);
    return () => { document.removeEventListener('mousedown', cerrar); document.removeEventListener('keydown', alTeclear); };
  }, [abierto]);

  return (
    <div className="dash-menu" ref={ref}>
      <button type="button" className="dash-icon-btn" aria-haspopup="menu" aria-expanded={abierto} aria-label={etiqueta} onClick={() => setAbierto((v) => !v)}>
        <MoreVertical size={18} />
      </button>
      {abierto && (
        <div className="dash-menu-lista" role="menu">
          {items.filter(Boolean).map((item) => {
            const contenido = <><item.icono size={16} />{item.texto}</>;
            const clase = `dash-menu-item ${item.peligro ? 'dash-menu-item--peligro' : ''}`;
            return item.href ? (
              <a key={item.texto} role="menuitem" className={clase} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => setAbierto(false)}>{contenido}</a>
            ) : (
              <button key={item.texto} type="button" role="menuitem" className={clase} onClick={() => { setAbierto(false); item.onClick(); }}>{contenido}</button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Tooltip de los gráficos (vidrio). formato: función para los valores. */
export const TooltipGrafico = ({ active, payload, label, formato = (v) => v, total = false }) => {
  if (!active || !payload?.length) return null;
  const suma = payload.reduce((a, p) => a + (Number(p.value) || 0), 0);
  return (
    <div className="dash-tooltip">
      {label !== undefined && <div className="dash-tooltip-titulo">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="dash-tooltip-fila">
          <span className="dash-tooltip-punto" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}</span>
          <strong>{formato(p.value)}</strong>
        </div>
      ))}
      {total && payload.length > 1 && (
        <div className="dash-tooltip-fila dash-tooltip-total"><span>Total</span><strong>{formato(suma)}</strong></div>
      )}
    </div>
  );
};
