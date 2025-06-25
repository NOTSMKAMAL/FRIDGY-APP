// app/(app)/home.tsx
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const BACKGROUND_COLOR = '#E86100'; // Use a palette color for consistency

export default function Home() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 40, fontWeight: 'bold', color: 'white', marginBottom: 20, letterSpacing: 1 }}>
        Home
      </Text>
      <Text style={{ fontSize: 18, color: 'white', textAlign: 'center', lineHeight: 26, marginBottom: 40 }}>
        Welcome{user?.email ? `, ${user.email}` : ''}!
      </Text>
      <Pressable
        onPress={handleLogout}
        style={{
          position: 'absolute',
          top: 60,
          right: 20,
          backgroundColor: 'rgba(255,255,255,0.9)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: '#E86100', fontWeight: 'bold' }}>Sign Out</Text>
      </Pressable>
    </View>
  );
}