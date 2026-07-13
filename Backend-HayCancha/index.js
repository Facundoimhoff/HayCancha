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

// 3. Render nos asigna el puerto automáticamente, por eso usamos process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});