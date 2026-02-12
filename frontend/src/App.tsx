import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/useUserStore";
import { useEffect } from "react";
import { fetchAuditLogs } from "./api/api";

function App() {
  const { checkAuth, authChecking, isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
    fetchAuditLogs();
  }, [checkAuth]);

  if (authChecking) {
    return <div>Checking authentication...</div>;
  }

  console.log(isAuthenticated);

  if (!isAuthenticated && location.pathname !== "/auth/login") {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

export default App;
