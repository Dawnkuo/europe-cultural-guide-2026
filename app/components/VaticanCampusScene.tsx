'use client';

import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vaticanCampusRegions } from '../data/vatican-campus';
import { campusMeshFocus, campusToScene, vaticanRegistration } from '../data/vatican-registration';
import { loadVaticanCampusModel } from '../lib/vatican-campus-model';
import { projectedHalfHeight } from '../lib/orthographic-framing';

type Controls = { focus: (id: string) => void; reset: () => void; zoom: (factor: number) => void; pan: (x: number, y: number) => void };

export default function VaticanCampusScene({ selectedId, focusSerial, onFallback, kind = 'campus' }: {
  selectedId: string;
  focusSerial: number;
  onFallback: () => void;
  kind?: 'campus' | 'library';
}) {
  const isLibrary = kind === 'library';
  const labels = isLibrary
    ? { name: '图书馆横翼剖切', zoom: '图书馆剖切缩放比例', smaller: '缩小图书馆剖切', larger: '放大图书馆剖切', reset: '显示完整图书馆剖切', application: '图书馆横翼三维剖切' }
    : { name: '馆区空间', zoom: '三维馆区缩放比例', smaller: '缩小三维馆区', larger: '放大三维馆区', reset: '显示完整三维馆区', application: '梵蒂冈馆区三维地图' };
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Controls | null>(null);
  const selection = useRef({ selectedId, focusSerial });
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    selection.current = { selectedId, focusSerial };
    if (focusSerial > 0) api.current?.focus(selectedId);
  }, [selectedId, focusSerial]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const container: HTMLDivElement = element;
    const abort = new AbortController();
    let disposed = false;
    let frame = 0;
    let visible = true;
    let resource: Awaited<ReturnType<typeof loadVaticanCampusModel>> | undefined;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch {
      queueMicrotask(() => { if (!disposed) setStatus('failed'); });
      return () => { disposed = true; abort.abort(); };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset.model = isLibrary ? 'sistine-library-transverse-cutaway' : vaticanRegistration.scope;
    canvas.dataset.frames = '0';
    container.insertBefore(canvas, container.firstChild);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#061019');
    scene.add(new THREE.HemisphereLight(0xffffff, 0x567183, 2.4));
    const sun = new THREE.DirectionalLight(0xfff3df, 2.5);
    sun.position.set(-200, 600, 400);
    scene.add(sun);
    const areaMarker = new THREE.Mesh(new THREE.RingGeometry(4, 6, 48), new THREE.MeshBasicMaterial({ color: '#f0d184', side: THREE.DoubleSide, toneMapped: false }));
    areaMarker.rotation.x = -Math.PI / 2;
    scene.add(areaMarker);
    const camera = new THREE.OrthographicCamera(-400, 400, 400, -400, .1, 5000);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;
    controls.minZoom = 1;
    controls.maxZoom = 8;
    controls.maxPolarAngle = Math.PI / 2 - .06;
    controls.minPolarAngle = .05;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = true;
    let completeBounds = new THREE.Box3();
    let reframing = false;

    function invalidate() {
      if (disposed || frame || !visible || document.hidden || !resource || renderer.getContext().isContextLost()) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (disposed || !visible || document.hidden) return;
        renderer.render(scene, camera);
        canvas.dataset.frames = String(Number(canvas.dataset.frames) + 1);
        canvas.dataset.camera = camera.position.toArray().map(n => n.toFixed(2)).join(',');
        canvas.dataset.target = controls.target.toArray().map(n => n.toFixed(2)).join(',');
        canvas.dataset.zoom = String(camera.zoom);
        canvas.dataset.drawCalls = String(renderer.info.render.calls);
        canvas.dataset.triangles = String(renderer.info.render.triangles);
        setZoom(camera.zoom);
      });
    }

    function updateFrustum() {
      if (completeBounds.isEmpty() || !container.clientHeight || !container.clientWidth) return;
      const aspect = container.clientWidth / container.clientHeight;
      const halfHeight = projectedHalfHeight(completeBounds, camera.quaternion, aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    }
    function fit(box: THREE.Box3, home = false, preferredDirection?: THREE.Vector3) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height || box.isEmpty()) return;
      const center = box.getCenter(new THREE.Vector3());
      const direction = preferredDirection ?? (home
        ? width < 640 ? new THREE.Vector3(1, 1.1, .15) : new THREE.Vector3(-.45, 1, .75)
        : camera.position.clone().sub(controls.target));
      camera.position.copy(center).add(direction.normalize().multiplyScalar(1800));
      camera.up.set(0, 1, 0);
      camera.lookAt(center);
      camera.updateMatrixWorld(true);
      const aspect = width / height;
      updateFrustum();
      camera.zoom = THREE.MathUtils.clamp(camera.top / projectedHalfHeight(box, camera.quaternion, aspect), 1, 8);
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.update();
      invalidate();
    }

    function reset() {
      if (resource) fit(completeBounds, true);
      canvas.dataset.focus = 'campus';
    }
    function mark(id: string) {
      if (isLibrary) { areaMarker.visible = false; return; }
      const region = vaticanCampusRegions.find(r => r.id === id)!;
      const meshFocus = campusMeshFocus[id];
      if (meshFocus) {
        areaMarker.visible = Boolean(meshFocus.marker && resource);
        if (meshFocus.marker && resource) areaMarker.position.set(...meshFocus.marker).applyMatrix4(resource.mesh.matrixWorld);
        return;
      }
      const [x, z] = campusToScene(region.at);
      areaMarker.position.set(x, vaticanRegistration.displayPlaneY + .15, z);
      areaMarker.visible = true;
    }
    function focus(id: string) {
      if (!resource || isLibrary) return;
      const region = vaticanCampusRegions.find(r => r.id === id);
      if (!region) return;
      mark(id);
      let box: THREE.Box3;
      const meshFocus = campusMeshFocus[id];
      if (meshFocus) {
        box = new THREE.Box3(
          new THREE.Vector3(...meshFocus.min), new THREE.Vector3(...meshFocus.max),
        ).applyMatrix4(resource.mesh.matrixWorld);
      } else {
        // Camera framing around a documented area anchor, not an inferred room/roof boundary.
        const [x, z] = campusToScene(region.at);
        box = new THREE.Box3(new THREE.Vector3(x - 65, -28, z - 65), new THREE.Vector3(x + 65, -28, z + 65));
      }
      const direction = meshFocus?.direction && new THREE.Vector3(...meshFocus.direction).transformDirection(resource.mesh.matrixWorld);
      fit(box, false, direction);
      canvas.dataset.focus = id;
    }
    api.current = {
      focus, reset,
      zoom(factor) { camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, 1, 8); camera.updateProjectionMatrix(); controls.update(); onControlsChange(); },
      pan(x, y) {
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        const move = right.multiplyScalar(x * (camera.right - camera.left) / camera.zoom).add(up.multiplyScalar(y * (camera.top - camera.bottom) / camera.zoom));
        camera.position.add(move); controls.target.add(move); controls.update(); invalidate();
      },
    };
    function onControlsChange() {
      if (reframing || completeBounds.isEmpty()) return;
      reframing = true;
      updateFrustum();
      if (camera.zoom <= 1.00001) {
        camera.zoom = 1;
        const offset = camera.position.clone().sub(controls.target);
        controls.target.copy(completeBounds.getCenter(new THREE.Vector3()));
        camera.position.copy(controls.target).add(offset);
        camera.updateProjectionMatrix();
        controls.update();
        canvas.dataset.focus = 'campus';
      }
      reframing = false;
      invalidate();
    }
    controls.addEventListener('change', onControlsChange);
    const resize = new ResizeObserver(() => {
      if (disposed) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (resource) onControlsChange();
    });
    resize.observe(container);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) invalidate(); });
    observer.observe(container);
    document.addEventListener('visibilitychange', invalidate);
    const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) { api.current = null; setStatus('failed'); } };
    canvas.addEventListener('webglcontextlost', contextLost);
    const loading = isLibrary
      ? import('../lib/vatican-library-model').then(({ buildVaticanLibraryModel }) => {
        abort.signal.throwIfAborted(); return buildVaticanLibraryModel();
      })
      : loadVaticanCampusModel(abort.signal);
    void loading.then(result => {
      if (disposed) { result.dispose(); return; }
      resource = result;
      scene.add(result.model);
      completeBounds = new THREE.Box3().setFromObject(result.model);
      renderer.setSize(container.clientWidth, container.clientHeight);
      mark(selection.current.selectedId);
      reset();
      if (selection.current.focusSerial > 0) focus(selection.current.selectedId);
      setStatus('ready');
      invalidate();
    }).catch(() => { if (!disposed) setStatus('failed'); });

    return () => {
      disposed = true;
      abort.abort();
      api.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect(); observer.disconnect();
      document.removeEventListener('visibilitychange', invalidate);
      canvas.removeEventListener('webglcontextlost', contextLost);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose(); resource?.dispose(); areaMarker.geometry.dispose(); areaMarker.material.dispose();
      scene.clear(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, [attempt, isLibrary]);

  const selected = vaticanCampusRegions.find(region => region.id === selectedId)!;
  return <div className="vatican-campus__three" data-status={status}>
    <div className="vatican-campus__tools">
      <span>{labels.name}</span><output aria-label={labels.zoom}>{Math.round(zoom * 100)}%</output>
      <button type="button" aria-label={labels.smaller} title={labels.smaller} disabled={status !== 'ready' || zoom <= 1} onClick={() => api.current?.zoom(1 / 1.3)}><ZoomOut /></button>
      <button type="button" aria-label={labels.larger} title={labels.larger} disabled={status !== 'ready' || zoom >= 8} onClick={() => api.current?.zoom(1.3)}><ZoomIn /></button>
      <button type="button" aria-label={labels.reset} title={labels.reset} disabled={status !== 'ready'} onClick={() => api.current?.reset()}><RotateCcw /></button>
    </div>
    {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- Keyboard map controls accompany OrbitControls pointer/touch controls. */}
    <div ref={host} className="vatican-campus__three-stage" role="application" aria-label={labels.application} tabIndex={0} onKeyDown={event => {
      if (event.target !== event.currentTarget || status !== 'ready') return;
      if (event.key === '+' || event.key === '=') api.current?.zoom(1.3);
      else if (event.key === '-') api.current?.zoom(1 / 1.3);
      else if (event.key === 'Home' || event.key === '0') api.current?.reset();
      else if (event.key === 'ArrowLeft') api.current?.pan(-.08, 0);
      else if (event.key === 'ArrowRight') api.current?.pan(.08, 0);
      else if (event.key === 'ArrowUp') api.current?.pan(0, .08);
      else if (event.key === 'ArrowDown') api.current?.pan(0, -.08);
      else return;
      event.preventDefault();
    }}>
      {status === 'loading' && <output className="vatican-campus__failure">正在载入馆区模型…</output>}
      {status === 'failed' && <div className="vatican-campus__failure" role="alert"><p>三维馆区暂不可用，二维地图与区域列表仍可查看。</p><button type="button" onClick={() => { setStatus('loading'); setAttempt(a => a + 1); }}>重试三维馆区</button><button type="button" onClick={onFallback}>返回二维馆区</button></div>}
      {status === 'ready' && <span className="vatican-campus__three-selected" data-campus-region={selectedId}>{isLibrary ? labels.name : selected.name}</span>}
    </div>
    {!isLibrary && <p className="vatican-campus__scope">立体范围包含圣彼得大教堂、广场和西斯廷礼拜堂外观；博物馆其他馆翼与教宗宫尚未完整重建。</p>}
  </div>;
}
