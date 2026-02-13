import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Building2,
  Phone,
  Mail,
  Code,
  Check,
  AlertCircle,
  Loader,
  ChevronDown,
  Save,
  X,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../../utils/axios";

interface StationFormData {
  code: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const AddEditStation: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<StationFormData>({
    code: "",
    name: "",
    location: "",
    phone: "",
    email: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditMode) {
      fetchStation();
    }
  }, [id]);

  const fetchStation = async () => {
    setFetchLoading(true);
    try {
      const response = await axiosClient.get(`/users/stations/${id}/`);
      const station = response.data.data;
      setFormData({
        code: station.code || "",
        name: station.name || "",
        location: station.location || "",
        phone: station.phone || "",
        email: station.email || "",
        is_active: station.is_active ?? true,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch station");
      console.error("Error fetching station:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
    validateField(name, formData[name as keyof StationFormData]);
  };

  const validateField = (name: string, value: any) => {
    let error = "";

    switch (name) {
      case "code":
        if (!value) error = "Station code is required";
        else if (value.length < 2) error = "Code must be at least 2 characters";
        else if (value.length > 10)
          error = "Code must be less than 10 characters";
        else if (!/^[A-Z0-9]+$/.test(value))
          error = "Code must be uppercase letters and numbers only";
        break;
      case "name":
        if (!value) error = "Station name is required";
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email format";
        }
        break;
      case "phone":
        if (value && !/^\+?[\d\s-]{10,}$/.test(value)) {
          error = "Invalid phone number format";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.code) newErrors.code = "Station code is required";
    if (!formData.name) newErrors.name = "Station name is required";
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
      if (isEditMode) {
        await axiosClient.put(`/users/stations/${id}/`, formData);
      } else {
        await axiosClient.post("/users/stations/", formData);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/cu/setup/stations");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} station`,
      );
      console.error("Error saving station:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/cu/setup/stations");
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-white" />
          <p className="mt-4 text-white/60">Loading station data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            {isEditMode ? "Edit Station" : "Add New Station"}
          </h1>
          <p className="text-white/60">
            {isEditMode
              ? "Update station information in the system"
              : "Create a new station in the system"}
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
              Station {isEditMode ? "updated" : "created"} successfully!
              Redirecting...
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
              <Building2 className="h-5 w-5 mr-2 text-white/60" />
              Station Information
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Station Code <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Code className="h-4 w-4 text-white/40" />
                    </div>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2 bg-black border ${
                        touched.code && errors.code
                          ? "border-red-500"
                          : "border-white/20 focus:border-white"
                      } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 uppercase`}
                      placeholder="e.g., ACC"
                      maxLength={10}
                    />
                  </div>
                  {touched.code && errors.code && (
                    <p className="mt-1 text-xs text-red-400">{errors.code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Station Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-white/40" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2 bg-black border ${
                        touched.name && errors.name
                          ? "border-red-500"
                          : "border-white/20 focus:border-white"
                      } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
                      placeholder="e.g., Accra"
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20"
                    placeholder="e.g., Liberty Avenue, Accra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2 bg-black border ${
                        touched.phone && errors.phone
                          ? "border-red-500"
                          : "border-white/20 focus:border-white"
                      } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
                      placeholder="e.g., +233 30 212 3456"
                    />
                  </div>
                  {touched.phone && errors.phone && (
                    <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
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
                      placeholder="e.g., accra@ecg.com.gh"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 bg-black border border-white/20 rounded text-white focus:ring-white focus:ring-offset-0 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-white/80">
                    Active Station
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSubmit}
              disabled={loading || success}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditMode ? "Updated!" : "Created!"}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? "Update Station" : "Create Station"}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddEditStation;
