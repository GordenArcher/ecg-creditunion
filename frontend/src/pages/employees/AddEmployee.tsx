import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Briefcase,
  MapPin,
  Phone,
  Calendar,
  Users,
  Heart,
  AlertCircle,
  Check,
  Loader,
  ChevronDown,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useUserStore";
import axiosClient from "../../utils/axios";

interface FormData {
  staff_id: string;
  full_name: string;
  email: string;
  title: string;
  station_id: number | string;
  division_id: number | string;
  gender: string;
  date_of_birth: string;
  phone_number: string;
  marital_status: string;
  number_of_dependents: number | string;
  directorate: string;
  date_registered: string;
  discontinued: boolean;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const {
    allStations,
    allDivisions,
    fetchAllStations,
    fetchAllDivisions,
    stationsLoading,
    divisionsLoading,
  } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    staff_id: "",
    full_name: "",
    email: "",
    title: "",
    station_id: "",
    division_id: "",
    gender: "OTHER",
    date_of_birth: "",
    phone_number: "",
    marital_status: "SINGLE",
    number_of_dependents: 0,
    directorate: "",
    date_registered: new Date().toISOString().split("T")[0],
    discontinued: false,
    role: "STAFF",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [stationSearch, setStationSearch] = useState("");
  const [divisionSearch, setDivisionSearch] = useState("");
  const [showStationDropdown, setShowStationDropdown] = useState(false);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);

  useEffect(() => {
    fetchAllStations();
    fetchAllDivisions();
  }, []);

  const filteredStations = allStations.filter(
    (station) =>
      station.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
      station.code.toLowerCase().includes(stationSearch.toLowerCase()),
  );

  const filteredDivisions = allDivisions.filter(
    (division) =>
      division.name.toLowerCase().includes(divisionSearch.toLowerCase()) ||
      division.code.toLowerCase().includes(divisionSearch.toLowerCase()) ||
      division.directorate.toLowerCase().includes(divisionSearch.toLowerCase()),
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof FormData]);
  };

  const validateField = (name: string, value: any) => {
    let error = "";

    switch (name) {
      case "staff_id":
        if (!value) error = "Staff ID is required";
        break;
      case "full_name":
        if (!value) error = "Full name is required";
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email format";
        }
        break;
      case "phone_number":
        if (value && !/^\+?[\d\s-]{10,}$/.test(value)) {
          error = "Invalid phone number";
        }
        break;
      case "date_of_birth":
        if (value) {
          const dob = new Date(value);
          const today = new Date();
          if (dob > today) error = "Date of birth cannot be in the future";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.staff_id) newErrors.staff_id = "Staff ID is required";
    if (!formData.full_name) newErrors.full_name = "Full name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const firstError = document.querySelector(".border-red-500");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitData = {
        ...formData,
        station_id: formData.station_id || null,
        division_id: formData.division_id || null,
        number_of_dependents: Number(formData.number_of_dependents) || 0,
        date_registered: formData.date_registered || new Date().toISOString(),
        password: `${formData.staff_id}@ECG2026`,
      };

      const response = await axiosClient.post(
        "/users/admin/users/create/",
        submitData,
      );

      if (response.data.status === "success") {
        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
          navigate("/cu/employees/list");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create employee");
      console.error("Error creating employee:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/cu/employees/list");
  };

  const getSelectedStationName = () => {
    const station = allStations.find((s) => s.id === formData.station_id);
    return station ? `${station.code} - ${station.name}` : "Select Station";
  };

  const getSelectedDivisionName = () => {
    const division = allDivisions.find((d) => d.id === formData.division_id);
    return division ? `${division.code} - ${division.name}` : "Select Division";
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            Add New Employee
          </h1>
          <p className="text-white/60">
            Create a new employee account in the system
          </p>
        </motion.div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-950/50 border border-green-500 rounded-lg p-4 mb-6 flex items-center"
          >
            <Check className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-white">
              Employee created successfully! Redirecting...
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-950/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center"
          >
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <span className="text-white">{error}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-white/60" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Staff ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="staff_id"
                  value={formData.staff_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 bg-black border ${
                    touched.staff_id && errors.staff_id
                      ? "border-red-500"
                      : "border-white/20 focus:border-white"
                  } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
                  placeholder="e.g., EMP001"
                />
                {touched.staff_id && errors.staff_id && (
                  <p className="mt-1 text-xs text-red-400">{errors.staff_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 bg-black border ${
                    touched.full_name && errors.full_name
                      ? "border-red-500"
                      : "border-white/20 focus:border-white"
                  } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
                  placeholder="John Doe"
                />
                {touched.full_name && errors.full_name && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-2 bg-black border ${
                      touched.email && errors.email
                        ? "border-red-500"
                        : "border-white/20 focus:border-white"
                    } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
                    placeholder="john.doe@ecg.com.gh"
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                    placeholder="Mr., Miss..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-white/60" />
              Station & Division
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Station
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStationDropdown(!showStationDropdown)}
                    className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        formData.station_id ? "text-white" : "text-white/40"
                      }
                    >
                      {getSelectedStationName()}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-white/60 transition-transform ${showStationDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showStationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-50 mt-1 w-full bg-black border border-white/20 rounded-lg shadow-xl"
                    >
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center">
                            <Search className="h-4 w-4 text-white/40" />
                          </div>
                          <input
                            type="text"
                            value={stationSearch}
                            onChange={(e) => setStationSearch(e.target.value)}
                            placeholder="Search stations..."
                            className="w-full pl-8 pr-2 py-1.5 bg-black/50 border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto">
                        {stationsLoading ? (
                          <div className="p-4 text-center">
                            <Loader className="h-5 w-5 animate-spin mx-auto text-white/60" />
                          </div>
                        ) : filteredStations.length === 0 ? (
                          <div className="p-4 text-center text-white/40">
                            No stations found
                          </div>
                        ) : (
                          filteredStations.map((station) => (
                            <button
                              key={station.id}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  station_id: station.id,
                                }));
                                setShowStationDropdown(false);
                                setStationSearch("");
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors"
                            >
                              <div className="text-sm text-white">
                                {station.name}
                              </div>
                              <div className="text-xs text-white/40">
                                {station.code}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Division
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setShowDivisionDropdown(!showDivisionDropdown)
                    }
                    className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        formData.division_id ? "text-white" : "text-white/40"
                      }
                    >
                      {getSelectedDivisionName()}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-white/60 transition-transform ${showDivisionDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showDivisionDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-50 mt-1 w-full bg-black border border-white/20 rounded-lg shadow-xl"
                    >
                      <div className="p-2 border-b border-white/10">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center">
                            <Search className="h-4 w-4 text-white/40" />
                          </div>
                          <input
                            type="text"
                            value={divisionSearch}
                            onChange={(e) => setDivisionSearch(e.target.value)}
                            placeholder="Search divisions..."
                            className="w-full pl-8 pr-2 py-1.5 bg-black/50 border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto">
                        {divisionsLoading ? (
                          <div className="p-4 text-center">
                            <Loader className="h-5 w-5 animate-spin mx-auto text-white/60" />
                          </div>
                        ) : filteredDivisions.length === 0 ? (
                          <div className="p-4 text-center text-white/40">
                            No divisions found
                          </div>
                        ) : (
                          filteredDivisions.map((division) => (
                            <button
                              key={division.id}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  division_id: division.id,
                                  directorate: division.directorate,
                                }));
                                setShowDivisionDropdown(false);
                                setDivisionSearch("");
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors"
                            >
                              <div className="text-sm text-white">
                                {division.name}
                              </div>
                              <div className="text-xs text-white/40">
                                {division.directorate}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Directorate
                </label>
                <input
                  type="text"
                  name="directorate"
                  value={formData.directorate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white/60"
                  placeholder="Auto-filled from division if not provided"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-white/60" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-2 bg-black border ${
                      touched.date_of_birth && errors.date_of_birth
                        ? "border-red-500"
                        : "border-white/20 focus:border-white"
                    } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20`}
                  />
                </div>
                {touched.date_of_birth && errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.date_of_birth}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-2 bg-black border ${
                      touched.phone_number && errors.phone_number
                        ? "border-red-500"
                        : "border-white/20 focus:border-white"
                    } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
                    placeholder="+233 24 123 4567"
                  />
                </div>
                {touched.phone_number && errors.phone_number && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.phone_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Marital Status
                </label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                >
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="SEPARATED">Separated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Number of Dependents
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="number"
                    name="number_of_dependents"
                    value={formData.number_of_dependents}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    className="w-full pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Date Registered
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="date"
                    name="date_registered"
                    value={formData.date_registered}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-white/60" />
              Account Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="discontinued"
                    checked={formData.discontinued}
                    onChange={handleChange}
                    className="w-4 h-4 bg-black border border-white/20 rounded text-white focus:ring-white focus:ring-offset-0 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-white/80">
                    Discontinued Account
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-white/60">
                <span className="font-medium text-white">
                  Default Password:
                </span>{" "}
                {formData.staff_id
                  ? `${formData.staff_id}@ECG2026`
                  : "Staff ID@ECG2026"}
              </p>
              <p className="text-xs text-white/40 mt-1">
                User will be prompted to change password on first login
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading || success}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Created!
                </>
              ) : (
                "Create Employee"
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddEmployee;
