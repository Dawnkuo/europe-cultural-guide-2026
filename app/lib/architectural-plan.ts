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
  sourceId?: string;
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
  kind: 'room' | 'service' | 'area' | 'object';
  at: MapPoint;
};
export type PlanSpace = { id: string; floorId: string; label: string; placeId: string; polygons: MapPolygon[]; featureIds?: string[]; scope?: 'room' | 'collection' | 'floor' };
export type PlanOpening = { id: string; floorId: string; spaceId: string; segment: [MapPoint, MapPoint] };
export type ArchitecturalPlan = {
  version: 2;
  slug: string;
  projection: 'orthographic';
  registration: 'independent-floor-diagrams';
  sourceDigest: string;
  sourceDigests?: Record<string, string>;
  floors: ArchitecturalFloor[];
  places: PlanPlace[];
  unlocatedPlaces?: Array<{ id: string; label: string; name: string; reason: string }>;
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
  if (!place) return undefined;
  const candidates = plan.spaces?.filter((space) => space.scope !== 'floor' && space.floorId === place.floorId && space.polygons.some((p) => containsPoint(p, place.at)));
  return candidates?.find((space) => space.placeId === place.id) ?? spaceAtPoint(plan, place.floorId, place.at);
}

export function spaceAtPoint(plan: ArchitecturalPlan, floorId: string, at: MapPoint) {
  const area = (space: PlanSpace) => space.polygons.reduce((sum, polygon) => {
    const ringArea = (ring: MapPoint[]) => Math.abs(ring.reduce((a, p, i) => { const next = ring[(i + 1) % ring.length]; return a + p[0] * next[1] - next[0] * p[1]; }, 0)) / 2;
    return sum + ringArea(polygon.outer) - polygon.holes.reduce((a, hole) => a + ringArea(hole), 0);
  }, 0);
  return plan.spaces?.filter((space) => space.scope !== 'floor' && space.floorId === floorId && space.polygons.some((p) => containsPoint(p, at)))
    .sort((a, b) => Number(b.scope === 'room') - Number(a.scope === 'room') || area(a) - area(b))[0];
}

export function spaceForFeature(plan: ArchitecturalPlan, featureId: string) {
  return plan.spaces?.find((space) => (space.featureIds ?? [`${space.id}-floor`]).includes(featureId));
}

export function placesForStop(plan: ArchitecturalPlan, stopIndex: number): PlanPlace[] {
  return plan.stopBindings.filter((binding) => binding.stopIndex === stopIndex)
    .map((binding) => plan.places.find((place) => place.id === binding.placeId))
    .filter((place): place is PlanPlace => Boolean(place));
}

