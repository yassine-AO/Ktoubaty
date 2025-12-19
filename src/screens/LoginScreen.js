import { View, Button } from 'react-native';
import { useGoogleLogin } from '../firebase/googleAuth';

export default function LoginScreen() {
  const { handleGoogleLogin, request } = useGoogleLogin();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Connect with Google"
        disabled={!request}
        onPress={handleGoogleLogin}
      />
    </View>
  );
}