import axiosClient from "@/api/axiosClient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";




interface DocFormValues {
  name: string;
}

interface HrDoc {
  _id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  originalFileName: string;
  uploadedBy: { name: string; email: string };
  createdAt: string;
}

interface StorageInfo {
  usedFormatted: string;
  limitFormatted: string;
  percentUsed: number;
}

const fileIconColor: Record<string, { color: string; bg: string }> = {
  pdf: { color: "#e11d48", bg: "#fff1f2" },
  doc: { color: "#2563eb", bg: "#eff6ff" },
  docx: { color: "#2563eb", bg: "#eff6ff" },
  xls: { color: "#059669", bg: "#ecfdf5" },
  xlsx: { color: "#059669", bg: "#ecfdf5" },
};

export default function hrDocument() {
  const axiosHr = axiosClient;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocFormValues>({ defaultValues: { name: "" } });

  const { data: documents = [], isLoading } = useQuery<HrDoc[]>({
    queryKey: ["hr-documents", searchTerm],
    queryFn: async () => {
      const res = await axiosHr.get("/documents", { params: { search: searchTerm } });
      return res.data;
    },
  });

  const { data: storage } = useQuery<StorageInfo>({
    queryKey: ["hr-storage"],
    queryFn: async () => {
      const res = await axiosHr.get("/documents/storage");
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: DocFormValues) => {
      if (!selectedFile) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || "application/octet-stream",
      } as any);

      const res = await axiosHr.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      Alert.alert("Document uploaded", "The file has been saved successfully.");
      reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["hr-documents"] });
      queryClient.invalidateQueries({ queryKey: ["hr-storage"] });
    },
    onError: (err: unknown) => {
      const apiMessage = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      Alert.alert("Upload failed", apiMessage || "Something went wrong while uploading.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      await axiosHr.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      Alert.alert("Document removed", "The file has been deleted.");
      queryClient.invalidateQueries({ queryKey: ["hr-documents"] });
      queryClient.invalidateQueries({ queryKey: ["hr-storage"] });
    },
    onError: (err: unknown) => {
      const apiMessage = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      Alert.alert("Delete failed", apiMessage || "Could not remove the document.");
    },
    onSettled: () => setDeletingId(null),
  });

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) setSelectedFile(result.assets[0]);
  };

  const onSubmit = (data: DocFormValues) => {
    if (!selectedFile) {
      Alert.alert("No file selected", "Please choose a file to upload.");
      return;
    }
    uploadMutation.mutate(data);
  };

  const handleView = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Couldn't open file", "Try again later.")
    );
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const localUri = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(url, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Downloaded", `Saved to ${uri}`);
      }
    } catch {
      Alert.alert("Download failed", "Could not download the file.");
    }
  };

  const confirmDelete = (doc: HrDoc) => {
    Alert.alert("Remove document", `Delete "${doc.name}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(doc._id) },
    ]);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const renderDoc = ({ item: doc }: { item: HrDoc }) => {
    const style = fileIconColor[doc.fileType] || { color: "#6B7D6B", bg: "#EEF2ED" };
    return (
      <View className="bg-white rounded-2xl border border-[#E4E9E4] p-4 mb-3">
        <View className="flex-row items-center gap-3">
          <View
            style={{ backgroundColor: style.bg }}
            className="w-10 h-10 rounded-lg items-center justify-center"
          >
            <Feather
              name={doc.fileType === "pdf" ? "file-text" : "file"}
              size={18}
              color={style.color}
            />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-[#2C3E2F]" numberOfLines={1}>
              {doc.name}
            </Text>
            <Text className="text-xs text-[#9CAD9B] uppercase mt-0.5">
              {doc.fileType} · {doc.uploadedBy?.name}
            </Text>
            <Text className="text-xs text-[#9CAD9B] mt-0.5">
              {formatDate(doc.createdAt)}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2 mt-3.5">
          <Pressable
            onPress={() => handleView(doc.fileUrl)}
            className="flex-1 flex-row items-center justify-center gap-1.5 border border-[#E4E9E4] rounded-lg py-2.5 active:opacity-70"
          >
            <Feather name="eye" size={14} color="#2C3E2F" />
            <Text className="text-xs font-semibold text-[#2C3E2F]">View</Text>
          </Pressable>

          <Pressable
            onPress={() => handleDownload(doc.fileUrl, doc.originalFileName)}
            className="flex-1 flex-row items-center justify-center gap-1.5 bg-[#8FB978] rounded-lg py-2.5 active:opacity-80"
          >
            <Feather name="download" size={14} color="#fff" />
            <Text className="text-xs font-semibold text-white">Download</Text>
          </Pressable>

          <Pressable
            onPress={() => confirmDelete(doc)}
            disabled={deletingId === doc._id}
            className="w-11 items-center justify-center border border-[#E4E9E4] rounded-lg py-2.5 active:opacity-70"
          >
            {deletingId === doc._id ? (
              <ActivityIndicator size="small" color="#6B7D6B" />
            ) : (
              <Feather name="trash-2" size={14} color="#6B7D6B" />
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#F2F8EC" }} edges={["top"]}>
      <StatusBar style="dark" />
      <FlatList
        data={documents}
        keyExtractor={(item) => item._id}
        renderItem={renderDoc}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-5">
            {/* Header */}
            <Text className="text-xl font-bold text-gray-800">HR Documents</Text>
            <Text className="text-sm text-[#6B7D6B] mt-1 mb-5">
              Upload and manage company documents, policies, and files.
            </Text>

            {/* Storage bar */}
            {storage && (
              <View className="bg-white rounded-2xl border border-[#E4E9E4] p-5 mb-5">
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="flex-row items-center gap-2">
                    <Feather name="hard-drive" size={15} color="#2C3E2F" />
                    <Text className="text-sm font-semibold text-[#2C3E2F]">
                      Storage used
                    </Text>
                  </View>
                  <Text className="text-sm text-[#6B7D6B]">
                    {storage.usedFormatted} of {storage.limitFormatted}
                  </Text>
                </View>
                <View className="w-full h-2.5 bg-[#EEF2ED] rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${storage.percentUsed}%`,
                      backgroundColor:
                        storage.percentUsed >= 90
                          ? "#f43f5e"
                          : storage.percentUsed >= 70
                          ? "#f59e0b"
                          : "#8FB978",
                    }}
                    className="h-full rounded-full"
                  />
                </View>
                {storage.percentUsed >= 90 && (
                  <Text className="text-xs text-rose-600 font-medium mt-2">
                    Storage almost full. Delete unused files or contact support.
                  </Text>
                )}
              </View>
            )}

            {/* Upload form */}
            <View className="bg-white rounded-2xl border border-[#E4E9E4] p-5 mb-6">
              <View className="flex-row items-center gap-2.5 mb-4">
                <View className="w-8 h-8 rounded-lg bg-[#E8F2D9] items-center justify-center">
                  <Feather name="upload-cloud" size={16} color="#8FB978" />
                </View>
                <Text className="text-base font-bold text-[#2C3E2F]">
                  Upload a document
                </Text>
              </View>

              <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5">
                Document name
              </Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: "Document name is required" }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g. Employee Handbook 2026"
                    placeholderTextColor="#9CAD9B"
                    className="w-full px-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg text-sm text-[#2C3E2F] mb-1"
                  />
                )}
              />
              {errors.name && (
                <Text className="text-red-500 text-xs mb-2">{errors.name.message}</Text>
              )}

              <Text className="text-xs font-semibold text-[#6B7D6B] mb-1.5 mt-3">
                File (PDF, DOC, XLSX)
              </Text>
              <Pressable
                onPress={pickFile}
                className="flex-row items-center gap-2 w-full px-3.5 py-3 bg-[#F8FBF5] border border-dashed border-[#DCE3DA] rounded-lg active:opacity-70"
              >
                <Feather name="upload-cloud" size={16} color="#6B7D6B" />
                <Text className="text-sm text-[#6B7D6B] flex-1" numberOfLines={1}>
                  {selectedFile ? selectedFile.name : "Choose a file..."}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={uploadMutation.isPending}
                className="flex-row items-center justify-center gap-2 bg-[#8FB978] rounded-lg py-3 mt-4 active:opacity-80"
                style={{ opacity: uploadMutation.isPending ? 0.6 : 1 }}
              >
                {uploadMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="upload-cloud" size={16} color="#fff" />
                )}
                <Text className="text-white text-sm font-semibold">
                  {uploadMutation.isPending ? "Uploading..." : "Upload document"}
                </Text>
              </Pressable>
            </View>

            {/* Search */}
            <Text className="text-base font-bold text-[#2C3E2F] mb-3">
              All documents
            </Text>
            <View className="relative mb-1">
              <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
                <Feather name="search" size={15} color="#9CAD9B" />
              </View>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search documents..."
                placeholderTextColor="#9CAD9B"
                className="pl-9 pr-3.5 py-3 bg-[#F8FBF5] border border-[#E4E9E4] rounded-lg text-sm text-[#2C3E2F] mb-4"
              />
            </View>

            {isLoading && (
              <View className="py-10 items-center gap-2">
                <ActivityIndicator size="small" color="#8FB978" />
                <Text className="text-sm text-[#9CAD9B]">Loading documents...</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="py-16 items-center gap-2">
              <Feather name="inbox" size={28} color="#9CAD9B" />
              <Text className="text-sm text-[#9CAD9B]">
                {searchTerm ? "No documents match your search." : "No documents uploaded yet."}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}