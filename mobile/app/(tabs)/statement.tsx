import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dummy transaction data
interface Transaction {
  id: string;
  date: string;
  description: string;
  type:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "TRANSFER"
    | "LOAN_DISBURSEMENT"
    | "LOAN_REPAYMENT"
    | "INTEREST"
    | "FEE";
  amount: number;
  balance: number;
  status: "COMPLETED" | "PENDING" | "FAILED";
  reference: string;
  category?: string;
  notes?: string;
}

// Dummy data
const dummyTransactions: Transaction[] = [
  {
    id: "TRX001",
    date: "2026-02-13T09:30:00Z",
    description: "Salary Deposit",
    type: "DEPOSIT",
    amount: 2500,
    balance: 4850.5,
    status: "COMPLETED",
    reference: "REF2026021301",
    category: "Income",
  },
  {
    id: "TRX002",
    date: "2026-02-13T11:45:00Z",
    description: "MTN Mobile Money Withdrawal",
    type: "WITHDRAWAL",
    amount: -500,
    balance: 4350.5,
    status: "COMPLETED",
    reference: "REF2026021302",
    category: "Withdrawal",
  },
  {
    id: "TRX003",
    date: "2026-02-12T14:20:00Z",
    description: "Loan Repayment",
    type: "LOAN_REPAYMENT",
    amount: -450,
    balance: 4850.5,
    status: "COMPLETED",
    reference: "REF2026021201",
    category: "Loan",
  },
  {
    id: "TRX004",
    date: "2026-02-12T10:15:00Z",
    description: "Transfer to Savings",
    type: "TRANSFER",
    amount: -200,
    balance: 5300.5,
    status: "COMPLETED",
    reference: "REF2026021202",
    category: "Transfer",
  },
  {
    id: "TRX005",
    date: "2026-02-11T16:30:00Z",
    description: "Interest Credit",
    type: "INTEREST",
    amount: 12.5,
    balance: 5500.5,
    status: "COMPLETED",
    reference: "REF2026021101",
    category: "Interest",
  },
  {
    id: "TRX006",
    date: "2026-02-10T09:00:00Z",
    description: "Withdrawal Fee",
    type: "FEE",
    amount: -2.5,
    balance: 5488,
    status: "COMPLETED",
    reference: "REF2026021001",
    category: "Fee",
  },
  {
    id: "TRX007",
    date: "2026-02-09T13:45:00Z",
    description: "Loan Disbursement",
    type: "LOAN_DISBURSEMENT",
    amount: 5000,
    balance: 10488,
    status: "COMPLETED",
    reference: "REF2026020901",
    category: "Loan",
  },
  {
    id: "TRX008",
    date: "2026-02-08T11:20:00Z",
    description: "Bank Transfer Withdrawal",
    type: "WITHDRAWAL",
    amount: -1000,
    balance: 5488,
    status: "PENDING",
    reference: "REF2026020801",
    category: "Withdrawal",
  },
];

