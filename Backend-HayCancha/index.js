import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';

const app = express();

app.use(cors());
app.use(express.json());

// 1. Usamos process.env para que la clave sea secreta y no esté escrita en el código
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

app.post('/api/crear-suscripcion', async (req, res) => {
  const { plan, precio } = req.body; 

  try {
    const preApprovalPlan = new PreApprovalPlan(client);
    
    const response = await preApprovalPlan.create({
      body: {
        reason: `Hay Cancha - Plan ${plan}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: precio,
          currency_id: 'ARS'
        },
        // 2. Usamos una variable para que cambie según donde estés
        back_url: process.env.FRONTEND_URL || 'http://localhost:5173/onboarding', 
      }
    });

    res.json({ linkPago: response.init_point });
    
  } catch (error) {
    console.error('Error en Mercado Pago:', error);
    res.status(500).json({ error: 'Fallo al crear la suscripción' });
  }
});

app.get('/api/buscar', async (req, res) => {
  // 1. Atrapamos la palabra que el usuario buscó en el frontend (ej: "San Francisco")
  const palabraBuscada = req.query.q;

  /* 
    2. Acá más adelante vas a hacer las consultas reales a tu base de datos (schema.sql)
    Ejemplo: SELECT * FROM clubes WHERE nombre LIKE '%palabraBuscada%';
  */

  // 3. Por ahora, le devolvemos tu JSON de prueba para que el frontend funcione y renderice las tarjetas
  const respuesta = {
    clubes: [
      { id: 1, nombre: "Sport Automovil Club", ciudad: "San Francisco", deporte: "Tenis y Pádel" }
    ],
    ciudades: [
      { id: 10, nombre: "San Francisco", provincia: "Córdoba" }
    ],
    provincias: []
  };

  // Enviamos el JSON al frontend
  res.json(respuesta);
});

// --- NUEVA RUTA: DETALLES Y HORARIOS DEL CLUB ---
app.get('/api/clubes/:id', async (req, res) => {
  const clubId = parseInt(req.params.id);

  try {
    // Simulamos la respuesta de la base de datos para ese club en específico
    const clubData = {
      id: clubId,
      nombre: clubId === 1 ? "Sport Automovil Club" : "Grid Pádel Center",
      ciudad: clubId === 1 ? "San Francisco" : "Córdoba Capital",
      direccion: "Av. Principal 1234",
      deporte: "Tenis y Pádel",
      // Simulamos las canchas y los turnos de ese día
      canchas: [
        {
          id: 101,
          nombre: "Cancha 1 - Blindex",
          superficie: "Césped Sintético",
          horarios: [
            { id: 1, hora: "18:00", disponible: false, precio: 8000 },
            { id: 2, hora: "19:30", disponible: true, precio: 8000 },
            { id: 3, hora: "21:00", disponible: true, precio: 8000 }
          ]
        },
        {
          id: 102,
          nombre: "Cancha 2 - Muro",
          superficie: "Cemento",
          horarios: [
            { id: 4, hora: "18:00", disponible: true, precio: 6000 },
            { id: 5, hora: "19:30", disponible: false, precio: 6000 },
            { id: 6, hora: "21:00", disponible: true, precio: 6000 }
          ]
        }
      ]
    };

    // Le devolvemos el JSON al frontend
    res.json(clubData);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos del club" });
  }
});

// 3. Render nos asigna el puerto automáticamente, por eso usamos process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});