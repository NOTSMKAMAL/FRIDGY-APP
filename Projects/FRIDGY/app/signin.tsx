// SignIn.tsx

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Google from "../assets/google.svg";
import Apple from "../assets/apple.svg";

const COLORS = ["#960018", "#196000", "#E86100", "#702963", "#005F84"] as const;

export default function SignIn() {
  const anim = useRef(new Animated.Value(0)).current;
  const { height: H, width: W } = useWindowDimensions();

  // dynamic sizes
  const BUTTON_WIDTH = W * 0.8;
  const BUTTON_HEIGHT = H * 0.07;
  const ICON_SIZE = W * 0.085;

  // loop scrolling animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 50_000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: COLORS.map((_, i) => i / COLORS.length).concat(1),
    outputRange: COLORS.map((_, i) => -H * i).concat(-H * COLORS.length),
  });

  return (
    <View className="flex-1 overflow-hidden">
      {/* animated color strips */}
      <Animated.View
        style={[
          { width: W, height: H * COLORS.length * 2, transform: [{ translateY }] },
        ]}
      >
        {[...COLORS, ...COLORS].map((color, i) => (
          <View
            key={i}
            style={{ backgroundColor: color, width: W, height: H }}
          />
        ))}
      </Animated.View>

      <SafeAreaView className="absolute inset-0">
        <View className="flex-1 items-center justify-center px-5">
          
          {/* Title */}
          <Text className="text-[46px] font-extrabold text-white mb-8">
            FRIDGY
          </Text>

          {/* Login Button */}
          <Pressable
            onPress={() => {}}
            className="items-center justify-center mb-4"
            style={{
              width: BUTTON_WIDTH,
              height: BUTTON_HEIGHT,
              borderWidth: 2,
              borderColor: "rgba(190,190,190,0.35)",
              borderRadius: 24,
              backgroundColor: "#fff",
            }}
          >
            <Text className="text-lg font-bold text-[#960018]">Login</Text>
          </Pressable>

          {/* Sign‐Up Button */}
          <Pressable
            onPress={() => {}}
            className="items-center justify-center mb-8"
            style={{
              width: BUTTON_WIDTH,
              height: BUTTON_HEIGHT,
              borderWidth: 2,
              borderColor: "rgba(190,190,190,0.35)",
              borderRadius: 24,
              backgroundColor: "#fff",
            }}
          >
            <Text className="text-lg font-bold text-[#960018]">Sign up</Text>
          </Pressable>

          {/* Or Divider */}
          <View className="flex-row items-center w-full px-10 mb-6">
            <View className="flex-1 h-px bg-white" />
            <Text className="mx-2 text-xs font-medium text-white">Or</Text>
            <View className="flex-1 h-px bg-white" />
          </View>

          {/* Social Icons */}
          <View className="flex-row items-center space-x-6">
            <Google width={32} height={32} style={{ marginRight: 24 }}/>
            <Apple width={34} height={34} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}