export function independentFloorScale(floor: ArchitecturalFloor, span = 16) {
  // Printed page units are not comparable between independently drawn plans.
  return span / Math.max(floor.bounds[2] - floor.bounds[0], floor.bounds[3] - floor.bounds[1]);
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

export function serviceMarkerKind(place: PlanPlace) {
  if (place.kind !== 'service' || !/[\u3400-\u9fff]/u.test(place.label)) return null;
  const text = `${place.label} ${place.name}`;
  if (/无障碍|轮椅/.test(text)) return 'accessible';
  if (/卫生间|洗手间/.test(text)) return 'toilet';
  if (/电梯/.test(text)) return 'lift';
  if (/梯|台阶|坡道/.test(text)) return 'stairs';
  if (/婴儿|育婴/.test(text)) return 'baby';
  if (/急救/.test(text)) return 'first-aid';
  if (/寄存|衣帽/.test(text)) return 'luggage';
  if (/咖啡/.test(text)) return 'coffee';
  if (/餐饮/.test(text)) return 'food';
  if (/语音/.test(text)) return 'audio';
  if (/售票|购票|凭证/.test(text)) return 'ticket';
  if (/书店/.test(text)) return 'book';
  if (/商店/.test(text)) return 'shop';
  if (/邮局/.test(text)) return 'mail';
  if (/出口/.test(text)) return 'exit';
  if (/入口/.test(text)) return 'entrance';
  if (/集合|团队/.test(text)) return 'group';
  if (/许可/.test(text)) return 'permission';
  if (/信息|咨询|接待/.test(text)) return 'info';
  return 'place';
}

const labelSegmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' });
const labelWidths = new Map<string, number>();

function roomLabelWidth(label: string) {
  const cached = labelWidths.get(label);
  if (cached !== undefined) return cached;
  let width = 0;
  for (const { segment } of labelSegmenter.segment(label)) width += segment.codePointAt(0)! > 127 ? 14 : 8;
  if (labelWidths.size >= 1024) labelWidths.clear();
  labelWidths.set(label, width);
  return width;
}

function packLabelRows(places: PlanPlace[], pixelsPerUnit: number, extent: [number, number]): PlacedLabel[] {
  const gap = 2 / pixelsPerUnit, margin = 3;
  const labels = places.map((place) => ({ ...place, displayAt: [...place.at] as MapPoint,
    width: (serviceMarkerKind(place) ? 26 : Math.max(26, roomLabelWidth(place.label) + 12)) / pixelsPerUnit, height: 23 / pixelsPerUnit }));
  const rows: Array<{ labels: PlacedLabel[]; width: number }> = [];
  for (const label of labels.sort((a, b) => b.width - a.width || a.id.localeCompare(b.id))) {
    const row = rows.filter((r) => r.width + gap + label.width <= extent[0] - margin * 2)
      .sort((a, b) => b.width - a.width)[0];
    if (row) { row.labels.push(label); row.width += gap + label.width; }
    else rows.push({ labels: [label], width: label.width });
  }
  const rowHeight = 23 / pixelsPerUnit;
  const height = rows.length * (rowHeight + gap) - gap;
  if (height > extent[1] - margin * 2 || rows.some((row) => row.width > extent[0] - margin * 2)) {
    throw new Error('Map label extent is too small for the complete place inventory');
  }
  const mean = (row: typeof rows[number], axis: 0 | 1) => row.labels.reduce((sum, label) => sum + label.at[axis], 0) / row.labels.length;
  rows.sort((a, b) => mean(a, 1) - mean(b, 1));
  const top = (extent[1] - height) / 2;
  rows.forEach((row, index) => {
    let left = Math.max(margin, Math.min(extent[0] - margin - row.width, mean(row, 0) - row.width / 2));
    row.labels.sort((a, b) => a.at[0] - b.at[0] || a.id.localeCompare(b.id));
    for (const label of row.labels) {
      label.displayAt = [left + label.width / 2, top + index * (rowHeight + gap) + rowHeight / 2];
      left += label.width + gap;
    }
  });
  return rows.flatMap((row) => row.labels);
}

// Move labels, never their canonical room anchors. All IDs survive every zoom.
export function placeRoomLabels(places: PlanPlace[], pixelsPerUnit: number, extent?: [number, number]): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  for (const place of [...places].sort((a, b) => a.at[1] - b.at[1] || a.at[0] - b.at[0] || a.id.localeCompare(b.id))) {
    const textWidth = serviceMarkerKind(place) ? 14 : roomLabelWidth(place.label);
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
    // Radial greedy placement can strand usable space after a camera rotation.
    // Repack the complete set into bounded rows instead of dropping a marker.
    if (!found && extent) return packLabelRows(places, pixelsPerUnit, extent);
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

// Scene labels stay near their projected anchors. The complete numbered
// inventory remains in the 2D plan and the accessible location selector.
export function placeSceneLabels(places: PlanPlace[], extent: [number, number], selectedId?: string): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const ordered = [...places].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || a.at[1] - b.at[1] || a.at[0] - b.at[0] || a.id.localeCompare(b.id));
  for (const place of ordered) {
    const width = Math.max(26, (serviceMarkerKind(place) ? 14 : roomLabelWidth(place.label)) + 12);
    const height = 24;
    const candidates: MapPoint[] = [[...place.at]];
    for (const distance of [16, 28]) for (let i = 0; i < 8; i++) candidates.push([place.at[0] + Math.cos(i * Math.PI / 4) * distance, place.at[1] + Math.sin(i * Math.PI / 4) * distance]);
    const displayAt = candidates.find((p) => p[0] >= width / 2 + 3 && p[1] >= height / 2 + 3 && p[0] + width / 2 + 3 <= extent[0] && p[1] + height / 2 + 3 <= extent[1] && placed.every((other) => Math.abs(p[0] - other.displayAt[0]) >= (width + other.width) / 2 + 7 || Math.abs(p[1] - other.displayAt[1]) >= (height + other.height) / 2 + 7));
    if (displayAt) placed.push({ ...place, displayAt, width, height });
  }
  return placed;
}

