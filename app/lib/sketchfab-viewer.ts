export interface SketchfabCamera { position: number[]; target: number[] }
export interface SketchfabApi {
  start(): void;
  stop(): void;
  addEventListener(event: string, callback: () => void): void;
  getCameraLookAt(callback: (error: unknown, camera: SketchfabCamera) => void): void;
  setCameraLookAt(position: number[], target: number[], duration: number): void;
}
interface ViewerOptions {
  success(api: SketchfabApi): void;
  error(): void;
  autostart: number;
  autospin: number;
  animation_autoplay: number;
  camera: number;
  dnt: number;
}
export interface SketchfabConstructor {
  new (iframe: HTMLIFrameElement): { init(modelId: string, options: ViewerOptions): void };
}

type ViewerWindow = Window & { Sketchfab?: SketchfabConstructor };
const sdkUrl = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
let loading: Promise<SketchfabConstructor> | undefined;

export function loadSketchfabViewer(): Promise<SketchfabConstructor> {
  const host = window as ViewerWindow;
  if (host.Sketchfab) return Promise.resolve(host.Sketchfab);
  if (loading) return loading;
  loading = new Promise<SketchfabConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error('Sketchfab viewer unavailable'));
    };
    const timer = setTimeout(fail, 15000);
    script.src = sdkUrl;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timer);
      if (host.Sketchfab) resolve(host.Sketchfab);
      else fail();
    };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
