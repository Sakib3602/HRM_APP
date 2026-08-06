// app/(employee)/dashboard.tsx
import { useAuth } from "@/context/AuthContext";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmployeeDashboard() {
  const {logout} = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Employee Dashboard</Text>
      <TouchableOpacity style={{backgroundColor:"red", padding:10, borderRadius:5, margin:10, width:100}} onPress={() => logout()}><Text style={{color:"white", fontSize:16}}>Logout</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  text: { fontSize: 22, fontWeight: "700", padding: 20 },
});