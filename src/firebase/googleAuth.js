import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './config';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleLogin = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '232995447268-gn72trp95juo87vnlan8sd63abu208ch.apps.googleusercontent.com',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'ktoubaty',
    }),
  });

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { id_token } = result.params;
        if (id_token) {
          const credential = GoogleAuthProvider.credential(id_token);
          const userCredential = await signInWithCredential(auth, credential);
          console.log('Firebase sign in successful:', userCredential.user.email);
          return { success: true, user: userCredential.user };
        }
      } else if (result.type === 'error') {
        console.error('Auth error:', result.error);
        Alert.alert('Google login error', result.error);
      }
      
      return { success: false, error: result.type };
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Google login error', error.message);
      return { success: false, error };
    }
  };

  return { handleGoogleLogin, request };
};
