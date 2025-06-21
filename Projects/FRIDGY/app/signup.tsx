// SignUp.tsx

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = ["#960018", "#196000", "#E86100", "#702963", "#005F84"] as const;

export default function SignUp({ navigation }: { navigation: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const { height: H, width: W } = useWindowDimensions();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // scroll animation loop
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

      {/* overlay form */}
      <SafeAreaView className="absolute inset-0">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center px-5"
        >
          {/* Header */}
          <Text className="text-[46px] font-extrabold text-white mb-8">
            FRIDGY
          </Text>

          {/* Email input */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            placeholderTextColor="#ccc"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full bg-white rounded-[24px] py-4 px-6 mb-4 text-gray-800"
          />

          {/* Password input */}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            className="w-full bg-white rounded-[24px] py-4 px-6 mb-4 text-gray-800"
          />

          {/* Confirm password */}
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re Enter Password"
            placeholderTextColor="#ccc"
            secureTextEntry
            className="w-full bg-white rounded-[24px] py-4 px-6 mb-8 text-gray-800"
          />

          {/* Sign Up button */}
          <Pressable
            onPress={() => {
              /* your signup handler */
            }}
            className="w-full py-4 items-center rounded-[24px] mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <Text className="text-lg font-bold text-[#960018]">
              Sign Up
            </Text>
          </Pressable>

          {/* Link back to Login */}
          <View className="flex-row">
            <Text className="text-white mr-2">Already have an account?</Text>
            <Pressable onPress={() => navigation.goBack()}>
              <Text className="text-[#4285F4] font-bold ">Log in now!</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}