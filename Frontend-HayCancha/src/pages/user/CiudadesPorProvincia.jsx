import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import HeaderCliente from './HeaderCliente';
import './CiudadesPorProvincia.css';

export default function CiudadesPorProvincia() {
  const { provincia } = useParams();
  const navigate = useNavigate();

  const [ciudades, setCiudades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const provinciaNombre = decodeURIComponent(provincia);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const { data, error: sbError } = await supabase.from('clubes').select('ciudad, provincia').ilike('provincia', provinciaNombre);
      if (cancelado) return;
      if (sbError) {
        console.error('Error al cargar ciudades:', sbError);
        setError('No pudimos cargar las ciudades de esta provincia.');
      } else {
        setError(null);
        setCiudades([...new Set(data.map((item) => item.ciudad))].filter(Boolean).sort());
      }
      setCargando(false);
    })();

    return () => { cancelado = true; };
  }, [provinciaNombre]);

  return (
    <>
      <HeaderCliente />

      <main className="cp-pagina">
        <button type="button" onClick={() => navigate(-1)} className="gp-volver"><ArrowLeft size={18} /> Volver</button>

        <h1 className="cp-titulo">Ciudades en <span>{provinciaNombre.toUpperCase()}</span></h1>

        {cargando ? (
          <div className="cp-centro" role="status" aria-label="Cargando ciudades"><Loader2 size={48} className="cp-spinner" /></div>
        ) : error ? (
          <p className="cp-error" role="alert">{error}</p>
        ) : ciudades.length === 0 ? (
          <div className="cp-vacio"><h2>No hay ciudades con clubes registrados en esta provincia todavía.</h2></div>
        ) : (
          <ul className="cp-grilla">
            {ciudades.map((ciudad) => (
              <li key={ciudad}>
                <Link to={`/buscar?q=${encodeURIComponent(ciudad)}`} className="cp-ciudad">
                  <span>
                    <strong>{ciudad}</strong>
                    <small><MapPin size={14} aria-hidden="true" /> Ver clubes disponibles</small>
                  </span>
                  <ArrowRight size={20} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
