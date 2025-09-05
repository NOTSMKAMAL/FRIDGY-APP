// app/(app)/section/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Food = {
  id: string;
  name: string;
  expirationISO: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notifId?: string;
};

const STORAGE_KEY = (sectionId: string) => `fridgy:items:${sectionId}`;

function daysLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

async function scheduleExpiryNotification(foodName: string, when: Date) {
  const d = new Date(when);
  d.setHours(9, 0, 0, 0);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expirations', {
      name: 'Expirations',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const trigger =
    d.getTime() <= Date.now()
      ? ({
          type: 'timeInterval',
          seconds: 5,
          repeats: false,
        } as Notifications.TimeIntervalTriggerInput)
      : ({ type: 'date', date: d } as Notifications.DateTriggerInput);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Fridgy',
      body: `${foodName} expires today`,
      sound: true,
    },
    trigger,
  });
  return id;
}

export default function SectionItems() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  const [items, setItems] = useState<Food[]>([]);

  // show/hide add form (controlled by + in header)
  const [showForm, setShowForm] = useState<boolean>(false);

  // form state
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false); // Android date dialog

  // notifications permission
  useEffect(() => {
    (async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch {}
    })();
  }, []);

  // load & persist
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY(String(id)));
        if (raw) setItems(JSON.parse(raw));
      } catch (e) {
        console.warn('load failed', e);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY(String(id)),
          JSON.stringify(items),
        );
      } catch (e) {
        console.warn('save failed', e);
      }
    })();
  }, [items, id]);

  const addItem = async () => {
    if (!name.trim()) return Alert.alert('Name required');
    const notifId = await scheduleExpiryNotification(name.trim(), date);
    const newItem: Food = {
      id: Math.random().toString(36).slice(2),
      name: name.trim(),
      expirationISO: date.toISOString(),
      calories: Number(cal) || 0,
      protein: Number(p) || 0,
      carbs: Number(c) || 0,
      fats: Number(f) || 0,
      notifId,
    };
    setItems((prev) => [newItem, ...prev]);
    // clear + auto-close form
    setName('');
    setCal('');
    setP('');
    setC('');
    setF('');
    setDate(new Date());
    setShowForm(false);
  };

  const deleteItem = async (item: Food) => {
    if (item.notifId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(item.notifId);
      } catch {}
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  // optional scanner hook—call this after scanning to prefill the form
  const onScanResult = (data: Partial<Food>) => {
    if (data.name) setName(String(data.name));
    if (data.expirationISO) setDate(new Date(data.expirationISO));
    if (data.calories != null) setCal(String(data.calories));
    if (data.protein != null) setP(String(data.protein));
    if (data.carbs != null) setC(String(data.carbs));
    if (data.fats != null) setF(String(data.fats));
    setShowForm(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181818' }}>
      {/* Header with notch-safe padding */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: '#181818',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>

        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
          {title || 'Section'}
        </Text>

        {/* Plus toggles the add form; switches to X when open */}
        <Pressable
          onPress={() => setShowForm((s) => !s)}
          style={{ padding: 6 }}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Add form (collapsible) */}
      {showForm && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View
            style={{
              backgroundColor: '#222',
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: '#2c2c2c',
            }}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Food name (e.g., Banana)"
              placeholderTextColor="#999"
              style={{
                backgroundColor: '#333',
                color: 'white',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 8,
              }}
            />

            {/* Smaller calendar UX:
                - iOS: compact picker inline
                - Android: tap to open dialog and it auto-dismisses
            */}
            {Platform.OS === 'ios' ? (
              <View
                style={{
                  backgroundColor: '#333',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#bbb', marginBottom: 6 }}>
                  Expiration
                </Text>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="compact"
                  onChange={(_, selected) => {
                    if (selected) setDate(selected);
                  }}
                  minimumDate={new Date()}
                />
                <Text style={{ color: '#888', marginTop: 6 }}>
                  Selected: {date.toISOString().slice(0, 10)}
                </Text>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => setShowPicker(true)}
                  style={{
                    backgroundColor: '#333',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: 'white' }}>
                    Expiration: {date.toISOString().slice(0, 10)} (tap to
                    change)
                  </Text>
                </Pressable>
                {showPicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="calendar"
                    onChange={(_, selected) => {
                      setShowPicker(false);
                      if (selected) setDate(selected);
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </>
            )}

            <View style={{ flexDirection: 'row' }}>
              <TextInput
                value={cal}
                onChangeText={setCal}
                placeholder="Calories"
                keyboardType="numeric"
                placeholderTextColor="#999"
                style={{
                  flex: 1,
                  backgroundColor: '#333',
                  color: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 8,
                  marginRight: 6,
                }}
              />
              <TextInput
                value={p}
                onChangeText={setP}
                placeholder="Protein (g)"
                keyboardType="numeric"
                placeholderTextColor="#999"
                style={{
                  flex: 1,
                  backgroundColor: '#333',
                  color: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 8,
                  marginLeft: 6,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                value={c}
                onChangeText={setC}
                placeholder="Carbs (g)"
                keyboardType="numeric"
                placeholderTextColor="#999"
                style={{
                  flex: 1,
                  backgroundColor: '#333',
                  color: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 8,
                  marginRight: 6,
                }}
              />
              <TextInput
                value={f}
                onChangeText={setF}
                placeholder="Fats (g)"
                keyboardType="numeric"
                placeholderTextColor="#999"
                style={{
                  flex: 1,
                  backgroundColor: '#333',
                  color: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 8,
                  marginLeft: 6,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <Pressable
                onPress={() => setShowForm(false)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: '#444',
                  marginRight: 8,
                }}
              >
                <Text style={{ color: 'white' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={addItem}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: '#005F84',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Items list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {items.length === 0 ? (
          <Text style={{ color: '#AAA', textAlign: 'center', marginTop: 16 }}>
            No items yet.
          </Text>
        ) : (
          items.map((item) => {
            const d = daysLeft(item.expirationISO);
            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: '#222',
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  borderLeftWidth: 6,
                  borderLeftColor: d <= 2 ? '#F87171' : '#2F9E44',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>
                    {item.name}
                  </Text>
                  <Pressable
                    onPress={() => deleteItem(item)}
                    style={{ padding: 6 }}
                  >
                    <Text style={{ color: '#bbb' }}>Delete</Text>
                  </Pressable>
                </View>
                <Text style={{ color: 'white', marginTop: 4 }}>
                  Expires: {item.expirationISO.slice(0, 10)} ({d}d left)
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 6,
                  }}
                >
                  <Text style={{ color: '#BBB', fontSize: 12 }}>
                    Cal {item.calories}
                  </Text>
                  <Text style={{ color: '#BBB', fontSize: 12 }}>
                    P {item.protein}g
                  </Text>
                  <Text style={{ color: '#BBB', fontSize: 12 }}>
                    C {item.carbs}g
                  </Text>
                  <Text style={{ color: '#BBB', fontSize: 12 }}>
                    F {item.fats}g
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
