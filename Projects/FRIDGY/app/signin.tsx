import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Google from "../assets/";
import Apple from "../assets/apple.svg";

export default function SignIn() {
  return (
    <SafeAreaView style={styles.viewBg}>
      <View style={[styles.view, styles.viewBg]}>
        <Text style={[styles.fridgy, styles.orPosition]}>FRIDGY</Text>
        <Pressable style={[styles.child, styles.itemLayout]} onPress={() => {}} />
        <Pressable style={[styles.item, styles.itemLayout]} onPress={() => {}} />
        <Text style={[styles.signUp, styles.loginTypo]}>Sign up</Text>
        <Text style={[styles.login, styles.loginTypo]}>Login</Text>
        <View style={styles.googleParent}>
          <Google style={styles.googleIcon} width={32} height={32} />
          <Apple style={styles.appleIcon} />
        </View>
        <Text style={[styles.or, styles.orPosition]}>Or</Text>
        <View style={[styles.inner, styles.innerLayout]} />
        <View style={[styles.lineView, styles.innerLayout]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  viewBg: {
    flex: 1,
    backgroundColor: "#960018"
  },
  view: {
    width: "100%",
    height: "100%",
    overflow: "hidden"
  },
  orPosition: {
    position: "absolute",
    left: "50%",
    textAlign: "left",
    color: "#fff"
  },
  itemLayout: {
    position: "absolute",
    left: "50%",
    width: 333,
    height: 52,
    marginLeft: -166.5,
    borderWidth: 2,
    borderColor: "rgba(190, 190, 190, 0.35)",
    borderRadius: 24,
    backgroundColor: "#fff"
  },
  loginTypo: {
    position: "absolute",
    left: "50%",
    textAlign: "left",
    color: "#960018",
    fontFamily: "Inter-Bold",
    fontWeight: "700",
    fontSize: 16
  },
  innerLayout: {
    position: "absolute",
    height: 1,
    width: 106,
    borderTopWidth: 1,
    borderColor: "#fff",
    borderStyle: "solid"
  },
  fridgy: {
    position: "absolute",
    top: 180,
    left: "50%",
    marginLeft: -86.5,
    fontSize: 46,
    fontWeight: "800",
    fontFamily: "Inter-ExtraBold",
    color: "#fff"
  },
  child: {
    position: "absolute",
    top: 405
  },
  item: {
    position: "absolute",
    top: 469
  },
  signUp: {
    position: "absolute",
    top: 485,
    left: "50%",
    marginLeft: -29.5
  },
  login: {
    position: "absolute",
    top: 421,
    left: "50%",
    marginLeft: -21.5
  },
  googleParent: {
    position: "absolute",
    top: 574,
    left: 152,
    width: 90,
    height: 34
  },
  googleIcon: {
    position: "absolute",
    top: 1,
    left: 0
  },
  appleIcon: {
    position: "absolute",
    top: 0,
    left: "62.22%",
    width: "37.78%",
    height: "100%"
  },
  or: {
    position: "absolute",
    top: 541,
    left: "50%",
    marginLeft: -4.5,
    fontSize: 8,
    fontWeight: "500",
    fontFamily: "Poppins-Medium",
    color: "#fff"
  },
  inner: {
    position: "absolute",
    top: 547,
    left: 75
  },
  lineView: {
    position: "absolute",
    top: 547,
    left: 214
  }
});
