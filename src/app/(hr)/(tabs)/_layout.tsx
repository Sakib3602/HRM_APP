import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function HrTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#80A33C",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: "Employees",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quicktask"
        options={{
          title: "Quick Task",
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
        />
        <Tabs.Screen
        name="HrDocument/hrDocument"
        options={{ href: null }}  
      />
        <Tabs.Screen
        name="HrMeetingsAndAnnounc/hrMeetingsAndAnnounc"
        options={{ href: null }}  
      />
        <Tabs.Screen
        name="HrOfficeActivity/office-activity"
        options={{ href: null }}  
      />
        <Tabs.Screen
        name="HrEmployeeRecords/employee-records"
        options={{ href: null }}  
      />
      
    </Tabs>
  );
}