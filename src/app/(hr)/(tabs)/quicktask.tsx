// src/app/(hr)/(tabs)/quick-task.tsx
import axiosClient from "@/api/axiosClient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND = {
  50: "#f4f7ec",
  100: "#e6edd3",
  200: "#c8d9a3",
  400: "#9dbd5e",
  500: "#80A33C",
  600: "#698532",
  700: "#4f6626",
};

interface TaskFormValues {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
}

interface EmployeeOption {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  completionNote?: string;
  assignedTo: { _id: string; name: string; email: string; department: string };
  createdBy: { _id: string; name: string };
  createdAt: string;
}

type EffectiveStatus = Task["status"] | "overdue";

const statusConfig: Record<
  EffectiveStatus,
  { label: string; bg: string; text: string; dot: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: "Pending", bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B", icon: "time-outline" },
  "in-progress": { label: "In Progress", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", icon: "sync-outline" },
  completed: { label: "Completed", bg: "#ECFDF5", text: "#047857", dot: "#10B981", icon: "checkmark-circle-outline" },
  overdue: { label: "Overdue", bg: "#FFF1F2", text: "#BE123C", dot: "#E11D48", icon: "warning-outline" },
};

const isTaskOverdue = (task: Task) => {
  if (task.status === "completed") return false;
  return new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
};
const getEffectiveStatus = (task: Task): EffectiveStatus => (isTaskOverdue(task) ? "overdue" : task.status);

const getInitials = (name?: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";

const avatarPalette = ["#475569", "#4F46E5", "#0D9488", "#B45309", "#7C3AED", "#0891B2"];
const getAvatarColor = (name?: string) => avatarPalette[(name?.charCodeAt(0) ?? 0) % avatarPalette.length];

const formatDueDate = (dateStr: string) => {
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  const formatted = due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (diffDays === 0) return { formatted, relative: "Due today" };
  if (diffDays === 1) return { formatted, relative: "Due tomorrow" };
  if (diffDays > 1) return { formatted, relative: `In ${diffDays} days` };
  return { formatted, relative: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} overdue` };
};

const STATUS_FILTERS = ["all", "pending", "in-progress", "completed"] as const;

export default function QuickTask() {
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [empPickerOpen, setEmpPickerOpen] = useState(false);
  const [statusSheetTask, setStatusSheetTask] = useState<Task | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues>();

  const selectedEmpId = watch("assignedTo");
  const selectedDueDate = watch("dueDate");

  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ["all-users-dropdown"],
    queryFn: async () => {
      const res = await axiosClient.get("/users/allUsers");
      return res.data.users;
    },
  });
  const assignableEmployees = useMemo(
    () => employees.filter((e) => e.role === "employee"),
    [employees]
  );
  const selectedEmployee = assignableEmployees.find((e) => e._id === selectedEmpId);

  const { data: tasks = [], isLoading, refetch, isRefetching } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await axiosClient.get("/tasks");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const res = await axiosClient.post("/tasks", data);
      return res.data;
    },
    onSuccess: () => {
      reset();
      setAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: any) => {
      Alert.alert("Failed to assign", err?.response?.data?.message || "Something went wrong");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axiosClient.patch(`/tasks/${id}/status`, { status });
    },
    onSuccess: () => {
      setStatusSheetTask(null);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      await axiosClient.delete(`/tasks/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onSettled: () => setDeletingId(null),
  });

  const confirmDelete = (task: Task) => {
    Alert.alert("Remove task", `Remove "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(task._id) },
    ]);
  };

  const onSubmit = (data: TaskFormValues) => createMutation.mutate(data);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const ao = isTaskOverdue(a);
      const bo = isTaskOverdue(b);
      if (ao && !bo) return -1;
      if (!ao && bo) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks]);

  const filteredTasks = useMemo(
    () => (statusFilter === "all" ? sortedTasks : sortedTasks.filter((t) => t.status === statusFilter)),
    [sortedTasks, statusFilter]
  );

  const filterCounts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks]
  );

  const overdueCount = tasks.filter(isTaskOverdue).length;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND[50] }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND[50]} />

      {/* Header */}
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold" style={{ color: BRAND[700] }}>
            Quick Task
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5">Assign & track team tasks</Text>
        </View>
        {overdueCount > 0 && (
          <View className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full" style={{ backgroundColor: "#FFF1F2" }}>
            <Ionicons name="warning-outline" size={12} color="#BE123C" />
            <Text className="text-[11px] font-bold" style={{ color: "#BE123C" }}>
              {overdueCount} overdue
            </Text>
          </View>
        )}
      </View>

      {/* Filter chips */}
      <View className="px-5 mb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(k) => k}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item: key }) => (
            <Pressable
              onPress={() => setStatusFilter(key)}
              className="px-3.5 py-1.5 rounded-full flex-row items-center"
              style={{
                backgroundColor: statusFilter === key ? BRAND[500] : "#fff",
                borderWidth: 1,
                borderColor: statusFilter === key ? BRAND[500] : BRAND[100],
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: statusFilter === key ? "#fff" : "#64748B" }}>
                {key === "all" ? "All" : key === "in-progress" ? "In Progress" : key[0].toUpperCase() + key.slice(1)}
              </Text>
              <Text
                className="text-[11px] font-semibold ml-1.5"
                style={{ color: statusFilter === key ? "rgba(255,255,255,0.75)" : "#9CA3AF" }}
              >
                {filterCounts[key]}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Task list */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={BRAND[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND[500]} />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="file-tray-outline" size={36} color={BRAND[200]} />
              <Text className="text-gray-400 text-sm mt-2">No tasks found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const effectiveStatus = getEffectiveStatus(item);
            const cfg = statusConfig[effectiveStatus];
            const overdue = effectiveStatus === "overdue";
            const dueInfo = formatDueDate(item.dueDate);

            return (
              <View
                className="bg-white rounded-2xl p-4 mb-3 border"
                style={{ borderColor: overdue ? "#FECDD3" : BRAND[100] }}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold text-gray-800">{item.title}</Text>
                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    disabled={deletingId === item._id}
                    className="p-1.5"
                  >
                    <Ionicons name="trash-outline" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>

                {item.status === "completed" && item.completionNote && (
                  <View className="mt-2.5 px-3 py-2 rounded-lg" style={{ backgroundColor: "#ECFDF5" }}>
                    <Text className="text-xs" style={{ color: "#047857" }}>
                      <Text className="font-bold">Note: </Text>
                      {item.completionNote}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mt-3.5 pt-3.5 border-t" style={{ borderColor: BRAND[50] }}>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-8 h-8 rounded-full justify-center items-center"
                      style={{ backgroundColor: getAvatarColor(item.assignedTo?.name) }}
                    >
                      <Text className="text-white text-[11px] font-bold">{getInitials(item.assignedTo?.name)}</Text>
                    </View>
                    <View>
                      <Text className="text-xs font-semibold text-gray-800">{item.assignedTo?.name}</Text>
                      <Text className="text-[11px] text-gray-400">{item.assignedTo?.department}</Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className={`text-xs font-semibold ${overdue ? "" : "text-gray-600"}`} style={overdue ? { color: "#BE123C" } : undefined}>
                      {dueInfo.formatted}
                    </Text>
                    <Text className="text-[11px]" style={{ color: overdue ? "#E11D48" : "#9CA3AF" }}>
                      {dueInfo.relative}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setStatusSheetTask(item)}
                  className="flex-row items-center justify-center gap-1.5 mt-3 py-2 rounded-lg"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  <Text className="text-xs font-bold" style={{ color: cfg.text }}>
                    {cfg.label}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={cfg.text} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setAddModalOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        style={{ backgroundColor: BRAND[500] }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={addModalOpen} animationType="slide" transparent onRequestClose={() => setAddModalOpen(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(15,23,42,0.4)" }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="bg-white rounded-t-3xl max-h-[88%]">
            <View className="flex-row justify-between items-center px-5 pt-5 pb-3">
              <Text className="text-lg font-bold" style={{ color: BRAND[700] }}>
                Assign new task
              </Text>
              <TouchableOpacity onPress={() => setAddModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => "form"}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
              renderItem={() => (
                <View>
                  <Text className="text-xs font-semibold text-gray-500 mb-1.5">Task title</Text>
                  <Controller
                    control={control}
                    name="title"
                    rules={{ required: "Title is required" }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="e.g. Prepare Q3 attendance report"
                        placeholderTextColor="#9CA3AF"
                        className="bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-800 mb-1"
                        style={{ borderColor: BRAND[100] }}
                      />
                    )}
                  />
                  {errors.title && <Text className="text-red-500 text-xs mb-3">{errors.title.message}</Text>}

                  <Text className="text-xs font-semibold text-gray-500 mb-1.5 mt-3">Description</Text>
                  <Controller
                    control={control}
                    name="description"
                    rules={{ required: "Description is required" }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Task details..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className="bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-800 mb-1"
                        style={{ borderColor: BRAND[100], minHeight: 80 }}
                      />
                    )}
                  />
                  {errors.description && <Text className="text-red-500 text-xs mb-3">{errors.description.message}</Text>}

                  <Text className="text-xs font-semibold text-gray-500 mb-1.5 mt-3">Assign to</Text>
                  <TouchableOpacity
                    onPress={() => setEmpPickerOpen(true)}
                    className="bg-gray-50 border rounded-xl px-4 py-3 flex-row items-center justify-between"
                    style={{ borderColor: BRAND[100] }}
                  >
                    <Text className={`text-sm ${selectedEmployee ? "text-gray-800" : "text-gray-400"}`}>
                      {selectedEmployee ? `${selectedEmployee.name} — ${selectedEmployee.department}` : "Select employee"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                  <Controller control={control} name="assignedTo" rules={{ required: "Please select an employee" }} render={() => <View />} />
                  {assignableEmployees.length === 0 && (
                    <Text className="text-amber-600 text-xs mt-1">No active employees available.</Text>
                  )}
                  {errors.assignedTo && <Text className="text-red-500 text-xs mt-1">{errors.assignedTo.message}</Text>}

                  <Text className="text-xs font-semibold text-gray-500 mb-1.5 mt-4">Due date</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-gray-50 border rounded-xl px-4 py-3 flex-row items-center justify-between"
                    style={{ borderColor: BRAND[100] }}
                  >
                    <Text className={`text-sm ${selectedDueDate ? "text-gray-800" : "text-gray-400"}`}>
                      {selectedDueDate
                        ? new Date(selectedDueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "Select due date"}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                  <Controller control={control} name="dueDate" rules={{ required: "Due date is required" }} render={() => <View />} />
                  {errors.dueDate && <Text className="text-red-500 text-xs mt-1">{errors.dueDate.message}</Text>}

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDueDate ? new Date(selectedDueDate) : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      minimumDate={new Date()}
                      onChange={(event, date) => {
                        setShowDatePicker(Platform.OS === "ios");
                        if (event.type === "dismissed") {
                          setShowDatePicker(false);
                          return;
                        }
                        if (date) {
                          setValue("dueDate", date.toISOString().split("T")[0]);
                          if (Platform.OS === "android") setShowDatePicker(false);
                        }
                      }}
                    />
                  )}

                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={createMutation.isPending}
                    className="rounded-xl py-3.5 items-center mt-6"
                    style={{ backgroundColor: BRAND[500], opacity: createMutation.isPending ? 0.7 : 1 }}
                  >
                    {createMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-sm font-bold">Assign task</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Employee picker modal */}
      <Modal visible={empPickerOpen} animationType="slide" transparent onRequestClose={() => setEmpPickerOpen(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(15,23,42,0.4)" }}>
          <View className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="flex-row justify-between items-center px-5 pt-5 pb-3">
              <Text className="text-lg font-bold" style={{ color: BRAND[700] }}>
                Select employee
              </Text>
              <TouchableOpacity onPress={() => setEmpPickerOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={assignableEmployees}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setValue("assignedTo", item._id, { shouldValidate: true });
                    setEmpPickerOpen(false);
                  }}
                  className="flex-row items-center gap-3 py-3 border-b"
                  style={{ borderColor: BRAND[50] }}
                >
                  <View className="w-9 h-9 rounded-full justify-center items-center" style={{ backgroundColor: getAvatarColor(item.name) }}>
                    <Text className="text-white text-xs font-bold">{getInitials(item.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-800">{item.name}</Text>
                    <Text className="text-xs text-gray-500">{item.department}</Text>
                  </View>
                  {selectedEmpId === item._id && <Ionicons name="checkmark-circle" size={20} color={BRAND[500]} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Status change bottom sheet */}
      <Modal visible={!!statusSheetTask} animationType="fade" transparent onRequestClose={() => setStatusSheetTask(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: "rgba(15,23,42,0.4)" }} onPress={() => setStatusSheetTask(null)}>
          <Pressable className="bg-white rounded-t-3xl px-5 pt-5 pb-8" onPress={(e) => e.stopPropagation()}>
            <Text className="text-base font-bold text-gray-800 mb-1">Update status</Text>
            <Text className="text-xs text-gray-500 mb-4" numberOfLines={1}>
              {statusSheetTask?.title}
            </Text>
            {(["pending", "in-progress", "completed"] as const).map((s) => {
              const cfg = statusConfig[s];
              const active = statusSheetTask?.status === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => statusSheetTask && statusMutation.mutate({ id: statusSheetTask._id, status: s })}
                  disabled={statusMutation.isPending}
                  className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl mb-2"
                  style={{ backgroundColor: active ? cfg.bg : "#F8FAFC" }}
                >
                  <Ionicons name={cfg.icon} size={18} color={cfg.dot} />
                  <Text className="text-sm font-semibold flex-1" style={{ color: active ? cfg.text : "#475569" }}>
                    {cfg.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={cfg.text} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}