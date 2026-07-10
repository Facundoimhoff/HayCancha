import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeUsuario from './pages/user/HomeUsuario';
import PerfilClub from './pages/user/PerfilClub'; // <-- IMPORTAMOS LA PANTALLA

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeUsuario />} />
        
        {/* <-- AGREGAMOS LA RUTA CON EL PARÁMETRO DINÁMICO :id --> */}
        <Route path="/club/:id" element={<PerfilClub />} /> 
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
