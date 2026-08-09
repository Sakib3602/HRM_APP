import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";
;

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user && user.isActive !== false) {
    if (user.role === "hr") return <Redirect href="/(hr)/(tabs)/dashboard" />;
    if (user.role === "employee") return <Redirect href="/(employee)/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}