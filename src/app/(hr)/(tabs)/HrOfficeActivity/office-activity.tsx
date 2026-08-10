
import axiosClient from "@/api/axiosClient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const PALETTE = {
  dark: "#2C3E2F",
  mid: "#4F7A3D",
  primary: "#8FB978",
  primaryLight: "#F2F8EC",
  border: "#E4E9E4",
  muted: "#6B7D6B",
  mutedLight: "#9CAA9C",
};

type RangeFilter = "today" | "week" | "month";

interface EmployeeSummary {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  total: number;
}

interface EmployeeSummaryResponse {
  employees: EmployeeSummary[];
  companyTotal: number;
  range: string;
}

interface EmployeeDetail {
  byType: { activityType: string; total: number }[];
  byDate: { date: string; total: number }[];
}

const avatarPalette = ["#8FB978", "#6FA05C", "#5C8A4B", "#A9C98F", "#7CA666", "#4F7A3D"];
const getAvatarColor = (name: string) => avatarPalette[(name?.charCodeAt(0) ?? 0) % avatarPalette.length];
const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const formatChartDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const RANGE_OPTIONS: { key: RangeFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 Days" },
  { key: "month", label: "30 Days" },
];

export default function OfficeActivity() {
  const [range, setRange] = useState<RangeFilter>("week");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery<EmployeeSummaryResponse>({
    queryKey: ["hr-office-activity", range],
    queryFn: async () => {
      const res = await axiosClient.get("/office-activity/hr/employees", { params: { range } });
      return res.data;
    },
  });

  const employees = data?.employees ?? [];
  const maxTotal = Math.max(...employees.map((e) => e.total), 1);
  const rangeLabel = { today: "Today", week: "Last 7 days", month: "Last 30 days" }[range];

  const activeEmployee = employees.find((e) => e.employeeId === selectedEmployeeId);

  const { data: detail, isLoading: detailLoading } = useQuery<EmployeeDetail>({
    queryKey: ["hr-employee-activity-detail", selectedEmployeeId, range],
    queryFn: async () => {
      const res = await axiosClient.get(`/office-activity/hr/employee/${selectedEmployeeId}`, {
        params: { range },
      });
      return res.data;
    },
    enabled: !!selectedEmployeeId,
  });

  const openEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setSheetOpen(true);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PALETTE.primaryLight }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.primaryLight} />

      {/* Header */}
      <View className="px-5 pt-2 pb-3">
        <Text className="text-2xl font-bold" style={{ color: PALETTE.dark }}>
          Office Activity
        </Text>
        <Text className="text-sm mt-0.5" style={{ color: PALETTE.muted }}>
          Track team activity across all employees
        </Text>
      </View>

      {/* Range toggle */}
      <View className="px-5 mb-4">
        <View
          className="flex-row bg-white rounded-xl p-1 border"
          style={{ borderColor: PALETTE.border }}
        >
          {RANGE_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRange(r.key)}
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: range === r.key ? PALETTE.primary : "transparent" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: range === r.key ? "#fff" : PALETTE.muted }}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={PALETTE.primary} />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.employeeId}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.primary} />
          }
          ListHeaderComponent={
            <View>
              {/* Company total card */}
              <View
                className="bg-white rounded-2xl p-5 mb-4 border"
                style={{ borderColor: PALETTE.border }}
              >
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="trending-up-outline" size={15} color={PALETTE.mid} />
                  <Text
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: PALETTE.mid }}
                  >
                    Company total — {rangeLabel}
                  </Text>
                </View>
                <Text className="text-3xl font-bold" style={{ color: PALETTE.dark }}>
                  {data?.companyTotal ?? 0}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: PALETTE.mutedLight }}>
                  {employees.length} employees logged activity
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5 mb-2">
                <Ionicons name="people-outline" size={15} color={PALETTE.mid} />
                <Text className="text-sm font-bold" style={{ color: PALETTE.dark }}>
                  Employees, sorted by activity
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="file-tray-outline" size={30} color={PALETTE.mutedLight} />
              <Text className="text-sm mt-2" style={{ color: PALETTE.mutedLight }}>
                No activity logged for this period
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const barWidth = (item.total / maxTotal) * 100;
            return (
              <TouchableOpacity
                onPress={() => openEmployee(item.employeeId)}
                activeOpacity={0.8}
                className="bg-white rounded-2xl p-4 mb-2.5 border"
                style={{ borderColor: PALETTE.border }}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-xs font-bold w-4" style={{ color: PALETTE.mutedLight }}>
                    {index + 1}
                  </Text>
                  <View
                    className="w-9 h-9 rounded-full justify-center items-center"
                    style={{ backgroundColor: getAvatarColor(item.name) }}
                  >
                    <Text className="text-white text-[11px] font-bold">{getInitials(item.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: PALETTE.dark }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-xs" style={{ color: PALETTE.mutedLight }} numberOfLines={1}>
                      {item.department}
                    </Text>
                  </View>
                  <Text className="text-base font-bold" style={{ color: PALETTE.mid }}>
                    {item.total}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={PALETTE.mutedLight} />
                </View>

                <View
                  className="mt-2.5 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: PALETTE.primaryLight, marginLeft: 44 }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${barWidth}%`, backgroundColor: PALETTE.primary }}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Employee detail bottom sheet */}
      <Modal
        visible={sheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(15,23,42,0.4)" }}
          onPress={() => setSheetOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl"
            style={{ maxHeight: "85%" }}
            onPress={(e) => e.stopPropagation()}
          >
            {activeEmployee && (
              <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {/* Sheet header */}
                <View className="flex-row items-center px-5 pt-5 pb-4">
                  <View
                    className="w-11 h-11 rounded-full justify-center items-center mr-3"
                    style={{ backgroundColor: getAvatarColor(activeEmployee.name) }}
                  >
                    <Text className="text-white text-sm font-bold">{getInitials(activeEmployee.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-base" style={{ color: PALETTE.dark }}>
                      {activeEmployee.name}
                    </Text>
                    <Text className="text-xs" style={{ color: PALETTE.mutedLight }}>
                      {activeEmployee.department} · {rangeLabel}
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold mr-3" style={{ color: PALETTE.mid }}>
                    {activeEmployee.total}
                  </Text>
                  <TouchableOpacity onPress={() => setSheetOpen(false)}>
                    <Ionicons name="close" size={22} color={PALETTE.muted} />
                  </TouchableOpacity>
                </View>

                {detailLoading ? (
                  <View className="py-16 items-center">
                    <ActivityIndicator color={PALETTE.primary} />
                  </View>
                ) : (
                  <View className="px-5">
                    {/* Trend line chart */}
                    <Text
                      className="text-[11px] font-bold uppercase tracking-wide mb-2"
                      style={{ color: PALETTE.muted }}
                    >
                      Activity trend
                    </Text>
                    {!detail?.byDate.length ? (
                      <Text className="text-sm text-center py-8" style={{ color: PALETTE.mutedLight }}>
                        No data for this period
                      </Text>
                    ) : (
                      <LineChart
                        data={{
                          labels: detail.byDate.map((d) => formatChartDate(d.date)),
                          datasets: [{ data: detail.byDate.map((d) => d.total) }],
                        }}
                        width={width - 40}
                        height={190}
                        withInnerLines
                        withOuterLines={false}
                        withShadow={false}
                        chartConfig={{
                          backgroundColor: "#fff",
                          backgroundGradientFrom: "#fff",
                          backgroundGradientTo: "#fff",
                          decimalPlaces: 0,
                          color: () => PALETTE.primary,
                          labelColor: () => PALETTE.mutedLight,
                          propsForDots: { r: "3.5", strokeWidth: "2", stroke: PALETTE.mid },
                          propsForBackgroundLines: { stroke: PALETTE.border },
                        }}
                        bezier
                        style={{ borderRadius: 14, marginBottom: 24 }}
                      />
                    )}

                    {/* By activity type */}
                    <Text
                      className="text-[11px] font-bold uppercase tracking-wide mb-2"
                      style={{ color: PALETTE.muted }}
                    >
                      By activity type
                    </Text>
                    {!detail?.byType.length ? (
                      <Text className="text-sm text-center py-8" style={{ color: PALETTE.mutedLight }}>
                        No data for this period
                      </Text>
                    ) : (
                      <View className="gap-2.5">
                        {detail.byType.map((t) => {
                          const typeMax = Math.max(...detail.byType.map((x) => x.total), 1);
                          const pct = (t.total / typeMax) * 100;
                          return (
                            <View key={t.activityType}>
                              <View className="flex-row justify-between mb-1">
                                <Text className="text-xs font-semibold" style={{ color: PALETTE.dark }}>
                                  {t.activityType}
                                </Text>
                                <Text className="text-xs font-bold" style={{ color: PALETTE.mid }}>
                                  {t.total}
                                </Text>
                              </View>
                              <View
                                className="h-2.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: PALETTE.primaryLight }}
                              >
                                <View
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, backgroundColor: PALETTE.primary }}
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}