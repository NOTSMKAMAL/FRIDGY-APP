// app/api/fatsecret.ts
import OAuth from 'oauth-1.0a';
import CryptoJS from 'crypto-js';

// Your FatSecret consumer key & secret (from your developer dashboard)
const CONSUMER_KEY    = process.env.FATSECRET_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET!;

// Base URLs
const BASE_BARCODE_URL = 'https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1';
const BASE_FOOD_URL    = 'https://platform.fatsecret.com/rest/food/v4';
const FORMAT           = 'json';

/**
 * Create an OAuth1.0a client per RFC5849 § 3.1
 */
const oauth = new OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString: string, key: string) {
    // HMAC-SHA1 and output Base64, per § 3.4.2
    return CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64);
  },
});

/**
 * Build the `Authorization` header for a GET request
 */
function buildAuthHeader(url: string, params: Record<string,string>) {
  // oauth.authorize will include: oauth_consumer_key, oauth_nonce, oauth_signature_method,
  // oauth_timestamp, oauth_version, and oauth_signature — everything RFC 5849 § 3.1 demands.
  const requestData = { url, method: 'GET', data: params };
  const oauthData = oauth.authorize(requestData);
  return oauth.toHeader(oauthData);
}

/**
 * 1️⃣ Find the FatSecret food_id for a barcode
 */
export async function findFoodIdByBarcode(barcode: string): Promise<string> {
  // ensure a 13-digit GTIN-13
  const upc13 = barcode.padStart(13, '0');
  const query = { barcode: upc13, format: FORMAT };
  const url   = `${BASE_BARCODE_URL}?${new URLSearchParams(query)}`;

  const headers = { 
    ...buildAuthHeader(BASE_BARCODE_URL, query) 
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Barcode lookup failed (${res.status})`);
  }
  const json = await res.json();
  if (!json.food_id) {
    throw new Error('No food_id returned for this barcode');
  }
  return json.food_id as string;
}

/**
 * 2️⃣ Fetch full nutrition info by food_id
 */
export async function getFoodById(foodId: string): Promise<any> {
  const query = { food_id: foodId, format: FORMAT };
  const url   = `${BASE_FOOD_URL}?${new URLSearchParams(query)}`;
  
  const headers = { 
    ...buildAuthHeader(BASE_FOOD_URL, query) 
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Food lookup failed (${res.status})`);
  }
  const json = await res.json();
  return json.food;
}
