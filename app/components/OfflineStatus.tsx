'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { withBasePath } from '../lib/paths';

function subscribeToConnectivity(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

function getConnectivitySnapshot() {
  return navigator.onLine;
}

export function OfflineStatus() {
  const online = useSyncExternalStore(
    subscribeToConnectivity,
    getConnectivitySnapshot,
    () => true,
  );
  const offline = !online;

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(withBasePath('/sw.js'))
        .catch(() => undefined);
    }
  }, []);

  const Icon = offline ? WifiOff : Wifi;
  return (
    <div
      className="offline-mark"
      data-offline={offline}
      title="核心内容支持离线读取"
    >
      <Icon aria-hidden="true" size={15} />
      <span>{offline ? '离线可读' : '已缓存'}</span>
    </div>
  );
}