export function validateArchitecturalPlan(plan: ArchitecturalPlan) {
  const errors: string[] = [];
  if (plan.version !== 2 || plan.projection !== 'orthographic') errors.push('Unsupported model or projection');
  if (!plan.floors.length) errors.push('No floors');
  if (!/^[a-f0-9]{64}$/.test(plan.sourceDigest)) errors.push('Missing source digest');
  for (const [id, digest] of Object.entries(plan.sourceDigests ?? {})) if (!/^[a-f0-9]{64}$/.test(digest)) errors.push(`Invalid supplementary source: ${id}`);
  const floorIds = new Set(plan.floors.map((floor) => floor.id));
  if (floorIds.size !== plan.floors.length) errors.push('Duplicate floor');
  const ids = new Set<string>();
  for (const floor of plan.floors) {
    if (floor.sourceId && !plan.sourceDigests?.[floor.sourceId]) errors.push(`Unknown floor source: ${floor.id}`);
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
    if (!['room', 'service', 'area', 'object'].includes(place.kind)) errors.push(`Invalid place kind: ${place.id}`);
    if (!place.label || place.at.some((v) => !Number.isFinite(v))) errors.push(`Invalid place: ${place.id}`);
  }
  for (const place of plan.unlocatedPlaces ?? []) {
    if (ids.has(place.id)) errors.push(`Duplicate unlocated place: ${place.id}`);
    ids.add(place.id);
    if (!place.label?.trim() || !place.name?.trim() || !place.reason?.trim()) errors.push(`Invalid unlocated place: ${place.id}`);
    if ('at' in place || 'floorId' in place) errors.push(`Unlocated place contains a spatial guess: ${place.id}`);
  }
  const stopTargets = new Set<string>();
  for (const binding of plan.stopBindings) {
    if (!Number.isInteger(binding.stopIndex) || binding.stopIndex < 0) errors.push(`Invalid stop index: ${binding.stopIndex}`);
    if (!plan.places.some((place) => place.id === binding.placeId)) errors.push(`Unknown stop target: ${binding.placeId}`);
    const key = `${binding.stopIndex}:${binding.placeId}`;
    if (stopTargets.has(key)) errors.push(`Duplicate stop target: ${key}`);
    stopTargets.add(key);
  }
  for (const link of plan.verticalLinks) {
    if (!['stairs', 'elevator'].includes(link.kind) || !link.label?.trim()) errors.push(`Invalid vertical link type/label: ${link.id}`);
    if (ids.has(link.id)) errors.push(`Duplicate vertical link: ${link.id}`);
    ids.add(link.id);
    const from = plan.places.find((p) => p.id === link.fromPlaceId);
    const to = plan.places.find((p) => p.id === link.toPlaceId);
    if (!from || !to || from.floorId === to.floorId) errors.push(`Invalid vertical link: ${link.id}`);
  }
  for (const space of plan.spaces ?? []) {
    if (space.scope && !['room', 'collection', 'floor'].includes(space.scope)) errors.push(`Invalid space scope: ${space.id}`);
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
