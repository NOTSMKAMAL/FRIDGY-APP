import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ensureAnonAuth, db, serverTimestamp } from '@/FirebaseConfig';

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
  type Timestamp,
} from 'firebase/firestore';

type Section = {
  id: string;
  name: string;
  color: string;
  createdAt?: Timestamp;
};

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

const DEFAULT_SECTIONS: Omit<Section, 'createdAt'>[] = [
  { id: 'fruits', name: 'Fruits', color: '#06402B' },
  { id: 'vegetables', name: 'Vegetables', color: '#702963' },
  { id: 'drinks', name: 'Drinks', color: '#005F84' },
  { id: 'dairy', name: 'Dairy', color: '#660033' },
  { id: 'meat', name: 'Meat & Protein', color: '#7A3803' },
  { id: 'pantry', name: 'Pantry', color: '#545F4C' },
  { id: 'snacks', name: 'Snacks', color: '#5D6E74' },
];

export default function Fridge() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Section | null>(null);

  const seedDefaultsIfNeeded = async (userId: string) => {
    const sectionsRef = collection(db, 'users', userId, 'sections');
    const snap = await getDocs(sectionsRef);
    if (snap.empty) {
      const batch = writeBatch(db);
      DEFAULT_SECTIONS.forEach((s) => {
        batch.set(doc(sectionsRef, s.id), {
          name: s.name,
          color: s.color,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  };

  useEffect(() => {
    let unsub: undefined | (() => void);

    (async () => {
      const user = await ensureAnonAuth();
      setUid(user.uid);

      await seedDefaultsIfNeeded(user.uid);

      const sectionsRef = collection(db, 'users', user.uid, 'sections');
      const qRef = query(sectionsRef, orderBy('createdAt', 'asc'));

      unsub = onSnapshot(
        qRef,
        (snap) => {
          const rows: Section[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Section, 'id'>),
          }));
          setSections(rows);
          setHasLoaded(true);
        },
        (err) => {
          console.log('sections onSnapshot error', err);
          Alert.alert('Firestore error', err.message ?? String(err));
          setHasLoaded(true);
        },
      );
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const addSection = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Name required');
      return;
    }

    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    let id = baseId;
    if (sections.some((s) => s.id === id)) {
      let n = 2;
      while (sections.some((s) => s.id === `${baseId}-${n}`)) n += 1;
      id = `${baseId}-${n}`;
    }

    try {
      const uidNow = uid ?? (await ensureAnonAuth()).uid;
      await setDoc(doc(db, 'users', uidNow, 'sections', id), {
        name,
        color: newColor,
        createdAt: serverTimestamp(),
      });

      setAddOpen(false);
      setNewName('');
      setNewColor(PALETTE[0]);
    } catch (e: any) {
      console.log('addSection error', e);
      Alert.alert('Could not create section', e?.message ?? String(e));
    }
  };

  const requestDelete = (section: Section) => {
    setPendingDelete(section);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const uidNow = uid ?? (await ensureAnonAuth()).uid;
      const foodsCol = collection(
        db,
        'users',
        uidNow,
        'sections',
        pendingDelete.id,
        'foods',
      );
      const foods = await getDocs(foodsCol);

      const batch = writeBatch(db);
      foods.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'users', uidNow, 'sections', pendingDelete.id));
      await batch.commit();
    } catch (e: any) {
      console.log('delete section error', e);
      Alert.alert('Could not delete section', e?.message ?? String(e));
    } finally {
      setDeleteOpen(false);
      setPendingDelete(null);
    }
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

      {!hasLoaded ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color="#fff" />
          <Text style={{ color: '#aaa', marginTop: 8 }}>Loading…</Text>
        </View>
      ) : (
        <>
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
                  }"? This will also remove foods in it.`}
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
