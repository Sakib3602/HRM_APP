// src/app/(employee)/(tabs)/home.tsx
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = width * 1.15;
const CARD_WIDTH = width * 0.36;
const CARD_SPACING = 12;

const PALETTE = {
  dark: "#11615D",
  darkDeep: "#11615D",
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
};

const menuItems: {
  key: string;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  tint: string;
}[] = [
  { key: "clock_in_out", label: "Daily Log", sub: "Clock In/Out", icon: "time-outline", bg: PALETTE.blueLight, tint: PALETTE.blue },
  { key: "job_report", label: "Submit new", sub: "Job Report", icon: "document-text-outline", bg: PALETTE.mintLight, tint: "#0E9F76" },
  { key: "incident_report", label: "Report issue", sub: "Incident Report", icon: "warning-outline", bg: PALETTE.amberLight, tint: PALETTE.amber },
  { key: "leave_report", label: "Leave Request", sub: "History", icon: "calendar-outline", bg: PALETTE.purpleLight, tint: PALETTE.purple },
];

const weekStats = [
  { key: "present", label: "Present", value: "18", icon: "checkmark-circle-outline", tint: "#0E9F76", bg: PALETTE.mintLight },
  { key: "leave", label: "Leave left", value: "6", icon: "airplane-outline", tint: PALETTE.blue, bg: PALETTE.blueLight },
  { key: "late", label: "Late", value: "2", icon: "alert-circle-outline", tint: PALETTE.rose, bg: PALETTE.roseLight },
];

const colleaguesOnLeave = [
  { key: "1", name: "Nusrat Jahan", dept: "Design", initials: "NJ", color: "#7C6FF0" },
  { key: "2", name: "Tanvir Ahmed", dept: "Engineering", initials: "TA", color: "#4A6CF7" },
];

