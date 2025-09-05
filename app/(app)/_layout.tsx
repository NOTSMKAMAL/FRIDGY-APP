// app/(app)/_layout.tsx

import { Redirect, Tabs, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // ⬅️ add this
import { auth } from '../../FirebaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AppLayout() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!checked) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            backgroundColor: '#181818',
            height: 60,
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarShowLabel: true,
          tabBarIcon: ({ color, size, focused }) => {
            let name: React.ComponentProps<typeof Ionicons>['name'] =
              'home-outline';
            if (route.name === 'fridge')
              name = focused ? 'home' : 'home-outline';
            if (route.name === 'camera') name = 'camera';
            if (route.name === 'list') name = focused ? 'list' : 'list-outline';
            if (route.name === 'settings')
              name = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tabs.Screen
          name="fridge"
          options={{ title: 'Home', tabBarLabel: 'Home' }}
        />

        {/* HIDE TAB BAR WHEN CAMERA IS FOCUSED */}
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
            tabBarLabel: 'Scanner',
            tabBarStyle: { display: 'none' }, // <- hides bottom tabs only on this screen
          }}
        />
        <Tabs.Screen
          name="list"
          options={{ title: 'List', tabBarLabel: 'List' }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarLabel: 'Settings' }}
        />
        <Tabs.Screen name="sections/id" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
