import axiosClient from "@/api/axiosClient";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface EmployeeOption {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}
interface AnnouncementFormValues {
  title: string;
  description: string;
}
interface MeetingFormValues {
  title: string;
  description: string;
  date: string;
  time: string;
  employeeId: string[];
}
interface Announcement {
  _id: string;
  title: string;
  description: string;
  createdBy: { name: string };
  createdAt: string;
}
interface Meeting {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  employeeId: { _id: string; name: string; department: string }[];
  createdBy: { name: string };
}

const getInitials = (name?: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
const avatarPalette = ["#8FB978", "#7FA867", "#DDEAC5", "#6B7D6B", "#D7C58A", "#A8B88B"];
const getAvatarColor = (name?: string) =>
  avatarPalette[(name?.charCodeAt(0) ?? 0) % avatarPalette.length];
const isMeetingPast = (m: Meeting) => new Date(`${m.date}T${m.time}`).getTime() < Date.now();
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const formatTime12h = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
};
const toYMD = (d: Date) => d.toISOString().slice(0, 10);
const toHM = (d: Date) => d.toTimeString().slice(0, 5);

type TabKey = "announcements" | "meetings";

export default function hrMeetingsAndAnnounc() {
  const axiosHr = axiosClient;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("announcements");
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);

  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ["all-users-dropdown"],
    queryFn: async () => (await axiosHr.get("/users/allUsers")).data.users,
  });

  // ---------- Announcement ----------

  const {
    control: announcementControl,
    handleSubmit: handleSubmitAnnouncement,
    reset: resetAnnouncement,
    formState: { errors: announcementErrors },
  } = useForm<AnnouncementFormValues>({ defaultValues: { title: "", description: "" } });

  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => (await axiosHr.get("/announcements")).data,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => (await axiosHr.post("/announcements", data)).data,
    onSuccess: () => {
      Alert.alert("Announcement posted", "Your announcement is now live.");
      resetAnnouncement();
      setShowAnnouncementForm(false);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: any) =>
      Alert.alert("Failed to post", err?.response?.data?.message || "Something went wrong."),
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingAnnouncementId(id);
      await axiosHr.delete(`/announcements/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
    onSettled: () => setDeletingAnnouncementId(null),
  });

  const confirmDeleteAnnouncement = (a: Announcement) => {
    Alert.alert("Remove announcement", `Delete "${a.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAnnouncementMutation.mutate(a._id) },
    ]);
  };

  // ---------- Meeting ----------
  const {
    control: meetingControl,
    handleSubmit: handleSubmitMeeting,
    reset: resetMeeting,
    watch,
    setValue,
    formState: { errors: meetingErrors },
  } = useForm<MeetingFormValues>({
    defaultValues: { title: "", description: "", date: "", time: "", employeeId: [] },
  });
  const selectedEmployeeIds = watch("employeeId");

  const { data: meetings = [], isLoading: loadingMeetings } = useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: async () => (await axiosHr.get("/meetings")).data,
  });

  const sortedMeetings = useMemo(
    () =>
      [...meetings].sort(
        (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
      ),
    [meetings]
  );

  const createMeetingMutation = useMutation({
    mutationFn: async (data: MeetingFormValues) => (await axiosHr.post("/meetings", data)).data,
    onSuccess: () => {
      Alert.alert("Meeting scheduled", "Invited employees have been notified.");
      resetMeeting();
      setShowMeetingForm(false);
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (err: any) =>
      Alert.alert("Failed to schedule", err?.response?.data?.message || "Something went wrong."),
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingMeetingId(id);
      await axiosHr.delete(`/meetings/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }),
    onSettled: () => setDeletingMeetingId(null),
  });

  const confirmDeleteMeeting = (m: Meeting) => {
    Alert.alert("Cancel meeting", `Cancel "${m.title}"?`, [
      { text: "No", style: "cancel" },
      { text: "Yes, cancel", style: "destructive", onPress: () => deleteMeetingMutation.mutate(m._id) },
    ]);
  };

  // ---------- shared: create-form toggle button ----------
  const CreateToggle = ({ open, onPress }: { open: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
      style={{ backgroundColor: open ? "#FDECEC" : "#8FB978" }}
    >
      <Feather name={open ? "x" : "plus"} size={18} color={open ? "#D64545" : "#fff"} />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F2F8EC]">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-[#2C3E2F]">Meetings & Announcements</Text>
        <Text className="text-sm text-[#6B7D6B] mt-1">
          Schedule meetings and post company-wide announcements.
        </Text>
      </View>

      {/* Segmented tab switcher */}
      <View className="mx-5 mb-4 flex-row bg-white rounded-2xl p-1.5 border border-[#E4E9E4]">
        <Pressable
          onPress={() => setActiveTab("announcements")}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl"
          style={{ backgroundColor: activeTab === "announcements" ? "#8FB978" : "transparent" }}
        >
          <Feather
            name="volume-2"
            size={14}
            color={activeTab === "announcements" ? "#fff" : "#6B7D6B"}
          />
          <Text
            className="text-sm font-semibold"
            style={{ color: activeTab === "announcements" ? "#fff" : "#6B7D6B" }}
          >
            Announcements
          </Text>
          <View
            className="px-1.5 rounded-full items-center justify-center"
            style={{
              backgroundColor: activeTab === "announcements" ? "rgba(255,255,255,0.25)" : "#EEF2ED",
              minWidth: 18,
              height: 18,
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: activeTab === "announcements" ? "#fff" : "#6B7D6B" }}
            >
              {announcements.length}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("meetings")}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl"
          style={{ backgroundColor: activeTab === "meetings" ? "#8FB978" : "transparent" }}
        >
          <Feather
            name="calendar"
            size={14}
            color={activeTab === "meetings" ? "#fff" : "#6B7D6B"}
          />
          <Text
            className="text-sm font-semibold"
            style={{ color: activeTab === "meetings" ? "#fff" : "#6B7D6B" }}
          >
            Meetings
          </Text>
          <View
            className="px-1.5 rounded-full items-center justify-center"
            style={{
              backgroundColor: activeTab === "meetings" ? "rgba(255,255,255,0.25)" : "#EEF2ED",
              minWidth: 18,
              height: 18,
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: activeTab === "meetings" ? "#fff" : "#6B7D6B" }}
            >
              {meetings.length}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ================= ANNOUNCEMENTS TAB ================= */}
      {activeTab === "announcements" && (
        <FlatList
          data={announcements}
          keyExtractor={(a) => a._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="bg-white rounded-2xl border border-[#E4E9E4] mb-4 overflow-hidden">
              <View className="flex-row items-center justify-between px-5 py-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-lg bg-[#E8F2D9] items-center justify-center">
                    <Feather name="volume-2" size={16} color="#8FB978" />
                  </View>
                  <Text className="text-base font-bold text-[#2C3E2F]">New announcement</Text>
                </View>
                <CreateToggle
                  open={showAnnouncementForm}
                  onPress={() => setShowAnnouncementForm((v) => !v)}
                />
              </View>

              {showAnnouncementForm && (
                <View className="px-5 pb-5 pt-1 border-t border-[#EEF2ED]">
                  <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5 mt-3">Title</Text>
                  <Controller
                    control={announcementControl}
                    name="title"
                    rules={{ required: "Title is required" }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="e.g. Office closed on Friday"
                        placeholderTextColor="#9CAD9B"
                        className="px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg text-sm text-[#2C3E2F]"
                      />
                    )}
                  />
                  {announcementErrors.title && (
                    <Text className="text-red-500 text-xs mt-1">{announcementErrors.title.message}</Text>
                  )}

                  <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5 mt-3">Description</Text>
                  <Controller
                    control={announcementControl}
                    name="description"
                    rules={{ required: "Description is required" }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Announcement details..."
                        placeholderTextColor="#9CAD9B"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        className="px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg text-sm text-[#2C3E2F] min-h-[90px]"
                      />
                    )}
                  />
                  {announcementErrors.description && (
                    <Text className="text-red-500 text-xs mt-1">
                      {announcementErrors.description.message}
                    </Text>
                  )}

                  <Pressable
                    onPress={handleSubmitAnnouncement((data) => createAnnouncementMutation.mutate(data))}
                    disabled={createAnnouncementMutation.isPending}
                    className="flex-row items-center justify-center gap-2 bg-[#8FB978] rounded-lg py-3 mt-4 active:opacity-80"
                    style={{ opacity: createAnnouncementMutation.isPending ? 0.6 : 1 }}
                  >
                    {createAnnouncementMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Feather name="volume-2" size={15} color="#fff" />
                    )}
                    <Text className="text-white text-sm font-semibold">
                      {createAnnouncementMutation.isPending ? "Posting..." : "Post announcement"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          }
          renderItem={({ item: a }) => (
            <View className="bg-white rounded-2xl border border-[#E4E9E4] p-4 mb-3">
              <View className="flex-row justify-between items-start gap-3">
                <View className="flex-1">
                  <Text className="font-semibold text-[#2C3E2F]">{a.title}</Text>
                  <Text className="text-xs text-[#6B7D6B] mt-1">{a.description}</Text>
                  <View className="flex-row items-center gap-2 mt-2.5">
                    <View
                      style={{ backgroundColor: getAvatarColor(a.createdBy?.name) }}
                      className="w-6 h-6 rounded-full items-center justify-center"
                    >
                      <Text className="text-white text-[9px] font-bold">
                        {getInitials(a.createdBy?.name)}
                      </Text>
                    </View>
                    <Text className="text-xs text-[#6B7D6B]">
                      {a.createdBy?.name} · {formatDate(a.createdAt)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => confirmDeleteAnnouncement(a)}
                  disabled={deletingAnnouncementId === a._id}
                  className="w-9 h-9 rounded-lg border border-[#E4E9E4] items-center justify-center active:opacity-70"
                >
                  {deletingAnnouncementId === a._id ? (
                    <ActivityIndicator size="small" color="#6B7D6B" />
                  ) : (
                    <Feather name="trash-2" size={14} color="#6B7D6B" />
                  )}
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            loadingAnnouncements ? (
              <View className="py-10 items-center gap-2">
                <ActivityIndicator size="small" color="#8FB978" />
                <Text className="text-sm text-[#9CAD9B]">Loading...</Text>
              </View>
            ) : (
              <View className="py-10 items-center gap-2">
                <Feather name="inbox" size={22} color="#9CAD9B" />
                <Text className="text-sm text-[#9CAD9B]">No announcements posted yet.</Text>
              </View>
            )
          }
        />
      )}

      {/* ================= MEETINGS TAB ================= */}
      {activeTab === "meetings" && (
        <FlatList
          data={sortedMeetings}
          keyExtractor={(m) => m._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          ListHeaderComponent={
            <View className="bg-white rounded-2xl border border-[#E4E9E4] mb-4 overflow-hidden">
              <View className="flex-row items-center justify-between px-5 py-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-lg bg-[#E8F2D9] items-center justify-center">
                    <Feather name="calendar" size={16} color="#8FB978" />
                  </View>
                  <Text className="text-base font-bold text-[#2C3E2F]">New meeting</Text>
                </View>
                <CreateToggle open={showMeetingForm} onPress={() => setShowMeetingForm((v) => !v)} />
              </View>

              {showMeetingForm && (
                <View className="px-5 pb-5 pt-1 border-t border-[#EEF2ED]">
                  <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5 mt-3">Title</Text>
                  <Controller
                    control={meetingControl}
                    name="title"
                    rules={{ required: "Title is required" }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="e.g. Sprint planning"
                        placeholderTextColor="#9CAD9B"
                        className="px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg text-sm text-[#2C3E2F]"
                      />
                    )}
                  />
                  {meetingErrors.title && (
                    <Text className="text-red-500 text-xs mt-1">{meetingErrors.title.message}</Text>
                  )}

                  <View className="flex-row gap-3 mt-3">
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5">Date</Text>
                      <Controller
                        control={meetingControl}
                        name="date"
                        rules={{ required: "Date is required" }}
                        render={({ field: { value } }) => (
                          <Pressable
                            onPress={() => setShowDatePicker(true)}
                            className="flex-row items-center gap-2 px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg"
                          >
                            <Feather name="calendar" size={14} color="#9CAD9B" />
                            <Text className={`text-sm ${value ? "text-[#2C3E2F]" : "text-[#9CAD9B]"}`}>
                              {value ? formatDate(value) : "Pick date"}
                            </Text>
                          </Pressable>
                        )}
                      />
                      {meetingErrors.date && (
                        <Text className="text-red-500 text-xs mt-1">{meetingErrors.date.message}</Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5">Time</Text>
                      <Controller
                        control={meetingControl}
                        name="time"
                        rules={{ required: "Time is required" }}
                        render={({ field: { value } }) => (
                          <Pressable
                            onPress={() => setShowTimePicker(true)}
                            className="flex-row items-center gap-2 px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg"
                          >
                            <Feather name="clock" size={14} color="#9CAD9B" />
                            <Text className={`text-sm ${value ? "text-[#2C3E2F]" : "text-[#9CAD9B]"}`}>
                              {value ? formatTime12h(value) : "Pick time"}
                            </Text>
                          </Pressable>
                        )}
                      />
                      {meetingErrors.time && (
                        <Text className="text-red-500 text-xs mt-1">{meetingErrors.time.message}</Text>
                      )}
                    </View>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date()}
                      mode="date"
                      minimumDate={new Date()}
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(_, selected) => {
                        setShowDatePicker(false);
                        if (selected) setValue("date", toYMD(selected), { shouldValidate: true });
                      }}
                    />
                  )}
                  {showTimePicker && (
                    <DateTimePicker
                      value={new Date()}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, selected) => {
                        setShowTimePicker(false);
                        if (selected) setValue("time", toHM(selected), { shouldValidate: true });
                      }}
                    />
                  )}

                  <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5 mt-3">Description</Text>
                  <Controller
                    control={meetingControl}
                    name="description"
                    rules={{ required: "Description is required" }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Agenda..."
                        placeholderTextColor="#9CAD9B"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className="px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg text-sm text-[#2C3E2F] min-h-[70px]"
                      />
                    )}
                  />
                  {meetingErrors.description && (
                    <Text className="text-red-500 text-xs mt-1">{meetingErrors.description.message}</Text>
                  )}

                  <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5 mt-3">Invite employees</Text>
                  <Pressable
                    onPress={() => setShowEmployeePicker((v) => !v)}
                    className="flex-row items-center justify-between px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg"
                  >
                    <View className="flex-row items-center gap-2">
                      <Feather name="users" size={14} color="#9CAD9B" />
                      <Text className="text-sm text-[#2C3E2F]">
                        {selectedEmployeeIds.length > 0
                          ? `${selectedEmployeeIds.length} employee(s) selected`
                          : "Select employees"}
                      </Text>
                    </View>
                    <Feather
                      name={showEmployeePicker ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#9CAD9B"
                    />
                  </Pressable>

                  {showEmployeePicker && (
                    <Controller
                      control={meetingControl}
                      name="employeeId"
                      rules={{ validate: (v) => v.length > 0 || "Select at least one employee" }}
                      render={({ field }) => (
                        <ScrollView
                          className="border border-[#E4E9E4] rounded-lg mt-2 bg-[#F8FBF5]"
                          style={{ maxHeight: 180 }}
                          nestedScrollEnabled
                        >
                          {employees.length === 0 ? (
                            <Text className="text-xs text-[#9CAD9B] p-3">No employees found.</Text>
                          ) : (
                            employees.map((emp) => {
                              const checked = field.value.includes(emp._id);
                              return (
                                <Pressable
                                  key={emp._id}
                                  onPress={() => {
                                    if (checked)
                                      field.onChange(field.value.filter((id) => id !== emp._id));
                                    else field.onChange([...field.value, emp._id]);
                                  }}
                                  className="flex-row items-center gap-2.5 px-3 py-2.5"
                                  style={{ backgroundColor: checked ? "#E8F2D9" : "transparent" }}
                                >
                                  <View
                                    className="w-5 h-5 rounded items-center justify-center border"
                                    style={{
                                      borderColor: checked ? "#8FB978" : "#DCE3DA",
                                      backgroundColor: checked ? "#8FB978" : "white",
                                    }}
                                  >
                                    {checked && <Feather name="check" size={12} color="#fff" />}
                                  </View>
                                  <Text className="text-sm text-[#2C3E2F]">{emp.name}</Text>
                                  <Text className="text-xs text-[#9CAD9B]">— {emp.department}</Text>
                                </Pressable>
                              );
                            })
                          )}
                        </ScrollView>
                      )}
                    />
                  )}
                  {meetingErrors.employeeId && (
                    <Text className="text-red-500 text-xs mt-1">{meetingErrors.employeeId.message}</Text>
                  )}

                  <Pressable
                    onPress={handleSubmitMeeting((data) => createMeetingMutation.mutate(data))}
                    disabled={createMeetingMutation.isPending}
                    className="flex-row items-center justify-center gap-2 bg-[#8FB978] rounded-lg py-3 mt-4 active:opacity-80"
                    style={{ opacity: createMeetingMutation.isPending ? 0.6 : 1 }}
                  >
                    {createMeetingMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Feather name="calendar" size={15} color="#fff" />
                    )}
                    <Text className="text-white text-sm font-semibold">
                      {createMeetingMutation.isPending ? "Scheduling..." : "Schedule meeting"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          }
          renderItem={({ item: m }) => {
            const past = isMeetingPast(m);
            return (
              <View className="bg-white rounded-2xl border border-[#E4E9E4] p-4 mb-3">
                <View className="flex-row justify-between items-start gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-semibold text-[#2C3E2F]">{m.title}</Text>
                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: past ? "#F3F8EE" : "#E8F2D9" }}
                      >
                        <View
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: past ? "#9CAD9B" : "#8FB978" }}
                        />
                        <Text
                          className="text-[10px] font-semibold"
                          style={{ color: past ? "#6B7D6B" : "#2C3E2F" }}
                        >
                          {past ? "Completed" : "Upcoming"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-[#6B7D6B] mt-1" numberOfLines={2}>
                      {m.description}
                    </Text>

                    <View className="flex-row items-center gap-3 mt-2">
                      <View className="flex-row items-center gap-1">
                        <Feather name="calendar" size={11} color="#9CAD9B" />
                        <Text className="text-xs text-[#6B7D6B]">{formatDate(m.date)}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Feather name="clock" size={11} color="#9CAD9B" />
                        <Text className="text-xs text-[#6B7D6B]">{formatTime12h(m.time)}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mt-2.5">
                      {m.employeeId?.slice(0, 4).map((emp, i) => (
                        <View
                          key={emp._id}
                          style={{
                            backgroundColor: getAvatarColor(emp.name),
                            marginLeft: i === 0 ? 0 : -8,
                            borderWidth: 2,
                            borderColor: "#fff",
                          }}
                          className="w-6 h-6 rounded-full items-center justify-center"
                        >
                          <Text className="text-white text-[9px] font-bold">{getInitials(emp.name)}</Text>
                        </View>
                      ))}
                      {m.employeeId?.length > 4 && (
                        <View
                          style={{ marginLeft: -8, borderWidth: 2, borderColor: "#fff" }}
                          className="w-6 h-6 rounded-full items-center justify-center bg-[#E4E9E4]"
                        >
                          <Text className="text-[#6B7D6B] text-[9px] font-bold">
                            +{m.employeeId.length - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[11px] text-[#9CAD9B] mt-1.5">By {m.createdBy?.name}</Text>
                  </View>

                  <Pressable
                    onPress={() => confirmDeleteMeeting(m)}
                    disabled={deletingMeetingId === m._id}
                    className="w-9 h-9 rounded-lg border border-[#E4E9E4] items-center justify-center active:opacity-70"
                  >
                    {deletingMeetingId === m._id ? (
                      <ActivityIndicator size="small" color="#6B7D6B" />
                    ) : (
                      <Feather name="trash-2" size={14} color="#6B7D6B" />
                    )}
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            loadingMeetings ? (
              <View className="py-10 items-center gap-2">
                <ActivityIndicator size="small" color="#8FB978" />
                <Text className="text-sm text-[#9CAD9B]">Loading...</Text>
              </View>
            ) : (
              <View className="py-10 items-center gap-2">
                <Feather name="inbox" size={22} color="#9CAD9B" />
                <Text className="text-sm text-[#9CAD9B]">No meetings scheduled yet.</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}