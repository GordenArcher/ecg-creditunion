import InfoRow from "@/components/InfoRow";
import ProfileSkeleton from "@/components/loader/ProfileSkeleton";
import { changePassword, fetchUser, updateUser } from "@/services/api/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatDate } from "@/types/helper/formatSmartDate";
import { ProfileData } from "@/types/shared";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(user);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<"SMS" | "EMAIL">("SMS");
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    title: "",
    gender: "",
    date_of_birth: "",
    marital_status: "",
    number_of_dependents: 0,
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      const apiUser = await fetchUser();
      setProfile(apiUser.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      Alert.alert(errorData?.message || "Error", "Failed to load profile");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formdata = new FormData();
      Object.entries(editForm).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formdata.append(key, String(value));
        }
      });
      const response = await updateUser(formdata);
      if (response) {
        setProfile((prev) => (prev ? { ...prev, ...editForm } : prev));
        setEditMode(false);
        Alert.alert("Success", "Profile updated successfully");
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      Alert.alert("Error", errorData?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password) {
      Alert.alert("Error", "Current password is required");
      return;
    }
    if (!passwordData.new_password) {
      Alert.alert("Error", "New password is required");
      return;
    }
    if (passwordData.new_password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await changePassword(
        passwordData.current_password,
        passwordData.new_password,
        passwordData.confirm_password,
      );

      if (response) {
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        Alert.alert(
          "Success",
          response.data.message || "Password changed successfully",
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to change password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setProfile((prev) =>
          prev ? { ...prev, avatar: result.assets[0].uri } : prev,
        );
        Alert.alert("Success", "Avatar updated successfully");
      } catch {
        Alert.alert("Error", "Failed to upload avatar");
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert("Error", "Failed to logout, please try again");
          }
        },
      },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (refreshing) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff" }}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>
              Profile
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setEditMode(!editMode)}>
                <Ionicons
                  name={editMode ? "close" : "create-outline"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={avatarLoading}>
            <View style={{ position: "relative" }}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 3,
                    borderColor: "#333",
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "#333",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor: "#444",
                  }}
                >
                  <Text
                    style={{ fontSize: 36, fontWeight: "bold", color: "#fff" }}
                  >
                    {getInitials(profile.full_name)}
                  </Text>
                </View>
              )}
              {avatarLoading ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    borderRadius: 50,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: "#fff",
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="camera" size={16} color="#000" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#fff",
              marginTop: 12,
            }}
          >
            {profile.full_name}
          </Text>
          <Text style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
            {profile.role} • {profile.staff_id}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {editMode ? (
            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 16,
                }}
              >
                Edit Profile
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Full Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 12,
                    color: "#fff",
                    fontSize: 14,
                  }}
                  value={editForm.full_name}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, full_name: text })
                  }
                  placeholderTextColor="#666"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 12,
                    color: "#fff",
                    fontSize: 14,
                  }}
                  value={editForm.email}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Phone Number
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 12,
                    color: "#fff",
                    fontSize: 14,
                  }}
                  value={editForm.phone_number}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, phone_number: text })
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Title
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 12,
                    color: "#fff",
                    fontSize: 14,
                  }}
                  value={editForm.title}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, title: text })
                  }
                  placeholderTextColor="#666"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Gender
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {["MALE", "FEMALE", "OTHER"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setEditForm({ ...editForm, gender: g })}
                      style={{
                        flex: 1,
                        backgroundColor:
                          editForm.gender === g ? "#fff" : "#222",
                        borderRadius: 8,
                        padding: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: editForm.gender === g ? "#000" : "#fff",
                        }}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Marital Status
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {[
                      "SINGLE",
                      "MARRIED",
                      "DIVORCED",
                      "WIDOWED",
                      "SEPARATED",
                    ].map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() =>
                          setEditForm({ ...editForm, marital_status: status })
                        }
                        style={{
                          backgroundColor:
                            editForm.marital_status === status
                              ? "#fff"
                              : "#222",
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              editForm.marital_status === status
                                ? "#000"
                                : "#fff",
                          }}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Dependents
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 12,
                    color: "#fff",
                    fontSize: 14,
                  }}
                  value={String(editForm.number_of_dependents)}
                  onChangeText={(text) =>
                    setEditForm({
                      ...editForm,
                      number_of_dependents: parseInt(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setEditMode(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={saving}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={{ color: "#000", fontWeight: "600" }}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                >
                  Personal Information
                </Text>
                <TouchableOpacity onPress={() => setEditMode(true)}>
                  <Text style={{ color: "#888" }}>Edit</Text>
                </TouchableOpacity>
              </View>

              <InfoRow label="Staff ID" value={profile.staff_id} />
              <InfoRow label="Employee ID" value={profile.employee_id} />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Phone" value={profile.phone_number} />
              <InfoRow
                label="Date of Birth"
                value={
                  profile.date_of_birth
                    ? formatDate(profile.date_of_birth)
                    : "-"
                }
              />
              <InfoRow label="Gender" value={profile.gender} />
              <InfoRow label="Marital Status" value={profile.marital_status} />
              <InfoRow
                label="Dependents"
                value={String(profile.number_of_dependents)}
              />
            </View>
          )}

          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Work Information
            </Text>
            <InfoRow label="Title" value={profile.title || "-"} />
            <InfoRow label="Role" value={profile.role} />
            <InfoRow label="Directorate" value={profile.directorate || "-"} />
            <InfoRow label="PB Number" value={profile.pb_number || "-"} />
            <InfoRow
              label="Station"
              value={
                profile.station
                  ? `${profile.station.name} (${profile.station.code})`
                  : "-"
              }
            />
            <InfoRow
              label="Division"
              value={
                profile.division
                  ? `${profile.division.name} (${profile.division.code})`
                  : "-"
              }
            />
            <InfoRow
              label="Date Joined"
              value={formatDate(profile.date_joined)}
            />
            <InfoRow
              label="Date Registered"
              value={formatDate(profile.date_registered)}
            />
            {profile.last_login && (
              <InfoRow
                label="Last Login"
                value={formatDate(profile.last_login)}
              />
            )}
          </View>

          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Account Security
            </Text>

            <TouchableOpacity
              onPress={() => setShowPasswordModal(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#222",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#888" />
                <View>
                  <Text style={{ color: "#fff", fontSize: 14 }}>
                    Change Password
                  </Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>
                    Update your password regularly
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShow2FAModal(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#888"
                />
                <View>
                  <Text style={{ color: "#fff", fontSize: 14 }}>
                    Two-Factor Authentication
                  </Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>
                    {twoFAEnabled ? `Enabled (${twoFAMethod})` : "Disabled"}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Account Status
            </Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
                  Status
                </Text>
                <View
                  style={{
                    backgroundColor: profile.is_active
                      ? "#4CAF5020"
                      : "#ff444420",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: profile.is_active ? "#4CAF50" : "#ff4444",
                      fontSize: 12,
                    }}
                  >
                    {profile.is_active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
                  Discontinued
                </Text>
                <View
                  style={{
                    backgroundColor: profile.discontinued
                      ? "#ff444420"
                      : "#4CAF5020",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: profile.discontinued ? "#ff4444" : "#4CAF50",
                      fontSize: 12,
                    }}
                  >
                    {profile.discontinued ? "Yes" : "No"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#111",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
                Change Password
              </Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
                Current Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#222",
                  borderRadius: 8,
                }}
              >
                <TextInput
                  style={{ flex: 1, padding: 12, color: "#fff" }}
                  secureTextEntry={!showCurrentPassword}
                  value={passwordData.current_password}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, current_password: text })
                  }
                  placeholder="Enter current password"
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ padding: 12 }}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
                New Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#222",
                  borderRadius: 8,
                }}
              >
                <TextInput
                  style={{ flex: 1, padding: 12, color: "#fff" }}
                  secureTextEntry={!showNewPassword}
                  value={passwordData.new_password}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, new_password: text })
                  }
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={{ padding: 12 }}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
                Confirm Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#222",
                  borderRadius: 8,
                }}
              >
                <TextInput
                  style={{ flex: 1, padding: 12, color: "#fff" }}
                  secureTextEntry={!showConfirmPassword}
                  value={passwordData.confirm_password}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, confirm_password: text })
                  }
                  placeholder="Confirm new password"
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ padding: 12 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={passwordLoading}
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
              }}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ color: "#000", fontWeight: "600" }}>
                  Update Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={show2FAModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#111",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
                Two-Factor Authentication
              </Text>
              <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#fff" }}>Enable 2FA</Text>
                <Switch
                  value={twoFAEnabled}
                  onValueChange={setTwoFAEnabled}
                  trackColor={{ false: "#333", true: "#fff" }}
                  thumbColor={twoFAEnabled ? "#000" : "#666"}
                />
              </View>

              {twoFAEnabled && (
                <>
                  <Text
                    style={{ color: "#888", fontSize: 12, marginBottom: 12 }}
                  >
                    Select method
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setTwoFAMethod("SMS")}
                      style={{
                        flex: 1,
                        backgroundColor:
                          twoFAMethod === "SMS" ? "#fff" : "#222",
                        borderRadius: 8,
                        padding: 12,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={24}
                        color={twoFAMethod === "SMS" ? "#000" : "#fff"}
                      />
                      <Text
                        style={{
                          color: twoFAMethod === "SMS" ? "#000" : "#fff",
                          marginTop: 4,
                        }}
                      >
                        SMS
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setTwoFAMethod("EMAIL")}
                      style={{
                        flex: 1,
                        backgroundColor:
                          twoFAMethod === "EMAIL" ? "#fff" : "#222",
                        borderRadius: 8,
                        padding: 12,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={24}
                        color={twoFAMethod === "EMAIL" ? "#000" : "#fff"}
                      />
                      <Text
                        style={{
                          color: twoFAMethod === "EMAIL" ? "#000" : "#fff",
                          marginTop: 4,
                        }}
                      >
                        Email
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShow2FAModal(false)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#000", fontWeight: "600" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