export default function EmployeeHome() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handlePress = (key: string) => console.log(`${key} pressed`);

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_SPACING));
    if (index !== activeIndex && index >= 0 && index < menuItems.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fixed background header */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: HEADER_HEIGHT, overflow: "hidden" }}>
        <LinearGradient
          colors={[PALETTE.darkDeep, PALETTE.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <View
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: "rgba(95,224,184,0.06)",
              top: -50,
              right: -40,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 26,
              height: 26,
              borderRadius: 26,
              backgroundColor: PALETTE.mint,
              opacity: 0.85,
              bottom: 40,
              left: 24,
            }}
          />

          <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
            <View className="flex-row justify-between items-center px-5 pt-3">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-11 h-11 rounded-full justify-center items-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" }}
                >
                  <Text className="text-white font-bold text-base">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {greeting},
                  </Text>
                  <Text className="text-white text-base font-bold">{user?.name ?? "Employee"}</Text>
                </View>
              </View>

              <TouchableOpacity
                className="w-10 h-10 rounded-full justify-center items-center"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <Ionicons name="notifications-outline" size={18} color="#fff" />
                <View
                  className="absolute top-2 right-2.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: PALETTE.mint, borderWidth: 1, borderColor: PALETTE.dark }}
                />
              </TouchableOpacity>
            </View>

            <Text className="text-xs px-5 mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {today}
            </Text>

            <View className="flex-1 items-center justify-center" style={{ marginTop: -30 }}>
              <Text
                className="text-xs font-semibold tracking-widest"
                style={{ color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}
              >
                WORKING HOURS TODAY
              </Text>
              <Text className="text-white font-bold mt-2" style={{ fontSize: 56, letterSpacing: 1 }}>
                00:00:00
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                className="flex-row items-center gap-2 px-6 py-3 rounded-full mt-5"
                style={{ backgroundColor: PALETTE.mint }}
              >
                <Ionicons name="play" size={15} color={PALETTE.darkDeep} />
                <Text className="text-sm font-bold" style={{ color: PALETTE.darkDeep }}>
                  Clock In
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Scrollable content */}
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 70, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Quick stats — 3 separate cards with visible gaps */}
        <View style={{ paddingHorizontal: 26, marginBottom: 20, flexDirection: "row", gap: 10 }}>
          {weekStats.map((s) => (
            <View
              key={s.key}
              className="flex-1 items-center bg-white py-4"
              style={{
                borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 14,
                elevation: 5,
              }}
            >
              <View className="w-8 h-8 justify-center items-center mb-1.5" style={{ backgroundColor: s.bg, borderRadius: 8 }}>
                <Ionicons name={s.icon as any} size={15} color={s.tint} />
              </View>
              <Text className="text-base font-bold text-gray-800">{s.value}</Text>
              <Text className="text-[10px] text-gray-400 mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Carousel — clean cards with themed shadows, no clipping */}
        <View style={{ marginBottom: 26 }}>
          <View className="flex-row items-center justify-between px-6 mb-3">
            <Text className="text-base font-bold" style={{ color: PALETTE.dark }}>
              Quick Access
            </Text>
            <View className="flex-row gap-1.5">
              {menuItems.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: activeIndex === i ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: PALETTE.dark,
                    opacity: activeIndex === i ? 1 : 0.3,
                  }}
                />
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 26, gap: CARD_SPACING, paddingVertical: 8 }}
            style={{ overflow: "visible" }}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={32}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => handlePress(item.key)}
                activeOpacity={0.85}
                style={{
                  width: CARD_WIDTH,
               
                  backgroundColor: "#fff",
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#F8FAFC",
                  shadowColor: item.tint,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View
                  className="w-10 h-10 justify-center items-center mr-3"
                  style={{ backgroundColor: item.bg, borderRadius: 10 }}
                >
                  <Ionicons name={item.icon} size={18} color={item.tint} />
                </View>

                <View className="flex-1">
                  <Text className="text-[10px] text-gray-400 font-medium" numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text className="text-sm font-bold text-gray-800 mt-0.5" numberOfLines={1}>
                    {item.sub}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* White content container */}
        <View className="bg-white flex-1 rounded-t-[32px] pt-6" style={{ minHeight: 500 }}>
          {/* Announcement banner — upgraded to a stunning gradient card */}
          <View className="px-5 mb-7">
            <LinearGradient
              colors={["#11615D", "#0A3B39"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#11615D",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <View
                className="w-10 h-10 rounded-full justify-center items-center mr-3"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                <Ionicons name="megaphone-outline" size={18} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-bold">New HR policy update</Text>
                <Text className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.68)" }}>
                  Tap to read the latest announcement
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </View>

          {/* Next Holiday */}
          <View className="px-5">
            <Text className="text-base font-bold mb-3" style={{ color: PALETTE.dark }}>
              Next Holiday
            </Text>
            <View
              className="rounded-2xl p-4 flex-row items-center justify-between"
              style={{
                backgroundColor: PALETTE.mintLight,
                borderWidth: 1,
                borderColor: "rgba(95,224,184,0.3)",
                shadowColor: "#0E9F76",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View>
                <Text className="text-sm font-bold" style={{ color: PALETTE.dark }}>
                  Tuesday, 17 August
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: "#0E9F76" }}>
                  Independence Day
                </Text>
              </View>
              <View className="w-11 h-11 rounded-full justify-center items-center" style={{ backgroundColor: PALETTE.dark }}>
                <Ionicons name="calendar" size={20} color="#fff" />
              </View>
            </View>
          </View>

          {/* Colleagues on leave */}
          <View className="mt-7 px-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold" style={{ color: PALETTE.dark }}>
                On Leave Today
              </Text>
              <Text className="text-xs font-semibold" style={{ color: PALETTE.blue }}>
                See all
              </Text>
            </View>

            {colleaguesOnLeave.length === 0 ? (
              <View
                className="bg-white rounded-2xl p-5 items-center border"
                style={{
                  borderColor: "#F1F5F9",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <Ionicons name="sunny-outline" size={26} color={PALETTE.amber} />
                <Text className="text-xs text-gray-400 mt-2">Everyones in today</Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {colleaguesOnLeave.map((c) => (
                  <View
                    key={c.key}
                    className="flex-row items-center bg-white rounded-2xl p-3.5 border"
                    style={{
                      borderColor: "#F8FAFC",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.03,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-full justify-center items-center mr-3"
                      style={{
                        backgroundColor: c.color + "15",
                        borderWidth: 1.5,
                        borderColor: c.color,
                      }}
                    >
                      <Text className="text-xs font-bold" style={{ color: c.color }}>
                        {c.initials}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-800">{c.name}</Text>
                      <Text className="text-xs text-gray-400">{c.dept}</Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: PALETTE.amberLight }}>
                      <Text className="text-[10px] font-bold" style={{ color: PALETTE.amber }}>
                        On Leave
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Who's on Birthday */}
          <View className="mt-7 px-5" style={{ marginBottom: 20 }}>
            <Text className="text-base font-bold" style={{ color: PALETTE.dark }}>
              Whos on Birthday
            </Text>
            <View
              className="bg-white rounded-2xl p-5 mt-3 items-center border"
              style={{
                borderColor: "#F8FAFC",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                className="w-12 h-12 rounded-full justify-center items-center mb-2"
                style={{ backgroundColor: PALETTE.amberLight }}
              >
                <Ionicons name="gift-outline" size={22} color={PALETTE.amber} />
              </View>
              <Text className="text-xs text-gray-400 font-medium">No birthdays today</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}