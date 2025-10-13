// app/(app)/settings.tsx
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import React, { memo } from 'react';
import { Pressable, Text, View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/themeContext';

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
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: palette.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: palette.iconBg, // fixed '#black'
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
        }}
      >
        <Ionicons name={icon as any} size={20} color={palette.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: palette.text,
            marginBottom: subtitle ? 2 : 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              color: palette.subtext,
              fontWeight: '400',
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {hasSwitch ? (
        <Switch
          value={!!switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E0E0E0', true: palette.tint }}
          thumbColor="#fff"
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={palette.subtext} />
      )}
    </Pressable>
  );
});

export default function Settings() {
  const router = useRouter();
  const auth = getAuth();
  const { palette, isDark, setDarkEnabled } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
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
            color: palette.text,
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
          switchValue={true}
          onSwitchChange={() => {}}
        />

        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle="Toggle app appearance"
          hasSwitch
          switchValue={isDark}
          onSwitchChange={setDarkEnabled}
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
              color: palette.subtext,
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