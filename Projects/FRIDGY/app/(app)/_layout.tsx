// app/(app)/_layout.tsx

import { Ionicons } from '@expo/vector-icons'; // Icon set for tab icons
import { Redirect, Tabs } from 'expo-router'; // Expo-Router components for tabs & redirects
import { onAuthStateChanged } from 'firebase/auth'; // Firebase listener for auth state
import { useEffect, useState } from 'react'; // React hooks
import { Platform } from 'react-native'; // Platform for OS-specific styling
import { auth } from '../../FirebaseConfig';

export default function AppLayout() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      setChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!checked) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          ...(Platform.OS === 'android' && { elevation: 8 }),
          ...(Platform.OS === 'ios' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }),
          height: 60,
        },
        tabBarActiveTintColor: '#E86100',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },
        animationEnabled: true,
        tabBarIcon: ({ color, size }) => {
          let name: React.ComponentProps<typeof Ionicons>['name'] = 'home-outline';
          if (route.name === 'fridge') name = 'fast-food-outline';
          if (route.name === 'recipes') name = 'book-outline';
          if (route.name === 'settings') name = 'settings-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="fridge" options={{ title: 'Fridge' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}