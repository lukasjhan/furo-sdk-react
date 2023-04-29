// import Lock from 'browser-tabs-lock';
import axios from 'axios';
import { Buffer } from 'buffer';

axios.defaults.baseURL = 'https://api.furo.one';
const FURO_AUTH_URL = 'https://auth.furo.one';

export default class FuroClient {
  constructor(options) {
    this.domain = options.domain;
    this.clientId = options.client_id;
    this.redirectURI = options.redirect_uri;
    if (options.api_url) axios.defaults.baseURL = options.api_url;
  }

  async buildAuthorizeUrl(options) {
    const baseUrl = `${this.domain}/login/${this.clientId}`;
    if (this.redirectURI)
      return `${baseUrl}?redirect_uri=${encodeURIComponent(this.redirectURI)}`;
    else return baseUrl;
  }

  async getUser(options) {
    const accessToken = await localStorage.getItem(
      `furo-${this.clientId}-token`,
    );
    if (!accessToken) return null;

    const { data: user } = await axios.get(`/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return user;
  }

  async loginWithRedirect() {
    const url = await this.buildAuthorizeUrl();
    window.location.href = url;
  }

  async handleRedirectCallback(url = window.location.search) {
    const params = new URLSearchParams(url);
    const code = params.get('code');
    const response = await axios.post(`/sessions/code/authenticate`, { code });
    const { access_token: accessToken, refresh_token: refreshToken } =
      response.data;

    const base64Payload = accessToken.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64');
    const { pid } = JSON.parse(payload.toString());
    if (!pid || pid !== this.clientId) return null;

    await localStorage.setItem(`furo-${this.clientId}-token`, accessToken);
    await localStorage.setItem(`furo-${this.clientId}-refresh`, refreshToken);

    return {};
  }

  async checkSession(options) {
    return await sessionStorage.getItem(`furo-${this.clientId}-token`);
  }

  async getTokenSilently(options) {
    // 1. If there's a valid token stored, return it.
    // 2. If not, open an iframe with '/authorize' URL and get the new token
  }

  async refreshTokenSilently(options) {
    const refreshToken = await localStorage.getItem(
      `furo-${this.clientId}-refresh`,
    );
    if (!refreshToken) return null;
    const accessToken = await localStorage.getItem(
      `furo-${this.clientId}-token`,
    );
    const { data } = await axios.post(
      `/sessions/token/refresh`,
      {
        accessToken,
      },
      {
        headers: { Authorization: `Bearer ${refreshToken}` },
      },
    );
    const { access_token, refresh_token } = data;
    await localStorage.setItem(`furo-${this.clientId}-token`, access_token);
    await localStorage.setItem(`furo-${this.clientId}-refresh`, refresh_token);
    return { access_token, refresh_token };
  }

  async logout(options) {
    await localStorage.removeItem(`furo-${this.clientId}-token`);
    await localStorage.removeItem(`furo-${this.clientId}-refresh`);
    await localStorage.removeItem('furo-user');
    return {};
  }

  async loginWithKakao(KAKAO_REST_API_KEY) {
    if (!KAKAO_REST_API_KEY) throw 'API KEY is empty';
    const redirectUri = encodeURIComponent(
      `${FURO_AUTH_URL}/oauth/kakao/${this.clientId}`,
    );
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;
    window.location.href = url;
  }
}
