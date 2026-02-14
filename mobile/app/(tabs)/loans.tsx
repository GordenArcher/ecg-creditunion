// loans.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dummy data types
interface Loan {
  id: string;
  amount: number;
  purpose: string;
  status: "PENDING" | "APPROVED" | "ACTIVE" | "PAID" | "REJECTED";
  interestRate: number;
  duration: number; // in months
  appliedDate: string;
  approvedDate?: string;
  disbursedDate?: string;
  paidDate?: string;
  balance?: number;
  nextPayment?: string;
  nextPaymentAmount?: number;
}

// Dummy data
const dummyLoans: Loan[] = [
  {
    id: "LN001",
    amount: 5000,
    purpose: "Emergency Medical Expenses",
    status: "ACTIVE",
    interestRate: 12.5,
    duration: 12,
    appliedDate: "2026-01-15T10:30:00Z",
    approvedDate: "2026-01-18T14:20:00Z",
    disbursedDate: "2026-01-20T09:00:00Z",
    balance: 3500,
    nextPayment: "2026-03-15",
    nextPaymentAmount: 450,
  },
  {
    id: "LN002",
    amount: 2000,
    purpose: "School Fees",
    status: "APPROVED",
    interestRate: 10.0,
    duration: 6,
    appliedDate: "2026-02-01T11:15:00Z",
    approvedDate: "2026-02-03T16:30:00Z",
  },
  {
    id: "LN003",
    amount: 10000,
    purpose: "Home Renovation",
    status: "PENDING",
    interestRate: 15.0,
    duration: 24,
    appliedDate: "2026-02-10T09:45:00Z",
  },
  {
    id: "LN004",
    amount: 3000,
    purpose: "Business Startup",
    status: "ACTIVE",
    interestRate: 11.0,
    duration: 18,
    appliedDate: "2025-12-05T13:20:00Z",
    approvedDate: "2025-12-08T10:00:00Z",
    disbursedDate: "2025-12-10T14:30:00Z",
    balance: 1800,
    nextPayment: "2026-03-01",
    nextPaymentAmount: 200,
  },
  {
    id: "LN005",
    amount: 1500,
    purpose: "Electronics Purchase",
    status: "PAID",
    interestRate: 8.5,
    duration: 3,
    appliedDate: "2025-11-01T08:00:00Z",
    approvedDate: "2025-11-03T11:00:00Z",
    disbursedDate: "2025-11-05T09:30:00Z",
    paidDate: "2026-02-01T15:00:00Z",
  },
  {
    id: "LN006",
    amount: 7500,
    purpose: "Vehicle Repair",
    status: "REJECTED",
    interestRate: 13.0,
    duration: 12,
    appliedDate: "2026-01-28T12:00:00Z",
  },
];

// Summary stats
const loanStats = {
  totalActive: dummyLoans.filter((l) => l.status === "ACTIVE").length,
  totalPending: dummyLoans.filter((l) => l.status === "PENDING").length,
  totalApproved: dummyLoans.filter((l) => l.status === "APPROVED").length,
  totalPaid: dummyLoans.filter((l) => l.status === "PAID").length,
  totalOutstanding: dummyLoans
    .filter((l) => l.status === "ACTIVE")
    .reduce((sum, loan) => sum + (loan.balance || 0), 0),
  totalBorrowed: dummyLoans
    .filter((l) => l.status !== "REJECTED")
    .reduce((sum, loan) => sum + loan.amount, 0),
};

