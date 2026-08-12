import axiosClient from "@/api/axiosClient";
import { getSocket } from "@/api/socket";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND = { 50: "#f4f7ec", 100: "#e6edd3", 500: "#80A33C", 700: "#4f6626" };

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
}
interface MessageItem {
  _id: string;
  chat: string;
  sender: { _id: string; name: string; email: string };
  text: string;
  createdAt: string;
}

const getInitials = (name?: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
const avatarPalette = ["#5C8A4B", "#4F7A3D", "#3F6B34", "#6FA05C", "#7CA666", "#457038"];
const getAvatarColor = (name?: string) => avatarPalette[(name?.charCodeAt(0) ?? 0) % avatarPalette.length];
const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export default function EmployeeChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const { data: chats = [] } = useQuery<ChatItem[]>({
    queryKey: ["my-chats"],
    queryFn: async () => {
      const res = await axiosClient.get("/chats/my");
      return res.data;
    },
  });

  const activeChat = chats.find((c) => c._id === chatId);
  const otherForName = activeChat && !activeChat.isGroup
  ? activeChat.participants.find((p) => p._id !== user?._id)
  : null;

const displayName = activeChat
  ? activeChat.isGroup
    ? activeChat.groupName ?? "Group"
    : otherForName
    ? otherForName.role === "hr"
      ? `${otherForName.name} (HR)`
      : otherForName.name
    : "Unknown"
  : "...";
  const otherParticipant =
    activeChat && !activeChat.isGroup ? activeChat.participants.find((p) => p._id !== user?._id) : null;
  const isOnline = otherParticipant ? onlineIds.has(otherParticipant._id) : false;

  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();
    socket.emit("join-chat", chatId);

    socket.on("online-users-list", (ids: string[]) => setOnlineIds(new Set(ids)));
    socket.on("user-online", ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => new Set(prev).add(userId))
    );
    socket.on("user-offline", ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      })
    );
    socket.on("receive-message", ({ chatId: incomingId, message }: { chatId: string; message: MessageItem }) => {
      if (incomingId === chatId) {
        setMessages((prev) => [message, ...prev]);
      }
    });

    (async () => {
      setLoading(true);
      const res = await axiosClient.get(`/chats/${chatId}/messages`, { params: { page: 1, limit: 25 } });
      setMessages([...res.data.messages].reverse());
      setHasMore(res.data.pagination.hasMore);
      setLoading(false);
    })();

    return () => {
      socket.emit("leave-chat", chatId);
      socket.off("online-users-list");
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("receive-message");
    };
  }, [chatId]);

  const handleSend = () => {
    if (!input.trim() || !chatId || !user) return;
    const text = input.trim();
    setInput("");

    const optimisticMessage: MessageItem = {
      _id: `temp-${Date.now()}`,
      chat: chatId,
      sender: { _id: user._id, name: user.name, email: user.email },
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [optimisticMessage, ...prev]);

    const socket = getSocket();
    socket.emit("send-message", { chatId, text });
  };

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || !chatId) return;
    setLoadingOlder(true);
    const nextPage = page + 1;
    const res = await axiosClient.get(`/chats/${chatId}/messages`, { params: { page: nextPage, limit: 25 } });
    setMessages((prev) => [...prev, ...[...res.data.messages].reverse()]);
    setHasMore(res.data.pagination.hasMore);
    setPage(nextPage);
    setLoadingOlder(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-3 py-3 border-b" style={{ borderColor: BRAND[100] }}>
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 mr-1">
          <Ionicons name="chevron-back" size={22} color={BRAND[700]} />
        </TouchableOpacity>

        <View style={{ position: "relative" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: activeChat?.isGroup ? BRAND[700] : getAvatarColor(displayName),
            }}
          >
            {activeChat?.isGroup ? (
              <Ionicons name="people" size={17} color="#fff" />
            ) : (
              <Text className="text-white text-xs font-bold">{getInitials(displayName)}</Text>
            )}
          </View>
          {!activeChat?.isGroup && isOnline && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 11,
                height: 11,
                borderRadius: 5.5,
                backgroundColor: "#22C55E",
                borderWidth: 2,
                borderColor: "#fff",
              }}
            />
          )}
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold" style={{ color: BRAND[700] }} numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-xs" style={{ color: isOnline ? "#22C55E" : "#94A3B8" }}>
            {activeChat?.isGroup
              ? `${activeChat.participants.length} members`
              : isOnline
              ? "Active now"
              : "Offline"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color={BRAND[500]} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            inverted
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingOlder ? <ActivityIndicator color={BRAND[500]} style={{ marginVertical: 10 }} /> : null
            }
            renderItem={({ item }) => {
              const isMine = item.sender._id === user?._id;
              return (
                <View className={`flex-row ${isMine ? "justify-end" : "justify-start"} mb-2.5`}>
                  <View style={{ maxWidth: "75%" }}>
                    {!isMine && activeChat?.isGroup && (
                      <Text className="text-[10px] font-semibold mb-1 px-1" style={{ color: "#64748B" }}>
                        {item.sender.name}
                      </Text>
                    )}
                    <View
                      className="px-4 py-2.5 rounded-2xl"
                      style={{
                        backgroundColor: isMine ? BRAND[700] : BRAND[50],
                        borderBottomRightRadius: isMine ? 4 : 16,
                        borderBottomLeftRadius: isMine ? 16 : 4,
                      }}
                    >
                      <Text className="text-sm leading-5" style={{ color: isMine ? "#fff" : BRAND[700] }}>
                        {item.text}
                      </Text>
                    </View>
                    <Text
                      className={`text-[10px] mt-1 px-1 ${isMine ? "text-right" : "text-left"}`}
                      style={{ color: "#94A3B8" }}
                    >
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View className="flex-row items-center px-4 py-3 border-t gap-2.5" style={{ borderColor: BRAND[100] }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            className="flex-1 px-4 py-2.5 rounded-full text-sm text-gray-800"
            style={{ backgroundColor: BRAND[50] }}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-full justify-center items-center"
            style={{ backgroundColor: BRAND[700], opacity: input.trim() ? 1 : 0.4 }}
          >
            <Ionicons name="send" size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}