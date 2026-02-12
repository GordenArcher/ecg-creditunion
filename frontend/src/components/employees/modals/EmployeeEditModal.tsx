import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Key, ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import type { Employee } from "../../../types/employee";

interface EmployeeEditModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onEditUser: (data: any) => void;
  onChangePassword: (data: any) => void;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEditUser,
  onChangePassword,
}) => {
  const [view, setView] = useState<"main" | "edit" | "password">("main");
  const [showPassword, setShowPassword] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: employee.full_name,
    email: employee.email || "",
    phone_number: employee.phone_number,
    title: employee.title,
    station_id: employee.station?.id || "",
    division_id: employee.division?.id || "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  if (!isOpen) return null;

  const slideVariants = {
    enter: (direction: string) => ({
      x: direction === "left" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === "left" ? -300 : 300,
      opacity: 0,
    }),
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
          className="relative w-full max-w-2xl bg-black border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              {view !== "main" && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setView("main")}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </motion.button>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {view === "main" && "Edit Employee"}
                  {view === "edit" && "Edit User Details"}
                  {view === "password" && "Change Password"}
                </h2>
                <p className="text-sm text-white/60">
                  {employee.full_name} • {employee.staff_id}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </motion.button>
          </div>

          <div className="relative min-h-100 overflow-hidden">
            <AnimatePresence mode="wait" custom={view}>
              {view === "main" && (
                <motion.div
                  key="main"
                  custom="right"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="p-6 space-y-4"
                >
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: "rgba(255,255,255,0.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView("edit")}
                    className="w-full p-6 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Edit2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-medium text-white">
                        Edit User
                      </h3>
                      <p className="text-sm text-white/60">
                        Update personal information and details
                      </p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: "rgba(255,255,255,0.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView("password")}
                    className="w-full p-6 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Key className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-medium text-white">
                        Change Password
                      </h3>
                      <p className="text-sm text-white/60">
                        Update account password
                      </p>
                    </div>
                  </motion.button>
                </motion.div>
              )}

              {view === "edit" && (
                <motion.div
                  key="edit"
                  custom="left"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.full_name}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={editFormData.phone_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            phone_number: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView("main")}
                      className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onEditUser(editFormData)}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {view === "password" && (
                <motion.div
                  key="password"
                  custom="left"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            current_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-white/40" />
                        ) : (
                          <Eye className="h-4 w-4 text-white/40" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView("main")}
                      className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onChangePassword(passwordData)}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors flex items-center"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmployeeEditModal;
