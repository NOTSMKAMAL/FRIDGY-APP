import { Redirect } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { auth } from '../FirebaseConfig';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      setChecked(true);
    });
    return unsubscribe;
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#960018" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(app)/fridge" />;
  }
  return <Redirect href="/(auth)/login" />;
} 