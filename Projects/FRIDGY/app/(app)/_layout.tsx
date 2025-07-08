// app/(app)/_layout.tsx

import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { auth } from '../../FirebaseConfig';

export default function AppLayout() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

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
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarShowLabel: true,
        tabBarIcon: ({ color, size, focused }) => {
          let name: React.ComponentProps<typeof Ionicons>['name'] = 'home-outline';
          if (route.name === 'fridge') name = focused ? 'home' : 'home-outline';
          if (route.name === 'recipes') name = focused ? 'book' : 'book-outline';
          if (route.name === 'camera') name = 'add';
          if (route.name === 'settings') name = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
        <Tabs.Screen 
          name="fridge" 
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
          }}
        />
        <Tabs.Screen 
          name="recipes" 
          options={{
            title: 'Recipes',
            tabBarLabel: 'Recipes',
          }}
        />
        <Tabs.Screen 
          name="camera" 
          options={{
            title: 'Camera',
            tabBarLabel: 'Add',
          }}
        />
        <Tabs.Screen 
          name="settings" 
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
          }}
        />
      </Tabs>
  );
}