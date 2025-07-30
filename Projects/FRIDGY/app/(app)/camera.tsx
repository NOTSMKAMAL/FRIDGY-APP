/* app/(app)/camera.tsx ---------------------------------------------------- */
import React, { useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { findFoodIdByBarcode, getFoodById } from '../../API/fatsecret';
import { probe } from '../../API/FatSecretRFC5849Probe';   // ← probe helper

const REGION = 'US';   // Change to 'GB', 'DE', etc. for your market

export default function Camera() {
  /* --------------------------------------------------------------------- */
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState<string | null>(null);
  const [food,    setFood]    = useState<any>(null);

  const cameraRef = useRef<CameraView>(null);

  /* ---------------- BARCODE HANDLER ------------------------------------ */
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!data || data === scanned) return;
    setScanned(data);      // raw text
    setFood(null);         // reset UI

    try {
      const foodId = await findFoodIdByBarcode(data, REGION);
      if (!foodId) { Alert.alert('No match'); return; }

      const info = await getFoodById(foodId, REGION);
      setFood(info);
    } catch (err: any) {
      Alert.alert('Lookup error', err.message);
    }
  };

  /* ---------------- HARD-CODED US SAMPLE ------------------------------- */
  const runTest = async () => {
    const gtin = '0041570054161'; // FatSecret US demo
    try {
      const id   = await findFoodIdByBarcode(gtin, REGION);
      if (!id) { Alert.alert('Test: no match'); return; }
      const info = await getFoodById(id, REGION);

      Alert.alert(
        'Test Result',
        `${info.food_name}\nProtein: ${info.servings.serving[0].protein} g`
      );
    } catch (e: any) {
      Alert.alert('Test error', e.message);
    }
  };

  /* ---------------- OPTIONAL RFC 5849 PROBE ---------------------------- */
  const runProbe = () => probe(); // uses default barcode + region

  /* ---------------- HELPER TO SHOW FIRST SERVING ----------------------- */
  const serving = useMemo(() => {
    if (!food) return null;
    const s = food.servings.serving;
    return Array.isArray(s) ? s[0] : s;
  }, [food]);

  /* ---------------- PERMISSIONS SCREENS -------------------------------- */
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={{ flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center' }}>
        <Text style={{ color:'white', marginBottom:12 }}>Camera permission needed</Text>
        <Pressable onPress={requestPermission} style={{ backgroundColor:'#E86100', padding:12, borderRadius:8 }}>
          <Text style={{ color:'white' }}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  /* ---------------- MAIN UI ------------------------------------------- */
  return (
    <View style={{ flex:1, backgroundColor:'#000' }}>
      {/* Live camera feed */}
      <CameraView
        ref={cameraRef}
        style={{ flex:1 }}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','upc_a','upc_e'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Overlay UI */}
      <SafeAreaView
        pointerEvents="box-none"
        style={{ position:'absolute', top:0, left:0, right:0, bottom:0, justifyContent:'space-between' }}
      >

        {/* ---- TEST BUTTONS ---- */}
        <View style={{ alignSelf:'center', marginTop:20, flexDirection:'row', gap:12 }}>
          <Pressable onPress={runTest} style={{ backgroundColor:'#FFD700', padding:10, borderRadius:6 }}>
            <Text>🔍 Test US Sample</Text>
          </Pressable>

          <Pressable onPress={runProbe} style={{ backgroundColor:'#0af', padding:10, borderRadius:6 }}>
            <Text style={{ color:'#fff' }}>⚙️ RFC 5849 Probe</Text>
          </Pressable>
        </View>

        {/* ---- RESULT CARD ---- */}
        {(scanned || food) && (
          <View style={{ margin:20, backgroundColor:'rgba(0,0,0,0.8)', padding:16, borderRadius:8 }}>
            {scanned && <Text style={{ color:'white', marginBottom:8 }}>Scanned: {scanned}</Text>}

            {food ? (
              <>
                <Text style={{ color:'white', fontWeight:'600' }}>{food.food_name}</Text>
                <Text style={{ color:'white' }}>Protein: {serving?.protein} g</Text>
                <Text style={{ color:'white' }}>Fat: {serving?.fat} g</Text>
                <Text style={{ color:'white' }}>
                  Carbs: {serving?.carbohydrate || serving?.carbs} g
                </Text>
              </>
            ) : (
              <Text style={{ color:'white' }}>Looking up…</Text>
            )}

            <Pressable
              onPress={() => { setScanned(null); setFood(null); }}
              style={{ marginTop:8, backgroundColor:'#007AFF', paddingHorizontal:12, paddingVertical:6, borderRadius:4 }}
            >
              <Text style={{ color:'white' }}>Clear</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}