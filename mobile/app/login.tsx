import { useAuthStore } from "@/stores/useAuthStore";
import axiosClient from "@/utils/axios";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginScreen = () => {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState({ staffId: "", password: "" });
  const { loadUser } = useAuthStore();

  const validateForm = () => {
    let isValid = true;
    const newErrors = { staffId: "", password: "" };

    if (!staffId.trim()) {
      newErrors.staffId = "Staff ID is required";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axiosClient.post("/users/auth/staff/login/", {
        staff_id: staffId.trim(),
        password,
      });
      if (response.data) {
        const { tokens, user, change_password_required } = response.data.data;

        await AsyncStorage.setItem("access_token", tokens.access_token);
        await AsyncStorage.setItem("refresh_token", tokens.refresh_token);
        console.log("user data to be stored:", user);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        setTimeout(() => {
          Alert.alert("Success", response.data?.message || "Login successful!");

          // if the backend indicates that the user needs to change their password, we navigate them to the account setup screen instead of the main app
          if (change_password_required) {
            router.push("/onboarding/account-setup");
            return;
          }

          router.push("/(tabs)");
        }, 800);
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      Alert.alert(
        "Error",
        errorData?.message || "Failed to login. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
          >
            <View style={{ alignItems: "center", marginBottom: 48 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: "#fff",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ fontSize: 32, fontWeight: "bold", color: "#000" }}
                >
                  ECG
                </Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>
                Staff Login
              </Text>
              <Text style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
                Enter your credentials to access your account
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Staff ID
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: errors.staffId ? "#ff4444" : "#333",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  backgroundColor: "#111",
                }}
              >
                <Ionicons name="id-card-outline" size={20} color="#666" />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    color: "#fff",
                    fontSize: 16,
                  }}
                  placeholder="Enter your staff ID"
                  placeholderTextColor="#666"
                  value={staffId}
                  onChangeText={(text) => {
                    setStaffId(text);
                    if (errors.staffId) setErrors({ ...errors, staffId: "" });
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              {errors.staffId ? (
                <Text style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>
                  {errors.staffId}
                </Text>
              ) : null}
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: errors.password ? "#ff4444" : "#333",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  backgroundColor: "#111",
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    color: "#fff",
                    fontSize: 16,
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={{ color: "#ff4444", fontSize: 12, marginTop: 4 }}>
                  {errors.password}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 32 }}
            >
              <Text style={{ color: "#fff", fontSize: 14, opacity: 0.8 }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                marginBottom: 24,
              }}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator color="#000" />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: "#000",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Logging In...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{ color: "#000", fontSize: 16, fontWeight: "600" }}
                >
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <Text style={{ textAlign: "center", color: "#666", fontSize: 12 }}>
              Having trouble logging in? Contact your administrator
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
