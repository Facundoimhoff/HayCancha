import { useEffect, useRef, useState } from 'react';

/**
 * Envío de un formulario de contacto a Formspree, con estados para mostrar en pantalla (sin alert()).
 * Uso: const { enviar, enviando, enviado, error } = useFormspree('https://formspree.io/f/xxxx');
 *      <form onSubmit={enviar}> ... </form>
 */
export function useFormspree(endpoint, { mensajeOk = 4000 } = {}) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const enviar = async (e) => {
    e.preventDefault();
    const formulario = e.currentTarget;
    setEnviando(true);
    setError('');
    try {
      const respuesta = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(formulario),
        headers: { Accept: 'application/json' },
      });
      if (!respuesta.ok) throw new Error(`Formspree ${respuesta.status}`);
      formulario.reset();
      setEnviado(true);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setEnviado(false), mensajeOk);
    } catch (err) {
      console.error('Error al enviar el formulario:', err);
      setError('No pudimos enviar tu mensaje. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return { enviar, enviando, enviado, error };
}
