/* FatSecretRFC5849Probe.ts ----------------------------------------------- */
import Constants from 'expo-constants';

// Get environment variables from Expo Constants
const CONSUMER_KEY =
  Constants.expoConfig?.extra?.FATSECRET_CONSUMER_KEY ||
  process.env.FATSECRET_CONSUMER_KEY;
const CONSUMER_SECRET =
  Constants.expoConfig?.extra?.FATSECRET_CONSUMER_SECRET ||
  process.env.FATSECRET_CONSUMER_SECRET;

import CryptoJS from 'crypto-js';
import OAuth from 'oauth-1.0a';

const BASE = 'https://platform.fatsecret.com';
const PATH = '/rest/food/barcode/find-by-id/v1';
const REGION = 'US'; // <– change to 'GB','DE',… for other samples
const FORMAT = 'json';

/* ---------- OAuth 1.0a client (RFC 5849 § 3.1) ---------- */
const oauth = new OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    // RFC 5849 § 3.4.2: signature = Base64( HMAC-SHA1( key, baseString ) )
    return CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64);
  },
});

/* ---------- helper: make GTIN-13 ---------- */
function toGtin13(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 13) return d;
  if (d.length === 12) return '0' + d; // UPC-A
  if (d.length === 8) return d.padStart(13, '0'); // EAN-8
  throw new Error(`Unsupported length ${d.length}`);
}

/* ---------- build signed URL (all oauth_* params in query) ---------- */
function signedURL(path: string, params: Record<string, string>) {
  const url = BASE + path;
  const oauthParams = oauth.authorize({ url, method: 'GET', data: params });
  const merged = {
    ...params,
    ...Object.fromEntries(
      Object.entries(oauthParams).map(([k, v]) => [k, String(v)]),
    ),
  };
  return `${url}?${new URLSearchParams(merged)}`;
}

/* ---------- PROBE ------------------------------------------------------- */
export async function probe(
  rawBarcode = '0049000050103', // default FatSecret US demo
  region = REGION,
  language = '',
) {
  const barcode = toGtin13(rawBarcode);

  const q: Record<string, string> = { barcode, format: FORMAT, region };
  if (language) q.language = language;

  const url = signedURL(PATH, q);
  console.log('▶️  GET', url);

  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log('📦 Raw FatSecret JSON', JSON.stringify(json, null, 2));

    if (json.food_id?.value && json.food_id.value !== '0') {
      console.log('✅ Success! food_id =', json.food_id.value);
    } else if (json.error) {
      console.warn(`❌ Error ${json.error.code}: ${json.error.message}`);
      /* 🔑 common messages
           5  Invalid consumer key        » check @env import
           14 Missing scope "barcode"     » key not provisioned for barcodes
           1  No food found for barcode   » barcode unknown in that region      */
    } else {
      console.warn('⚠️  Returned food_id 0 → no match in DB');
    }
  } catch (e) {
    console.error('Network / parsing error', e);
  }
}
