import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function EmployeeTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#11615D",
        tabBarInactiveTintColor: "#9CA3AF",

        tabBarStyle: {
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="checklist"
        options={{
          title: "Checklist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="checkmark-circle"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubbles-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
      name="JobReport/JobReport"
      options={{ href: null }}  
      />
      <Tabs.Screen
      name="leaveReport/LeaveReport"
      options={{ href: null }}  
      />
      <Tabs.Screen
      name="incidentReport/IncidentReport"
      options={{ href: null }}  
      />
      <Tabs.Screen
      name="DailyLog/DailyLog"
      options={{ href: null }}  
      />
      <Tabs.Screen
      name="chat/[chatId]"
      options={{ href: null }}  
      />

    </Tabs>
  );
}