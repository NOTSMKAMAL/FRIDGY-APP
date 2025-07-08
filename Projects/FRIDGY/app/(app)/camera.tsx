import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Camera() {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 16 }}>
          We need your permission to show the camera
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            backgroundColor: '#E86100',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        Alert.alert('Photo taken!', `Photo saved to: ${photo?.uri}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  }

  function handleBarcodeScanned(scanningResult: any) {
    if (scanningResult.data && scanningResult.data !== scannedData) {
      setScannedData(scanningResult.data);
      Alert.alert('Barcode Scanned!', `Scanned: ${scanningResult.data}`);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417', 'aztec', 'ean13', 'ean8', 'upc_e', 'upc_a', 'code39', 'code93', 'code128', 'codabar', 'itf14'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {scannedData && (
            <View style={{ 
              position: 'absolute', 
              top: 50, 
              left: 20, 
              right: 20, 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              padding: 16, 
              borderRadius: 8,
              zIndex: 1000
            }}>
              <Text style={{ color: 'white', fontSize: 14, marginBottom: 8 }}>
                Last scanned: {scannedData}
              </Text>
              <Pressable
                onPress={() => setScannedData(null)}
                style={{
                  backgroundColor: '#007AFF',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                  alignSelf: 'flex-start'
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>Clear</Text>
              </Pressable>
            </View>
          )}
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 50 }}>
              <Pressable
                onPress={toggleCameraFacing}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  padding: 15,
                  borderRadius: 30,
                }}
              >
                <Ionicons name="camera-reverse" size={28} color="white" />
              </Pressable>
              
              <Pressable
                onPress={takePicture}
                style={{
                  backgroundColor: 'white',
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(255,255,255,0.5)',
                }}
              >
                <View style={{
                  backgroundColor: 'white',
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                }} />
              </Pressable>
              
              <View style={{ width: 58 }} />
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}