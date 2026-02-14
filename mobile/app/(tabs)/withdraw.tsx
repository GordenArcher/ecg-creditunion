import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dummy withdrawal history data
interface Withdrawal {
  id: string;
  amount: number;
  method: "BANK" | "MOBILE_MONEY" | "CASH";
  status: "PENDING" | "COMPLETED" | "FAILED" | "PROCESSING";
  accountNumber?: string;
  bankName?: string;
  mobileProvider?: "MTN" | "VODAFONE" | "AIRTELTIGO";
  mobileNumber?: string;
  reference: string;
  requestedDate: string;
  processedDate?: string;
  fee: number;
  notes?: string;
}

// Dummy data
const dummyWithdrawals: Withdrawal[] = [
  {
    id: "WD001",
    amount: 500,
    method: "MOBILE_MONEY",
    status: "COMPLETED",
    mobileProvider: "MTN",
    mobileNumber: "0241234567",
    reference: "REF2026021301",
    requestedDate: "2026-02-13T09:30:00Z",
    processedDate: "2026-02-13T10:15:00Z",
    fee: 2.5,
  },
  {
    id: "WD002",
    amount: 1200,
    method: "BANK",
    status: "PENDING",
    bankName: "GCB Bank",
    accountNumber: "1234567890",
    reference: "REF2026021302",
    requestedDate: "2026-02-13T11:45:00Z",
    fee: 5.0,
  },
  {
    id: "WD003",
    amount: 300,
    method: "MOBILE_MONEY",
    status: "PROCESSING",
    mobileProvider: "VODAFONE",
    mobileNumber: "0201234567",
    reference: "REF2026021303",
    requestedDate: "2026-02-13T13:20:00Z",
    fee: 2.5,
  },
  {
    id: "WD004",
    amount: 1000,
    method: "BANK",
    status: "COMPLETED",
    bankName: "Stanbic Bank",
    accountNumber: "0987654321",
    reference: "REF2026021201",
    requestedDate: "2026-02-12T14:30:00Z",
    processedDate: "2026-02-12T16:45:00Z",
    fee: 5.0,
  },
  {
    id: "WD005",
    amount: 150,
    method: "MOBILE_MONEY",
    status: "FAILED",
    mobileProvider: "AIRTELTIGO",
    mobileNumber: "0261234567",
    reference: "REF2026021202",
    requestedDate: "2026-02-12T08:15:00Z",
    fee: 2.5,
    notes: "Insufficient funds",
  },
  {
    id: "WD006",
    amount: 2000,
    method: "BANK",
    status: "COMPLETED",
    bankName: "ABS Bank",
    accountNumber: "1122334455",
    reference: "REF2026021101",
    requestedDate: "2026-02-11T10:00:00Z",
    processedDate: "2026-02-11T14:20:00Z",
    fee: 5.0,
  },
];

// Summary stats
const withdrawalStats = {
  totalWithdrawn: dummyWithdrawals
    .filter((w) => w.status === "COMPLETED")
    .reduce((sum, w) => sum + w.amount, 0),
  pendingCount: dummyWithdrawals.filter((w) => w.status === "PENDING").length,
  processingCount: dummyWithdrawals.filter((w) => w.status === "PROCESSING")
    .length,
  completedCount: dummyWithdrawals.filter((w) => w.status === "COMPLETED")
    .length,
  failedCount: dummyWithdrawals.filter((w) => w.status === "FAILED").length,
  totalFees: dummyWithdrawals
    .filter((w) => w.status === "COMPLETED")
    .reduce((sum, w) => sum + w.fee, 0),
};

