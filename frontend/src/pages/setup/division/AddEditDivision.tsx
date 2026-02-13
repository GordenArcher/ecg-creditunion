import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Layers,
  FileText,
  Check,
  AlertCircle,
  Loader,
  Save,
  X,
  Code,
  Briefcase,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../../utils/axios";

interface DivisionFormData {
  code: string;
  name: string;
  directorate: string;
  description: string;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const AddEditDivision: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<DivisionFormData>({
    code: "",
    name: "",
    directorate: "",
    description: "",
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
      fetchDivision();
    }
  }, [id]);

  const fetchDivision = async () => {
    setFetchLoading(true);
    try {
      const response = await axiosClient.get(`/users/divisions/${id}/`);
      const division = response.data.data;
      setFormData({
        code: division.code || "",
        name: division.name || "",
        directorate: division.directorate || "",
        description: division.description || "",
        is_active: division.is_active ?? true,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch division");
      console.error("Error fetching division:", err);
    } finally {
      setFetchLoading(false);
    }
  };

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
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof DivisionFormData]);
  };

  const validateField = (name: string, value: any) => {
    let error = "";

    switch (name) {
      case "code":
        if (!value) error = "Division code is required";
        else if (value.length < 2) error = "Code must be at least 2 characters";
        else if (value.length > 10)
          error = "Code must be less than 10 characters";
        else if (!/^[A-Z0-9]+$/.test(value))
          error = "Code must be uppercase letters and numbers only";
        break;
      case "name":
        if (!value) error = "Division name is required";
        break;
      case "directorate":
        if (!value) error = "Directorate is required";
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.code) newErrors.code = "Division code is required";
    if (!formData.name) newErrors.name = "Division name is required";
    if (!formData.directorate)
      newErrors.directorate = "Directorate is required";

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
        await axiosClient.put(`/users/divisions/${id}/`, formData);
      } else {
        await axiosClient.post("/users/divisions/", formData);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/cu/setup/divisions");
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} division`,
      );
      console.error("Error saving division:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/cu/setup/divisions");
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-white" />
          <p className="mt-4 text-white/60">Loading division data...</p>
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
            {isEditMode ? "Edit Division" : "Add New Division"}
          </h1>
          <p className="text-white/60">
            {isEditMode
              ? "Update division information in the system"
              : "Create a new division in the system"}
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
              Division {isEditMode ? "updated" : "created"} successfully!
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
              <Layers className="h-5 w-5 mr-2 text-white/60" />
              Division Information
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Division Code <span className="text-red-400">*</span>
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
                      placeholder="e.g., HR"
                      maxLength={10}
                    />
                  </div>
                  {touched.code && errors.code && (
                    <p className="mt-1 text-xs text-red-400">{errors.code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Division Name <span className="text-red-400">*</span>
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
                      placeholder="e.g., Human Resources"
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Directorate <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-white/40" />
                  </div>
                  <input
                    type="text"
                    name="directorate"
                    value={formData.directorate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-4 py-2 bg-black border ${
                      touched.directorate && errors.directorate
                        ? "border-red-500"
                        : "border-white/20 focus:border-white"
                    } rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
                    placeholder="e.g., Corporate Services"
                  />
                </div>
                {touched.directorate && errors.directorate && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.directorate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <FileText className="h-4 w-4 text-white/40" />
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 resize-none"
                    placeholder="Enter division description..."
                  />
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
                    Active Division
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
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
                  {isEditMode ? "Update Division" : "Create Division"}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddEditDivision;
