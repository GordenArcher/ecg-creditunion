import { motion, AnimatePresence } from "framer-motion";
import { Loader, LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/useUserStore";
import { useNavigate } from "react-router-dom";

interface Props {
  showLogoutModal: boolean;
  setShowLogoutModal: React.Dispatch<React.SetStateAction<boolean>>;
}
const LogoutModal = ({ showLogoutModal, setShowLogoutModal }: Props) => {
  const { logingOut, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  return (
    <AnimatePresence>
      {showLogoutModal && (
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
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/20 rounded-full mb-4">
              <LogOut className="h-6 w-6 text-red-400" />
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-2">
              Sign Out
            </h3>

            <p className="text-white/60 text-center mb-6">
              Are you sure you want to sign out of your account?
            </p>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                disabled={logingOut}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logingOut ? (
                  <Loader className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Sign Out"
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;
