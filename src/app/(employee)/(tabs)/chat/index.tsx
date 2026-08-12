import axiosClient from "@/api/axiosClient";
import { connectSocket, getSocket } from "@/api/socket";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

const EMPTY_STATE_IMAGE = "https://res.cloudinary.com/dpwuivub7/image/upload/v1786359981/dd_yoz5wi.png";

interface EmployeeOption {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}
interface ChatParticipant {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}
interface ChatItem {
  _id: string;
  isGroup: boolean;
  groupName?: string;
  participants: ChatParticipant[];
  lastMessage?: { text: string; sender: { name: string }; createdAt: string };
  updatedAt: string;
}

const getInitials = (name?: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
const avatarPalette = ["#5C8A4B", "#4F7A3D", "#3F6B34", "#6FA05C", "#7CA666", "#457038"];
const getAvatarColor = (name?: string) => avatarPalette[(name?.charCodeAt(0) ?? 0) % avatarPalette.length];
const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export default function EmployeeChatList() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  // Note: employee side e /users/allUsers hrOnly hote pare — jodi 403 pao,
  // backend e employee-der jonno alada route (e.g. /users/companyList) banate hobe
  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ["all-users-dropdown"],
    queryFn: async () => {
      const res = await axiosClient.get("/users/allUsers");
      return res.data.users;
    },
  });

  const { data: myChats = [], isLoading, refetch, isRefetching } = useQuery<ChatItem[]>({
    queryKey: ["my-chats"],
    queryFn: async () => {
      const res = await axiosClient.get("/chats/my");
      return res.data;
    },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const socket = await connectSocket();
      if (!mounted) return;

      socket.on("user-online", ({ userId }: { userId: string }) => {
        setOnlineIds((prev) => new Set(prev).add(userId));
      });
      socket.on("user-offline", ({ userId }: { userId: string }) => {
        setOnlineIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });
      socket.on("online-users-list", (userIds: string[]) => setOnlineIds(new Set(userIds)));
      socket.on("receive-message", ({ chatId, message }: { chatId: string; message: any }) => {
  queryClient.setQueryData<ChatItem[]>(["my-chats"], (old) => {
    if (!old) return old;
    const updated = old.map((chat) =>
      chat._id === chatId
        ? { ...chat, lastMessage: message, updatedAt: message.createdAt }
        : chat
    );
    // Recent message thaka chat ta shobar upore niye jai (sort by updatedAt)
    return [...updated].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });
});
    })();

    return () => {
      mounted = false;
      const socket = getSocket();
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("online-users-list");
      socket.off("receive-message");
    };
  }, []);

  // Direct chat start kora — group create restriction nai, karon eita
  // je kono logged-in user (employee ba HR) korte pare
  const startDirectChatMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await axiosClient.post("/chats/direct", { employeeId });
      return res.data as ChatItem;
    },
    onSuccess: async (chat) => {
      await queryClient.invalidateQueries({ queryKey: ["my-chats"] });
      router.push(`/(employee)/(tabs)/chat/${chat._id}` as any);
    },
  });



  const getChatDisplayName = (chat: ChatItem) => {
  if (chat.isGroup) return chat.groupName ?? "Group";
  const other = chat.participants.find((p) => p._id !== user?._id);
  if (!other) return "Unknown";
  return other.role === "hr" ? `${other.name} (HR)` : other.name;
};

  const filteredChats = myChats.filter((c) =>
    getChatDisplayName(c).toLowerCase().includes(search.toLowerCase())
  );

  const chattedIds = useMemo(
    () => new Set(myChats.filter((c) => !c.isGroup).flatMap((c) => c.participants.map((p) => p._id))),
    [myChats]
  );

  // HR-o ei list e thakbe, karon employees.allUsers e company-r shobai ashe —
  // employee HR-er sathe-o 1-on-1 chat shuru korte parbe, eita e normal
  const suggestedPeople = employees.filter((e) => e._id !== user?._id && !chattedIds.has(e._id));

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header — "New Group" button NAI, shudhu title */}
      <View className="px-5 pt-2 pb-3">
        <Text className="text-2xl font-bold" style={{ color: BRAND[700] }}>
          Team Chat
        </Text>
        <Text className="text-sm mt-0.5" style={{ color: "#64748B" }}>
          {employees.length} people
        </Text>
      </View>

      {/* Search */}
      <View className="px-5 mb-3">
        <View className="flex-row items-center rounded-2xl px-3.5" style={{ backgroundColor: BRAND[50] }}>
          <Ionicons name="search" size={16} color={BRAND[400]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search people..."
            placeholderTextColor="#94A3B8"
            className="flex-1 py-3 px-2.5 text-sm text-gray-800"
          />
        </View>
      </View>

      {/* Suggested people strip */}
      {suggestedPeople.length > 0 && (
        <View className="mb-2">
          <Text className="px-5 text-[11px] font-bold uppercase tracking-wide mb-2.5" style={{ color: "#94A3B8" }}>
            Start a conversation
          </Text>
          <FlatList
            horizontal
            data={suggestedPeople}
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            renderItem={({ item }) => {
              const isOnline = onlineIds.has(item._id);
              return (
                <TouchableOpacity
                  onPress={() => startDirectChatMutation.mutate(item._id)}
                  activeOpacity={0.8}
                  style={{ width: 64, alignItems: "center" }}
                >
                  <View style={{ position: "relative" }}>
                    <View
                      className="w-14 h-14 rounded-full justify-center items-center"
                      style={{
                        backgroundColor: getAvatarColor(item.name),
                        borderWidth: isOnline ? 2.5 : 0,
                        borderColor: "#22C55E",
                      }}
                    >
                      <Text className="text-white text-base font-bold">{getInitials(item.name)}</Text>
                    </View>
                    {isOnline && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: "#22C55E",
                          borderWidth: 2,
                          borderColor: "#fff",
                        }}
                      />
                    )}
                  </View>
                  <Text className="text-[11px] mt-1.5 text-center" style={{ color: BRAND[700] }} numberOfLines={1}>
  {item.name.split(" ")[0]}
  {item.role === "hr" && (
    <Text style={{ color: BRAND[500] }}> (HR)</Text>
  )}
</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Recent chats */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={BRAND[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND[500]} />}
          ListHeaderComponent={
            filteredChats.length > 0 ? (
              <Text className="px-3 text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: "#94A3B8" }}>
                Recent
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Image source={{ uri: EMPTY_STATE_IMAGE }} style={{ width: 160, height: 160 }} resizeMode="contain" />
              <Text className="text-sm font-semibold mt-2" style={{ color: BRAND[700] }}>
                No conversations yet
              </Text>
              <Text className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                Tap someone above to start chatting
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const displayName = getChatDisplayName(item);
            const other = !item.isGroup ? item.participants.find((p) => p._id !== user?._id) : null;
            const isOnline = other ? onlineIds.has(other._id) : false;

            return (
              <TouchableOpacity
                onPress={() => router.push(`/(employee)/(tabs)/chat/${item._id}` as any)}
                activeOpacity={0.7}
                className="flex-row items-center px-3 py-2.5 rounded-2xl mb-1"
              >
                <View style={{ position: "relative" }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: item.isGroup ? BRAND[700] : getAvatarColor(displayName),
                    }}
                  >
                    {item.isGroup ? (
                      <Ionicons name="people" size={20} color="#fff" />
                    ) : (
                      <Text className="text-white text-sm font-bold">{getInitials(displayName)}</Text>
                    )}
                  </View>
                  {!item.isGroup && isOnline && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 13,
                        height: 13,
                        borderRadius: 6.5,
                        backgroundColor: "#22C55E",
                        borderWidth: 2,
                        borderColor: "#fff",
                      }}
                    />
                  )}
                </View>

                <View className="flex-1 ml-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-semibold flex-1" style={{ color: BRAND[700] }} numberOfLines={1}>
                      {displayName}
                    </Text>
                    {item.lastMessage && (
                      <Text className="text-[10px] ml-2" style={{ color: "#94A3B8" }}>
                        {formatTime(item.lastMessage.createdAt)}
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs mt-0.5" style={{ color: "#64748B" }} numberOfLines={1}>
                    {item.lastMessage ? item.lastMessage.text : "No messages yet"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}