import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeUsuario from './pages/user/HomeUsuario';
import PerfilClub from './pages/user/PerfilClub'; 
import ReservaCancha from './pages/user/ReservaCancha';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeUsuario />} />
        
        {/* <-- AGREGAMOS LA RUTA CON EL PARÁMETRO DINÁMICO :id --> */}
        <Route path="/club/:id" element={<PerfilClub />} /> 

        <Route path="/reservar/:idCancha" element={<ReservaCancha />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
