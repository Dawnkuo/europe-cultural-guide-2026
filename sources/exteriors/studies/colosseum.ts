import type * as Three from 'three';

type Point = [number, number];
type Merge = (geometries: Three.BufferGeometry[]) => Three.BufferGeometry | null;

// Internal study only: not imported by any public route. Current ground-plan
// registration and upper damage profiles must pass before release integration.
// Four-centre outline fit, not a survey or a room plan. The equal-axis fit and
// current/historical distinctions are documented in sources/exteriors/review.md.
export function colosseumOutline(t: number, inset = 0): Point {
  const angle = ((t % 1) + 1) % 1 * Math.PI * 2;
  const sx = Math.cos(angle) < 0 ? -1 : 1;
  const sz = Math.sin(angle) < 0 ? -1 : 1;
  const a = 94, b = 78, endRadius = 69;
  const cx = a - endRadius;
  const cz = (cx * cx - (b - endRadius) ** 2) / (2 * (b - endRadius));
  const join = Math.atan2(cz, cx);
  const q = Math.atan2(Math.abs(Math.sin(angle)), Math.abs(Math.cos(angle)));
  const radius = q <= join ? endRadius - inset : b + cz - inset;
  return [
    sx * ((q <= join ? cx : 0) + radius * Math.cos(q)) * 0.075,
    sz * ((q <= join ? 0 : -cz) + radius * Math.sin(q)) * 0.075,
  ];
}

