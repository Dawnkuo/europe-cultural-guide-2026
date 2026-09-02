"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const Icon = offline ? WifiOff : Wifi;
  return (
    <div className="offline-mark" data-offline={offline} title="核心内容支持离线读取">
      <Icon aria-hidden="true" size={15} />
      <span>{offline ? "离线可读" : "已缓存"}</span>
    </div>
  );
}
