import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";


export default function EmployeeLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "employee") return <Redirect href="/(hr)/(tabs)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}