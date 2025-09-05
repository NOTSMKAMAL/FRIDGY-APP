import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import React, { memo, useState } from 'react';
import { Pressable, Text, View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SettingItem = memo(function SettingItem({
  icon,
  title,
  subtitle,
  hasSwitch,
  switchValue,
  onSwitchChange,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#4A4A4A',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#black',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
        }}
      >
        <Ionicons name={icon as any} size={20} color="white" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: subtitle ? 2 : 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              color: '#666',
              fontWeight: '400',
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
          thumbColor={switchValue ? '#fff' : '#fff'}
        />
      )}
      {!hasSwitch && <Ionicons name="chevron-forward" size={20} color="#666" />}
    </Pressable>
  );
});

export default function Settings() {
  const router = useRouter();
  const auth = getAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181818' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '600',
            color: 'white',
            marginBottom: 60,
            textAlign: 'center',
          }}
        >
          Settings
        </Text>

        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Get notified about expiring items"
          hasSwitch
          switchValue={notifications}
          onSwitchChange={setNotifications}
        />

        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle="Switch to dark theme"
          hasSwitch
          switchValue={darkMode}
          onSwitchChange={setDarkMode}
        />
        <SettingItem
          icon="person"
          title="Profile"
          subtitle="Manage your account details"
          onPress={() => router.push('/components/profile')}
        />

        <SettingItem
          icon="shield"
          title="Privacy & Security"
          subtitle="Control your data and privacy"
          onPress={() => {}}
        />

        <SettingItem
          icon="help-circle"
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={() => {}}
        />

        <SettingItem
          icon="information-circle"
          title="About"
          subtitle="App version and information"
          onPress={() => {}}
        />

        <SettingItem
          icon="log-out"
          title="Sign Out"
          subtitle="Sign out of your account"
          onPress={handleLogout}
        />

        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 13,
              color: '#666',
              textAlign: 'center',
              fontWeight: '400',
            }}
          >
            FRIDGY v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
