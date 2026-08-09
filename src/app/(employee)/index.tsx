import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";


const EmployeeIndex = () => {
  const { user, isLoading } = useAuth();
  
  console.log("app index ", user)

  if (isLoading) return <LoadingScreen />;

  if (!user || user.isActive === false) return <Redirect href="/(auth)/login" />;
  if (user.role === "employee") return <Redirect href="/(employee)/(tabs)/home" />;
  return <Redirect href="/(hr)/(tabs)/dashboard" />;
};

export default EmployeeIndex;