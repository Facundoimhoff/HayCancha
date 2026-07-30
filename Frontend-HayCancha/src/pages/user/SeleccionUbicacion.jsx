import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import HeaderCliente from './HeaderCliente'; 
import './SeleccionUbicacion.css';

const SeleccionUbicacion = () => {
  const navigate = useNavigate();
  const { provincia } = useParams(); 
  
  const [ubicaciones, setUbicaciones] = useState([]);
  const [provinciaSelec, setProvinciaSelec] = useState(provincia ? decodeURIComponent(provincia) : null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState(''); // Estado para el buscador de ciudades

  useEffect(() => {
    if (provincia) setProvinciaSelec(decodeURIComponent(provincia));
  }, [provincia]);

  useEffect(() => {
    const cargarUbicaciones = async () => {
      const { data, error } = await supabase
        .from('clubes')
        .select('provincia, ciudad');

      if (!error && data) setUbicaciones(data);
      setCargando(false);
    };
    cargarUbicaciones();
  }, []);

  const handleSeleccionCiudad = (ciudad) => {
    navigate(`/explorar/${encodeURIComponent(provinciaSelec)}/${encodeURIComponent(ciudad)}`);
  };

  // Filtramos para sacar solo las ciudades únicas de la provincia seleccionada (Que SÍ tienen club)
  const ciudadesDisponibles = [...new Set(ubicaciones
    .filter(u => u.provincia && provinciaSelec && u.provincia.toLowerCase() === provinciaSelec.toLowerCase())
    .map(u => u.ciudad)
  )].filter(Boolean).sort();

  // Filtramos la lista en tiempo real según lo que el usuario escriba en el buscador
  const ciudadesFiltradas = ciudadesDisponibles.filter(ciudad => 
    ciudad.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <HeaderCliente />

      <div className="ubicacion-page">
        
        {/* ENCABEZADO Y BUSCADOR */}
        <div className="ubicacion-header-amplio">
          <button onClick={() => navigate('/')} className="btn-flotante-volver" style={{ marginBottom: '20px' }}>
            <ArrowLeft size={18} /> Volver al Inicio
          </button>
          
          <h1 className="titulo-seccion-amplio">
            CIUDADES EN <span className="text-green">{provinciaSelec?.toUpperCase()}</span>
          </h1>
          <p className="subtitulo-amplio">Seleccioná tu ciudad para ver los complejos deportivos disponibles.</p>

          {/* Buscador de ciudades (solo aparece si hay ciudades disponibles) */}
          {ciudadesDisponibles.length > 0 && (
            <div className="buscador-ciudades">
              <Search size={20} className="icono-search" />
              <input 
                type="text" 
                placeholder={`Buscar ciudad en ${provinciaSelec}...`} 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-buscador-ciudades"
              />
            </div>
          )}
        </div>

        {/* GRILLA DE RESULTADOS */}
        {cargando ? (
          <p className="estado-carga">Buscando ciudades...</p>
        ) : ciudadesDisponibles.length === 0 ? (
          
          // ESTADO VACÍO (Si la provincia no tiene clubes)
          <div className="mensaje-vacio-ubicacion">
            <MapPin size={40} className="icono-vacio" />
            <h3>¡Ups! Todavía no llegamos</h3>
            <p>Por ahora ningún club de <strong>{provinciaSelec}</strong> está registrado en la plataforma. ¡Pronto habrá novedades!</p>
            <button onClick={() => navigate('/')} className="btn-volver-vacio">
              Elegir otra provincia
            </button>
          </div>
          
        ) : (
          
          // GRILLA DE CIUDADES
          <div className="grid-ciudades">
            {ciudadesFiltradas.length > 0 ? (
              ciudadesFiltradas.map((ciudad) => (
                <div 
                  key={ciudad} 
                  className="ciudad-card"
                  onClick={() => handleSeleccionCiudad(ciudad)}
                >
                  <div>
                    <h4>{ciudad}</h4>
                    <p><MapPin size={14}/> Ver clubes disponibles</p>
                  </div>
                  <ChevronRight size={20} className="icono-flecha" />
                </div>
              ))
            ) : (
              <p className="estado-carga">No se encontraron ciudades con "{busqueda}".</p>
            )}
          </div>
          
        )}

      </div>
    </>
  );
};

export default SeleccionUbicacion;