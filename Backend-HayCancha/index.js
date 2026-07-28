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

// 3. Render nos asigna el puerto automáticamente, por eso usamos process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});