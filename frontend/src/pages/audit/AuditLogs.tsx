import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  User,
  Calendar,
  Globe,
  Loader2,
  X,
} from "lucide-react";
import axiosClient from "../../utils/axios";
import { useNavigate } from "react-router-dom";

interface Actor {
  employee_id: string;
  email: string;
  full_name: string;
  staff_id: string;
  role: string;
}

interface AuditLog {
  id: string;
  actor: Actor | null;
  action: string;
  target_type: string;
  target_id: string;
  status: string;
  actor_role: string;
  ip_address: string;
  device_info: string;
  metadata: Record<string, any>;
  before_state: any | null;
  after_state: any | null;
  timestamp: string;
  timestamp_formatted: string;
}

interface Pagination {
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next_page_number: number | null;
  previous_page_number: number | null;
}

interface AuditLogsResponse {
  status: string;
  message: string;
  http_status: number;
  data: {
    items: AuditLog[];
    pagination: Pagination;
    filters: {
      available_actions: string[];
      available_severities: string[];
      available_target_types: string[];
    };
  };
  code: string;
  request_id: string;
}

interface AuditQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  actor_id?: string;
  action?: string;
  severity?: string;
  target_type?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
}

const AuditLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [availableFilters, setAvailableFilters] = useState<{
    actions: string[];
    severities: string[];
    targetTypes: string[];
  }>({
    actions: [],
    severities: [],
    targetTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<AuditQueryParams>({
    page: 1,
    page_size: 20,
    ordering: "-timestamp",
    search: "",
  });

  const [searchInput, setSearchInput] = useState("");

  const fetchAuditLogs = async (params: AuditQueryParams) => {
    setLoading(true);
    setError("");

    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([_, v]) => v !== undefined && v !== "" && v !== null,
        ),
      );

      const response = await axiosClient.get<AuditLogsResponse>(
        "/audit/logs/",
        {
          params: cleanParams,
        },
      );

      if (response.data.status === "success") {
        setLogs(response.data.data.items);
        setPagination(response.data.data.pagination);

        const uniqueActions = [
          ...new Set(response.data.data.filters.available_actions),
        ];
        const uniqueSeverities = [
          ...new Set(response.data.data.filters.available_severities),
        ];
        const uniqueTargetTypes = [
          ...new Set(response.data.data.filters.available_target_types),
        ];

        setAvailableFilters({
          actions: uniqueActions.filter((a) => a),
          severities: uniqueSeverities.filter((s) => s),
          targetTypes: uniqueTargetTypes.filter((t) => t),
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch audit logs");
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(filters);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters((prev) => ({
          ...prev,
          search: searchInput || undefined,
          page: 1,
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchAuditLogs(filters);
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (size: number) => {
    setFilters((prev) => ({ ...prev, page_size: size, page: 1 }));
  };

  const applyFilter = (key: keyof AuditQueryParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      page_size: 20,
      ordering: "-timestamp",
      search: undefined,
    });
    setSearchInput("");
  };

  const handleRefresh = () => {
    fetchAuditLogs(filters);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "LOW":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "SUCCESS"
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const formatAction = (action: string) => {
    return action
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActorDisplay = (log: AuditLog) => {
    if (log.actor) {
      return log.actor.full_name || log.actor.email || "System";
    }
    return "System";
  };

  const getActorEmail = (log: AuditLog) => {
    return log.actor?.email || "";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <History className="h-6 w-6 mr-2 text-white/80" />
              Audit Logs
            </h1>
            <p className="text-white/60 mt-1">
              {pagination
                ? `Showing ${logs.length} of ${pagination.total_items} events`
                : "Track all system activities"}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`h-5 w-5 text-white ${loading ? "animate-spin" : ""}`}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by actor, action, target, or metadata..."
              className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/20 rounded-lg placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-white"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown
                    className={`h-4 w-4 ml-2 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                {(filters.action || filters.severity || filters.date_from) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={resetFilters}
                    className="flex items-center px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-white/60"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear Filters
                  </motion.button>
                )}
              </div>

              <select
                value={filters.page_size}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-black border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10"
                >
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Action Type
                    </label>
                    <select
                      value={filters.action || ""}
                      onChange={(e) => applyFilter("action", e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <option value="">All Actions</option>
                      {availableFilters.actions.map((action) => (
                        <option key={action} value={action}>
                          {formatAction(action)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Severity
                    </label>
                    <select
                      value={filters.severity || ""}
                      onChange={(e) => applyFilter("severity", e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <option value="">All Severities</option>
                      {availableFilters.severities.map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={filters.date_from || ""}
                      onChange={(e) => applyFilter("date_from", e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={filters.date_to || ""}
                      onChange={(e) => applyFilter("date_to", e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mb-6"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    IP Address
                  </th>
                  {/*<th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Actions
                  </th>*/}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-white/60" />
                      <p className="mt-2 text-white/40">
                        Loading audit logs...
                      </p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <History className="h-12 w-12 mx-auto text-white/20 mb-3" />
                      <p className="text-white/60">No audit logs found</p>
                      <button
                        onClick={resetFilters}
                        className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white text-sm"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => navigate(`/cu/reports/audits/${log.id}`)}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-white/40 mr-1" />
                          <span className="text-sm text-white/80">
                            {log.timestamp_formatted}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-linear-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-white/60" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {getActorDisplay(log)}
                            </div>
                            <div className="text-xs text-white/40">
                              {getActorEmail(log) || log.actor_role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {formatAction(log.action)}
                        </div>
                        {log.target_id && (
                          <div className="text-xs text-white/40 mt-1">
                            ID: {log.target_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white/80">
                          {log.target_type || "System"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                            log.severity || "LOW",
                          )}`}
                        >
                          {log.severity || "LOW"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            log.status,
                          )}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-white/60">
                          <Globe className="h-3 w-3 mr-1" />
                          {log.ip_address || "—"}
                        </div>
                      </td>
                      {/*<td className="px-6 py-4 whitespace-nowrap">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewDetails(log)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-white/60" />
                        </motion.button>
                      </td>*/}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 && !loading && (
            <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/60">
                Showing{" "}
                {(pagination.current_page - 1) * pagination.page_size + 1} to{" "}
                {Math.min(
                  pagination.current_page * pagination.page_size,
                  pagination.total_items,
                )}{" "}
                of {pagination.total_items} events
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={!pagination.has_previous}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </motion.button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, pagination.total_pages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.total_pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (
                        pagination.current_page >=
                        pagination.total_pages - 2
                      ) {
                        pageNum = pagination.total_pages - 4 + i;
                      } else {
                        pageNum = pagination.current_page - 2 + i;
                      }

                      return (
                        <motion.button
                          key={pageNum}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                            pagination.current_page === pageNum
                              ? "bg-white text-black font-medium"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    },
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={!pagination.has_next}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuditLogs;
