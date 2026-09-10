"use client";

import { Pause, Play, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type * as ThreeType from "three";
import type { GuideRecord } from "../data/types";
import type {
  GuideSceneMaterial,
  GuideScenePart,
} from "../lib/guide-3d-models";
import { buildGuideExteriorSceneLayout } from "../lib/guide-exterior-layout";
import { withBasePath } from "../lib/paths";
import { hasChurchExterior } from '../lib/church-exterior-registry';
import {
  perspectiveBoxFitDistance,
  perspectiveFitDistance,
  specialExteriorGeometry,
} from "../lib/exterior-geometry";

const materialColors: Record<GuideSceneMaterial, number> = {
  stone: 0x8c887e,
  "pale-stone": 0xc7c0b0,
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

const BraccioNuovoPlan = lazy(() => import('./BraccioNuovoPlan').then(module => ({ default: module.BraccioNuovoPlan })));

type FocusNode = (index: number | null) => void;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia)
    return () => undefined;
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener?.("change", onStoreChange);
  return () => mediaQuery.removeEventListener?.("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.(reducedMotionQuery).matches)
  );
}

function getServerReducedMotionSnapshot() {
  return true;
}

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
  const special = specialExteriorGeometry(THREE, kind);
  if (special) return special;
  if (kind === "elliptical-ring") {
    const geometry = new THREE.TorusGeometry(0.42, 0.095, 10, 64);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  if (kind === "horseshoe-auditorium") {
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
    isOneOf(kind, ["bridge-arch", "triumphal-arch", "proscenium", "arcade"])
  ) {
    return makeArchGeometry(THREE);
  }
  if (kind === "pediment") {
    return makeTrianglePrism(THREE);
  }
  if (kind === "boat-hull") {
    const geometry = new THREE.CapsuleGeometry(0.32, 1.7, 8, 18);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  if (isOneOf(kind, ["conical"])) {
    return new THREE.ConeGeometry(0.5, 1, 12);
  }
  if (isOneOf(kind, ["dome"])) {
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
  if (isOneOf(kind, ["spire", "pinnacle"])) {
    return new THREE.ConeGeometry(0.5, 1, 12);
  }
  if (kind === "glass-tower") {
    return new THREE.CylinderGeometry(0.5, 0.62, 1, 3);
  }
  if (
    isOneOf(kind, [
      "column",
      "drum",
      "belfry",
      "campanile",
      "rotunda",
      "apse",
      "chimney",
      "statue",
      "monument",
      "obelisk",
      "fountain-basin",
      "arena",
      "terrain",
      "font",
    ])
  ) {
    const radialSegments = kind === "terrain" ? 14 : 28;
    return new THREE.CylinderGeometry(
      0.5,
      kind === "terrain" ? 0.62 : 0.5,
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
  if (modelPart.material === "glass") {
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
  if (modelPart.material === "water") {
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
    emissive: modelPart.material === "route" ? accent : 0x000000,
    emissiveIntensity: modelPart.material === "route" ? 0.05 : 0,
    metalness: modelPart.material === "metal" ? 0.52 : 0.06,
    roughness: modelPart.material === "metal" ? 0.45 : 0.76,
  });
}

export function GuideExteriorScene({ guide }: { guide: GuideRecord }) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusNodeRef = useRef<FocusNode>(() => undefined);
  const zoomRef = useRef<(factor: number) => void>(() => undefined);
  const focusRegionRef = useRef<(id: string | null) => void>(() => undefined);
  const hasStPetersContext = [
    "st-peters-basilica",
    "st-peters-square",
  ].includes(guide.slug);
  const hasBraccioContext = guide.slug === 'vatican-museums';
  const hasPisaContext = guide.slug === 'leaning-tower';
  const hasSighsContext = guide.slug === 'bridge-of-sighs';
  const hasChurchContext = hasChurchExterior(guide.slug);
  const useBoxFraming = hasStPetersContext || hasBraccioContext || hasPisaContext || hasSighsContext || hasChurchContext;
  const defaultRegion = hasStPetersContext
    ? guide.slug === "st-peters-square"
      ? "square"
      : "basilica"
    : null;
  const [region, setRegion] = useState<string | null>(defaultRegion);
  const [rotationOverride, setRotationOverride] = useState<boolean | null>(
    null,
  );
  const rotating = rotationOverride ?? !prefersReducedMotion;
  const rotatingRef = useRef(rotating);
  const [webglFailed, setWebglFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const layout = useMemo(
    () =>
      buildGuideExteriorSceneLayout({
        slug: guide.slug,
        type: guide.spatial.type,
        stops: guide.spatial.stops,
      }),
    [guide.slug, guide.spatial.stops, guide.spatial.type],
  );

  useEffect(() => {
    rotatingRef.current = rotating;
  }, [rotating]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const activeCanvas: HTMLCanvasElement = canvasElement;
    let disposed = false;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    const abort = new AbortController();
    let releaseOnError: (() => void) | undefined;

    async function mountScene() {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );
        if (disposed) return;

        let detailed: ThreeType.Group | undefined;
        let releaseChurchTextures: (() => void) | undefined;
        if (hasStPetersContext) {
          const { loadStPetersModel, disposeStPetersModel } = await import(
            "../lib/st-peters-model"
          );
          if (disposed) return;
          detailed = await loadStPetersModel(abort.signal);
          releaseOnError = () => {
            if (detailed) disposeStPetersModel(detailed);
          };
          if (disposed) {
            disposeStPetersModel(detailed);
            return;
          }
        }

        const renderer = new THREE.WebGLRenderer({
          alpha: false,
          antialias: true,
          canvas: activeCanvas,
          powerPreference: "high-performance",
        });
        renderer.setClearColor(0x061019, 1);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;

        const scene = new THREE.Scene();
        releaseOnError = () => {
          releaseChurchTextures?.();
          const roots =
            detailed && !detailed.parent ? [scene, detailed] : [scene];
          roots.forEach((root) =>
            root.traverse((object) => {
              if (
                object instanceof THREE.Mesh ||
                object instanceof THREE.Line ||
                object instanceof THREE.Sprite
              ) {
                if ("geometry" in object) object.geometry.dispose();
                (Array.isArray(object.material)
                  ? object.material
                  : [object.material]
                ).forEach((material) => material.dispose());
              }
            }),
          );
          renderer.dispose();
          renderer.forceContextLoss();
        };
        scene.background = new THREE.Color(0x061019);

        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 250);
        camera.position.set(...layout.camera.position);
        const controls = new OrbitControls(camera, activeCanvas);
        const releaseRenderer = releaseOnError;
        releaseOnError = () => {
          controls.dispose();
          releaseRenderer?.();
        };
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.enablePan = false;
        controls.minDistance = 3;
        controls.maxDistance = 120;
        controls.maxPolarAngle = Math.PI * (hasSighsContext ? 0.64 : 0.49);
        controls.target.set(...layout.camera.target);
        controls.update();

        scene.add(new THREE.HemisphereLight(0xe1ecf5, 0x26333d, 2));
        const keyLight = new THREE.DirectionalLight(0xffecd4, 3.6);
        keyLight.position.set(7, 13, 8);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.left = -18;
        keyLight.shadow.camera.right = 18;
        keyLight.shadow.camera.top = 18;
        keyLight.shadow.camera.bottom = -18;
        keyLight.shadow.normalBias = 0.025;
        keyLight.shadow.bias = -0.0002;
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0xa9cbde, 2.1);
        rimLight.position.set(-8, 7, -7);
        scene.add(rimLight);

        const root = new THREE.Group();
        scene.add(root);
        const buildings = new THREE.Group();
        root.add(buildings);

        const groundMaterial = new THREE.MeshStandardMaterial({
          color:
            layout.environment === "park" || layout.environment === "hillside"
              ? 0x172018
              : 0x0c1b29,
          metalness: 0.03,
          roughness: 0.96,
        });
        const ground = new THREE.Mesh(
          useBoxFraming
            ? new THREE.PlaneGeometry(80, 80)
            : layout.environment === "interior"
              ? new THREE.BoxGeometry(18, 0.12, 14)
              : new THREE.CircleGeometry(15.5, 96),
          useBoxFraming
            ? new THREE.ShadowMaterial({ opacity: 0.24 })
            : groundMaterial,
        );
        if (useBoxFraming) groundMaterial.dispose();
        if (layout.environment !== "interior") ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.11;
        ground.receiveShadow = true;
        root.add(ground);

        if (hasChurchContext) {
          const { loadChurchExterior, disposeChurchTextures } = await import('../lib/church-exterior-model');
          if (disposed) { releaseOnError?.(); return; }
          detailed = await loadChurchExterior(guide.slug, abort.signal, Math.min(8, renderer.capabilities.getMaxAnisotropy()));
          releaseChurchTextures = () => disposeChurchTextures(detailed);
          if (disposed) { releaseOnError?.(); return; }
          buildings.add(detailed);
        } else if (hasStPetersContext) {
          if (detailed) buildings.add(detailed);
        } else if (hasBraccioContext) {
          const { buildBraccioNuovoModel } = await import('../lib/braccio-nuovo-model');
          const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
          if (disposed) { releaseOnError?.(); return; }
          detailed = buildBraccioNuovoModel(THREE, mergeGeometries);
          buildings.add(detailed);
        } else if (hasPisaContext) {
          const { buildPisaExterior } = await import('../lib/pisa-exterior-model');
          const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
          if (disposed) { releaseOnError?.(); return; }
          detailed = buildPisaExterior(THREE, mergeGeometries);
          buildings.add(detailed);
        } else if (hasSighsContext) {
          const { buildSighsExterior } = await import('../lib/sighs-exterior-model');
          const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
          if (disposed) { releaseOnError?.(); return; }
          detailed = buildSighsExterior(THREE, mergeGeometries);
          buildings.add(detailed);
        } else if (
          ["sagrada-familia", "casa-batllo", "pantheon"].includes(guide.slug)
        ) {
          const { buildDetailedExterior } = await import(
            "../lib/detailed-exteriors"
          );
          const { mergeGeometries } = await import(
            "three/examples/jsm/utils/BufferGeometryUtils.js"
          );
          detailed = buildDetailedExterior(THREE, mergeGeometries, guide.slug);
          if (detailed) buildings.add(detailed);
        }
        for (const modelPart of detailed ? [] : layout.parts) {
          const geometry = geometryFor(THREE, modelPart);
          const material = materialFor(THREE, modelPart, layout.accent);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(...modelPart.position);
          mesh.rotation.set(...modelPart.rotation);
          mesh.scale.set(...modelPart.scale);
          mesh.castShadow = modelPart.material !== "water";
          mesh.receiveShadow = true;
          buildings.add(mesh);
          if (
            !["water", "garden", "route", "glass"].includes(modelPart.material)
          ) {
            const outline = new THREE.LineSegments(
              new THREE.EdgesGeometry(geometry, 28),
              new THREE.LineBasicMaterial({
                color: 0x28313a,
                transparent: true,
                opacity: 0.22,
              }),
            );
            mesh.add(outline);
          }
        }

        const bounds = new THREE.Box3().setFromObject(buildings);
        if (hasPisaContext) ground.position.y = bounds.min.y - 0.03;
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        let compactBraccioFrame = activeCanvas.clientWidth < 640;
        const homeDirection = hasStPetersContext
          ? new THREE.Vector3(3, 6, 15).normalize()
          : hasBraccioContext ? new THREE.Vector3(compactBraccioFrame ? 18 : 3, 12, -10).normalize()
          : hasPisaContext ? new THREE.Vector3(2, 1.1, 10).normalize()
          : hasSighsContext ? new THREE.Vector3(7, 4, 16).normalize()
          : hasChurchContext ? new THREE.Vector3(1.38, .96, 1.78).normalize()
          : new THREE.Vector3(...layout.camera.position)
              .sub(new THREE.Vector3(...layout.camera.target))
              .normalize();
        let framingBounds = bounds.clone();
        let framingDirection = homeDirection.clone();
        let overview = true;
        function fitOverview(resetDirection = false) {
          const direction = resetDirection
            ? framingDirection
            : camera.position.clone().sub(controls.target).normalize();
          const distance = useBoxFraming
            ? perspectiveBoxFitDistance(
                framingBounds.getSize(new THREE.Vector3()).toArray() as [
                  number,
                  number,
                  number,
                ],
                direction.toArray() as [number, number, number],
                camera.aspect,
                camera.fov,
              )
            : perspectiveFitDistance(sphere.radius, camera.aspect, camera.fov);
          controls.maxDistance = Math.max(120, distance * 2);
          const center = useBoxFraming
            ? framingBounds.getCenter(new THREE.Vector3())
            : sphere.center;
          controls.target.copy(center);
          camera.position.copy(center).addScaledVector(direction, distance);
          controls.update();
        }
        focusRegionRef.current = (id) => {
          framingDirection = id === 'square' ? new THREE.Vector3(3, 12, 12).normalize()
            : hasBraccioContext && id === 'portico' ? new THREE.Vector3(3, 8, -16).normalize()
            : hasBraccioContext && id === 'hemicycle' ? new THREE.Vector3(6, 12, 15).normalize()
            : homeDirection.clone();
          const region = (
            detailed?.userData.focusRegions as
              | {
                  id: string;
                  min: [number, number, number];
                  max: [number, number, number];
                  direction?: [number, number, number];
                }[]
              | undefined
          )?.find((r) => r.id === id);
          if (region?.direction) framingDirection.set(...region.direction).normalize();
          framingBounds = region
            ? new THREE.Box3(
                new THREE.Vector3(...region.min),
                new THREE.Vector3(...region.max),
              )
            : bounds.clone();
          overview = true;
          fitOverview(true);
        };
        zoomRef.current = (factor) => {
          overview = false;
          const offset = camera.position.clone().sub(controls.target);
          offset.setLength(
            THREE.MathUtils.clamp(
              offset.length() * factor,
              controls.minDistance,
              controls.maxDistance,
            ),
          );
          camera.position.copy(controls.target).add(offset);
          controls.update();
        };

        const nodeGroups: ThreeType.Group[] = [];
        const markerMaterials: ThreeType.MeshStandardMaterial[] = [];
        const pickTargets: ThreeType.Object3D[] = [];

        layout.nodes.forEach((node, index) => {
          const group = new THREE.Group();
          group.position.set(...node.position);
          group.userData.nodeIndex = index;

          const markerMaterial = new THREE.MeshStandardMaterial({
            color:
              index === 0
                ? 0x9eb5c8
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

        function focusNode(index: number | null) {
          nodeGroups.forEach((group, nodeIndex) => {
            const selected = index === nodeIndex;
            group.scale.setScalar(selected ? 1.18 : 1);
            markerMaterials[nodeIndex].emissive.set(
              selected ? layout.accent : 0x000000,
            );
            markerMaterials[nodeIndex].emissiveIntensity = selected ? 0.45 : 0;
          });
          if (index === null) {
            overview = true;
            root.rotation.y = 0;
            framingBounds = bounds.clone();
            framingDirection = homeDirection.clone();
            fitOverview(true);
          } else {
            overview = false;
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
        let pointerStart: { x: number; y: number } | undefined;
        function onPointerDown(event: PointerEvent) {
          pointerStart = { x: event.clientX, y: event.clientY };
        }
        function onPointer(event: PointerEvent) {
          if (
            !pointerStart ||
            Math.hypot(
              pointerStart.x - event.clientX,
              pointerStart.y - event.clientY,
            ) > 6
          )
            return;
          const bounds = activeCanvas.getBoundingClientRect();
          pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
          pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(pickTargets, false)[0];
          if (hit) focusNode(hit.object.userData.nodeIndex as number);
        }
        function onKey(event: KeyboardEvent) {
          if (
            ![
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "+",
              "=",
              "-",
              "Home",
            ].includes(event.key)
          )
            return;
          event.preventDefault();
          if (event.key === "Home") {
            setRegion(null);
            return focusNode(null);
          }
          if (event.key === "+" || event.key === "=")
            return zoomRef.current(0.85);
          if (event.key === "-") return zoomRef.current(1.18);
          const offset = camera.position.clone().sub(controls.target);
          const spherical = new THREE.Spherical().setFromVector3(offset);
          if (event.key === "ArrowLeft") spherical.theta -= 0.1;
          if (event.key === "ArrowRight") spherical.theta += 0.1;
          if (event.key === "ArrowUp")
            spherical.phi = Math.max(0.1, spherical.phi - 0.1);
          if (event.key === "ArrowDown")
            spherical.phi = Math.min(
              controls.maxPolarAngle,
              spherical.phi + 0.1,
            );
          camera.position
            .copy(controls.target)
            .add(offset.setFromSpherical(spherical));
          controls.update();
        }
        activeCanvas.addEventListener("pointerdown", onPointerDown, {
          signal: abort.signal,
        });
        activeCanvas.addEventListener("pointerup", onPointer, {
          signal: abort.signal,
        });
        activeCanvas.addEventListener("keydown", onKey, {
          signal: abort.signal,
        });

        function resize() {
          const width = activeCanvas.clientWidth;
          const height = activeCanvas.clientHeight;
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          if (hasBraccioContext && compactBraccioFrame !== (width < 640)) {
            compactBraccioFrame = width < 640;
            homeDirection.set(compactBraccioFrame ? 18 : 3, 12, -10).normalize();
            if (overview && framingBounds.equals(bounds)) {
              framingDirection.copy(homeDirection);
              fitOverview(true);
              return;
            }
          }
          if (overview) fitOverview();
        }
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(activeCanvas);
        resize();
        if (useBoxFraming) focusRegionRef.current(defaultRegion);

        let previousTime = performance.now();
        let contextLost = false;
        let visible = !useBoxFraming || activeCanvas.getBoundingClientRect().top < window.innerHeight;
        function render(timestamp = performance.now()) {
          if (disposed || contextLost) return;
          const delta = Math.min((timestamp - previousTime) / 1000, 0.05);
          previousTime = timestamp;
          controls.autoRotate = rotatingRef.current;
          controls.autoRotateSpeed = 0.3;
          controls.update(delta);
          renderer.render(scene, camera);
          activeCanvas.dataset.camera = camera.position
            .toArray()
            .map((n) => n.toFixed(3))
            .join(",");
          activeCanvas.dataset.drawCalls = String(renderer.info.render.calls);
          activeCanvas.dataset.triangles = String(renderer.info.render.triangles);
          activeCanvas.dataset.model = detailed?.userData.id ?? guide.slug;
          if (hasChurchContext) activeCanvas.dataset.material = detailed?.userData.materialStatus ?? 'building-palette';
          if (hasPisaContext || hasSighsContext) activeCanvas.dataset.features = JSON.stringify(detailed?.userData.featureCounts);
          activeCanvas.dataset.rendered = "true";
          if (!useBoxFraming || (visible && !document.hidden)) frame = requestAnimationFrame(render);
        }
        render(previousTime);
        activeCanvas.addEventListener('webglcontextlost', event => {
          event.preventDefault();
          if (disposed) return;
          contextLost = true;
          cancelAnimationFrame(frame);
          activeCanvas.dataset.rendered = 'false';
          setReady(false);
          setWebglFailed(true);
        }, { signal: abort.signal });
        if (useBoxFraming) {
          const resume = () => {
            cancelAnimationFrame(frame);
            activeCanvas.dataset.suspended = String(!visible || document.hidden);
            if (visible && !document.hidden && !disposed) render();
          };
          visibilityObserver = new IntersectionObserver(entries => {
            visible = Boolean(entries[0]?.isIntersecting);
            resume();
          });
          visibilityObserver.observe(activeCanvas);
          document.addEventListener('visibilitychange', resume, { signal: abort.signal });
        }
        setReady(true);

        return () => {
          releaseChurchTextures?.();
          activeCanvas.removeEventListener("pointerdown", onPointerDown);
          activeCanvas.removeEventListener("pointerup", onPointer);
          activeCanvas.removeEventListener("keydown", onKey);
          controls.dispose();
          scene.traverse((object) => {
            if (
              object instanceof THREE.Mesh ||
              object instanceof THREE.Line ||
              object instanceof THREE.Sprite
            ) {
              if ("geometry" in object) object.geometry.dispose();
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          renderer.dispose();
          renderer.forceContextLoss();
        };
      } catch {
        abort.abort();
        resizeObserver?.disconnect();
        visibilityObserver?.disconnect();
        cancelAnimationFrame(frame);
        releaseOnError?.();
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
      abort.abort();
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      focusNodeRef.current = () => undefined;
      zoomRef.current = () => undefined;
      focusRegionRef.current = () => undefined;
      unmountScene?.();
    };
  }, [guide.slug, layout, hasStPetersContext, hasBraccioContext, hasPisaContext, hasSighsContext, hasChurchContext, useBoxFraming, defaultRegion, attempt]);

  function toggleRotation() {
    setRotationOverride(!rotating);
  }

  return (
    <section
      aria-label={`${guide.title}三维空间示意`}
      className={`guide-spatial-3d${useBoxFraming ? " guide-spatial-3d--compound" : ""}${hasPisaContext ? ' guide-spatial-3d--pisa' : ''}${hasSighsContext ? ' guide-spatial-3d--sighs' : ''}`}
    >
      {hasBraccioContext && <p className="guide-spatial__data-status">新翼陈列馆建筑剖视。屋顶与相邻馆翼尚未纳入，完整馆区外观仍在重建。</p>}
      <div
        className="guide-spatial-3d__stage"
        aria-busy={!ready && !webglFailed}
      >
        <canvas
          key={attempt}
          tabIndex={0}
          aria-label={`${guide.title}三维空间画布`}
          className="guide-spatial-3d__canvas"
          ref={canvasRef}
        />
        <div className="guide-spatial-3d__toolbar">
          <button
            disabled={!ready}
            type="button"
            aria-label="放大外观"
            title="放大"
            onClick={() => zoomRef.current(0.85)}
          >
            <ZoomIn size={17} />
          </button>
          <button
            disabled={!ready}
            type="button"
            aria-label="缩小外观"
            title="缩小"
            onClick={() => zoomRef.current(1.18)}
          >
            <ZoomOut size={17} />
          </button>
          <button
            aria-label="重置三维视角"
            disabled={!ready}
            onClick={() => {
              setRegion(null);
              focusNodeRef.current(null);
            }}
            title="重置视角"
            type="button"
          >
            <RotateCcw aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={rotating ? "暂停自动旋转" : "继续自动旋转"}
            disabled={!ready}
            onClick={toggleRotation}
            title={rotating ? "暂停自动旋转" : "继续自动旋转"}
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
          {hasStPetersContext ? "圣彼得建筑群" : hasBraccioContext ? '新翼陈列馆 · 建筑剖视' : hasPisaContext ? '斜塔 · 柱廊与钟室' : hasSighsContext ? '叹息桥 · 南北立面' : "外观体量示意"}
        </div>
        {webglFailed && (
          <div
            className={`guide-spatial-3d__fallback${hasStPetersContext || hasPisaContext || hasSighsContext || hasChurchContext ? " guide-spatial-3d__fallback--image" : ""}`}
          >
            {hasChurchContext && (
              // oxlint-disable-next-line next/no-img-element -- Generated from the exact local exterior geometry; no WebGL is required.
              <img src={withBasePath(`/models/churches/${guide.slug}.svg`)} width={1000} height={1000} alt={`${guide.title}建筑外观俯视图`} />
            )}
            {hasStPetersContext && (
              // oxlint-disable-next-line next/no-img-element -- Local model snapshot remains available without an image service or WebGL.
              <img
                src={withBasePath("/models/st-peters-exterior.webp")}
                width={1440}
                height={900}
                alt="圣彼得大教堂与广场的静态建筑模型"
              />
            )}
            {hasBraccioContext && <BraccioNuovoPlan />}
            {hasPisaContext && (
              // oxlint-disable-next-line next/no-img-element -- Same-model local snapshot works without WebGL.
              <img src={withBasePath('/models/pisa-exterior.webp')} width={1080} height={1800} alt="比萨斜塔的底层盲拱、六层柱廊和顶部钟室" />
            )}
            {hasSighsContext && (
              // oxlint-disable-next-line next/no-img-element -- Same-model local snapshot works without WebGL.
              <img src={withBasePath('/models/sighs-exterior.webp')} width={1440} height={1200} alt="叹息桥的曲线山墙、石格窗与开放桥腹" />
            )}
            <output>外观模型暂时无法显示，导览内容仍可阅读。</output>
            <button
              type="button"
              onClick={() => {
                setWebglFailed(false);
                setReady(false);
                setRegion(defaultRegion);
                setAttempt((value) => value + 1);
              }}
            >
              <RotateCcw size={17} aria-hidden="true" />
              重新加载外观
            </button>
          </div>
        )}
        {!ready && !webglFailed && (
          <output className="guide-spatial-3d__fallback" aria-live="polite">
            正在加载外观模型
          </output>
        )}
      </div>
      {hasBraccioContext && <fieldset className="guide-spatial-3d__regions guide-spatial-3d__regions--four" aria-label="新翼建筑范围">
        {[{ id: null, label: '新翼全景' }, { id: 'gallery', label: '长廊' }, { id: 'portico', label: '八柱门廊' }, { id: 'hemicycle', label: '半圆厅' }].map(option => <button key={option.id ?? 'all'} type="button" disabled={!ready} aria-pressed={region === option.id} onClick={() => { setRegion(option.id); focusRegionRef.current(option.id); }}>{option.label}</button>)}
      </fieldset>}
      {hasBraccioContext && <details className="guide-spatial__data-status"><summary>新翼平面</summary><BraccioNuovoPlan /></details>}
      {hasPisaContext && <fieldset className="guide-spatial-3d__regions guide-spatial-3d__regions--four" aria-label="斜塔建筑范围">
        {[{ id: null, label: '斜塔全景', short: '全景' }, { id: 'base', label: '底层盲拱', short: '底层' }, { id: 'loggias', label: '六层柱廊', short: '柱廊' }, { id: 'belfry', label: '顶部钟室', short: '钟室' }].map(option => <button key={option.id ?? 'all'} type="button" disabled={!ready} aria-label={option.label} title={option.label} aria-pressed={region === option.id} onClick={() => { setRegion(option.id); focusRegionRef.current(option.id); }}>{option.short}</button>)}
      </fieldset>}
      {hasSighsContext && <fieldset className="guide-spatial-3d__regions guide-spatial-3d__regions--four" aria-label="叹息桥观察方向">
        {[{ id: null, label: '桥体全景', short: '全景' }, { id: 'south', label: '南面·稻草桥方向', short: '南面' }, { id: 'north', label: '北面·卡诺尼卡桥方向', short: '北面' }, { id: 'arch', label: '桥腹拱洞', short: '桥腹' }].map(option => <button key={option.id ?? 'all'} type="button" disabled={!ready} aria-label={option.label} title={option.label} aria-pressed={region === option.id} onClick={() => { setRegion(option.id); focusRegionRef.current(option.id); }}>{option.short}</button>)}
      </fieldset>}
      {hasSighsContext && <details className="guide-spatial__data-status"><summary>桥体范围</summary><p>此处展示叹息桥本体；两端为与总督宫、新监狱连接的截面，并非公共入口。立面比例与屋顶厚度为外观近似，纹章和浮雕仅保留轮廓。内部路线见总督宫导览。</p></details>}
      {hasStPetersContext && (
        <fieldset className="guide-spatial-3d__regions" aria-label="外观范围">
          {(
            [
              { id: null, label: "全景" },
              { id: "basilica", label: "圣彼得大教堂" },
              { id: "square", label: "圣彼得广场" },
            ] as const
          ).map((option) => (
            <button
              disabled={!ready}
              key={option.id ?? "all"}
              type="button"
              aria-pressed={region === option.id}
              onClick={() => {
                setRegion(option.id);
                focusRegionRef.current(option.id);
              }}
            >
              {option.label}
            </button>
          ))}
        </fieldset>
      )}
      <ol className="guide-spatial-3d__nodes">
        {guide.spatial.stops.map((stop, index) => (
          <li key={`${index}-${stop}`}>
            <div className="guide-spatial-3d__unlocated-stop">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stop}</strong>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
