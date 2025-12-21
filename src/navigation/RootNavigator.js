import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppNavigator from './AppNavigator';
import BookDetailScreen from '../screens/BookDetailScreen';
import CreateBookScreen from '../screens/CreateBookScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={AppNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Détails du livre' }} />
      <Stack.Screen name="CreateBook" component={CreateBookScreen} options={{ title: 'Créer un livre' }} />
    </Stack.Navigator>
  );
}
