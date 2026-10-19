// Convierte el token corto del Explorador de la API Graph en las dos credenciales que usa el workflow:
// IG_USER_ID y un IG_ACCESS_TOKEN de página que no vence. Lo corrés vos en tu compu; no se guarda nada.
//
//   META_APP_ID=... META_APP_SECRET=... TOKEN_CORTO=... node marketing/instagram/obtener-credenciales.mjs
//
// (En PowerShell: $env:META_APP_ID="..."; $env:META_APP_SECRET="..."; $env:TOKEN_CORTO="..."; node marketing/instagram/obtener-credenciales.mjs)
const API = 'https://graph.facebook.com/v23.0';
const { META_APP_ID, META_APP_SECRET, TOKEN_CORTO } = process.env;
if (!META_APP_ID || !META_APP_SECRET || !TOKEN_CORTO) {
  console.error('Faltan META_APP_ID, META_APP_SECRET o TOKEN_CORTO (ver marketing/instagram/LEEME.md).');
  process.exit(1);
}

async function get(ruta, params) {
  const respuesta = await fetch(`${API}${ruta}?${new URLSearchParams(params)}`);
  const datos = await respuesta.json();
  if (datos.error) throw new Error(datos.error.message);
  return datos;
}

const { access_token: tokenLargo } = await get('/oauth/access_token', {
  grant_type: 'fb_exchange_token', client_id: META_APP_ID, client_secret: META_APP_SECRET, fb_exchange_token: TOKEN_CORTO,
});
const { data: paginas = [] } = await get('/me/accounts', {
  fields: 'name,access_token,instagram_business_account{id,username}', access_token: tokenLargo,
});
const conInstagram = paginas.filter((p) => p.instagram_business_account);
if (!conInstagram.length) {
  console.error('Ninguna de tus páginas de Facebook tiene una cuenta de Instagram profesional vinculada.');
  process.exit(1);
}
for (const p of conInstagram) {
  console.log(`\nPágina "${p.name}" → Instagram @${p.instagram_business_account.username}`);
  console.log(`  IG_USER_ID      = ${p.instagram_business_account.id}`);
  console.log(`  IG_ACCESS_TOKEN = ${p.access_token}`);
}
console.log('\nCopiá los dos valores de @gridplay.app en GitHub → Settings → Secrets and variables → Actions. No los compartas con nadie.');
