'use client';

import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { independentFloorScale, placeSceneLabels, planTones, spaceAtPoint, spaceForFeature, spaceForPlace, type ArchitecturalPlan, type MapPoint } from '../lib/architectural-plan';
import { isPlanAnchorVisible } from '../lib/architectural-visibility';
import { PlanPlaceMarker } from './PlanPlaceMarker';

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
      disposers.push(() => { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); });
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
      const projectPoint = (floorId: string, [x,y]: MapPoint, lift = 0) => {
        const index = floors.findIndex((f) => f.id === floorId), floor = floors[index];
        const scale = independentFloorScale(floor);
        return new Three.Vector3((x-(floor.bounds[0]+floor.bounds[2])/2)*scale+index*.7, index*7.5+lift,
          (y-(floor.bounds[1]+floor.bounds[3])/2)*scale+index*.4);
      };
      const materials: Array<{ floorId: string; material: THREE.MeshStandardMaterial; kind: string; color: THREE.Color; spaceId?: string }> = [];
      const detailLines: Array<{ floorId: string; material: THREE.LineBasicMaterial }> = [];
      for (const floor of floors) {
        const scale = independentFloorScale(floor);
        const buckets = new Map<string, THREE.BufferGeometry[]>();
        const detailEdges: number[] = [];
        for (const feature of floor.features) {
          for (const polygon of feature.polygons) {
            if (feature.kind === 'detail') {
              // Hairline boundaries have a pixel-width display stroke. Their
              // positions and planar height remain the source geometry.
              for (const ring of [polygon.outer, ...polygon.holes]) {
                for (let i = 1; i < ring.length; i++) {
                  const a = projectPoint(floor.id, ring[i-1], .032);
                  const b = projectPoint(floor.id, ring[i], .032);
                  detailEdges.push(a.x,a.y,a.z,b.x,b.y,b.z);
                }
              }
            }
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
        if (detailEdges.length) {
          const geometry = new Three.BufferGeometry();
          geometry.setAttribute('position', new Three.Float32BufferAttribute(detailEdges, 3));
          liveGeometries.add(geometry);
          const material = new Three.LineBasicMaterial({ color: '#d7c49a', transparent: true, opacity: .4, depthWrite: false });
          disposers.push(() => material.dispose());
          const lines = new Three.LineSegments(geometry, material);
          lines.raycast = () => {};
          scene.add(lines);
          detailLines.push({ floorId: floor.id, material });
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
      let selectionId: string | undefined;
      let selectionGeometry: THREE.BufferGeometry | undefined;
      const selectionMaterial = new Three.MeshBasicMaterial({ color: '#e8bd5e', side: Three.DoubleSide, transparent: true, opacity: .65, depthWrite: false });
      disposers.push(() => selectionMaterial.dispose());
      const selectionMesh = new Three.Mesh(new Three.BufferGeometry(), selectionMaterial);
      liveGeometries.add(selectionMesh.geometry);
      selectionMesh.visible = false;
      selectionMesh.raycast = () => {};
      scene.add(selectionMesh);
      const labelRaycaster = new Three.Raycaster();
      labelRaycaster.firstHitOnly = true;
      const occluders = scene.children.filter((object) => object instanceof Three.Mesh);
      const draw = () => {
        if (cancelled) return;
        const started = performance.now();
        const { floorId, selected } = latest.current;
        const selectedSpace = spaceForPlace(plan, selected);
        if (selectionId !== selectedSpace?.id) {
          if (selectionGeometry) { selectionGeometry.dispose(); liveGeometries.delete(selectionGeometry); selectionGeometry = undefined; }
          selectionId = selectedSpace?.id;
          selectionMesh.visible = false;
          if (selectedSpace) {
            const parts = selectedSpace.polygons.map((polygon) => {
              const shape = new Three.Shape(polygon.outer.map(([x, y]) => new Three.Vector2(x, y)));
              for (const ring of polygon.holes) shape.holes.push(new Three.Path(ring.map(([x, y]) => new Three.Vector2(x, y))));
              const geometry = new Three.ShapeGeometry(shape);
              const position = geometry.getAttribute('position');
              for (let i = 0; i < position.count; i++) {
                const p = projectPoint(selectedSpace.floorId, [position.getX(i), position.getY(i)], .04);
                position.setXYZ(i, p.x, p.y, p.z);
              }
              return geometry;
            });
            selectionGeometry = mergeGeometries(parts, false) ?? undefined;
            parts.forEach((part) => part.dispose());
            if (!selectionGeometry) throw new Error('Cannot draw selected room geometry');
            liveGeometries.add(selectionGeometry);
            selectionMesh.geometry = selectionGeometry;
            selectionMesh.visible = true;
          }
        }
        selectionMesh.visible = Boolean(selectionGeometry && selectedSpace?.floorId === floorId);
        container.dataset.selectedSpaceId = selectionMesh.visible ? selectionId ?? '' : '';
        container.dataset.selectionVertices = selectionMesh.visible ? String(selectionGeometry!.getAttribute('position').count) : '0';
        for (const record of materials) {
          record.material.opacity = record.floorId === floorId ? 1 : (record.kind === 'surface' ? .5 : .65);
          record.material.color.copy(record.color);
          if (record.spaceId && record.spaceId === selectedSpace?.id) record.material.color.set('#b99443');
        }
        for (const { floorId: lineFloor, material } of detailLines) material.opacity = lineFloor === floorId ? .4 : .22;
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
          if (button) { button.style.visibility = 'hidden'; button.tabIndex = -1; }
          const leader = leaderNodes.current.get(place.id);
          if (leader) leader.style.visibility = 'hidden';
          if (!visible) return [];
          const point = anchor.project(camera);
          if (button) { button.dataset.anchorX = String((point.x + 1) * width / 2); button.dataset.anchorY = String((1 - point.y) * height / 2); }
          return { ...place, at: [(point.x+1)*width/2, (1-point.y)*height/2] as MapPoint };
        });
        const visibleLabels = placeSceneLabels(points, [width, height], selected);
        for (const place of visibleLabels) {
          const button = labelNodes.current.get(place.id);
          if (button) { button.style.visibility = 'visible'; button.tabIndex = 0; button.style.transform = `translate(${place.displayAt[0]}px,${place.displayAt[1]}px) translate(-50%,-50%)`; }
          const leader = leaderNodes.current.get(place.id);
          if (leader) {
            leader.style.visibility = 'visible';
            leader.setAttribute('x1',String(place.at[0])); leader.setAttribute('y1',String(place.at[1]));
            leader.setAttribute('x2',String(place.displayAt[0])); leader.setAttribute('y2',String(place.displayAt[1]));
          }
        }
        if (process.env.NODE_ENV === 'development') {
          container.dataset.renderMs = (performance.now()-started).toFixed(2);
          container.dataset.drawCalls = String(renderer.info.render.calls);
          container.dataset.triangles = String(renderer.info.render.triangles);
          container.dataset.visibleLabels = String(visibleLabels.length);
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
        // Fit the real floor contours, not the empty corners of a tall stack box.
        let left = Infinity, right = -Infinity, top = -Infinity, bottom = Infinity;
        for (const floor of floors) for (const feature of floor.features) for (const polygon of feature.polygons) for (const point of polygon.outer) {
          const projected = projectPoint(floor.id, point, .14).applyMatrix4(camera.matrixWorldInverse);
          left = Math.min(left, projected.x); right = Math.max(right, projected.x);
          top = Math.max(top, projected.y); bottom = Math.min(bottom, projected.y);
        }
        const offset = new Three.Vector3((left + right) / 2, (top + bottom) / 2, 0).applyQuaternion(camera.quaternion);
        camera.position.add(offset); controls.target.add(offset);
        const halfWidth = (right - left) / 2, halfHeight = (top - bottom) / 2;
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
        const index = floors.findIndex((floor) => floor.id === latest.current.floorId);
        const floor = floors[index];
        const floorPlane = new Three.Plane(new Three.Vector3(0, 1, 0), -(index * 7.5 + .04));
        const intersection = raycaster.ray.intersectPlane(floorPlane, new Three.Vector3());
        if (!intersection) return;
        const hit = raycaster.intersectObjects(scene.children,false).find((hit) => hit.object instanceof Three.Mesh);
        if (hit && hit.distance < raycaster.ray.origin.distanceTo(intersection) - .01) return;
        const scale = independentFloorScale(floor);
        const at: MapPoint = [(intersection.x-index*.7)/scale+(floor.bounds[0]+floor.bounds[2])/2, (intersection.z-index*.4)/scale+(floor.bounds[1]+floor.bounds[3])/2];
        const space = spaceAtPoint(plan, floor.id, at);
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
        // OrbitControls emits change synchronously when update moves the camera.
        if (!controls.update()) draw();
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
        data-place-id={place.id} title={place.name} data-place-kind={place.kind} aria-label={`${place.label} ${place.name}`} aria-pressed={props.selected === place.id} onClick={(event) => { if (!labelDrag.current || event.detail === 0) props.onSelect(place.id); }}><PlanPlaceMarker place={place} /></button>)}
    </div>
  </div>;
}
