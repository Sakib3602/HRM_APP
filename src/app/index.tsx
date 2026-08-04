import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";


export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === "hr") return <Redirect href="/(hr)/dashboard" />;
  return <Redirect href="/(employee)/dashboard" />;
}