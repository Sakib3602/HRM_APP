// src/app/(employee)/(tabs)/checklist.tsx
import axiosClient from "@/api/axiosClient";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PALETTE = {
  dark: "#18554E",
  darkDeep: "#113C37",
  mint: "#64D2B5",
  mintDeep: "#52C0A4",
  bg: "#F4F7F6",
  border: "#E8F3F1",
  muted: "#64748B",
  mutedLight: "#94A3B8",
};

const EMPTY_STATE_IMAGE = "https://res.cloudinary.com/dpwuivub7/image/upload/v1786359981/dd_yoz5wi.png";

interface ChecklistFormValues {
  siteAddress: string;
  comments: string;
  ppeChecked: boolean;
  vehicleChecked: boolean;
  toolsChecked: boolean;
  workAreaSafe: boolean;
  firstAidAvailable: boolean;
}

interface ChecklistRecord {
  _id: string;
  jobNumber: string;
  siteAddress: string;
  items: {
    ppeChecked: boolean;
    vehicleChecked: boolean;
    toolsChecked: boolean;
    workAreaSafe: boolean;
    firstAidAvailable: boolean;
  };
  comments?: string;
  submittedAt: string;
}

interface ChecklistResponse {
  checklists: ChecklistRecord[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const checklistItems: { key: keyof ChecklistFormValues; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "ppeChecked", label: "PPE Checked", icon: "shirt-outline" },
  { key: "vehicleChecked", label: "Vehicle Checked", icon: "car-outline" },
  { key: "toolsChecked", label: "Tools & Equipment", icon: "hammer-outline" },
  { key: "workAreaSafe", label: "Work Area Safe", icon: "shield-checkmark-outline" },
  { key: "firstAidAvailable", label: "First Aid Available", icon: "medkit-outline" },
];

const LIMIT = 10;

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// --- SKELETON COMPONENTS ---
const SkeletonItem = () => (
  <View
    className="bg-white rounded-2xl p-4 mb-3 border"
    style={{ borderColor: PALETTE.border }}
  >
    <View className="flex-row items-center justify-between mb-3">
      {/* Job Number Skeleton */}
      <View className="w-20 h-6 rounded-lg bg-slate-200" />
      {/* Status Skeleton */}
      <View className="w-24 h-6 rounded-lg bg-slate-200" />
    </View>

    {/* Location Skeleton */}
    <View className="flex-row items-center gap-2 mb-2">
      <View className="w-4 h-4 rounded-full bg-slate-200" />
      <View className="flex-1 h-4 rounded bg-slate-200" />
    </View>

    {/* Date Skeleton */}
    <View className="w-32 h-3 rounded bg-slate-200 mt-1" />
  </View>
);

const SkeletonList = () => (
  <View className="px-5 w-full flex-1 pt-2">
    <Text className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: PALETTE.muted }}>
      Submission History
    </Text>
    {[1, 2, 3, 4, 5,6,7].map((key) => (
      <SkeletonItem key={key} />
    ))}
  </View>
);
// --- END SKELETON COMPONENTS ---

