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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SidebarMenuItems } from "../constants/menuItems";
import { useAuthStore } from "../stores/useUserStore";

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

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SidebarMenuItems);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { fetchUserProfile, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated, fetchUserProfile]);

  // Initialize from localStorage because we save items in localstorage
  useEffect(() => {
    setIsMounted(true);

    const savedOrder = localStorage.getItem("sidebar_menu_order");
    const savedExpanded = localStorage.getItem("sidebar_expanded_items");

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

    if (savedExpanded) {
      try {
        const parsedExpanded = JSON.parse(savedExpanded);
        setExpandedItems(new Set(parsedExpanded));
      } catch (e) {
        console.error("Failed to parse saved expanded items", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const order = menuItems.map((item) => item.id);
    localStorage.setItem("sidebar_menu_order", JSON.stringify(order));
  }, [menuItems, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(
      "sidebar_expanded_items",
      JSON.stringify(Array.from(expandedItems)),
    );
  }, [expandedItems, isMounted]);

  // Close sibling items when route changes
  useEffect(() => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      // When navigating to a child, close other siblings at that level
      Array.from(newSet).forEach((expandedId) => {
        // Find if this expanded item's parent has children that match current route
        const children = findItemById(menuItems, expandedId)?.children || [];
        const hasActiveChild = children.some((child) => isActive(child.path));

        if (hasActiveChild) {
          // Keeping this one open since it contains the active route
          return;
        }

        // we check if current location matches any of its children
        const matchesCurrentRoute = children.some(
          (child) =>
            location.pathname === child.path ||
            location.pathname.startsWith(child.path + "/"),
        );

        if (!matchesCurrentRoute && newSet.has(expandedId)) {
          // Only close if this doesn't match current route
          const parentId = itemHierarchy.get(expandedId);
          const siblings = Array.from(newSet).filter(
            (id) => itemHierarchy.get(id) === parentId && id !== expandedId,
          );

          siblings.forEach((sibling) => {
            const siblingChildren =
              findItemById(menuItems, sibling)?.children || [];
            const siblingHasActive = siblingChildren.some((child) =>
              isActive(child.path),
            );
            if (!siblingHasActive) {
              newSet.delete(sibling);
            }
          });
        }
      });
      return newSet;
    });
  }, [location.pathname]);

  const findItemById = (
    items: MenuItem[],
    id: string,
  ): MenuItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

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

  const buildItemHierarchy = (
    items: MenuItem[],
    parentId: string | null = null,
  ): Map<string, string | null> => {
    const map = new Map<string, string | null>();
    items.forEach((item) => {
      map.set(item.id, parentId);
      if (item.children) {
        item.children.forEach((child) => {
          map.set(child.id, item.id);
        });
        buildItemHierarchy(item.children, item.id).forEach((value, key) => {
          if (!map.has(key)) {
            map.set(key, value);
          }
        });
      }
    });
    return map;
  };

  const itemHierarchy = buildItemHierarchy(menuItems);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        const parentId = itemHierarchy.get(itemId);
        Array.from(newSet).forEach((expandedId) => {
          if (
            itemHierarchy.get(expandedId) === parentId &&
            expandedId !== itemId
          ) {
            newSet.delete(expandedId);
          }
        });
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const getUserInitials = () => {
    return user?.full_name
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

  if (!isMounted) {
    return null;
  }

  return (
    <motion.div
      layout
      layoutRoot
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 150,
        mass: 1.2,
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
              level={0}
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
              {user?.avatar ? (
                <img
                  src={user?.avatar}
                  alt={user.full_name}
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
                    {user?.full_name}
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
                    {user?.avatar ? (
                      <img
                        src={user?.avatar}
                        alt={user.full_name}
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
                      {user?.full_name}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 text-white/80 rounded-full">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Mail className="h-3.5 w-3.5 text-white/40" />
                  <p className="text-xs text-white/80 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <IdCard className="h-3.5 w-3.5 text-white/40" />
                  <p className="text-xs text-white/60 font-mono">
                    {user?.staff_id}
                  </p>
                </div>
              </div>

              <div className="p-2 border-t border-white/10 bg-white/5">
                <button
                  onClick={() => navigate("/profile/#/~/@me")}
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

interface MenuItemComponentProps {
  item: MenuItem;
  isCollapsed: boolean;
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
  isActive: (path?: string) => boolean;
  level: number;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
  item,
  isCollapsed,
  expandedItems,
  toggleExpand,
  isActive,
  level,
}) => {
  const dragControls = useDragControls();
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.id);

  return (
    <Reorder.Item
      value={item}
      dragControls={dragControls}
      dragListener={false}
      className="relative"
    >
      <div className="relative">
        {level === 0 && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -left-2 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical className="h-4 w-4 text-white/40 hover:text-white/60" />
          </motion.div>
        )}

        {!hasChildren ? (
          <Link
            to={item.path || "#"}
            className={`
              flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all
              ${
                isActive(item.path)
                  ? "bg-white/10 text-white"
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
                  className={`flex-1 font-medium whitespace-nowrap ${level === 0 ? "text-sm" : "text-xs"}`}
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
                w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all
                ${
                  isExpanded
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
                      initial={false}
                      animate={{
                        rotate: isExpanded ? 90 : 0,
                      }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        damping: 20,
                        stiffness: 200,
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    height: { type: "spring", damping: 25, stiffness: 200 },
                  }}
                  className="overflow-hidden"
                >
                  <div
                    className={`mt-0.5 space-y-px ${level === 0 ? "ml-6" : "ml-2"}`}
                  >
                    {item.children?.map((child) => (
                      <MenuItemComponent
                        key={child.id}
                        item={child}
                        isCollapsed={isCollapsed}
                        expandedItems={expandedItems}
                        toggleExpand={toggleExpand}
                        isActive={isActive}
                        level={level + 1}
                      />
                    ))}
                  </div>
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
