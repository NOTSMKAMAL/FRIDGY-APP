// app/api/fatsecret.ts
// import OAuth from 'oauth-1.0a';
// import CryptoJS from 'crypto-js';

// // Your FatSecret consumer key & secret (from your developer dashboard)
// const CONSUMER_KEY    = process.env.FATSECRET_CONSUMER_KEY!;
// const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET!;

// // Base URLs
// const BASE_BARCODE_URL = 'https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1';
// const BASE_FOOD_URL    = 'https://platform.fatsecret.com/rest/food/v4';
// const FORMAT           = 'json';

// /**
//  * Create an OAuth1.0a client per RFC5849 § 3.1
//  */
// const oauth = new OAuth({
//   consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
//   signature_method: 'HMAC-SHA1',
//   hash_function(baseString: string, key: string) {
//     // HMAC-SHA1 and output Base64, per § 3.4.2
//     return CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64);
//   },
// });

// /**
//  * Build the `Authorization` header for a GET request
//  */
// function buildAuthHeader(url: string, params: Record<string,string>) {
//   // oauth.authorize will include: oauth_consumer_key, oauth_nonce, oauth_signature_method,
//   // oauth_timestamp, oauth_version, and oauth_signature — everything RFC 5849 § 3.1 demands.
//   const requestData = { url, method: 'GET', data: params };
//   const oauthData = oauth.authorize(requestData);
//   return oauth.toHeader(oauthData);
// }

// /**
//  * 1️⃣ Find the FatSecret food_id for a barcode
//  */
// export async function findFoodIdByBarcode(barcode: string): Promise<string> {
//   // ensure a 13-digit GTIN-13
//   const upc13 = barcode.padStart(13, '0');
//   const query = { barcode: upc13, format: FORMAT };
//   const url   = `${BASE_BARCODE_URL}?${new URLSearchParams(query)}`;

//   const headers = {
//     ...buildAuthHeader(BASE_BARCODE_URL, query)
//   };

//   const res = await fetch(url, { headers });
//   if (!res.ok) {
//     throw new Error(`Barcode lookup failed (${res.status})`);
//   }
//   const json = await res.json();
//   if (!json.food_id) {
//     throw new Error('No food_id returned for this barcode');
//   }
//   return json.food_id as string;
// }

// /**
//  * 2️⃣ Fetch full nutrition info by food_id
//  */
// export async function getFoodById(foodId: string): Promise<any> {
//   const query = { food_id: foodId, format: FORMAT };
//   const url   = `${BASE_FOOD_URL}?${new URLSearchParams(query)}`;

//   const headers = {
//     ...buildAuthHeader(BASE_FOOD_URL, query)
//   };

//   const res = await fetch(url, { headers });
//   if (!res.ok) {
//     throw new Error(`Food lookup failed (${res.status})`);
//   }
//   const json = await res.json();
//   return json.food;
// }
// app/api/fatsecret.ts
// -------------------------------------------------------///---//////-/-/--/-/---/--/---//-/--/-/--//--/-/--/-//-/-------/
import Constants from 'expo-constants';

// Get environment variables from Expo Constants
const CONSUMER_KEY =
  Constants.expoConfig?.extra?.FATSECRET_CONSUMER_KEY ||
  process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET =
  Constants.expoConfig?.extra?.FATSECRET_CONSUMER_SECRET ||
  process.env.FATSECRET_CONSUMER_SECRET;

// Immediately verify:
console.log('[FatSecret] key', CONSUMER_KEY); // should print a 32-char string

import CryptoJS from 'crypto-js';
import OAuth from 'oauth-1.0a';

/* ---------- constants ---------- */
const BASE_BARCODE_URL =
  'https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1';
const BASE_FOOD_URL = 'https://platform.fatsecret.com/rest/food/v4';
const FORMAT = 'json';

/* ---------- OAuth helper ---------- */
const oauth = new OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(base, key) {
    return CryptoJS.HmacSHA1(base, key).toString(CryptoJS.enc.Base64);
  },
});

function buildSignedParams(url: string, params: Record<string, string>) {
  const signed = oauth.authorize({ url, method: 'GET', data: params });
  return {
    ...params,
    ...Object.fromEntries(
      Object.entries(signed).map(([k, v]) => [k, String(v)]),
    ),
  };
}

/* ---------- helpers ---------- */
function normalizeToGtin13(code: string) {
  const d = code.replace(/\D/g, '');
  if (d.length === 13) return d;
  if (d.length === 12) return '0' + d;
  if (d.length === 8) return d.padStart(13, '0');
  throw new Error('Unsupported barcode length');
}

/* ---------- API calls ---------- */
export async function findFoodIdByBarcode(
  rawCode: string,
  region: string,
  language?: string,
) {
  const barcode = normalizeToGtin13(rawCode);
  const q: Record<string, string> = { barcode, format: FORMAT, region };
  if (language) q.language = language;

  const url = `${BASE_BARCODE_URL}?${new URLSearchParams(buildSignedParams(BASE_BARCODE_URL, q))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);

  const json = (await res.json()) as { food_id?: { value: string } };
  return json.food_id?.value ?? null;
}

export async function getFoodById(
  foodId: string,
  region: string,
  language?: string,
) {
  const q: Record<string, string> = { food_id: foodId, format: FORMAT, region };
  if (language) q.language = language;

  const url = `${BASE_FOOD_URL}?${new URLSearchParams(buildSignedParams(BASE_FOOD_URL, q))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);

  return (await res.json()).food;
}
