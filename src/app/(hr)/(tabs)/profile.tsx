import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Theme (matches the rest of the app)
const COLORS = {
  bg: "#F2F8EC",
  card: "#FFFFFF",
  primary: "#5C8A3A",
  primaryLight: "#E8F3DE",
  ink: "#22321A",
  muted: "#7C8B72",
  border: "#E3EEDA",
  danger: "#D64545",
  dangerLight: "#FDECEC",
};

const DUMMY_AVATAR = "https://i.pravatar.cc/300?img=12";

type MenuItem = {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
};

export default function Profile() {
  const { user, logout } = useAuth();
const router = useRouter();
  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout?.() },
    ]);
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "HR Tools",
      items: [
        {
          icon: "🗂️",
          label: "Interview Portal",
          subtitle: "Job openings & candidates",
          onPress: () => {},
        },
        {
          icon: "📁",
          label: "HR Documents",
          subtitle: "Templates & uploads",
          onPress: () => {router.push("/HrDocument/hrDocument");},
        },
        {
          icon: "📅",
          label: "Meetings & Announcements",
          subtitle: "Schedule & broadcast",
          onPress: () => {router.push("/HrMeetingsAndAnnounc/hrMeetingsAndAnnounc");},
        },
        {
          icon: "📈",
          label: "Office Activity Analytics",
          subtitle: "Company-wide activity chart",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: "⚙️",
          label: "Settings",
          subtitle: "Preferences & app info",
          onPress: () => {},
        },
        {
          icon: "🚪",
          label: "Log out",
          onPress: confirmLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.bg }} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className=" px-6 pt-6 pb-2">
          <Text
            style={{ color: COLORS.ink }}
            className="text-2xl font-bold"
          >
            Profile
          </Text>
        </View>

        {/* Profile Card */}
        <View className="px-5 mt-3">
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 20,
              shadowColor: "#3E5A2A",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.06,
              shadowRadius: 14,
              elevation: 2,
            }}
            className="items-center"
          >
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                borderWidth: 3,
                borderColor: COLORS.primaryLight,
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <Image
                source={{ uri: DUMMY_AVATAR }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>

            <Text
              style={{ color: COLORS.ink }}
              className="text-lg font-bold"
            >
              {user?.name ?? "HR Admin"}
            </Text>
            <Text
              style={{ color: COLORS.muted }}
              className="text-sm mt-1"
            >
              {user?.email ?? "hr@company.com"}
            </Text>

            <View
              style={{ backgroundColor: COLORS.primaryLight }}
              className="mt-3 px-3 py-1.5 rounded-full flex-row items-center"
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: COLORS.primary,
                  marginRight: 6,
                }}
              />
              <Text
                style={{ color: COLORS.primary }}
                className="text-xs font-bold tracking-wide"
              >
                HR ADMINISTRATOR
              </Text>
            </View>

            <Pressable
              style={{ borderColor: COLORS.border }}
              className="mt-5 w-full border rounded-xl py-3 items-center active:opacity-70"
            >
              <Text
                style={{ color: COLORS.ink }}
                className="text-sm font-semibold"
              >
                Edit Profile
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} className="px-5 mt-6">
            <Text
              style={{ color: COLORS.muted }}
              className="text-xs font-bold tracking-wider uppercase mb-2 ml-1"
            >
              {section.title}
            </Text>
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                shadowColor: "#3E5A2A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 1,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  onPress={item.onPress}
                  android_ripple={{ color: COLORS.border }}
                  className="flex-row items-center px-4 py-4 active:opacity-70"
                  style={{
                    borderBottomWidth:
                      idx === section.items.length - 1 ? 0 : 1,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: item.danger
                        ? COLORS.dangerLight
                        : COLORS.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  </View>

                  <View className="flex-1">
                    <Text
                      style={{
                        color: item.danger ? COLORS.danger : COLORS.ink,
                      }}
                      className="text-[14.5px] font-semibold"
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text
                        style={{ color: COLORS.muted }}
                        className="text-xs mt-0.5"
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  {!item.danger && (
                    <Text style={{ color: COLORS.muted, fontSize: 18 }}>
                      ›
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text
          style={{ color: COLORS.muted }}
          className="text-xs text-center mt-8"
        >
          Office HRM System · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}