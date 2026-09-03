'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as ThreeType from 'three';
import type { GuideRecord } from '../data/types';
import type {
  GuideSceneMaterial,
  GuideScenePart,
} from '../lib/guide-3d-models';
import { buildGuideSceneLayout } from '../lib/guide-3d-layout';
import { withBasePath } from '../lib/paths';

const spatialLabels: Record<GuideRecord['spatial']['type'], string> = {
  floorplan: '场馆空间',
  site: '遗址关系',
  viewpoints: '观察方位',
  district: '街区节点',
};

const materialColors: Record<GuideSceneMaterial, number> = {
  stone: 0x8c887e,
  'pale-stone': 0xc7c0b0,
  brick: 0x936657,
  marble: 0xd8d1c2,
  metal: 0x5d6865,
  glass: 0x6f9b9a,
  roof: 0x806551,
  water: 0x356b78,
  earth: 0x6d5e48,
  garden: 0x526b52,
  route: 0x343936,
};

type FocusNode = (index: number | null) => void;

function isOneOf(kind: string, words: string[]) {
  return words.some((word) => kind.includes(word));
}

function makeArchGeometry(THREE: typeof ThreeType) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.5);
  shape.lineTo(0.5, -0.5);
  shape.lineTo(0.5, 0.5);
  shape.lineTo(-0.5, 0.5);
  shape.closePath();

  const opening = new THREE.Path();
  opening.moveTo(-0.29, -0.5);
  opening.lineTo(-0.29, 0.02);
  opening.absarc(0, 0.02, 0.29, Math.PI, 0, true);
  opening.lineTo(0.29, -0.5);
  opening.closePath();
  shape.holes.push(opening);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    depth: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -0.5);
  return geometry;
}

function makeTrianglePrism(THREE: typeof ThreeType) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.5);
  shape.lineTo(0.5, -0.5);
  shape.lineTo(0, 0.5);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    depth: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -0.5);
  return geometry;
}

