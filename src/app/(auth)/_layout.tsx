import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";
;

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user?.role === "hr") return <Redirect href="/(hr)/dashboard" />;
  if (user?.role === "employee") return <Redirect href="/(employee)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}