import type * as ThreeType from 'three';
import { sighsExterior as spec } from '../data/sighs-exterior';

type Merge = (geometries: ThreeType.BufferGeometry[], useGroups?: boolean) => ThreeType.BufferGeometry | null;

export function buildSighsExterior(THREE: typeof ThreeType, merge: Merge) {
  const root = new THREE.Group();
  const stone = 0xc4bda9, moulding = 0xe1d9c5, inset = 0xa29b89, roof = 0x777671;
  const batches = new Map<number, ThreeType.BufferGeometry[]>();
  const features: Record<string, number> = {};
  function add(id: string, geometry: ThreeType.BufferGeometry, color = stone) {
    features[id] = (features[id] ?? 0) + 1;
    if (geometry.index) {
      const indexed = geometry;
      geometry = indexed.toNonIndexed();
      indexed.dispose();
    }
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color)!.push(geometry);
  }
  function box(id: string, x: number, y: number, z: number, w: number, h: number, d: number, color = stone) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    geometry.translate(x, y, z); add(id, geometry, color);
  }
  function path(points: readonly (readonly number[])[]) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath(); return shape;
  }
  function softenedContour(points: readonly (readonly number[])[]) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => {
      const current = new THREE.Vector2(x, y);
      const previous = new THREE.Vector2(...points[(index + points.length - 1) % points.length]);
      const next = new THREE.Vector2(...points[(index + 1) % points.length]);
      const radius = Math.min(0.12, current.distanceTo(previous) / 3, current.distanceTo(next) / 3);
      const start = previous.sub(current).setLength(radius).add(current), end = next.sub(current).setLength(radius).add(current);
      if (index === 0) shape.moveTo(start.x, start.y);
      else shape.lineTo(start.x, start.y);
      shape.quadraticCurveTo(x, y, end.x, end.y);
    });
    shape.closePath(); return shape;
  }
  function extrude(id: string, shape: ThreeType.Shape, z: number, depth: number, color = stone) {
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
    geometry.translate(0, 0, z); add(id, geometry, color);
  }
  function tube(id: string, points: ThreeType.Vector3[], radius: number, color = moulding) {
    add(id, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(12, points.length * 3), radius, 6, false), color);
  }
  function line(id: string, a: number[], b: number[], radius: number, color = moulding) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const geometry = new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 6);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize()));
    geometry.translate(...start.add(end).multiplyScalar(0.5).toArray()); add(id, geometry, color);
  }
  function archCurve(height: number) {
    return new THREE.CubicBezierCurve(new THREE.Vector2(-6, 0), new THREE.Vector2(-6, height * 4 / 3), new THREE.Vector2(6, height * 4 / 3), new THREE.Vector2(6, 0));
  }
  // A continuous, open intrados, not a dark decal on a solid bridge block.
  const intrados = archCurve(2.78);
  const arch = path([...intrados.getPoints(96).map(point => point.toArray()), [6, spec.floor], [-6, spec.floor]]);
  extrude('bridge-arch', arch, -spec.halfDepth, spec.halfDepth * 2);
  box('deck', 0, spec.floor + 0.08, 0, 12, 0.16, spec.halfDepth * 2, moulding);

  const outline = path([[-6, spec.floor], [6, spec.floor], [6, spec.cornice], [-6, spec.cornice]]);
  for (const x of spec.windowCenters) {
    const { width, height, sill } = spec.window;
    outline.holes.push(path([[x - width / 2, sill], [x - width / 2, sill + height], [x + width / 2, sill + height], [x + width / 2, sill]]));
  }
  for (const side of [1, -1]) {
    const face = spec.halfDepth * side;
    const outside = face + side * 0.06;
    extrude('windowed-face', outline, side > 0 ? face - spec.wall : face, spec.wall);
    const crestShape = softenedContour(spec.crest);
    extrude('curved-pediment', crestShape, side > 0 ? face - 0.24 : face, 0.24);
    for (const [y, h, depth] of [[3.55, 0.16, 0.60], [3.77, 0.10, 0.46], [6.30, 0.10, 0.47], [6.47, 0.17, 0.66], [6.63, 0.07, 0.48]]) {
      box('cornice-course', 0, y, face, 12.18, h, depth, moulding);
    }
    for (const x of spec.pilasters) {
      box('pilaster', x, 5.10, outside, 0.39, 2.32, 0.14, moulding);
      for (const y of [3.93, 4.24, 4.65, 5.12, 5.59, 5.99]) {
        box('pilaster-joint', x, y, outside + side * 0.078, 0.39, 0.025, 0.018, inset);
      }
      box('pilaster-base', x, 3.98, outside, 0.55, 0.19, 0.25, moulding);
      box('pilaster-capital', x, 6.14, outside, 0.57, 0.20, 0.27, moulding);
    }
    for (const x of spec.windowCenters) {
      const { width, height, sill } = spec.window;
      const frame = path([[x - width / 2 - 0.13, sill - 0.13], [x + width / 2 + 0.13, sill - 0.13], [x + width / 2 + 0.13, sill + height + 0.13], [x - width / 2 - 0.13, sill + height + 0.13]]);
      frame.holes.push(path([[x - width / 2, sill], [x - width / 2, sill + height], [x + width / 2, sill + height], [x + width / 2, sill]]));
      extrude('open-window-frame', frame, side > 0 ? face - 0.04 : face - 0.16, 0.20, moulding);
      // Three by three radial stone-grid cells visible in the facade photos.
      // Curved leaf carving is reduced to bars, while every interstice is open.
      const cell = width / 3;
      for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
        const cx = x - width / 2 + cell * (col + 0.5), cy = sill + height * (row + 0.5) / 3;
        for (let ray = 0; ray < 8; ray++) {
          const angle = ray * Math.PI / 4;
          line('window-stone-spoke', [cx, cy, face], [cx + Math.cos(angle) * cell * 0.51, cy + Math.sin(angle) * cell * 0.51, face], 0.024);
        }
      }
      for (let split = 1; split < 3; split++) {
        line('window-stone-grid', [x - width / 2 + cell * split, sill, face], [x - width / 2 + cell * split, sill + height, face], 0.021);
        line('window-stone-grid', [x - width / 2, sill + height * split / 3, face], [x + width / 2, sill + height * split / 3, face], 0.021);
      }
      // Recessed rectangular panel and circular medallion below each window.
      box('window-lower-panel', x, 4.18, outside, 1.43, 0.58, 0.06, inset);
      const ring = new THREE.TorusGeometry(0.25, 0.035, 6, 32);
      ring.translate(x, 4.18, face + side * 0.11); add('lower-medallion-ring', ring);
    }
    for (const x of [-4.72, 0, 4.72]) {
      if (x !== 0) {
        box('blind-panel', x, 5.33, outside, 1.48, 1.22, 0.06, inset);
        for (const y of [4.70, 5.96]) box('panel-moulding', x, y, outside + side * 0.04, 1.55, 0.045, 0.05, moulding);
        for (const dx of [-0.76, 0.76]) box('panel-moulding', x + dx, 5.33, outside + side * 0.04, 0.045, 1.22, 0.05, moulding);
      }
    }
    // The northern lozenge shield is not a mirror copy of the sea-face crest.
    const crestPoints = side > 0
      ? [[-0.31, 5.82], [-0.21, 5.62], [-0.30, 5.27], [-0.16, 5.03], [0, 4.95], [0.16, 5.03], [0.30, 5.27], [0.21, 5.62], [0.31, 5.82]]
      : [[0, 5.94], [-0.47, 5.50], [0, 4.98], [0.47, 5.50]];
    const crestOutline = [...crestPoints, crestPoints[0]].map(([x, y]) => new THREE.Vector3(x, y, face + side * 0.15));
    tube(side > 0 ? 'south-shield-envelope' : 'north-shield-envelope', crestOutline, 0.055);
    const pedimentCurve = new THREE.CubicBezierCurve(new THREE.Vector2(-6, 6.70), new THREE.Vector2(-3.0, 9.63), new THREE.Vector2(3.0, 9.63), new THREE.Vector2(6, 6.70));
    tube('pediment-arch-moulding', pedimentCurve.getPoints(64).map(v => new THREE.Vector3(v.x, v.y, face + side * 0.08)), 0.10);
    for (const x of [-3.0, -1.4, 1.4, 3.0]) {
      const top = 6.7 + 2.15 * (1 - x * x / 36);
      line('pediment-stone-joint', [x, 6.74, outside], [x, top, outside], 0.013, inset);
    }
    box('upper-relief-envelope', 0, 7.55, outside, 1.0, 1.23, 0.055, stone);
    box('upper-relief-plinth', 0, 6.96, outside, 1.12, 0.20, 0.18, moulding);
    // Curled silhouette, not invented figurative lions or face sculptures.
    for (const [x, y, radius] of [[-0.85, 9.61, 0.41], [0.85, 9.61, 0.41], [-4.50, 8.75, 0.22], [-3.05, 8.76, 0.21], [3.08, 8.74, 0.21], [4.51, 8.75, 0.22]]) {
      const disc = new THREE.CylinderGeometry(radius + 0.07, radius + 0.07, 0.18, 40);
      disc.rotateX(Math.PI / 2); disc.translate(x, y, face + side * 0.01);
      add('volute-stone-disc', disc);
      const spiral = Array.from({ length: 48 }, (_, i) => {
        const angle = i / 47 * Math.PI * 3.2, r = radius * (1 - i / 54);
        return new THREE.Vector3(x + Math.cos(angle) * r, y + Math.sin(angle) * r, face + side * 0.13);
      });
      tube('crest-volute', spiral, 0.044);
    }
    tube('intrados-moulding', intrados.getPoints(96).map(v => new THREE.Vector3(v.x, v.y + 0.06, face + side * 0.05)), 0.065);
    tube('extrados-moulding', intrados.getPoints(96).map(v => new THREE.Vector3(v.x, v.y + 0.48, face + side * 0.08)), 0.065);
    for (let joint = 1; joint < 16; joint++) {
      const point = intrados.getPoint(joint / 16);
      line('arch-stone-joint', [point.x, point.y + 0.13, outside], [point.x, point.y + 0.43, outside], 0.022, inset);
    }
  }

  // Only the bridge segment of the two plan corridors is represented. Open
  // connection cuts are not new entrances, or a reconstructed palace/prison.
  box('passage-divider', 0, (spec.floor + spec.cornice) / 2, 0, 12, spec.cornice - spec.floor, spec.divider);
  const cover = new THREE.Shape();
  cover.moveTo(-6, 6.64);
  cover.bezierCurveTo(-3, 9.63, 3, 9.63, 6, 6.64);
  cover.lineTo(6, 6.48);
  cover.bezierCurveTo(3, 9.43, -3, 9.43, -6, 6.48);
  cover.closePath();
  extrude('roof-envelope', cover, -spec.halfDepth + 0.22, spec.halfDepth * 2 - 0.44, roof);

  for (const [color, geometries] of batches) {
    const geometry = merge(geometries, false);
    geometries.forEach(item => item.dispose());
    if (!geometry) throw new Error('Bridge exterior material merge failed');
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.84, metalness: 0.015, side: THREE.DoubleSide }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh);
  }
  root.userData = { id: spec.id, featureCounts: features, sourceState: spec.sourceState, focusRegions: spec.focusRegions };
  return root;
}