function geometryFor(THREE: typeof ThreeType, modelPart: GuideScenePart) {
  const { kind } = modelPart;
  if (kind === 'elliptical-ring') {
    const geometry = new THREE.TorusGeometry(0.42, 0.095, 10, 64);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  if (kind === 'horseshoe-auditorium') {
    const geometry = new THREE.TorusGeometry(
      0.42,
      0.12,
      10,
      48,
      Math.PI * 1.55,
    );
    geometry.rotateX(Math.PI / 2);
    geometry.rotateZ(Math.PI * 0.23);
    return geometry;
  }
  if (
    isOneOf(kind, ['bridge-arch', 'triumphal-arch', 'proscenium', 'arcade'])
  ) {
    return makeArchGeometry(THREE);
  }
  if (kind === 'pediment') {
    return makeTrianglePrism(THREE);
  }
  if (kind === 'boat-hull') {
    const geometry = new THREE.CapsuleGeometry(0.32, 1.7, 8, 18);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  if (isOneOf(kind, ['conical', 'dragon-roof'])) {
    return new THREE.ConeGeometry(0.5, 1, 12);
  }
  if (isOneOf(kind, ['dome'])) {
    return new THREE.SphereGeometry(
      0.5,
      32,
      18,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
  }
  if (isOneOf(kind, ['spire', 'pinnacle'])) {
    return new THREE.ConeGeometry(0.5, 1, 12);
  }
  if (kind === 'glass-tower') {
    return new THREE.CylinderGeometry(0.5, 0.62, 1, 3);
  }
  if (
    isOneOf(kind, [
      'column',
      'drum',
      'belfry',
      'campanile',
      'rotunda',
      'apse',
      'chimney',
      'statue',
      'monument',
      'obelisk',
      'fountain-basin',
      'arena',
      'terrain',
      'font',
    ])
  ) {
    const radialSegments = kind === 'terrain' ? 14 : 28;
    return new THREE.CylinderGeometry(
      0.5,
      kind === 'terrain' ? 0.62 : 0.5,
      1,
      radialSegments,
    );
  }
  return new THREE.BoxGeometry(1, 1, 1);
}

function materialFor(
  THREE: typeof ThreeType,
  modelPart: GuideScenePart,
  accent: number,
) {
  const color = materialColors[modelPart.material];
  if (modelPart.material === 'glass') {
    return new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.15,
      opacity: 0.68,
      roughness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      transmission: 0.15,
    });
  }
  if (modelPart.material === 'water') {
    return new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.05,
      opacity: 0.84,
      roughness: 0.25,
      transparent: true,
    });
  }
  return new THREE.MeshStandardMaterial({
    color,
    emissive: modelPart.material === 'route' ? accent : 0x000000,
    emissiveIntensity: modelPart.material === 'route' ? 0.05 : 0,
    metalness: modelPart.material === 'metal' ? 0.52 : 0.06,
    roughness: modelPart.material === 'metal' ? 0.45 : 0.76,
  });
}

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
        renderer.toneMappingExposure = 1.12;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0e0d);
        scene.fog = new THREE.Fog(0x0b0e0d, 20, 42);

        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(...layout.camera.position);
        const controls = new OrbitControls(camera, activeCanvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.enablePan = false;
        controls.minDistance = 5;
        controls.maxDistance = 32;
        controls.maxPolarAngle = Math.PI * 0.49;
        controls.target.set(...layout.camera.target);
        controls.update();

        scene.add(new THREE.HemisphereLight(0xf4ead7, 0x17201d, 2.2));
        const keyLight = new THREE.DirectionalLight(0xffe4b4, 4.5);
        keyLight.position.set(7, 13, 8);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(layout.accent, 2.4);
        rimLight.position.set(-8, 7, -7);
        scene.add(rimLight);

        const root = new THREE.Group();
        scene.add(root);

        const groundMaterial = new THREE.MeshStandardMaterial({
          color:
            layout.environment === 'park' || layout.environment === 'hillside'
              ? 0x172018
              : 0x111715,
          metalness: 0.03,
          roughness: 0.96,
        });
        const ground = new THREE.Mesh(
          layout.environment === 'interior'
            ? new THREE.BoxGeometry(18, 0.12, 14)
            : new THREE.CircleGeometry(15.5, 96),
          groundMaterial,
        );
        if (layout.environment !== 'interior') ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.11;
        ground.receiveShadow = true;
        root.add(ground);

        const grid = new THREE.GridHelper(28, 28, layout.accent, 0x29312e);
        grid.material.opacity = layout.environment === 'interior' ? 0.08 : 0.14;
        grid.material.transparent = true;
        root.add(grid);

        for (const modelPart of layout.parts) {
          const geometry = geometryFor(THREE, modelPart);
          const material = materialFor(THREE, modelPart, layout.accent);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(...modelPart.position);
          mesh.rotation.set(...modelPart.rotation);
          mesh.scale.set(...modelPart.scale);
          mesh.castShadow = modelPart.material !== 'water';
          mesh.receiveShadow = true;
          root.add(mesh);
        }

        const nodeGroups: ThreeType.Group[] = [];
        const markerMaterials: ThreeType.MeshStandardMaterial[] = [];
        const pickTargets: ThreeType.Object3D[] = [];
        const loadedTextures = new Set<ThreeType.Texture>();

        layout.nodes.forEach((node, index) => {
          const group = new THREE.Group();
          group.position.set(...node.position);
          group.userData.nodeIndex = index;

          const markerMaterial = new THREE.MeshStandardMaterial({
            color:
              index === 0
                ? 0x78c7a4
                : index === layout.nodes.length - 1
                  ? 0xf0d085
                  : layout.accent,
            emissive: 0x000000,
            emissiveIntensity: 0,
            metalness: 0.2,
            roughness: 0.45,
          });
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 20, 14),
            markerMaterial,
          );
          marker.position.y = 0.15;
          marker.userData.nodeIndex = index;
          marker.castShadow = true;
          group.add(marker);

          const halo = new THREE.Mesh(
            new THREE.RingGeometry(0.34, 0.48, 36),
            new THREE.MeshBasicMaterial({
              color: markerMaterial.color,
              opacity: 0.85,
              side: THREE.DoubleSide,
              transparent: true,
            }),
          );
          halo.rotation.x = -Math.PI / 2;
          halo.position.y = 0.03;
          halo.userData.nodeIndex = index;
          group.add(halo);

          root.add(group);
          nodeGroups.push(group);
          markerMaterials.push(markerMaterial);
          pickTargets.push(marker, halo);
        });

        for (const [from, to] of layout.paths) {
          const start = new THREE.Vector3(...layout.nodes[from].position);
          const end = new THREE.Vector3(...layout.nodes[to].position);
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
              dashSize: 0.25,
              gapSize: 0.15,
              opacity: 0.8,
              transparent: true,
            }),
          );
          line.computeLineDistances();
          root.add(line);
        }

        const textureLoader = new THREE.TextureLoader();
        const geometryOnly = new URLSearchParams(window.location.search).has(
          'qaGeometry',
        );
        if (!geometryOnly)
          imageSources
            .slice(0, layout.nodes.length)
            .forEach((source, index) => {
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
                  const panelHeight = 0.92;
                  const panel = new THREE.Sprite(
                    new THREE.SpriteMaterial({
                      map: texture,
                      color: 0xffffff,
                      depthTest: true,
                      toneMapped: false,
                    }),
                  );
                  panel.position.set(index % 2 === 0 ? -0.58 : 0.58, 1.05, 0);
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
            group.scale.setScalar(selected ? 1.18 : 1);
            markerMaterials[nodeIndex].emissive.set(
              selected ? layout.accent : 0x000000,
            );
            markerMaterials[nodeIndex].emissiveIntensity = selected ? 0.45 : 0;
          });
          if (index === null) {
            camera.position.set(...layout.camera.position);
            controls.target.set(...layout.camera.target);
          } else {
            const target = new THREE.Vector3(...layout.nodes[index].position);
            target.y += 0.65;
            controls.target.copy(target);
            camera.position.set(target.x + 4.8, target.y + 3.8, target.z + 5.3);
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
          if (rotatingRef.current) root.rotation.y += delta * 0.055;
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
  }, [imageSources, layout]);

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
        {guide.spatial.note} 3D
        导览依据景点实体空间与公开导览平面进行简化重建，不作为现场精确测绘或导航依据。
      </p>
    </section>
  );
}
