'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as ThreeType from 'three';
import type { GuideRecord } from '../data/types';
import { buildGuideSceneLayout } from '../lib/guide-3d-layout';
import { withBasePath } from '../lib/paths';

const spatialLabels: Record<GuideRecord['spatial']['type'], string> = {
  floorplan: '场馆空间',
  site: '遗址关系',
  viewpoints: '观察方位',
  district: '街区节点',
};

type FocusNode = (index: number | null) => void;

export function GuideSpatial({ guide }: { guide: GuideRecord }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusNodeRef = useRef<FocusNode>(() => undefined);
  const rotatingRef = useRef(true);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [rotating, setRotating] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);
  const layout = useMemo(
    () =>
      buildGuideSceneLayout({
        slug: guide.slug,
        type: guide.spatial.type,
        stops: guide.spatial.stops,
      }),
    [guide.slug, guide.spatial.stops, guide.spatial.type],
  );
  const imageSources = useMemo(
    () =>
      guide.highlights.map((highlight) =>
        highlight.image ? withBasePath(highlight.image) : null,
      ),
    [guide.highlights],
  );

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const activeCanvas: HTMLCanvasElement = canvasElement;
    let disposed = false;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;

    async function mountScene() {
      try {
        const THREE = await import('three');
        const { OrbitControls } =
          await import('three/examples/jsm/controls/OrbitControls.js');
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: false,
          antialias: true,
          canvas: activeCanvas,
          powerPreference: 'high-performance',
        });
        renderer.setClearColor(0x0b0e0d, 1);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0e0d);
        scene.fog = new THREE.Fog(0x0b0e0d, 18, 36);

        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
        camera.position.set(...layout.camera.position);
        const controls = new OrbitControls(camera, activeCanvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.enablePan = false;
        controls.minDistance = 6;
        controls.maxDistance = 28;
        controls.maxPolarAngle = Math.PI * 0.48;
        controls.target.set(...layout.camera.target);
        controls.update();

        scene.add(new THREE.HemisphereLight(0xf4ead7, 0x17201d, 2.1));
        const keyLight = new THREE.DirectionalLight(0xffe4b4, 4.2);
        keyLight.position.set(7, 12, 8);
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(layout.accent, 2.2);
        rimLight.position.set(-8, 6, -7);
        scene.add(rimLight);

        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(15, 96),
          new THREE.MeshStandardMaterial({
            color: 0x111715,
            metalness: 0.08,
            roughness: 0.92,
          }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.06;
        scene.add(floor);

        const grid = new THREE.GridHelper(27, 27, layout.accent, 0x29312e);
        grid.material.opacity = 0.22;
        grid.material.transparent = true;
        scene.add(grid);

        const root = new THREE.Group();
        scene.add(root);
        const nodeGroups: ThreeType.Group[] = [];
        const pickTargets: ThreeType.Object3D[] = [];
        const loadedTextures = new Set<ThreeType.Texture>();

        function makeStructure(index: number) {
          const node = layout.nodes[index];
          const group = new THREE.Group();
          group.position.set(...node.position);
          group.userData.nodeIndex = index;
          const material = new THREE.MeshStandardMaterial({
            color: index === 0 ? layout.accent : 0xb7b1a4,
            emissive: index === 0 ? layout.accent : 0x000000,
            emissiveIntensity: index === 0 ? 0.16 : 0,
            metalness: 0.1,
            roughness: 0.68,
          });
          const [width, height, depth] = node.scale;
          let geometry: ThreeType.BufferGeometry;
          if (node.shape === 'cylinder') {
            geometry = new THREE.CylinderGeometry(
              width * 0.55,
              width * 0.7,
              height,
              28,
            );
          } else if (node.shape === 'tower') {
            geometry = new THREE.CylinderGeometry(
              width * 0.3,
              width * 0.56,
              height,
              10,
            );
          } else if (node.shape === 'dome') {
            geometry = new THREE.SphereGeometry(
              width * 0.72,
              28,
              16,
              0,
              Math.PI * 2,
              0,
              Math.PI / 2,
            );
          } else {
            geometry = new THREE.BoxGeometry(width, height, depth);
          }
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.y = node.shape === 'dome' ? 0.03 : height / 2;
          mesh.userData.nodeIndex = index;
          group.add(mesh);
          pickTargets.push(mesh);

          const marker = new THREE.Mesh(
            new THREE.RingGeometry(0.52, 0.72, 40),
            new THREE.MeshBasicMaterial({
              color:
                index === 0
                  ? 0x78c7a4
                  : index === layout.nodes.length - 1
                    ? 0xf0d085
                    : layout.accent,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.9,
            }),
          );
          marker.rotation.x = -Math.PI / 2;
          marker.position.y = 0.05;
          marker.userData.nodeIndex = index;
          group.add(marker);
          pickTargets.push(marker);
          root.add(group);
          nodeGroups.push(group);
        }

        layout.nodes.forEach((_, index) => makeStructure(index));

        const routeWidth =
          guide.spatial.type === 'floorplan'
            ? 1.15
            : guide.spatial.type === 'district'
              ? 0.82
              : 0.42;
        const routeMaterial = new THREE.MeshStandardMaterial({
          color: guide.spatial.type === 'district' ? 0x252d2a : 0x303835,
          metalness: 0.04,
          roughness: 0.95,
          transparent: true,
          opacity: guide.spatial.type === 'viewpoints' ? 0 : 0.82,
        });

        for (const [from, to] of layout.paths) {
          const start = new THREE.Vector3(...layout.nodes[from].position);
          const end = new THREE.Vector3(...layout.nodes[to].position);
          if (guide.spatial.type !== 'viewpoints') {
            const midpoint = start.clone().add(end).multiplyScalar(0.5);
            const distance = start.distanceTo(end);
            const strip = new THREE.Mesh(
              new THREE.BoxGeometry(distance, 0.08, routeWidth),
              routeMaterial.clone(),
            );
            strip.position.set(midpoint.x, midpoint.y + 0.02, midpoint.z);
            strip.rotation.y = -Math.atan2(end.z - start.z, end.x - start.x);
            root.add(strip);
          }
          start.y += 0.08;
          end.y += 0.08;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            start,
            end,
          ]);
          const line = new THREE.Line(
            geometry,
            new THREE.LineDashedMaterial({
              color: layout.accent,
              dashSize: 0.28,
              gapSize: 0.18,
              opacity: 0.72,
              transparent: true,
            }),
          );
          line.computeLineDistances();
          root.add(line);
        }

        if (guide.spatial.type === 'viewpoints') {
          const sightRing = new THREE.Mesh(
            new THREE.RingGeometry(4.75, 4.9, 72),
            new THREE.MeshBasicMaterial({
              color: layout.accent,
              opacity: 0.24,
              side: THREE.DoubleSide,
              transparent: true,
            }),
          );
          sightRing.rotation.x = -Math.PI / 2;
          sightRing.position.y = 0.02;
          root.add(sightRing);
        }

        const textureLoader = new THREE.TextureLoader();
        imageSources.slice(0, layout.nodes.length).forEach((source, index) => {
          if (!source) return;
          textureLoader.load(
            source,
            (texture) => {
              if (disposed) {
                texture.dispose();
                return;
              }
              loadedTextures.add(texture);
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.anisotropy = Math.min(
                8,
                renderer.capabilities.getMaxAnisotropy(),
              );
              const image = texture.image as {
                naturalHeight?: number;
                naturalWidth?: number;
                height?: number;
                width?: number;
              };
              const width = image.naturalWidth ?? image.width ?? 1;
              const height = image.naturalHeight ?? image.height ?? 1;
              const aspect = Math.max(0.65, Math.min(1.65, width / height));
              const panelHeight = 1.75;
              const panel = new THREE.Sprite(
                new THREE.SpriteMaterial({
                  map: texture,
                  color: 0xffffff,
                  depthTest: true,
                  toneMapped: false,
                }),
              );
              panel.position.set(0, layout.nodes[index].scale[1] + 1.25, 0);
              panel.scale.set(panelHeight * aspect, panelHeight, 1);
              panel.userData.nodeIndex = index;
              nodeGroups[index]?.add(panel);
              pickTargets.push(panel);
            },
            undefined,
            () => undefined,
          );
        });

        function focusNode(index: number | null) {
          setActiveNode(index);
          nodeGroups.forEach((group, nodeIndex) => {
            const selected = index === nodeIndex;
            group.scale.setScalar(selected ? 1.16 : 1);
            const material = (group.children[0] as ThreeType.Mesh)
              .material as ThreeType.MeshStandardMaterial;
            material.emissive.set(selected ? layout.accent : 0x000000);
            material.emissiveIntensity = selected ? 0.28 : 0;
          });
          if (index === null) {
            camera.position.set(...layout.camera.position);
            controls.target.set(...layout.camera.target);
          } else {
            const node = layout.nodes[index];
            const target = new THREE.Vector3(...node.position);
            target.y += node.scale[1] * 0.55;
            controls.target.copy(target);
            camera.position.set(target.x + 5.6, target.y + 4.4, target.z + 6.1);
          }
          controls.update();
        }
        focusNodeRef.current = focusNode;

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        function onPointer(event: PointerEvent) {
          const bounds = activeCanvas.getBoundingClientRect();
          pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
          pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(pickTargets, false)[0];
          if (hit) focusNode(hit.object.userData.nodeIndex as number);
        }
        activeCanvas.addEventListener('pointerup', onPointer);

        function resize() {
          const width = activeCanvas.clientWidth;
          const height = activeCanvas.clientHeight;
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(activeCanvas);
        resize();

        let previousTime = performance.now();
        function render(timestamp = performance.now()) {
          if (disposed) return;
          const delta = Math.min((timestamp - previousTime) / 1000, 0.05);
          previousTime = timestamp;
          if (rotatingRef.current) root.rotation.y += delta * 0.09;
          controls.update();
          renderer.render(scene, camera);
          activeCanvas.dataset.rendered = 'true';
          frame = requestAnimationFrame(render);
        }
        render(previousTime);

        return () => {
          activeCanvas.removeEventListener('pointerup', onPointer);
          controls.dispose();
          scene.traverse((object) => {
            if (
              object instanceof THREE.Mesh ||
              object instanceof THREE.Line ||
              object instanceof THREE.Sprite
            ) {
              if ('geometry' in object) object.geometry.dispose();
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          loadedTextures.forEach((texture) => texture.dispose());
          renderer.dispose();
        };
      } catch {
        if (!disposed) setWebglFailed(true);
        return undefined;
      }
    }

    let unmountScene: (() => void) | undefined;
    void mountScene().then((cleanup) => {
      if (disposed) cleanup?.();
      else unmountScene = cleanup;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      focusNodeRef.current = () => undefined;
      unmountScene?.();
    };
  }, [guide.spatial.type, imageSources, layout]);

  function toggleRotation() {
    const next = !rotating;
    rotatingRef.current = next;
    setRotating(next);
  }

  return (
    <section className="guide-section guide-spatial" id="guide-spatial">
      <div className="guide-section__heading">
        <p>01 / {spatialLabels[guide.spatial.type]}</p>
        <h2>3D 导览地图</h2>
        <span>{guide.spatial.title}</span>
      </div>
      <section
        aria-label={`${guide.title}三维空间示意`}
        className="guide-spatial-3d"
      >
        <div className="guide-spatial-3d__stage">
          <canvas
            aria-label={`${guide.title}三维空间画布`}
            className="guide-spatial-3d__canvas"
            ref={canvasRef}
          />
          <div className="guide-spatial-3d__toolbar">
            <button
              aria-label="重置三维视角"
              onClick={() => focusNodeRef.current(null)}
              title="重置视角"
              type="button"
            >
              <RotateCcw aria-hidden="true" size={17} />
            </button>
            <button
              aria-label={rotating ? '暂停自动旋转' : '继续自动旋转'}
              onClick={toggleRotation}
              title={rotating ? '暂停自动旋转' : '继续自动旋转'}
              type="button"
            >
              {rotating ? (
                <Pause aria-hidden="true" size={17} />
              ) : (
                <Play aria-hidden="true" size={17} />
              )}
            </button>
          </div>
          <div className="guide-spatial-3d__hint">
            拖动旋转 · 滚轮或双指缩放 · 点击节点或图片聚焦
          </div>
          <div aria-label="导览起点与终点" className="guide-spatial-3d__legend">
            <span data-kind="start">起点</span>
            <span data-kind="finish">终点</span>
          </div>
          {webglFailed && (
            <output className="guide-spatial-3d__fallback">
              当前设备无法显示 WebGL，仍可使用右侧空间节点了解现场关系。
            </output>
          )}
        </div>
        <ol className="guide-spatial-3d__nodes">
          {guide.spatial.stops.map((stop, index) => (
            <li key={stop}>
              <button
                aria-label={`聚焦${stop}`}
                data-active={activeNode === index}
                onClick={() => focusNodeRef.current(index)}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{stop}</strong>
              </button>
            </li>
          ))}
        </ol>
      </section>
      <p className="guide-disclaimer">
        {guide.spatial.note}{' '}
        3D 导览为示意性简化重建，图片节点对应本页关键作品或现场，不作为精确测绘或导航依据。
      </p>
    </section>
  );
}
