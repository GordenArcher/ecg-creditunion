import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Eye, Loader, X, Lock, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { PasswordForm } from "../../types/types";
import { ChangeUserPassword } from "../../api/api";
import { toast } from "sonner";

interface PasswordErrors {
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

interface Props {
  showPasswordModal: boolean;
  setShowPasswordModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChangePasswordModal = ({
  setShowPasswordModal,
  showPasswordModal,
}: Props) => {
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const validatePasswordForm = () => {
    const errors: PasswordErrors = {};

    if (!passwordForm.current_password) {
      errors.current_password = "Current password is required";
    }

    if (!passwordForm.new_password) {
      errors.new_password = "New password is required";
    } else if (passwordForm.new_password.length < 8) {
      errors.new_password = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.new_password)
    ) {
      errors.new_password =
        "Password must contain uppercase, lowercase and numbers";
    }

    if (!passwordForm.confirm_password) {
      errors.confirm_password = "Please confirm your password";
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const maskPassword = (password: string) => {
    if (password.length <= 4) {
      return "*".repeat(password.length);
    }
    const visibleChars = Math.ceil(password.length / 4);
    return (
      password.substring(0, visibleChars) +
      "*".repeat(password.length - visibleChars * 2) +
      password.substring(password.length - visibleChars)
    );
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error("Failed to copy password");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) return;

    setIsChanging(true);

    try {
      const response = await ChangeUserPassword(passwordForm);

      if (response) {
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      const errorData = error?.response?.data;

      toast.error(
        errorData.message || "An Error Occured while changing password",
      );
    } finally {
      setIsChanging(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setShowPasswordModal(false);
    setPasswordForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  };

  return (
    <AnimatePresence>
      {showPasswordModal && !showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-black border border-white/10 rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        current_password: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-10 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Eye className="h-4 w-4 text-white/40" />
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <p className="mt-1 text-xs text-red-400">
                    {passwordErrors.current_password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        new_password: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-10 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Eye className="h-4 w-4 text-white/40" />
                  </button>
                </div>
                {passwordErrors.new_password && (
                  <p className="mt-1 text-xs text-red-400">
                    {passwordErrors.new_password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirm_password: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-10 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Eye className="h-4 w-4 text-white/40" />
                  </button>
                </div>
                {passwordErrors.confirm_password && (
                  <p className="mt-1 text-xs text-red-400">
                    {passwordErrors.confirm_password}
                  </p>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-xs font-medium text-white mb-2">
                  Password Requirements:
                </p>
                <ul className="space-y-1 text-xs text-white/60">
                  <li className="flex items-center">
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${
                        passwordForm.new_password.length >= 8
                          ? "text-green-400"
                          : "text-white/20"
                      }`}
                    />
                    At least 8 characters
                  </li>
                  <li className="flex items-center">
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${
                        /[A-Z]/.test(passwordForm.new_password)
                          ? "text-green-400"
                          : "text-white/20"
                      }`}
                    />
                    At least one uppercase letter
                  </li>
                  <li className="flex items-center">
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${
                        /[a-z]/.test(passwordForm.new_password)
                          ? "text-green-400"
                          : "text-white/20"
                      }`}
                    />
                    At least one lowercase letter
                  </li>
                  <li className="flex items-center">
                    <CheckCircle
                      className={`h-3 w-3 mr-2 ${
                        /\d/.test(passwordForm.new_password)
                          ? "text-green-400"
                          : "text-white/20"
                      }`}
                    />
                    At least one number
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePasswordSubmit}
                disabled={isChanging}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isChanging ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  "Change Password"
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-black border border-white/10 rounded-lg p-8 max-w-md w-full"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: 0.2,
                }}
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 0.6,
                      delay: 0.6,
                      ease: "easeInOut",
                    }}
                  >
                    <CheckCircle className="h-16 w-16 text-green-400" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-400"
                    animate={{ scale: [1, 1.5] }}
                    transition={{
                      duration: 0.8,
                      delay: 0.2,
                    }}
                    style={{ opacity: 0.2 }}
                  />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Password Changed!
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Your password has been successfully updated. You'll stay logged
                in for now, but you'll need to use your new password the next
                time you log in.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6"
            >
              <p className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wide">
                Your New Password
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-black/40 rounded p-3">
                  <code className="text-sm font-mono text-white/80">
                    {maskPassword(passwordForm.new_password)}
                  </code>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      copyToClipboard(passwordForm.new_password, 0)
                    }
                    className="ml-3 p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedIndex === 0 ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="h-4 w-4 text-green-400" />
                      </motion.div>
                    ) : (
                      <Copy className="h-4 w-4 text-white/60" />
                    )}
                  </motion.button>
                </div>
                <p className="text-xs text-white/50">
                  Password is masked for security. Click copy to save it.
                </p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCloseSuccess}
              className="w-full px-4 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
            >
              Got It
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
