import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Fridge() {

  const mockFridgeItems = [
    { id: 1, name: 'Milk', expiry: '2 days', color: '#4CAF50' },
    { id: 2, name: 'Bread', expiry: '5 days', color: '#FF9800' },
    { id: 3, name: 'Cheese', expiry: '1 day', color: '#F44336' },
    { id: 4, name: 'Apples', expiry: '7 days', color: '#4CAF50' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}
        >
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '600', 
            color: '#333', 
            marginBottom: 30,
            textAlign: 'center'
          }}>
            Home
          </Text>

          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            gap: 16 
          }}>
            {mockFridgeItems.map((item) => (
              <View
                key={item.id}
                style={{
                  width: '47%',
                  backgroundColor: 'white',
                  padding: 16,
                  borderRadius: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: item.color,
                  alignSelf: 'flex-end',
                  marginBottom: 8,
                }} />
                <Text style={{ 
                  fontSize: 17, 
                  fontWeight: '600', 
                  color: '#333',
                  marginBottom: 4 
                }}>
                  {item.name}
                </Text>
                <Text style={{ 
                  fontSize: 13, 
                  color: '#666',
                  fontWeight: '400' 
                }}>
                  {item.expiry} left
                </Text>
              </View>
            ))}
          </View>

          <Text style={{ 
            fontSize: 15, 
            color: '#666', 
            textAlign: 'center',
            marginTop: 40,
            fontWeight: '400' 
          }}>
            Add items to track your groceries
          </Text>
        </ScrollView>
      </SafeAreaView>
  );
}