export function buildColosseumExterior(THREE: typeof Three, merge: Merge) {
  const group = new THREE.Group();
  const batches = new Map<number, Three.BufferGeometry[]>();
  const features: Record<string, number> = {};
  const travertine = 0xcabca0, moulding = 0xe3d1aa, brick = 0x967562;
  const scale = 0.075;
  function add(kind: string, geometry: Three.BufferGeometry, color: number) {
    geometry.deleteAttribute('uv');
    const plain = geometry.index ? geometry.toNonIndexed() : geometry;
    if (plain !== geometry) geometry.dispose();
    const list = batches.get(color) ?? [];
    list.push(plain);
    batches.set(color, list);
    features[kind] = (features[kind] ?? 0) + 1;
  }
  // Sample by arc length so the tighter end curves do not compress the bays.
  // Axis openings are a simplified rhythm, not an as-built width inventory.
  const samples = Array.from({ length: 1601 }, (_, i) => colosseumOutline(i / 1600));
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) lengths.push(lengths[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
  const perimeter = lengths.at(-1)!;
  const stations = Array.from({ length: 81 }, (_, i) => {
    const distance = i * perimeter / 80;
    let index = lengths.findIndex(value => value >= distance);
    index = Math.max(1, index);
    return (index - 1 + (distance - lengths[index - 1]) / (lengths[index] - lengths[index - 1])) / 1600;
  });
  const at = (bay: number, inset = 0) => colosseumOutline(stations[bay], inset);
  const frame = (bay: number, inset: number) => {
    const a = at(bay, inset), b = at(bay + 1, inset);
    const width = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, width, rotation: -Math.atan2(b[1] - a[1], b[0] - a[0]) };
  };
  function place(geometry: Three.BufferGeometry, bay: number, inset: number, y: number, depth: number) {
    const f = frame(bay, inset);
    geometry.translate(0, y, -depth / 2);
    geometry.rotateY(f.rotation);
    geometry.translate(f.x, 0, f.z);
    return geometry;
  }
  function panel(bay: number, inset: number, base: number, height: number, depth: number, opening: 'arch' | 'window' | 'blank', color: number, kind: string) {
    const f = frame(bay, inset), half = f.width / 2 + 0.012;
    const radius = Math.min(f.width * 0.32, height * 0.3);
    const shape = new THREE.Shape();
    shape.moveTo(-half, 0); shape.lineTo(-half, height); shape.lineTo(half, height); shape.lineTo(half, 0);
    if (opening === 'arch') {
      const spring = height * 0.48;
      shape.lineTo(radius, 0); shape.lineTo(radius, spring);
      shape.absarc(0, spring, radius, 0, Math.PI, false);
      shape.lineTo(-radius, 0);
    } else if (opening === 'window') {
      const hole = new THREE.Path();
      const w = f.width * 0.2, bottom = height * 0.3, top = height * 0.67;
      hole.moveTo(-w, bottom); hole.lineTo(w, bottom); hole.lineTo(w, top); hole.lineTo(-w, top); hole.closePath();
      shape.holes.push(hole);
    }
    shape.closePath();
    add(kind, place(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 }), bay, inset, base, depth), color);
  }
  function strip(bay: number, inset: number, y: number, height: number, depth: number, kind: string, color = moulding) {
    const width = frame(bay, inset).width + 0.024;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.translate(0, height / 2, depth / 2);
    add(kind, place(geometry, bay, inset, y, depth), color);
  }
  // The surviving northern perimeter is not mirrored into the lost south.
  // 39 extant arches are described by Coccia et al.; modern end supports are
  // separate masses. Detailed damage/window census remains a source limitation.
  const north = Array.from({ length: 39 }, (_, i) => i + 40);
  const levels = [[0.08, 10.5 * scale], [10.7 * scale, 11.0 * scale], [21.9 * scale, 10.6 * scale]];
  for (const bay of north) {
    for (const [order, [base, height]] of levels.entries()) {
      panel(bay, 0, base, height, 0.21, 'arch', travertine, `north-arcade-${order + 1}`);
      strip(bay, 0, base + height - 0.06, 0.075, 0.27, 'north-entablature');
      const [x, z] = at(bay);
      const previous = colosseumOutline(stations[bay] - 0.0001), next = colosseumOutline(stations[bay] + 0.0001);
      const dx = next[0] - previous[0], dz = next[1] - previous[1], len = Math.hypot(dx, dz);
      const column = new THREE.CylinderGeometry(0.041, 0.052, height - 0.13, 10);
      column.translate(x + dz / len * 0.1, base + (height - 0.13) / 2, z - dx / len * 0.1);
      add('engaged-column', column, moulding);
    }
    panel(bay, 0, 32.5 * scale, 15.9 * scale, 0.19, bay % 2 ? 'window' : 'blank', travertine, 'north-attic');
    strip(bay, 0, 48.4 * scale, 0.07, 0.28, 'attic-cornice');
  }
  // The exposed southern elevation is the third structural ring, not the
  // vanished outer facade. Keep its two arcades and upper window band distinct.
  for (let bay = 0; bay < 80; bay++) {
    for (const [order, [base, height]] of levels.slice(0, 2).entries()) {
      panel(bay, 14, base, height, 0.23, 'arch', travertine, `inner-arcade-${order + 1}`);
      strip(bay, 14, base + height - 0.05, 0.07, 0.28, 'inner-stringcourse', brick);
    }
    panel(bay, 14, 21.9 * scale, 6.3 * scale, 0.19, 'window', brick, 'inner-window-band');
  }
  // Two missing southern ambulatories remain an empty footprint, not a
  // reconstructed wall. No idealized seating bowl, arena lid or velarium.
  for (const bay of [39, 79]) {
    const f = frame(bay, 0);
    const shape = new THREE.Shape();
    const direction = bay === 39 ? 1 : -1;
    shape.moveTo(0, 0.08); shape.lineTo(direction * 0.83, 0.08);
    shape.lineTo(direction * 0.12, 3.7); shape.lineTo(0, 3.7); shape.closePath();
    const buttress = new THREE.ExtrudeGeometry(shape, { depth: 0.38, bevelEnabled: false });
    buttress.translate(0, 0, -0.19); buttress.rotateY(f.rotation); buttress.translate(f.x, 0, f.z);
    add(bay === 39 ? 'stern-support-envelope' : 'valadier-support-envelope', buttress, brick);
  }
  for (const [color, geometries] of batches) {
    const combined = merge(geometries);
    geometries.forEach(geometry => geometry.dispose());
    if (!combined) throw new Error('Cannot merge Colosseum exterior');
    const mesh = new THREE.Mesh(combined, new THREE.MeshStandardMaterial({ color, roughness: 0.93, metalness: 0 }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.featureCounts = features;
  group.userData.scope = 'exterior-arcade-study-pending-current-surface-trace';
  group.userData.northBays = north;
  group.userData.bayStations = stations;
  return group;
}
