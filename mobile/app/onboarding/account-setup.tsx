import { setUpPassword } from "@/services/api/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

const AccountSetup = () => {
  const { user, loadUser } = useAuthStore();

  const router = useRouter();
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useState(() => {
    if (!user) {
      loadUser();
    }
  }, [user]);

  const calculateStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (pass.match(/[a-z]/)) strength += 25;
    if (pass.match(/[A-Z]/)) strength += 25;
    if (pass.match(/[0-9]/)) strength += 25;
    if (pass.match(/[^a-zA-Z0-9]/)) strength += 25; // Bonus for special characters
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (text: string) => {
    setPasswordData({ ...passwordData, newPassword: text });
    setPasswordStrength(calculateStrength(text));
  };

  const validateForm = () => {
    if (!passwordData.newPassword) {
      Alert.alert("Error", "Please enter a new password");
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    if (passwordStrength < 75) {
      Alert.alert("Error", "Please choose a stronger password");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await setUpPassword(
        passwordData.newPassword,
        passwordData.confirmPassword,
      );

      if (response) {
        setTimeout(() => {
          Alert.alert(
            "Success!",
            "Your password has been set successfully. You can now log in with your new password.",
            [
              {
                text: "Continue",
                onPress: () => router.push("/(tabs)"),
              },
            ],
          );
        }, 2000);
      }
    } catch (error: any) {
      const errorData = error?.response?.data;
      Alert.alert(errorData?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 50) return "#F44336";
    if (passwordStrength < 75) return "#FF9800";
    return "#4CAF50";
  };

  const getStrengthText = () => {
    if (passwordStrength < 50) return "Weak";
    if (passwordStrength < 75) return "Medium";
    return "Strong";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingTop: 40,
              paddingBottom: 20,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 40 }}>
              <LinearGradient
                colors={["#4CAF50", "#2196F3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{ fontSize: 40, fontWeight: "bold", color: "#fff" }}
                >
                  {getInitials(user?.full_name || "User")}
                </Text>
              </LinearGradient>

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                Welcome aboard, {user?.full_name?.split(" ")[0] || "User"}! 👋
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: "#888",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                Let&apos;s secure your account by setting up a strong password
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#333",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#222",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="person" size={24} color="#888" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                  >
                    {user?.full_name || "User"}
                  </Text>
                  <Text style={{ color: "#888", fontSize: 14, marginTop: 2 }}>
                    {user?.email} • {user?.staff_id}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#2196F320",
                borderRadius: 12,
                padding: 12,
                marginBottom: 24,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: "#2196F340",
              }}
            >
              <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                >
                  Security First
                </Text>
                <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                  Your account is using a default password. Please change it to
                  something secure.
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 16,
                }}
              >
                Set New Password
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: "#888", fontSize: 14, marginBottom: 8 }}>
                  New Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#111",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#333",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      color: "#fff",
                      fontSize: 16,
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showNewPassword}
                    value={passwordData.newPassword}
                    onChangeText={handlePasswordChange}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {passwordData.newPassword.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        height: 4,
                        backgroundColor: "#222",
                        borderRadius: 2,
                      }}
                    >
                      <View
                        style={{
                          width: `${passwordStrength}%`,
                          height: 4,
                          backgroundColor: getStrengthColor(),
                          borderRadius: 2,
                        }}
                      />
                    </View>
                    <Text style={{ color: getStrengthColor(), fontSize: 12 }}>
                      {getStrengthText()}
                    </Text>
                  </View>
                  <Text style={{ color: "#666", fontSize: 11 }}>
                    Use at least 8 characters with uppercase, lowercase, numbers
                    & symbols
                  </Text>
                </View>
              )}

              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: "#888", fontSize: 14, marginBottom: 8 }}>
                  Confirm Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#111",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#333",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed" size={20} color="#666" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      color: "#fff",
                      fontSize: 16,
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirmPassword}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: text,
                      })
                    }
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#111",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 12,
                  }}
                >
                  Password Requirements
                </Text>

                <RequirementCheck
                  label="At least 8 characters"
                  met={passwordData.newPassword.length >= 8}
                />
                <RequirementCheck
                  label="Contains lowercase letter"
                  met={/[a-z]/.test(passwordData.newPassword)}
                />
                <RequirementCheck
                  label="Contains uppercase letter"
                  met={/[A-Z]/.test(passwordData.newPassword)}
                />
                <RequirementCheck
                  label="Contains number"
                  met={/[0-9]/.test(passwordData.newPassword)}
                />
                <RequirementCheck
                  label="Contains special character"
                  met={/[^a-zA-Z0-9]/.test(passwordData.newPassword)}
                />
                <RequirementCheck
                  label="Passwords match"
                  met={
                    passwordData.newPassword === passwordData.confirmPassword &&
                    passwordData.newPassword.length > 0
                  }
                />
              </View>

              <View
                style={{
                  backgroundColor: "#4CAF5020",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: "#4CAF5040",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Ionicons name="bulb" size={24} color="#4CAF50" />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                    >
                      Pro Tip
                    </Text>
                    <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                      Use a passphrase like &ldquo;Blue-Eagle-Runs-67!&ldquo; -
                      it&apos;s easier to remember and harder to crack.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 18,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text
                  style={{ color: "#000", fontSize: 16, fontWeight: "600" }}
                >
                  Set Password & Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Skip Setup?",
                  "You can set up your password later from profile settings.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Skip",
                      onPress: () => router.push("/(tabs)"),
                    },
                  ],
                )
              }
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: "#666", fontSize: 14 }}>
                I&apos;ll do this later
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const RequirementCheck = ({ label, met }: { label: string; met: boolean }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    }}
  >
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: met ? "#4CAF5020" : "#F4433620",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons
        name={met ? "checkmark" : "close"}
        size={12}
        color={met ? "#4CAF50" : "#F44336"}
      />
    </View>
    <Text style={{ color: met ? "#4CAF50" : "#F44336", fontSize: 13, flex: 1 }}>
      {label}
    </Text>
  </View>
);

export default AccountSetup;
