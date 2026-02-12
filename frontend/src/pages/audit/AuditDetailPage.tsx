import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Mail,
  IdCard,
  Shield,
  Fingerprint,
  Hash,
  Activity,
  FileText,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchAuditLogDetail } from "../../api/api";
import { formatDate } from "../../utils/helper/formatSmartDate";

// Types based on actual API response
interface Actor {
  employee_id: string;
  email: string;
  full_name: string;
  staff_id: string;
  role: string;
}

interface AuditLogDetail {
  id: string;
  actor: Actor | null;
  action: string;
  target_type: string;
  severity: string;
  target_id: string;
  status: string;
  actor_role: string;
  ip_address: string;
  device_info: string;
  metadata: Record<string, any>;
  before_state: Record<string, any> | null;
  after_state: Record<string, any> | null;
  timestamp: string;
  timestamp_formatted: string;
}

interface AuditDetailResponse {
  status: string;
  message: string;
  http_status: number;
  data: AuditLogDetail;
  meta: {
    log_id: string;
    cache_key: string;
  };
  code: string;
  request_id: string;
}

const AuditDetailPage: React.FC = () => {
  const { audit_id } = useParams<{ audit_id: string }>();
  const navigate = useNavigate();

  const [log, setLog] = useState<AuditLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "changes" | "raw">(
    "details",
  );

  useEffect(() => {
    if (audit_id) {
      fetchDetail(audit_id);
    }
  }, [audit_id]);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchAuditLogDetail(id);

      if (response.data) {
        setLog(response.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch audit log details",
      );
      console.error("Error fetching audit detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (log?.id) {
      navigator.clipboard.writeText(log.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAction = (action: string) => {
    return action
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
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

  const getActorDisplay = () => {
    if (!log?.actor) return "System";
    return log.actor.full_name || log.actor.email || "System";
  };

  const getActorEmail = () => {
    return log?.actor?.email || "";
  };

  const getActorStaffId = () => {
    return log?.actor?.staff_id || "";
  };

  const getActorRole = () => {
    return log?.actor?.role || log?.actor_role || "";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getChangeIcon = (key: string) => {
    if (key.includes("discontinued")) return <Activity className="h-4 w-4" />;
    if (key.includes("role")) return <Shield className="h-4 w-4" />;
    if (key.includes("email")) return <Mail className="h-4 w-4" />;
    if (key.includes("staff")) return <IdCard className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading audit log details...</p>
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load</h2>
          <p className="text-white/60 mb-6">{error || "Audit log not found"}</p>
          <button
            onClick={() => navigate("/cu/reports/audits/logs")}
            className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audit Logs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/cu/reports/audits/logs")}
            className="flex cursor-pointer items-center text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Audit Logs
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Audit Log Details
                </h1>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(log.severity)}`}
                >
                  {log.severity}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(log.status)}`}
                >
                  {log.status}
                </span>
              </div>
              <p className="text-white/60 flex items-center flex-wrap gap-2">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(log.timestamp)}
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDate(log.timestamp)}
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center">
                  <Hash className="h-4 w-4 mr-1" />
                  <span className="font-mono text-xs">
                    {log.id.slice(0, 8)}...{log.id.slice(-4)}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy ID"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-white/40" />
                    )}
                  </button>
                </span>
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Actor
              </h2>

              {log.actor ? (
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {log.actor.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-white truncate">
                      {log.actor.full_name}
                    </p>
                    <div className="flex items-center mt-1 text-white/60">
                      <Mail className="h-3 w-3 mr-1 shrink-0" />
                      <span className="text-sm truncate">
                        {log.actor.email}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 text-white/60">
                      <IdCard className="h-3 w-3 mr-1 shrink-0" />
                      <span className="text-sm font-mono">
                        {log.actor.staff_id}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          log.actor.role === "SUPER_ADMIN"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : log.actor.role === "ADMIN"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                        }`}
                      >
                        {log.actor.role}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-white/40" />
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-semibold text-white">System</p>
                    <p className="text-sm text-white/60">Automated Action</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Action
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Action Type</p>
                  <p className="text-white font-medium text-lg">
                    {formatAction(log.action)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/40 mb-1">Target Type</p>
                  <p className="text-white">{log.target_type}</p>
                </div>

                {log.target_id && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">Target ID</p>
                    <div className="flex items-center">
                      <span className="text-white font-mono text-sm bg-white/5 px-2 py-1 rounded border border-white/10">
                        {log.target_id}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Request Info
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">IP Address</span>
                  <span className="text-sm text-white font-mono">
                    {log.ip_address || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Device Info</span>
                  <span className="text-sm text-white/80">
                    {log.device_info || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Actor Role</span>
                  <span className="text-sm text-white">{log.actor_role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Cache Key</span>
                  <span className="text-xs text-white/40 font-mono truncate ml-2">
                    {log.id}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "details"
                      ? "bg-white/10 text-white border-b-2 border-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Details
                </button>
                {(log.before_state || log.after_state) && (
                  <button
                    onClick={() => setActiveTab("changes")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === "changes"
                        ? "bg-white/10 text-white border-b-2 border-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Changes
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "raw"
                      ? "bg-white/10 text-white border-b-2 border-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Raw Data
                </button>
              </div>

              <div className="p-6">
                {activeTab === "details" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-white mb-3">
                          Metadata
                        </h3>
                        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                          <div className="divide-y divide-white/10">
                            {Object.entries(log.metadata).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="grid grid-cols-3 gap-2 p-3 hover:bg-white/5"
                                >
                                  <span className="text-xs text-white/60 font-medium">
                                    {key
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                    :
                                  </span>
                                  <span className="text-xs text-white col-span-2">
                                    {typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-white mb-3">
                        Timestamps
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <p className="text-xs text-white/40 mb-1">
                            Event Time
                          </p>
                          <p className="text-sm text-white">
                            {log.timestamp_formatted}
                          </p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <p className="text-xs text-white/40 mb-1">
                            ISO Format
                          </p>
                          <p className="text-xs text-white/80 font-mono">
                            {log.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "changes" &&
                  (log.before_state || log.after_state) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center mb-3">
                            <div className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                            <h3 className="text-sm font-medium text-white">
                              Before
                            </h3>
                          </div>
                          <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
                            {log.before_state ? (
                              <div className="space-y-3">
                                {Object.entries(log.before_state).map(
                                  ([key, value]) => (
                                    <div key={key}>
                                      <p className="text-xs text-white/40 mb-1">
                                        {key
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase(),
                                          )}
                                      </p>
                                      <div className="flex items-center">
                                        {getChangeIcon(key)}
                                        <p className="text-sm text-white ml-2">
                                          {value === null ? "—" : String(value)}
                                        </p>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-white/60 text-center py-2">
                                No previous state
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center mb-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                            <h3 className="text-sm font-medium text-white">
                              After
                            </h3>
                          </div>
                          <div className="bg-green-500/5 border border-green-500/30 rounded-lg p-4">
                            {log.after_state ? (
                              <div className="space-y-3">
                                {Object.entries(log.after_state).map(
                                  ([key, value]) => (
                                    <div key={key}>
                                      <p className="text-xs text-white/40 mb-1">
                                        {key
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase(),
                                          )}
                                      </p>
                                      <div className="flex items-center">
                                        {getChangeIcon(key)}
                                        <p className="text-sm text-white ml-2">
                                          {value === null ? "—" : String(value)}
                                        </p>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-white/60 text-center py-2">
                                No new state
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {log.before_state && log.after_state && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <div className="flex items-start">
                            <Info className="h-5 w-5 text-blue-400 mr-3 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-400 mb-1">
                                Changes Summary
                              </p>
                              <ul className="text-sm text-blue-300/80 space-y-1">
                                {Object.keys(log.after_state).map((key) => {
                                  const before = log.before_state?.[key];
                                  const after = log.after_state?.[key];
                                  if (before !== after) {
                                    return (
                                      <li
                                        key={key}
                                        className="flex items-start"
                                      >
                                        <span className="font-medium mr-2">
                                          {key}:
                                        </span>
                                        <span className="text-white/60 line-through mr-2">
                                          {String(before)}
                                        </span>
                                        <span className="text-white">→</span>
                                        <span className="text-white ml-2">
                                          {String(after)}
                                        </span>
                                      </li>
                                    );
                                  }
                                  return null;
                                })}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                {activeTab === "raw" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
                      <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-xs font-medium text-white/60">
                          Raw JSON
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(log, null, 2),
                            );
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-white/60" />
                          )}
                        </button>
                      </div>
                      <pre className="p-4 text-xs text-white/80 font-mono overflow-x-auto max-h-96">
                        {JSON.stringify(log, null, 2)}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() =>
                  navigate(
                    `/cu/reports/audits/logs?actor_id=${log.actor?.employee_id}`,
                  )
                }
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white text-sm"
              >
                View All by This Actor
              </button>
              <button
                onClick={() =>
                  navigate(`/cu/reports/audits/logs?target_id=${log.target_id}`)
                }
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white text-sm"
              >
                View Related Events
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuditDetailPage;
