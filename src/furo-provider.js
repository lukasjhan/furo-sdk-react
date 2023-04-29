import React, { useState, useEffect, useReducer, useCallback } from 'react';
import FuroClient from './FuroClient';
import FuroContext from './furo-context';
import { reducer as FuroReducer, initialState } from './reducer';
import { hasAuthParams } from './utils';
import { Buffer } from 'buffer';

const defaultOnRedirectCallback = (appState, opts) => {
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname,
  );

  window.location.href = opts.redirectUri;
};

const toFuroClientOptions = (opts) => {
  const { clientId, redirectUri, apiUrl, maxAge, ...validOpts } = opts;
  return {
    ...validOpts,
    client_id: clientId,
    redirect_uri: redirectUri,
    api_url: apiUrl,
    max_age: maxAge,
    furoClient: {
      name: 'furo-react',
    },
  };
};

const toFuroLoginRedirectOptions = (opts) => {
  return opts;
};

const FuroProvider = (opts) => {
  const {
    children,
    skipRedirectCallback,
    onRedirectCallback = defaultOnRedirectCallback,
    ...clientOpts
  } = opts;
  const [client] = useState(
    () => new FuroClient(toFuroClientOptions(clientOpts)),
  );
  const [state, dispatch] = useReducer(FuroReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        if (hasAuthParams() && !skipRedirectCallback) {
          await client.handleRedirectCallback();
          onRedirectCallback({}, opts);
        } else {
          console.log(`Getting token from storage... Checking Sessions`);
        }
        const user = await client.getUser();
        if (!user) logout();
        dispatch({ type: 'INITIALISED', user });
      } catch (error) {
        console.error(error);
        try {
          const { access_token, refresh_token } =
            await client.refreshTokenSilently();
          if (access_token && refresh_token) init();
        } catch (error) {
          dispatch({ type: 'ERROR', error: error });
        }
      }
    };
    init();
  }, [client, onRedirectCallback, skipRedirectCallback]);

  const buildAuthorizeUrl = useCallback(
    (opts) => client.buildAuthorizeUrl(toFuroLoginRedirectOptions(opts)),
    [client],
  );

  const buildLogoutUrl = useCallback(
    (opts) => client.buildLogoutUrl(opts),
    [client],
  );

  const loginWithRedirect = useCallback(
    (opts) => client.loginWithRedirect(toFuroLoginRedirectOptions(opts)),
    [client],
  );

  const loginWithKakao = useCallback(
    (opts) => client.loginWithKakao(toFuroLoginRedirectOptions(opts)),
    [client],
  );

  const refreshTokenSilently = useCallback(
    (opts) => client.refreshTokenSilently(toFuroLoginRedirectOptions(opts)),
    [client],
  );

  const logout = useCallback(
    (opts) => {
      localStorage.removeItem('furo-user');
      localStorage.removeItem(`furo-${client.clientId}-token`);
      sessionStorage.removeItem(`furo-${client.clientId}-token`);
      dispatch({ type: 'LOGOUT' });
    },
    [client],
  );

  const getAccessTokenSilently = useCallback(
    async (opts, config) => {
      const token = await localStorage.getItem(`furo-${client.clientId}-token`);
      const payloadBase64 = token.split('.')[1];
      const decodedJson = Buffer.from(payloadBase64, 'base64').toString();
      const decoded = JSON.parse(decodedJson);
      const exp = decoded.exp;
      if (!exp) return token;
      const expired = Date.now() >= exp * 1000;
      if (!expired) return token;
      else {
        const { access_token: token } = await refreshTokenSilently();
        return token;
      }
    },
    [client],
  );

  const handleRedirectCallback = useCallback(
    async (url) => {
      try {
        return await client.handleRedirectCallback(url);
      } catch (error) {
        throw error;
      } finally {
        dispatch({
          type: 'HANDLE_REDIRECT_COMPLETE',
          user: await client.getUser(),
        });
      }
    },
    [client],
  );

  return (
    <FuroContext.Provider
      value={{
        ...state,
        buildAuthorizeUrl,
        buildLogoutUrl,
        getAccessTokenSilently,
        refreshTokenSilently,
        loginWithRedirect,
        loginWithKakao,
        logout,
        handleRedirectCallback,
      }}
    >
      {children}
    </FuroContext.Provider>
  );
};

export default FuroProvider;
