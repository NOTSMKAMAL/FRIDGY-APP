// app/(app)/camera.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Alert, Modal, TextInput, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../FirebaseConfig';

import { findFoodIdByBarcode, getFoodById } from '../../API/fatsecret';
import { probe } from '../../API/FatSecretRFC5849Probe';

const REGION = 'US';

type Section = { id: string; name: string; color: string };
type FoodItem = {
  id: string;
  name: string;
  expirationISO: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  barcode?: string;
  notifId?: string;
};

const SECTIONS_KEY = (uid: string) => `fridgy:sections:${uid}`;
const ITEMS_KEY = (uid: string|null, sectionId: string) =>
  uid ? `fridgy:${uid}:items:${sectionId}` : `fridgy:items:${sectionId}`;

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function Camera() {
  const router = useRouter();

  // camera
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // fetched food
  const [food, setFood] = useState<any>(null);
  const serving = useMemo(() => {
    if (!food) return null;
    const s = food.servings?.serving;
    return Array.isArray(s) ? s[0] : s;
  }, [food]);

  // user + sections
  const [uid, setUid] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  // modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      if (!uid) { setSectionsLoaded(false); return; }
      try {
        const raw = await AsyncStorage.getItem(SECTIONS_KEY(uid));
        if (raw) setSections(JSON.parse(raw) as Section[]);
      } catch {}
      setSectionsLoaded(true);
    })();
  }, [uid]);

  function closePicker() {
    setPickerOpen(false);
    setNewSectionName('');
  }

  /* scan handler */
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // ignore duplicate scans or scans while the picker is open
    if (!data || data === scanned || pickerOpen) return;
    setScanned(data);
    setFood(null);

    try {
      const foodId = await findFoodIdByBarcode(data, REGION);
      if (!foodId) {
        Alert.alert('No match');
        setScanned(null);
        return;
      }
      const details = await getFoodById(foodId, REGION);
      setFood(details);
      // NOTE: do NOT auto-open the picker here — opens only when user taps the button
    } catch (err: any) {
      Alert.alert('Lookup error', err?.message ?? String(err));
      setScanned(null);
    }
  };

  async function ensureSectionExists(name: string): Promise<Section | null> {
    if (!uid) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;

    // find existing (case-insensitive)
    const existing = sections.find(
      (s) => s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    // create new section (id pattern same as your fridge screen)
    let id = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    if (sections.some((s) => s.id === id)) {
      let n = 2;
      while (sections.some((s) => s.id === `${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    const color = '#2D2D2D';
    const created: Section = { id, name: trimmed, color };
    const next = [...sections, created];
    setSections(next);
    try { await AsyncStorage.setItem(SECTIONS_KEY(uid), JSON.stringify(next)); } catch {}
    return created;
  }

  async function addScannedItemToSection(section: Section) {
    if (!serving || !food) return;

    const item: FoodItem = {
      id: Math.random().toString(36).slice(2),
      name: food.food_name ?? 'Food',
      expirationISO: daysFromNow(7).toISOString(), // default 7 days
      calories: Number(serving.calories ?? 0),
      protein: Number(serving.protein ?? 0),
      carbs: Number((serving.carbohydrate ?? serving.carbs) ?? 0),
      fats: Number(serving.fat ?? 0),
      barcode: scanned ?? undefined,
    };

    const key = ITEMS_KEY(uid, section.id);
    try {
      const raw = await AsyncStorage.getItem(key);
      const arr = raw ? (JSON.parse(raw) as FoodItem[]) : [];
      const next = [item, ...arr];
      await AsyncStorage.setItem(key, JSON.stringify(next));
    } catch {
      Alert.alert('Save error', 'Could not save to section');
      return;
    }

    // cleanup + navigate
    closePicker();
    setScanned(null);
    setFood(null);
    router.push({
      pathname: '/(app)/sections/id',
      params: { id: section.id, title: section.name, color: section.color },
    });
  }

  /* permissions gate */
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', marginBottom: 12 }}>Camera permission needed</Text>
        <Pressable onPress={requestPermission} style={{ backgroundColor: '#E86100', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* overlays */}
      <SafeAreaView
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}
      >
        {/* Top bar */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => router.push('/(app)/fridge')}
            style={{
              backgroundColor: 'rgba(0,0,0,0.55)',
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 22,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 2 }}>Home</Text>
          </Pressable>

          <Pressable
            onPress={() => probe()}
            style={{
              backgroundColor: 'rgba(10,140,255,0.85)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>RFC 5849 Probe</Text>
          </Pressable>
        </View>

        {/* Scan guide frame */}
        {!food && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: '60%', height: '10%', maxWidth: 340, minHeight: 160 }}>
              {[
                { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4 },
                { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4 },
                { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4 },
                { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4 },
              ].map((pos, i) => (
                <View key={i} style={{ position: 'absolute', width: 26, height: 26, borderColor: 'white', borderRadius: 4, ...pos }} />
              ))}
            </View>
          </View>
        )}

        {/* Result card */}
        {(scanned || food) && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.85)', padding: 24, borderRadius: 16 }}>
              {scanned && <Text style={{ color: 'white', marginBottom: 12 }}>Scanned: {scanned}</Text>}

              {food && (
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 18, textAlign: 'center', marginBottom: 16 }}>
                  {food.food_name}
                </Text>
              )}

              {food ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      borderWidth: 4,
                      borderColor: 'rgba(255,255,255,0.15)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 24,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 32, fontWeight: '700' }}>{serving?.calories ?? '—'}</Text>
                    <Text style={{ color: 'white', opacity: 0.7 }}>Calories</Text>
                  </View>

                  <View>
                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '600' }}>{serving?.protein ?? '—'}g</Text>
                    <Text style={{ color: 'white', opacity: 0.7, marginBottom: 12 }}>Protein</Text>

                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '600' }}>
                      {(serving?.carbohydrate ?? serving?.carbs) ?? '—'}g
                    </Text>
                    <Text style={{ color: 'white', opacity: 0.7, marginBottom: 12 }}>Carbs</Text>

                    <Text style={{ color: 'white', fontSize: 24, fontWeight: '600' }}>{serving?.fat ?? '—'}g</Text>
                    <Text style={{ color: 'white', opacity: 0.7 }}>Fats</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color: 'white' }}>Looking up…</Text>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 10 }}>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  disabled={!food}
                  style={{
                    backgroundColor: '#1f7ae0',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    opacity: food ? 1 : 0.5,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Add to Section</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setScanned(null); setFood(null); }}
                  style={{ backgroundColor: '#444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white' }}>Clear</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Category Picker Modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={closePicker}             // Android back / system close
        onDismiss={() => setNewSectionName('')}  // ensure clean field after close
        onShow={() => setNewSectionName('')}     // ensure fresh field on open
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '90%', borderRadius: 16, backgroundColor: '#1d1d1d', padding: 16 }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 10, textAlign: 'center' }}>
              Add to Section
            </Text>

            <FlatList
              data={sections}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 240 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={async () => { await addScannedItemToSection(item); }}
                  style={{ padding: 14, borderRadius: 12, backgroundColor: '#2a2a2a', justifyContent: 'center', marginBottom: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>{item.name}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={{ color: '#bbb', textAlign: 'center', marginVertical: 10 }}>No sections yet.</Text>}
            />

            <View style={{ height: 1, backgroundColor: '#333', marginVertical: 10 }} />

            <Text style={{ color: '#bbb', marginBottom: 6 }}>New section</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                placeholder="e.g., Snacks"
                placeholderTextColor="#888"
                value={newSectionName}
                onChangeText={setNewSectionName}
                style={{ flex: 1, backgroundColor: '#2a2a2a', color: 'white', padding: 12, borderRadius: 12 }}
              />
              <Pressable
                onPress={async () => {
                  const s = await ensureSectionExists(newSectionName);
                  setNewSectionName('');
                  if (s) await addScannedItemToSection(s);
                }}
                style={{ backgroundColor: '#1f7ae0', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Create & Add</Text>
              </Pressable>
            </View>

            <Pressable onPress={closePicker} style={{ alignSelf: 'center', padding: 10, marginTop: 12 }}>
              <Text style={{ color: '#ddd' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
