import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, CalendarDays, ShieldCheck, CreditCard, 
  Store, PieChart, TrendingUp, Smartphone, CheckCircle2, 
  Lock, ChevronRight, Zap
} from 'lucide-react';
import './Funcionalidades.css';

export default function Funcionalidades() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="func-premium-wrapper">
      
      {/* FONDO PATTERN PUNTOS */}
      <div className="bg-dotted-pattern"></div>

      {/* HEADER ELEGANTE */}
      {/* HEADER ELEGANTE Y CENTRADO PERFECTO */}
      <header className="func-navbar glass-nav">
        <div className="func-container navbar-inner">
          
          <div className="nav-side left">
            <button onClick={() => navigate(-1)} className="btn-back-clean">
              <ArrowLeft size={18} />
              <span>Volver</span>
            </button>
          </div>
          
          <div className="nav-center">
            <div className="brand-logo" onClick={() => navigate('/')}>
              GridPlay<span className="brand-dot">.</span>
            </div>
          </div>

          <div className="nav-side right">
            <button onClick={() => navigate('/planes')} className="btn-header-cta">
              Ver Planes
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="func-hero-section animate-fade-up">
        <div className="func-container text-center">
          <div className="badge-glow">
            <Zap size={14} className="text-emerald" />
            <span>El software líder para complejos deportivos</span>
          </div>
          <h1 className="hero-main-title">
            Digitalizá tu club y <br />
            <span className="text-gradient">multiplicá tus ingresos</span>
          </h1>
          <p className="hero-sub-text">
            Automatizá tus reservas, exigí señas online, controlá tu kiosco y analizá tus métricas en la plataforma más moderna y fácil de usar del mercado.
          </p>
        </div>
      </section>

      {/* FEATURE 1: AGENDA */}
      <section className="feature-block-section animate-fade-up delay-1">
        <div className="func-container feature-row">
          <div className="feature-content-col">
            <div className="section-tag tag-emerald">
              <CalendarDays size={14} />
              <span>GRILLA INTELIGENTE 24/7</span>
            </div>
            <h2 className="feature-heading">Reservas automáticas y sin superposiciones</h2>
            <p className="feature-description">
              Tus clientes reservan directamente desde su celular. La grilla se actualiza en tiempo real para todos tus empleados, evitando los clásicos errores del cuaderno de papel.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-emerald" />
                <span><strong>Bloqueos rápidos:</strong> Frená alquileres por lluvia o mantenimiento con un toque.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-emerald" />
                <span><strong>Estados visuales:</strong> Distinguí turnos fijos, torneos, señados y pendientes por color.</span>
              </div>
            </div>
          </div>

          <div className="feature-mockup-col">
            <div className="mockup-glow glow-emerald"></div>
            <div className="glass-card mockup-calendar-frame">
              <div className="mockup-top-bar">
                <div className="window-dots"><span></span><span></span><span></span></div>
                <div className="window-title">Viernes • Turnos de la Tarde</div>
                <span className="live-status pulse-anim">EN VIVO</span>
              </div>
              <div className="calendar-grid-ui">
                <div className="time-column">
                  <span>19:00</span><span>20:00</span><span>21:00</span><span>22:00</span>
                </div>
                <div className="courts-columns">
                  <div className="court-slot-column">
                    <div className="court-name-header">Cancha 1</div>
                    <div className="booking-card slot-1 bg-green-accent">
                      <div className="b-header"><strong>Matías R.</strong><span className="b-badge">CONFIRMADO</span></div>
                      <span className="b-time">19:00 - 20:30 hs</span>
                    </div>
                  </div>
                  <div className="court-slot-column">
                    <div className="court-name-header">Cancha 2</div>
                    <div className="booking-card slot-2 bg-purple-accent">
                      <div className="b-header"><strong>Torneo Padel</strong><span className="b-badge">FIJO</span></div>
                      <span className="b-time">20:00 - 22:00 hs</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="floating-chip float-top-right">
                <Smartphone size={16} className="text-emerald" />
                <span>100% Responsivo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2: PAGOS */}
      <section className="feature-block-section bg-surface-alt animate-fade-up delay-2">
        <div className="func-container feature-row reversed">
          <div className="feature-content-col">
            <div className="section-tag tag-blue">
              <ShieldCheck size={14} />
              <span>CHAU PLANTINES</span>
            </div>
            <h2 className="feature-heading">Asegurá tu dinero con cobros y señas online</h2>
            <p className="feature-description">
              Integrá Mercado Pago de forma transparente. Exigí un porcentaje de seña para confirmar el turno y definí tus propias políticas de cancelación.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-blue" />
                <span><strong>Directo a tu cuenta:</strong> El dinero no pasa por nosotros, va directo a tu banco.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-blue" />
                <span><strong>Cero comisiones:</strong> GridPlay no te cobra comisión extra por reserva.</span>
              </div>
            </div>
          </div>

          <div className="feature-mockup-col">
            <div className="mockup-glow glow-blue"></div>
            <div className="glass-card mockup-checkout-frame">
              <div className="checkout-top">
                <div className="lock-icon-box bg-blue-subtle">
                  <Lock size={20} className="text-blue" />
                </div>
                <div>
                  <h4>Checkout Seguro</h4>
                  <p>Reserva Cancha 1 • 20:00 hs</p>
                </div>
              </div>
              <div className="checkout-breakdown">
                <div className="breakdown-row highlight-seña blue-border">
                  <span>Seña requerida (50%)</span>
                  <strong className="text-blue">$15.000</strong>
                </div>
                <div className="payment-options-grid">
                  <div className="pay-option active blue-active">
                    <span className="pay-radio checked"></span><span>Mercado Pago</span>
                  </div>
                  <div className="pay-option">
                    <span className="pay-radio"></span><span>Transferencia</span>
                  </div>
                </div>
              </div>
              <button className="btn-mockup-pay bg-blue-grad">
                <span>Confirmar y Abonar</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 3: KIOSCO */}
      <section className="feature-block-section animate-fade-up delay-3">
        <div className="func-container feature-row">
          <div className="feature-content-col">
            <div className="section-tag tag-amber">
              <Store size={14} />
              <span>CONTROL TOTAL DE CAJA</span>
            </div>
            <h2 className="feature-heading">Punto de Venta Integrado (Kiosco)</h2>
            <p className="feature-description">
              No uses sistemas separados. Vendé bebidas, snacks y alquilá paletas cargándolos directamente a la cuenta del turno que está jugando.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-amber" />
                <span><strong>Ticket unificado:</strong> Cobrá el saldo de la cancha + los consumos en un solo paso.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-amber" />
                <span><strong>Cierres de caja precisos:</strong> Separación automática de ingresos de canchas y de buffet.</span>
              </div>
            </div>
          </div>

          <div className="feature-mockup-col">
            <div className="mockup-glow glow-amber"></div>
            <div className="glass-card mockup-pos-frame">
              <div className="pos-header">
                <div>
                  <span className="table-tag text-amber">EN JUEGO • CANCHA 2</span>
                  <h3>Ticket #4092</h3>
                </div>
              </div>
              <div className="pos-items-table font-mono">
                <div className="pos-row dashed-bottom">
                  <span>2x Powerade Blue</span><span>$5.000</span>
                </div>
                <div className="pos-row dashed-bottom">
                  <span>1x Alquiler Pelotas</span><span>$3.500</span>
                </div>
                <div className="pos-row dashed-bottom">
                  <span>Saldo Cancha</span><span>$10.000</span>
                </div>
              </div>
              <div className="pos-total-summary bg-amber-subtle">
                <span className="text-amber-dark">TOTAL A COBRAR</span>
                <strong className="text-amber-dark">$18.500</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 4: ESTADISTICAS */}
      <section className="feature-block-section bg-surface-alt animate-fade-up delay-4">
        <div className="func-container feature-row reversed">
          <div className="feature-content-col">
            <div className="section-tag tag-purple">
              <TrendingUp size={14} />
              <span>MÉTRICAS CLAVE</span>
            </div>
            <h2 className="feature-heading">Estadísticas que impulsan tu crecimiento</h2>
            <p className="feature-description">
              Entendé tu negocio con gráficos claros y precisos. Descubrí patrones de consumo, horarios más rentables y proyectá tus ganancias futuras.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-purple" />
                <span><strong>Ocupación por hora:</strong> Optimizá tus tarifas promocionando los horarios muertos.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-purple" />
                <span><strong>Exportación contable:</strong> Generá reportes en Excel de todos tus movimientos financieros.</span>
              </div>
            </div>
          </div>

          <div className="feature-mockup-col">
            <div className="mockup-glow glow-purple"></div>
            <div className="glass-card mockup-stats-frame">
              <div className="stats-top-header">
                <div>
                  <span className="stats-mini-label">INGRESOS DE ESTE MES</span>
                  <h3>$2.450.000</h3>
                </div>
                <div className="stats-trend-badge text-emerald bg-emerald-subtle">
                  <TrendingUp size={16} /> +18.5%
                </div>
              </div>
              <div className="chart-visual-bars">
                {[45, 60, 30, 85, 100, 75, 50].map((h, i) => (
                  <div className="bar-wrapper" key={i}>
                    <div className={`bar-fill ${h > 80 ? 'active-purple' : ''}`} style={{ height: `${h}%` }}></div>
                  </div>
                ))}
              </div>
              <div className="floating-metric-card float-bottom-left">
                <PieChart size={24} className="text-purple" />
                <div>
                  <strong>72% Tarjeta</strong>
                  <span>Método de pago líder</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="func-bottom-cta">
        <div className="func-container text-center cta-box-inner">
          <h2 className="cta-gradient-text">¿Listo para llevar tu club al siguiente nivel?</h2>
          <p>La configuración es inmediata. Seleccioná un plan y empezá a recibir turnos online hoy mismo.</p>
          <div className="cta-buttons-wrapper">
            <button className="btn-cta-emerald" onClick={() => navigate('/planes')}>
              <span>Ver Planes y Precios</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}