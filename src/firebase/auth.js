// src/firebase/auth.js
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './config';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleLogin = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '232995447268-bbgiu5h2lst0hv183cm2i7g2r5n75hu3.apps.googleusercontent.com',
    redirectUri: 'https://auth.expo.io/@yassine212/ktoubaty',
  });

  useEffect(() => {
    console.log('Auth response:', response);
    if (response?.type === 'success') {
      const { id_token } = response.params;
      console.log('Got ID token:', id_token ? 'present' : 'missing');
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        console.log('Created credential, signing in...');
        signInWithCredential(auth, credential)
          .then(() => console.log('Sign in successful'))
          .catch(error => console.error('Firebase sign in error:', error));
      } else {
        console.error('No ID token in response');
      }
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      console.error('Error params:', response.params);
    } else if (response) {
      console.log('Other response type:', response.type);
    }
  }, [response]);

  return { promptAsync, request };
};