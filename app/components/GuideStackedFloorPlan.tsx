'use client';

import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as ThreeType from 'three';
import type { GuideRecord } from '../data/types';
import {
  compileFloorPlanRoute,
  getFloorPlanCoordinateFrame,
  normalizeFloorPlanPoint,
  splitWallAtOpenings,
  type FloorPlanFloor,
  type FloorPlanRouteSection,
  type PlanPoint,
  type StackedFloorPlan,
} from '../lib/floorplans/core';

type FocusStop = (index: number) => void;
type ZoomScene = (direction: 'in' | 'out' | 'reset') => void;

const floorColors = [
  0xd5b463, 0x8fb6aa, 0xc98d78, 0xa9a0c8, 0x83a7c2, 0xc5a777,
];
const svgFloorColors = [
  '#d5b463',
  '#8fb6aa',
  '#c98d78',
  '#a9a0c8',
  '#83a7c2',
  '#c5a777',
];

function routeLegState(legIndex: number, activeStop: number) {
  if (legIndex === activeStop - 1) return 'active';
  if (legIndex < activeStop - 1) return 'complete';
  return 'upcoming';
}

function orderedFloors(floorPlan: StackedFloorPlan) {
  return [...floorPlan.floors].sort(
    (left, right) => left.stackOrder - right.stackOrder,
  );
}

function floorTransform(floors: FloorPlanFloor[], floorId: string) {
  const index = floors.findIndex((floor) => floor.id === floorId);
  return {
    x: index * 0.55,
    y: index * 2.15,
    z: index * 0.32,
  };
}

function svgPoint(floors: FloorPlanFloor[], floorId: string, point: PlanPoint) {
  const index = floors.findIndex((floor) => floor.id === floorId);
  const normalized = normalizeFloorPlanPoint(floors, point);
  return [
    390 + normalized[0] * 24 + normalized[1] * 10 + index * 34,
    470 - normalized[1] * 12 - index * 94,
  ] as const;
}

function svgPolygon(
  floors: FloorPlanFloor[],
  floorId: string,
  polygon: PlanPoint[],
) {
  return polygon
    .map((point) => svgPoint(floors, floorId, point).join(','))
    .join(' ');
}

function svgFloorPath(floors: FloorPlanFloor[], floor: FloorPlanFloor) {
  const rings = [floor.outline, ...(floor.voids ?? [])];
  return rings
    .map((polygon) => {
      const [first, ...rest] = polygon.map((point) =>
        svgPoint(floors, floor.id, point),
      );
      return `M ${first.join(' ')} ${rest.map((point) => `L ${point.join(' ')}`).join(' ')} Z`;
    })
    .join(' ');
}

function floorWallSegments(floorPlan: StackedFloorPlan, floor: FloorPlanFloor) {
  const frame = getFloorPlanCoordinateFrame(floorPlan.floors);
  const openings = floorPlan.openings
    .filter((opening) => opening.floorId === floor.id)
    .map((opening) => opening.position);
  return [
    floor.outline,
    ...(floor.voids ?? []),
    ...floor.spaces
      .filter((space) => space.kind !== 'courtyard')
      .map((space) => space.polygon),
  ].flatMap((polygon) =>
    polygon
      .slice(1)
      .flatMap((point, index) =>
        splitWallAtOpenings(
          polygon[index],
          point,
          openings,
          0.55 / frame.scale,
          0.34 / frame.scale,
        ),
      ),
  );
}

