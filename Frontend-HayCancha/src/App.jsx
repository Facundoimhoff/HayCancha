import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeUsuario from './pages/user/HomeUsuario';
import PerfilClub from './pages/user/PerfilClub'; 
import ReservaCancha from './pages/user/ReservaCancha';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
  {/* La nueva puerta de entrada */}
  <Route path="/" element={<LandingPage />} />
  
  {/* Movemos la vista de cliente a /home */}
  <Route path="/home" element={<HomeUsuario />} /> 
  
  {/* Las rutas que ya tenías */}
  <Route path="/club/:id" element={<PerfilClub />} />
  <Route path="/reservar/:idCancha" element={<ReservaCancha />} />
  
  {/* Preparamos el terreno para el paso que sigue */}
  <Route path="/dashboard" element={<div style={{padding: '50px', textAlign: 'center'}}><h2>¡Bienvenido al Panel de Control!</h2><p>Acá armaremos las métricas.</p></div>} />
</Routes>
    </BrowserRouter>
  );
}

export default App;
