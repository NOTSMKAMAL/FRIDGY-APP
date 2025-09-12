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
import { db, serverTimestamp, ensureAnonAuth } from '../../FirebaseConfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

import { findFoodIdByBarcode, getFoodById } from '../../API/fatsecret';
import { probe } from '../../API/FatSecretRFC5849Probe';

const REGION = 'US';

type Section = { id: string; name: string; color: string };

const SECTIONS_KEY = (uid: string) => `fridgy:sections:${uid}`;
// IMPORTANT: matches app/(app)/sections/id.tsx bootstrap cache key
const SECTION_ITEMS_CACHE_KEY = (uid: string, sectionId: string) =>
  `fridgy:items:${uid}:${sectionId}`;

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d;
}

// ---- NEW: timeouts ----
const SCAN_DETECT_TIMEOUT_MS = 8000; // time to wait for a barcode to be detected
const LOOKUP_TIMEOUT_MS = 7000;      // time to wait for network lookups

function withTimeout<T>(p: Promise<T>, ms: number, message = 'Timed out'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
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

  // NEW: guard to avoid spamming "Not found" while still on the same scanning session
  const [noDetectShown, setNoDetectShown] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      if (!uid) {
        setSectionsLoaded(false);
        return;
      }
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

  // ---- NEW: if no barcode gets detected for a while, show "Not found" ----
  useEffect(() => {
    if (!permission?.granted) return;

    // Only run the timer while we're actively waiting for a scan result,
    // i.e., no current scan result, no food loaded, and the picker is closed.
    const waitingForDetection = !pickerOpen && !scanned && !food;
    if (!waitingForDetection) {
      // Reset guard once user has a result or opens a modal
      setNoDetectShown(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!noDetectShown && !scanned && !food) {
        setNoDetectShown(true);
        Alert.alert('Not found', 'No barcode detected. Align the code in the frame and try again.');
      }
    }, SCAN_DETECT_TIMEOUT_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted, pickerOpen, scanned, food, noDetectShown]);

  /* scan handler */
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // ignore duplicate scans or scans while the picker is open
    if (!data || data === scanned || pickerOpen) return;

    // Reset the "no-detect" guard since we got a detection event
    setNoDetectShown(false);

    setScanned(data);
    setFood(null);

    try {
      // Timeout the lookup if it takes too long
      const foodId = await withTimeout(findFoodIdByBarcode(data, REGION), LOOKUP_TIMEOUT_MS, 'Lookup timed out');
      if (!foodId) {
        Alert.alert('Not found', 'We couldn’t find a match for this barcode.');
        setScanned(null);
        return;
      }
      const details = await withTimeout(getFoodById(foodId, REGION), LOOKUP_TIMEOUT_MS, 'Details timed out');
      setFood(details);
      // NOTE: do NOT auto-open the picker here — opens only when user taps the button
    } catch {
      // Per your request: if it takes too long OR anything goes wrong here → Not found
      Alert.alert('Not found', 'We couldn’t retrieve details for this barcode. Please try again.');
      setScanned(null);
    }
  };

  /** Create/find section in Firestore (and keep local cache in sync) */
  async function ensureSectionExists(name: string): Promise<Section | null> {
    const user = uid ?? (await ensureAnonAuth()).uid;
    const trimmed = name.trim();
    if (!user || !trimmed) return null;

    // best-effort refresh of local list
    try {
      const raw = await AsyncStorage.getItem(SECTIONS_KEY(user));
      if (raw) setSections(JSON.parse(raw) as Section[]);
    } catch {}

    // check existing (case-insensitive) from current list
    const existing = sections.find(
      (s) => s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    // create deterministic id (with suffix if collision)
    const base = trimmed.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    let id = base;
    if (sections.some((s) => s.id === id)) {
      let n = 2;
      while (sections.some((s) => s.id === `${base}-${n}`)) n += 1;
      id = `${base}-${n}`;
    }

    const color = '#2D2D2D';
    await setDoc(doc(db, 'users', user, 'sections', id), {
      name: trimmed,
      color,
      createdAt: serverTimestamp(),
    });

    const created: Section = { id, name: trimmed, color };
    const next = [...sections, created];
    setSections(next);
    try {
      await AsyncStorage.setItem(SECTIONS_KEY(user), JSON.stringify(next));
    } catch {}

    return created;
  }

  /** Write scanned item to Firestore + write-through cache (matching reader key) */
  async function addScannedItemToSection(section: Section) {
    if (!serving || !food) return;

    const user = uid ?? (await ensureAnonAuth()).uid;

    const when = daysFromNow(7);
    const payload = {
      name: String(food.food_name ?? 'Food'),
      expiresAt: when, // Date -> Firestore Timestamp
      calories: Number(serving.calories ?? 0),
      protein: Number(serving.protein ?? 0),
      carbs: Number((serving.carbohydrate ?? serving.carbs) ?? 0),
      fats: Number(serving.fat ?? 0),
      barcode: scanned ?? null,
      addedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      // 1) Firestore write (triggers live onSnapshot in section screen)
      await addDoc(collection(db, 'users', user, 'sections', section.id, 'foods'), payload);

      // 2) Optional write-through cache for instant bootstrap before snapshot arrives
      try {
        const cacheKey = SECTION_ITEMS_CACHE_KEY(user, section.id);
        const raw = await AsyncStorage.getItem(cacheKey);
        const arr = raw ? (JSON.parse(raw) as any[]) : [];
        const localItem = {
          id: Math.random().toString(36).slice(2), // temporary local id
          ...payload,
          // section screen expects ISO string on bootstrap and converts to Date
          expiresAt: when.toISOString(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify([localItem, ...arr]));
      } catch {}
    } catch (e: any) {
      Alert.alert('Save error', e?.message ?? String(e));
      return;
    }

    // cleanup + navigate
    closePicker();
    setScanned(null);
    setFood(null);
    setNoDetectShown(false);
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
                  onPress={() => {
                    setScanned(null);
                    setFood(null);
                    setNoDetectShown(false);
                  }}
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

