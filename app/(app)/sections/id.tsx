import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ensureAnonAuth, db, serverTimestamp } from '@/FirebaseConfig';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

type Food = {
  id: string;
  name: string;
  expiresAt: Date | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notifId?: string | null;
};

function daysLeft(date: Date | null) {
  if (!date) return 9999;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

async function scheduleExpiryNotification(foodName: string, when: Date) {
  if (Platform.OS !== 'ios') return undefined;
  try {
    const Notifications = await import('expo-notifications');
    const d = new Date(when);
    d.setHours(9, 0, 0, 0);

    const trigger =
      d.getTime() <= Date.now()
        ? ({ type: 'timeInterval', seconds: 5, repeats: false } as any)
        : ({ type: 'date', date: d } as any);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Fridgy',
        body: `${foodName} expires today`,
        sound: true,
      },
      trigger,
    });
    return id;
  } catch {
    return undefined;
  }
}

export default function SectionItems() {
  const router = useRouter();
  const { id: sectionIdParam, title } = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();
  const sectionId = String(sectionIdParam || '');

  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState('');
  const [eCal, setECal] = useState('');
  const [eP, setEP] = useState('');
  const [eC, setEC] = useState('');
  const [eF, setEF] = useState('');
  const [eDate, setEDate] = useState<Date>(new Date());
  const [eShowPicker, setEShowPicker] = useState(false);
  const [eNotifId, setENotifId] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        await Notifications.requestPermissionsAsync();
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!sectionId) {
      setLoading(false);
      return;
    }
    let unsub: undefined | (() => void);

    (async () => {
      const user = await ensureAnonAuth();
      setUid(user.uid);

      const foodsRef = collection(
        db,
        'users',
        user.uid,
        'sections',
        sectionId,
        'foods',
      );
      const qRef = query(foodsRef, orderBy('expiresAt', 'asc'));

      unsub = onSnapshot(
        qRef,
        (snap) => {
          const rows: Food[] = snap.docs.map((d) => {
            const data = d.data() as any;
            const expiresDate: Date | null = data.expiresAt?.toDate
              ? data.expiresAt.toDate()
              : data.expiresAt instanceof Date
                ? data.expiresAt
                : null;

            return {
              id: d.id,
              name: String(data.name ?? ''),
              expiresAt: expiresDate,
              calories: Number(data.calories ?? 0),
              protein: Number(data.protein ?? 0),
              carbs: Number(data.carbs ?? 0),
              fats: Number(data.fats ?? 0),
              notifId: data.notifId ?? null,
            } as Food;
          });
          setItems(rows);
          setLoading(false);
        },
        (err) => {
          console.log('foods onSnapshot error', err);
          Alert.alert('Firestore error', err.message ?? String(err));
          setLoading(false);
        },
      );
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [sectionId]);

  const addItem = async () => {
    const nm = name.trim();
    if (!nm) return Alert.alert('Name required');

    try {
      const notifId = await scheduleExpiryNotification(nm, date);
      const uidNow = uid ?? (await ensureAnonAuth()).uid;

      await addDoc(
        collection(db, 'users', uidNow, 'sections', sectionId, 'foods'),
        {
          name: nm,
          expiresAt: date,
          calories: Number(cal) || 0,
          protein: Number(p) || 0,
          carbs: Number(c) || 0,
          fats: Number(f) || 0,
          notifId: notifId ?? null,
          addedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

      setName('');
      setCal('');
      setP('');
      setC('');
      setF('');
      setDate(new Date());
      setShowForm(false);
    } catch (e: any) {
      console.log('add food error', e);
      Alert.alert('Could not add', e?.message ?? String(e));
    }
  };

  const deleteItem = async (item: Food) => {
    try {
      if (Platform.OS === 'ios' && item.notifId) {
        try {
          const Notifications = await import('expo-notifications');
          await Notifications.cancelScheduledNotificationAsync(item.notifId);
        } catch {}
      }
      const uidNow = uid ?? (await ensureAnonAuth()).uid;
      await deleteDoc(
        doc(db, 'users', uidNow, 'sections', sectionId, 'foods', item.id),
      );
    } catch (e: any) {
      console.log('delete food error', e);
    }
  };

  const openEdit = (item: Food) => {
    setEditId(item.id);
    setEName(item.name);
    setECal(String(item.calories ?? 0));
    setEP(String(item.protein ?? 0));
    setEC(String(item.carbs ?? 0));
    setEF(String(item.fats ?? 0));
    setEDate(item.expiresAt ?? new Date());
    setENotifId(item.notifId ?? null);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const nm = eName.trim();
    if (!nm) return Alert.alert('Name required');

    try {
      if (Platform.OS === 'ios' && eNotifId) {
        try {
          const Notifications = await import('expo-notifications');
          await Notifications.cancelScheduledNotificationAsync(eNotifId);
        } catch {}
      }
      const newNotifId = await scheduleExpiryNotification(nm, eDate);

      const uidNow = uid ?? (await ensureAnonAuth()).uid;
      await updateDoc(
        doc(db, 'users', uidNow, 'sections', sectionId, 'foods', editId),
        {
          name: nm,
          expiresAt: eDate,
          calories: Number(eCal) || 0,
          protein: Number(eP) || 0,
          carbs: Number(eC) || 0,
          fats: Number(eF) || 0,
          notifId: newNotifId ?? null,
          updatedAt: serverTimestamp(),
        },
      );

      setEditOpen(false);
      setEditId(null);
    } catch (e: any) {
      console.log('save edit error', e);
      Alert.alert('Could not save changes', e?.message ?? String(e));
    }
  };

  const onScanResult = (data: Partial<Food>) => {
    if (data.name) setName(String(data.name));
    if (data.expiresAt) setDate(data.expiresAt);
    if (data.calories != null) setCal(String(data.calories));
    if (data.protein != null) setP(String(data.protein));
    if (data.carbs != null) setC(String(data.carbs));
    if (data.fats != null) setF(String(data.fats));
    setShowForm(true);
  };

  if (!sectionId) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#181818',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff' }}>Missing section id.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181818' }}>
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

        <Pressable
          onPress={() => setShowForm((s) => !s)}
          style={{ padding: 6 }}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#fff" />
        </Pressable>
      </View>

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

      {loading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
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
              const d = daysLeft(item.expiresAt);
              return (
                <Pressable key={item.id} onPress={() => openEdit(item)}>
                  <View
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
                      Expires:{' '}
                      {item.expiresAt
                        ? item.expiresAt.toISOString().slice(0, 10)
                        : '—'}{' '}
                      ({d}d left)
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
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal
        transparent
        visible={editOpen}
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              backgroundColor: '#222',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 12,
              }}
            >
              Edit Item
            </Text>

            <TextInput
              value={eName}
              onChangeText={setEName}
              placeholder="Food name"
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
                  value={eDate}
                  mode="date"
                  display="compact"
                  onChange={(_, selected) => {
                    if (selected) setEDate(selected);
                  }}
                  minimumDate={new Date()}
                />
                <Text style={{ color: '#888', marginTop: 6 }}>
                  Selected: {eDate.toISOString().slice(0, 10)}
                </Text>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => setEShowPicker(true)}
                  style={{
                    backgroundColor: '#333',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: 'white' }}>
                    Expiration: {eDate.toISOString().slice(0, 10)} (tap to
                    change)
                  </Text>
                </Pressable>
                {eShowPicker && (
                  <DateTimePicker
                    value={eDate}
                    mode="date"
                    display="calendar"
                    onChange={(_, selected) => {
                      setEShowPicker(false);
                      if (selected) setEDate(selected);
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </>
            )}

            <View style={{ flexDirection: 'row' }}>
              <TextInput
                value={eCal}
                onChangeText={setECal}
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
                value={eP}
                onChangeText={setEP}
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
                value={eC}
                onChangeText={setEC}
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
                value={eF}
                onChangeText={setEF}
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
                marginTop: 8,
              }}
            >
              <Pressable
                onPress={() => {
                  setEditOpen(false);
                  setEditId(null);
                }}
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
                onPress={saveEdit}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: '#005F84',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
