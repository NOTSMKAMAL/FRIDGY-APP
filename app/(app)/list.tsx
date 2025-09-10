import React, { useEffect, useMemo, useState, memo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Keyboard,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  writeBatch,
} from 'firebase/firestore';

type GroceryItem = {
  id: string;
  name: string;
  qty?: string | null;
  checked: boolean;
  order?: number;
};

const ItemRow = memo(function ItemRow({
  item,
  onToggle,
  onRemove,
  drag,
  isActive,
}: {
  item: GroceryItem;
  onToggle: (id: string, next: boolean) => void;
  onRemove: (id: string) => void;
  drag: () => void;
  isActive: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: '#181818',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: isActive ? 0.9 : 1,
      }}
    >
      <TouchableOpacity
        onPress={() => onToggle(item.id, !item.checked)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: item.checked ? '#007AFF' : '#222',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
        }}
      >
        {item.checked ? (
          <Ionicons name="checkmark" size={18} color="#fff" />
        ) : (
          <Ionicons
            name="ellipse-outline"
            size={18}
            color="rgba(255,255,255,0.5)"
          />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#fff',
            marginBottom: item.qty ? 2 : 0,
            textDecorationLine: item.checked ? 'line-through' : 'none',
            opacity: item.checked ? 0.6 : 1,
          }}
        >
          {item.name}
        </Text>
        {!!item.qty && (
          <Text
            style={{
              fontSize: 13,
              color: '#666',
              fontWeight: '400',
              textDecorationLine: item.checked ? 'line-through' : 'none',
              opacity: item.checked ? 0.6 : 1,
            }}
          >
            {item.qty}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onLongPress={drag}
        onPressIn={Platform.OS === 'android' ? drag : undefined}
        style={{ padding: 6, marginLeft: 6 }}
      >
        <Ionicons
          name="reorder-three-outline"
          size={24}
          color="rgba(255,255,255,0.9)"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onRemove(item.id)}
        style={{ padding: 6, marginLeft: 6 }}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color="rgba(255,255,255,0.8)"
        />
      </TouchableOpacity>
    </View>
  );
});

export default function GroceryList() {
  const { width, height } = useWindowDimensions();

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    let unsub: undefined | (() => void);
    (async () => {
      const user = await ensureAnonAuth();
      uidRef.current = user.uid;

      const qRef = query(
        collection(db, 'users', user.uid, 'items'),
        orderBy('order', 'asc'),
      );
      unsub = onSnapshot(
        qRef,
        (snap) => {
          const rows: GroceryItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<GroceryItem, 'id'>),
          }));
          setItems(rows);
        },
        (err) => {
          console.log('onSnapshot error', err);
          Alert.alert('Firestore error', err.message ?? String(err));
        },
      );
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const addItem = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Add Item', 'Please enter an item name.');
      return;
    }
    try {
      const uid = uidRef.current ?? (await ensureAnonAuth()).uid;
      const itemsRef = collection(db, 'users', uid, 'items');
      const topOrder = items.length
        ? Math.min(...items.map((i) => i.order ?? 0)) - 1
        : 0;

      await addDoc(itemsRef, {
        name: trimmed,
        qty: qty.trim() || null,
        checked: false,
        order: topOrder,
        createdAt: serverTimestamp(),
      });

      setName('');
      setQty('');
      Keyboard.dismiss();
      setShowAddModal(false);
    } catch (err: any) {
      console.log('addItem error', err);
      Alert.alert('Could not add', err.message ?? String(err));
    }
  };

  const toggleItem = async (id: string, next: boolean) => {
    try {
      const uid = uidRef.current ?? (await ensureAnonAuth()).uid;
      await updateDoc(doc(db, 'users', uid, 'items', id), { checked: next });
    } catch (err: any) {
      console.log('toggleItem error', err);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const uid = uidRef.current ?? (await ensureAnonAuth()).uid;
      await deleteDoc(doc(db, 'users', uid, 'items', id));
    } catch (err: any) {
      console.log('removeItem error', err);
    }
  };

  const clearChecked = async () => {
    try {
      const uid = uidRef.current ?? (await ensureAnonAuth()).uid;
      const batch = writeBatch(db);
      items
        .filter((i) => i.checked)
        .forEach((i) => {
          batch.delete(doc(db, 'users', uid, 'items', i.id));
        });
      await batch.commit();
    } catch (err: any) {
      console.log('clearChecked error', err);
    }
  };

  const remaining = useMemo(
    () => items.filter((i) => !i.checked).length,
    [items],
  );

  const onDragEnd = async (data: GroceryItem[]) => {
    setItems(data);
    try {
      const uid = uidRef.current ?? (await ensureAnonAuth()).uid;
      const batch = writeBatch(db);
      data.forEach((item, index) => {
        batch.update(doc(db, 'users', uid, 'items', item.id), { order: index });
      });
      await batch.commit();
    } catch (err: any) {
      console.log('reorder error', err);
    }
  };

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<GroceryItem>) => (
    <ItemRow
      item={item}
      onToggle={toggleItem}
      onRemove={removeItem}
      drag={drag}
      isActive={isActive}
    />
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#181818', '#181818']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', width: width, height: height }}
        />

        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: 'white',
                textAlign: 'center',
                letterSpacing: 0.3,
                fontFamily: 'System',
              }}
            >
              Grocery List
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{ position: 'absolute', right: 20, padding: 6 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          <View
            style={{
              paddingHorizontal: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
              {remaining} item{remaining === 1 ? '' : 's'} remaining
            </Text>
            <TouchableOpacity
              onPress={clearChecked}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <Text style={{ color: 'white' }}>Clear Purchased</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24 }}>
            <DraggableFlatList
              data={items}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => onDragEnd(data)}
              renderItem={renderItem}
              activationDistance={12}
              autoscrollThreshold={32}
              containerStyle={{ paddingTop: 4 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Text
                  style={{
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.8)',
                    textAlign: 'center',
                    marginTop: 20,
                    fontWeight: '400',
                  }}
                >
                  Your list is empty — add your first item!
                </Text>
              }
            />
          </View>

          <Modal
            transparent
            visible={showAddModal}
            animationType="slide"
            onRequestClose={() => {
              setShowAddModal(false);
              setName('');
              setQty('');
              Keyboard.dismiss();
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'flex-end',
              }}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ width: '100%' }}
              >
                <View
                  style={{
                    backgroundColor: '#222',
                    padding: 16,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
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
                    Add Item
                  </Text>

                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Item name (e.g., Eggs)"
                    placeholderTextColor="#999"
                    style={{
                      backgroundColor: '#333',
                      color: 'white',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 10,
                    }}
                    returnKeyType="next"
                    autoFocus
                  />

                  <TextInput
                    value={qty}
                    onChangeText={setQty}
                    placeholder="Quantity (optional)"
                    placeholderTextColor="#999"
                    style={{
                      backgroundColor: '#333',
                      color: 'white',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 14,
                    }}
                    returnKeyType="done"
                    onSubmitEditing={addItem}
                  />

                  <View
                    style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddModal(false);
                        setName('');
                        setQty('');
                        Keyboard.dismiss();
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
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={addItem}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: '#005F84',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: '700' }}>
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
}
