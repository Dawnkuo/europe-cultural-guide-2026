'use client';

import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { placeRoomLabels, planTones, spaceForFeature, spaceForPlace, type ArchitecturalPlan, type MapPoint } from '../lib/architectural-plan';
import { isPlanAnchorVisible } from '../lib/architectural-visibility';

type Props = {
  plan: ArchitecturalPlan;
  floorId: string;
  selected?: string;
  command: { id: number; action: string };
  onSelect: (id: string) => void;
  onFailure: () => void;
};

export default function ArchitecturalScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const redraw = useRef<() => void>(() => {});
  const execute = useRef<(action: string) => void>(() => {});
  const labelNodes = useRef(new Map<string, HTMLButtonElement>());
  const leaderNodes = useRef(new Map<string, SVGLineElement>());
  const labelDrag = useRef(false);

  useEffect(() => { latest.current = props; redraw.current(); }, [props]);
  useEffect(() => { execute.current(props.command.action); }, [props.command]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    let cleanup = () => {};
    const plan = props.plan;
    void Promise.all([
      import('three'),
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/utils/BufferGeometryUtils.js'),
      import('three-mesh-bvh'),
    ]).then(([Three, { OrbitControls: Controls }, { mergeGeometries }, { MeshBVH, acceleratedRaycast, disposeBoundsTree }]) => {
      if (cancelled) return;
      const disposers: Array<() => void> = [];
      const liveGeometries = new Set<THREE.BufferGeometry>();
      cleanup = () => {
        disposers.splice(0).reverse().forEach((dispose) => dispose());
        liveGeometries.forEach((geometry) => { disposeBoundsTree.call(geometry); geometry.dispose(); });
        liveGeometries.clear();
        redraw.current = () => {}; execute.current = () => {};
      };
      const renderer = new Three.WebGLRenderer({ antialias: true, alpha: false });
      disposers.push(() => { renderer.dispose(); renderer.domElement.remove(); });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor('#061019');
      container.insertBefore(renderer.domElement, container.firstChild);
      const canvas = renderer.domElement;
      canvas.tabIndex = 0;
      canvas.setAttribute('aria-label', '分层室内地图，方向键旋转，加减键缩放');
      const scene = new Three.Scene();
      scene.add(new Three.AmbientLight(0xffffff, 1.7));
      const light = new Three.DirectionalLight(0xfff1d0, 2.2);
      light.position.set(-12, 28, 14);
      scene.add(light);
      const camera = new Three.OrthographicCamera(-12,12,12,-12,.1,200);
      let controls: OrbitControls;
      const floors = [...plan.floors].sort((a,b) => a.order-b.order);
      const largestSpan = Math.max(...floors.map((f) => Math.max(f.bounds[2]-f.bounds[0], f.bounds[3]-f.bounds[1])));
      const scale = 16/largestSpan;
      const projectPoint = (floorId: string, [x,y]: MapPoint, lift = 0) => {
        const index = floors.findIndex((f) => f.id === floorId), floor = floors[index];
        return new Three.Vector3((x-(floor.bounds[0]+floor.bounds[2])/2)*scale+index*.7, index*7.5+lift,
          (y-(floor.bounds[1]+floor.bounds[3])/2)*scale+index*.4);
      };
      const materials: Array<{ floorId: string; material: THREE.MeshStandardMaterial; kind: string; color: THREE.Color; spaceId?: string }> = [];
      for (const floor of floors) {
        const buckets = new Map<string, THREE.BufferGeometry[]>();
        for (const feature of floor.features) {
          for (const polygon of feature.polygons) {
            const shape = new Three.Shape(polygon.outer.map(([x,y]) => new Three.Vector2(x,y)));
            for (const ring of polygon.holes) shape.holes.push(new Three.Path(ring.map(([x,y]) => new Three.Vector2(x,y))));
            const depth = feature.kind === 'wall' ? .11/scale : .012/scale;
            const geometry = new Three.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1, curveSegments: 6 });
            liveGeometries.add(geometry);
            const position = geometry.getAttribute('position');
            for (let i = 0; i < position.count; i++) {
              const p = projectPoint(floor.id,[position.getX(i),position.getY(i)],position.getZ(i)*scale + (feature.kind === 'surface' ? .002 : .018));
              position.setXYZ(i,p.x,p.y,p.z);
            }
            geometry.computeVertexNormals();
            const space = spaceForFeature(plan, feature.id);
            const key = `${feature.kind}:${feature.tone}:${space?.id ?? ''}`;
            if (!buckets.has(key)) buckets.set(key,[]);
            buckets.get(key)!.push(geometry);
          }
        }
        for (const [key, parts] of buckets) {
          const geometry = mergeGeometries(parts, false);
          parts.forEach((part) => { part.dispose(); liveGeometries.delete(part); });
          if (!geometry) throw new Error('Cannot merge architectural geometry');
          liveGeometries.add(geometry);
          geometry.boundsTree = new MeshBVH(geometry);
          const [kind,tone,spaceId] = key.split(':');
          const material = new Three.MeshStandardMaterial({ color: planTones[tone] ?? '#b9a67d', side: Three.DoubleSide, roughness: 1,
            transparent: true, opacity: 1, depthWrite: true });
          disposers.push(() => material.dispose());
          const mesh = new Three.Mesh(geometry,material);
          mesh.raycast = acceleratedRaycast;
          mesh.userData.floorId = floor.id;
          mesh.userData.spaceId = spaceId;
          scene.add(mesh);
          materials.push({ floorId: floor.id, material, kind, color: material.color.clone(), spaceId });
        }
      }
      const connections = plan.verticalLinks.map((link) => {
        const from = plan.places.find((place) => place.id === link.fromPlaceId)!;
        const to = plan.places.find((place) => place.id === link.toPlaceId)!;
        const geometry = new Three.BufferGeometry().setFromPoints([projectPoint(from.floorId, from.at, .14), projectPoint(to.floorId, to.at, .14)]);
        liveGeometries.add(geometry);
        const material = new Three.LineDashedMaterial({ color: '#e8bd5e', dashSize: .12, gapSize: .08, transparent: true, opacity: .3 });
        disposers.push(() => material.dispose());
        const line = new Three.Line(geometry, material); line.computeLineDistances(); scene.add(line);
        return { link, material };
      });
      const bounds = new Three.Box3().setFromObject(scene);
      const center = bounds.getCenter(new Three.Vector3());
      let selectedId: string | undefined;
      const labelRaycaster = new Three.Raycaster();
      labelRaycaster.firstHitOnly = true;
      const occluders = scene.children.filter((object) => object instanceof Three.Mesh);
      const draw = () => {
        if (cancelled) return;
        const started = performance.now();
        const { floorId, selected } = latest.current;
        const selectedSpace = spaceForPlace(plan, selected);
        for (const record of materials) {
          record.material.opacity = record.floorId === floorId ? 1 : (record.kind === 'surface' ? .5 : .65);
          record.material.color.copy(record.color);
          if (record.spaceId && record.spaceId === selectedSpace?.id) record.material.color.set('#b99443');
        }
        for (const { link, material } of connections) material.opacity = selected === link.fromPlaceId || selected === link.toPlaceId ? 1 : .3;
        if (selected && selected !== selectedId) {
          const place = plan.places.find((p) => p.id === selected);
          if (place) {
            const target = projectPoint(place.floorId,place.at,.1);
            const delta = target.clone().sub(controls.target);
            camera.position.add(delta);
            controls.target.copy(target);
          }
          selectedId = selected;
        }
        camera.lookAt(controls.target);
        camera.updateMatrixWorld();
        renderer.render(scene,camera);
        const width = container.clientWidth, height = container.clientHeight;
        const points = plan.places.filter((place) => place.floorId === floorId).flatMap((place) => {
          const anchor = projectPoint(place.floorId,place.at,.14);
          const visible = isPlanAnchorVisible(anchor,camera,occluders,labelRaycaster);
          const button = labelNodes.current.get(place.id);
          if (button) { button.style.visibility = visible ? 'visible' : 'hidden'; button.tabIndex = visible ? 0 : -1; }
          const leader = leaderNodes.current.get(place.id);
          if (leader) leader.style.visibility = visible ? 'visible' : 'hidden';
          if (!visible) return [];
          const point = anchor.project(camera);
          return { ...place, at: [(point.x+1)*width/2, (1-point.y)*height/2] as MapPoint };
        });
        for (const place of placeRoomLabels(points,1,[width,height])) {
          const button = labelNodes.current.get(place.id);
          if (button) button.style.transform = `translate(${place.displayAt[0]}px,${place.displayAt[1]}px) translate(-50%,-50%)`;
          const leader = leaderNodes.current.get(place.id);
          if (leader) {
            leader.setAttribute('x1',String(place.at[0])); leader.setAttribute('y1',String(place.at[1]));
            leader.setAttribute('x2',String(place.displayAt[0])); leader.setAttribute('y2',String(place.displayAt[1]));
          }
        }
        if (process.env.NODE_ENV === 'development') {
          container.dataset.renderMs = (performance.now()-started).toFixed(2);
          container.dataset.drawCalls = String(renderer.info.render.calls);
          container.dataset.triangles = String(renderer.info.render.triangles);
          container.dataset.visibleLabels = String(points.length);
        }
      };
      const connect = () => {
        // The labels share the input surface: dragging a label must still orbit.
        controls = new Controls(camera,container);
        controls.enableDamping = false;
        controls.minPolarAngle = .15;
        controls.maxPolarAngle = Math.PI*.47;
        controls.minZoom = .5;
        controls.maxZoom = 5;
        controls.target.copy(center);
        controls.addEventListener('change',draw);
      };
      connect();
      disposers.push(() => controls.dispose());
      const fit = () => {
        controls.target.copy(center);
        camera.position.copy(center).add(new Three.Vector3(18,28,27));
        camera.lookAt(center);
        camera.updateMatrixWorld();
        const size = bounds.getSize(new Three.Vector3());
        let halfWidth = 0, halfHeight = 0;
        for (const x of [-.5,.5]) for (const y of [-.5,.5]) for (const z of [-.5,.5]) {
          const corner = center.clone().add(new Three.Vector3(x*size.x,y*size.y,z*size.z)).applyMatrix4(camera.matrixWorldInverse);
          halfWidth = Math.max(halfWidth,Math.abs(corner.x)); halfHeight = Math.max(halfHeight,Math.abs(corner.y));
        }
        const aspect = container.clientWidth/container.clientHeight;
        const half = Math.max(halfHeight,halfWidth/aspect)*1.15;
        camera.left = -half*aspect; camera.right = half*aspect; camera.top = half; camera.bottom = -half;
        camera.zoom = 1; camera.updateProjectionMatrix();
        selectedId = latest.current.selected;
        draw();
      };
      const recover = () => {
        const target = controls.target.clone();
        controls.dispose();
        connect();
        controls.target.copy(target);
        draw();
      };
      const command = (action: string) => {
        if (action === 'reset') { recover(); fit(); return; }
        camera.zoom = Math.min(5,Math.max(.5,camera.zoom*(action === 'in' ? 1.3 : 1/1.3)));
        camera.updateProjectionMatrix(); draw();
      };
      execute.current = command;
      redraw.current = draw;
      const resize = () => {
        if (cancelled || !container.isConnected) return;
        if (!container.clientWidth || !container.clientHeight) return;
        renderer.setSize(container.clientWidth,container.clientHeight,false); fit();
        if (process.env.NODE_ENV === 'development') {
          // Read the same scene/camera on the GPU, without preserving the main
          // drawing buffer or adding a continuous animation loop in production.
          const target = new Three.WebGLRenderTarget(64,64);
          const previous = renderer.getRenderTarget();
          try {
            renderer.setRenderTarget(target); renderer.render(scene,camera);
            const pixels = new Uint8Array(64*64*4);
            renderer.readRenderTargetPixels(target,0,0,64,64,pixels);
            let visible = 0;
            for (let i=0;i<pixels.length;i+=4) if (Math.abs(pixels[i]-pixels[0])+Math.abs(pixels[i+1]-pixels[1])+Math.abs(pixels[i+2]-pixels[2])>12) visible++;
            container.dataset.visibleSamples = String(visible);
          } finally { renderer.setRenderTarget(previous); target.dispose(); }
        }
      };
      const observer = new ResizeObserver(resize); observer.observe(container);
      disposers.push(() => observer.disconnect());
      const pointers = new Set<number>();
      let pointerOrigin = [0, 0];
      const down = (event: PointerEvent) => {
        pointers.add(event.pointerId); pointerOrigin = [event.clientX, event.clientY]; labelDrag.current = false;
      };
      const move = (event: PointerEvent) => {
        if (pointers.has(event.pointerId) && Math.hypot(event.clientX - pointerOrigin[0], event.clientY - pointerOrigin[1]) > 5) labelDrag.current = true;
      };
      const release = (event: PointerEvent) => { pointers.delete(event.pointerId); };
      const interrupt = () => {
        const ids = [...pointers]; pointers.clear();
        ids.forEach((id) => { if (container.hasPointerCapture(id)) container.releasePointerCapture(id); });
        recover();
      };
      const lost = (event: PointerEvent) => { if (pointers.has(event.pointerId)) interrupt(); };
      const visibility = () => { if (document.visibilityState === 'hidden') interrupt(); };
      const raycaster = new Three.Raycaster();
      raycaster.firstHitOnly = true;
      const click = (event: MouseEvent) => {
        if (labelDrag.current || (event.target as Element).closest('button')) return;
        const rect = canvas.getBoundingClientRect();
        raycaster.setFromCamera(new Three.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);
        // Respect opaque geometry: do not select an interior through another floor.
        const hit = raycaster.intersectObjects(scene.children,false).find((hit) => hit.object instanceof Three.Mesh);
        const space = plan.spaces?.find((s) => s.id === hit?.object.userData.spaceId && s.floorId === latest.current.floorId);
        if (space) latest.current.onSelect(space.placeId);
      };
      const key = (event: KeyboardEvent) => {
        if (['+','=','-'].includes(event.key)) { event.preventDefault(); command(event.key === '-' ? 'out' : 'in'); return; }
        if (!event.key.startsWith('Arrow')) return;
        event.preventDefault();
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new Three.Spherical().setFromVector3(offset);
        if (event.key === 'ArrowLeft') spherical.theta -= .12;
        if (event.key === 'ArrowRight') spherical.theta += .12;
        if (event.key === 'ArrowUp') spherical.phi -= .1;
        if (event.key === 'ArrowDown') spherical.phi += .1;
        spherical.phi = Math.min(Math.PI*.47,Math.max(.15,spherical.phi));
        camera.position.copy(controls.target).add(new Three.Vector3().setFromSpherical(spherical));
        controls.update(); draw();
      };
      const failure = (event: Event) => { event.preventDefault(); latest.current.onFailure(); };
      container.addEventListener('pointerdown',down);
      container.addEventListener('pointermove',move);
      container.addEventListener('click',click);
      window.addEventListener('pointerup',release,true);
      container.addEventListener('pointercancel',interrupt);
      container.addEventListener('lostpointercapture',lost);
      canvas.addEventListener('keydown',key);
      canvas.addEventListener('webglcontextlost',failure);
      window.addEventListener('blur',interrupt);
      document.addEventListener('visibilitychange',visibility);
      disposers.push(() => {
        container.removeEventListener('pointerdown',down); container.removeEventListener('pointermove',move); window.removeEventListener('pointerup',release,true);
        container.removeEventListener('click',click);
        container.removeEventListener('pointercancel',interrupt); container.removeEventListener('lostpointercapture',lost);
        canvas.removeEventListener('keydown',key); canvas.removeEventListener('webglcontextlost',failure);
        window.removeEventListener('blur',interrupt); document.removeEventListener('visibilitychange',visibility);
      });
      resize();
    }).catch(() => { cleanup(); if (!cancelled) latest.current.onFailure(); });
    return () => { cancelled = true; cleanup(); };
  }, [props.plan]);

  const places = props.plan.places.filter((place) => place.floorId === props.floorId);
  return <div ref={host} className="architectural-map__scene" data-active-floor={props.floorId}>
    <div className="architectural-map__scene-labels">
      <svg width="100%" height="100%" aria-hidden="true" style={{ position:'absolute',inset:0 }}>
        {places.map((place) => <line key={place.id} ref={(node) => { if (node) leaderNodes.current.set(place.id,node); else leaderNodes.current.delete(place.id); }} stroke="#d5ba76" strokeWidth="1" opacity=".6" />)}
      </svg>
      {places.map((place) => <button key={place.id} type="button" ref={(node) => { if (node) labelNodes.current.set(place.id,node); else labelNodes.current.delete(place.id); }}
        data-place-id={place.id} aria-label={`${place.label} ${place.name}`} aria-pressed={props.selected === place.id} onClick={(event) => { if (!labelDrag.current || event.detail === 0) props.onSelect(place.id); }}>{place.label}</button>)}
    </div>
  </div>;
}
