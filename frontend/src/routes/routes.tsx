import { createBrowserRouter, Link } from "react-router-dom";
import UserExcelImport from "../pages/employees/uploads/Addusers";
import ProjectLayout from "../layout/ProjectLayout";
import LoginPage from "../pages/auth/login";
import EmployeeLists from "../pages/employees/EmployeesList";
import AddEmployee from "../pages/employees/AddEmployee";
import App from "../App";
import AuditLogspage from "../pages/audit/AuditLogs";
import AuditDetailPage from "../pages/audit/AuditDetailPage";
import Divisions from "../pages/setup/division/Divisions";
import Stations from "../pages/setup/station/Stations";
import AddEditDivision from "../pages/setup/division/AddEditDivision";
import AddEditStation from "../pages/setup/station/AddEditStation";
import Profile from "../pages/profile/Profile";

export const router = createBrowserRouter([
  {
    path: "/auth",
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },

  //Everything else goes through App so we xheck so authenticated status
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <div>
            HELLO Home HERE
            <Link to={"/cu/employees/list"}>a</Link>
          </div>
        ),
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "cu",
        element: <ProjectLayout />,
        children: [
          {
            path: "employees",
            children: [
              { path: "list", element: <EmployeeLists /> },
              { path: "new", element: <AddEmployee /> },
              { path: "export", element: <UserExcelImport /> },
            ],
          },
          {
            path: "reports",
            children: [
              {
                path: "audits",
                children: [
                  {
                    path: "logs",
                    element: <AuditLogspage />,
                  },
                  {
                    path: ":audit_id",
                    element: <AuditDetailPage />,
                  },
                ],
              },
            ],
          },
          {
            path: "setup",
            children: [
              {
                path: "divisions",
                element: <Divisions />,
              },
              {
                path: "divisions/new",
                element: <AddEditDivision />,
              },
              {
                path: "divisions/edit/:id",
                element: <AddEditDivision />,
              },
              {
                path: "stations",
                element: <Stations />,
              },
              {
                path: "stations/new",
                element: <AddEditStation />,
              },
              {
                path: "stations/edit/:id",
                element: <AddEditStation />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