const Loans = () => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "#4CAF50";
      case "PENDING":
        return "#FF9800";
      case "APPROVED":
        return "#2196F3";
      case "PAID":
        return "#9C27B0";
      case "REJECTED":
        return "#F44336";
      default:
        return "#888";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "checkmark-circle";
      case "PENDING":
        return "time";
      case "APPROVED":
        return "checkmark-done";
      case "PAID":
        return "cash";
      case "REJECTED":
        return "close-circle";
      default:
        return "help";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₵ ${amount.toLocaleString()}`;
  };

  const filteredLoans =
    filter === "ALL"
      ? dummyLoans
      : dummyLoans.filter((loan) => loan.status === filter);

  const filters = ["ALL", "ACTIVE", "PENDING", "APPROVED", "PAID", "REJECTED"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header */}
      <View
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>
          Loans
        </Text>
        <Text style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
          Manage your loan applications
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
                width: 150,
              }}
            >
              <Text style={{ color: "#fff", opacity: 0.8, fontSize: 12 }}>
                Outstanding
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {formatCurrency(loanStats.totalOutstanding)}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.6,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                {loanStats.totalActive} active loans
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={["#2196F3", "#1976D2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 16,
                borderRadius: 16,
                width: 150,
              }}
            >
              <Text style={{ color: "#fff", opacity: 0.8, fontSize: 12 }}>
                Total Borrowed
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {formatCurrency(loanStats.totalBorrowed)}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  opacity: 0.6,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                {loanStats.totalPaid} loans paid
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>

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

        {/* Apply for Loan Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity
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
            <Ionicons name="add-circle" size={20} color="#000" />
            <Text style={{ color: "#000", fontSize: 16, fontWeight: "600" }}>
              Apply for New Loan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loans List */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#fff",
              marginBottom: 12,
            }}
          >
            Your Loans
          </Text>

          {filteredLoans.length === 0 ? (
            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <Ionicons name="document-text-outline" size={48} color="#333" />
              <Text
                style={{
                  color: "#888",
                  fontSize: 14,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No loans found in this category
              </Text>
            </View>
          ) : (
            filteredLoans.map((loan) => (
              <TouchableOpacity
                key={loan.id}
                onPress={() => {
                  setSelectedLoan(loan);
                  setModalVisible(true);
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
                        backgroundColor: `${getStatusColor(loan.status)}20`,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={getStatusIcon(loan.status) as any}
                        size={20}
                        color={getStatusColor(loan.status)}
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
                        {loan.id}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#888" }}>
                        {loan.purpose}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: `${getStatusColor(loan.status)}20`,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: getStatusColor(loan.status),
                        fontSize: 11,
                      }}
                    >
                      {loan.status}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Text style={{ color: "#888", fontSize: 11 }}>Amount</Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      {formatCurrency(loan.amount)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#888", fontSize: 11 }}>
                      Interest
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 14, marginTop: 2 }}>
                      {loan.interestRate}%
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#888", fontSize: 11 }}>Term</Text>
                    <Text style={{ color: "#fff", fontSize: 14, marginTop: 2 }}>
                      {loan.duration}mo
                    </Text>
                  </View>
                </View>

                {loan.status === "ACTIVE" && (
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: "#222",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#888", fontSize: 12 }}>
                        Balance
                      </Text>
                      <Text
                        style={{
                          color: "#4CAF50",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        {formatCurrency(loan.balance || 0)}
                      </Text>
                    </View>
                    {loan.nextPayment && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 8,
                        }}
                      >
                        <Text style={{ color: "#888", fontSize: 12 }}>
                          Next Payment
                        </Text>
                        <Text style={{ color: "#fff", fontSize: 12 }}>
                          {formatDate(loan.nextPayment)} •{" "}
                          {formatCurrency(loan.nextPaymentAmount || 0)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Loan Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
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
            {selectedLoan && (
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
                    Loan Details
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
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
                        backgroundColor: `${getStatusColor(selectedLoan.status)}20`,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={getStatusIcon(selectedLoan.status) as any}
                        size={30}
                        color={getStatusColor(selectedLoan.status)}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "#fff",
                        marginTop: 12,
                      }}
                    >
                      {formatCurrency(selectedLoan.amount)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${getStatusColor(selectedLoan.status)}20`,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginTop: 8,
                      }}
                    >
                      <Text
                        style={{ color: getStatusColor(selectedLoan.status) }}
                      >
                        {selectedLoan.status}
                      </Text>
                    </View>
                  </View>

                  <DetailRow label="Loan ID" value={selectedLoan.id} />
                  <DetailRow label="Purpose" value={selectedLoan.purpose} />
                  <DetailRow
                    label="Interest Rate"
                    value={`${selectedLoan.interestRate}%`}
                  />
                  <DetailRow
                    label="Duration"
                    value={`${selectedLoan.duration} months`}
                  />
                  <DetailRow
                    label="Applied Date"
                    value={formatDate(selectedLoan.appliedDate)}
                  />

                  {selectedLoan.approvedDate && (
                    <DetailRow
                      label="Approved Date"
                      value={formatDate(selectedLoan.approvedDate)}
                    />
                  )}

                  {selectedLoan.disbursedDate && (
                    <DetailRow
                      label="Disbursed Date"
                      value={formatDate(selectedLoan.disbursedDate)}
                    />
                  )}

                  {selectedLoan.paidDate && (
                    <DetailRow
                      label="Paid Date"
                      value={formatDate(selectedLoan.paidDate)}
                    />
                  )}

                  {selectedLoan.balance !== undefined && (
                    <DetailRow
                      label="Current Balance"
                      value={formatCurrency(selectedLoan.balance)}
                    />
                  )}

                  {selectedLoan.nextPayment && (
                    <DetailRow
                      label="Next Payment"
                      value={`${formatDate(selectedLoan.nextPayment)} • ${formatCurrency(selectedLoan.nextPaymentAmount || 0)}`}
                    />
                  )}
                </ScrollView>

                {selectedLoan.status === "ACTIVE" && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 8,
                      padding: 16,
                      alignItems: "center",
                      marginTop: 20,
                    }}
                  >
                    <Text style={{ color: "#000", fontWeight: "600" }}>
                      Make Payment
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedLoan.status === "PENDING" && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#222",
                      borderRadius: 8,
                      padding: 16,
                      alignItems: "center",
                      marginTop: 20,
                    }}
                  >
                    <Text style={{ color: "#888" }}>Cancel Application</Text>
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
      borderBottomColor: "#222",
    }}
  >
    <Text style={{ color: "#888", fontSize: 14 }}>{label}</Text>
    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>
      {value}
    </Text>
  </View>
);

export default Loans;
