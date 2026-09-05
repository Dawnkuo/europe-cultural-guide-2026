'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
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

function subscribeToCapabilities() { return () => {}; }
function supportsOffline() { return 'serviceWorker' in navigator; }

export function OfflineStatus() {
  const online = useSyncExternalStore(
    subscribeToConnectivity,
    getConnectivitySnapshot,
    () => true,
  );
  const offline = !online;
  const supported = useSyncExternalStore(subscribeToCapabilities, supportsOffline, () => true);
  const development = process.env.NODE_ENV === 'development';
  const [cacheState, setCacheState] = useState<'checking' | 'ready' | 'failed'>('checking');

  useEffect(() => {
    if (development) return;
    if (!('serviceWorker' in navigator)) return;
    let live = true;
    let installing = false;
    const cleanup: Array<() => void> = [];
    const workers = navigator.serviceWorker;
    const receive = (event: MessageEvent) => {
      if (live && !installing && event.data?.type === 'OFFLINE_STATUS') setCacheState(event.data.ready ? 'ready' : 'failed');
    };
    const request = () => workers.controller?.postMessage({ type: 'OFFLINE_STATUS' });
    workers.addEventListener('message', receive);
    workers.addEventListener('controllerchange', request);
    void workers.register(withBasePath('/sw.js')).then(async (registered) => {
      if (!live) return;
      const watch = () => {
        const worker = registered.installing;
        if (!worker) return;
        installing = true;
        setCacheState('checking');
        const change = () => {
          if (live && worker.state === 'redundant') setCacheState('failed');
          if (worker.state === 'activated') { installing = false; if (live) request(); }
        };
        worker.addEventListener('statechange', change);
        cleanup.push(() => worker.removeEventListener('statechange', change));
      };
      registered.addEventListener('updatefound', watch);
      cleanup.push(() => registered.removeEventListener('updatefound', watch));
      watch();
      const registration = await workers.ready;
      if (live) registration.active?.postMessage({ type: 'OFFLINE_STATUS' });
    }).catch(() => { if (live) setCacheState('failed'); });
    return () => {
      live = false;
      workers.removeEventListener('message', receive);
      workers.removeEventListener('controllerchange', request);
      cleanup.forEach((dispose) => dispose());
    };
  }, [development]);

  const Icon = offline ? WifiOff : Wifi;
  const label = development ? '本地预览' : !supported ? '离线缓存不可用' : cacheState === 'ready' ? (offline ? '离线可读' : '已缓存') : offline ? '离线缓存未确认' : cacheState === 'failed' ? '离线缓存未完成' : '准备离线缓存';
  return (
    <div
      className="offline-mark"
      data-offline={offline}
      title={cacheState === 'ready' ? '离线资源已完整缓存' : '尚未确认离线资源完整缓存'}
    >
      <Icon aria-hidden="true" size={15} />
      <span>{label}</span>
    </div>
  );
}
