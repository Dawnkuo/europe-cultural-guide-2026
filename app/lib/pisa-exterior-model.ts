import type * as ThreeType from 'three';
import { pisaAxisX, pisaExterior as specification, pisaLevels, pisaSectionAngle } from '../data/pisa-exterior';

type Merge = (geometries: ThreeType.BufferGeometry[], useGroups?: boolean) => ThreeType.BufferGeometry | null;

export function buildPisaExterior(THREE: typeof ThreeType, merge: Merge) {
  const root = new THREE.Group();
  const batches = new Map<number, ThreeType.BufferGeometry[]>();
  const counts: Record<string, number> = {};
  const featureBounds = new Map<string, ThreeType.Box3>();
  const stone = 0xcec9bb, light = 0xe5e0d1, darkStone = 0x9eaaa5, bronze = 0x414a48;
  const detail = specification.detail;
  const tau = Math.PI * 2;

  function add(kind: string, geometry: ThreeType.BufferGeometry, color: number, region: string) {
    geometry.deleteAttribute('uv');
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), angle = pisaSectionAngle(y);
      positions.setXYZ(i, pisaAxisX(y) + x * Math.cos(angle), y - x * Math.sin(angle), positions.getZ(i));
    }
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const regionBounds = featureBounds.get(region) ?? new THREE.Box3();
    regionBounds.union(geometry.boundingBox!);
    featureBounds.set(region, regionBounds);
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    const pieces = batches.get(color) ?? [];
    pieces.push(flat);
    batches.set(color, pieces);
    counts[kind] = (counts[kind] ?? 0) + 1;
  }

  function ring(kind: string, inside: number, outside: number, bottom: number, top: number, color: number, region: string) {
    const section = [new THREE.Vector2(inside, bottom), new THREE.Vector2(outside, bottom), new THREE.Vector2(outside, top), new THREE.Vector2(inside, top), new THREE.Vector2(inside, bottom)];
    add(kind, new THREE.LatheGeometry(section, 120), color, region);
  }

  function column(kind: string, radius: number, angle: number, bottom: number, top: number, region: string, shaftRadius = detail.shaftRadius as number) {
    const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius;
    const shaft = new THREE.CylinderGeometry(shaftRadius * 0.85, shaftRadius, top - bottom - 0.5, 12);
    shaft.translate(x, (bottom + top) / 2 - 0.025, z);
    add(kind, shaft, light, region);
    for (const [y, width, height] of [[bottom + 0.12, shaftRadius * 2.7, 0.24], [top - 0.16, detail.capitalWidth * shaftRadius / detail.shaftRadius, 0.32]]) {
      const block = new THREE.BoxGeometry(width, height, width);
      block.rotateY(angle); block.translate(x, y, z);
      add(`${kind}-capital-base`, block, light, region);
    }
  }

  // A curved annular bay with a true arch opening, including its reveal.
  // Extruding a tangent rectangle would create disconnected, faceted walls.
  function arcade(kind: string, radius: number, thickness: number, angle: number, span: number, bottom: number, spring: number, top: number, region: string, openingRatio = 0.73, sill = bottom, color = stone) {
    const half = radius * span / 2, opening = half * openingRatio;
    const shape = new THREE.Shape();
    shape.moveTo(-half, bottom); shape.lineTo(-opening, bottom);
    shape.lineTo(-opening, spring);
    shape.absarc(0, spring, opening, Math.PI, 0, true);
    shape.lineTo(opening, bottom); shape.lineTo(half, bottom);
    shape.lineTo(half, top); shape.lineTo(-half, top); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 10, steps: 1 });
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const a = angle + position.getX(i) / radius;
      const r = radius - thickness / 2 + position.getZ(i);
      position.setXYZ(i, Math.sin(a) * r, position.getY(i), Math.cos(a) * r);
    }
    add(kind, geometry, color, region);
    if (sill > bottom) {
      const inside = radius - thickness / 2, outside = radius + thickness / 2;
      const fill = new THREE.LatheGeometry([new THREE.Vector2(inside, bottom), new THREE.Vector2(outside, bottom), new THREE.Vector2(outside, sill), new THREE.Vector2(inside, sill), new THREE.Vector2(inside, bottom)], 12, angle - span / 2, span);
      add(`${kind}-sill`, fill, color, region);
    }
  }

  const levels = pisaLevels();
  const baseTop = levels[0].bottom;
  // The entrance is the single opening in the base shell. Its local azimuth
  // is a drawing orientation, not a georeferenced visitor coordinate.
  const baseSpan = tau / specification.base.arches;
  for (let bay = 0; bay < specification.base.arches; bay++) {
    const angle = bay * baseSpan;
    if (bay === 0) {
      arcade('base-door', (specification.base.outerRadius + specification.base.innerRadius) / 2, specification.base.outerRadius - specification.base.innerRadius, angle, baseSpan, 0, detail.entranceHeight - detail.entranceWidth / 2, baseTop, 'base', detail.entranceWidth / (((specification.base.outerRadius + specification.base.innerRadius) / 2) * baseSpan));
    } else {
      const shell = new THREE.LatheGeometry([new THREE.Vector2(specification.base.innerRadius, 0), new THREE.Vector2(specification.base.outerRadius, 0), new THREE.Vector2(specification.base.outerRadius, baseTop), new THREE.Vector2(specification.base.innerRadius, baseTop), new THREE.Vector2(specification.base.innerRadius, 0)], 8, angle - baseSpan / 2, baseSpan);
      add('base-shell-bay', shell, stone, 'base');
    }
    column('base-engaged-column', specification.base.outerRadius, angle - baseSpan / 2, 0.4, 8.2, 'base', 0.31);
    arcade('base-blind-arch', specification.base.outerRadius + 0.13, 0.3, angle, baseSpan, 8.18, 8.18, 10.48, 'base', 0.85, 8.18, light);
    // The repeated lozenge motif is present in the elevation; its carving is
    // simplified as concentric raised stone bands, not a fabricated relief.
    const diamond = new THREE.TorusGeometry(0.60, 0.085, 4, 4);
    diamond.rotateZ(Math.PI / 4); diamond.rotateY(angle);
    diamond.translate(Math.sin(angle) * (specification.base.outerRadius + 0.06), 8.7, Math.cos(angle) * (specification.base.outerRadius + 0.06));
    add('base-lozenge', diamond, darkStone, 'base');
  }
  ring('base-plinth', specification.base.innerRadius, specification.base.outerRadius + 0.2, 0, 0.4, light, 'base');

  for (const [index, level] of levels.entries()) {
    const region = 'loggias';
    const columnRadius = level.outerRadius - 0.35;
    const floor = level.bottom + detail.floorThickness;
    const spring = level.top - 1.45;
    ring('loggia-floor', level.innerRadius, level.outerRadius + detail.balconyProjection, level.bottom, floor, light, region);
    ring('loggia-cornice', level.coreRadius, level.outerRadius + detail.balconyProjection, level.top - 0.42, level.top - 0.12, light, region);
    if (index < levels.length - 1) {
      ring('hollow-core', level.innerRadius, level.coreRadius, floor, level.top, stone, region);
    } else {
      for (let bay = 0; bay < 6; bay++) {
        arcade('upper-core-opening', (level.innerRadius + level.coreRadius) / 2, level.coreRadius - level.innerRadius, bay * tau / 6, tau / 6, floor, level.top - 2.8, level.top, region, 0.52);
      }
    }
    for (let bay = 0; bay < specification.columnsPerLoggia; bay++) {
      const span = tau / specification.columnsPerLoggia, angle = bay * span;
      column('loggia-column', columnRadius, angle - span / 2, floor, spring, region);
      arcade('loggia-open-arch', columnRadius, 0.56, angle, span, spring - 0.14, spring, level.top - 0.25, region, 0.76, spring - 0.14, light);
    }
  }
  const bell = specification.belfry;
  const terrace = specification.referenceHeight;
  const topRadius = levels.at(-1)!.outerRadius;
  ring('upper-terrace', 3.3, topRadius, terrace, terrace + 0.30, light, 'belfry');
  // The survey section records the 1.24m raised belfry footing. Its outer
  // stepped silhouette is retained without inventing a counted stair route.
  ring('belfry-footing-lower', 3.3, 6.7, terrace + 0.3, terrace + 0.67, stone, 'belfry');
  ring('belfry-footing-upper', 3.3, 6.3, terrace + 0.67, bell.base, light, 'belfry');
  for (let bay = 0; bay < 12; bay++) {
    const angle = bay * tau / 12, high = bay % 2 === 1;
    arcade(high ? 'belfry-high-opening' : 'belfry-large-opening', (bell.outerRadius + bell.innerRadius) / 2, bell.outerRadius - bell.innerRadius, angle, tau / 12, bell.base, bell.top - 2.5, bell.top - 0.65, 'belfry', high ? 0.6 : 0.76, high ? bell.base + detail.belfrySill : bell.base);
    column('belfry-column', bell.outerRadius + 0.08, angle - tau / 24, bell.base, bell.top - 2.35, 'belfry', 0.25);
    arcade('belfry-blind-arch', bell.outerRadius + 0.10, 0.26, angle, tau / 12, bell.top - 2.4, bell.top - 2.4, bell.top - 0.65, 'belfry', 0.85, bell.top - 2.4, light);
  }
  ring('belfry-top-cornice', bell.innerRadius, bell.outerRadius + 0.36, bell.top - 0.65, bell.top, light, 'belfry');
  // Rail supports are sampled display detail, not a surveyed ironwork census.
  // Individual bell positions are not recoverable from these sections.
  for (const [radius, y] of [[topRadius - 0.12, terrace + 1.1], [bell.outerRadius + 0.18, bell.top + 0.72]]) {
    const rail = new THREE.TorusGeometry(radius, 0.034, 5, 120);
    rail.rotateX(Math.PI / 2); rail.translate(0, y, 0);
    add('walkway-rail', rail, bronze, 'belfry');
    const supports = Math.ceil(radius * 4);
    for (let support = 0; support < supports; support++) {
      const angle = support / supports * tau;
      const post = new THREE.CylinderGeometry(0.028, 0.028, 0.78, 5);
      post.translate(radius * Math.sin(angle), y - 0.39, radius * Math.cos(angle));
      add('rail-support-display', post, bronze, 'belfry');
    }
  }

  for (const [color, pieces] of batches) {
    const geometry = merge(pieces, false);
    pieces.forEach(piece => piece.dispose());
    if (!geometry) throw new Error('Pisa material merge failed');
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.83, metalness: color === bronze ? 0.4 : 0.01, side: THREE.DoubleSide }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh);
  }
  root.scale.setScalar(specification.displayScale);
  root.userData = {
    id: specification.id,
    featureCounts: counts,
    displayScale: specification.displayScale,
    sourceState: specification.sourceState,
    focusRegions: [...featureBounds.entries()].map(([id, box]) => ({ id, min: box.min.clone().multiplyScalar(specification.displayScale).toArray(), max: box.max.clone().multiplyScalar(specification.displayScale).toArray() })),
  };
  return root;
}
