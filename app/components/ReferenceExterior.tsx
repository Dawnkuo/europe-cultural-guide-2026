'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ExternalLink, LoaderCircle, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { referenceLicenseUrl, type ExteriorReference } from '../data/exterior-references';
import { loadSketchfabViewer, type SketchfabApi, type SketchfabCamera } from '../lib/sketchfab-viewer';
import './reference-exterior.css';

function subscribeOnline(notify: () => void) {
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
  return () => { window.removeEventListener('online', notify); window.removeEventListener('offline', notify); };
}

export function ReferenceExterior({ model, usage = 'trial', fallback }: { model: ExteriorReference; usage?: 'trial' | 'guide'; fallback?: ReactNode }) {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [attempt, setAttempt] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const markUnavailable = useCallback(() => setUnavailable(true), []);
  if (fallback && (!online || unavailable)) return <div data-reference-fallback={online ? 'load-error' : 'offline'}>
    <output className="reference-exterior__fallback-status">
      <WifiOff size={16} aria-hidden="true" /><span>{online ? '在线模型暂不可用，使用原有本地模型。' : '当前离线，使用原有本地模型；未缓存时仅保留导览内容。'}</span>
      {online && <button type="button" aria-label="重试在线模型" title="重试在线模型" onClick={() => setUnavailable(false)}><RotateCcw size={18} aria-hidden="true" /></button>}
    </output>
    {fallback}
  </div>;
  return <section className={`reference-exterior${usage === 'guide' ? ' reference-exterior--guide' : ''}`} aria-label={`${model.title}现成模型`}>
    <header className="reference-exterior__heading">
      <strong>{model.scope}</strong>
      <span><Wifi size={15} aria-hidden="true" />联网预览 · 不含离线文件</span>
    </header>
    {online ? <RemoteViewer key={`${model.id}-${attempt}`} model={model} onFailure={fallback ? markUnavailable : undefined} onRetry={() => setAttempt(value => value + 1)} /> : <output className="reference-exterior__unavailable">
      <WifiOff size={28} aria-hidden="true" /><span>当前离线，在线模型不可用。</span>
    </output>}
    <footer className="reference-exterior__credits">
      <p><a href={model.sourceUrl} target="_blank" rel="noreferrer">{model.modelName}</a> · <a href={model.authorUrl} target="_blank" rel="noreferrer">{model.author}</a> · <a href={referenceLicenseUrl(model)} target="_blank" rel="noreferrer">{model.license}</a></p>
      <p>{model.triangles.toLocaleString('zh-CN')} 三角面 · {model.published} 发布 · Sketchfab</p>
      <details><summary>模型范围与来源</summary><p>{model.note}</p><p>在线模型单独展示，未与街道或室内地图配准。{usage === 'guide' ? '原有本地模型保留，用于离线、加载失败和回滚。' : '原有本地模型未替换。'}本次未减面。</p></details>
    </footer>
  </section>;
}

function RemoteViewer({ model, onRetry, onFailure }: { model: ExteriorReference; onRetry: () => void; onFailure?: () => void }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<SketchfabApi | undefined>(undefined);
  const cameraRef = useRef<SketchfabCamera | undefined>(undefined);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let live = true;
    const fail = () => {
      if (!live) return;
      clearTimeout(timeout); setState('error'); onFailure?.();
    };
    const timeout = setTimeout(fail, 60000);
    void loadSketchfabViewer().then(Sketchfab => {
      if (!live || !iframe.current) return;
      new Sketchfab(iframe.current).init(model.modelId, {
        autostart: 1, autospin: 0, animation_autoplay: 0, camera: 0, dnt: 1,
        success(api) {
          if (!live) { api.stop(); return; }
          apiRef.current = api;
          const recordCamera = () => api.getCameraLookAt((error, camera) => {
            if (!live || error) return;
            cameraRef.current ??= camera;
            if (iframe.current) iframe.current.dataset.camera = JSON.stringify(camera);
          });
          api.addEventListener('viewerready', () => {
            if (!live) return;
            clearTimeout(timeout); setState('ready'); recordCamera();
          });
          api.addEventListener('camerastop', recordCamera);
          api.start();
        },
        error: fail,
      });
    }).catch(fail);
    return () => { live = false; clearTimeout(timeout); apiRef.current?.stop(); apiRef.current = undefined; };
  }, [model.modelId, onFailure]);
  return <div className="reference-exterior__viewport" data-model-id={model.modelId} data-state={state}>
    <iframe ref={iframe} title={`${model.title} · Sketchfab 3D`} allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    {state === 'ready' && <button className="reference-exterior__reset" type="button" title="重置模型视角" aria-label="重置模型视角" onClick={() => {
      const camera = cameraRef.current;
      if (camera) apiRef.current?.setCameraLookAt(camera.position, camera.target, 0);
    }}><RotateCcw size={18} aria-hidden="true" /></button>}
    {state === 'loading' && <output className="reference-exterior__loading"><LoaderCircle size={24} aria-hidden="true" /><span>正在加载在线模型</span></output>}
    {state === 'error' && <div className="reference-exterior__unavailable" role="alert">
      <p>在线模型暂时无法加载。</p><div>
        <button type="button" onClick={onRetry}><RotateCcw size={18} aria-hidden="true" />重试</button>
        <a href={model.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} aria-hidden="true" />打开来源页</a>
      </div>
    </div>}
  </div>;
}
