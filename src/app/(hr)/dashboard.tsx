// app/(hr)/dashboard.tsx
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HrDashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>HR Dashboard</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  text: { fontSize: 22, fontWeight: "700", padding: 20 },
});