// Summary stats
const statementStats = {
  totalDeposits: dummyTransactions
    .filter((t) => t.amount > 0 && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0),
  totalWithdrawals: dummyTransactions
    .filter((t) => t.amount < 0 && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
  totalTransactions: dummyTransactions.length,
  pendingTransactions: dummyTransactions.filter((t) => t.status === "PENDING")
    .length,
  currentBalance: dummyTransactions[0]?.balance || 0,
};

const Statement = () => {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)), // First day of current month
    endDate: new Date(),
  });
  const [showFilterModal, setShowFilterModal] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "arrow-down";
      case "WITHDRAWAL":
        return "arrow-up";
      case "TRANSFER":
        return "swap-horizontal";
      case "LOAN_DISBURSEMENT":
        return "cash";
      case "LOAN_REPAYMENT":
        return "repeat";
      case "INTEREST":
        return "trending-up";
      case "FEE":
        return "alert-circle";
      default:
        return "help";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "#4CAF50";
      case "WITHDRAWAL":
        return "#F44336";
      case "TRANSFER":
        return "#2196F3";
      case "LOAN_DISBURSEMENT":
        return "#9C27B0";
      case "LOAN_REPAYMENT":
        return "#FF9800";
      case "INTEREST":
        return "#00BCD4";
      case "FEE":
        return "#FF5722";
      default:
        return "#888";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#4CAF50";
      case "PENDING":
        return "#FF9800";
      case "FAILED":
        return "#F44336";
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₵ ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter transactions
  const filteredTransactions = dummyTransactions.filter((t) => {
    if (filter !== "ALL" && t.type !== filter) return false;
    const txDate = new Date(t.date);
    return txDate >= dateRange.startDate && txDate <= dateRange.endDate;
  });

  const filters = [
    "ALL",
    "DEPOSIT",
    "WITHDRAWAL",
    "TRANSFER",
    "LOAN_DISBURSEMENT",
    "LOAN_REPAYMENT",
    "INTEREST",
    "FEE",
  ];

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, Transaction[]>,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header */}
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
          <View>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff" }}>
              Statement
            </Text>
            <Text style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
              View your transaction history
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#222",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="filter" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <LinearGradient
            colors={["#1a1a1a", "#111"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <Text style={{ color: "#888", fontSize: 14 }}>Current Balance</Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 36,
                fontWeight: "bold",
                marginTop: 4,
              }}
            >
              {formatCurrency(statementStats.currentBalance)}
            </Text>

            <View style={{ flexDirection: "row", marginTop: 20, gap: 20 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="arrow-down" size={16} color="#4CAF50" />
                  <Text style={{ color: "#888", fontSize: 12 }}>Deposits</Text>
                </View>
                <Text
                  style={{
                    color: "#4CAF50",
                    fontSize: 18,
                    fontWeight: "600",
                    marginTop: 4,
                  }}
                >
                  {formatCurrency(statementStats.totalDeposits)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="arrow-up" size={16} color="#F44336" />
                  <Text style={{ color: "#888", fontSize: 12 }}>
                    Withdrawals
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#F44336",
                    fontSize: 18,
                    fontWeight: "600",
                    marginTop: 4,
                  }}
                >
                  {formatCurrency(statementStats.totalWithdrawals)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Date Range Display */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#111",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <Ionicons name="calendar" size={20} color="#888" />
            <Text style={{ color: "#fff", flex: 1 }}>
              {dateRange.startDate.toLocaleDateString()} -{" "}
              {dateRange.endDate.toLocaleDateString()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
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
                    {f.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Transactions List */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {Object.keys(groupedTransactions).length === 0 ? (
            <View
              style={{
                backgroundColor: "#111",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <Ionicons name="document-text" size={48} color="#333" />
              <Text
                style={{
                  color: "#888",
                  fontSize: 14,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No transactions found for this period
              </Text>
            </View>
          ) : (
            Object.entries(groupedTransactions).map(([date, transactions]) => (
              <View key={date} style={{ marginBottom: 16 }}>
                <Text style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>
                  {new Date(date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>

                {transactions.map((transaction) => (
                  <TouchableOpacity
                    key={transaction.id}
                    onPress={() => {
                      setSelectedTransaction(transaction);
                      setShowDetailsModal(true);
                    }}
                    style={{
                      backgroundColor: "#111",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: "#222",
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
                          backgroundColor: `${getTypeColor(transaction.type)}20`,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons
                          name={getTypeIcon(transaction.type)}
                          size={20}
                          color={getTypeColor(transaction.type)}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            {transaction.description}
                          </Text>
                          <Text
                            style={{
                              color:
                                transaction.amount > 0 ? "#4CAF50" : "#F44336",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {formatCurrency(transaction.amount)}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 4,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Text style={{ color: "#666", fontSize: 11 }}>
                              {formatShortDate(transaction.date)}
                            </Text>
                            <View
                              style={{
                                width: 3,
                                height: 3,
                                borderRadius: 1.5,
                                backgroundColor: "#444",
                              }}
                            />
                            <Text
                              style={{
                                color: getTypeColor(transaction.type),
                                fontSize: 11,
                              }}
                            >
                              {transaction.type}
                            </Text>
                          </View>
                          <Text style={{ color: "#666", fontSize: 11 }}>
                            Bal: {formatCurrency(transaction.balance)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
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
                Filter Statement
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={{ color: "#fff", fontSize: 16, marginBottom: 12 }}>
                Date Range
              </Text>

              <TouchableOpacity
                onPress={() => {
                  // Quick filters
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  setDateRange({ startDate: weekAgo, endDate: today });
                }}
                style={{
                  backgroundColor: "#222",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#fff" }}>Last 7 Days</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(today.getMonth() - 1);
                  setDateRange({ startDate: monthAgo, endDate: today });
                }}
                style={{
                  backgroundColor: "#222",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#fff" }}>Last 30 Days</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const threeMonthsAgo = new Date(today);
                  threeMonthsAgo.setMonth(today.getMonth() - 3);
                  setDateRange({ startDate: threeMonthsAgo, endDate: today });
                }}
                style={{
                  backgroundColor: "#222",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#fff" }}>Last 3 Months</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const yearAgo = new Date(today);
                  yearAgo.setFullYear(today.getFullYear() - 1);
                  setDateRange({ startDate: yearAgo, endDate: today });
                }}
                style={{
                  backgroundColor: "#222",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#fff" }}>Last Year</Text>
              </TouchableOpacity>

              <Text style={{ color: "#fff", fontSize: 16, marginBottom: 12 }}>
                Transaction Type
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {filters.map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: filter === f ? "#fff" : "#222",
                    }}
                  >
                    <Text
                      style={{
                        color: filter === f ? "#000" : "#fff",
                        fontSize: 12,
                      }}
                    >
                      {f.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <Text style={{ color: "#000", fontWeight: "600" }}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Details Modal */}
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
            {selectedTransaction && (
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
                    Transaction Details
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
                        backgroundColor: `${getTypeColor(selectedTransaction.type)}20`,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={getTypeIcon(selectedTransaction.type)}
                        size={30}
                        color={getTypeColor(selectedTransaction.type)}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 32,
                        fontWeight: "bold",
                        color:
                          selectedTransaction.amount > 0
                            ? "#4CAF50"
                            : "#F44336",
                        marginTop: 12,
                      }}
                    >
                      {selectedTransaction.amount > 0 ? "+" : ""}
                      {formatCurrency(selectedTransaction.amount)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${getStatusColor(selectedTransaction.status)}20`,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginTop: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: getStatusColor(selectedTransaction.status),
                        }}
                      >
                        {selectedTransaction.status}
                      </Text>
                    </View>
                  </View>

                  <DetailRow
                    label="Description"
                    value={selectedTransaction.description}
                  />
                  <DetailRow label="Type" value={selectedTransaction.type} />
                  <DetailRow
                    label="Reference"
                    value={selectedTransaction.reference}
                  />
                  <DetailRow
                    label="Date & Time"
                    value={formatDate(selectedTransaction.date)}
                  />
                  <DetailRow
                    label="Balance After"
                    value={formatCurrency(selectedTransaction.balance)}
                  />
                  {selectedTransaction.category && (
                    <DetailRow
                      label="Category"
                      value={selectedTransaction.category}
                    />
                  )}
                  {selectedTransaction.notes && (
                    <DetailRow
                      label="Notes"
                      value={selectedTransaction.notes}
                    />
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#222",
                    borderRadius: 8,
                    padding: 16,
                    alignItems: "center",
                    marginTop: 20,
                  }}
                >
                  <Text style={{ color: "#fff" }}>Download Receipt</Text>
                </TouchableOpacity>
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
    <Text style={{ color: "#fff", fontSize: 14 }}>{value}</Text>
  </View>
);

export default Statement;
