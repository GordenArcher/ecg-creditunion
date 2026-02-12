import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudUpload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AddEmployeesViaExcel } from "../../../api/api";

interface ImportResult {
  import_summary: {
    total_rows: number;
    total_processed: number;
    users_created: number;
    rows_failed: number;
    rows_skipped: number;
    stations_created: number;
    divisions_created: number;
    success_rate: string;
  };
  created_stations: string[];
  created_divisions: string[];
  successful_imports: Array<{
    row: number;
    user_id: string;
    employee_id: string;
    staff_id: string;
    full_name: string;
    email: string;
    station: string;
    division: string;
    warnings: string[];
  }>;
  failed_imports: Array<{
    row: number;
    error: string;
    data: Record<string, any>;
    field_errors: Record<string, string>;
  }>;
  skipped_imports: Array<{
    row: number;
    reason: string;
    data: Record<string, any>;
  }>;
  warnings: string[];
}

interface ImportStatus {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  message: string;
  result: ImportResult | null;
  error: string | null;
}

const UserExcelImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    status: "idle",
    message: "",
    result: null,
    error: null,
  });
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredHeaders = [
    "Emp ID",
    "Name",
    "Title",
    "Sex",
    "Staff #",
    "DOB",
    "Station",
    "PB #",
    "Directorate",
    "Division",
    "Tel",
    "Email",
    "Marital Status",
    "# of Dependents",
    "Date of Registration",
    "Discontinue",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = selectedFile.name
        .slice(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setImportStatus({
          status: "error",
          message: "Invalid file type",
          result: null,
          error: "Please upload an Excel file (.xlsx or .xls)",
        });
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setImportStatus({
          status: "error",
          message: "File too large",
          result: null,
          error: "File size must be less than 5MB",
        });
        return;
      }

      setFile(selectedFile);
      setImportStatus({
        status: "idle",
        message: "",
        result: null,
        error: null,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = droppedFile.name
        .slice(droppedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setImportStatus({
          status: "error",
          message: "Invalid file type",
          result: null,
          error: "Please upload an Excel file (.xlsx or .xls)",
        });
        return;
      }

      if (droppedFile.size > 5 * 1024 * 1024) {
        setImportStatus({
          status: "error",
          message: "File too large",
          result: null,
          error: "File size must be less than 5MB",
        });
        return;
      }

      setFile(droppedFile);
      setImportStatus({
        status: "idle",
        message: "",
        result: null,
        error: null,
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      setImportStatus({
        status: "error",
        message: "No file selected",
        result: null,
        error: "Please select an Excel file to import",
      });
      return;
    }

    setImportStatus({
      status: "uploading",
      message: "Uploading file...",
      result: null,
      error: null,
    });

    try {
      setImportStatus((prev) => ({
        ...prev,
        status: "processing",
        message: "Processing file...",
      }));

      const response = await AddEmployeesViaExcel(file);

      if (response) {
        setImportStatus({
          status: "success",
          message: response.message,
          result: response.data,
          error: null,
        });

        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      console.error("Import error:", error);

      let errorMessage = "An error occurred during import";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setImportStatus({
        status: "error",
        message: "Import failed",
        result: null,
        error: errorMessage,
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportStatus({
      status: "idle",
      message: "",
      result: null,
      error: null,
    });
    setShowDetails(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-black text-white py-8 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          variants={itemVariants}
          className="bg-white/5 border border-white/10 rounded-lg p-6"
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            Import Users from Excel
          </h1>
          <p className="text-white/60 mb-4">
            Upload an Excel file with user data to import into the system. The
            file must follow the required format.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h2 className="font-semibold text-white/80 mb-2">
              Required Excel Headers:
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {requiredHeaders.map((header, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm text-white/80"
                >
                  {header}
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-white/60 mt-3">
              <span className="font-medium text-white">Note:</span>Staff #, and
              Name are required fields. Email ( Optional but if provided) and
              Staff # must be unique.
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 border border-white/10 rounded-lg p-6"
        >
          <motion.div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              file
                ? "border-green-500/50 bg-green-500/5"
                : "border-white/20 hover:border-white/40 hover:bg-white/5"
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
              id="file-upload"
            />

            {!file ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CloudUpload className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <p className="text-lg font-medium text-white mb-2">
                    Drag & drop your Excel file here
                  </p>
                  <p className="text-white/60 mb-4">or click to browse</p>
                  <motion.span
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 mr-2" />
                    Select Excel File
                  </motion.span>
                </label>
                <p className="text-sm text-white/40 mt-4">
                  Supports .xlsx, .xls files up to 5MB
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-2"
              >
                <FileSpreadsheet className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-white">{file.name}</p>
                <p className="text-white/60">{formatFileSize(file.size)}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFile(null)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Remove file
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          <div className="flex justify-end space-x-4 mt-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              disabled={
                importStatus.status === "uploading" ||
                importStatus.status === "processing"
              }
              className="px-6 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleImport}
              disabled={
                !file ||
                importStatus.status === "uploading" ||
                importStatus.status === "processing"
              }
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {importStatus.status === "uploading" ||
              importStatus.status === "processing" ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {importStatus.status === "uploading"
                    ? "Uploading..."
                    : "Processing..."}
                </>
              ) : (
                "Start Import"
              )}
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {importStatus.status !== "idle" && (
            <motion.div
              key={importStatus.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <div
                className={`p-4 rounded-lg ${
                  importStatus.status === "success"
                    ? "bg-green-500/10 border border-green-500/30"
                    : importStatus.status === "error"
                      ? "bg-red-500/10 border border-red-500/30"
                      : "bg-blue-500/10 border border-blue-500/30"
                }`}
              >
                <div className="flex items-start">
                  {importStatus.status === "success" && (
                    <CheckCircle className="w-6 h-6 text-green-400 mr-3 mt-0.5 shrink-0" />
                  )}
                  {importStatus.status === "error" && (
                    <XCircle className="w-6 h-6 text-red-400 mr-3 mt-0.5 shrink-0" />
                  )}
                  {(importStatus.status === "uploading" ||
                    importStatus.status === "processing") && (
                    <Loader2 className="w-6 h-6 text-blue-400 mr-3 mt-0.5 animate-spin shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        importStatus.status === "success"
                          ? "text-green-400"
                          : importStatus.status === "error"
                            ? "text-red-400"
                            : "text-blue-400"
                      }`}
                    >
                      {importStatus.status === "success"
                        ? "Import Successful"
                        : importStatus.status === "error"
                          ? "Import Failed"
                          : importStatus.message}
                    </h3>
                    <p
                      className={`mt-1 ${
                        importStatus.status === "success"
                          ? "text-green-300/80"
                          : importStatus.status === "error"
                            ? "text-red-300/80"
                            : "text-blue-300/80"
                      }`}
                    >
                      {importStatus.status === "error"
                        ? importStatus.error
                        : importStatus.message}
                    </p>
                  </div>
                </div>
              </div>

              {importStatus.status === "success" && importStatus.result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <motion.div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-green-400">
                        {importStatus.result.import_summary.users_created}
                      </div>
                      <div className="text-green-300 font-medium">
                        Users Created
                      </div>
                      <div className="text-sm text-green-300/60 mt-1">
                        {importStatus.result.import_summary.success_rate}{" "}
                        success rate
                      </div>
                    </motion.div>

                    <motion.div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-blue-400">
                        {importStatus.result.import_summary.rows_failed}
                      </div>
                      <div className="text-blue-300 font-medium">
                        Failed Rows
                      </div>
                      <div className="text-sm text-blue-300/60 mt-1">
                        {importStatus.result.import_summary.total_processed}{" "}
                        total processed
                      </div>
                    </motion.div>

                    <motion.div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-400">
                        {importStatus.result.import_summary.rows_skipped}
                      </div>
                      <div className="text-yellow-300 font-medium">
                        Skipped Rows
                      </div>
                      <div className="text-sm text-yellow-300/60 mt-1">
                        Duplicate email or staff #
                      </div>
                    </motion.div>
                  </div>

                  {(importStatus.result.created_stations.length > 0 ||
                    importStatus.result.created_divisions.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <h4 className="font-semibold text-white mb-3">
                        Newly Created:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {importStatus.result.created_stations.map(
                          (station, index) => (
                            <motion.span
                              key={`station-${index}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-sm"
                            >
                              Station: {station}
                            </motion.span>
                          ),
                        )}
                        {importStatus.result.created_divisions.map(
                          (division, index) => (
                            <motion.span
                              key={`division-${index}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-sm"
                            >
                              Division: {division}
                            </motion.span>
                          ),
                        )}
                      </div>
                    </motion.div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center text-white/80 hover:text-white font-medium mb-4"
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {showDetails ? "Hide Details" : "Show Detailed Results"}
                    {showDetails ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 overflow-hidden"
                      >
                        {importStatus.result.successful_imports.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-400 mb-3">
                              Successful Imports
                            </h4>
                            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-white/10">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                        Row
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                        Staff ID
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                        Name
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                        Email
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">
                                        Station
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/10">
                                    {importStatus.result.successful_imports.map(
                                      (user, idx) => (
                                        <motion.tr
                                          key={user.user_id}
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: idx * 0.02 }}
                                          className="hover:bg-white/5"
                                        >
                                          <td className="px-4 py-3 text-sm text-white">
                                            {user.row}
                                          </td>
                                          <td className="px-4 py-3 text-sm font-medium text-white">
                                            {user.staff_id}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-white">
                                            {user.full_name}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-white/80">
                                            {user.email || "—"}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-white/80">
                                            {user.station || "—"}
                                          </td>
                                        </motion.tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {importStatus.result.failed_imports.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-400 mb-3">
                              Failed Imports
                            </h4>
                            <div className="space-y-3">
                              {importStatus.result.failed_imports.map(
                                (failed, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-red-400">
                                          Row {failed.row}: {failed.error}
                                        </p>
                                        {Object.entries(
                                          failed.field_errors,
                                        ).map(([field, error]) => (
                                          <p
                                            key={field}
                                            className="text-sm text-red-300/80 mt-1"
                                          >
                                            <span className="font-medium">
                                              {field}:
                                            </span>{" "}
                                            {error}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {importStatus.result.skipped_imports.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-yellow-400 mb-3">
                              Skipped Imports
                            </h4>
                            <div className="space-y-3">
                              {importStatus.result.skipped_imports.map(
                                (skipped, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
                                  >
                                    <p className="font-medium text-yellow-400">
                                      Row {skipped.row}
                                    </p>
                                    <p className="text-sm text-yellow-300/80 mt-1">
                                      {skipped.reason}
                                    </p>
                                  </motion.div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {importStatus.result.warnings.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-orange-400 mb-3">
                              Warnings
                            </h4>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                              <ul className="space-y-2">
                                {importStatus.result.warnings.map(
                                  (warning, idx) => (
                                    <motion.li
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.02 }}
                                      className="text-sm text-orange-300/80 flex items-start"
                                    >
                                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-orange-400" />
                                      {warning}
                                    </motion.li>
                                  ),
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 border border-white/10 rounded-lg p-6"
        >
          <h3 className="font-semibold text-white mb-3">Import Instructions</h3>
          <ul className="space-y-2 text-white/60">
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full mt-2 mr-3"></div>
              <span>
                Ensure your Excel file has the exact headers listed above
              </span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full mt-2 mr-3"></div>
              <span>
                <span className="text-white font-medium">
                  Staff #, and Name
                </span>{" "}
                are required fields
              </span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full mt-2 mr-3"></div>
              <span>Email and Staff # must be unique across the system</span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full mt-2 mr-3"></div>
              <span>
                Stations and Divisions will be created automatically if they
                don't exist
              </span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full mt-2 mr-3"></div>
              <span>
                Duplicate records will be skipped with detailed reasons
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserExcelImport;
