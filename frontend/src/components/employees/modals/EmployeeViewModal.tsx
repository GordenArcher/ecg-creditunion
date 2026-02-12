import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Users,
  Heart,
  User,
  Shield,
  Clock,
  Building2,
  Hash,
  IdCard,
  UserCircle,
  Fingerprint,
  Award,
  Globe,
  Flag,
  Trash2,
  Power,
  Edit2,
} from "lucide-react";
import type { Employee } from "../../../types/employee";
import { formatDate } from "../../../utils/helper/formatSmartDate";

interface EmployeeViewModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDiscontinue: () => void;
  onDelete: () => void;
}

const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEdit,
  onDiscontinue,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "ADMIN":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-green-500/20 text-green-300 border-green-500/30";
    }
  };

  const getStatusBadgeColor = (discontinued: boolean, isActive: boolean) => {
    if (discontinued) return "bg-red-500/20 text-red-300 border-red-500/30";
    if (!isActive)
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    return "bg-green-500/20 text-green-300 border-green-500/30";
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "♂";
      case "FEMALE":
        return "♀";
      default:
        return "⚧";
    }
  };

  const getMaritalStatusColor = (status: string) => {
    switch (status) {
      case "MARRIED":
        return "bg-pink-500/20 text-pink-300";
      case "SINGLE":
        return "bg-blue-500/20 text-blue-300";
      case "DIVORCED":
        return "bg-orange-500/20 text-orange-300";
      case "WIDOWED":
        return "bg-gray-500/20 text-gray-300";
      case "SEPARATED":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-black border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-black border-b border-white/10">
            <div className="flex items-start justify-between p-6">
              <div className="flex items-center space-x-4">
                <motion.div className="relative pb-5">
                  <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-black-500/20 to-white-500/20 border border-white/20 flex items-center justify-center">
                    {employee.avatar ? (
                      <img
                        src={employee.avatar}
                        alt={employee.full_name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {getInitials(employee.full_name)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(
                        employee.discontinued,
                        employee.is_active,
                      )}`}
                    >
                      {employee.discontinued
                        ? "Discontinued"
                        : employee.is_active
                          ? "Active"
                          : "Inactive"}
                    </span>
                  </div>
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    {employee.full_name}
                    <span
                      className={`ml-3 px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(employee.role)}`}
                    >
                      {employee.role}
                    </span>
                  </h2>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center text-white/60">
                      <IdCard className="h-4 w-4 mr-1" />
                      <span className="text-sm">{employee.staff_id}</span>
                    </div>
                    <div className="flex items-center text-white/60">
                      <Fingerprint className="h-4 w-4 mr-1" />
                      <span className="text-sm font-mono">
                        {employee.employee_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center mt-1 text-white/40 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Added {formatDate(employee.date_joined)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onEdit}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Edit Employee"
                >
                  <Edit2 className="h-5 w-5 text-white" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <User className="h-4 w-4 text-white/40" />
                  <span className="text-xs text-white/40">Gender</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {employee.gender} {getGenderIcon(employee.gender)}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-4 w-4 text-white/40" />
                  <span className="text-xs text-white/40">Age</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {employee.date_of_birth
                    ? `${new Date().getFullYear() - new Date(employee.date_of_birth).getFullYear()} years`
                    : "—"}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="h-4 w-4 text-white/40" />
                  <span className="text-xs text-white/40">Marital Status</span>
                </div>
                <div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getMaritalStatusColor(employee.marital_status)}`}
                  >
                    {employee.marital_status}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-4 w-4 text-white/40" />
                  <span className="text-xs text-white/40">Dependents</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {employee.number_of_dependents}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-white/60" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Mail className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Email</div>
                        <div className="text-sm text-white">
                          {employee.email || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Phone</div>
                        <div className="text-sm text-white">
                          {employee.phone_number || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-white/60" />
                    Employment Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Award className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Job Title</div>
                        <div className="text-sm text-white">
                          {employee.title || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Shield className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Directorate</div>
                        <div className="text-sm text-white">
                          {employee.directorate || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">
                          Date Registered
                        </div>
                        <div className="text-sm text-white">
                          {formatDate(employee.date_registered)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-white/60" />
                    Location & Division
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Building2 className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Station</div>
                        {employee.station ? (
                          <>
                            <div className="text-sm text-white font-medium">
                              {employee.station.name}
                            </div>
                            <div className="text-xs text-white/40">
                              Code: {employee.station.code}
                            </div>
                            {employee.station.location && (
                              <div className="text-xs text-white/40 mt-1">
                                {employee.station.location}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-white/60">—</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Globe className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Division</div>
                        {employee.division ? (
                          <>
                            <div className="text-sm text-white font-medium">
                              {employee.division.name}
                            </div>
                            <div className="text-xs text-white/40">
                              {employee.division.directorate}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-white/60">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="text-sm font-medium text-white/80 mb-4 flex items-center">
                    <UserCircle className="h-4 w-4 mr-2 text-white/60" />
                    Account Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Last Login</div>
                        <div className="text-sm text-white">
                          {formatDate(employee.last_login)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Flag className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">
                          Discontinued Date
                        </div>
                        <div className="text-sm text-white">
                          {employee.discontinued_date
                            ? formatDate(employee.discontinued_date)
                            : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Hash className="h-4 w-4 text-white/40 mt-0.5 mr-3" />
                      <div>
                        <div className="text-xs text-white/40">Employee ID</div>
                        <div className="font-mono text-white/80 text-xs">
                          {employee.employee_id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white/5 rounded-lg p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-white/40 mr-2" />
                  <span className="text-sm text-white/80">Date of Birth</span>
                </div>
                <span className="text-sm text-white">
                  {employee.date_of_birth
                    ? formatDate(employee.date_of_birth)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 p-6 bg-black/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onDiscontinue}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    employee.discontinued
                      ? "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                      : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30"
                  }`}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {employee.discontinued
                    ? "Activate Account"
                    : "Discontinue Account"}
                </motion.button>

                {!showDeleteConfirm ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Employee
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <span className="text-sm text-white/60">Are you sure?</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onDelete}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      Yes, Delete
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </motion.div>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Close
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmployeeViewModal;
