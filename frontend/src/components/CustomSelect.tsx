import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select option",
  label,
  searchable = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchable) {
      const filtered = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()),
      );
      setFilteredOptions(filtered);
    }
  }, [search, options, searchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-white/60 mb-1">
          {label}
        </label>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg flex items-center justify-between text-white hover:bg-white/5 transition-colors"
      >
        <span className={selectedOption ? "text-white" : "text-white/40"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-white/60" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-black border border-white/20 rounded-lg shadow-xl overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/40 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full px-4 py-2 text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm text-white">{option.label}</span>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
