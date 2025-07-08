import React, { useEffect, useRef } from 'react';
import { Pressable, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  onPress: () => void;
}

export default function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / 3; // 3 tabs total
  const xOffset = tabWidth * 1 + (tabWidth / 2); // Position above recipes (index 1)

  const handlePress = () => {
    onPress();
  };


  return (
    <>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 90,
          left: xOffset - 28, // Center the 56px button (28px radius)
          transform: [{ translateY: slideAnim }],
          zIndex: 1000,
        }}
      >
        <Pressable
          onPress={handlePress}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#E86100',
            justifyContent: 'center',
            alignItems: 'center',
            ...(Platform.OS === 'android' && { elevation: 8 }),
            ...(Platform.OS === 'ios' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }),
          }}
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      </Animated.View>

    </>
  );
}