import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";


export default function Index() {
  const { user, isLoading } = useAuth();
  
  console.log("app index ", user)

  if (isLoading) return <LoadingScreen />;

  if (!user || user.isActive === false) return <Redirect href="/(auth)/login" />;
  if (user.role === "hr") return <Redirect href="/(hr)/(tabs)/dashboard" />;
  return <Redirect href="/(employee)/dashboard" />;
}