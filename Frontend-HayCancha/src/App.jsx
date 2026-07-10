import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeUsuario from './pages/user/HomeUsuario';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal para los usuarios */}
        <Route path="/" element={<HomeUsuario />} />
        
        {/* Más adelante agregaremos las rutas de /login y /admin */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
