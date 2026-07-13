import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';

const app = express();

// Permite que tu Frontend (React) se comunique con este Backend
app.use(cors());
app.use(express.json());

// 1. Inicializamos Mercado Pago con tu Access Token de PRUEBA
const client = new MercadoPagoConfig({ 
  accessToken: 'TEST-3361632835221668-071221-7b57a8f26a0cb6aeb756cbf780b235d5-495017115' 
});

// 2. Creamos la ruta que React va a llamar cuando alguien haga clic en "Comenzar"
app.post('/api/crear-suscripcion', async (req, res) => {
  const { plan, precio } = req.body; 

  try {
    const preApprovalPlan = new PreApprovalPlan(client);
    
    // Le pedimos a Mercado Pago que arme la suscripción automática
    const response = await preApprovalPlan.create({
      body: {
        reason: `Hay Cancha - Plan ${plan}`,
        auto_recurring: {
          frequency: 1, // Cobrar cada 1...
          frequency_type: 'months', // ...mes
          transaction_amount: precio, // El precio que nos manda React (15000 o 25000)
          currency_id: 'ARS' // Moneda: Pesos Argentinos
        },
        // Cuando el pago se apruebe, lo devolvemos a tu pantalla de configuración
        back_url: 'https://hay-cancha-xi.vercel.app/onboarding', 
      }
    });

    // 3. Le enviamos a React el link de la pasarela azul
    res.json({ linkPago: response.init_point });
    
  } catch (error) {
    console.error('Error en Mercado Pago:', error);
    res.status(500).json({ error: 'Fallo al crear la suscripción' });
  }
});

// Levantamos el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Backend escuchando en http://localhost:3000');
});