import { useState, useEffect } from "react";

export interface NetworkHealth {
  online: boolean;
  effectiveType: "4g" | "3g" | "2g" | "slow-2g" | "wifi" | "unknown";
  downlinkMbps: number;
  rttMs: number;
  dataSavingActive: boolean;
  score: number; // 0 (offline) to 100 (superb)
}

/**
 * High-performance telemetry monitor measuring real-time bandwidth performance and latency health scores.
 */
export function useNetworkTelescope() {
  const [networkHealth, setNetworkHealth] = useState<NetworkHealth>({
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    effectiveType: "4g",
    downlinkMbps: 10,
    rttMs: 50,
    dataSavingActive: false,
    score: 100
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateConnectionStatus = () => {
      const nav = navigator as any;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

      let online = nav.onLine;
      let effectiveType = "unknown" as any;
      let downlinkMbps = 10;
      let rttMs = 50;
      let dataSavingActive = false;
      let score = 100;

      if (conn) {
        effectiveType = conn.effectiveType || "4g";
        downlinkMbps = conn.downlink || 10;
        rttMs = conn.rtt || 50;
        dataSavingActive = !!conn.saveData;

        // Calculate a premium relative health score
        if (effectiveType === "2g" || effectiveType === "slow-2g" || rttMs > 300) {
          score = 30;
          dataSavingActive = true;
        } else if (effectiveType === "3g" || rttMs > 150) {
          score = 65;
          dataSavingActive = true;
        } else {
          score = Math.min(100, Math.max(70, Math.round(downlinkMbps * 10)));
        }
      }

      if (!online) {
        score = 0;
      }

      setNetworkHealth({
        online,
        effectiveType,
        downlinkMbps,
        rttMs,
        dataSavingActive,
        score
      });

      // Futuristic warning toast trigger for degraded connection status
      if (!online) {
        setToastMessage("Network status: Offline. System operates on client-side cached databases.");
      } else if (dataSavingActive || score < 50) {
        setToastMessage(`Network Latency Alert (${rttMs}ms). Data saving mode active: pausing media pre-fetches.`);
      } else {
        setToastMessage(null);
      }
    };

    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      conn.addEventListener("change", updateConnectionStatus);
    }

    // Run initial scan
    updateConnectionStatus();

    return () => {
      window.removeEventListener("online", updateConnectionStatus);
      window.removeEventListener("offline", updateConnectionStatus);
      if (conn) {
        conn.removeEventListener("change", updateConnectionStatus);
      }
    };
  }, []);

  return { networkHealth, toastMessage, dismissToast: () => setToastMessage(null) };
}
