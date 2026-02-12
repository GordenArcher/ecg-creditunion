import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, X } from "lucide-react";
import CustomSelect from "./CustomSelect";

interface FilterBarProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: {
    role?: string;
    discontinued?: boolean | string;
    page_size: number;
  };
  onApplyFilter: (key: string, value: any) => void;
  onPageSizeChange: (size: number) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  showFilters,
  onToggleFilters,
  filters,
  onApplyFilter,
  onPageSizeChange,
  onReset,
}) => {
  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ADMIN", label: "Admin" },
    { value: "STAFF", label: "Staff" },
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "false", label: "Active" },
    { value: "true", label: "Discontinued" },
  ];

  const pageSizeOptions = [
    { value: "10", label: "10 per page" },
    { value: "20", label: "20 per page" },
    { value: "50", label: "50 per page" },
    { value: "100", label: "100 per page" },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleFilters}
            className="flex items-center px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            <ChevronDown
              className={`h-4 w-4 ml-2 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </motion.button>

          {(filters.role || filters.discontinued !== undefined) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onReset}
              className="flex items-center px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-sm text-white/60"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10"
            >
              <CustomSelect
                label="Role"
                value={filters.role || ""}
                onChange={(value) => onApplyFilter("role", value)}
                options={roleOptions}
                placeholder="Select Role"
              />

              <CustomSelect
                label="Status"
                value={
                  filters.discontinued !== undefined
                    ? String(filters.discontinued)
                    : ""
                }
                onChange={(value) =>
                  onApplyFilter(
                    "discontinued",
                    value === "" ? undefined : value === "true",
                  )
                }
                options={statusOptions}
                placeholder="Select Status"
              />

              <CustomSelect
                label="Items per page"
                value={String(filters.page_size)}
                onChange={(value) => onPageSizeChange(Number(value))}
                options={pageSizeOptions}
              />

              <div className="flex items-end">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onReset}
                  className="w-full px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  Reset All
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FilterBar;
