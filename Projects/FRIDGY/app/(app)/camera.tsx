import React, { useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { findFoodIdByBarcode, getFoodById } from '../../API/fatsecret';
import { probe } from '../../API/FatSecretRFC5849Probe';

const REGION = 'US';          // adjust if needed

export default function Camera() {
  /* state */
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const [food, setFood]       = useState<any>(null);

  const cameraRef = useRef<CameraView>(null);

  /* scan handler */
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!data || data === scanned) return;
    setScanned(data); setFood(null);

    try {
      const foodId = await findFoodIdByBarcode(data, REGION);
      if (!foodId) { Alert.alert('No match'); return; }
      const details = await getFoodById(foodId, REGION);
      setFood(details);
    } catch (err:any) { Alert.alert('Lookup error', err.message); }
  };

  /* first serving */
  const serving = useMemo(() => {
    if (!food) return null;
    const s = food.servings.serving;
    return Array.isArray(s) ? s[0] : s;
  }, [food]);

  /* permissions gate */
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={{flex:1,backgroundColor:'#000',justifyContent:'center',alignItems:'center'}}>
        <Text style={{color:'white',marginBottom:12}}>Camera permission needed</Text>
        <Pressable onPress={requestPermission} style={{backgroundColor:'#E86100',padding:12,borderRadius:8}}>
          <Text style={{color:'white'}}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  /* UI */
  return (
    <View style={{ flex:1, backgroundColor:'#000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex:1 }}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes:['ean13','ean8','upc_a','upc_e'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <SafeAreaView
        pointerEvents="box-none"
        style={{ position:'absolute',top:0,left:0,right:0,bottom:0,justifyContent:'space-between' }}
      >
        {/* probe button */}
        <Pressable
          onPress={() => probe()}
          style={{ backgroundColor:'#0af', padding:10, borderRadius:6, alignSelf:'center', marginTop:20 }}
        >
          <Text style={{ color:'#fff' }}>⚙️ RFC 5849 Probe</Text>
        </Pressable>

        {/* centred card */}
        {(scanned || food) && (
          <View
            style={{
              position:'absolute', top:0,left:0,right:0,bottom:0,
              justifyContent:'center', alignItems:'center',
            }}
          >
            <View style={{ backgroundColor:'rgba(0,0,0,0.85)', padding:24, borderRadius:16 }}>
              {/* barcode text */}
              {scanned && (
                <Text style={{ color:'white', marginBottom:12 }}>
                  Scanned: {scanned}
                </Text>
              )}

              {/* food name */}
              {food && (
                <Text style={{
                  color:'white', fontWeight:'700', fontSize:18, textAlign:'center', marginBottom:16,
                }}>
                  {food.food_name}
                </Text>
              )}

              {/* nutrient layout */}
              {food ? (
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  {/* calories ring */}
                  <View
                    style={{
                      width:120,height:120,borderRadius:60,
                      borderWidth:4,borderColor:'rgba(255,255,255,0.15)',
                      justifyContent:'center',alignItems:'center',
                      marginRight:24,
                    }}
                  >
                    <Text style={{ color:'white', fontSize:32, fontWeight:'700' }}>
                      {serving?.calories ?? '—'}
                    </Text>
                    <Text style={{ color:'white', opacity:0.7 }}>Calories</Text>
                  </View>

                  {/* macros */}
                  <View>
                    <Text style={{ color:'white', fontSize:24, fontWeight:'600' }}>
                      {serving?.protein ?? '—'}g
                    </Text>
                    <Text style={{ color:'white', opacity:0.7, marginBottom:12 }}>Protein</Text>

                    <Text style={{ color:'white', fontSize:24, fontWeight:'600' }}>
                      {serving?.carbohydrate ?? serving?.carbs ?? '—'}g
                    </Text>
                    <Text style={{ color:'white', opacity:0.7, marginBottom:12 }}>Carbs</Text>

                    <Text style={{ color:'white', fontSize:24, fontWeight:'600' }}>
                      {serving?.fat ?? '—'}g
                    </Text>
                    <Text style={{ color:'white', opacity:0.7 }}>Fats</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color:'white' }}>Looking up…</Text>
              )}

              {/* centred clear button */}
              <Pressable
                onPress={() => { setScanned(null); setFood(null); }}
                style={{
                  marginTop:20, alignSelf:'center',
                  backgroundColor:'#007AFF', paddingHorizontal:16, paddingVertical:8, borderRadius:6,
                }}
              >
                <Text style={{ color:'white', fontSize:13 }}>Clear</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