export default function Checklist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChecklistFormValues>({
    defaultValues: {
      siteAddress: "",
      comments: "",
      ppeChecked: false,
      vehicleChecked: false,
      toolsChecked: false,
      workAreaSafe: false,
      firstAidAvailable: false,
    },
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<ChecklistResponse>({
    queryKey: ["my-checklists"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await axiosClient.get("/checklists/my", {
        params: { page: pageParam, limit: LIMIT },
      });
      return res.data;
    },
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });

  const history = useMemo(() => data?.pages.flatMap((p) => p.checklists) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const submitMutation = useMutation({
    mutationFn: async (formData: ChecklistFormValues) => {
      const res = await axiosClient.post("/checklists", {
        siteAddress: formData.siteAddress,
        comments: formData.comments,
        items: {
          ppeChecked: formData.ppeChecked,
          vehicleChecked: formData.vehicleChecked,
          toolsChecked: formData.toolsChecked,
          workAreaSafe: formData.workAreaSafe,
          firstAidAvailable: formData.firstAidAvailable,
        },
      });
      return res.data;
    },
    onSuccess: (responseData) => {
      Alert.alert("Checklist submitted", `Job number ${responseData.jobNumber} has been recorded.`);
      reset();
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-checklists"] });
    },
    onError: (err: any) => {
      Alert.alert("Submission failed", err?.response?.data?.message || "Something went wrong");
    },
  });

  const onSubmit = (formData: ChecklistFormValues) => submitMutation.mutate(formData);

  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PALETTE.bg }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.bg} />

      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold" style={{ color: PALETTE.dark }}>
            Daily Checklist
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: PALETTE.muted }}>
            {total} submitted so far
          </Text>
        </View>
      </View>

      {/* Skeleton / FlatList Conditional Rendering */}
      {isLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.mint} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => hasNextPage && fetchNextPage()}
          ListHeaderComponent={
            history.length > 0 ? (
              <Text className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: PALETTE.muted }}>
                Submission History
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <Image
                source={{ uri: EMPTY_STATE_IMAGE }}
                style={{ width: 190, height: 190 }}
                resizeMode="contain"
              />
              <Text className="text-base font-bold mt-2" style={{ color: PALETTE.dark }}>
                No checklists submitted yet
              </Text>
              <Text className="text-sm mt-1 text-center" style={{ color: PALETTE.mutedLight }}>
                Tap the + button to submit today's{"\n"}safety checklist.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={PALETTE.mint} style={{ marginVertical: 14 }} />
            ) : null
          }
          renderItem={({ item }) => {
            const checkedCount = Object.values(item.items).filter(Boolean).length;
            const statusColor =
              checkedCount === 5
                ? { bg: "#ECFDF5", text: "#047857" }
                : checkedCount >= 3
                ? { bg: "#FFFBEB", text: "#B45309" }
                : { bg: "#FEF2F2", text: "#B91C1C" };

            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3 border"
                style={{ borderColor: PALETTE.border }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: PALETTE.border }}
                  >
                    <Ionicons name="pricetag-outline" size={12} color={PALETTE.mintDeep} />
                    <Text className="text-xs font-bold" style={{ color: PALETTE.dark }}>
                      {item.jobNumber}
                    </Text>
                  </View>
                  <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: statusColor.bg }}>
                    <Text className="text-[11px] font-bold" style={{ color: statusColor.text }}>
                      {checkedCount}/5 Checked
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start gap-1.5 mb-1.5">
                  <Ionicons name="location-outline" size={14} color={PALETTE.mutedLight} style={{ marginTop: 1 }} />
                  <Text className="text-sm font-semibold flex-1" style={{ color: PALETTE.dark }} numberOfLines={1}>
                    {item.siteAddress}
                  </Text>
                </View>

                <Text className="text-xs" style={{ color: PALETTE.mutedLight }}>
                  Submitted {formatDateTime(item.submittedAt)}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalOpen(true)}
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center"
        style={{
          backgroundColor: PALETTE.mint,
          shadowColor: PALETTE.darkDeep,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color={PALETTE.darkDeep} />
      </TouchableOpacity>

      {/* Add checklist modal */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(15,23,42,0.45)" }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="bg-white rounded-t-3xl"
            style={{ maxHeight: "90%" }}
          >
            {/* Sheet handle */}
            <View className="items-center pt-3 pb-1">
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" }} />
            </View>

            <View className="flex-row justify-between items-center px-5 pt-2 pb-3">
              <Text className="text-lg font-bold" style={{ color: PALETTE.dark }}>
                Submit Checklist
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={22} color={PALETTE.muted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => "form"}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
              renderItem={() => (
                <View>
                  {/* Auto-filled info strip */}
                  <View className="flex-row gap-2.5 mb-5">
                    <View
                      className="flex-1 flex-row items-center gap-2 rounded-2xl px-3 py-2.5"
                      style={{ backgroundColor: PALETTE.bg }}
                    >
                      <View
                        className="w-7 h-7 rounded-full justify-center items-center"
                        style={{ backgroundColor: PALETTE.border }}
                      >
                        <Ionicons name="person-outline" size={13} color={PALETTE.dark} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[9px] font-bold uppercase" style={{ color: PALETTE.mutedLight }}>
                          Employee
                        </Text>
                        <Text className="text-xs font-bold" style={{ color: PALETTE.dark }} numberOfLines={1}>
                          {user?.name ?? "—"}
                        </Text>
                      </View>
                    </View>

                    <View
                      className="flex-1 flex-row items-center gap-2 rounded-2xl px-3 py-2.5"
                      style={{ backgroundColor: PALETTE.bg }}
                    >
                      <View
                        className="w-7 h-7 rounded-full justify-center items-center"
                        style={{ backgroundColor: PALETTE.border }}
                      >
                        <Ionicons name="time-outline" size={13} color={PALETTE.dark} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[9px] font-bold uppercase" style={{ color: PALETTE.mutedLight }}>
                          Date & Time
                        </Text>
                        <Text className="text-xs font-bold" style={{ color: PALETTE.dark }} numberOfLines={1}>
                          {formattedTime}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Site address */}
                  <Text className="text-xs font-bold mb-1.5" style={{ color: PALETTE.dark }}>
                    Site address
                  </Text>
                  <Controller
                    control={control}
                    name="siteAddress"
                    rules={{ required: "Site address is required" }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="e.g. 42 Baker Street, London"
                        placeholderTextColor="#9CA3AF"
                        className="rounded-xl px-4 py-3 text-sm text-gray-800 mb-1"
                        style={{ backgroundColor: PALETTE.bg }}
                      />
                    )}
                  />
                  {errors.siteAddress && (
                    <Text className="text-red-500 text-xs mb-3">{errors.siteAddress.message}</Text>
                  )}

                  {/* Checklist items */}
                  <Text className="text-xs font-bold mb-2 mt-4" style={{ color: PALETTE.dark }}>
                    Checklist items
                  </Text>
                  <View className="gap-2">
                    {checklistItems.map((item) => (
                      <Controller
                        key={item.key}
                        control={control}
                        name={item.key}
                        render={({ field: { onChange, value } }) => (
                          <TouchableOpacity
                            onPress={() => onChange(!value)}
                            activeOpacity={0.7}
                            className="flex-row items-center gap-3 rounded-xl px-4 py-3.5 border"
                            style={{
                              backgroundColor: value ? "#ECFDF5" : "#fff",
                              borderColor: value ? PALETTE.mint : PALETTE.border,
                            }}
                          >
                            <View
                              className="w-9 h-9 rounded-lg justify-center items-center"
                              style={{ backgroundColor: value ? PALETTE.mint : PALETTE.bg }}
                            >
                              <Ionicons
                                name={item.icon}
                                size={16}
                                color={value ? PALETTE.darkDeep : PALETTE.mutedLight}
                              />
                            </View>
                            <Text
                              className="text-sm font-semibold flex-1"
                              style={{ color: value ? PALETTE.dark : "#475569" }}
                            >
                              {item.label}
                            </Text>
                            <View
                              className="w-5 h-5 rounded-full justify-center items-center"
                              style={{
                                backgroundColor: value ? PALETTE.mint : "transparent",
                                borderWidth: value ? 0 : 1.5,
                                borderColor: "#CBD5E1",
                              }}
                            >
                              {value && <Ionicons name="checkmark" size={13} color={PALETTE.darkDeep} />}
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    ))}
                  </View>

                  {/* Comments */}
                  <Text className="text-xs font-bold mb-1.5 mt-5" style={{ color: PALETTE.dark }}>
                    Comments (Optional)
                  </Text>
                  <Controller
                    control={control}
                    name="comments"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Any additional notes about today's job..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className="rounded-xl px-4 py-3 text-sm text-gray-800"
                        style={{ backgroundColor: PALETTE.bg, minHeight: 80 }}
                      />
                    )}
                  />

                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={submitMutation.isPending}
                    className="flex-row items-center justify-center gap-2 rounded-full py-3.5 mt-6"
                    style={{ backgroundColor: PALETTE.mint, opacity: submitMutation.isPending ? 0.7 : 1 }}
                  >
                    {submitMutation.isPending ? (
                      <ActivityIndicator color={PALETTE.darkDeep} />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color={PALETTE.darkDeep} />
                        <Text className="text-sm font-bold" style={{ color: PALETTE.darkDeep }}>
                          Submit Checklist
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}