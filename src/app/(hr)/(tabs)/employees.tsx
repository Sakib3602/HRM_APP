import axiosClient from "@/api/axiosClient";

import { Ionicons } from "@expo/vector-icons";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useEffect, useMemo, useState } from "react";

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
interface UserFormValues {
  name: string;
  email: string;
  password: string;
  department: string;
  manager?: string;
  vehicle?: string;
  phone?: string;
}

interface OfficeUser {
  _id: string;
  name: string;
  email: string;
  department: string;
  manager?: string;
  phone?: string;
  role: "employee" | "hr";
  isActive: boolean;
}

interface UsersResponse {
  users: OfficeUser[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const LIMIT = 15;
const SKY = {
  50: "#f0f9ff",
  100: "#e0f2fe",
  200: "#bae6fd",
  400: "#38bdf8",
  500: "#0ea5e9",
  600: "#0284c7",
  700: "#0369a1",
};

export default function Employees() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "all">("active");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<UsersResponse>({
    queryKey: ["office-users", search, status],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await axiosClient.get("/users", {
        params: { page: pageParam, limit: LIMIT, search, status },
      });
      return res.data;
    },
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });

  const users = useMemo(() => data?.pages.flatMap((p) => p.users) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const createMutation = useMutation({
    mutationFn: async (formData: UserFormValues) => {
      const res = await axiosClient.post("/users", formData);
      return res.data;
    },
    onSuccess: () => {
      reset();
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["office-users"] });
    },
    onError: (err: any) => {
      Alert.alert("Failed to add", err?.response?.data?.message || "Something went wrong");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/users/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["office-users"] }),
    onError: (err: any) => {
      Alert.alert("Failed to remove", err?.response?.data?.message || "Something went wrong");
    },
  });

  const confirmDelete = (u: OfficeUser) => {
    Alert.alert("Remove user", `Remove ${u.name} from office?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(u._id) },
    ]);
  };

  const onSubmit = (formData: UserFormValues) => createMutation.mutate(formData);

  return (

    <SafeAreaView className="flex-1" style={{ backgroundColor: SKY[50] }} edges={["top"]}>
        <StatusBar
  barStyle="dark-content"
  backgroundColor="#EAF5FF"
/>
      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <Text className="text-2xl font-bold" style={{ color: SKY[700] }}>
          Employees
        </Text>
        <Text className="text-sm text-gray-500 mt-0.5">{total} total office users</Text>
      </View>

      {/* Search */}
      <View className="px-5 mb-3">
        <View
          className="flex-row items-center bg-white rounded-2xl px-3.5 border"
          style={{ borderColor: SKY[100] }}
        >
          <Ionicons name="search" size={17} color={SKY[400]} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search name, email, department..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 py-3 px-2.5 text-sm text-gray-800"
          />
        </View>
      </View>

      {/* Status filter chips */}
      <View className="flex-row px-5 gap-2 mb-4">
        {(["active", "inactive", "all"] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            className="px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: status === s ? SKY[500] : "#fff",
              borderWidth: 1,
              borderColor: status === s ? SKY[500] : SKY[100],
            }}
          >
            <Text
              className="text-xs font-semibold capitalize"
              style={{ color: status === s ? "#fff" : "#64748B" }}
            >
              {s === "inactive" ? "Removed" : s}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={SKY[500]} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={SKY[500]} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => hasNextPage && fetchNextPage()}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="people-outline" size={36} color={SKY[200]} />
              <Text className="text-gray-400 text-sm mt-2">No users found</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={SKY[500]} style={{ marginVertical: 12 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <View
              className="bg-white rounded-2xl p-4 mb-3 border"
              style={{ borderColor: SKY[100] }}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-bold text-gray-800">{item.name}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{item.email}</Text>
                </View>
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: item.role === "hr" ? SKY[100] : "#ECFDF5" }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: item.role === "hr" ? SKY[700] : "#047857" }}
                  >
                    {item.role === "hr" ? "HR ADMIN" : "EMPLOYEE"}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-3">
                <InfoRow icon="business-outline" label={item.department} />
                {item.phone && <InfoRow icon="call-outline" label={item.phone} />}
                {item.manager && <InfoRow icon="person-outline" label={item.manager} />}
              </View>

              <View className="flex-row items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: SKY[50] }}>
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: item.isActive ? "#ECFDF5" : "#FEF2F2" }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: item.isActive ? "#047857" : "#B91C1C" }}
                  >
                    {item.isActive ? "ACTIVE" : "REMOVED"}
                  </Text>
                </View>

                {item.isActive && (
                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    disabled={deleteMutation.isPending}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: "#FEF2F2" }}
                  >
                    <Ionicons name="trash-outline" size={13} color="#DC2626" />
                    <Text className="text-xs font-semibold" style={{ color: "#DC2626" }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        style={{ backgroundColor: SKY[500] }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add User Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(15,23,42,0.4)" }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="bg-white rounded-t-3xl max-h-[88%]"
          >
            <View className="flex-row justify-between items-center px-5 pt-5 pb-3">
              <Text className="text-lg font-bold" style={{ color: SKY[700] }}>
                Add office user
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
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
                  <FormField
                    label="Full name"
                    name="name"
                    control={control}
                    rules={{ required: "Name is required" }}
                    placeholder="e.g. David Miller"
                    error={errors.name?.message}
                  />
                  <FormField
                    label="Work email"
                    name="email"
                    control={control}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    rules={{
                      required: "Email is required",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                    }}
                    placeholder="david@company.com"
                    error={errors.email?.message}
                  />

                  <Text className="text-xs font-semibold text-gray-500 mb-1.5 mt-1">Password</Text>
                  <View className="relative justify-center mb-4">
                    <Controller
                      control={control}
                      name="password"
                      rules={{
                        required: "Password is required",
                        minLength: { value: 6, message: "At least 6 characters" },
                      }}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          placeholder="Set a login password"
                          placeholderTextColor="#9CA3AF"
                          className="bg-gray-50 border rounded-xl pl-4 pr-11 py-3 text-sm text-gray-800"
                          style={{ borderColor: SKY[100] }}
                        />
                      )}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} className="absolute right-3.5" hitSlop={12}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={17} color="#94A3B8" />
                    </Pressable>
                  </View>
                  {errors.password && (
                    <Text className="text-red-500 text-xs -mt-3 mb-3">{errors.password.message}</Text>
                  )}

                  <FormField label="Phone number" name="phone" control={control} keyboardType="phone-pad" placeholder="e.g. 01712345678" />
                  <FormField
                    label="Department"
                    name="department"
                    control={control}
                    rules={{ required: "Department is required" }}
                    placeholder="e.g. Engineering"
                    error={errors.department?.message}
                  />
                  <FormField label="Reporting manager" name="manager" control={control} placeholder="e.g. Peter Wilson" />
                  <FormField label="Vehicle (optional)" name="vehicle" control={control} placeholder="e.g. Ford Transit AB12 CDE" />

                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={createMutation.isPending}
                    className="rounded-xl py-3.5 items-center mt-2"
                    style={{ backgroundColor: SKY[500], opacity: createMutation.isPending ? 0.7 : 1 }}
                  >
                    {createMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-sm font-bold">Add user</Text>
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

function InfoRow({ icon, label }: { icon: any; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={12} color="#94A3B8" />
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}

function FormField({
  label,
  name,
  control,
  rules,
  placeholder,
  error,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  name: keyof UserFormValues;
  control: any;
  rules?: any;
  placeholder?: string;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-gray-500 mb-1.5">{label}</Text>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            className="bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-800"
            style={{ borderColor: SKY[100] }}
          />
        )}
      />
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}