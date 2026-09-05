export type MapPoint = [number, number];
export type MapPolygon = { outer: MapPoint[]; holes: MapPoint[][] };
export type PlanFeature = {
  id: string;
  kind: 'surface' | 'wall' | 'detail';
  tone: string;
  polygons: MapPolygon[];
};
export type ArchitecturalFloor = {
  id: string;
  label: string;
  order: number;
  bounds: [number, number, number, number];
  features: PlanFeature[];
};
export type PlanPlace = {
  id: string;
  floorId: string;
  label: string;
  name: string;
  kind: 'room' | 'service' | 'area';
  at: MapPoint;
};
export type PlanSpace = { id: string; floorId: string; label: string; placeId: string; polygons: MapPolygon[]; featureIds?: string[] };
export type PlanOpening = { id: string; floorId: string; spaceId: string; segment: [MapPoint, MapPoint] };
export type ArchitecturalPlan = {
  version: 2;
  slug: string;
  projection: 'orthographic';
  registration: 'independent-floor-diagrams';
  sourceDigest: string;
  floors: ArchitecturalFloor[];
  places: PlanPlace[];
  limitations: string[];
  stopBindings: Array<{ stopIndex: number; placeId: string }>;
  verticalLinks: Array<{ id: string; label: string; kind: 'stairs' | 'elevator'; fromPlaceId: string; toPlaceId: string }>;
  spaces?: PlanSpace[];
  openings?: PlanOpening[];
};

export function containsPoint(polygon: MapPolygon, point: MapPoint) {
  const inRing = (ring: MapPoint[]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  };
  return inRing(polygon.outer) && !polygon.holes.some(inRing);
}

export function spaceForPlace(plan: ArchitecturalPlan, placeId?: string) {
  const place = plan.places.find((p) => p.id === placeId);
  return place && plan.spaces?.find((space) => space.floorId === place.floorId && space.polygons.some((p) => containsPoint(p, place.at)));
}

export function spaceForFeature(plan: ArchitecturalPlan, featureId: string) {
  return plan.spaces?.find((space) => (space.featureIds ?? [`${space.id}-floor`]).includes(featureId));
}

export const planTones: Record<string, string> = {
  neutral: '#243c47', stone: '#f0dfb8', gold: '#9b7d40',
  blue: '#476d87', teal: '#367e80', green: '#527c65', rose: '#94616b',
};

export function polygonPath(polygon: MapPolygon) {
  return [polygon.outer, ...polygon.holes]
    .map((ring) => ring.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ') + 'Z')
    .join(' ');
}

export type PlacedLabel = PlanPlace & { displayAt: MapPoint; width: number; height: number };

// Move labels, never their canonical room anchors. All IDs survive every zoom.
export function placeRoomLabels(places: PlanPlace[], pixelsPerUnit: number, extent?: [number, number]): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  for (const place of [...places].sort((a, b) => a.at[1] - b.at[1] || a.at[0] - b.at[0] || a.id.localeCompare(b.id))) {
    let textWidth = 0;
    for (const { segment } of new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(place.label)) textWidth += segment.codePointAt(0)! > 127 ? 14 : 8;
    const width = Math.max(26, textWidth + 12) / pixelsPerUnit;
    const height = 23 / pixelsPerUnit;
    const within = (at: MapPoint) => !extent || (at[0] >= width / 2 + 3 && at[1] >= height / 2 + 3 && at[0] + width / 2 + 3 <= extent[0] && at[1] + height / 2 + 3 <= extent[1]);
    const collides = (at: MapPoint) => placed.some((other) =>
      Math.abs(at[0] - other.displayAt[0]) < (width + other.width) / 2 + 2 / pixelsPerUnit &&
      Math.abs(at[1] - other.displayAt[1]) < (height + other.height) / 2 + 2 / pixelsPerUnit);
    const origin: MapPoint = extent ? [Math.max(width / 2 + 3, Math.min(extent[0] - width / 2 - 3, place.at[0])), Math.max(height / 2 + 3, Math.min(extent[1] - height / 2 - 3, place.at[1]))] : [...place.at];
    let displayAt: MapPoint = [...origin];
    let found = within(displayAt) && !collides(displayAt);
    for (let radius = 1; radius <= 200 && !found; radius++) {
      for (let direction = 0; direction < 16; direction++) {
        const angle = direction * Math.PI / 8;
        const candidate: MapPoint = [origin[0] + Math.cos(angle) * radius * 9 / pixelsPerUnit,
          origin[1] + Math.sin(angle) * radius * 9 / pixelsPerUnit];
        if (within(candidate) && !collides(candidate)) { displayAt = candidate; found = true; break; }
      }
    }
    if (!found) throw new Error(`Cannot place room label ${place.id}`);
    placed.push({ ...place, displayAt, width, height });
  }
  return placed;
}

