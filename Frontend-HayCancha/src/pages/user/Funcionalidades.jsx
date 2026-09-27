import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, CalendarDays, MapPin, 
  Store, PieChart, TrendingUp, Smartphone, CheckCircle2, 
  Star, Zap
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
            <span>Software de reservas para complejos deportivos</span>
          </div>
          <h1 className="hero-main-title">
            Digitalizá tu club y <br />
            <span className="text-gradient">ordená tus reservas</span>
          </h1>
          <p className="hero-sub-text">
            Tus clientes reservan solos desde el celular. Vos controlás turnos, extras del kiosco y métricas desde un solo panel, y lo probás 30 días gratis.
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
              Tus clientes reservan directamente desde su celular y ven al instante qué horarios están libres. El sistema no permite reservar dos veces el mismo turno, evitando los clásicos errores del cuaderno de papel.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-emerald" />
                <span><strong>Bloqueos rápidos:</strong> Frená alquileres por lluvia o mantenimiento con un toque.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-emerald" />
                <span><strong>Turnos manuales:</strong> Cargá los turnos que te llegan por WhatsApp o en persona, junto a los que reservan online.</span>
              </div>
            </div>
          </div>

          <div className="feature-mockup-col">
            <div className="mockup-glow glow-emerald"></div>
            <div className="glass-card mockup-calendar-frame">
              <div className="mockup-top-bar">
                <div className="window-dots"><span></span><span></span><span></span></div>
                <div className="window-title">Viernes • Turnos de la Tarde</div>
                <span className="live-status">HOY</span>
              </div>
              <div className="calendar-grid-ui">
                <div className="time-column">
                  <span>19:00</span><span>20:00</span><span>21:00</span><span>22:00</span>
                </div>
                <div className="courts-columns">
                  <div className="court-slot-column">
                    <div className="court-name-header">Cancha 1</div>
                    <div className="booking-card slot-1 bg-green-accent">
                      <div className="b-header"><strong>Matías R.</strong><span className="b-badge">RESERVADO</span></div>
                      <span className="b-time">19:00 - 20:30 hs</span>
                    </div>
                  </div>
                  <div className="court-slot-column">
                    <div className="court-name-header">Cancha 2</div>
                    <div className="booking-card slot-2 bg-purple-accent">
                      <div className="b-header"><strong>Mantenimiento</strong><span className="b-badge">BLOQUEADO</span></div>
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
              <MapPin size={14} />
              <span>TU CLUB, VISIBLE</span>
            </div>
            <h2 className="feature-heading">Que los jugadores te encuentren cerca de su ubicación</h2>
            <p className="feature-description">
              Cada club tiene su página pública con fotos, redes, ubicación en el mapa y reseñas de jugadores que ya reservaron. Los jugadores te encuentran por ciudad o por cercanía.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-blue" />
                <span><strong>Reseñas reales:</strong> Solo pueden calificar quienes ya jugaron en tu club.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-blue" />
                <span><strong>Cero comisiones:</strong> GridPlay cobra una suscripción fija, sin comisión por reserva.</span>
              </div>
            </div>
          </div>

          <div className="feature-mockup-col">
            <div className="mockup-glow glow-blue"></div>
            <div className="glass-card mockup-checkout-frame">
              <div className="checkout-top">
                <div className="lock-icon-box bg-blue-subtle">
                  <MapPin size={20} className="text-blue" />
                </div>
                <div>
                  <h4>Tu Club</h4>
                  <p>Ejemplo de página pública</p>
                </div>
              </div>
              <div className="checkout-breakdown">
                <div className="breakdown-row highlight-seña blue-border">
                  <span>Reseñas de jugadores</span>
                  <strong className="text-blue"><Star size={14} fill="currentColor" /> 4,8</strong>
                </div>
                <div className="payment-options-grid">
                  <div className="pay-option active blue-active">
                    <span className="pay-radio checked"></span><span>Fútbol 5</span>
                  </div>
                  <div className="pay-option">
                    <span className="pay-radio"></span><span>Pádel</span>
                  </div>
                </div>
              </div>
              <button className="btn-mockup-pay bg-blue-grad">
                <span>Ver turnos</span>
                <ArrowRight size={18} />
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
              <span>EXTRAS Y KIOSCO</span>
            </div>
            <h2 className="feature-heading">Sumá ventas con los extras de tu kiosco</h2>
            <p className="feature-description">
              Cargá tus bebidas, snacks o el alquiler de paletas y pelotas. Tus clientes los suman al reservar y quedan cargados en la misma reserva.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-amber" />
                <span><strong>Catálogo propio:</strong> Definí nombre, precio y una miniatura de cada producto, y ocultá los que no tenés.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-amber" />
                <span><strong>Ingresos separados:</strong> Los reportes distinguen lo que facturás por alquiler de canchas y lo que sumás por kiosco.</span>
              </div>
            </div>
          </div>

          <div className="feature-mockup-col">
            <div className="mockup-glow glow-amber"></div>
            <div className="glass-card mockup-pos-frame">
              <div className="pos-header">
                <div>
                  <span className="table-tag text-amber">RESERVA • CANCHA 2</span>
                  <h3>Tu reserva</h3>
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
                  <span>Cancha (1 hora)</span><span>$10.000</span>
                </div>
              </div>
              <div className="pos-total-summary bg-amber-subtle">
                <span className="text-amber-dark">TOTAL DE LA RESERVA</span>
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
            <h2 className="feature-heading">Estadísticas para decidir mejor</h2>
            <p className="feature-description">
              Mirá tus ingresos, la ocupación de cada cancha y un mapa de calor por día y hora para encontrar los horarios más flojos.
            </p>
            <div className="feature-perks-list">
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-purple" />
                <span><strong>Horarios muertos:</strong> Detectá en el mapa de calor qué días y horas quedan libres para promocionarlos.</span>
              </div>
              <div className="perk-item">
                <CheckCircle2 size={20} className="perk-check text-purple" />
                <span><strong>Reportes:</strong> Exportá tus ingresos y turnos en Excel o PDF.</span>
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
                  <strong>68% Ocupación</strong>
                  <span>De tus horas disponibles</span>
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
          <p>Armá tu club en unos minutos y probalo 30 días gratis, sin tarjeta y sin compromiso.</p>
          <div className="cta-buttons-wrapper">
            <button className="btn-cta-emerald" onClick={() => navigate('/registro-club')}>
              <span>Empezar 30 días gratis</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}