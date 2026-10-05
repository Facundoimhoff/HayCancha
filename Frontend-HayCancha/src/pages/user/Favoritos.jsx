import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { resumenPorClub } from '../../services/resenas';
import { misClubesFavoritos } from '../../services/favoritos';
import { useFavoritos } from '../../hooks/useFavoritos';
import HeaderCliente from './HeaderCliente';
import TarjetaClub from '../../components/user/TarjetaClub';
import './Favoritos.css';

/** Clubes que el jugador marcó como favoritos. Ruta protegida: solo se llega acá con sesión. */
const Favoritos = () => {
  const navigate = useNavigate();
  const [clubes, setClubes] = useState([]);
  const [resumenes, setResumenes] = useState({});
  const [cargando, setCargando] = useState(true);
  const { favoritos, esFavorito, alternar } = useFavoritos();

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const lista = await misClubesFavoritos();
      if (cancelado) return;
      setClubes(lista);
      setCargando(false);

      const calificaciones = await resumenPorClub(lista.map((c) => c.id));
      if (!cancelado) setResumenes(calificaciones);
    })();

    return () => { cancelado = true; };
  }, []);

  // Si se desmarca un favorito acá mismo, desaparece de la lista sin recargar la página
  const visibles = useMemo(() => clubes.filter((c) => favoritos.has(c.id)), [clubes, favoritos]);

  return (
    <div className="fv-pagina">
      <HeaderCliente />

      <main className="fv-contenedor">
        <header className="fv-cabecera">
          <div>
            <h1>Favoritos</h1>
            <p>Los clubes que guardaste para reservar más rápido.</p>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="gp-btn gp-btn--fantasma gp-btn--chico">
            <ArrowLeft size={16} /> Volver
          </button>
        </header>

        {cargando ? (
          <div className="fv-grilla" aria-busy="true" aria-label="Cargando favoritos">
            {[0, 1, 2].map((i) => <div key={i} className="fv-esqueleto" />)}
          </div>
        ) : visibles.length === 0 ? (
          <div className="fv-vacio">
            <Heart size={40} aria-hidden="true" />
            <h2>Todavía no tenés favoritos</h2>
            <p>Marcá el corazón de un club para encontrarlo rápido la próxima vez.</p>
            <Link to="/seleccionar-ubicacion" className="gp-btn gp-btn--primario">Explorar clubes</Link>
          </div>
        ) : (
          <div className="fv-grilla">
            {visibles.map((club) => (
              <TarjetaClub
                key={club.id}
                club={club}
                resumen={resumenes[club.id]}
                favorito={esFavorito(club.id)}
                onAlternarFavorito={alternar}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Favoritos;
