import React from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, Eye, Edit2, Trash2, Ban } from "lucide-react";
import type { Employee } from "../../types/employee";
import { formatDate } from "../../utils/helper/formatSmartDate";

interface EmployeeTableRowProps {
  employee: Employee;
  index: number;
  isSelected: boolean;
  visibleColumns: Record<string, boolean>;
  onToggleSelect: () => void;
  onEdit: (employee: Employee) => void;
  onView: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onDiscontinue?: (employee: Employee) => void;
}

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({
  employee,
  index,
  isSelected,
  visibleColumns,
  onToggleSelect,
  onEdit,
  onView,
  onDelete,
  onDiscontinue,
}) => {
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500/20 text-blue-300",
      "bg-green-500/20 text-green-300",
      "bg-yellow-500/20 text-yellow-300",
      "bg-purple-500/20 text-purple-300",
      "bg-pink-500/20 text-pink-300",
      "bg-indigo-500/20 text-indigo-300",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "ADMIN":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-green-500/20 text-green-300 border-green-500/30";
    }
  };

  const getStatusBadgeColor = (discontinued: boolean) => {
    return discontinued
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : "bg-green-500/20 text-green-300 border-green-500/30";
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`hover:bg-white/5 transition-colors cursor-pointer ${
        isSelected ? "bg-white/10" : ""
      }`}
      onClick={onToggleSelect}
    >
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="rounded border-white/30 bg-black text-white focus:ring-white cursor-pointer"
          />
        </motion.div>
      </td>

      {visibleColumns.staff_id && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm font-medium text-white">
            {employee.staff_id}
          </span>
        </td>
      )}

      {visibleColumns.name && (
        <td className="px-6 py-4">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`h-8 w-8 rounded-full ${getAvatarColor(
                employee.full_name,
              )} flex items-center justify-center mr-3 border border-white/10`}
            >
              <span className="text-sm font-medium">
                {employee.full_name.charAt(0)}
              </span>
            </motion.div>
            <div>
              <div className="text-sm font-medium text-white">
                {employee.full_name}
              </div>
              <div className="text-xs text-white/60">
                {employee.title || "No title"}
              </div>
            </div>
          </div>
        </td>
      )}

      {visibleColumns.contact && (
        <td className="px-6 py-4">
          <div className="text-sm text-white">{employee.email || "—"}</div>
          <div className="text-xs text-white/60 flex items-center mt-1">
            <Phone className="h-3 w-3 mr-1" />
            {employee.phone_number || "No phone"}
          </div>
        </td>
      )}

      {visibleColumns.station && (
        <td className="px-6 py-4">
          {employee.station ? (
            <>
              <div className="text-sm text-white">{employee.station.name}</div>
              <div className="text-xs text-white/60">
                {employee.station.code}
              </div>
            </>
          ) : (
            <span className="text-sm text-white/60">—</span>
          )}
        </td>
      )}

      {visibleColumns.division && (
        <td className="px-6 py-4">
          {employee.division ? (
            <>
              <div className="text-sm text-white">{employee.division.name}</div>
              <div className="text-xs text-white/60">
                {employee.division.directorate}
              </div>
            </>
          ) : (
            <span className="text-sm text-white/60">—</span>
          )}
        </td>
      )}

      {visibleColumns.role && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(
              employee.role,
            )}`}
          >
            {employee.role}
          </span>
        </td>
      )}

      {visibleColumns.date_joined && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 text-white/40 mr-1" />
            <span className="text-sm text-white">
              {formatDate(employee.date_joined)}
            </span>
          </div>
          {employee.last_login && (
            <div className="text-xs text-white/40 mt-1">
              Last: {formatDate(employee.last_login)}
            </div>
          )}
        </td>
      )}

      {visibleColumns.status && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(
              employee.discontinued,
            )}`}
          >
            {employee.discontinued ? "Discontinued" : "Active"}
          </span>
          {!employee.is_active && (
            <div className="text-xs text-white/40 mt-1">Inactive</div>
          )}
        </td>
      )}

      {visibleColumns.actions && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div
            className="flex items-center space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onView(employee)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4 text-white/60" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(employee)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="h-4 w-4 text-white/60" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(employee)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-white/60" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDiscontinue?.(employee)}
              className={`p-1 hover:bg-white/10 rounded transition-colors ${
                employee.discontinued ? "text-green-400" : "text-yellow-400"
              }`}
              title={
                employee.discontinued
                  ? "Activate Account"
                  : "Discontinue Account"
              }
            >
              <Ban className="h-4 w-4" />
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
      )}
    </motion.tr>
  );
};

export default EmployeeTableRow;
