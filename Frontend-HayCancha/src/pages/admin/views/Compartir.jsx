import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, ExternalLink, MessageCircle, QrCode, Smartphone } from 'lucide-react';
import { Panel, Vacio } from '../components/ui.jsx';
import { dibujarCartel, descargarCanvas, FORMATOS } from '../lib/cartel.js';
import { enlaceDelClub, mensajeParaCompartir, textoParaBio, enlaceWhatsAppCompartir, nombreDeArchivo } from '../../../utils/compartir.js';

const copiarAlPortapapeles = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    try { document.execCommand('copy'); } catch { /* sin permiso: el texto queda a la vista para copiarlo a mano */ }
    document.body.removeChild(campo);
  }
};

const BotonCopiar = ({ texto, etiqueta = 'Copiar' }) => {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef(null);
  useEffect(() => () => clearTimeout(temporizador.current), []);
  const copiar = async () => {
    await copiarAlPortapapeles(texto);
    setCopiado(true);
    temporizador.current = setTimeout(() => setCopiado(false), 2000);
  };
  return (
    <button type="button" className="dash-btn dash-btn--secundario dash-btn--chico" onClick={copiar}>
      {copiado ? <Check size={14} /> : <Copy size={14} />} <span aria-live="polite">{copiado ? 'Copiado' : etiqueta}</span>
    </button>
  );
};

/** Compartí tu club: link de la ficha, mensajes listos y cartel con QR para imprimir o subir a una historia. */
const Compartir = ({ club, canchas }) => {
  const url = enlaceDelClub(window.location.origin, club.id);
  const mensaje = mensajeParaCompartir(club.nombre, url);
  const lienzo = useRef(null);
  const [qr, setQr] = useState(null);
  const [errorQr, setErrorQr] = useState(false);
  const [descargando, setDescargando] = useState(null);
  const [errorDescarga, setErrorDescarga] = useState('');

  // La librería del QR se descarga recién al abrir esta sección
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [{ default: QRCode }] = await Promise.all([import('qrcode'), document.fonts?.ready]);
        if (!cancelado) setQr(QRCode.create(url, { errorCorrectionLevel: 'M' }));
      } catch (error) {
        console.error('No se pudo generar el QR:', error);
        if (!cancelado) setErrorQr(true);
      }
    })();
    return () => { cancelado = true; };
  }, [url]);

  useEffect(() => {
    if (qr && lienzo.current) dibujarCartel(lienzo.current, 'a4', { club: club.nombre, url, qr });
  }, [qr, club.nombre, url]);

  const descargar = async (formato) => {
    setErrorDescarga('');
    setDescargando(formato);
    try {
      const canvas = dibujarCartel(document.createElement('canvas'), formato, { club: club.nombre, url, qr });
      await descargarCanvas(canvas, `${FORMATOS[formato].nombre}-${nombreDeArchivo(club.nombre)}`);
    } catch (error) {
      console.error('No se pudo descargar el cartel:', error);
      setErrorDescarga('No pudimos generar la imagen. Probá de nuevo.');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <>
      <header className="dash-page-head">
        <div>
          <h1>Compartí tu club</h1>
          <p>Que tus jugadores reserven solos, sin escribirte</p>
        </div>
      </header>

      {canchas.length === 0 && (
        <p className="dash-compartir-aviso" role="status">
          Todavía no cargaste canchas: quien entre a tu link no va a poder reservar. Cargalas en <strong>Canchas</strong> antes de compartirlo.
        </p>
      )}

      <div className="dash-grid dash-grid--dos">
        <div className="dash-compartir-col">
          <Panel titulo="El link de tu club" descripcion="Es la página donde tus jugadores eligen cancha, día y horario.">
            <div className="dash-compartir-link">
              <input className="dash-input" readOnly value={url} aria-label="Link de tu club" onFocus={(e) => e.target.select()} />
              <BotonCopiar texto={url} etiqueta="Copiar link" />
            </div>
            <div className="dash-compartir-acciones">
              <a className="dash-btn dash-btn--primario dash-btn--chico" href={enlaceWhatsAppCompartir(mensaje)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={14} /> Enviar por WhatsApp
              </a>
              <a className="dash-btn dash-btn--secundario dash-btn--chico" href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} /> Ver cómo se ve
              </a>
            </div>
          </Panel>

          <Panel titulo="Dónde ponerlo" descripcion="Tres lugares donde ya te están buscando.">
            <ol className="dash-compartir-pasos">
              <li>
                <strong>En tu Instagram.</strong> Editar perfil → Enlaces → pegá el link. En la biografía poné:
                <span className="dash-compartir-texto"><em>{textoParaBio()}</em> <BotonCopiar texto={textoParaBio()} /></span>
              </li>
              <li>
                <strong>En tu WhatsApp.</strong> Mandalo a tus grupos y ponelo como respuesta rápida para cuando te pidan turno:
                <span className="dash-compartir-texto"><em>{mensaje}</em> <BotonCopiar texto={mensaje} /></span>
              </li>
              <li>
                <strong>En el club.</strong> Imprimí el cartel con el código QR y pegalo en la entrada, en la cantina y al lado de cada cancha.
              </li>
            </ol>
          </Panel>
        </div>

        <Panel titulo="Cartel con código QR" descripcion="Quien lo escanea con la cámara del celular entra directo a reservar.">
          {errorQr ? (
            <Vacio icono={QrCode} titulo="No pudimos generar el código QR" texto="Revisá tu conexión y volvé a abrir esta sección." />
          ) : (
            <>
              <div className="dash-cartel">
                <canvas ref={lienzo} role="img" aria-label={`Cartel con el código QR de ${club.nombre}`} />
                {!qr && <span className="dash-cartel-cargando">Generando el cartel…</span>}
              </div>
              {errorDescarga && <p className="dash-error" role="alert">{errorDescarga}</p>}
              <div className="dash-compartir-acciones">
                <button type="button" className="dash-btn dash-btn--primario" onClick={() => descargar('a4')} disabled={!qr || Boolean(descargando)}>
                  <Download size={16} /> {descargando === 'a4' ? 'Generando…' : 'Descargar para imprimir'}
                </button>
                <button type="button" className="dash-btn dash-btn--secundario" onClick={() => descargar('historia')} disabled={!qr || Boolean(descargando)}>
                  <Smartphone size={16} /> {descargando === 'historia' ? 'Generando…' : 'Descargar para historias'}
                </button>
              </div>
              <p className="dash-plan-nota">El de imprimir es tamaño A4. El de historias tiene la medida de Instagram y del estado de WhatsApp.</p>
            </>
          )}
        </Panel>
      </div>
    </>
  );
};

export default Compartir;
