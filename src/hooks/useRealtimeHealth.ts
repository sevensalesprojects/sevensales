import { useEffect, useState, useCallback } from "react";

export function useRealtimeHealth(onReconnect: () => void) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const stableReconnect = useCallback(onReconnect, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      stableReconnect();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [stableReconnect]);

  return { isOnline };
}