const Withdraw = () => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<Withdrawal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  // Withdrawal form state
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    method: "MOBILE_MONEY" as "MOBILE_MONEY" | "BANK",
    mobileProvider: "MTN" as "MTN" | "VODAFONE" | "AIRTELTIGO",
    mobileNumber: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [formStep, setFormStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#4CAF50";
      case "PENDING":
        return "#FF9800";
      case "PROCESSING":
        return "#2196F3";
      case "FAILED":
        return "#F44336";
      default:
        return "#888";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "BANK":
        return "business";
      case "MOBILE_MONEY":
        return "phone-portrait";
      default:
        return "cash";
    }
  };

  const getMobileProviderColor = (provider?: string) => {
    switch (provider) {
      case "MTN":
        return "#FFC107";
      case "VODAFONE":
        return "#E91E63";
      case "AIRTELTIGO":
        return "#00BCD4";
      default:
        return "#888";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₵ ${amount.toLocaleString()}`;
  };

  const filteredWithdrawals =
    filter === "ALL"
      ? dummyWithdrawals
      : dummyWithdrawals.filter((w) => w.status === filter);

  const filters = ["ALL", "COMPLETED", "PENDING", "PROCESSING", "FAILED"];

  const handleWithdrawSubmit = () => {
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setShowWithdrawModal(false);
      setWithdrawForm({
        amount: "",
        method: "MOBILE_MONEY",
        mobileProvider: "MTN",
        mobileNumber: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
      });
      setFormStep(1);
      Alert.alert("Success", "Withdrawal request submitted successfully");
    }, 2000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header */}
      <View
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>
          Withdrawals
        </Text>
        <Text style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
          Request and track your withdrawals
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 20, marginBottom: 20 }}
        >
          <View style={{ flexDirection: "row", gap: 12 }}>
            <LinearGradient
              colors={["#4CAF50", "#45a049"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 16,
                borderRadius: 16,
                width: 160,
              }}
            >
              <Text style={{ color: "#fff", opacity: 0.8, fontSize: 12 }}>
                Total Withdrawn
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {formatCurrency(withdrawalStats.totalWithdrawn)}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.6,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                Fees: {formatCurrency(withdrawalStats.totalFees)}
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={["#2196F3", "#1976D2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 16,
                borderRadius: 16,
                width: 140,
              }}
            >
              <Text style={{ color: "#fff", opacity: 0.8, fontSize: 12 }}>
                Pending
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 32,
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {withdrawalStats.pendingCount}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.6,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                Processing: {withdrawalStats.processingCount}
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>

        {/* New Withdrawal Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setShowWithdrawModal(true)}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="arrow-down-circle" size={20} color="#000" />
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "600" }}>
              Request Withdrawal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {filters.map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: filter === f ? "#fff" : "#222",
                  }}
                >
                  <Text
                    style={{
                      color: filter === f ? "#000" : "#fff",
                      fontSize: 13,
                    }}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Withdrawals List */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 12,
            }}
          >
            Withdrawal History
          </Text>

          {filteredWithdrawals.length === 0 ? (
            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <Ionicons name="swap-horizontal" size={48} color="#333" />
              <Text
                style={{
                  color: "#888",
                  fontSize: 14,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No withdrawals found
              </Text>
            </View>
          ) : (
            filteredWithdrawals.map((withdrawal) => (
              <TouchableOpacity
                key={withdrawal.id}
                onPress={() => {
                  setSelectedWithdrawal(withdrawal);
                  setShowDetailsModal(true);
                }}
                style={{
                  backgroundColor: "#111",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#222",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${getStatusColor(withdrawal.status)}20`,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={getMethodIcon(withdrawal.method)}
                        size={20}
                        color={getStatusColor(withdrawal.status)}
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        {withdrawal.id}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#888" }}>
                        {withdrawal.method === "BANK"
                          ? withdrawal.bankName
                          : withdrawal.mobileProvider}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: `${getStatusColor(withdrawal.status)}20`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: getStatusColor(withdrawal.status),
                        fontSize: 11,
                      }}
                    >
                      {withdrawal.status}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ color: "#888", fontSize: 11 }}>Amount</Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      {formatCurrency(withdrawal.amount)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#888", fontSize: 11 }}>Fee</Text>
                    <Text style={{ color: "#888", fontSize: 14, marginTop: 2 }}>
                      {formatCurrency(withdrawal.fee)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#888", fontSize: 11 }}>Date</Text>
                    <Text style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>
                      {new Date(withdrawal.requestedDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Withdrawal Request Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
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
                Request Withdrawal
              </Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              {[1, 2, 3].map((step) => (
                <View key={step} style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: formStep >= step ? "#fff" : "#333",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: formStep >= step ? "#000" : "#888",
                        fontWeight: "600",
                      }}
                    >
                      {step}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: formStep >= step ? "#fff" : "#888",
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    {step === 1 ? "Amount" : step === 2 ? "Method" : "Confirm"}
                  </Text>
                </View>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {formStep === 1 && (
                <View>
                  <Text
                    style={{ color: "#888", fontSize: 14, marginBottom: 8 }}
                  >
                    Enter Amount
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#222",
                      borderRadius: 12,
                      padding: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        paddingHorizontal: 12,
                      }}
                    >
                      ₵
                    </Text>
                    <TextInput
                      style={{
                        flex: 1,
                        padding: 16,
                        color: "#fff",
                        fontSize: 24,
                        fontWeight: "600",
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#444"
                      keyboardType="numeric"
                      value={withdrawForm.amount}
                      onChangeText={(text) =>
                        setWithdrawForm({ ...withdrawForm, amount: text })
                      }
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    {[100, 200, 500, 1000].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        onPress={() =>
                          setWithdrawForm({
                            ...withdrawForm,
                            amount: amt.toString(),
                          })
                        }
                        style={{
                          flex: 1,
                          backgroundColor: "#222",
                          borderRadius: 8,
                          padding: 8,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff" }}>₵ {amt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={{ color: "#888", fontSize: 12, marginTop: 16 }}>
                    Available Balance: ₵ 2,450.00
                  </Text>
                  <Text style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                    Minimum: ₵ 10 | Maximum: ₵ 5,000
                  </Text>
                </View>
              )}

              {formStep === 2 && (
                <View>
                  <Text
                    style={{ color: "#888", fontSize: 14, marginBottom: 12 }}
                  >
                    Select Method
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setWithdrawForm({
                        ...withdrawForm,
                        method: "MOBILE_MONEY",
                      })
                    }
                    style={{
                      backgroundColor:
                        withdrawForm.method === "MOBILE_MONEY"
                          ? "#333"
                          : "#222",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor:
                        withdrawForm.method === "MOBILE_MONEY"
                          ? "#fff"
                          : "transparent",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Ionicons name="phone-portrait" size={24} color="#fff" />
                      <View>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          Mobile Money
                        </Text>
                        <Text style={{ color: "#888", fontSize: 12 }}>
                          Instant transfer to mobile wallet
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {withdrawForm.method === "MOBILE_MONEY" && (
                    <View style={{ marginTop: 12 }}>
                      <Text
                        style={{ color: "#888", fontSize: 14, marginBottom: 8 }}
                      >
                        Select Provider
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          marginBottom: 16,
                        }}
                      >
                        {(["MTN", "VODAFONE", "AIRTELTIGO"] as const).map(
                          (provider) => (
                            <TouchableOpacity
                              key={provider}
                              onPress={() =>
                                setWithdrawForm({
                                  ...withdrawForm,
                                  mobileProvider: provider,
                                })
                              }
                              style={{
                                flex: 1,
                                backgroundColor:
                                  withdrawForm.mobileProvider === provider
                                    ? "#fff"
                                    : "#222",
                                borderRadius: 8,
                                padding: 8,
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color:
                                    withdrawForm.mobileProvider === provider
                                      ? "#000"
                                      : "#fff",
                                }}
                              >
                                {provider}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )}
                      </View>

                      <Text
                        style={{ color: "#888", fontSize: 14, marginBottom: 8 }}
                      >
                        Mobile Number
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: "#222",
                          borderRadius: 8,
                          padding: 12,
                          color: "#fff",
                          fontSize: 16,
                        }}
                        placeholder="024XXXXXXX"
                        placeholderTextColor="#444"
                        keyboardType="phone-pad"
                        value={withdrawForm.mobileNumber}
                        onChangeText={(text) =>
                          setWithdrawForm({
                            ...withdrawForm,
                            mobileNumber: text,
                          })
                        }
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() =>
                      setWithdrawForm({ ...withdrawForm, method: "BANK" })
                    }
                    style={{
                      backgroundColor:
                        withdrawForm.method === "BANK" ? "#333" : "#222",
                      borderRadius: 12,
                      padding: 16,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor:
                        withdrawForm.method === "BANK" ? "#fff" : "transparent",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <Ionicons name="business" size={24} color="#fff" />
                      <View>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          Bank Transfer
                        </Text>
                        <Text style={{ color: "#888", fontSize: 12 }}>
                          1-3 business days
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {withdrawForm.method === "BANK" && (
                    <View style={{ marginTop: 12 }}>
                      <TextInput
                        style={{
                          backgroundColor: "#222",
                          borderRadius: 8,
                          padding: 12,
                          color: "#fff",
                          fontSize: 16,
                          marginBottom: 12,
                        }}
                        placeholder="Bank Name"
                        placeholderTextColor="#444"
                        value={withdrawForm.bankName}
                        onChangeText={(text) =>
                          setWithdrawForm({ ...withdrawForm, bankName: text })
                        }
                      />
                      <TextInput
                        style={{
                          backgroundColor: "#222",
                          borderRadius: 8,
                          padding: 12,
                          color: "#fff",
                          fontSize: 16,
                          marginBottom: 12,
                        }}
                        placeholder="Account Number"
                        placeholderTextColor="#444"
                        keyboardType="numeric"
                        value={withdrawForm.accountNumber}
                        onChangeText={(text) =>
                          setWithdrawForm({
                            ...withdrawForm,
                            accountNumber: text,
                          })
                        }
                      />
                      <TextInput
                        style={{
                          backgroundColor: "#222",
                          borderRadius: 8,
                          padding: 12,
                          color: "#fff",
                          fontSize: 16,
                        }}
                        placeholder="Account Name"
                        placeholderTextColor="#444"
                        value={withdrawForm.accountName}
                        onChangeText={(text) =>
                          setWithdrawForm({
                            ...withdrawForm,
                            accountName: text,
                          })
                        }
                      />
                    </View>
                  )}
                </View>
              )}

              {formStep === 3 && (
                <View>
                  <Text
                    style={{ color: "#888", fontSize: 14, marginBottom: 16 }}
                  >
                    Confirm Details
                  </Text>

                  <View
                    style={{
                      backgroundColor: "#222",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <DetailRow
                      label="Amount"
                      value={`₵ ${withdrawForm.amount}`}
                    />
                    <DetailRow
                      label="Method"
                      value={
                        withdrawForm.method === "BANK"
                          ? "Bank Transfer"
                          : "Mobile Money"
                      }
                    />

                    {withdrawForm.method === "MOBILE_MONEY" && (
                      <>
                        <DetailRow
                          label="Provider"
                          value={withdrawForm.mobileProvider}
                        />
                        <DetailRow
                          label="Mobile Number"
                          value={withdrawForm.mobileNumber}
                        />
                      </>
                    )}

                    {withdrawForm.method === "BANK" && (
                      <>
                        <DetailRow label="Bank" value={withdrawForm.bankName} />
                        <DetailRow
                          label="Account Number"
                          value={withdrawForm.accountNumber}
                        />
                        <DetailRow
                          label="Account Name"
                          value={withdrawForm.accountName}
                        />
                      </>
                    )}

                    <DetailRow label="Fee" value="₵ 2.50" />
                    <DetailRow
                      label="Total Deduction"
                      value={`₵ ${(parseFloat(withdrawForm.amount) + 2.5).toFixed(2)}`}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              {formStep > 1 && (
                <TouchableOpacity
                  onPress={() => setFormStep(formStep - 1)}
                  style={{
                    flex: 1,
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff" }}>Back</Text>
                </TouchableOpacity>
              )}

              {formStep < 3 ? (
                <TouchableOpacity
                  onPress={() => setFormStep(formStep + 1)}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#000", fontWeight: "600" }}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleWithdrawSubmit}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={{ color: "#000", fontWeight: "600" }}>
                      Confirm
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
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
            {selectedWithdrawal && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}
                  >
                    Withdrawal Details
                  </Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 500 }}>
                  <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: `${getStatusColor(selectedWithdrawal.status)}20`,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={getMethodIcon(selectedWithdrawal.method)}
                        size={30}
                        color={getStatusColor(selectedWithdrawal.status)}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: "bold",
                        color: "#fff",
                        marginTop: 12,
                      }}
                    >
                      {formatCurrency(selectedWithdrawal.amount)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${getStatusColor(selectedWithdrawal.status)}20`,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginTop: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: getStatusColor(selectedWithdrawal.status),
                        }}
                      >
                        {selectedWithdrawal.status}
                      </Text>
                    </View>
                  </View>

                  <DetailRow
                    label="Reference"
                    value={selectedWithdrawal.reference}
                  />
                  <DetailRow label="Method" value={selectedWithdrawal.method} />

                  {selectedWithdrawal.method === "BANK" && (
                    <>
                      <DetailRow
                        label="Bank"
                        value={selectedWithdrawal.bankName || ""}
                      />
                      <DetailRow
                        label="Account Number"
                        value={selectedWithdrawal.accountNumber || ""}
                      />
                    </>
                  )}

                  {selectedWithdrawal.method === "MOBILE_MONEY" && (
                    <>
                      <DetailRow
                        label="Provider"
                        value={selectedWithdrawal.mobileProvider || ""}
                      />
                      <DetailRow
                        label="Mobile Number"
                        value={selectedWithdrawal.mobileNumber || ""}
                      />
                    </>
                  )}

                  <DetailRow
                    label="Fee"
                    value={formatCurrency(selectedWithdrawal.fee)}
                  />
                  <DetailRow
                    label="Requested Date"
                    value={formatDate(selectedWithdrawal.requestedDate)}
                  />

                  {selectedWithdrawal.processedDate && (
                    <DetailRow
                      label="Processed Date"
                      value={formatDate(selectedWithdrawal.processedDate)}
                    />
                  )}

                  {selectedWithdrawal.notes && (
                    <DetailRow label="Notes" value={selectedWithdrawal.notes} />
                  )}
                </ScrollView>

                {selectedWithdrawal.status === "PENDING" && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#F44336",
                      borderRadius: 8,
                      padding: 16,
                      alignItems: "center",
                      marginTop: 20,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#333",
    }}
  >
    <Text style={{ color: "#888", fontSize: 14 }}>{label}</Text>
    <Text style={{ color: "#fff", fontSize: 14 }}>{value}</Text>
  </View>
);

export default Withdraw;
