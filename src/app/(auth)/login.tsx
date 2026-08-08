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

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
    <View className="flex-1" style={{ backgroundColor: "#F2F8EC" }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center px-6 py-10">

              {/* Decorative top blob */}
              <View
                style={{
                  position: "absolute",
                  top: -80,
                  right: -60,
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  backgroundColor: "#DCEBD0",
                  opacity: 0.7,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  top: 40,
                  left: -70,
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: "#1F3A2E",
                  opacity: 0.06,
                }}
              />

              {/* Header Section */}
              <View className="items-center mb-10">
               
                <Text
                  style={{ color: "#16281F" }}
                  className="text-[26px] font-extrabold text-center leading-8"
                >
                  Welcome to{"\n"}Genesys HRM System
                </Text>
                <Text
                  style={{ color: "#5C6F63" }}
                  className="text-sm mt-3 text-center"
                >
                  Login to your account to get started
                </Text>
              </View>

              {/* Form Card */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  padding: 22,
                  shadowColor: "#1F3A2E",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.08,
                  shadowRadius: 20,
                  elevation: 4,
                }}
              >
                {error ? (
                  <View
                    style={{
                      backgroundColor: "#FDECEC",
                      borderColor: "#F6C4C4",
                      borderWidth: 1,
                    }}
                    className="rounded-xl p-3.5 mb-5"
                  >
                    <Text className="text-red-600 text-sm text-center font-medium">
                      {error}
                    </Text>
                  </View>
                ) : null}

                <View className="mb-5">
                  <Text
                    style={{ color: "#16281F" }}
                    className="text-sm font-semibold mb-2"
                  >
                    Email Address
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="you@company.com"
                    placeholderTextColor="#A6B3AC"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      backgroundColor: "#F7FAF4",
                      borderColor: emailFocused ? "#1F3A2E" : "#E4EBDE",
                      borderWidth: emailFocused ? 1.5 : 1,
                      color: "#16281F",
                    }}
                    className="rounded-xl px-4 py-3.5 text-base"
                  />
                </View>

                <View className="mb-2">
                  <Text
                    style={{ color: "#16281F" }}
                    className="text-sm font-semibold mb-2"
                  >
                    Password
                  </Text>
                  <View className="relative justify-center">
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••"
                      placeholderTextColor="#A6B3AC"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={{
                        backgroundColor: "#F7FAF4",
                        borderColor: passwordFocused ? "#1F3A2E" : "#E4EBDE",
                        borderWidth: passwordFocused ? 1.5 : 1,
                        color: "#16281F",
                      }}
                      className="rounded-xl pl-4 pr-12 py-3.5 text-base"
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={15}
                      className="absolute right-4"
                    >
                      <Text className="text-lg opacity-80">
                        {showPassword ? "🙈" : "👁️"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable className="self-end mb-6" hitSlop={10}>
                  <Text
                    style={{ color: "#3E6B52" }}
                    className="text-sm font-semibold"
                  >
                    Forgot password?
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  android_ripple={{ color: "#16281F" }}
                  style={{
                    backgroundColor: "#1F3A2E",
                    shadowColor: "#1F3A2E",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 5,
                    opacity: loading ? 0.7 : 1,
                  }}
                  className="rounded-xl py-4 items-center justify-center active:opacity-90"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-base font-bold tracking-wide">
                      Login
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* Footer */}
              <Text
                style={{ color: "#8A988E" }}
                className="text-xs text-center mt-8"
              >
                © {new Date().getFullYear()} Genesys HRM System. All rights reserved.
              </Text>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}