import React from "react";
import { motion } from "framer-motion";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
  return (
    <div className="w-full">
      <div className="bg-white/5 border-b border-white/10">
        <div className="flex items-center px-6 py-4">
          <div className="w-4 h-4 bg-white/10 rounded mr-4 animate-pulse" />
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-white/10 rounded animate-pulse mx-2"
              style={{ width: `${Math.floor(Math.random() * 40) + 20}%` }}
            />
          ))}
        </div>
      </div>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.05 }}
          className="flex items-center px-6 py-4 border-b border-white/5"
        >
          <div className="w-4 h-4 bg-white/5 rounded mr-4 animate-pulse" />
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 mx-2">
              {colIndex === 1 ? (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse mr-3" />
                  <div>
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <div
                  className="h-4 bg-white/5 rounded animate-pulse"
                  style={{
                    width:
                      colIndex === 0
                        ? "80px"
                        : colIndex === 2
                          ? "120px"
                          : colIndex === 3
                            ? "100px"
                            : colIndex === 4
                              ? "100px"
                              : colIndex === 5
                                ? "80px"
                                : colIndex === 6
                                  ? "90px"
                                  : colIndex === 7
                                    ? "70px"
                                    : "60px",
                  }}
                />
              )}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export default TableSkeleton;