export function planViewBounds(floor: ArchitecturalFloor, labels: PlacedLabel[]) {
  return [
    Math.min(floor.bounds[0], ...labels.map((label) => label.displayAt[0] - label.width / 2)) - 20,
    Math.min(floor.bounds[1], ...labels.map((label) => label.displayAt[1] - label.height / 2)) - 20,
    Math.max(floor.bounds[2], ...labels.map((label) => label.displayAt[0] + label.width / 2)) + 20,
    Math.max(floor.bounds[3], ...labels.map((label) => label.displayAt[1] + label.height / 2)) + 20,
  ];
}

export function validateArchitecturalPlan(plan: ArchitecturalPlan) {
  const errors: string[] = [];
  if (plan.version !== 2 || plan.projection !== 'orthographic') errors.push('Unsupported model or projection');
  if (!plan.floors.length) errors.push('No floors');
  if (!/^[a-f0-9]{64}$/.test(plan.sourceDigest)) errors.push('Missing source digest');
  const floorIds = new Set(plan.floors.map((floor) => floor.id));
  if (floorIds.size !== plan.floors.length) errors.push('Duplicate floor');
  const ids = new Set<string>();
  for (const floor of plan.floors) {
    if (floor.bounds.some((n) => !Number.isFinite(n)) || floor.bounds[2] <= floor.bounds[0] || floor.bounds[3] <= floor.bounds[1]) errors.push(`Invalid floor bounds: ${floor.id}`);
    if (!floor.features.length) errors.push(`Empty floor: ${floor.id}`);
    for (const feature of floor.features) {
      if (ids.has(feature.id)) errors.push(`Duplicate feature: ${feature.id}`);
      ids.add(feature.id);
      if (!feature.polygons.length) errors.push(`Empty feature: ${feature.id}`);
      if (!(feature.tone in planTones)) errors.push(`Unknown tone: ${feature.id}`);
      for (const ring of feature.polygons.flatMap((p) => [p.outer, ...p.holes])) {
        if (ring.length < 4 || ring[0][0] !== ring.at(-1)?.[0] || ring[0][1] !== ring.at(-1)?.[1]) errors.push(`Open ring: ${feature.id}`);
        if (ring.some((p) => p.some((v) => !Number.isFinite(v)))) errors.push(`Invalid coordinates: ${feature.id}`);
      }
    }
  }
  for (const place of plan.places) {
    if (ids.has(place.id)) errors.push(`Duplicate place: ${place.id}`);
    ids.add(place.id);
    if (!floorIds.has(place.floorId)) errors.push(`Unknown floor: ${place.id}`);
    if (!place.label || place.at.some((v) => !Number.isFinite(v))) errors.push(`Invalid place: ${place.id}`);
  }
  for (const binding of plan.stopBindings) {
    if (!Number.isInteger(binding.stopIndex) || binding.stopIndex < 0) errors.push(`Invalid stop index: ${binding.stopIndex}`);
    if (!plan.places.some((place) => place.id === binding.placeId)) errors.push(`Unknown stop target: ${binding.placeId}`);
  }
  for (const link of plan.verticalLinks) {
    const from = plan.places.find((p) => p.id === link.fromPlaceId);
    const to = plan.places.find((p) => p.id === link.toPlaceId);
    if (!from || !to || from.floorId === to.floorId) errors.push(`Invalid vertical link: ${link.id}`);
  }
  for (const space of plan.spaces ?? []) {
    const place = plan.places.find((p) => p.id === space.placeId);
    if (!place || place.floorId !== space.floorId || !space.polygons.some((polygon) => containsPoint(polygon, place.at))) errors.push(`Invalid space binding: ${space.id}`);
    const floor = plan.floors.find((f) => f.id === space.floorId);
    for (const id of space.featureIds ?? [`${space.id}-floor`]) {
      if (!floor?.features.some((f) => f.id === id && f.kind === 'surface')) errors.push(`Invalid space surface: ${space.id}`);
    }
    for (const ring of space.polygons.flatMap((p) => [p.outer, ...p.holes])) {
      if (ring.length < 4 || ring[0][0] !== ring.at(-1)?.[0] || ring[0][1] !== ring.at(-1)?.[1] || ring.some((p) => p.some((v) => !Number.isFinite(v)))) errors.push(`Invalid space ring: ${space.id}`);
    }
  }
  for (const opening of plan.openings ?? []) {
    if (!plan.spaces?.some((space) => space.id === opening.spaceId && space.floorId === opening.floorId) || opening.segment.length !== 2 || opening.segment.some((p) => p.some((v) => !Number.isFinite(v)))) errors.push(`Invalid opening: ${opening.id}`);
  }
  return errors;
}
