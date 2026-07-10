import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeUsuario from './pages/user/HomeUsuario';
import PerfilClub from './pages/user/PerfilClub'; 
import ReservaCancha from './pages/user/ReservaCancha';
import LandingPage from './pages/LandingPage';

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
        <Route 
          path="/dashboard" 
          element={
            <div style={{padding: '50px', textAlign: 'center'}}>
              <h2>¡Login Exitoso! 🔐</h2>
              <p>Autenticación funcionando. El dashboard lo armaremos después.</p>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;