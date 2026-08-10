// src/app/(employee)/(tabs)/profile.tsx
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PALETTE = {
  dark: "#11615D",
  darkDeep: "#0D4A47",
  mint: "#5FE0B8",
  mintLight: "#E6FBF4",
  blue: "#4A6CF7",
  blueLight: "#EBEEFE",
  purple: "#7C6FF0",
  purpleLight: "#F0EEFE",
  amber: "#F5A623",
  amberLight: "#FFF6E5",
  rose: "#F0637A",
  roseLight: "#FDECEF",
  border: "#F1F5F9",
};

const menuGroups: {
  title: string;
  items: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    bg: string;
    tint: string;
  }[];
}[] = [
  {
    title: "Account",
    items: [
      { key: "personal", label: "Personal Information", icon: "person-outline", bg: PALETTE.blueLight, tint: PALETTE.blue },
      { key: "documents", label: "My Documents", icon: "document-text-outline", bg: PALETTE.purpleLight, tint: PALETTE.purple },
      { key: "bank", label: "Bank & Salary Info", icon: "card-outline", bg: PALETTE.mintLight, tint: "#0E9F76" },
    ],
  },
  {
    title: "Work",
    items: [
      { key: "attendance", label: "Attendance History", icon: "time-outline", bg: PALETTE.amberLight, tint: PALETTE.amber },
      { key: "leaves", label: "Leave Requests", icon: "airplane-outline", bg: PALETTE.blueLight, tint: PALETTE.blue },
      { key: "payslip", label: "Payslips", icon: "receipt-outline", bg: PALETTE.roseLight, tint: PALETTE.rose },
    ],
  },
  {
    title: "Preferences",
    items: [
      { key: "notifications", label: "Notifications", icon: "notifications-outline", bg: PALETTE.mintLight, tint: "#0E9F76" },
      { key: "security", label: "Privacy & Security", icon: "shield-checkmark-outline", bg: PALETTE.purpleLight, tint: PALETTE.purple },
      { key: "help", label: "Help & Support", icon: "help-circle-outline", bg: PALETTE.blueLight, tint: PALETTE.blue },
    ],
  },
];

export default function EmployeeProfile() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const RANDOM_AVATAR = "https://i.pravatar.cc/300?img=12";


  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handlePress = (key: string) => console.log(`${key} pressed`);

  return (
    <View className="flex-1" style={{ backgroundColor: PALETTE.mintLight }}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.dark} />

      {/* Header */}
      <View style={{ backgroundColor: PALETTE.dark, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <SafeAreaView edges={["top"]}>
          <View
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: 180,
              backgroundColor: "rgba(95,224,184,0.08)",
              top: -60,
              right: -40,
            }}
          />

          <View className="items-center pt-4 pb-8 px-5">
            <View
              className="w-20 h-20 rounded-full justify-center items-center mb-3"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 2.5, borderColor: PALETTE.mint, overflow: "hidden" }}
            >
              <Image
                source={{ uri: user?.avatar || RANDOM_AVATAR }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            <Text className="text-white text-lg font-bold">{user?.name ?? "Employee"}</Text>
            <Text className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {user?.email ?? "—"}
            </Text>

            {user?.department && (
              <View
                className="flex-row items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
              >
                <Ionicons name="briefcase-outline" size={13} color={PALETTE.mint} />
                <Text className="text-xs font-semibold text-white">{user.department}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick stat row */}
        <View
          className="bg-white rounded-2xl flex-row mb-6"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <View className="flex-1 items-center py-4" style={{ borderRightWidth: 1, borderRightColor: PALETTE.border }}>
            <Text className="text-lg font-bold" style={{ color: PALETTE.dark }}>2.5y</Text>
            <Text className="text-[11px] text-gray-400 mt-0.5">Tenure</Text>
          </View>
          <View className="flex-1 items-center py-4" style={{ borderRightWidth: 1, borderRightColor: PALETTE.border }}>
            <Text className="text-lg font-bold" style={{ color: PALETTE.dark }}>18</Text>
            <Text className="text-[11px] text-gray-400 mt-0.5">Present</Text>
          </View>
          <View className="flex-1 items-center py-4">
            <Text className="text-lg font-bold" style={{ color: PALETTE.dark }}>6</Text>
            <Text className="text-[11px] text-gray-400 mt-0.5">Leave left</Text>
          </View>
        </View>

        {/* Menu groups */}
        {menuGroups.map((group) => (
          <View key={group.title} className="mb-6">
            <Text className="text-xs font-bold uppercase tracking-wide mb-2.5 px-1" style={{ color: PALETTE.dark }}>
              {group.title}
            </Text>
            <View
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => handlePress(item.key)}
                  activeOpacity={0.7}
                  className="flex-row items-center px-4 py-3.5"
                  style={{
                    borderBottomWidth: idx < group.items.length - 1 ? 1 : 0,
                    borderBottomColor: PALETTE.border,
                  }}
                >
                  <View
                    className="w-9 h-9 rounded-xl justify-center items-center mr-3"
                    style={{ backgroundColor: item.bg }}
                  >
                    <Ionicons name={item.icon} size={17} color={item.tint} />
                  </View>
                  <Text className="text-sm font-semibold flex-1" style={{ color: "#334155" }}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl mt-2"
          style={{
            backgroundColor: PALETTE.roseLight,
            opacity: loggingOut ? 0.7 : 1,
          }}
        >
          {loggingOut ? (
            <ActivityIndicator color={PALETTE.rose} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={PALETTE.rose} />
              <Text className="text-sm font-bold" style={{ color: PALETTE.rose }}>
                Log out
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-center text-[11px] text-gray-300 mt-4">Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}