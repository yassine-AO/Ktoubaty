import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Colors per tab when active
          if (route.name === 'Home') {
            const colorActive = focused ? '#f59e0b' : '#9ca3af'; // yellow when active
            return <Ionicons name={iconName} size={focused ? 26 : 22} color={colorActive} />;
          }

          if (route.name === 'Search') {
            const colorActive = focused ? '#2563eb' : '#9ca3af'; // blue when active
            return <Ionicons name={iconName} size={focused ? 26 : 22} color={colorActive} />;
          }

          if (route.name === 'Favorites') {
            const colorActive = focused ? '#ef4444' : '#9ca3af'; // red when active
            return <Ionicons name={iconName} size={focused ? 26 : 22} color={colorActive} />;
          }

          // Profile: slightly move up when active
          const profColor = focused ? '#10b981' : '#9ca3af';
          return (
            <View style={focused ? { transform: [{ translateY: -4 }] } : {}}>
              <Ionicons name={iconName} size={focused ? 26 : 22} color={profColor} />
            </View>
          );
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          backgroundColor: '#ffffff',
          borderRadius: 18,
          height: 72,
          paddingVertical: 6,
          borderTopWidth: 0,
          elevation: 14,
          shadowColor: '#0b1724',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
          alignItems: 'center',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}