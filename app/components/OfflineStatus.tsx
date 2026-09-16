'use client';

import { Download, RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { withBasePath } from '../lib/paths';
import './offline-status.css';

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

function subscribeToCapabilities() {
  return () => {};
}
function supportsOffline() {
  return 'serviceWorker' in navigator;
}

export function OfflineStatus() {
  const titleId = useId();
  const online = useSyncExternalStore(
    subscribeToConnectivity,
    getConnectivitySnapshot,
    () => true,
  );
  const offline = !online;
  const supported = useSyncExternalStore(
    subscribeToCapabilities,
    supportsOffline,
    () => true,
  );
  const development = process.env.NODE_ENV === 'development';
  const [cacheState, setCacheState] = useState<'checking' | 'ready' | 'failed'>(
    'checking',
  );
  const [progress, setProgress] = useState({
    completed: 0,
    total: 0,
    version: '',
    savedAt: '',
  });
  const [attempt, setAttempt] = useState(0);
  const panel = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const wasOnline = useRef(online);

  useEffect(() => {
    if (!wasOnline.current && online && cacheState !== 'ready') setAttempt(value => value + 1);
    wasOnline.current = online;
  }, [online, cacheState]);

  useEffect(() => {
    if (development) return;
    if (!('serviceWorker' in navigator)) return;
    let live = true;
    let installing = false;
    const cleanup: Array<() => void> = [];
    const workers = navigator.serviceWorker;
    const receive = (event: MessageEvent) => {
      if (!live) return;
      const data = event.data;
      if (data?.type !== 'OFFLINE_STATUS' && data?.type !== 'OFFLINE_PROGRESS')
        return;
      if (installing && event.source && event.source !== registrationRef.current?.installing) return;
      if (
        typeof data.completed === 'number' &&
        typeof data.total === 'number'
      ) {
        setProgress({
          completed: data.completed,
          total: data.total,
          version: data.version ?? '',
          savedAt: data.savedAt ?? '',
        });
      }
      if (data.type === 'OFFLINE_PROGRESS') {
        setCacheState(
          data.phase === 'ready'
            ? 'ready'
            : data.phase === 'failed'
              ? 'failed'
              : 'checking',
        );
      } else if (!installing) {
        setCacheState(
          data.phase === 'downloading'
            ? 'checking'
            : data.phase === 'failed'
              ? 'failed'
              : data.ready
                ? 'ready'
                : 'failed',
        );
      }
    };
    const target = () => registrationRef.current?.installing ?? registrationRef.current?.waiting ?? registrationRef.current?.active ?? workers.controller;
    const request = () => target()?.postMessage({ type: 'OFFLINE_STATUS' });
    workers.addEventListener('message', receive);
    workers.addEventListener('controllerchange', request);
    void workers
      .register(withBasePath('/sw.js'))
      .then(async (registered) => {
        if (!live) return;
        registrationRef.current = registered;
        let watched: ServiceWorker | null = null;
        const watch = () => {
          const worker = registered.installing;
          if (!worker || worker === watched) return;
          watched = worker;
          installing = true;
          setCacheState('checking');
          const change = () => {
            if (live && worker.state === 'redundant') setCacheState('failed');
            if (worker.state === 'activated') {
              installing = false;
              if (live) request();
            }
          };
          worker.addEventListener('statechange', change);
          cleanup.push(() => worker.removeEventListener('statechange', change));
        };
        registered.addEventListener('updatefound', watch);
        cleanup.push(() =>
          registered.removeEventListener('updatefound', watch),
        );
        watch();
        if (attempt > 0) {
          if (!registered.installing) await registered.update();
          if (!live) return;
          watch();
          target()?.postMessage({ type: 'OFFLINE_RETRY' });
        }
        request();
        const registration = await workers.ready;
        if (live && !installing) registration.active?.postMessage({ type: 'OFFLINE_STATUS' });
      })
      .catch(() => {
        if (live) setCacheState('failed');
      });
    return () => {
      live = false;
      workers.removeEventListener('message', receive);
      workers.removeEventListener('controllerchange', request);
      cleanup.forEach((dispose) => dispose());
    };
  }, [development, attempt]);

  function retry() {
    setCacheState('checking');
    setAttempt((value) => value + 1);
  }

  const Icon = offline ? WifiOff : Wifi;
  const label = development
    ? '本地预览'
    : !supported
      ? '离线缓存不可用'
      : cacheState === 'ready'
        ? offline
          ? '离线可读'
          : '已缓存'
        : offline
          ? '离线缓存未确认'
          : cacheState === 'failed'
            ? '离线缓存未完成'
            : '准备离线缓存';
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="offline-mark"
        data-offline={offline}
        aria-label={`离线导览：${label}`}
        aria-haspopup="dialog"
        onClick={() => panel.current?.showModal()}
        title={
          cacheState === 'ready'
            ? '离线资源已完整缓存'
            : '尚未确认离线资源完整缓存'
        }
      >
        <Icon aria-hidden="true" size={15} />
        <span>{label}</span>
      </button>
      <dialog
        ref={panel}
        className="offline-panel"
        aria-labelledby={titleId}
        onClose={() => trigger.current?.focus()}
      >
        <header>
          <h2 id={titleId}>离线导览</h2>
          <button
            type="button"
            aria-label="关闭离线状态"
            title="关闭"
            onClick={() => panel.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        <p className="offline-panel-status" aria-live="polite">
          <Icon size={20} />
          {label}
        </p>
        {development ? (
          <p>开发预览不安装缓存。离线验证使用本地生产版本。</p>
        ) : !supported ? (
          <p>当前浏览器不支持离线缓存。</p>
        ) : (
          <>
            {progress.total > 0 && (
              <>
                <progress
                  max={progress.total}
                  value={progress.completed}
                  aria-label="离线资源下载进度"
                />
                <p className="offline-count">
                  {progress.completed.toLocaleString()} /{' '}
                  {progress.total.toLocaleString()} 项资源
                </p>
              </>
            )}
            <p>
              {cacheState === 'ready'
                ? '行程、景点文字、图片和地图已保存到此设备，可断网访问。浏览器清理网站数据后需要重新下载。'
                : cacheState === 'failed'
                  ? '下载未完成，已保存的文件会保留。联网后继续下载缺失资源；若仍失败，请检查设备可用空间。'
                  : '正在保存缺失的离线资源，已完成的文件无需重复下载。'}
            </p>
            {progress.savedAt && (
              <p className="offline-count">
                保存时间：{new Date(progress.savedAt).toLocaleString('zh-CN')}
              </p>
            )}
            {progress.version && (
              <p className="offline-version">{progress.version}</p>
            )}
            <button
              className="offline-retry"
              type="button"
              disabled={!online || cacheState === 'checking'}
              onClick={retry}
            >
              {cacheState === 'failed' ? (
                <Download size={18} />
              ) : (
                <RefreshCw size={18} />
              )}
              {cacheState === 'failed' ? progress.completed > 0 ? '继续下载' : '重试下载' : cacheState === 'checking' ? '正在下载' : '检查更新'}
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
