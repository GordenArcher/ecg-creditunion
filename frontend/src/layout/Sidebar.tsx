import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  Reorder,
  useDragControls,
  AnimatePresence,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  IdCard,
  GripVertical,
  Briefcase,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { SidebarMenuItems } from "../constants/menuItems";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const dummyUser = {
  name: "John Mensah",
  email: "john.mensah@ecg.com.gh",
  staffId: "STF001",
  avatar: null,
  role: "Administrator",
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SidebarMenuItems);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedOrder = localStorage.getItem("sidebar_menu_order");
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        const orderedItems = parsedOrder
          .map((id: string) => menuItems.find((item) => item.id === id))
          .filter(Boolean);
        const newItems = menuItems.filter(
          (item) => !parsedOrder.includes(item.id),
        );
        setMenuItems([...orderedItems, ...newItems]);
      } catch (e) {
        console.error("Failed to parse saved menu order", e);
      }
    }
  }, []);

  useEffect(() => {
    const order = menuItems.map((item) => item.id);
    localStorage.setItem("sidebar_menu_order", JSON.stringify(order));
  }, [menuItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const getUserInitials = () => {
    return dummyUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  return (
    <motion.div
      layout
      layoutRoot
      initial={{ width: isCollapsed ? 80 : 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 200,
        layout: { duration: 0.2 },
      }}
      className="h-screen bg-black border-r border-white/10 flex flex-col relative overflow-hidden"
    >
      <motion.button
        layout
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleCollapse}
        className="absolute top-1/2 -right-3 z-50 p-1.5 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-white" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-white" />
        )}
      </motion.button>

      <motion.div layout className="p-6 border-b border-white/10">
        <motion.div layout className="flex items-center space-x-3">
          <motion.div
            layout
            className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0"
          >
            <Briefcase className="h-4 w-4 text-white" />
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold text-white whitespace-nowrap"
              >
                ECG Credit Union
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <motion.div
        layout
        className="flex-1 overflow-y-auto custom-scrollbar p-4"
      >
        <Reorder.Group
          axis="y"
          values={menuItems}
          onReorder={setMenuItems}
          className="space-y-1"
        >
          {menuItems.map((item) => (
            <MenuItemComponent
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              isActive={isActive}
            />
          ))}
        </Reorder.Group>
      </motion.div>

      <motion.div
        layout
        className="border-t border-white/10 p-4 bg-black/50 relative"
        ref={profileRef}
      >
        <motion.div layout className="flex items-center space-x-3">
          <motion.button
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="relative shrink-0"
          >
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-white/30 flex items-center justify-center">
              {dummyUser.avatar ? (
                <img
                  src={dummyUser.avatar}
                  alt={dummyUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {getUserInitials()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
          </motion.button>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white truncate">
                    {dummyUser.name}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => console.log("Logout")}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-white/60" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.2,
              }}
              className={`
                absolute bottom-full left-4 mb-2 w-64
                bg-black border border-white/10 rounded-lg shadow-xl
                overflow-hidden
              `}
              style={{ transformOrigin: "bottom left" }}
            >
              <div className="p-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-white/30 flex items-center justify-center">
                    {dummyUser.avatar ? (
                      <img
                        src={dummyUser.avatar}
                        alt={dummyUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {getUserInitials()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {dummyUser.name}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-white/80 rounded-full">
                        {dummyUser.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Mail className="h-3.5 w-3.5 text-white/40" />
                  <p className="text-xs text-white/80 truncate">
                    {dummyUser.email}
                  </p>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <IdCard className="h-3.5 w-3.5 text-white/40" />
                  <p className="text-xs text-white/60 font-mono">
                    {dummyUser.staffId}
                  </p>
                </div>
              </div>

              <div className="p-2 border-t border-white/10 bg-white/5">
                <button
                  onClick={() => console.log("Profile settings")}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <User className="h-4 w-4 text-white/60" />
                  <span className="text-xs font-medium text-white/80">
                    Profile Settings
                  </span>
                </button>
                <button
                  onClick={() => console.log("Logout")}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-red-400 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-xs font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const MenuItemComponent: React.FC<{
  item: MenuItem;
  isCollapsed: boolean;
  expandedItems: string[];
  toggleExpand: (id: string) => void;
  isActive: (path?: string) => boolean;
}> = ({ item, isCollapsed, expandedItems, toggleExpand, isActive }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragControls={dragControls}
      dragListener={false}
      className="relative"
    >
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute -left-2 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="h-4 w-4 text-white/40 hover:text-white/60" />
        </motion.div>

        {!item.children ? (
          <Link
            to={item.path || "#"}
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
              ${
                isActive(item.path)
                  ? "bg-white/10 text-white border-l-2 border-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <span className="shrink-0">{item.icon}</span>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ) : (
          <>
            <button
              onClick={() => toggleExpand(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                ${
                  expandedItems.includes(item.id)
                    ? "bg-white/5 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }
                ${isCollapsed ? "justify-center" : ""}
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 text-sm font-medium text-left whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                    <motion.div
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{
                        opacity: 1,
                        rotate: expandedItems.includes(item.id) ? 90 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && expandedItems.includes(item.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    height: { type: "spring", damping: 20, stiffness: 200 },
                  }}
                  className="ml-8 mt-1 space-y-1 overflow-hidden"
                >
                  {item.children?.map((child) => (
                    <Link
                      key={child.id}
                      to={child.path || "#"}
                      className={`
                        flex items-center space-x-3 px-4 py-2 rounded-lg transition-all
                        ${
                          isActive(child.path)
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }
                      `}
                    >
                      <span className="shrink-0">{child.icon}</span>
                      <span className="flex-1 text-xs font-medium whitespace-nowrap">
                        {child.label}
                      </span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </Reorder.Item>
  );
};

export default Sidebar;
