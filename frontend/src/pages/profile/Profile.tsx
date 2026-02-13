import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Briefcase,
  MapPin,
  Phone,
  Calendar,
  Users,
  AlertCircle,
  Check,
  Loader,
  Camera,
  LogOut,
  Shield,
  Smartphone,
  Mail as MailIcon,
  Key,
  Save,
  X,
  Edit2,
  Building2,
  Layers,
  IdCard,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useUserStore";
import moment from "moment";
import CustomSelect from "../../components/CustomSelect";
import { formatDate } from "../../utils/helper/formatSmartDate";
import LogoutModal from "../../components/modals/LogoutModal";
import ChangePasswordModal from "../../components/modals/ChangePasswordModal";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    loadinguser,
    profileUpdateError,
    updatingProfile,
    success,
    fetchUserProfile,
    updateUserProfile,
    updateOTPSettings,
    uploadProfilePicture,
    clearMessages,
  } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "otp">(
    "profile",
  );

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    title: "",
    gender: "",
    date_of_birth: "",
    marital_status: "",
    number_of_dependents: 0,
  });

  const [otpEmailEnabled, setOtpEmailEnabled] = useState(false);
  const [otpSmsEnabled, setOtpSmsEnabled] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        title: user.title || "",
        gender: user.gender || "OTHER",
        date_of_birth: user.date_of_birth || "",
        marital_status: user.marital_status || "SINGLE",
        number_of_dependents: user.number_of_dependents || 0,
      });

      setOtpEmailEnabled(user.otp_email_enabled || false);
      setOtpSmsEnabled(user.otp_sms_enabled || false);
    }
  }, [user]);

  // Clear messages on unmount
  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, []);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: name === "number_of_dependents" ? parseInt(value) || 0 : value,
    }));
  };

  const handleProfileSubmit = async () => {
    await updateUserProfile(profileForm);
    setIsEditing(false);
  };

  const handleOTPSave = async () => {
    await updateOTPSettings(otpEmailEnabled, otpSmsEnabled);
  };

  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadProfilePicture(file);
    }
  };

  const getUserInitials = () => {
    if (!user?.full_name) return "U";
    return user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loadinguser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-white" />
          <p className="mt-4 text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-white/60 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {!isEditing && activeTab === "profile" && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </motion.button>
          </div>
        </motion.div>
        <AnimatePresence>
          {profileUpdateError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-950/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center"
            >
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 shrink-0" />
              <span className="text-white">{profileUpdateError}</span>
              <button
                onClick={() => clearMessages()}
                className="ml-auto text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-950/50 border border-green-500 rounded-lg p-4 mb-6 flex items-center"
            >
              <Check className="h-5 w-5 text-green-400 mr-3 shrink-0" />
              <span className="text-white">{success}</span>
              <button
                onClick={() => clearMessages()}
                className="ml-auto text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-br from-white/5 to-white/0 border border-white/10 rounded-lg p-6 mb-6"
        >
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 border-2 border-white/30 flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user?.avatar}
                    alt={user?.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {getUserInitials()}
                  </span>
                )}
              </div>
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 p-1.5 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {user?.full_name}
              </h2>
              <p className="text-white/60">{user?.title || "No title"}</p>

              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center text-sm text-white/60">
                  <IdCard className="h-4 w-4 mr-1 text-white/40" />
                  {user?.staff_id}
                </div>
                <div className="flex items-center text-sm text-white/60">
                  <Briefcase className="h-4 w-4 mr-1 text-white/40" />
                  {user?.role}
                </div>
                <div className="flex items-center">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user?.is_active
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {user?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="border-b border-white/10 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "profile"
                  ? "border-white text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "security"
                  ? "border-white text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab("otp")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "otp"
                  ? "border-white text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              Two-Factor Auth
            </button>
          </nav>
        </div>
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-white/60" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="full_name"
                        value={profileForm.full_name}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                      />
                    ) : (
                      <p className="text-white">{user?.full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-white/40" />
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                        />
                      ) : (
                        <p className="text-white">{user?.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-white/40" />
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone_number"
                          value={profileForm.phone_number}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                        />
                      ) : (
                        <p className="text-white">
                          {user?.phone_number || "—"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Title
                    </label>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-white/40" />
                      {isEditing ? (
                        <input
                          type="text"
                          name="title"
                          value={profileForm.title}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                        />
                      ) : (
                        <p className="text-white">{user?.title || "—"}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={profileForm.gender}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    ) : (
                      <p className="text-white">{user?.gender}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Date of Birth
                    </label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-white/40" />
                      {isEditing ? (
                        <input
                          type="date"
                          name="date_of_birth"
                          value={profileForm.date_of_birth}
                          onChange={handleProfileChange}
                          className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                        />
                      ) : (
                        <p className="text-white">
                          {user?.date_of_birth
                            ? moment(user?.date_of_birth).format("DDMMYY")
                            : "—"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Marital Status
                    </label>
                    {isEditing ? (
                      <CustomSelect
                        value={String(profileForm.marital_status)}
                        onChange={(val) => handleProfileChange(val)}
                        options={[
                          { value: "SINGLE", label: "Single" },
                          { value: "MARRIED", label: "Married" },
                          { value: "DIVORCED", label: "Divorced" },
                          { value: "WIDOWED", label: "Widowed" },
                        ]}
                      />
                    ) : (
                      <p className="text-white">{user?.marital_status}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Number of Dependents
                    </label>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-white/40" />
                      {isEditing ? (
                        <input
                          type="number"
                          name="number_of_dependents"
                          value={profileForm.number_of_dependents}
                          onChange={handleProfileChange}
                          min="0"
                          max="20"
                          className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                        />
                      ) : (
                        <p className="text-white">
                          {user?.number_of_dependents}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProfileSubmit}
                      disabled={updatingProfile}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {updatingProfile ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-white/60" />
                  Work Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Station
                    </label>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-white/40" />
                      <p className="text-white">
                        {user?.station_name || user?.station_code || "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Division
                    </label>
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 mr-2 text-white/40" />
                      <p className="text-white">
                        {user?.division_name || user?.division_code || "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Directorate
                    </label>
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-white/40" />
                      <p className="text-white">{user?.directorate || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Date Registered
                    </label>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-white/40" />
                      <p className="text-white">
                        {formatDate(user?.date_registered)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-white/60" />
                Security Settings
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-white/60" />
                    <div>
                      <p className="text-sm font-medium text-white">Password</p>
                      <p className="text-xs text-white/60">
                        Last changed:{" "}
                        {user?.updated_at
                          ? formatDate(user?.updated_at)
                          : "Never"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors text-sm"
                  >
                    Change Password
                  </motion.button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-white/60" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs text-white/60">
                        {otpEmailEnabled || otpSmsEnabled
                          ? "Enabled"
                          : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab("otp")}
                    className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors text-sm"
                  >
                    Configure
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Key className="h-5 w-5 mr-2 text-white/60" />
                Two-Factor Authentication
              </h3>

              <p className="text-sm text-white/60 mb-6">
                Choose how you want to receive verification codes. SMS is
                enabled by default.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-white/60" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        SMS Authentication
                      </p>
                      <p className="text-xs text-white/60">
                        Receive codes via SMS to{" "}
                        {user?.phone_number || "your phone"}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={otpSmsEnabled}
                      onChange={(e) => setOtpSmsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MailIcon className="h-5 w-5 text-white/60" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Email Authentication
                      </p>
                      <p className="text-xs text-white/60">
                        Receive codes via email to {user?.email}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={otpEmailEnabled}
                      onChange={(e) => setOtpEmailEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOTPSave}
                    disabled={updatingProfile}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {updatingProfile ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save OTP Settings
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LogoutModal
        setShowLogoutModal={setShowLogoutModal}
        showLogoutModal={showLogoutModal}
      />

      <ChangePasswordModal
        showPasswordModal={showPasswordModal}
        setShowPasswordModal={setShowPasswordModal}
      />
    </div>
  );
};

export default Profile;
