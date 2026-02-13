import React, { useState } from "react";
import { Mail, Lock, Loader } from "lucide-react";
import { motion } from "framer-motion";
import login_user from "../../api/api";
import AnimatePage from "../../components/AnimatePage";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useUserStore";

interface LoginResponse {
  status: string;
  message: string;
  http_status: number;
  data: {
    is_authenticated: boolean;
  };
  meta: {
    login_timestamp: string;
    next_steps: string[];
  };
  code: string;
  request_id: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [nextSteps, setNextSteps] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setNextSteps([]);

    try {
      const response = await login_user(formData.email, formData.password);

      if (response) {
        setSuccess(response.data.message);
        setNextSteps(response.data.meta.next_steps || []);

        setTimeout(() => {
          setIsAuthenticated(response.data?.is_authenticated || true);
          navigate("/");
        }, 3000);
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("An error occurred during login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <AnimatePage currentScreen="login">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full space-y-8 bg-black p-10 rounded-lg border border-white/20 shadow-2xl"
      >
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-white/70">Sign in to access the admin dashboard</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-red-500/40 border-red-500 p-4 rounded-md"
          >
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-white font-medium">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-green-950/50 border-green-500 p-4 rounded-md"
          >
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-white font-medium">{success}</p>
              </div>
            </div>
          </motion.div>
        )}

        {nextSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-blue-950/50 border-blue-500 p-4 rounded-md"
          >
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-white mb-1">Next Steps:</p>
                <ul className="text-sm text-white/90 list-disc list-inside">
                  {nextSteps.map((step, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-white"
                    >
                      {step}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        <motion.form variants={itemVariants} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/50" />
                </div>
                <motion.input
                  transition={{ type: "spring", stiffness: 300 }}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2 bg-black border border-white/30 rounded-lg shadow-sm placeholder-white/40 outline-none focus:ring-white/50 focus:border-white/50 sm:text-sm text-white"
                  placeholder="admin@ecg.com.gh"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/50" />
                </div>
                <motion.input
                  transition={{ type: "spring", stiffness: 300 }}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2 bg-black border border-white/30 rounded-lg shadow-sm placeholder-white/40 outline-none focus:ring-white/50 focus:border-white/50 sm:text-sm text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <div className="text-sm">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/auth/forgot-password"
                className="font-medium text-white/80 hover:text-white transition-colors"
              >
                Forgot your password?
              </motion.a>
            </div>
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-white rounded-lg shadow-sm text-sm font-medium text-black bg-white hover:bg-white/90 outline-none  focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2 text-black" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </motion.button>

          <motion.div
            variants={itemVariants}
            className="mt-4 p-4  rounded-lg border border-white/20"
          >
            <p className="text-xs font-bold text-white mb-2">
              Demo Credentials:
            </p>
            <div className="text-xs text-white/80 space-y-1">
              <p>Email: admin@ecg.com.gh</p>
              <p>Password: Admin@ECG2026</p>
            </div>
          </motion.div>
        </motion.form>
      </motion.div>
    </AnimatePage>
  );
};

export default LoginPage;
