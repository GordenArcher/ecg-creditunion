import {
  Home,
  FileText,
  Users,
  UserPlus,
  Download,
  List,
  Settings,
  BarChart3,
  Calendar,
  Award,
  Shield,
  Bell,
  HelpCircle,
  UserCog,
  FileSpreadsheet,
  PieChart,
} from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  requiredRole?: string[];
}

export const SidebarMenuItems: MenuItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="h-5 w-5" />,
    path: "/",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="h-5 w-5" />,
    children: [
      // {
      //   id: "audits",
      //   label: "Summary Reports",
      //   icon: <PieChart className="h-4 w-4" />,
      //   path: "/reports/summary",
      // },
      {
        id: "reports-analytics",
        label: "Audit Trails",
        icon: <BarChart3 className="h-4 w-4" />,
        path: "/cu/reports/audits/logs",
      },
      // {
      //   id: "reports-export",
      //   label: "Export Reports",
      //   icon: <FileSpreadsheet className="h-4 w-4" />,
      //   path: "/reports/export",
      // },
    ],
  },
  {
    id: "employees",
    label: "Employees",
    icon: <Users className="h-5 w-5" />,
    children: [
      {
        id: "emp-list",
        label: "Employee List",
        icon: <List className="h-4 w-4" />,
        path: "/cu/employees/list",
      },
      {
        id: "emp-add",
        label: "Add New Employee",
        icon: <UserPlus className="h-4 w-4" />,
        path: "/cu/employees/new",
      },
      {
        id: "emp-export",
        label: "Export Employees",
        icon: <Download className="h-4 w-4" />,
        path: "/cu/employees/export",
      },
      {
        id: "emp-roles",
        label: "Manage Roles",
        icon: <UserCog className="h-4 w-4" />,
        path: "/employees/roles",
      },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    icon: <BarChart3 className="h-5 w-5" />,
    path: "/performance",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: <Calendar className="h-5 w-5" />,
    path: "/attendance",
  },
  {
    id: "recognition",
    label: "Recognition",
    icon: <Award className="h-5 w-5" />,
    path: "/recognition",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
    children: [
      {
        id: "settings-profile",
        label: "Profile",
        icon: <UserCog className="h-4 w-4" />,
        path: "/settings/profile",
      },
      {
        id: "settings-security",
        label: "Security",
        icon: <Shield className="h-4 w-4" />,
        path: "/settings/security",
      },
      {
        id: "settings-notifications",
        label: "Notifications",
        icon: <Bell className="h-4 w-4" />,
        path: "/settings/notifications",
      },
    ],
  },
  {
    id: "help",
    label: "Help & Support",
    icon: <HelpCircle className="h-5 w-5" />,
    path: "/help",
  },
];
