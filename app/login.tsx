import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { auth0Domain, auth0ClientId, auth0Audience, backEndAPI } = Constants.expoConfig?.extra!;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Email/password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState(''); // new field
  const [isVerificationStep, setIsVerificationStep] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);

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
        audience: auth0Audience,
        prompt: 'login',
        connection: 'google-oauth2',
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

  // Step 1: Request verification code
  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${backEndAPI}/auth/signup-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      await response.json();
      Alert.alert('Success', 'Verification code generated (check console for testing)');
      setIsVerificationStep(true); // move to verification step
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send verification code');
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    console.log('Verifying code:', code);

    const response = await fetch(`${backEndAPI}/auth/signup-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
    });

    // Check HTTP status
    if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Verification failed');
        return;
    }

    const data = await response.json();
    Alert.alert('Success', 'User created successfully');
  };

  return (
    <View style={styles.container}>
      {!accessToken ? (
        <>
          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.googleButton}
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <Text style={{ marginVertical: 20 }}>or sign up with email</Text>

          {!isVerificationStep ? (
            <>
              {/* Email Signup Fields */}
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
              <TextInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry
              />

              <TouchableOpacity style={styles.signupButton} onPress={handleEmailSignup}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Verification Code Field */}
              <TextInput
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                style={styles.input}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.signupButton} onPress={handleVerifyCode}>
                <Text style={styles.signupText}>Verify Code</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      ) : (
        <>
          <Text style={{ marginBottom: 20 }}>✅ Logged in!</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  googleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, elevation: 2 },
  buttonText: { fontSize: 16, color: '#000' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginVertical: 5 },
  signupButton: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginTop: 10 },
  signupText: { color: '#fff', fontSize: 16 },
  logoutButton: { backgroundColor: '#DB4437', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  logoutText: { color: '#fff', fontSize: 16 },
});