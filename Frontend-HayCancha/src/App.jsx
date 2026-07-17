import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeUsuario from './pages/user/HomeUsuario';
import PerfilClub from './pages/user/PerfilClub'; 
import ReservaCancha from './pages/user/ReservaCancha';
import LandingPage from './pages/user/LandingPage'; 
import DashboardAdmin from './pages/user/DashboardAdmin';
import MisReservas from './pages/user/MisReservas';
import Planes from './pages/user/Planes';
import OnboardingClub from './pages/user/OnboardingClub';
import FormularioContacto from './pages/user/FormularioContacto';
import SeleccionUbicacion from './pages/user/SeleccionUbicacion';
import RegistroClub from './pages/user/RegistroClub';
import ActualizarPassword from './pages/user/ActualizarPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La puerta de entrada principal */}
        <Route path="/" element={<LandingPage />} />
        
        {/* La vista para el cliente que solo quiere reservar */}
        <Route path="/explorar/:provincia/:ciudad" element={<HomeUsuario />} /> 
        
        {/* Las rutas que ya tenías funcionando */}
        <Route path="/club/:id" element={<PerfilClub />} />
        <Route path="/reservar/:idCancha" element={<ReservaCancha />} />
        
        {/* Dashboard temporal para comprobar que el Login funciona */}
        <Route path="/panel" element={<DashboardAdmin />} />

        <Route path="/mis-reservas" element={<MisReservas />} />

        <Route path="/planes" element={<Planes />} />

        <Route path="/onboarding" element={<OnboardingClub />} />

        <Route path="/contacto" element={<FormularioContacto />} />

        <Route path="/seleccionar-ubicacion" element={<SeleccionUbicacion />} />

        <Route path="/dashboard" element={<RegistroClub />} />

        <Route path="/actualizar-password" element={<ActualizarPassword />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;