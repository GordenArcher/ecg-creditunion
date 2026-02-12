import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  User,
  Briefcase,
  PlusCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchAllEmployees } from "../../api/api";
import { useNavigate } from "react-router-dom";

import type {
  Employee,
  EmployeeQueryParams,
  Pagination,
  FiltersAvailable,
} from "../../types/employee";
import FilterBar from "../../components/FilterBar";
import TableSkeleton from "../../components/loaders/TableSkeleton";
import EmployeeTableRow from "../../components/employees/EmployeeTableRow";
import EmployeeEditModal from "../../components/employees/modals/EmployeeEditModal";
import EmployeeViewModal from "../../components/employees/modals/EmployeeViewModal";
import EmployeeDeleteModal from "../../components/employees/modals/EmployeeDeleteModal";

const EmployeeLists: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [availableFilters, setAvailableFilters] = useState<FiltersAvailable>(
    {},
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteModalType, setDeleteModalType] = useState<
    "delete" | "discontinue"
  >("delete");

  const [filters, setFilters] = useState<EmployeeQueryParams>({
    page: 1,
    page_size: 20,
    ordering: "-date_joined",
    search: "",
  });

  // Search input
  const [searchInput, setSearchInput] = useState<string>("");

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    staff_id: true,
    name: true,
    contact: true,
    station: true,
    division: true,
    role: true,
    date_joined: true,
    status: true,
    actions: true,
  });

  const fetchEmployees = async (params: EmployeeQueryParams) => {
    setLoading(true);
    setError("");

    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([_, v]) => v !== undefined && v !== "" && v !== null,
        ),
      );

      const response = await fetchAllEmployees(cleanParams);
      if (response.data) {
        setEmployees(response.data.items);
        setPagination(response.data.pagination);
        setAvailableFilters(response.data.filters.available);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch employees");
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(filters);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters((prev) => ({
          ...prev,
          search: searchInput || undefined,
          page: 1,
        }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchEmployees(filters);
  }, [filters]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (size: number) => {
    setFilters((prev) => ({ ...prev, page_size: size, page: 1 }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => {
      const currentOrder = prev.ordering || "-date_joined";
      let newOrder = field;
      if (currentOrder === field) newOrder = `-${field}`;
      else if (currentOrder === `-${field}`) newOrder = field;
      else newOrder = field;
      return { ...prev, ordering: newOrder };
    });
  };

  const applyFilter = (key: keyof EmployeeQueryParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      page_size: 20,
      ordering: "-date_joined",
      search: undefined,
    });
    setSearchInput("");
  };

  const toggleRowSelection = (employeeId: number) => {
    setSelectedRows((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === employees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(employees.map((emp) => emp.id));
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Staff ID",
        "Name",
        "Email",
        "Phone",
        "Station",
        "Division",
        "Role",
        "Status",
        "Date Joined",
      ],
      ...employees.map((emp) => [
        emp.staff_id,
        emp.full_name,
        emp.email || "",
        emp.phone_number,
        emp.station?.name || "",
        emp.division?.name || "",
        emp.role,
        emp.discontinued ? "Discontinued" : "Active",
        new Date(emp.date_joined).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleRefresh = () => {
    fetchEmployees(filters);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditUser = async (data: any) => {
    // Implement edit user API call
    console.log("Edit user:", data);
    setShowEditModal(false);
  };

  const handleChangePassword = async (data: any) => {
    // Implement change password API call
    console.log("Change password:", data);
    setShowEditModal(false);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteModalType("delete");
    setShowDeleteModal(true);
  };

  const handleDiscontinueClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteModalType("discontinue");
    setShowDeleteModal(true);
  };

  const OnConfirm = (selectedEmployeeID?: string, deleted?: boolean) => {
    fetchEmployees(filters);
    if (deleted && selectedEmployeeID) {
      setSelectedRows((prev) =>
        prev.filter((employment_id) => employment_id !== selectedEmployeeID),
      );
    }
  };

  const getSortIndicator = (field: string) => {
    if (filters.ordering === field) return "↑";
    if (filters.ordering === `-${field}`) return "↓";
    return "";
  };

  const visibleColumnCount =
    Object.values(visibleColumns).filter(Boolean).length + 1;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              Employee Management
            </h1>
            <p className="text-white/60 mt-1">
              {pagination
                ? `Showing ${employees.length} of ${pagination.total_items} employees`
                : "Manage your employees"}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="relative p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Briefcase className="h-5 w-5 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <RefreshCw
                className={`h-5 w-5 text-white ${loading ? "animate-spin" : ""}`}
              />
            </motion.button>

            {/*<motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </motion.button>*/}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/cu/employees/new")}
              className="flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Employee
            </motion.button>
          </div>
        </motion.div>

        {showColumnSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-4 mt-2 w-64 bg-black border border-white/20 rounded-lg shadow-xl z-50 p-4"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-white">
                Show/Hide Columns
              </h3>
              <button onClick={() => setShowColumnSelector(false)}>
                <X className="h-4 w-4 text-white/60 hover:text-white" />
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(visibleColumns).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                    className="rounded border-white/30 bg-black text-white focus:ring-white"
                  />
                  <span className="text-sm text-white capitalize">
                    {key.replace("_", " ")}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, staff ID, or phone..."
              className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/20 rounded-lg placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-white"
            />
          </div>
        </motion.div>

        <FilterBar
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filters={filters}
          onApplyFilter={applyFilter}
          onPageSizeChange={handlePageSizeChange}
          onReset={resetFilters}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-950/50 border-l-4 border-red-500 p-4 rounded-md mb-6"
          >
            <p className="text-white">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === employees.length &&
                        employees.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-white/30 bg-black text-white focus:ring-white"
                    />
                  </th>
                  {visibleColumns.staff_id && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => handleSort("staff_id")}
                    >
                      Staff ID {getSortIndicator("staff_id")}
                    </th>
                  )}
                  {visibleColumns.name && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => handleSort("full_name")}
                    >
                      Name {getSortIndicator("full_name")}
                    </th>
                  )}
                  {visibleColumns.contact && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Contact
                    </th>
                  )}
                  {visibleColumns.station && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Station
                    </th>
                  )}
                  {visibleColumns.division && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Division
                    </th>
                  )}
                  {visibleColumns.role && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => handleSort("role")}
                    >
                      Role {getSortIndicator("role")}
                    </th>
                  )}
                  {visibleColumns.date_joined && (
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white"
                      onClick={() => handleSort("date_joined")}
                    >
                      Joined {getSortIndicator("date_joined")}
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  {visibleColumns.actions && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount}>
                      <TableSkeleton
                        columns={visibleColumnCount - 1}
                        rows={5}
                      />
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount}
                      className="px-6 py-12 text-center"
                    >
                      <User className="h-12 w-12 mx-auto text-white/20 mb-3" />
                      <p className="text-white/60">No employees found</p>
                      <button
                        onClick={resetFilters}
                        className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white text-sm"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <EmployeeTableRow
                      key={employee.id}
                      employee={employee}
                      index={index}
                      isSelected={selectedRows.includes(employee.id)}
                      visibleColumns={visibleColumns}
                      onToggleSelect={() => toggleRowSelection(employee.id)}
                      onEdit={handleEditEmployee}
                      onView={handleViewEmployee}
                      onDelete={handleDeleteClick}
                      onDiscontinue={handleDiscontinueClick}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 && !loading && (
            <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/60">
                Showing{" "}
                {(pagination.current_page - 1) * pagination.page_size + 1} to{" "}
                {Math.min(
                  pagination.current_page * pagination.page_size,
                  pagination.total_items,
                )}{" "}
                of {pagination.total_items} employees
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={!pagination.has_previous}
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
                      } else if (pagination.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (
                        pagination.current_page >=
                        pagination.total_pages - 2
                      ) {
                        pageNum = pagination.total_pages - 4 + i;
                      } else {
                        pageNum = pagination.current_page - 2 + i;
                      }

                      return (
                        <motion.button
                          key={pageNum}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                            pagination.current_page === pageNum
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
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={!pagination.has_next}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white text-black rounded-lg shadow-xl px-6 py-3 flex items-center space-x-4"
          >
            <span className="text-sm font-medium">
              {selectedRows.length} employee
              {selectedRows.length !== 1 ? "s" : ""} selected
            </span>
            <div className="h-4 w-px bg-black/20" />
            <button className="text-sm text-black/70 hover:text-black">
              Bulk Edit
            </button>
            <button className="text-sm text-black/70 hover:text-black">
              Export Selected
            </button>
            <button
              onClick={() => setSelectedRows([])}
              className="text-sm text-black/70 hover:text-black"
            >
              Clear
            </button>
          </motion.div>
        )}
      </div>

      {selectedEmployee && (
        <EmployeeEditModal
          employee={selectedEmployee}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          onEditUser={handleEditUser}
          onChangePassword={handleChangePassword}
        />
      )}

      {selectedEmployee && (
        <EmployeeViewModal
          employee={selectedEmployee}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedEmployee(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowEditModal(true);
          }}
          onDiscontinue={() => {
            setShowViewModal(false);
            setDeleteModalType("discontinue");
            setShowDeleteModal(true);
          }}
          onDelete={() => {
            setShowViewModal(false);
            setDeleteModalType("delete");
            setShowDeleteModal(true);
          }}
        />
      )}

      {selectedEmployee && (
        <EmployeeDeleteModal
          employee={selectedEmployee}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedEmployee(null);
          }}
          type={deleteModalType}
          OnConfirm={() => OnConfirm(selectedEmployee?.employee_id)}
        />
      )}
    </div>
  );
};

export default EmployeeLists;
