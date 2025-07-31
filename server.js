// const http = require('http');
// const { URL } = require('url');
// const crypto = require('crypto');
// const OAuth = require('./oauth-1.0a');

// const PORT = process.env.PORT || 3001;
// const FATSECRET_KEY = process.env.FATSECRET_KEY;
// const FATSECRET_SECRET = process.env.FATSECRET_SECRET;

// if (!FATSECRET_KEY || !FATSECRET_SECRET) {
//   console.error('FATSECRET_KEY and FATSECRET_SECRET env vars are required');
//   process.exit(1);
// }

// const oauth = new OAuth({
//   consumer: { key: FATSECRET_KEY, secret: FATSECRET_SECRET },
//   signature_method: 'HMAC-SHA1',
//   hash_function(base, key) {
//     return crypto.createHmac('sha1', key).update(base).digest('base64');
//   },
// });

// async function fatsecretRequest(params) {
//   const url = new URL('https://platform.fatsecret.com/rest/server.api');
//   Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
//   url.searchParams.append('format', 'json');
//   const requestData = { url: url.toString(), method: 'GET' };
//   const headers = oauth.toHeader(oauth.authorize(requestData));
//   const res = await fetch(requestData.url, { headers });
//   if (!res.ok) throw new Error(`FatSecret error: ${await res.text()}`);
//   return res.json();
// }

// async function getMacros(barcode) {
//   const find = await fatsecretRequest({ method: 'food.find_id_for_barcode', barcode });
//   const food_id = find?.food_id || find?.foods?.food?.food_id;
//   if (!food_id) throw new Error('Food not found');
//   const food = await fatsecretRequest({ method: 'food.get.v3', food_id });
//   const serving = Array.isArray(food?.food?.servings?.serving)
//     ? food.food.servings.serving[0]
//     : food?.food?.servings?.serving;
//   if (!serving) throw new Error('Serving data not found');
//   return {
//     protein: parseFloat(serving.protein) || 0,
//     fat: parseFloat(serving.fat) || 0,
//     carbohydrate: parseFloat(serving.carbohydrate) || 0,
//   };
// }

// const server = http.createServer(async (req, res) => {
//   try {
//     const url = new URL(req.url, `http://${req.headers.host}`);
//     if (req.method === 'GET' && url.pathname === '/fatsecret/food') {
//       const barcode = url.searchParams.get('barcode');
//       if (!barcode) {
//         res.writeHead(400, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ error: 'barcode query param required' }));
//         return;
//       }
//       const data = await getMacros(barcode);
//       res.writeHead(200, { 'Content-Type': 'application/json' });
//       res.end(JSON.stringify(data));
//     } else {
//       res.writeHead(404, { 'Content-Type': 'application/json' });
//       res.end(JSON.stringify({ error: 'Not Found' }));
//     }
//   } catch (err) {
//     res.writeHead(500, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({ error: err.message }));
//   }
// });

// server.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });

require('dotenv').config()
console.log(process.env.FATSECRET_CONSUMER_KEY)