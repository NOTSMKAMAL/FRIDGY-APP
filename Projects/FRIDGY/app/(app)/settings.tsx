import React from 'react';
import { Text, View } from 'react-native';

const BACKGROUND_COLOR = '#960018'; // Use a palette color for consistency

export default function Settings() {
  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 40, fontWeight: 'bold', color: 'white', marginBottom: 20, letterSpacing: 1 }}>
        Settings
      </Text>
      <Text style={{ fontSize: 18, color: 'white', textAlign: 'center', lineHeight: 26 }}>
        Customize your experience
      </Text>
    </View>
  );
}
