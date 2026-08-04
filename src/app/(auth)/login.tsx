import { useAuth } from "@/context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Both email and password are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        // অ্যান্ড্রয়েডে Expo ডিফল্টভাবে কীবোর্ড হ্যান্ডেল করে, তাই শুধু iOS-এর জন্য padding দেওয়া হলো
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center px-6 py-10">
              
              {/* Header Section */}
              <View className="items-center mb-10">
                <View className="w-16 h-16 rounded-full bg-slate-800 justify-center items-center mb-5 shadow-sm">
                  <Text className="text-white text-2xl font-bold">HR</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 text-center">
                  Welcome to Genesys HRM System
                </Text>
                <Text className="text-sm text-gray-500 mt-2 text-center">
                  Login to your account to get started
                </Text>
              </View>

              {/* Form Section */}
              <View className="w-full">
                {error ? (
                  <View className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5">
                    <Text className="text-red-600 text-sm text-center font-medium">{error}</Text>
                  </View>
                ) : null}

                <View className="mb-5">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@company.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 focus:border-slate-800"
                  />
                </View>

                <View className="mb-8">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </Text>
                  <View className="relative justify-center">
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="bg-white border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 text-base text-gray-900 focus:border-slate-800"
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={15}
                      className="absolute right-4"
                    >
                      <Text className="text-lg opacity-80">{showPassword ? "🙈" : "👁️"}</Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  android_ripple={{ color: "#334155" }}
                  className={`bg-slate-800 rounded-xl py-4 items-center justify-center shadow-md ${
                    loading ? "opacity-70" : "active:opacity-90"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-base font-bold tracking-wide">Login</Text>
                  )}
                </Pressable>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}