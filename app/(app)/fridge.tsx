// app/(app)/fridge.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../FirebaseConfig';

type Section = { id: string; name: string; color: string };

const PALETTE = [
  '#06402B',
  '#702963',
  '#005F84',
  '#660033',
  '#7A3803',
  '#545F4C',
  '#5D6E74',
  '#293570',
];

// Only used if the user has no saved sections yet
const DEFAULT_SECTIONS: Section[] = [
  { id: 'fruits', name: 'Fruits', color: '#06402B' },
  { id: 'vegetables', name: 'Vegetables', color: '#702963' },
  { id: 'drinks', name: 'Drinks', color: '#005F84' },
];

export default function Fridge() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false); // wait until we load from storage before rendering list

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Section | null>(null);

  const storageKey = useMemo(
    () => (uid ? `fridgy:sections:${uid}` : null),
    [uid],
  );

  // Watch auth, then load sections for that user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUid(user ? user.uid : null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // load when uid available
    if (!storageKey) {
      // not signed in yet; don't show defaults to avoid flicker
      setHasLoaded(false);
      return;
    }
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          setSections(JSON.parse(raw) as Section[]);
        } else {
          // first time for this user — seed with defaults and persist
          setSections(DEFAULT_SECTIONS);
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(DEFAULT_SECTIONS),
          );
        }
      } catch (e) {
        console.warn('Failed to load sections', e);
        // fall back to defaults so app remains usable
        setSections(DEFAULT_SECTIONS);
      } finally {
        setHasLoaded(true);
      }
    })();
  }, [storageKey]);

  // Persist whenever sections change (but only after initial load and with a uid)
  useEffect(() => {
    if (!hasLoaded || !storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(sections)).catch(() => {});
  }, [sections, hasLoaded, storageKey]);

  // 🔄 Refresh when the Fridge tab/screen regains focus (e.g., after adding from Camera)
  useFocusEffect(
    useCallback(() => {
      let canceled = false;
      (async () => {
        if (!storageKey) return;
        try {
          const raw = await AsyncStorage.getItem(storageKey);
          if (!canceled && raw) setSections(JSON.parse(raw));
        } catch {}
      })();
      return () => {
        canceled = true;
      };
    }, [storageKey]),
  );

  const addSection = () => {
    const name = newName.trim();
    if (!name) return;
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // strip non-url-safe chars
      .replace(/\s+/g, '-');

    // prevent duplicate ids
    if (sections.some((s) => s.id === id)) {
      // simple suffix for uniqueness
      let n = 2;
      let unique = `${id}-${n}`;
      while (sections.some((s) => s.id === unique)) {
        n += 1;
        unique = `${id}-${n}`;
      }
      setSections((prev) => [...prev, { id: unique, name, color: newColor }]);
    } else {
      setSections((prev) => [...prev, { id, name, color: newColor }]);
    }

    setAddOpen(false);
    setNewName('');
    setNewColor(PALETTE[0]);
  };

  const requestDelete = (section: Section) => {
    setPendingDelete(section);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setSections((prev) => prev.filter((s) => s.id !== pendingDelete.id));
    setDeleteOpen(false);
    setPendingDelete(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181818' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 20,
          marginTop: 20,
          textAlign: 'center',
          letterSpacing: 0.3,
          fontFamily: 'System',
        }}
      >
        FRIDGY
      </Text>

      {/* Search (placeholder) */}
      <View style={{ marginBottom: 20 }}>
        <Pressable
          style={{
            backgroundColor: 'white',
            padding: 12,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.3)',
            marginHorizontal: 25,
            marginTop: 20,
          }}
        >
          <Text style={{ color: 'black', fontSize: 15, fontWeight: '400' }}>
            Search
          </Text>
        </Pressable>
      </View>

      {/* Loading state until storage/auth resolved */}
      {!hasLoaded ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color="#fff" />
          <Text style={{ color: '#aaa', marginTop: 8 }}>Loading…</Text>
        </View>
      ) : (
        <>
          {/* Sections */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 120,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              {sections.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/sections/id',
                      params: { id: s.id, title: s.name, color: s.color },
                    })
                  }
                  onLongPress={() => requestDelete(s)}
                  delayLongPress={400}
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                  style={{
                    width: 160,
                    height: 140,
                    backgroundColor: s.color,
                    alignItems: 'center',
                    borderRadius: 16,
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    {s.name.toUpperCase()}
                  </Text>
                </Pressable>
              ))}

              {/* Add Section */}
              <Pressable
                onPress={() => setAddOpen(true)}
                style={{
                  width: 160,
                  height: 140,
                  backgroundColor: '#2D2D2D',
                  padding: 16,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{ color: 'white', fontSize: 28, fontWeight: '300' }}
                >
                  ＋
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Add Section Modal */}
          <Modal
            animationType="slide"
            transparent
            visible={addOpen}
            onRequestClose={() => setAddOpen(false)}
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
                  New Section
                </Text>

                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g., Fruits"
                  placeholderTextColor="#999"
                  style={{
                    backgroundColor: '#333',
                    color: 'white',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ color: 'white', marginBottom: 8 }}>Color</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {PALETTE.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setNewColor(c)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: c,
                        marginRight: 8,
                        marginBottom: 8,
                        borderWidth: newColor === c ? 2 : 0,
                        borderColor: '#fff',
                      }}
                    />
                  ))}
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginTop: 12,
                  }}
                >
                  <Pressable
                    onPress={() => setAddOpen(false)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: '#444',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: 'white' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={addSection}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: '#005F84',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700' }}>
                      Create
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* Delete Section Modal */}
          <Modal
            transparent
            visible={deleteOpen}
            animationType="fade"
            onRequestClose={() => setDeleteOpen(false)}
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
                  Delete Section
                </Text>
                <Text style={{ color: '#bbb', marginBottom: 16 }}>
                  {`Are you sure you want to delete "${
                    pendingDelete?.name ?? ''
                  }"?`}
                </Text>

                <View
                  style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                >
                  <Pressable
                    onPress={() => {
                      setDeleteOpen(false);
                      setPendingDelete(null);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: '#444',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: 'white' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmDelete}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: '#B00020',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700' }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}
