import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Tus importaciones de páginas
import HomeUsuario from './pages/user/HomeUsuario';
import PerfilClub from './pages/user/PerfilClub'; 
import ReservaCancha from './pages/user/ReservaCancha';
import LandingPage from './pages/user/LandingPage'; 
import DashboardAdmin from './pages/admin/DashboardAdmin';
import MisReservas from './pages/user/MisReservas';
import Planes from './pages/user/Planes';
import RegistroClub from './pages/user/RegistroClub';
import FormularioContacto from './pages/user/FormularioContacto';
import SeleccionUbicacion from './pages/user/SeleccionUbicacion';
import ActualizarPassword from './pages/user/ActualizarPassword';
import LoginCliente from './pages/user/LoginCliente';
import HeaderCliente from './pages/user/HeaderCliente';
import Buscar from './pages/user/Buscar';
import CiudadesPorProvincia from './pages/user/CiudadesPorProvincia';
import LoginAdmin from './pages/user/LoginAdmin';
import Privacidad from './pages/user/Privacidad'; 
import Terminos from './pages/user/Terminos';
import CookieBanner from './pages/user/CookieBanner';
import FAQ from './pages/user/FAQ';
import Funcionalidades from './pages/user/Funcionalidades';
import { AuthProvider } from './context/AuthProvider';
import RutaProtegida from './components/RutaProtegida';

// --- NUEVO COMPONENTE QUE ANIMA LAS RUTAS ---
function RutasAnimadas() {
  const location = useLocation();

  // Esto hace que cada vez que cambies de pantalla, el scroll vuelva arriba automáticamente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    // La clave 'key' hace que React reinicie la animación cada vez que cambia la URL
    <div key={location.pathname} className="animacion-cambio-pantalla">
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explorar/:provincia/:ciudad" element={<HomeUsuario />} /> 
        <Route path="/club/:id" element={<PerfilClub />} />
        <Route path="/reservar/:idCancha" element={<ReservaCancha />} />
        <Route path="/panel" element={<RutaProtegida rol="admin"><DashboardAdmin /></RutaProtegida>} />
        <Route path="/mis-reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/onboarding" element={<RegistroClub />} />
        <Route path="/contacto" element={<FormularioContacto />} />
        <Route path="/seleccionar-ubicacion" element={<SeleccionUbicacion />} />
        <Route path="/seleccionar-ubicacion/:provincia" element={<SeleccionUbicacion />} />
        <Route path="/registro-club" element={<RegistroClub />} />
        <Route path="/actualizar-password" element={<ActualizarPassword />} />
        <Route path="/login-cliente" element={<LoginCliente />} />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/explorar/:provincia" element={<CiudadesPorProvincia />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/funcionalidades" element={<Funcionalidades />} />
      </Routes>
    </div>
  );
}

// --- APP PRINCIPAL ---
function App() {
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