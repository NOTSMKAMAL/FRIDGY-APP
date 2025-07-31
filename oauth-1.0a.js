// class OAuth {
//     constructor(opts) {
//       this.consumer = opts.consumer;
//       this.signature_method = opts.signature_method || 'HMAC-SHA1';
//       this.nonce_length = opts.nonce_length || 32;
//       this.version = opts.version || '1.0';
//       this.parameter_seperator = opts.parameter_seperator || ', ';
//       this.hash_function = opts.hash_function;
//     }
  
//     authorize(request, token = {}) {
//       const oauth_data = {
//         oauth_consumer_key: this.consumer.key,
//         oauth_nonce: this.getNonce(),
//         oauth_signature_method: this.signature_method,
//         oauth_timestamp: this.getTimeStamp(),
//         oauth_version: this.version,
//       };
//       if (token.key) oauth_data.oauth_token = token.key;
//       oauth_data.oauth_signature = this.getSignature(request, token.secret, oauth_data);
//       return oauth_data;
//     }
  
//     toHeader(oauth_data) {
//       const sorted = Object.keys(oauth_data).filter(k => k.startsWith('oauth')).sort();
//       const header = 'OAuth ' + sorted.map(k => `${this.percentEncode(k)}="${this.percentEncode(oauth_data[k])}"`).join(this.parameter_seperator);
//       return { Authorization: header };
//     }
  
//     getBaseString(request, oauth_data) {
//       return [
//         request.method.toUpperCase(),
//         this.percentEncode(this.getBaseUrl(request.url)),
//         this.percentEncode(this.getParameterString(request, oauth_data)),
//       ].join('&');
//     }
  
//     getParameterString(request, oauth_data) {
//       const url = new URL(request.url);
//       const params = {};
//       url.searchParams.forEach((value, key) => { params[key] = value; });
//       Object.assign(params, oauth_data);
//       const sorted = Object.keys(params).sort().map(k => `${this.percentEncode(k)}=${this.percentEncode(params[k])}`);
//       return sorted.join('&');
//     }
  
//     getSigningKey(token_secret = '') {
//       return this.percentEncode(this.consumer.secret) + '&' + this.percentEncode(token_secret || '');
//     }
  
//     getSignature(request, token_secret, oauth_data) {
//       const baseString = this.getBaseString(request, oauth_data);
//       const signingKey = this.getSigningKey(token_secret);
//       return this.hash_function(baseString, signingKey);
//     }
  
//     getBaseUrl(url) {
//       const u = new URL(url);
//       return `${u.protocol}//${u.host}${u.pathname}`;
//     }
  
//     getNonce() {
//       return require('crypto').randomBytes(this.nonce_length / 2).toString('hex');
//     }
  
//     getTimeStamp() {
//       return Math.floor(Date.now() / 1000).toString();
//     }
  
//     percentEncode(str) {
//       return encodeURIComponent(str).replace(/[!*()']/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
//     }
//   }
  
//   module.exports = OAuth;