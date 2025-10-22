import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

import Constants from 'expo-constants';
const { auth0Domain, auth0ClientId, auth0Audience } = Constants.expoConfig?.extra!;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 👇 make sure to use Proxy (important for Expo Go)
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);

  console.log('Redirect URI:', redirectUri);

  const discovery = {
    authorizationEndpoint: `https://${auth0Domain}/authorize`,
    tokenEndpoint: `https://${auth0Domain}/oauth/token`,
    revocationEndpoint: `https://${auth0Domain}/v2/logout`,
  };

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
  {
    clientId: auth0ClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
    scopes: ['openid', 'profile', 'email'],
    extraParams: {
      audience: auth0Audience, // 👈 use your actual API Identifier
      prompt: 'login',
    },
  },
  discovery
);

  useEffect(() => {
    if (result?.type === 'success') {
      setAccessToken(result.params.access_token);
      console.log('✅ Access Token:', result.params.access_token);
    }
  }, [result]);

  const handleLogout = async () => {
    if (!accessToken) return;

    try {
      await fetch(discovery.revocationEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${auth0ClientId}&token=${accessToken}`,
      });
    } catch (err) {
      console.warn('Error revoking token:', err);
    }

    const logoutUrl = `https://${auth0Domain}/v2/logout?federated&client_id=${auth0ClientId}&returnTo=${encodeURIComponent(
      redirectUri
    )}`;

    await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
    setAccessToken(null);
    console.log('👋 User logged out.');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {!accessToken ? (
        <Button
          disabled={!request}
          title="Login with Auth0"
          onPress={() => promptAsync()}
        />
      ) : (
        <>
          <Text style={{ marginBottom: 20 }}>✅ Logged in!</Text>
          <Button title="Logout" onPress={handleLogout} />
        </>
      )}
    </View>
  );
}