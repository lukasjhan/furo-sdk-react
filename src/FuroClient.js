// import Lock from 'browser-tabs-lock';
import axios from 'axios';
// import jsonwebtoken from 'jsonwebtoken';

const GET_TOKEN_SILENTLY_LOCK_KEY = 'furo.lock.getTokenSilently';
const BASE_URL = 'https://api.furo.one';

export default class FuroClient {
  constructor(options) {
    // typeof window !== 'undefined' && validateCrypto();\
    this.domain = options.domain;
    this.clientId = options.client_id;
    this.redirectURI = options.redirect_uri;
  }

  async buildAuthorizeUrl(options) {
    // const { redirect_uri, appState, ...authorizeOptions } = options;
    return `${this.domain}/login/${this.clientId}`;
  }

  async getUser(options) {
    // check if user exists in localstorage
    const accessToken = await localStorage.getItem('furo-token');

    // get user profile
    const { data: user } = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return user;
  }

  async loginWithRedirect() {
    const url = await this.buildAuthorizeUrl();
    window.location.href = url;
  }

  async handleRedirectCallback(url = window.location.search) {
    // 1. check params
    const params = new URLSearchParams(url);
    const code = params.get('code');
    const uid = params.get('uid');

    // if (!code || !uid)
    //   throw `Missing ${!code && 'code'} ${!code && !uid && '/'} ${
    //     !uid && 'UID'
    //   }`;

    console.log(code, uid);

    // 2. Call to get tokens (accessToken, refreshToken)
    // const { accessToken, refreshToken } = await axios.post(`${baseURL}/oauth/token`)
    const accessToken = code;
    // 3. Save them to storage
    await localStorage.setItem('furo-token', accessToken);

    return {};
  }

  async checkSession(options) {
    // check if the storage has
  }

  async getTokenSilently(options) {
    // 1. If there's a valid token stored, return it.
    // 2. If not, open an iframe with '/authorize' URL and get the new token
  }

  async logout(options) {
    await localStorage.removeItem('furo-token');
    await localStorage.removeItem('furo-user');
    return {};
  }
}

// --------UTILS------

// export const getCrypto = () => {
//     //ie 11.x uses msCrypto
//     return (window.crypto || (window as any).msCrypto) as Crypto;
//   };

//   export const validateCrypto = () => {
//     if (!getCrypto()) {
//       throw new Error(
//         'For security reasons, `window.crypto` is required to run `auth0-spa-js`.'
//       );
//     }
//     if (typeof getCryptoSubtle() === 'undefined') {
//       throw new Error(`
//         auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.
//       `);
//     }
//   };
