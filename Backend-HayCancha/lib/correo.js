// Envío de mails por la API de Resend (HTTPS: el plan gratis de Render bloquea SMTP).
// Sin RESEND_API_KEY y CORREO_REMITENTE no se manda nada: las funciones responden { enviado: false }.
// CORREO_REMITENTE tiene que ser de un dominio verificado en Resend, ej. "GridPlay <avisos@tudominio.com>".

const URL_RESEND = 'https://api.resend.com/emails';
const TIEMPO_MAXIMO_MS = 15_000;

export const correoConfigurado = () => Boolean(process.env.RESEND_API_KEY && process.env.CORREO_REMITENTE);

const MAIL_VALIDO = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
export const mailValido = (mail) => typeof mail === 'string' && mail.length <= 254 && MAIL_VALIDO.test(mail);

/**
 * Manda un mail. Nunca lanza: devuelve { enviado, motivo? }.
 * `para` es UNA dirección; `responderA` es opcional (a dónde llega si el destinatario contesta).
 */
export async function enviarCorreo({ para, asunto, html, texto, responderA }) {
  if (!correoConfigurado()) return { enviado: false, motivo: 'sin-configurar' };
  if (!mailValido(para)) return { enviado: false, motivo: 'destinatario-invalido' };

  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  try {
    const respuesta = await fetch(URL_RESEND, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CORREO_REMITENTE,
        to: [para],
        subject: asunto,
        html,
        text: texto,
        ...(mailValido(responderA) ? { reply_to: responderA } : {}),
      }),
      signal: control.signal,
    });
    if (!respuesta.ok) {
      console.error('Resend rechazó el mail:', respuesta.status, (await respuesta.text()).slice(0, 300));
      return { enviado: false, motivo: `resend-${respuesta.status}` };
    }
    return { enviado: true };
  } catch (error) {
    console.error('No se pudo enviar el mail:', error?.message || error);
    return { enviado: false, motivo: 'red' };
  } finally {
    clearTimeout(corte);
  }
}
