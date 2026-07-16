import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Esto es fundamental para que React no bloquee la conexión (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar el chequeo de seguridad del navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Sacamos tu clave secreta de la bóveda de Supabase
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')

    // Armamos la orden de compra de $15
    const body = {
      items: [
        {
          title: 'Plan Full - Hay Cancha',
          unit_price: 15,
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      statement_descriptor: "HAYCANCHA", // <-- Esto aparece en el resumen de la tarjeta
      back_urls: {
        success: "https://hay-cancha-xi.vercel.app/dashboard", // Vuelve a su panel
        failure: "https://hay-cancha-xi.vercel.app/planes",
        pending: "https://hay-cancha-xi.vercel.app/planes"
      },
      auto_return: "approved",
    }

    // Le pedimos el link a Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    // Le devolvemos el link a tu React al instante
    return new Response(
      JSON.stringify({ init_point: data.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})