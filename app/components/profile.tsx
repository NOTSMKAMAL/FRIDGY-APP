// app/(app)/settings/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  const [name, setName] = useState(user?.displayName ?? '');
  const [email] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setName(user?.displayName ?? '');
  }, [user?.displayName]);

  const onSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await updateProfile(user, { displayName: name.trim() });
      setDirty(false);
      Alert.alert('Saved', 'Your name has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181818' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ padding: 4, marginRight: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
          Profile
        </Text>
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        {/* Name (editable) */}
        <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>
          Name
        </Text>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t);
            setDirty(true);
          }}
          placeholder="Your name"
          placeholderTextColor="#777"
          style={{
            backgroundColor: '#262626',
            color: '#fff',
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 18,
            fontSize: 16,
          }}
          editable={!saving}
          autoCapitalize="words"
          returnKeyType="done"
        />

        {/* Email (read-only) */}
        <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>
          Email
        </Text>
        <View
          style={{
            backgroundColor: '#262626',
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 28,
          }}
        >
          <Text style={{ color: '#bbb', fontSize: 16 }}>{email || '—'}</Text>
          <Text style={{ color: '#777', fontSize: 12, marginTop: 4 }}>
            Email cannot be changed
          </Text>
        </View>

        {/* Save button */}
        <Pressable
          onPress={onSave}
          disabled={saving || !dirty || name.trim().length === 0}
          style={{
            backgroundColor:
              saving || !dirty || name.trim().length === 0 ? '#444' : '#007AFF',
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          {saving ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
