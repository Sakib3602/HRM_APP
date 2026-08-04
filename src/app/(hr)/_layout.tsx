import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";



export default function HrLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "hr") return <Redirect href="/(employee)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}