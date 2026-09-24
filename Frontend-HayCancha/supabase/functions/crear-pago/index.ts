import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// NOTA: el frontend actual no invoca esta función (el flujo real usa el backend Express + PreApproval).
// Se mantiene endurecida por si se reactiva; si no se va a usar, conviene eliminarla del proyecto.

// Orígenes permitidos (secret ALLOWED_ORIGINS="https://a.com,https://b.com"; por defecto solo el sitio propio)
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://gridplay-x.vercel.app')
  .split(',')
  .map((o) => o.trim())

const FRONTEND_URL = allowedOrigins[0]

const buildCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
})

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'))

  // Manejar el chequeo de seguridad del navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Requiere un usuario autenticado (config.toml también exige verify_jwt = true)
  if (!req.headers.get('authorization')?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  try {
    // Sacamos tu clave secreta de la bóveda de Supabase
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpAccessToken) throw new Error('Configuración de pagos incompleta')

    // El precio está fijo en el servidor: no se lee nada del body
    const body = {
      items: [
        {
          title: 'Plan Full - GridPlay',
          unit_price: 15,
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      statement_descriptor: "GRIDPLAY", // <-- Esto aparece en el resumen de la tarjeta
      back_urls: {
        success: `${FRONTEND_URL}/panel`, // Vuelve a su panel
        failure: `${FRONTEND_URL}/planes`,
        pending: `${FRONTEND_URL}/planes`
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
    if (!response.ok || !data.init_point) throw new Error('No se pudo crear el link de pago')

    // Le devolvemos el link a tu React al instante
    return new Response(
      JSON.stringify({ init_point: data.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // El detalle queda en los logs de la función; al cliente solo un mensaje genérico
    console.error('crear-pago:', error)
    return new Response(JSON.stringify({ error: 'No se pudo procesar el pago' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
