// src/app/(employee)/job-report.tsx
import axiosClient from "@/api/axiosClient";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PALETTE = {
  dark: "#11615D",
  darkDeep: "#0A3B39",
  mint: "#5FE0B8",
  mintDeep: "#45C8A0",
  bg: "#F4F7F6",
  border: "#E8F3F1",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  amber: "#F5A623",
};

interface JobReportRecord {
  _id: string;
  jobNumber: string;
  customerName: string;
  startTime: string;
  finishTime: string;
  siteAddress: string;
  workCompleted: string;
  equipmentUsed?: string;
  issuesRecommendations?: string;
  status: "submitted" | "reviewed";
  createdAt: string;
}

interface JobReportFormValues {
  customerName: string;
  startTime: string;
  finishTime: string;
  siteAddress: string;
  workCompleted: string;
  equipmentUsed: string;
  issuesRecommendations: string;
}

// --- SKELETON COMPONENTS ---
const SkeletonItem = () => (
  <View className="bg-white rounded-2xl p-4 mb-3 border" style={{ borderColor: PALETTE.border }}>
    <View className="flex-row justify-between mb-3">
      <View className="w-24 h-6 rounded bg-slate-200" />
      <View className="w-16 h-6 rounded-full bg-slate-200" />
    </View>
    <View className="w-1/2 h-4 rounded bg-slate-200 mb-2" />
    <View className="w-full h-4 rounded bg-slate-200 mb-2" />
    <View className="w-3/4 h-4 rounded bg-slate-200" />
  </View>
);

const SkeletonList = () => (
  <View className="px-5 w-full flex-1 pt-2">
    {[1, 2, 3, 4].map((key) => (
      <SkeletonItem key={key} />
    ))}
  </View>
);
// --- END SKELETON COMPONENTS ---

