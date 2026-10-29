import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkMaintenanceStatus } from "@/lib/coinquest.functions";
import { useAuth } from "@/lib/auth";
import { MaintenanceScreen } from "./MaintenanceScreen";

export function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const { roles } = useAuth();
  const fetchMaintenanceStatus = useServerFn(checkMaintenanceStatus);
  const [maintenanceData, setMaintenanceData] = useState<{ enabled: boolean; message?: string }>({
    enabled: false,
    message: "",
  });

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    // Check maintenance status on mount and every 60 seconds
    const checkStatus = async () => {
      try {
        const status = await fetchMaintenanceStatus({});
        setMaintenanceData(status);
      } catch (error) {
        // FAIL OPEN: if status call errors, don't block anyone
        console.error("Failed to check maintenance status:", error);
        setMaintenanceData({ enabled: false, message: "" });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchMaintenanceStatus]);

  // If maintenance is enabled and user is not admin, show maintenance screen
  if (maintenanceData.enabled && !isAdmin) {
    return <MaintenanceScreen message={maintenanceData.message} />;
  }

  return <>{children}</>;
}
