import { useAuthStore } from "@/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const dummyUser = {
  name: "Gorden",
  staffId: "STF001",
  role: "Staff",
};

export default function Index() {
  const { user } = useAuthStore();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();

  // Dummy stats
  const stats = {
    pendingLoans: 3,
    withdrawalsHandled: 5,
    totalSavings: "₵ 2,450.00",
    availableBalance: "₵ 1,200.00",
  };

  const actionButtons = [
    {
      id: "loans",
      title: "Loans",
      icon: "cash-outline",
      color: "#4CAF50",
      description: "Apply or track loans",
      badge: stats.pendingLoans,
      onclick: () => router.push("/loans"),
    },
    {
      id: "withdraw",
      title: "Withdraw",
      icon: "arrow-down-circle-outline",
      color: "#2196F3",
      description: "Make a withdrawal",
      onclick: () => router.push("/withdraw"),
    },
    {
      id: "statements",
      title: "Statements",
      icon: "document-text-outline",
      color: "#FF9800",
      description: "View transaction history",
      onclick: () => router.push("/statement"),
    },
    {
      id: "profile",
      title: "Profile",
      icon: "person-outline",
      color: "#9C27B0",
      description: "Manage your account",
      onclick: () => router.push("/profile"),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#fff" }}>
              {greeting}, {user?.full_name || dummyUser.name} 👋
            </Text>
            <Text style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
              Staff ID: {user?.staff_id || dummyUser.staffId} •{" "}
              {user?.role || dummyUser.role}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Total Savings
                </Text>
                <Text
                  style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}
                >
                  {stats.totalSavings}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  Available
                </Text>
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#4CAF50" }}
                >
                  {stats.availableBalance}
                </Text>
              </View>
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#222",
                paddingTop: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#fff",
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                Today&apos;s Activity
              </Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#FF9800",
                      }}
                    />
                    <Text style={{ color: "#888", fontSize: 12 }}>
                      Pending loans
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#FF9800",
                      marginLeft: 16,
                    }}
                  >
                    {stats.pendingLoans}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#2196F3",
                      }}
                    />
                    <Text style={{ color: "#888", fontSize: 12 }}>
                      Withdrawals
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#2196F3",
                      marginLeft: 16,
                    }}
                  >
                    {stats.withdrawalsHandled}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {actionButtons.map((button) => (
              <TouchableOpacity
                key={button.id}
                onPress={button.onclick}
                style={{
                  width: "47%",
                  backgroundColor: "#111",
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#222",
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: `${button.color}20`,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons
                    name={button.icon as any}
                    size={24}
                    color={button.color}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}
                  >
                    {button.title}
                  </Text>
                  {button.badge && (
                    <View
                      style={{
                        backgroundColor: button.color,
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "bold",
                          color: "#000",
                        }}
                      >
                        {button.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  {button.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 14, color: "#888" }}>See All</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#222",
              overflow: "hidden",
            }}
          >
            {[1, 2, 3].map((_, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderBottomColor: "#222",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor:
                        index === 0
                          ? "#4CAF5020"
                          : index === 1
                            ? "#2196F320"
                            : "#FF980020",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={
                        index === 0
                          ? "arrow-down"
                          : index === 1
                            ? "arrow-up"
                            : "swap-horizontal"
                      }
                      size={20}
                      color={
                        index === 0
                          ? "#4CAF50"
                          : index === 1
                            ? "#2196F3"
                            : "#FF9800"
                      }
                    />
                  </View>
                  <View>
                    <Text
                      style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                    >
                      {index === 0
                        ? "Loan Approved"
                        : index === 1
                          ? "Withdrawal"
                          : "Transfer"}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      2 hours ago
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color:
                      index === 0
                        ? "#4CAF50"
                        : index === 1
                          ? "#fff"
                          : "#FF9800",
                  }}
                >
                  {index === 0 ? "+ ₵500" : index === 1 ? "- ₵200" : "₵150"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
