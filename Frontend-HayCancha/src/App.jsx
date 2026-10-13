import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// El camino del jugador (portada → explorar → club → reservar) viaja en la carga inicial
import LandingPage from './pages/user/LandingPage';
import SeleccionUbicacion from './pages/user/SeleccionUbicacion';
import CiudadesPorProvincia from './pages/user/CiudadesPorProvincia';
import HomeUsuario from './pages/user/HomeUsuario';
import Buscar from './pages/user/Buscar';
import PerfilClub from './pages/user/PerfilClub';
import ReservaCancha from './pages/user/ReservaCancha';
import LoginCliente from './pages/user/LoginCliente';
import AuthPopup from './pages/user/AuthPopup';
import CookieBanner from './pages/user/CookieBanner';
import { AuthProvider } from './context/AuthProvider';
import RutaProtegida from './components/RutaProtegida';
import { activarAnalitica, registrarVista } from './services/analitica';

// El resto se descarga recién al entrar: así la portada no carga con pantallas que la mayoría no abre.
// El panel, además, arrastra los gráficos.
const DashboardAdmin = lazy(() => import('./pages/admin/DashboardAdmin'));
const MisReservas = lazy(() => import('./pages/user/MisReservas'));
const Favoritos = lazy(() => import('./pages/user/Favoritos'));
const MiCuenta = lazy(() => import('./pages/user/MiCuenta'));
const Planes = lazy(() => import('./pages/user/Planes'));
const RegistroClub = lazy(() => import('./pages/user/RegistroClub'));
const LoginAdmin = lazy(() => import('./pages/user/LoginAdmin'));
const ActualizarPassword = lazy(() => import('./pages/user/ActualizarPassword'));
const FormularioContacto = lazy(() => import('./pages/user/FormularioContacto'));
const Funcionalidades = lazy(() => import('./pages/user/Funcionalidades'));
const Privacidad = lazy(() => import('./pages/user/Privacidad'));
const Terminos = lazy(() => import('./pages/user/Terminos'));
const NoEncontrada = lazy(() => import('./pages/user/NoEncontrada'));

const Cargando = ({ texto = 'Cargando…' }) => <div className="estado-carga">{texto}</div>;

function RutasAnimadas() {
  const location = useLocation();

  // Cada vez que cambia la pantalla, el scroll vuelve arriba
  useEffect(() => {
    window.scrollTo(0, 0);
    registrarVista(location.pathname);
  }, [location.pathname]);

  return (
    // La `key` reinicia la animación de entrada cada vez que cambia la URL
    <div key={location.pathname} className="animacion-cambio-pantalla">
      <Suspense fallback={<Cargando />}>
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/seleccionar-ubicacion" element={<SeleccionUbicacion />} />
          <Route path="/seleccionar-ubicacion/:provincia" element={<SeleccionUbicacion />} />
          <Route path="/explorar/:provincia" element={<CiudadesPorProvincia />} />
          <Route path="/explorar/:provincia/:ciudad" element={<HomeUsuario />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/club/:id" element={<PerfilClub />} />
          <Route path="/reservar/:idCancha" element={<ReservaCancha />} />
          <Route path="/login-cliente" element={<LoginCliente />} />
          <Route path="/auth/popup" element={<AuthPopup />} />

          <Route path="/mis-reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />
          <Route path="/favoritos" element={<RutaProtegida><Favoritos /></RutaProtegida>} />
          <Route path="/mi-cuenta" element={<RutaProtegida><MiCuenta /></RutaProtegida>} />

          <Route path="/funcionalidades" element={<Funcionalidades />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/registro-club" element={<RegistroClub />} />
          <Route path="/onboarding" element={<RegistroClub />} />
          <Route path="/login-admin" element={<LoginAdmin />} />
          <Route path="/actualizar-password" element={<ActualizarPassword />} />
          <Route path="/panel" element={<RutaProtegida rol="admin"><Suspense fallback={<Cargando texto="Cargando panel…" />}><DashboardAdmin /></Suspense></RutaProtegida>} />

          <Route path="/contacto" element={<FormularioContacto />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  // Si ya había aceptado las cookies en una visita anterior, la medición arranca con la app
  useEffect(() => { activarAnalitica(); }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CookieBanner />
        <RutasAnimadas />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
