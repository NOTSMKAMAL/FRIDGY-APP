import React from 'react';
import { Text, View } from 'react-native';

const BACKGROUND_COLOR = '#196000'; // Use a palette color for consistency

export default function Fridge() {
  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 40, fontWeight: 'bold', color: 'white', marginBottom: 20, letterSpacing: 1 }}>
        Your Fridge
      </Text>
      <Text style={{ fontSize: 18, color: 'white', textAlign: 'center', lineHeight: 26 }}>
        Manage your ingredients here
      </Text>
    </View>
  );
}
