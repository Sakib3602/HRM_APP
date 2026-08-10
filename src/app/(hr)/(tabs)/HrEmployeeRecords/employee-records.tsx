// src/app/(hr)/(tabs)/employee-records.tsx
import axiosClient from "@/api/axiosClient";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PALETTE = {
  dark: "#2C3E2F",
  mid: "#4F7A3D",
  primary: "#8FB978",
  primaryLight: "#F2F8EC",
  border: "#E4E9E4",
  muted: "#6B7D6B",
  mutedLight: "#9CAA9C",
};

type RecordType = "checklist" | "jobReport" | "incident";

interface UnifiedRecord {
  type: RecordType;
  id: string;
  employee: { id: string; name: string; email?: string; department?: string };
  date: string;
  title: string;
  summary: string;
  status: string;
  meta: Record<string, any>;
}

interface EmployeeOption {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface RecordsResponse {
  records: UnifiedRecord[];
  counts: { checklist: number; jobReport: number; incident: number };
  pagination: { page: number; totalPages: number };
}

const PAGE_SIZE = 15;

const TYPE_FILTERS: { label: string; value: "all" | RecordType }[] = [
  { label: "All", value: "all" },
  { label: "Checklists", value: "checklist" },
  { label: "Job Reports", value: "jobReport" },
  { label: "Incidents", value: "incident" },
];

const TYPE_META: Record<RecordType, { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  checklist: { label: "Checklist", bg: "#ECFDF5", text: "#047857", icon: "checkbox-outline" },
  jobReport: { label: "Job Report", bg: "#FFF7ED", text: "#C2410C", icon: "briefcase-outline" },
  incident: { label: "Incident", bg: "#FEF2F2", text: "#B91C1C", icon: "warning-outline" },
};

const STATUS_META: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "#F1F5F9", text: "#475569" },
  reviewed: { bg: "#EFF6FF", text: "#1D4ED8" },
  open: { bg: "#FEF2F2", text: "#B91C1C" },
  resolved: { bg: "#ECFDF5", text: "#047857" },
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getInitials = (name?: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
const avatarPalette = ["#8FB978", "#6FA05C", "#5C8A4B", "#A9C98F", "#7CA666", "#4F7A3D"];
const getAvatarColor = (name?: string) => avatarPalette[(name?.charCodeAt(0) ?? 0) % avatarPalette.length];

export default function EmployeeRecords() {
  const [employeeId, setEmployeeId] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | RecordType>("all");
  const [empPickerOpen, setEmpPickerOpen] = useState(false);

  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ["all-users-dropdown"],
    queryFn: async () => {
      const res = await axiosClient.get("/users/allUsers");
      return res.data.users;
    },
  });

  const selectedEmployee = employees.find((e) => e._id === employeeId);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<RecordsResponse>({
    queryKey: ["employee-records", employeeId, typeFilter],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await axiosClient.get("/employee-records", {
        params: {
          employeeId: employeeId || undefined,
          type: typeFilter,
          page: pageParam,
          limit: PAGE_SIZE,
        },
      });
      return res.data;
    },
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });

  const records = useMemo(() => data?.pages.flatMap((p) => p.records) ?? [], [data]);
  const counts = data?.pages[0]?.counts ?? { checklist: 0, jobReport: 0, incident: 0 };

  const handleEmployeeSelect = (id: string) => {
    setEmployeeId(id);
    setEmpPickerOpen(false);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PALETTE.primaryLight }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.primaryLight} />

      {/* Header */}
      <View className="px-5 pt-2 pb-3">
        <Text className="text-2xl font-bold" style={{ color: PALETTE.dark }}>
          Employee Records
        </Text>
        <Text className="text-sm mt-0.5" style={{ color: PALETTE.muted }}>
          Checklists, job reports and incidents — all in one place
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={PALETTE.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.primary} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => hasNextPage && fetchNextPage()}
          ListHeaderComponent={
            <View>
              {/* Summary cards */}
              <View className="flex-row gap-2.5 mb-4">
                <SummaryCard label="Checklists" value={counts.checklist} color="#10B981" />
                <SummaryCard label="Job Reports" value={counts.jobReport} color="#F97316" />
                <SummaryCard label="Incidents" value={counts.incident} color="#EF4444" />
              </View>

              {/* Employee filter */}
              <TouchableOpacity
                onPress={() => setEmpPickerOpen(true)}
                className="bg-white rounded-2xl px-4 py-3 flex-row items-center justify-between mb-3 border"
                style={{ borderColor: PALETTE.border }}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  {selectedEmployee ? (
                    <View
                      className="w-7 h-7 rounded-full justify-center items-center"
                      style={{ backgroundColor: getAvatarColor(selectedEmployee.name) }}
                    >
                      <Text className="text-white text-[10px] font-bold">
                        {getInitials(selectedEmployee.name)}
                      </Text>
                    </View>
                  ) : (
                    <Ionicons name="people-outline" size={18} color={PALETTE.mutedLight} />
                  )}
                  <Text
                    className="text-sm flex-1"
                    style={{ color: selectedEmployee ? PALETTE.dark : PALETTE.mutedLight }}
                    numberOfLines={1}
                  >
                    {selectedEmployee ? `${selectedEmployee.name} — ${selectedEmployee.department}` : "All employees"}
                  </Text>
                </View>
                {employeeId ? (
                  <TouchableOpacity onPress={() => setEmployeeId("")} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={PALETTE.mutedLight} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-down" size={16} color={PALETTE.mutedLight} />
                )}
              </TouchableOpacity>

              {/* Type filter chips */}
              <FlatList
                horizontal
                data={TYPE_FILTERS}
                keyExtractor={(f) => f.value}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                contentContainerStyle={{ paddingBottom: 16 }}
                renderItem={({ item: f }) => (
                  <TouchableOpacity
                    onPress={() => setTypeFilter(f.value)}
                    className="px-4 py-1.5 rounded-full"
                    style={{
                      backgroundColor: typeFilter === f.value ? PALETTE.dark : "#fff",
                      borderWidth: 1,
                      borderColor: typeFilter === f.value ? PALETTE.dark : PALETTE.border,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: typeFilter === f.value ? "#fff" : PALETTE.muted }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <Text className="text-sm font-bold mb-2" style={{ color: PALETTE.dark }}>
                {selectedEmployee ? `${selectedEmployee.name}'s records` : "Latest activity — all employees"}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="file-tray-outline" size={32} color={PALETTE.mutedLight} />
              <Text className="text-sm mt-2" style={{ color: PALETTE.mutedLight }}>
                No records found
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={PALETTE.primary} style={{ marginVertical: 14 }} />
            ) : null
          }
          renderItem={({ item }) => <RecordCard record={item} showEmployee={!selectedEmployee} />}
        />
      )}

      {/* Employee picker modal */}
      <Modal visible={empPickerOpen} animationType="slide" transparent onRequestClose={() => setEmpPickerOpen(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(15,23,42,0.4)" }}>
          <View className="bg-white rounded-t-3xl max-h-[75%]">
            <View className="flex-row justify-between items-center px-5 pt-5 pb-3">
              <Text className="text-lg font-bold" style={{ color: PALETTE.dark }}>
                Select employee
              </Text>
              <TouchableOpacity onPress={() => setEmpPickerOpen(false)}>
                <Ionicons name="close" size={22} color={PALETTE.muted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={employees}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              ListHeaderComponent={
                <TouchableOpacity
                  onPress={() => handleEmployeeSelect("")}
                  className="flex-row items-center gap-3 py-3 border-b"
                  style={{ borderColor: PALETTE.primaryLight }}
                >
                  <View
                    className="w-9 h-9 rounded-full justify-center items-center"
                    style={{ backgroundColor: PALETTE.primaryLight }}
                  >
                    <Ionicons name="people-outline" size={16} color={PALETTE.mid} />
                  </View>
                  <Text className="text-sm font-semibold flex-1" style={{ color: PALETTE.dark }}>
                    All employees
                  </Text>
                  {employeeId === "" && <Ionicons name="checkmark-circle" size={20} color={PALETTE.primary} />}
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleEmployeeSelect(item._id)}
                  className="flex-row items-center gap-3 py-3 border-b"
                  style={{ borderColor: PALETTE.primaryLight }}
                >
                  <View
                    className="w-9 h-9 rounded-full justify-center items-center"
                    style={{ backgroundColor: getAvatarColor(item.name) }}
                  >
                    <Text className="text-white text-xs font-bold">{getInitials(item.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: PALETTE.dark }}>
                      {item.name}
                    </Text>
                    <Text className="text-xs" style={{ color: PALETTE.mutedLight }}>
                      {item.department}
                    </Text>
                  </View>
                  {employeeId === item._id && <Ionicons name="checkmark-circle" size={20} color={PALETTE.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      className="flex-1 bg-white rounded-2xl p-3.5"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <Text className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: PALETTE.mutedLight }}>
        {label}
      </Text>
      <Text className="text-xl font-bold mt-0.5" style={{ color: PALETTE.dark }}>
        {value}
      </Text>
    </View>
  );
}

function RecordCard({ record, showEmployee }: { record: UnifiedRecord; showEmployee: boolean }) {
  const { type, title, summary, status, date, employee, meta } = record;
  const typeMeta = TYPE_META[type];
  const statusMeta = STATUS_META[status] ?? { bg: "#F1F5F9", text: "#64748B" };

  return (
    <View
      className="bg-white rounded-2xl p-4 mb-2.5 border"
      style={{ borderColor: PALETTE.border }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: typeMeta.bg }}>
          <Ionicons name={typeMeta.icon} size={11} color={typeMeta.text} />
          <Text className="text-[10px] font-bold" style={{ color: typeMeta.text }}>
            {typeMeta.label}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] font-medium" style={{ color: PALETTE.mutedLight }}>
            {formatDate(date)}
          </Text>
          <Text className="text-[10px]" style={{ color: PALETTE.mutedLight }}>
            {formatTime(date)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mb-1">
        <Text className="text-sm font-bold flex-1" style={{ color: PALETTE.dark }} numberOfLines={1}>
          {title}
        </Text>
        {status && (
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusMeta.bg }}>
            <Text className="text-[10px] font-semibold capitalize" style={{ color: statusMeta.text }}>
              {status}
            </Text>
          </View>
        )}
      </View>

      {showEmployee && (
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <View
            className="w-4 h-4 rounded-full justify-center items-center"
            style={{ backgroundColor: getAvatarColor(employee.name) }}
          >
            <Text className="text-white" style={{ fontSize: 7, fontWeight: "700" }}>
              {getInitials(employee.name)}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: PALETTE.mutedLight }}>
            {employee.name}
            {employee.department ? ` · ${employee.department}` : ""}
          </Text>
        </View>
      )}

      <Text className="text-xs leading-4.5" style={{ color: PALETTE.muted }} numberOfLines={2}>
        {summary}
      </Text>

      {type === "checklist" && meta?.items && (
        <View className="flex-row flex-wrap gap-1.5 mt-2.5">
          {Object.entries(meta.items).map(([key, val]) => (
            <View
              key={key}
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: val ? "#ECFDF5" : "#F1F5F9" }}
            >
              <Text
                className="text-[10px] font-medium"
                style={{ color: val ? "#047857" : "#94A3B8" }}
              >
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
      )}

      {type === "jobReport" && (
        <Text className="text-[11px] mt-2" style={{ color: PALETTE.mutedLight }}>
          {meta.customerName} · {meta.startTime}–{meta.finishTime}
        </Text>
      )}

      {type === "incident" && (
        <Text className="text-[11px] mt-2" style={{ color: PALETTE.mutedLight }}>
          Severity: {meta.severity} · Location: {meta.location}
        </Text>
      )}
    </View>
  );
}