export default function JobReport() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Modal State

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobReportFormValues>({
    defaultValues: {
      customerName: "",
      startTime: "",
      finishTime: "",
      siteAddress: "",
      workCompleted: "",
      equipmentUsed: "",
      issuesRecommendations: "",
    },
  });

  // Fetch Reports
  const { data: reports = [], isLoading: isReportsLoading, refetch } = useQuery<JobReportRecord[]>({
    queryKey: ["my-job-reports"],
    queryFn: async () => {
      const res = await axiosClient.get("/job-reports/my");
      return res.data;
    },
  });

  // Fetch Next Job Number
  const { data: nextJobData, isLoading: isJobNumLoading } = useQuery({
    queryKey: ["next-job-number"],
    queryFn: async () => {
      const res = await axiosClient.get("/job-reports/next-number");
      return res.data;
    },
  });

  const jobNumber = nextJobData?.jobNumber;
  const jobNumberNote = !jobNumber ? nextJobData?.message : "";

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async (formData: JobReportFormValues) => {
      const res = await axiosClient.post("/job-reports", { ...formData, jobNumber });
      return res.data;
    },
    onSuccess: () => {
      Alert.alert("Success", "Job report submitted successfully!");
      reset();
      setModalVisible(false); // Close Modal on success
      queryClient.invalidateQueries({ queryKey: ["my-job-reports"] });
      queryClient.invalidateQueries({ queryKey: ["next-job-number"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to submit report");
    },
  });

  const onSubmit = (data: JobReportFormValues) => {
    if (!jobNumber) {
      Alert.alert("Wait!", jobNumberNote || "Please submit today's Daily Checklist first to get a job number.");
      return;
    }
    submitMutation.mutate(data);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // Reusable Input Component
  const renderInput = (
    name: keyof JobReportFormValues,
    label: string,
    placeholder: string,
    requiredMessage?: string,
    multiline = false
  ) => (
    <View className="mb-4">
      <Text className="text-xs font-bold mb-1.5" style={{ color: PALETTE.dark }}>
        {label} {requiredMessage && <Text className="text-red-500">*</Text>}
      </Text>
      <Controller
        control={control}
        name={name}
        rules={{ required: requiredMessage }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            textAlignVertical={multiline ? "top" : "center"}
            className="rounded-xl px-4 py-3 text-sm text-gray-800 border"
            style={{
              backgroundColor: PALETTE.bg,
              borderColor: errors[name] ? "#EF4444" : PALETTE.border,
              minHeight: multiline ? 80 : 48,
            }}
          />
        )}
      />
      {errors[name] && <Text className="text-red-500 text-xs mt-1">{errors[name]?.message}</Text>}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PALETTE.bg }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.bg} />

      {/* Header */}
      <View className="px-5 pt-4 pb-4 bg-white border-b" style={{ borderColor: PALETTE.border }}>
        <Text className="text-2xl font-bold" style={{ color: PALETTE.dark }}>
          Job Reports
        </Text>
        <Text className="text-sm mt-0.5" style={{ color: PALETTE.muted }}>
          Your submitted job history
        </Text>
      </View>

      {/* Reports List */}
      {isReportsLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PALETTE.mintDeep} />}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Ionicons name="folder-open-outline" size={56} color={PALETTE.mutedLight} />
              <Text className="text-base font-bold mt-4" style={{ color: PALETTE.dark }}>
                No Reports Found
              </Text>
              <Text className="text-sm font-medium mt-1 text-center" style={{ color: PALETTE.muted }}>
                Click the + button to submit a new job report.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              className="bg-white rounded-2xl p-4 mb-3 border"
              style={{ borderColor: PALETTE.border, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50">
                  <Ionicons name="pricetag" size={12} color={PALETTE.amber} />
                  <Text className="text-xs font-bold" style={{ color: PALETTE.amber }}>
                    {item.jobNumber}
                  </Text>
                </View>
                <View
                  className="px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: item.status === "reviewed" ? "#ECFDF5" : "#F8FAFC",
                    borderColor: item.status === "reviewed" ? "#10B981" : "#CBD5E1",
                  }}
                >
                  <Text
                    className="text-[10px] font-bold capitalize"
                    style={{ color: item.status === "reviewed" ? "#047857" : "#475569" }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-bold mb-1" style={{ color: PALETTE.darkDeep }}>
                {item.customerName}
              </Text>

              <View className="flex-row items-center gap-1 mb-2">
                <Ionicons name="time-outline" size={14} color={PALETTE.mutedLight} />
                <Text className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                  {item.startTime} – {item.finishTime}
                </Text>
              </View>

              <Text className="text-xs leading-relaxed" style={{ color: PALETTE.muted }} numberOfLines={2}>
                {item.workCompleted}
              </Text>
            </View>
          )}
        />
      )}

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center"
        style={{
          backgroundColor: PALETTE.dark,
          shadowColor: PALETTE.darkDeep,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(15,23,42,0.45)" }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="bg-white rounded-t-3xl"
            style={{ maxHeight: "90%" }}
          >
            {/* Modal Header */}
            <View className="items-center pt-3 pb-1">
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" }} />
            </View>

            <View className="flex-row justify-between items-center px-5 pt-2 pb-3 border-b border-gray-100 mb-3">
              <Text className="text-lg font-bold" style={{ color: PALETTE.dark }}>
                Submit Job Report
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={PALETTE.muted} />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              
              {/* Job Number Field (Read Only) */}
              <View className="mb-4 mt-2">
                <Text className="text-xs font-bold mb-1.5" style={{ color: PALETTE.dark }}>
                  Job Number
                </Text>
                <View
                  className="rounded-xl px-4 py-3 border flex-row items-center"
                  style={{ backgroundColor: PALETTE.bg, borderColor: PALETTE.border }}
                >
                  {isJobNumLoading ? (
                    <ActivityIndicator size="small" color={PALETTE.mintDeep} />
                  ) : (
                    <Text className="text-sm font-semibold" style={{ color: jobNumber ? PALETTE.amber : PALETTE.muted }}>
                      {jobNumber || "Submit checklist first"}
                    </Text>
                  )}
                </View>
                {jobNumberNote ? <Text className="text-red-500 text-xs mt-1 font-medium">{jobNumberNote}</Text> : null}
              </View>

              {renderInput("customerName", "Customer / Company", "Enter customer name", "Customer name is required")}

              <View className="flex-row gap-3">
                <View className="flex-1">{renderInput("startTime", "Start Time", "e.g. 09:00 AM", "Start time is required")}</View>
                <View className="flex-1">{renderInput("finishTime", "Finish Time", "e.g. 05:00 PM", "Finish time is required")}</View>
              </View>

              {renderInput("siteAddress", "Site Address", "Enter full site address", "Site address is required", true)}
              {renderInput("workCompleted", "Work Completed", "Describe the work carried out...", "Work description is required", true)}
              {renderInput("equipmentUsed", "Equipment Used (Optional)", "List any equipment used...", undefined, true)}
              {renderInput("issuesRecommendations", "Issues / Recommendations (Optional)", "Any notes or issues...", undefined, true)}

              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={submitMutation.isPending || !jobNumber}
                className="flex-row items-center justify-center gap-2 rounded-xl py-4 mt-4"
                style={{
                  backgroundColor: !jobNumber ? PALETTE.mutedLight : PALETTE.dark,
                  opacity: submitMutation.isPending ? 0.7 : 1,
                }}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text className="text-sm font-bold text-white">Submit Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}