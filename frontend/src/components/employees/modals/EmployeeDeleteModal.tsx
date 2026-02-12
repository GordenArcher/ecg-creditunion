import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  Trash2,
  User,
  IdCard,
  AlertCircle,
  Ban,
  Loader,
} from "lucide-react";
import type { Employee } from "../../../types/employee";
import axiosClient from "../../../utils/axios";
import { toast } from "sonner";

interface EmployeeDeleteModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  type?: "delete" | "discontinue";
  OnConfirm: (id?: string, value?: boolean) => void;
}

const EmployeeDeleteModal: React.FC<EmployeeDeleteModalProps> = ({
  employee,
  isOpen,
  onClose,
  type = "delete",
  OnConfirm,
}) => {
  if (!isOpen) return null;
  const [isLoading, setIsloading] = useState<boolean>(false);

  const isDelete = type === "delete";
  const isDiscontinue = type === "discontinue";

  const handleConfirmDelete = async () => {
    if (!employee) return;

    setIsloading(true);

    try {
      if (type === "delete") {
        const response = await axiosClient.delete(
          `/users/admin/users/${employee.employee_id}/delete/`,
        );

        if (response) {
          OnConfirm(employee?.employee_id, true);
        }
      } else if (type === "discontinue") {
        const response = await axiosClient.patch(
          `/users/admin/users/${employee.employee_id}/toggle-discontinue/`,
          {
            discontinued: !employee.discontinued,
          },
        );

        if (response) {
          OnConfirm(employee.employee_id, false);
          onClose();
        }
      }
    } catch (err: any) {
      const errorData = err.response.data;
      toast.error(errorData.message || "AN error occured");
      console.error("Error:", err);
    } finally {
      setIsloading(false);
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-black border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className={`p-3 rounded-xl ${
                  isDelete
                    ? "bg-red-500/20 text-red-400"
                    : isDiscontinue
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {isDelete ? (
                  <Trash2 className="h-6 w-6" />
                ) : isDiscontinue ? (
                  <Ban className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isDelete
                    ? "Delete Employee"
                    : isDiscontinue
                      ? employee.discontinued
                        ? "Activate Employee"
                        : "Discontinue Employee"
                      : "Confirm Action"}
                </h3>
                <p className="text-sm text-white/60">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {employee.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>

                <div className="flex-1">
                  <h4 className="text-white font-medium">
                    {employee.full_name}
                  </h4>
                  <div className="flex items-center mt-1 text-sm text-white/60">
                    <IdCard className="h-3 w-3 mr-1" />
                    {employee.staff_id}
                  </div>
                  {employee.email && (
                    <div className="text-xs text-white/40 mt-1">
                      {employee.email}
                    </div>
                  )}
                </div>

                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${
                    employee.role === "SUPER_ADMIN"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : employee.role === "ADMIN"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-green-500/20 text-green-300 border-green-500/30"
                  }`}
                >
                  {employee.role}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`mb-6 p-4 rounded-lg ${
                isDelete
                  ? "bg-red-950/30 border border-red-500/30"
                  : isDiscontinue
                    ? "bg-yellow-950/30 border border-yellow-500/30"
                    : "bg-orange-950/30 border border-orange-500/30"
              }`}
            >
              <div className="flex items-start space-x-3">
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    isDelete
                      ? "text-red-400"
                      : isDiscontinue
                        ? "text-yellow-400"
                        : "text-orange-400"
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isDelete
                        ? "text-red-200"
                        : isDiscontinue
                          ? "text-yellow-200"
                          : "text-orange-200"
                    }`}
                  >
                    {isDelete
                      ? "You are about to permanently delete this employee."
                      : isDiscontinue
                        ? employee.discontinued
                          ? "You are about to activate this employee account."
                          : "You are about to discontinue this employee account."
                        : "You are about to perform this action."}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isDelete
                        ? "text-red-300/70"
                        : isDiscontinue
                          ? "text-yellow-300/70"
                          : "text-orange-300/70"
                    }`}
                  >
                    {isDelete
                      ? "This will remove all associated data and cannot be reversed."
                      : isDiscontinue
                        ? employee.discontinued
                          ? "The employee will be able to access the system again."
                          : "The employee will lose access to the system until reactivated."
                        : "Please confirm this action."}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </motion.button>

              <motion.button
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                disabled={isLoading}
                onClick={() => handleConfirmDelete()}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  isDelete
                    ? "bg-red-500 hover:bg-red-600"
                    : isDiscontinue
                      ? employee.discontinued
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isDelete ? (
                  <span>Delete Permanently</span>
                ) : isDiscontinue ? (
                  employee.discontinued ? (
                    <span>Activate Account</span>
                  ) : (
                    <span>Discontinue Account</span>
                  )
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <span>Confirm</span>
                  </>
                )}
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white/60" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmployeeDeleteModal;
