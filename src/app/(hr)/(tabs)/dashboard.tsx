// app/(hr)/dashboard.tsx
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HrDashboard() {
  return (
    <SafeAreaView >
      <Text className="text-2xl font-bold pl-5">HR Dashboard</Text>
    </SafeAreaView>
  );
}

