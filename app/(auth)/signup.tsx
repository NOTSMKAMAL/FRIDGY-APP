// app/(auth)/SignUp.tsx

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ Use YOUR initialized Firebase auth instance
import { auth } from '../../FirebaseConfig';

// Google Auth Session
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const COLORS = [
  '#660033',
  '#702963',
  '#7A3803',
  '#545F4C',
  '#06402B',
  '#5D6E74',
  '#005F84',
  '#293570',
];

function lerpColor(a: string, b: string, t: number) {
  const ah = a.replace('#', '');
  const bh = b.replace('#', '');
  const ar = parseInt(ah.substring(0, 2), 16);
  const ag = parseInt(ah.substring(2, 4), 16);
  const ab = parseInt(ah.substring(4, 6), 16);
  const br = parseInt(bh.substring(0, 2), 16);
  const bg = parseInt(bh.substring(2, 4), 16);
  const bb = parseInt(bh.substring(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b_ = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b_.toString(16).padStart(2, '0')}`;
}

export default function SignUp() {
  const anim = useRef(new Animated.Value(0)).current;
  const { height: H, width: W } = useWindowDimensions();
  const router = useRouter();

  // ----- state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [gradientColors, setGradientColors] = useState<string[]>([
    COLORS[0],
    COLORS[1],
  ]);
  const [error, setError] = useState<string | null>(null);

  // ----- Google auth request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId:
      '23914527840-03b9o8mo1etecj3jal3d3540jo7rdoud.apps.googleusercontent.com', // ✅ your iOS ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // ← replace
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // ← replace
    redirectUri: makeRedirectUri({ scheme: 'fridgy' }), // scheme must match app.config.js
  });

  useEffect(() => {
    const run = async () => {
      if (response?.type === 'success') {
        const idToken = (response.params as any)?.id_token;
        if (idToken) {
          const cred = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, cred);
          router.replace('/(app)/fridge');
        }
      }
    };
    run().catch((e) => setError(e?.message ?? 'Google sign-in failed'));
  }, [response]);

  async function signInWithGoogle() {
    try {
      if (!request) {
        setError('Google sign-in not ready yet.');
        return;
      }
      // Works in Expo Go
      await promptAsync({ useProxy: true, showInRecents: true });
    } catch (err: any) {
      setError(err?.message ?? 'Google sign-in failed');
    }
  }

  // ----- animated gradient
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: false,
        isInteraction: false,
      }),
    ).start();
    const id = anim.addListener(({ value }) => {
      const idx = value * COLORS.length;
      const i = Math.floor(idx) % COLORS.length;
      const j = (i + 1) % COLORS.length;
      const t = idx - Math.floor(idx);
      setGradientColors([
        lerpColor(COLORS[i], COLORS[j], t),
        lerpColor(COLORS[j], COLORS[(j + 1) % COLORS.length], t),
      ]);
    });
    return () => anim.removeListener(id);
  }, [anim]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: W, height: H }}
        />
      </Animated.View>

      <SafeAreaView
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          {/* Header */}
          <Text
            style={{
              fontSize: 46,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 32,
            }}
          >
            FRIDGY
          </Text>

          {/* Email */}
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            placeholder="Email Address"
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: 24,
              paddingVertical: 16,
              paddingHorizontal: 24,
              marginBottom: 16,
              color: '#333',
            }}
          />

          {/* Password */}
          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: 24,
              paddingVertical: 16,
              paddingHorizontal: 24,
              marginBottom: 16,
              color: '#333',
            }}
          />

          {/* Confirm password */}
          <TextInput
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              setError(null);
            }}
            placeholder="Re Enter Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: 24,
              paddingVertical: 16,
              paddingHorizontal: 24,
              marginBottom: 32,
              color: '#333',
            }}
          />

          {/* Error */}
          {error && (
            <Text
              style={{
                color: '#fff',
                backgroundColor: '#960018',
                padding: 10,
                borderRadius: 8,
                marginBottom: 16,
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              {error}
            </Text>
          )}

          {/* Email/Password Sign Up */}
          <Pressable
            onPress={async () => {
              if (!email || !password || !confirm) {
                setError('Please fill all fields.');
                return;
              }
              if (password !== confirm) {
                setError('Passwords do not match.');
                return;
              }
              setLoading(true);
              setError(null);
              try {
                await createUserWithEmailAndPassword(
                  auth,
                  email.trim(),
                  password,
                );
                router.replace('/(app)/fridge');
              } catch (err: any) {
                let message = err.message;
                if (err.code === 'auth/email-already-in-use')
                  message = 'Email already in use.';
                setError(message);
              } finally {
                setLoading(false);
              }
            }}
            style={{
              width: '100%',
              paddingVertical: 16,
              alignItems: 'center',
              borderRadius: 24,
              marginBottom: 16,
              backgroundColor: 'rgba(255,255,255,0.9)',
            }}
            disabled={loading}
          >
            <Text
              style={{ fontSize: 18, fontWeight: 'bold', color: '#960018' }}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </Text>
          </Pressable>

          {/* Google Sign-In */}
          <Pressable
            onPress={signInWithGoogle}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
            }}
          >
            <Text style={{ fontWeight: 'bold', color: '#333' }}>
              Continue with Google
            </Text>
          </Pressable>

          {/* Link back to Login */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <Text style={{ color: 'white', marginRight: 8 }}>
              Already have an account?
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: '#4285F4', fontWeight: 'bold' }}>
                Log in now!
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
