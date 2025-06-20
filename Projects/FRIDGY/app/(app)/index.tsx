import { Link } from "expo-router";
import { Text, View, SafeAreaView} from "react-native";

export default function Index() {
  return (
    <View className= "flex-1 justify-center items-center">
      <Text className = "text-5xl text-primary font-bold">FRIDGY</Text>
      <Link href= "/signup">Sign up</Link>
    </View>
  );
}
