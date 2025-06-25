import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect anyone hitting “/” into your auth flow
  return <Redirect href="/(auth)/login" />;
}