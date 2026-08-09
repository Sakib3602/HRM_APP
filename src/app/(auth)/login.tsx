import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const ILLUSTRATION_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwYdOaYwJIQlUD7WrDtQc6KrpfcXxdbAmuNwOL5EOBiAlfxgfgv2DJNNL5&s=10";

const COLORS = {
  bg: "#F5F7F2",         
  card: "#FFFFFF",        
  primary: "#83A53E",    
  primaryLight: "#F0F4E8",
  primaryDark: "#5A7528", 
  textDark: "#263314",    
  textMuted: "#718556",   
  border: "#DCE5CE",      
  borderActive: "#83A53E",
  gradient: ["#3A4D1A", "#5A7528", "#83A53E"] as const, 
};

export default function Login() {
  const { login } = useAuth();
  const [screen, setScreen] = useState<"intro" | "form">("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ---- animation values ----
  // Now using fully native animations for better performance
  const introOpacity = useRef(new Animated.Value(1)).current;
  const introTranslateY = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(300)).current; // Starts pushed down
  const backBtnOpacity = useRef(new Animated.Value(0)).current;

  // ---- continuous breathing/floating animation (Main Globe) ----
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  
  const pulseScale = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const goToForm = () => {
    setScreen("form");
    Animated.parallel([
      // Intro goes away smoothly
      Animated.timing(introOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(introTranslateY, {
        toValue: -20,
        duration: 250,
        useNativeDriver: true,
      }),
      // Form springs up
      Animated.spring(formTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Show back button
      Animated.timing(backBtnOpacity, {
        toValue: 1,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goBackToIntro = () => {
    setScreen("intro");
    Animated.parallel([
      // Form goes down
      Animated.spring(formTranslateY, {
        toValue: 300,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      // Intro comes back
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(introTranslateY, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
      // Hide back button
      Animated.timing(backBtnOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar style="light" />

      {/* ===== Fixed Top Header Background ===== */}
      <View style={{ position: 'absolute', top: 0, width: '100%', height: SCREEN_H * 0.48 }}>
        <LinearGradient
          colors={COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        />
      </View>


      {/* ===== Fixed Main Illustration (Gota) ===== */}
      <View style={{ 
        position: 'absolute', top: 80, width: '100%', alignItems: 'center', zIndex: 5 
      }}>
        <View style={{ width: 220, height: 220, alignItems: "center", justifyContent: "center" }}>
          {/* Outer pulsing glow */}
          <Animated.View
            style={{
              position: "absolute", width: 220, height: 220, borderRadius: 110,
              backgroundColor: "rgba(255,255,255,0.06)",
              transform: [{ scale: pulseScale }, { translateY: floatTranslateY }],
            }}
          />
          {/* Main circle */}
          <Animated.View
            style={{
              width: 180, height: 180, borderRadius: 90,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center",
              overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
              transform: [{ translateY: floatTranslateY }],
            }}
          >
            <Image
              source={{ uri: ILLUSTRATION_URL }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </Animated.View>
        </View>
      </View>

      {/* ===== Intro Texts & Button (Fades out when form opens) ===== */}
      <Animated.View
        pointerEvents={screen === "intro" ? "auto" : "none"}
        style={{
          position: 'absolute',
          bottom: SCREEN_H * 0.15,
          width: '100%',
          alignItems: 'center',
          paddingHorizontal: 30,
          opacity: introOpacity,
          transform: [{ translateY: introTranslateY }],
        }}
      >
        <Text style={{
          color: COLORS.textDark, fontSize: 32, fontWeight: "800", marginBottom: 8, letterSpacing: 0.5
        }}>
          Genesys HRM
        </Text>
        <Text style={{
          color: COLORS.textMuted, fontSize: 15, marginBottom: 40, textAlign: "center", fontWeight: "500", lineHeight: 22
        }}>
          Manage your whole office, all in one seamless green space.
        </Text>

        <Pressable
          onPress={goToForm}
          style={{
            backgroundColor: COLORS.primary,
            width: '100%',
            paddingVertical: 18,
            borderRadius: 30,
            shadowColor: COLORS.primaryDark,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 18, textAlign: 'center' }}>
            Get Started
          </Text>
        </Pressable>
      </Animated.View>


      {/* ===== Login Form (Slides up over the background) ===== */}
      <KeyboardAvoidingView
        style={{ flex: 1, zIndex: 10 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        pointerEvents={screen === "form" ? "auto" : "none"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View
              style={{
                width: '100%',
                paddingHorizontal: 24,
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 28,
                  padding: 24,
                  paddingTop: 32,
                  shadowColor: COLORS.primaryDark,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Text style={{ color: COLORS.textDark, fontSize: 24, fontWeight: "800", marginBottom: 6 }}>
                  Welcome Back!
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 24 }}>
                  Login to your account to continue
                </Text>

                {error ? (
                  <View style={{
                    backgroundColor: "#FDECEC", borderColor: "#F6C4C4", borderWidth: 1,
                    borderRadius: 12, padding: 14, marginBottom: 20,
                  }}>
                    <Text style={{ color: "#DC2626", fontSize: 13.5, textAlign: "center", fontWeight: "500" }}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* Email Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: COLORS.textDark, fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Email Address
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="you@company.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      backgroundColor: emailFocused ? COLORS.primaryLight : "#F9FAFB",
                      borderColor: emailFocused ? COLORS.borderActive : COLORS.border,
                      borderWidth: emailFocused ? 1.5 : 1,
                      color: COLORS.textDark,
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      fontSize: 15,
                    }}
                  />
                </View>

                {/* Password Input */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: COLORS.textDark, fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Password
                  </Text>
                  <View style={{ justifyContent: "center" }}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={{
                        backgroundColor: passwordFocused ? COLORS.primaryLight : "#F9FAFB",
                        borderColor: passwordFocused ? COLORS.borderActive : COLORS.border,
                        borderWidth: passwordFocused ? 1.5 : 1,
                        color: COLORS.textDark,
                        borderRadius: 14,
                        paddingLeft: 16,
                        paddingRight: 48,
                        paddingVertical: 16,
                        fontSize: 15,
                      }}
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={15}
                      style={{ position: "absolute", right: 16 }}
                    >
                      <Text style={{ fontSize: 18, opacity: 0.7 }}>
                        {showPassword ? "🙈" : "👁️"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable style={{ alignSelf: "flex-end", marginBottom: 30 }} hitSlop={10}>
                  <Text style={{ color: COLORS.primaryDark, fontSize: 13.5, fontWeight: "700" }}>
                    Forgot password?
                  </Text>
                </Pressable>

                {/* Login Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  style={{
                    backgroundColor: COLORS.primary,
                    shadowColor: COLORS.primaryDark,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                    opacity: loading ? 0.7 : 1,
                    borderRadius: 14,
                    paddingVertical: 18,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}>
                      Login
                    </Text>
                  )}
                </Pressable>
              </View>

              <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: "center", marginTop: 24 }}>
                © {new Date().getFullYear()} Genesys HRM System. All rights reserved.
              </Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Back Button (Only visible in Form state) */}
      <Animated.View 
        pointerEvents={screen === "form" ? "auto" : "none"}
        style={{ 
          position: 'absolute', top: 54, left: 24, zIndex: 99, opacity: backBtnOpacity 
        }}
      >
        <Pressable
          onPress={goBackToIntro}
          hitSlop={15}
          style={{
            width: 40, height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "600", lineHeight: 26 }}>‹</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}