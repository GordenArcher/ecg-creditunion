import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Loader,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
} from "lucide-react";
import CustomSelect from "../../../components/CustomSelect";
import axios from "axios";
import axiosClient from "../../../utils/axios";
import { useNavigate } from "react-router-dom";

interface Division {
  id: number;
  code: string;
  name: string;
  directorate: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationData {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Division[];
}

const Divisions: React.FC = () => {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
    results: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [directorateFilter, setDirectorateFilter] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  const fetchDivisions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        ...(searchInput && { search: searchInput }),
        ...(directorateFilter && { directorate: directorateFilter }),
      });

      const response = await axiosClient.get(`/users/divisions/?${params}`);

      const data = response.data.data;

      setDivisions(data.results || []);
      setPagination({
        count: data.count || 0,
        page: data.page || currentPage,
        page_size: data.page_size || pageSize,
        total_pages: data.total_pages || 1,
        results: data.results || [],
      });
    } catch (err) {
      setError("Failed to fetch divisions");
      console.error("Error fetching divisions:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDivision = async (id: number) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/divisions/${id}/`);
      fetchDivisions();
    } catch (err) {
      setError("Failed to delete division");
      console.error("Error deleting division:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, [currentPage, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchDivisions();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, directorateFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-green-500/20 text-green-300 border border-green-500/30"
      : "bg-red-500/20 text-red-300 border border-red-500/30";
  };

  const directorateOptions = [
    { value: "", label: "All Directorates" },
    ...Array.from(
      new Set(divisions.map((d) => d.directorate).filter(Boolean)),
    ).map((dir) => ({
      value: dir,
      label: dir,
    })),
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Divisions</h1>
            <p className="text-white/60 mt-1">
              {pagination?.count || 0} total divisions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchDivisions()}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              disabled={loading}
            >
              <RefreshCw
                className={`h-5 w-5 text-white ${loading ? "animate-spin" : ""}`}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
              onClick={() => navigate("/cu/setup/divisions/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Division
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/40" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={handleSearch}
                placeholder="Search by code, name, or directorate..."
                className="w-full pl-10 pr-4 py-2 bg-black border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <CustomSelect
              value={directorateFilter}
              onChange={setDirectorateFilter}
              options={directorateOptions}
              placeholder="All Directorates"
              className="w-48"
            />

            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => handlePageSizeChange(Number(val))}
              options={[
                { value: "10", label: "10 per page" },
                { value: "20", label: "20 per page" },
                { value: "50", label: "50 per page" },
                { value: "100", label: "100 per page" },
              ]}
              className="w-40"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                    Directorate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader className="h-8 w-8 animate-spin mx-auto text-white" />
                      <p className="mt-2 text-white/60">Loading divisions...</p>
                    </td>
                  </tr>
                ) : divisions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Layers className="h-12 w-12 mx-auto text-white/20 mb-3" />
                      <p className="text-white/60">No divisions found</p>
                      {searchInput || directorateFilter ? (
                        <button
                          onClick={() => {
                            setSearchInput("");
                            setDirectorateFilter("");
                          }}
                          className="mt-2 text-white/60 hover:text-white underline"
                        >
                          Clear filters
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  divisions.map((division, index) => (
                    <motion.tr
                      key={division.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-white bg-white/10 px-2 py-1 rounded">
                          {division.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">
                          {division.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-white/80">
                          <Building2 className="h-4 w-4 mr-1 text-white/40" />
                          {division.directorate || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white/80 max-w-xs truncate">
                          {division.description || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(division.is_active)}`}
                        >
                          {division.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="View"
                            onClick={() => {
                              console.log("View division:", division.id);
                            }}
                          >
                            <Eye className="h-4 w-4 text-white/60" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Edit"
                            onClick={() =>
                              navigate(
                                `/cu/setup/divisions/edit/${division.id}`,
                              )
                            }
                          >
                            <Edit2 className="h-4 w-4 text-white/60" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Delete"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete ${division.name}?`,
                                )
                              ) {
                                deleteDivision(division.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-white/60" />
                          </motion.button>
                          {/*<motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="More"
                          >
                            <MoreVertical className="h-4 w-4 text-white/60" />
                          </motion.button>*/}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/60">
                Showing {(pagination.page - 1) * pagination.page_size + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.page_size,
                  pagination.count,
                )}{" "}
                of {pagination.count} divisions
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </motion.button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, pagination.total_pages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.total_pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (
                        pagination.page >=
                        pagination.total_pages - 2
                      ) {
                        pageNum = pagination.total_pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <motion.button
                          key={pageNum}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                            pagination.page === pageNum
                              ? "bg-white text-black font-medium"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          {pageNum}
                        </motion.button>
                      );
                    },
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Divisions;
