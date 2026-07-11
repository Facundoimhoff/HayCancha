import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeUsuario from './pages/user/HomeUsuario';
import PerfilClub from './pages/user/PerfilClub'; 
import ReservaCancha from './pages/user/ReservaCancha';
import LandingPage from './pages/user/LandingPage'; 
import DashboardAdmin from './pages/user/DashboardAdmin';
import MisReservas from './pages/user/MisReservas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La puerta de entrada principal */}
        <Route path="/" element={<LandingPage />} />
        
        {/* La vista para el cliente que solo quiere reservar */}
        <Route path="/home" element={<HomeUsuario />} /> 
        
        {/* Las rutas que ya tenías funcionando */}
        <Route path="/club/:id" element={<PerfilClub />} />
        <Route path="/reservar/:idCancha" element={<ReservaCancha />} />
        
        {/* Dashboard temporal para comprobar que el Login funciona */}
        <Route path="/dashboard" element={<DashboardAdmin />} />

        <Route path="/mis-reservas" element={<MisReservas />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;