import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, ArrowLeft, Clock, CalendarDays, Phone, Mail, CheckCircle2, Car, Users, Layers, CloudRain,
  MessageCircle, Image as ImageIcon, Camera, AtSign, Music2, Globe,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Calificacion } from '../../components/user/Estrellas';
import SeccionResenas from '../../components/user/SeccionResenas';
import Carrusel from '../../components/user/Carrusel';
import Hoja from '../../components/user/Hoja';
import { enlaceRed, enlaceCorreo, colorClub, textoSobre, listaImagenes } from '../../utils/enlaces';
import { enlaceMapa, enlaceWhatsApp, moneda } from '../../utils/reservas';
import './PerfilClub.css';

const ICONOS_RED = { instagram: Camera, tiktok: Music2, facebook: Globe };
const NOMBRES_RED = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook' };

const superficieDe = (cancha) => cancha.superficie || (cancha.deporte === 'Pádel' ? 'Blindex / Sintético' : 'Sintético');
const jugadoresDe = (cancha) => cancha.cantidad_jugadores || 5;
const hora = (h) => String(h || '').slice(0, 5);

const PerfilClub = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [resumenResenas, setResumenResenas] = useState(null);
  const [canchaAbierta, setCanchaAbierta] = useState(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const [{ data: dataClub, error: errorClub }, { data: dataCanchas }] = await Promise.all([
        supabase.from('clubes').select('*').eq('id', id).single(),
        supabase.from('canchas').select('*').eq('club_id', id).order('precio_hora', { ascending: true }),
      ]);
      if (cancelado) return;
      if (errorClub) console.error('Error al cargar el club:', errorClub);
      setClub(errorClub ? null : dataClub);
      setCanchas((dataCanchas || []).filter((c) => c.activa !== false));
      setCargando(false);
    })();

    return () => { cancelado = true; };
  }, [id]);

  // Compartir por WhatsApp: arma el mensaje con el costo por persona
  const armarPartido = (cancha) => {
    const jugadores = cancha.cantidad_jugadores || (cancha.deporte === 'Pádel' ? 4 : 10);
    const porPersona = Math.round(cancha.precio_hora / jugadores);
    const texto =
      `🏆 ¡Gente, sale partido en *${club.nombre}*!\n\n` +
      `🏟️ *Cancha:* ${cancha.nombre} (${cancha.deporte})\n` +
      `💵 *Costo total:* ${moneda(cancha.precio_hora)} la hora\n` +
      `💸 *Aprox por cabeza:* ${moneda(porPersona)}\n\n` +
      `👇 Confirmen quién juega y reservo el horario por acá:\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  if (cargando) return <div className="pc-estado">Cargando complejo…</div>;
  if (!club) {
    return (
      <div className="pc-estado">
        <p>No encontramos este club. Puede que ya no esté disponible.</p>
        <Link to="/" className="gp-btn gp-btn--primario">Volver al inicio</Link>
      </div>
    );
  }

  const color = colorClub(club.color_primario);
  const textoBanner = textoSobre(color);
  // Con texto claro el degradé se oscurece; con texto oscuro se aclara: así el contraste no baja hacia el final
  const finBanner = textoBanner === '#ffffff' ? '#000000' : '#ffffff';
  const fotosClub = listaImagenes(club.fotos_club);
  const logo = listaImagenes(club.imagen_url)[0];
  const servicios = (club.servicios || '').split(',').map((s) => s.trim()).filter(Boolean);
  const redes = Object.keys(NOMBRES_RED).map((red) => ({ red, href: enlaceRed(red, club.redes_sociales?.[red]), texto: club.redes_sociales?.[red] })).filter((r) => r.href);
  const correo = enlaceCorreo(club.correo_contacto);
  const whatsapp = enlaceWhatsApp(club.telefono_contacto);
  const mapa = enlaceMapa(club);
  const sinContacto = !correo && redes.length === 0;

  return (
    <div className="pc-pagina">
      <header className="pc-banner" style={{ '--pc-color': color, '--pc-texto': textoBanner, '--pc-fin': finBanner }}>
        <div className="pc-banner-interior">
          <button type="button" onClick={() => navigate(-1)} className="pc-volver"><ArrowLeft size={18} /> Volver</button>
          <div className="pc-identidad">
            {logo && <img src={logo} alt={`Logo de ${club.nombre}`} className="pc-logo" />}
            <div>
              <h1>{club.nombre}</h1>
              <Calificacion resumen={resumenResenas} />
            </div>
          </div>
        </div>
      </header>

      <main className="pc-contenido">
        <ul className="pc-datos">
          {club.telefono_contacto && (
            <li>
              <Phone size={20} aria-hidden="true" />
              {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer">{club.telefono_contacto}</a> : club.telefono_contacto}
            </li>
          )}
          <li>
            <MapPin size={20} aria-hidden="true" />
            {mapa
              ? <a href={mapa} target="_blank" rel="noreferrer">{[club.direccion, club.ciudad, club.provincia].filter(Boolean).join(', ')}</a>
              : <span>{[club.direccion, club.ciudad, club.provincia].filter(Boolean).join(', ')}</span>}
          </li>
          <li>
            <Car size={20} aria-hidden="true" />
            <span>{club.estacionamiento ? 'Estacionamiento disponible' : 'Estacionamiento en la calle'}</span>
          </li>
        </ul>

        <section className="pc-seccion" aria-labelledby="pc-canchas">
          <h2 id="pc-canchas">Canchas disponibles</h2>
          {canchas.length === 0 ? (
            <div className="pc-vacio"><ImageIcon size={40} aria-hidden="true" /><p>Este club aún no tiene canchas registradas.</p></div>
          ) : (
            <ul className="pc-canchas">
              {canchas.map((cancha) => {
                const foto = listaImagenes(cancha.imagen_url)[0];
                return (
                  <li key={cancha.id}>
                    <button type="button" className="pc-cancha" onClick={() => setCanchaAbierta(cancha)}>
                      <span className="pc-cancha-foto">
                        {foto ? <img src={foto} alt="" loading="lazy" /> : <ImageIcon size={32} aria-hidden="true" />}
                        <span className="gp-chip gp-chip--marca">{cancha.deporte}</span>
                      </span>
                      <span className="pc-cancha-cuerpo">
                        <strong>{cancha.nombre}</strong>
                        <span className="pc-cancha-datos">
                          <span><Users size={14} aria-hidden="true" /> {jugadoresDe(cancha)} jug.</span>
                          <span><Layers size={14} aria-hidden="true" /> {superficieDe(cancha)}</span>
                          {cancha.techada && <span><CloudRain size={14} aria-hidden="true" /> Techada</span>}
                        </span>
                        <span className="pc-cancha-precio">{moneda(cancha.precio_hora)} <small>/ hora</small></span>
                        <span className="pc-cancha-cta">Ver info y horarios</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="pc-dos-col">
          <section className="pc-seccion" aria-labelledby="pc-servicios">
            <h2 id="pc-servicios">Servicios</h2>
            {servicios.length > 0 ? (
              <ul className="pc-servicios">
                {servicios.map((s) => <li key={s}><CheckCircle2 size={16} aria-hidden="true" /> {s}</li>)}
              </ul>
            ) : <p className="pc-nada">No hay servicios detallados.</p>}
          </section>

          <section className="pc-seccion" aria-labelledby="pc-contacto">
            <h2 id="pc-contacto">Redes y correo</h2>
            <ul className="pc-contactos">
              {correo && <li><a href={correo} target="_blank" rel="noreferrer"><Mail size={20} aria-hidden="true" /> {club.correo_contacto}</a></li>}
              {redes.map(({ red, href, texto }) => {
                const Icono = ICONOS_RED[red] || AtSign;
                return <li key={red}><a href={href} target="_blank" rel="noopener noreferrer"><Icono size={20} aria-hidden="true" /> <span className="gp-solo-lector">{NOMBRES_RED[red]}: </span>{texto}</a></li>;
              })}
            </ul>
            {sinContacto && <p className="pc-nada">Sin redes sociales cargadas.</p>}
          </section>
        </div>

        <section className="pc-seccion" aria-labelledby="pc-acerca">
          <h2 id="pc-acerca">Acerca de este club</h2>
          <div className="pc-acerca">
            <Carrusel imagenes={fotosClub} etiqueta={`Instalaciones de ${club.nombre}`} vacio="No hay fotos disponibles" className="pc-acerca-fotos" />
            <p className="pc-descripcion">{club.descripcion || <span className="pc-nada">Este club aún no agregó una descripción de sus instalaciones.</span>}</p>
          </div>
        </section>

        <SeccionResenas club={club} onResumen={setResumenResenas} />
      </main>

      {canchaAbierta && (
        <Hoja
          titulo={canchaAbierta.nombre}
          descripcion={canchaAbierta.deporte}
          ancho="lg"
          onCerrar={() => setCanchaAbierta(null)}
          pie={(
            <>
              <button type="button" className="gp-btn gp-btn--fantasma pc-whatsapp" onClick={() => armarPartido(canchaAbierta)}>
                <MessageCircle size={18} /> Invitar al equipo
              </button>
              <span className="gp-espaciador" />
              <button type="button" className="gp-btn gp-btn--primario" onClick={() => navigate(`/reservar/${canchaAbierta.id}`)}>
                <CalendarDays size={18} /> Elegir horario
              </button>
            </>
          )}
        >
          <Carrusel imagenes={listaImagenes(canchaAbierta.imagen_url)} etiqueta={canchaAbierta.nombre} vacio="Sin fotos disponibles" />
          <dl className="pc-ficha">
            <div><dt>Precio por turno</dt><dd className="pc-ficha-precio">{moneda(canchaAbierta.precio_hora)} <small>/ hora</small></dd></div>
            <div><dt>Jugadores</dt><dd>{jugadoresDe(canchaAbierta)}</dd></div>
            <div><dt>Tipo de piso</dt><dd>{superficieDe(canchaAbierta)}</dd></div>
            <div><dt>Infraestructura</dt><dd>{canchaAbierta.techada ? 'Totalmente techada' : 'Al aire libre'}</dd></div>
            <div><dt>Horario</dt><dd><Clock size={16} aria-hidden="true" /> {hora(canchaAbierta.hora_apertura) || '08:00'} a {hora(canchaAbierta.hora_cierre) || '23:00'} hs</dd></div>
          </dl>
        </Hoja>
      )}
    </div>
  );
};

export default PerfilClub;