function svgLayoutBounds(floors: FloorPlanFloor[]) {
  const points = floors.flatMap((floor) =>
    floor.outline.map((point) => svgPoint(floors, floor.id, point)),
  );
  const xValues = points.map(([x]) => x);
  const yValues = points.map(([, y]) => y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const labelTop = minY - floors.length * 22 - 18;
  const padding = 28;
  const labelWidth = Math.max(
    ...floors.map((floor) => floor.label.length * 12),
  );
  const contentWidth = Math.max(maxX - minX, labelWidth);

  return {
    labelTop,
    labelX: minX,
    viewBox: [
      minX - padding,
      labelTop - padding,
      contentWidth + padding * 2,
      maxY - labelTop + padding * 2,
    ].join(' '),
  };
}

function routeSectionPoints(
  floorPlan: StackedFloorPlan,
  floors: FloorPlanFloor[],
  section: FloorPlanRouteSection,
) {
  if (section.kind === 'floor') {
    return section.points.map((point) =>
      svgPoint(floors, section.floorId, point),
    );
  }
  const connector = floorPlan.verticalLinks.find(
    (item) => item.id === section.connectorId,
  )!;
  return [
    svgPoint(
      floors,
      section.fromFloorId,
      connector.landings.find(
        (landing) => landing.floorId === section.fromFloorId,
      )!.position,
    ),
    svgPoint(
      floors,
      section.toFloorId,
      connector.landings.find(
        (landing) => landing.floorId === section.toFloorId,
      )!.position,
    ),
  ];
}

function StackedFloorPlanSvg({
  activeStop,
  floorPlan,
  guide,
}: {
  activeStop: number;
  floorPlan: StackedFloorPlan;
  guide: GuideRecord;
}) {
  const floors = orderedFloors(floorPlan);
  const route = compileFloorPlanRoute(floorPlan);
  const activeRouteStop = floorPlan.routeStops[activeStop];
  const activeFloorId = activeRouteStop?.floorId;
  const layoutBounds = svgLayoutBounds(floors);

  return (
    <svg
      aria-label={`${guide.title}分层室内平面图`}
      className="guide-floorplan__fallback"
      preserveAspectRatio="xMidYMid meet"
      viewBox={layoutBounds.viewBox}
    >
      <title>{guide.title}分层室内平面图</title>
      <desc>所有楼层错位堆叠显示，当前路线所在楼层高亮。</desc>
      {floors.map((floor, floorIndex) => {
        const active = floor.id === activeFloorId;
        return (
          <g data-active={active} key={floor.id}>
            <path
              className="guide-floorplan__floor"
              d={svgFloorPath(floors, floor)}
              fill={svgFloorColors[floorIndex % svgFloorColors.length]}
              fillRule="evenodd"
            />
            {floor.spaces
              .filter((space) => space.kind !== 'courtyard')
              .map((space) => (
                <polygon
                  className="guide-floorplan__space"
                  key={`space-${space.id}`}
                  points={svgPolygon(floors, floor.id, space.polygon)}
                />
              ))}
            {floorWallSegments(floorPlan, floor).map(
              ([start, end], segmentIndex) => {
                const [x1, y1] = svgPoint(floors, floor.id, start);
                const [x2, y2] = svgPoint(floors, floor.id, end);
                return (
                  <line
                    className="guide-floorplan__wall"
                    key={`${floor.id}-wall-${segmentIndex}`}
                    x1={x1}
                    x2={x2}
                    y1={y1}
                    y2={y2}
                  />
                );
              },
            )}
            <text
              className="guide-floorplan__floor-label"
              x={layoutBounds.labelX}
              y={layoutBounds.labelTop + floorIndex * 22}
            >
              {floor.label}
            </text>
            {active &&
              floor.spaces
                .filter((space) => space.id === activeRouteStop?.spaceId)
                .map((space) => {
                  const center = space.polygon
                    .slice(0, -1)
                    .reduce(
                      (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
                      [0, 0],
                    );
                  const count = Math.max(1, space.polygon.length - 1);
                  const [x, y] = svgPoint(floors, floor.id, [
                    center[0] / count,
                    center[1] / count,
                  ]);
                  return (
                    <text
                      className="guide-floorplan__space-label"
                      key={`label-${space.id}`}
                      x={x}
                      y={y}
                    >
                      {guide.spatial.stops[activeStop]}
                    </text>
                  );
                })}
          </g>
        );
      })}
      {floorPlan.verticalLinks.map((link) => {
        const points = link.landings.map((landing) =>
          svgPoint(floors, landing.floorId, landing.position),
        );
        return (
          <g className="guide-floorplan__vertical-link" key={link.id}>
            <title>{link.label}</title>
            <polyline
              points={points.map((point) => point.join(',')).join(' ')}
            />
            {points.map(([x, y], index) => (
              <circle cx={x} cy={y} key={`${link.id}-${index}`} r="3.5" />
            ))}
          </g>
        );
      })}
      {route.legs.flatMap((leg, legIndex) =>
        leg.sections.map((section, sectionIndex) => {
          const points = routeSectionPoints(floorPlan, floors, section);
          return (
            <polyline
              className="guide-floorplan__route"
              data-state={routeLegState(legIndex, activeStop)}
              key={`${legIndex}-${sectionIndex}`}
              points={points.map((point) => point.join(',')).join(' ')}
            />
          );
        }),
      )}
      {floorPlan.routeStops.map((stop, index) => {
        const [x, y] = svgPoint(floors, stop.floorId, stop.position);
        return (
          <g
            className="guide-floorplan__marker"
            data-active={index === activeStop}
            key={`stop-${index}-${stop.floorId}-${stop.spaceId}`}
          >
            <circle cx={x} cy={y} r={index === activeStop ? 9 : 6} />
            <text x={x} y={y + 3}>
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function shapeGeometry(
  THREE: typeof ThreeType,
  polygon: PlanPoint[],
  holes: PlanPoint[][] = [],
) {
  const shape = new THREE.Shape();
  polygon.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  });
  holes.forEach((polygonHole) => {
    const hole = new THREE.Path();
    polygonHole.forEach(([x, z], index) => {
      if (index === 0) hole.moveTo(x, z);
      else hole.lineTo(x, z);
    });
    shape.holes.push(hole);
  });
  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    depth: 0.08,
    steps: 1,
  });
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function addWall(
  THREE: typeof ThreeType,
  root: ThreeType.Group,
  start: PlanPoint,
  end: PlanPoint,
  level: { x: number; y: number; z: number },
  material: ThreeType.Material,
) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const length = Math.hypot(dx, dz);
  if (length === 0) return;
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.36, 0.065),
    material,
  );
  wall.position.set(
    level.x + (start[0] + end[0]) / 2,
    level.y + 0.18,
    level.z + (start[1] + end[1]) / 2,
  );
  wall.rotation.y = -Math.atan2(dz, dx);
  root.add(wall);
}

export function GuideStackedFloorPlan({
  floorPlan,
  guide,
}: {
  floorPlan: StackedFloorPlan;
  guide: GuideRecord;
}) {
  const [activeStop, setActiveStop] = useState(0);
  const [webglState, setWebglState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef<FocusStop>(() => undefined);
  const zoomRef = useRef<ZoomScene>(() => undefined);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const floors = useMemo(() => orderedFloors(floorPlan), [floorPlan]);
  const route = useMemo(() => compileFloorPlanRoute(floorPlan), [floorPlan]);
  const activeFloor = floorPlan.floors.find(
    (floor) => floor.id === floorPlan.routeStops[activeStop]?.floorId,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeCanvas: HTMLCanvasElement = canvas;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    setWebglState('loading');

    async function mount() {
      try {
        const THREE = await import('three');
        const { OrbitControls } =
          await import('three/examples/jsm/controls/OrbitControls.js');
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          canvas: activeCanvas,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x0b0e0d, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-11, 11, 8, -8, 0.1, 100);
        camera.position.set(18, 19, 18);
        const controls = new OrbitControls(camera, activeCanvas);
        controls.enableDamping = false;
        controls.enablePan = true;
        controls.enableRotate = true;
        controls.maxPolarAngle = Math.PI * 0.46;
        controls.minPolarAngle = Math.PI * 0.22;
        controls.target.set(0, (floors.length - 1) * 1.05, 0);
        controls.update();

        scene.add(new THREE.HemisphereLight(0xfaf1dc, 0x1e2925, 2.6));
        const key = new THREE.DirectionalLight(0xffe2a6, 3.4);
        key.position.set(8, 15, 9);
        scene.add(key);

        const root = new THREE.Group();
        scene.add(root);
        const floorMaterials = new Map<
          string,
          ThreeType.MeshStandardMaterial[]
        >();
        const markerGroups: ThreeType.Group[] = [];
        const markerMaterials: ThreeType.MeshStandardMaterial[] = [];
        const pickTargets: ThreeType.Object3D[] = [];
        const legMaterials: ThreeType.LineBasicMaterial[][] = [];

        floors.forEach((floor, floorIndex) => {
          const level = floorTransform(floors, floor.id);
          const floorOpenings = floorPlan.openings
            .filter((opening) => opening.floorId === floor.id)
            .map((opening) =>
              normalizeFloorPlanPoint(floors, opening.position),
            );
          const normalizedOutline = floor.outline.map((point) =>
            normalizeFloorPlanPoint(floors, point),
          );
          const normalizedVoids = floor.voids?.map((floorVoid) =>
            floorVoid.map((point) => normalizeFloorPlanPoint(floors, point)),
          );
          const materials: ThreeType.MeshStandardMaterial[] = [];
          floorMaterials.set(floor.id, materials);
          const floorMaterial = new THREE.MeshStandardMaterial({
            color: floorColors[floorIndex % floorColors.length],
            opacity: 0.22,
            roughness: 0.9,
            side: THREE.DoubleSide,
            transparent: true,
          });
          materials.push(floorMaterial);
          const floorMesh = new THREE.Mesh(
            shapeGeometry(THREE, normalizedOutline, normalizedVoids),
            floorMaterial,
          );
          floorMesh.position.set(level.x, level.y - 0.05, level.z);
          root.add(floorMesh);
          floor.spaces.forEach((planSpace) => {
            if (planSpace.kind === 'courtyard') return;
            const material = new THREE.MeshStandardMaterial({
              color: floorColors[floorIndex % floorColors.length],
              opacity: 0.5,
              roughness: 0.82,
              side: THREE.DoubleSide,
              transparent: true,
            });
            materials.push(material);
            const mesh = new THREE.Mesh(
              shapeGeometry(
                THREE,
                planSpace.polygon.map((point) =>
                  normalizeFloorPlanPoint(floors, point),
                ),
              ),
              material,
            );
            mesh.position.set(level.x, level.y, level.z);
            root.add(mesh);
          });
          const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xe9e3d8,
            opacity: 0.72,
            roughness: 0.9,
            transparent: true,
          });
          materials.push(wallMaterial);
          normalizedOutline.slice(1).forEach((point, index) => {
            splitWallAtOpenings(
              normalizedOutline[index],
              point,
              floorOpenings,
            ).forEach(([start, end]) => {
              addWall(THREE, root, start, end, level, wallMaterial);
            });
          });
          normalizedVoids?.forEach((floorVoid) => {
            floorVoid.slice(1).forEach((point, index) => {
              splitWallAtOpenings(
                floorVoid[index],
                point,
                floorOpenings,
              ).forEach(([start, end]) => {
                addWall(THREE, root, start, end, level, wallMaterial);
              });
            });
          });
          floor.spaces
            .filter((planSpace) => planSpace.kind !== 'courtyard')
            .forEach((planSpace) => {
              const normalizedPolygon = planSpace.polygon.map((point) =>
                normalizeFloorPlanPoint(floors, point),
              );
              normalizedPolygon.slice(1).forEach((point, index) => {
                splitWallAtOpenings(
                  normalizedPolygon[index],
                  point,
                  floorOpenings,
                ).forEach(([start, end]) => {
                  addWall(THREE, root, start, end, level, wallMaterial);
                });
              });
            });
        });

        floorPlan.verticalLinks.forEach((link) => {
          const points = link.landings.map((landing) => {
            const level = floorTransform(floors, landing.floorId);
            const position = normalizeFloorPlanPoint(floors, landing.position);
            return new THREE.Vector3(
              level.x + position[0],
              level.y + 0.25,
              level.z + position[1],
            );
          });
          const material = new THREE.LineBasicMaterial({
            color: link.kind === 'lift' ? 0x8fb6aa : 0xf0d085,
            opacity: 0.9,
            transparent: true,
          });
          root.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(points),
              material,
            ),
          );
          points.forEach((position) => {
            const landing = new THREE.Mesh(
              link.kind === 'lift'
                ? new THREE.BoxGeometry(0.25, 0.25, 0.25)
                : new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12),
              material,
            );
            landing.position.copy(position);
            root.add(landing);
          });
        });

        floorPlan.openings.forEach((opening) => {
          const level = floorTransform(floors, opening.floorId);
          const position = normalizeFloorPlanPoint(floors, opening.position);
          const marker = new THREE.Mesh(
            opening.kind === 'gate'
              ? new THREE.BoxGeometry(0.3, 0.32, 0.1)
              : new THREE.TorusGeometry(0.16, 0.035, 8, 18, Math.PI),
            new THREE.MeshBasicMaterial({ color: 0xf2d47b }),
          );
          marker.position.set(
            level.x + position[0],
            level.y + 0.12,
            level.z + position[1],
          );
          root.add(marker);
        });

        floorPlan.routeStops.forEach((stop, index) => {
          const level = floorTransform(floors, stop.floorId);
          const position = normalizeFloorPlanPoint(floors, stop.position);
          const group = new THREE.Group();
          group.position.set(
            level.x + position[0],
            level.y + 0.28,
            level.z + position[1],
          );
          const material = new THREE.MeshStandardMaterial({
            color:
              index === 0
                ? 0x78c7a4
                : index === floorPlan.routeStops.length - 1
                  ? 0xf0d085
                  : 0xd8b653,
            emissive: 0x000000,
          });
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 18, 12),
            material,
          );
          marker.userData.stopIndex = index;
          group.add(marker);
          root.add(group);
          markerGroups.push(group);
          markerMaterials.push(material);
          pickTargets.push(marker);
        });

        route.legs.forEach((leg, legIndex) => {
          const materials: ThreeType.LineBasicMaterial[] = [];
          legMaterials[legIndex] = materials;
          leg.sections.forEach((section) => {
            let points: ThreeType.Vector3[];
            if (section.kind === 'floor') {
              const level = floorTransform(floors, section.floorId);
              points = section.points.map((point) => {
                const [x, z] = normalizeFloorPlanPoint(floors, point);
                return new THREE.Vector3(
                  level.x + x,
                  level.y + 0.24,
                  level.z + z,
                );
              });
            } else {
              const connector = floorPlan.verticalLinks.find(
                (item) => item.id === section.connectorId,
              )!;
              points = [section.fromFloorId, section.toFloorId].map(
                (floorId) => {
                  const level = floorTransform(floors, floorId);
                  const landing = connector.landings.find(
                    (item) => item.floorId === floorId,
                  )!;
                  const position = normalizeFloorPlanPoint(
                    floors,
                    landing.position,
                  );
                  return new THREE.Vector3(
                    level.x + position[0],
                    level.y + 0.24,
                    level.z + position[1],
                  );
                },
              );
            }
            const material = new THREE.LineBasicMaterial({
              color: 0x756f62,
              opacity: 0.36,
              transparent: true,
            });
            materials.push(material);
            root.add(
              new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points),
                material,
              ),
            );
          });
        });

        function updateState(index: number) {
          setActiveStop(index);
          const activeFloorId = floorPlan.routeStops[index].floorId;
          floorMaterials.forEach((materials, floorId) => {
            materials.forEach((material) => {
              material.opacity = floorId === activeFloorId ? 0.82 : 0.24;
            });
          });
          markerGroups.forEach((group, markerIndex) => {
            group.scale.setScalar(markerIndex === index ? 1.45 : 1);
            markerMaterials[markerIndex].emissive.set(
              markerIndex === index ? 0xd8b653 : 0x000000,
            );
            markerMaterials[markerIndex].emissiveIntensity =
              markerIndex === index ? 0.55 : 0;
          });
          legMaterials.forEach((materials, legIndex) => {
            const state = routeLegState(legIndex, index);
            materials.forEach((material) => {
              material.color.set(
                state === 'active'
                  ? 0xf0d085
                  : state === 'complete'
                    ? 0x78c7a4
                    : 0x756f62,
              );
              material.opacity = state === 'upcoming' ? 0.25 : 0.9;
            });
          });
          const stop = floorPlan.routeStops[index];
          const level = floorTransform(floors, stop.floorId);
          const position = normalizeFloorPlanPoint(floors, stop.position);
          controls.target.set(
            level.x + position[0],
            level.y,
            level.z + position[1],
          );
          controls.update();
        }
        focusRef.current = updateState;
        updateState(0);

        zoomRef.current = (direction) => {
          if (direction === 'reset') {
            camera.zoom = 1;
            camera.position.set(18, 19, 18);
            controls.target.set(0, (floors.length - 1) * 1.05, 0);
          } else {
            camera.zoom = Math.min(
              2.2,
              Math.max(0.7, camera.zoom + (direction === 'in' ? 0.18 : -0.18)),
            );
          }
          camera.updateProjectionMatrix();
          controls.update();
        };

        const pointer = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        function selectAtPointer(event: PointerEvent) {
          const bounds = activeCanvas.getBoundingClientRect();
          pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
          pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(pickTargets, false)[0];
          if (hit) updateState(hit.object.userData.stopIndex as number);
        }
        activeCanvas.addEventListener('pointerup', selectAtPointer);

        let firstFrame = true;
        function renderScene() {
          if (disposed) return;
          renderer.render(scene, camera);
          if (firstFrame) {
            firstFrame = false;
            activeCanvas.dataset.rendered = 'true';
            setWebglState('ready');
          }
        }
        controls.addEventListener('change', renderScene);

        function resize() {
          const width = activeCanvas.clientWidth;
          const height = activeCanvas.clientHeight;
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          const aspect = width / height;
          camera.left = -8.5 * aspect;
          camera.right = 8.5 * aspect;
          camera.top = 8.5;
          camera.bottom = -8.5;
          camera.updateProjectionMatrix();
          renderScene();
        }
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(activeCanvas);
        resize();

        function contextLost(event: Event) {
          event.preventDefault();
          setWebglState('failed');
        }
        activeCanvas.addEventListener('webglcontextlost', contextLost);

        renderScene();

        cleanup = () => {
          resizeObserver.disconnect();
          activeCanvas.removeEventListener('pointerup', selectAtPointer);
          activeCanvas.removeEventListener('webglcontextlost', contextLost);
          controls.removeEventListener('change', renderScene);
          controls.dispose();
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          renderer.dispose();
        };
      } catch {
        if (!disposed) setWebglState('failed');
      }
    }

    void mount();
    return () => {
      disposed = true;
      cleanup?.();
      focusRef.current = () => undefined;
      zoomRef.current = () => undefined;
    };
  }, [floorPlan, floors, route]);

  function selectStop(index: number) {
    focusRef.current(index);
    setActiveStop(index);
  }

  function moveStop(index: number, key: string) {
    let next = index;
    if (key === 'ArrowDown' || key === 'ArrowRight')
      next = Math.min(index + 1, guide.spatial.stops.length - 1);
    if (key === 'ArrowUp' || key === 'ArrowLeft') next = Math.max(index - 1, 0);
    if (key === 'Home') next = 0;
    if (key === 'End') next = guide.spatial.stops.length - 1;
    if (next !== index) {
      selectStop(next);
      buttonRefs.current[next]?.focus();
    }
  }

  return (
    <section
      aria-label={`${guide.title}分层室内空间示意`}
      className="guide-spatial-3d guide-floorplan"
    >
      <div className="guide-spatial-3d__stage" data-webgl={webglState}>
        <StackedFloorPlanSvg
          activeStop={activeStop}
          floorPlan={floorPlan}
          guide={guide}
        />
        <canvas
          aria-hidden="true"
          className="guide-spatial-3d__canvas guide-floorplan__canvas"
          ref={canvasRef}
        />
        <div aria-label="地图视角控制" className="guide-spatial-3d__toolbar">
          <button
            aria-label="重置室内视角"
            onClick={() => zoomRef.current('reset')}
            title="重置视角"
            type="button"
          >
            <RotateCcw aria-hidden="true" size={17} />
          </button>
          <button
            aria-label="放大室内地图"
            onClick={() => zoomRef.current('in')}
            title="放大"
            type="button"
          >
            <ZoomIn aria-hidden="true" size={17} />
          </button>
          <button
            aria-label="缩小室内地图"
            onClick={() => zoomRef.current('out')}
            title="缩小"
            type="button"
          >
            <ZoomOut aria-hidden="true" size={17} />
          </button>
        </div>
        <div className="guide-spatial-3d__hint">
          拖动查看层叠关系 · 滚轮或双指缩放 · 点击节点聚焦
        </div>
        {webglState === 'loading' && (
          <div className="guide-floorplan__state">正在加载室内地图</div>
        )}
        {webglState === 'failed' && (
          <div className="guide-floorplan__state">已切换为静态分层地图</div>
        )}
      </div>
      <ol aria-label="室内参观路线" className="guide-spatial-3d__nodes">
        {guide.spatial.stops.map((stop, index) => {
          const floor = floorPlan.floors.find(
            (item) => item.id === floorPlan.routeStops[index].floorId,
          )!;
          return (
            <li key={`${index}-${stop}`}>
              <button
                aria-current={activeStop === index ? 'step' : undefined}
                aria-label={`聚焦${stop}`}
                data-active={activeStop === index}
                onClick={() => selectStop(index)}
                onKeyDown={(event) => moveStop(index, event.key)}
                ref={(element) => {
                  buttonRefs.current[index] = element;
                }}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{stop}</strong>
                <small>{floor.label}</small>
              </button>
            </li>
          );
        })}
      </ol>
      <output aria-label="当前路线" aria-live="polite" className="sr-only">
        {activeFloor?.label}，{guide.spatial.stops[activeStop]}
      </output>
    </section>
  );
}
