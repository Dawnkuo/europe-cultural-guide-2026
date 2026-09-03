import type { Vec3 } from '../guide-3d-models';

export type PlanPoint = [number, number];

export type FloorPlanSource = {
  authority: 'official' | 'authoritative';
  scope: Array<'footprint' | 'spaces' | 'levels' | 'route'>;
  title: string;
  url: string;
  verifiedAt: string;
};

export type FloorPlanSpace = {
  id: string;
  label: string;
  polygon: PlanPoint[];
  kind?:
    | 'gallery'
    | 'hall'
    | 'circulation'
    | 'courtyard'
    | 'chapel'
    | 'service'
    | 'outdoor';
};

export type FloorPlanFloor = {
  id: string;
  label: string;
  elevation: number;
  stackOrder: number;
  outline: PlanPoint[];
  voids?: PlanPoint[][];
  spaces: FloorPlanSpace[];
};

export type FloorPlanOpening = {
  floorId: string;
  kind: 'door' | 'archway' | 'gate';
  position: PlanPoint;
  connects: [string, string?];
};

export type FloorPlanVerticalLink = {
  id: string;
  kind: 'stairs' | 'lift' | 'ramp';
  label: string;
  landings: Array<{
    floorId: string;
    position: PlanPoint;
  }>;
};

export type FloorPlanRouteStop = {
  floorId: string;
  spaceId: string;
  position: PlanPoint;
};

export type StackedFloorPlan = {
  mode: 'stacked-floorplan';
  floors: FloorPlanFloor[];
  openings: FloorPlanOpening[];
  routeStops: FloorPlanRouteStop[];
  sourceManifest: FloorPlanSource[];
  verticalLinks: FloorPlanVerticalLink[];
};

export type FloorPlanInventoryEntry = {
  status: 'ready' | 'source-limited';
  note: string;
  sources: FloorPlanSource[];
};

export type FloorPlanRouteSection =
  | {
      kind: 'floor';
      floorId: string;
      points: PlanPoint[];
    }
  | {
      kind: 'transition';
      connectorId: string;
      fromFloorId: string;
      toFloorId: string;
    };

export type CompiledFloorPlanRoute = {
  legs: Array<{
    fromStopIndex: number;
    toStopIndex: number;
    sections: FloorPlanRouteSection[];
  }>;
};

export function getFloorPlanCoordinateFrame(
  floors: FloorPlanFloor[],
  targetSpan = 12,
) {
  const points = floors.flatMap((floor) => floor.outline);
  const xValues = points.map(([x]) => x);
  const zValues = points.map(([, z]) => z);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const sourceSpan = Math.max(maxX - minX, maxZ - minZ, 1);
  return {
    center: [(minX + maxX) / 2, (minZ + maxZ) / 2] as PlanPoint,
    scale: targetSpan / sourceSpan,
  };
}

export function normalizeFloorPlanPoint(
  floors: FloorPlanFloor[],
  point: PlanPoint,
): PlanPoint {
  const frame = getFloorPlanCoordinateFrame(floors);
  return [
    (point[0] - frame.center[0]) * frame.scale,
    (point[1] - frame.center[1]) * frame.scale,
  ];
}

function samePoint(left: PlanPoint, right: PlanPoint) {
  return left[0] === right[0] && left[1] === right[1];
}

function polygonArea(polygon: PlanPoint[]) {
  let area = 0;
  for (let index = 0; index < polygon.length - 1; index += 1) {
    area +=
      polygon[index][0] * polygon[index + 1][1] -
      polygon[index + 1][0] * polygon[index][1];
  }
  return Math.abs(area / 2);
}

function pointOnSegment(point: PlanPoint, start: PlanPoint, end: PlanPoint) {
  const cross =
    (point[1] - start[1]) * (end[0] - start[0]) -
    (point[0] - start[0]) * (end[1] - start[1]);
  if (Math.abs(cross) > 1e-8) return false;
  return (
    point[0] >= Math.min(start[0], end[0]) &&
    point[0] <= Math.max(start[0], end[0]) &&
    point[1] >= Math.min(start[1], end[1]) &&
    point[1] <= Math.max(start[1], end[1])
  );
}

export function splitWallAtOpenings(
  start: PlanPoint,
  end: PlanPoint,
  openings: PlanPoint[],
  gap = 0.55,
  tolerance = 0.28,
): Array<[PlanPoint, PlanPoint]> {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return [];

  const length = Math.sqrt(lengthSquared);
  const halfGap = gap / (2 * length);
  const ranges = openings
    .map((opening) => {
      const projection =
        ((opening[0] - start[0]) * dx + (opening[1] - start[1]) * dy) /
        lengthSquared;
      const projected: PlanPoint = [
        start[0] + projection * dx,
        start[1] + projection * dy,
      ];
      const distance = Math.hypot(
        opening[0] - projected[0],
        opening[1] - projected[1],
      );
      if (projection <= 0 || projection >= 1 || distance > tolerance) {
        return undefined;
      }
      return [
        Math.max(0, projection - halfGap),
        Math.min(1, projection + halfGap),
      ] as const;
    })
    .filter((range): range is readonly [number, number] => Boolean(range))
    .sort((left, right) => left[0] - right[0]);

  const walls: Array<[PlanPoint, PlanPoint]> = [];
  let cursor = 0;
  for (const [rangeStart, rangeEnd] of ranges) {
    if (rangeStart > cursor) {
      walls.push([
        [start[0] + cursor * dx, start[1] + cursor * dy],
        [start[0] + rangeStart * dx, start[1] + rangeStart * dy],
      ]);
    }
    cursor = Math.max(cursor, rangeEnd);
  }
  if (cursor < 1) {
    walls.push([[start[0] + cursor * dx, start[1] + cursor * dy], end]);
  }
  return walls;
}

function orientation(first: PlanPoint, second: PlanPoint, third: PlanPoint) {
  return (
    (second[1] - first[1]) * (third[0] - second[0]) -
    (second[0] - first[0]) * (third[1] - second[1])
  );
}

function segmentsCross(
  firstStart: PlanPoint,
  firstEnd: PlanPoint,
  secondStart: PlanPoint,
  secondEnd: PlanPoint,
) {
  const firstOrientation = orientation(firstStart, firstEnd, secondStart);
  const secondOrientation = orientation(firstStart, firstEnd, secondEnd);
  const thirdOrientation = orientation(secondStart, secondEnd, firstStart);
  const fourthOrientation = orientation(secondStart, secondEnd, firstEnd);
  return (
    Math.sign(firstOrientation) !== Math.sign(secondOrientation) &&
    Math.sign(thirdOrientation) !== Math.sign(fourthOrientation)
  );
}

function polygonSelfIntersects(polygon: PlanPoint[]) {
  const segmentCount = polygon.length - 1;
  const isClosed = samePoint(polygon[0], polygon.at(-1)!);
  for (let first = 0; first < segmentCount; first += 1) {
    for (let second = first + 1; second < segmentCount; second += 1) {
      const adjacent =
        second === first + 1 ||
        (isClosed && first === 0 && second === segmentCount - 1);
      if (adjacent) continue;
      if (
        segmentsCross(
          polygon[first],
          polygon[first + 1],
          polygon[second],
          polygon[second + 1],
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function pointInPolygon(point: PlanPoint, polygon: PlanPoint[]) {
  let inside = false;
  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current++
  ) {
    const [currentX, currentY] = polygon[current];
    const [previousX, previousY] = polygon[previous];
    if (pointOnSegment(point, polygon[previous], polygon[current])) return true;
    const crosses =
      currentY > point[1] !== previousY > point[1] &&
      point[0] <
        ((previousX - currentX) * (point[1] - currentY)) /
          (previousY - currentY) +
          currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function validateFloorPlan(floorPlan: StackedFloorPlan) {
  const issues: string[] = [];
  if (
    floorPlan.sourceManifest.length === 0 ||
    floorPlan.sourceManifest.some(
      (source) =>
        !source.url.startsWith('https://') ||
        !['official', 'authoritative'].includes(source.authority) ||
        source.scope.length === 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(source.verifiedAt),
    )
  ) {
    issues.push('sourceManifest must contain an authoritative source');
  }

  const documentedScopes = new Set(
    floorPlan.sourceManifest.flatMap((source) => source.scope),
  );
  for (const scope of ['footprint', 'spaces', 'route'] as const) {
    if (!documentedScopes.has(scope)) {
      issues.push(`sourceManifest must document ${scope}`);
    }
  }
  if (floorPlan.floors.length > 1 && !documentedScopes.has('levels')) {
    issues.push('sourceManifest must document levels for a multi-floor plan');
  }

  const floorIds = new Set<string>();
  const stackOrders = new Set<number>();
  const spacesByFloor = new Map<string, Set<string>>();
  for (const floor of floorPlan.floors) {
    if (floorIds.has(floor.id)) {
      issues.push(`floor id ${floor.id} must be unique`);
    }
    floorIds.add(floor.id);
    if (stackOrders.has(floor.stackOrder)) {
      issues.push(`floor stackOrder ${floor.stackOrder} must be unique`);
    }
    stackOrders.add(floor.stackOrder);

    if (
      !Number.isFinite(floor.elevation) ||
      !Number.isFinite(floor.stackOrder) ||
      floor.outline.some((point) =>
        point.some((coordinate) => !Number.isFinite(coordinate)),
      )
    ) {
      issues.push(`floor ${floor.id} coordinates must be finite`);
    }

    if (!samePoint(floor.outline[0], floor.outline.at(-1)!)) {
      issues.push(`floor ${floor.id} outline must be closed`);
    }
    if (polygonSelfIntersects(floor.outline)) {
      issues.push(`floor ${floor.id} outline must not self-intersect`);
    }
    if (polygonArea(floor.outline) === 0) {
      issues.push(`floor ${floor.id} outline must have nonzero area`);
    }

    for (const [voidIndex, floorVoid] of (floor.voids ?? []).entries()) {
      if (!samePoint(floorVoid[0], floorVoid.at(-1)!)) {
        issues.push(`floor ${floor.id} void ${voidIndex} must be closed`);
      }
      if (polygonSelfIntersects(floorVoid)) {
        issues.push(
          `floor ${floor.id} void ${voidIndex} must not self-intersect`,
        );
      }
      if (polygonArea(floorVoid) === 0) {
        issues.push(
          `floor ${floor.id} void ${voidIndex} must have nonzero area`,
        );
      }
      if (
        floorVoid
          .slice(0, -1)
          .some((point) => !pointInPolygon(point, floor.outline))
      ) {
        issues.push(
          `floor ${floor.id} void ${voidIndex} must be inside the floor outline`,
        );
      }
    }

    const spaceIds = new Set<string>();
    spacesByFloor.set(floor.id, spaceIds);
    for (const planSpace of floor.spaces) {
      if (spaceIds.has(planSpace.id)) {
        issues.push(`space id ${floor.id}:${planSpace.id} must be unique`);
      }
      spaceIds.add(planSpace.id);
      if (!samePoint(planSpace.polygon[0], planSpace.polygon.at(-1)!)) {
        issues.push(
          `floor ${floor.id} space ${planSpace.id} polygon must be closed`,
        );
      }
      if (polygonSelfIntersects(planSpace.polygon)) {
        issues.push(
          `floor ${floor.id} space ${planSpace.id} polygon must not self-intersect`,
        );
      }
      if (polygonArea(planSpace.polygon) === 0) {
        issues.push(
          `floor ${floor.id} space ${planSpace.id} polygon must have nonzero area`,
        );
      }
      if (
        planSpace.polygon
          .slice(0, -1)
          .some((point) => !pointInPolygon(point, floor.outline))
      ) {
        issues.push(
          `floor ${floor.id} space ${planSpace.id} must be inside the floor outline`,
        );
      }
    }
  }

  for (const opening of floorPlan.openings) {
    const floorSpaces = spacesByFloor.get(opening.floorId);
    if (!floorSpaces) {
      issues.push(`opening references unknown floor ${opening.floorId}`);
      continue;
    }
    for (const spaceId of opening.connects) {
      if (spaceId && !floorSpaces.has(spaceId)) {
        issues.push(
          `opening references unknown space ${opening.floorId}:${spaceId}`,
        );
      }
    }
  }

  floorPlan.routeStops.forEach((stop, index) => {
    const floor = floorPlan.floors.find((item) => item.id === stop.floorId);
    const planSpace = floor?.spaces.find((item) => item.id === stop.spaceId);
    if (!floor) {
      issues.push(
        `route stop ${index} references unknown floor ${stop.floorId}`,
      );
    } else if (!planSpace) {
      issues.push(
        `route stop ${index} references unknown space ${stop.floorId}:${stop.spaceId}`,
      );
    } else if (!pointInPolygon(stop.position, planSpace.polygon)) {
      issues.push(
        `route stop ${index} is outside space ${stop.floorId}:${stop.spaceId}`,
      );
    }
  });

  for (const link of floorPlan.verticalLinks) {
    if (link.landings.length < 2) {
      issues.push(`vertical link ${link.id} must have at least two landings`);
    }
    for (const landing of link.landings) {
      if (!floorIds.has(landing.floorId)) {
        issues.push(
          `vertical link ${link.id} references unknown floor ${landing.floorId}`,
        );
      }
    }
  }

  return issues;
}

export function rect(
  x: number,
  z: number,
  width: number,
  depth: number,
): PlanPoint[] {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  return [
    [x - halfWidth, z - halfDepth],
    [x + halfWidth, z - halfDepth],
    [x + halfWidth, z + halfDepth],
    [x - halfWidth, z + halfDepth],
    [x - halfWidth, z - halfDepth],
  ];
}

export function space(
  id: string,
  label: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  kind: FloorPlanSpace['kind'] = 'gallery',
): FloorPlanSpace {
  return { id, kind, label, polygon: rect(x, z, width, depth) };
}

function uffiziPlan(): StackedFloorPlan {
  const uOutline: PlanPoint[] = [
    [-7, -5],
    [7, -5],
    [7, 5],
    [4.8, 5],
    [4.8, -2.8],
    [-4.8, -2.8],
    [-4.8, 5],
    [-7, 5],
    [-7, -5],
  ];
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'second',
        label: '二层：A区与三面长廊',
        elevation: 0,
        stackOrder: 1,
        outline: uOutline,
        spaces: [
          space('east-corridor', '东长廊与中世纪展区', -5.9, 1, 2, 7.4),
          space('a4', 'A4 乔托与契马布埃', -5.9, -3.8, 2, 1.8),
          space('a10-a12', 'A10-A12 波提切利', -2.7, -3.9, 4, 1.7),
          space('south-corridor', '南长廊', 0, -4, 3.2, 1.7, 'circulation'),
          space('a35', 'A35 达·芬奇', 3.1, -3.9, 2.7, 1.7),
          space('a38', 'A38 拉斐尔与米开朗琪罗', 5.9, -2.8, 2, 2.4),
          space(
            'west-corridor',
            '西长廊与下楼方向',
            5.9,
            1.6,
            2,
            6.2,
            'circulation',
          ),
        ],
      },
      {
        id: 'first',
        label: '一层：B、C、D、E区',
        elevation: 3.2,
        stackOrder: 0,
        outline: rect(0, 0, 14, 10),
        spaces: [
          space('b-c', 'B、C展区', -5.8, 0.8, 2.1, 7.5),
          space('d1-d18', 'D1-D18展区', 0, -3.9, 8.8, 1.8),
          space('d19', 'D19 瓦萨里走廊集合点', 5.8, -2.8, 2.1, 2.6),
          space('d20-e7', 'D20-D28与E区', 5.8, 1.3, 2.1, 5.3),
          space('exit', '出口与后勤空间', -5.8, 4.2, 2.1, 1.4, 'service'),
        ],
      },
    ],
    openings: [
      {
        floorId: 'second',
        kind: 'archway',
        position: [-4.9, -3.9],
        connects: ['a4', 'a10-a12'],
      },
      {
        floorId: 'second',
        kind: 'archway',
        position: [4.9, -3.9],
        connects: ['a35', 'a38'],
      },
      {
        floorId: 'first',
        kind: 'door',
        position: [4.9, -2.8],
        connects: ['d1-d18', 'd19'],
      },
    ],
    routeStops: [
      { floorId: 'second', spaceId: 'a4', position: [-5.9, -3.8] },
      { floorId: 'second', spaceId: 'a10-a12', position: [-2.7, -3.9] },
      { floorId: 'second', spaceId: 'a35', position: [3.1, -3.9] },
      { floorId: 'second', spaceId: 'a38', position: [5.9, -2.8] },
      { floorId: 'first', spaceId: 'd19', position: [5.8, -2.8] },
    ],
    sourceManifest: [
      {
        authority: 'official',
        scope: ['footprint', 'spaces', 'levels', 'route'],
        title: 'Uffizi official visitor map, updated July 2026',
        url: 'https://www.datocms-assets.com/103094/1772716618-exe_broch_gli-uffizi_gennaio2026_it.pdf',
        verifiedAt: '2026-09-03',
      },
    ],
    verticalLinks: [
      {
        id: 'buontalenti-stair',
        kind: 'stairs',
        label: 'Buontalenti大阶梯',
        landings: [
          { floorId: 'second', position: [5.8, 3.8] },
          { floorId: 'first', position: [5.8, 3.8] },
        ],
      },
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: '访客电梯',
        landings: [
          { floorId: 'second', position: [6.2, 4.2] },
          { floorId: 'first', position: [6.2, 4.2] },
        ],
      },
    ],
  };
}

function dogesPalacePlan(): StackedFloorPlan {
  const palace = rect(0, 0, 14, 10);
  const palaceAndBridge: PlanPoint[] = [
    [-7, -5],
    [7, -5],
    [7, -2.1],
    [8.6, -2.1],
    [8.6, -0.7],
    [7, -0.7],
    [7, 5],
    [-7, 5],
    [-7, -5],
  ];
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '地面层：入口、歌剧博物馆与庭院',
        elevation: 0,
        stackOrder: 0,
        outline: palace,
        spaces: [
          space('opera', '歌剧博物馆', -4.8, 0, 3.4, 7.5),
          space('courtyard', '中央庭院', 0.4, 0.4, 5.8, 6.2, 'courtyard'),
          space('giants-stair', '巨人阶梯', 4.7, -1.7, 2.5, 3.2, 'circulation'),
        ],
      },
      {
        id: 'loggia',
        label: '凉廊层：总督寓所与制度厅',
        elevation: 3.2,
        stackOrder: 1,
        outline: palace,
        spaces: [
          space('doge-apartments', '总督寓所', -4.6, -1.5, 3.7, 6),
          space('institutional', '制度厅', 0.1, -1.3, 5.2, 6.4),
          space('loggia-route', '内庭凉廊', 4.8, 1.8, 2.6, 5.2, 'circulation'),
        ],
      },
      {
        id: 'council',
        label: '议政层：大议会厅与军械库',
        elevation: 6.4,
        stackOrder: 2,
        outline: palaceAndBridge,
        spaces: [
          space('great-council', '大议会厅', -2.8, 0.6, 7.8, 7.1, 'hall'),
          space('scrutiny', '选举厅', 2.6, 2.2, 3, 3.4, 'hall'),
          space('armoury', '军械库', 4.8, -1.5, 2.6, 5.2),
          space('bridge', '叹息桥双通道', 7.6, -1.4, 2, 1.4, 'circulation'),
        ],
      },
      {
        id: 'prisons',
        label: '新监狱层',
        elevation: 8.9,
        stackOrder: 3,
        outline: rect(10.7, -1.4, 4, 6.5),
        spaces: [
          space(
            'prison-corridor',
            '监狱走廊',
            10.7,
            -1.4,
            1.1,
            5.6,
            'circulation',
          ),
          space('cells-west', '西侧牢房', 9.4, -1.4, 1.2, 5.6),
          space('cells-east', '东侧牢房', 12, -1.4, 1.2, 5.6),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [-6.8, 3.4],
        connects: ['opera'],
      },
      {
        floorId: 'council',
        kind: 'door',
        position: [4, -1.4],
        connects: ['great-council', 'armoury'],
      },
      {
        floorId: 'council',
        kind: 'archway',
        position: [6.8, -1.4],
        connects: ['armoury', 'bridge'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'opera', position: [-4.8, 0] },
      { floorId: 'ground', spaceId: 'courtyard', position: [0.4, 0.4] },
      { floorId: 'loggia', spaceId: 'institutional', position: [0.1, -1.3] },
      { floorId: 'council', spaceId: 'great-council', position: [-2.8, 0.6] },
      { floorId: 'council', spaceId: 'armoury', position: [4.8, -1.5] },
      {
        floorId: 'prisons',
        spaceId: 'prison-corridor',
        position: [10.7, -1.4],
      },
    ],
    sourceManifest: [
      {
        authority: 'official',
        scope: ['footprint', 'spaces', 'levels', 'route'],
        title: 'Doge’s Palace official guide and floor maps',
        url: 'https://palazzoducale.visitmuve.it/wp-content/uploads/sites/2/2025/10/Guida-Ducale-ENG.pdf',
        verifiedAt: '2026-09-03',
      },
    ],
    verticalLinks: [
      {
        id: 'giants',
        kind: 'stairs',
        label: '巨人阶梯',
        landings: [
          { floorId: 'ground', position: [4.7, -1.7] },
          { floorId: 'loggia', position: [4.7, -1.7] },
        ],
      },
      {
        id: 'golden',
        kind: 'stairs',
        label: '黄金阶梯',
        landings: [
          { floorId: 'loggia', position: [3.9, 2.9] },
          { floorId: 'council', position: [3.9, 2.9] },
        ],
      },
      {
        id: 'bridge-link',
        kind: 'stairs',
        label: '叹息桥与监狱楼梯',
        landings: [
          { floorId: 'council', position: [7.6, -1.4] },
          { floorId: 'prisons', position: [9.1, -1.4] },
        ],
      },
    ],
  };
}

function casaBatlloPlan(): StackedFloorPlan {
  const townhouse = rect(0, 0, 8, 11);
  const levels: FloorPlanFloor[] = [
    {
      id: 'ground',
      label: '底层：入口与私人门厅',
      elevation: 0,
      stackOrder: 1,
      outline: townhouse,
      spaces: [
        space(
          'street-entry',
          '格拉西亚大道入口',
          0,
          4.6,
          5.8,
          1.2,
          'circulation',
        ),
        space(
          'private-lobby',
          'Batlló家庭私人门厅',
          -1.4,
          1.6,
          3.2,
          4.4,
          'hall',
        ),
        space(
          'lightwell-ground',
          '双采光井与电梯',
          1.8,
          0.4,
          2.4,
          4.8,
          'circulation',
        ),
      ],
    },
    {
      id: 'noble',
      label: '主层：家庭住宅与后院',
      elevation: 2.8,
      stackOrder: 2,
      outline: townhouse,
      spaces: [
        space('main-salon', '临街主厅与观景窗', 0, 3.5, 6.4, 2.6, 'hall'),
        space('office', 'Batlló先生办公室', -2.1, 0.9, 2.2, 2.2),
        space('dining', '私人餐厅', 0.2, -1.1, 4.1, 2.6),
        space('rear-courtyard', '后立面与庭院', 0, -4.5, 6.5, 1.5, 'outdoor'),
        space('lightwell-noble', '双采光井', 2.5, 0.6, 1.5, 4.4, 'circulation'),
      ],
    },
    {
      id: 'residence',
      label: '住宅层：私人住宅与采光井',
      elevation: 5.6,
      stackOrder: 3,
      outline: townhouse,
      spaces: [
        space('private-residence', 'Batlló私人住宅', -1.1, 1.1, 4.5, 6.8),
        space(
          'lightwell-residence',
          '双采光井与电梯',
          2.4,
          0.5,
          1.6,
          5.8,
          'circulation',
        ),
      ],
    },
    {
      id: 'attic',
      label: '阁楼：服务空间与悬链拱',
      elevation: 8.4,
      stackOrder: 4,
      outline: townhouse,
      spaces: [
        space('attic-arches', '六十道悬链拱阁楼', 0, 0.2, 6.8, 8.8, 'hall'),
        space('attic-stair', '屋顶楼梯', 2.6, -3.8, 1.2, 1.5, 'circulation'),
      ],
    },
    {
      id: 'roof',
      label: '屋顶：龙脊与烟囱群',
      elevation: 11.2,
      stackOrder: 5,
      outline: townhouse,
      spaces: [
        space('dragon-roof', '龙脊屋顶', 0, -0.4, 3, 8.4, 'outdoor'),
        space('chimneys', '四组烟囱', -2.4, 1.1, 1.4, 5.8, 'outdoor'),
        space('roof-route', '屋顶参观步道', 2.4, 0.8, 1.4, 6.5, 'circulation'),
      ],
    },
    {
      id: 'basement',
      label: '地下层：Kengo Kuma楼梯与Gaudí Cube',
      elevation: -2.8,
      stackOrder: 0,
      outline: townhouse,
      spaces: [
        space(
          'kuma-stair',
          'Kengo Kuma楼梯与中庭',
          -1.8,
          0.8,
          2.5,
          6.8,
          'circulation',
        ),
        space('gaudi-cube', 'Gaudí Cube', 1.4, 0.4, 3.2, 4.5, 'hall'),
      ],
    },
  ];
  return {
    mode: 'stacked-floorplan',
    floors: levels,
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [0, 5.4],
        connects: ['street-entry'],
      },
      {
        floorId: 'noble',
        kind: 'door',
        position: [0, -3.7],
        connects: ['dining', 'rear-courtyard'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'street-entry', position: [0, 4.6] },
      { floorId: 'noble', spaceId: 'main-salon', position: [0, 3.5] },
      { floorId: 'noble', spaceId: 'rear-courtyard', position: [0, -4.5] },
      { floorId: 'attic', spaceId: 'attic-arches', position: [0, 0.2] },
      { floorId: 'roof', spaceId: 'roof-route', position: [2.4, 0.8] },
      { floorId: 'basement', spaceId: 'gaudi-cube', position: [1.4, 0.4] },
    ],
    sourceManifest: [
      {
        authority: 'official',
        scope: ['spaces', 'levels', 'route'],
        title: 'Casa Batlló official interior and visitor experience',
        url: 'https://www.casabatllo.es/en/antoni-gaudi/casa-batllo/inside/',
        verifiedAt: '2026-09-03',
      },
      {
        authority: 'authoritative',
        scope: ['footprint', 'spaces', 'levels'],
        title: 'Casa Batlló original floor plans, facade and section at 1:100',
        url: 'https://upcommons.upc.edu/entities/publication/6a12900d-b5fc-4fc5-be8b-090d94fd19e7',
        verifiedAt: '2026-09-03',
      },
    ],
    verticalLinks: [
      {
        id: 'main-stair',
        kind: 'stairs',
        label: '家庭主楼梯',
        landings: [
          { floorId: 'ground', position: [-1.7, 1.6] },
          { floorId: 'noble', position: [-1.7, 1.6] },
        ],
      },
      {
        id: 'lightwell-lift-1',
        kind: 'lift',
        label: '采光井电梯',
        landings: [
          { floorId: 'noble', position: [2.4, 0.5] },
          { floorId: 'residence', position: [2.4, 0.5] },
        ],
      },
      {
        id: 'service-stair',
        kind: 'stairs',
        label: '服务楼梯',
        landings: [
          { floorId: 'residence', position: [2.6, -3.8] },
          { floorId: 'attic', position: [2.6, -3.8] },
        ],
      },
      {
        id: 'roof-stair',
        kind: 'stairs',
        label: '屋顶楼梯',
        landings: [
          { floorId: 'attic', position: [2.6, -3.8] },
          { floorId: 'roof', position: [2.6, -3.8] },
        ],
      },
      {
        id: 'kuma-descent',
        kind: 'stairs',
        label: 'Kengo Kuma下行楼梯',
        landings: [
          { floorId: 'ground', position: [-1.8, 0.8] },
          { floorId: 'basement', position: [-1.8, 0.8] },
        ],
      },
    ],
  };
}

function sagradaFamiliaPlan(): StackedFloorPlan {
  const cross: PlanPoint[] = [
    [-3, -8],
    [3, -8],
    [3, -3],
    [7, -3],
    [7, 3],
    [3, 3],
    [3, 8],
    [-3, 8],
    [-3, 3],
    [-7, 3],
    [-7, -3],
    [-3, -3],
    [-3, -8],
  ];
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'basement',
        label: '地下层：博物馆与展陈',
        elevation: -3,
        stackOrder: 0,
        outline: rect(0, 0, 11, 7),
        spaces: [
          space('museum', '博物馆与模型展陈', -2.2, 0, 5.5, 5.5),
          space('school', '高迪学校建筑', 3.5, 0, 3.5, 4.5, 'hall'),
        ],
      },
      {
        id: 'basilica',
        label: '圣殿层：拉丁十字平面',
        elevation: 0,
        stackOrder: 1,
        outline: cross,
        spaces: [
          space(
            'nativity-entry',
            '诞生立面与Marina街入口',
            0,
            6.8,
            5.2,
            1.7,
            'circulation',
          ),
          space('nave', '五廊式中殿与树状柱林', 0, 1.7, 5.2, 7.8, 'hall'),
          space('transept', '交叉部与耳堂', 0, -1, 12.5, 4, 'hall'),
          space('apse', '后殿与七座礼拜堂', 0, -6, 5.2, 3, 'chapel'),
          space(
            'passion-facade',
            '受难立面雕塑群',
            -6,
            -0.8,
            1.7,
            4,
            'outdoor',
          ),
        ],
      },
      {
        id: 'tower',
        label: '受难立面塔：电梯上行与步行下塔',
        elevation: 4,
        stackOrder: 2,
        outline: rect(-5.8, -0.6, 3.2, 5.6),
        spaces: [
          space('tower-lift', '塔楼电梯', -6.3, -1.6, 1, 1.3, 'circulation'),
          space('tower-view', '塔楼观景段', -5.5, -0.2, 1.5, 1.6, 'outdoor'),
          space(
            'tower-stair',
            '螺旋下塔楼梯',
            -6.1,
            1.2,
            1.1,
            1.4,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'basilica',
        kind: 'gate',
        position: [0, 7.8],
        connects: ['nativity-entry'],
      },
      {
        floorId: 'basilica',
        kind: 'archway',
        position: [0, 3.4],
        connects: ['nativity-entry', 'nave'],
      },
    ],
    routeStops: [
      { floorId: 'basilica', spaceId: 'nativity-entry', position: [0, 6.8] },
      { floorId: 'basilica', spaceId: 'nave', position: [0, 1.7] },
      { floorId: 'basilica', spaceId: 'transept', position: [0, -1] },
      { floorId: 'tower', spaceId: 'tower-view', position: [-5.5, -0.2] },
      { floorId: 'basilica', spaceId: 'passion-facade', position: [-6, -0.8] },
      { floorId: 'basement', spaceId: 'museum', position: [-2.2, 0] },
    ],
    sourceManifest: [
      {
        authority: 'official',
        scope: ['footprint', 'spaces', 'levels', 'route'],
        title: 'Architecture of the Sagrada Família, official booklet',
        url: 'https://sagradafamilia.org/documents/20142/1693659/SF_Booklet_04_20260227_digital_AF.pdf/6887364b-2f83-e9ae-006f-b3d08fba4428',
        verifiedAt: '2026-09-03',
      },
    ],
    verticalLinks: [
      {
        id: 'museum-stair',
        kind: 'stairs',
        label: '博物馆楼梯',
        landings: [
          { floorId: 'basement', position: [2.2, 2.1] },
          { floorId: 'basilica', position: [2.2, 2.1] },
        ],
      },
      {
        id: 'passion-lift',
        kind: 'lift',
        label: '受难塔电梯',
        landings: [
          { floorId: 'basilica', position: [-6.3, -1.6] },
          { floorId: 'tower', position: [-6.3, -1.6] },
        ],
      },
      {
        id: 'passion-stair',
        kind: 'stairs',
        label: '受难塔下行楼梯',
        landings: [
          { floorId: 'tower', position: [-6.1, 1.2] },
          { floorId: 'basilica', position: [-6.1, 1.2] },
        ],
      },
    ],
  };
}

function cologneCathedralPlan(): StackedFloorPlan {
  const cross: PlanPoint[] = [
    [-3, -8],
    [3, -8],
    [3, -3],
    [6, -3],
    [6, 3],
    [3, 3],
    [3, 8],
    [-3, 8],
    [-3, 3],
    [-6, 3],
    [-6, -3],
    [-3, -3],
    [-3, -8],
  ];
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'treasury',
        label: '地下层：珍宝馆拱顶地窖',
        elevation: -3,
        stackOrder: 0,
        outline: rect(4.5, 2.2, 4, 6),
        spaces: [
          space('treasury-vaults', '中世纪拱顶珍宝馆', 4.5, 1.8, 3.4, 4.2),
          space(
            'treasury-entry',
            '北侧独立入口',
            4.5,
            4.7,
            2.2,
            1,
            'circulation',
          ),
        ],
      },
      {
        id: 'cathedral',
        label: '教堂层：五廊式中殿、耳堂与唱诗席',
        elevation: 0,
        stackOrder: 1,
        outline: cross,
        spaces: [
          space(
            'west-entry',
            '西立面旅游入口',
            0,
            6.8,
            5.2,
            1.5,
            'circulation',
          ),
          space('nave', '中殿与侧廊', 0, 1.6, 5.2, 8.5, 'hall'),
          space(
            'choir-shrine',
            '唱诗席与三王圣龛',
            0,
            -5.8,
            5.2,
            3.2,
            'chapel',
          ),
          space(
            'gero-chapel',
            '十字架小堂与Gero十字架',
            4.6,
            -1.7,
            2.2,
            2.2,
            'chapel',
          ),
          space(
            'south-transept',
            '南耳堂Richter彩窗',
            -4.6,
            -0.4,
            2.2,
            3.6,
            'chapel',
          ),
        ],
      },
      {
        id: 'belfry',
        label: '南塔钟室层',
        elevation: 4.2,
        stackOrder: 2,
        outline: rect(-2.2, 5.8, 3.3, 3.3),
        spaces: [
          space(
            'spiral-stair',
            '南塔螺旋梯',
            -2.7,
            5.8,
            1.2,
            2.4,
            'circulation',
          ),
          space('bell-chamber', '钟室层', -1.5, 5.8, 1.2, 2.4, 'hall'),
        ],
      },
      {
        id: 'platform',
        label: '南塔约100米观景平台',
        elevation: 7.2,
        stackOrder: 3,
        outline: rect(-2.2, 5.8, 3.3, 3.3),
        spaces: [
          space(
            'metal-stair',
            '上层金属梯',
            -2.7,
            5.8,
            1.2,
            2.4,
            'circulation',
          ),
          space(
            'view-platform',
            '环形观景平台',
            -1.5,
            5.8,
            1.2,
            2.4,
            'outdoor',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'cathedral',
        kind: 'gate',
        position: [0, 7.8],
        connects: ['west-entry'],
      },
      {
        floorId: 'treasury',
        kind: 'gate',
        position: [4.5, 4.8],
        connects: ['treasury-entry'],
      },
    ],
    routeStops: [
      { floorId: 'cathedral', spaceId: 'west-entry', position: [0, 6.8] },
      { floorId: 'cathedral', spaceId: 'choir-shrine', position: [0, -5.8] },
      { floorId: 'cathedral', spaceId: 'gero-chapel', position: [4.6, -1.7] },
      {
        floorId: 'cathedral',
        spaceId: 'south-transept',
        position: [-4.6, -0.4],
      },
      { floorId: 'treasury', spaceId: 'treasury-vaults', position: [4.5, 1.8] },
      { floorId: 'platform', spaceId: 'view-platform', position: [-1.5, 5.8] },
    ],
    sourceManifest: [
      {
        authority: 'official',
        scope: ['levels', 'route'],
        title: 'Cologne Cathedral visitor circulation and accessibility',
        url: 'https://www.koelner-dom.de/besuchen/barrierefreiheit',
        verifiedAt: '2026-09-03',
      },
      {
        authority: 'authoritative',
        scope: ['footprint', 'spaces'],
        title: 'WDR virtual tour of Cologne Cathedral',
        url: 'https://dom360.wdr.de/',
        verifiedAt: '2026-09-03',
      },
    ],
    verticalLinks: [
      {
        id: 'treasury-stair',
        kind: 'stairs',
        label: '珍宝馆下行楼梯',
        landings: [
          { floorId: 'cathedral', position: [4.5, 3.8] },
          { floorId: 'treasury', position: [4.5, 3.8] },
        ],
      },
      {
        id: 'south-tower-stair',
        kind: 'stairs',
        label: '南塔螺旋梯',
        landings: [
          { floorId: 'cathedral', position: [-2.7, 5.8] },
          { floorId: 'belfry', position: [-2.7, 5.8] },
        ],
      },
      {
        id: 'upper-metal-stair',
        kind: 'stairs',
        label: '上层金属梯',
        landings: [
          { floorId: 'belfry', position: [-2.7, 5.8] },
          { floorId: 'platform', position: [-2.7, 5.8] },
        ],
      },
    ],
  };
}

export const pilotFloorPlans: Record<string, StackedFloorPlan> = {
  'casa-batllo': casaBatlloPlan(),
  'cologne-cathedral': cologneCathedralPlan(),
  'doges-palace': dogesPalacePlan(),
  'sagrada-familia': sagradaFamiliaPlan(),
  uffizi: uffiziPlan(),
};

function connectorPath(
  floorPlan: StackedFloorPlan,
  fromFloorId: string,
  toFloorId: string,
) {
  type Step = {
    connector: FloorPlanVerticalLink;
    fromFloorId: string;
    toFloorId: string;
  };
  const queue: Array<{ floorId: string; steps: Step[] }> = [
    { floorId: fromFloorId, steps: [] },
  ];
  const visited = new Set([fromFloorId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.floorId === toFloorId) return current.steps;
    for (const connector of floorPlan.verticalLinks) {
      if (
        !connector.landings.some(
          (landing) => landing.floorId === current.floorId,
        )
      ) {
        continue;
      }
      for (const landing of connector.landings) {
        if (
          landing.floorId === current.floorId ||
          visited.has(landing.floorId)
        ) {
          continue;
        }
        visited.add(landing.floorId);
        queue.push({
          floorId: landing.floorId,
          steps: [
            ...current.steps,
            {
              connector,
              fromFloorId: current.floorId,
              toFloorId: landing.floorId,
            },
          ],
        });
      }
    }
  }

  throw new Error(
    `route cannot travel from floor ${fromFloorId} to ${toFloorId} through a documented connector`,
  );
}

export function compileFloorPlanRoute(
  floorPlan: StackedFloorPlan,
): CompiledFloorPlanRoute {
  const floorIds = new Set(floorPlan.floors.map((floor) => floor.id));
  for (const stop of floorPlan.routeStops) {
    if (!floorIds.has(stop.floorId)) {
      throw new Error(`route references unknown floor ${stop.floorId}`);
    }
  }

  return {
    legs: floorPlan.routeStops.slice(1).map((stop, index) => {
      const from = floorPlan.routeStops[index];
      const sections: FloorPlanRouteSection[] = [];
      if (from.floorId === stop.floorId) {
        sections.push({
          floorId: from.floorId,
          kind: 'floor',
          points: [from.position, stop.position],
        });
      } else {
        let currentFloorId = from.floorId;
        let currentPoint = from.position;
        for (const step of connectorPath(
          floorPlan,
          from.floorId,
          stop.floorId,
        )) {
          const fromLanding = step.connector.landings.find(
            (landing) => landing.floorId === step.fromFloorId,
          )!;
          const toLanding = step.connector.landings.find(
            (landing) => landing.floorId === step.toFloorId,
          )!;
          sections.push({
            floorId: currentFloorId,
            kind: 'floor',
            points: [currentPoint, fromLanding.position],
          });
          sections.push({
            connectorId: step.connector.id,
            fromFloorId: step.fromFloorId,
            kind: 'transition',
            toFloorId: step.toFloorId,
          });
          currentFloorId = step.toFloorId;
          currentPoint = toLanding.position;
        }
        sections.push({
          floorId: stop.floorId,
          kind: 'floor',
          points: [currentPoint, stop.position],
        });
      }

      return {
        fromStopIndex: index,
        sections,
        toStopIndex: index + 1,
      };
    }),
  };
}

export function floorPlanPosition(
  floorPlan: StackedFloorPlan,
  stop: FloorPlanRouteStop,
): Vec3 {
  const floor = floorPlan.floors.find((item) => item.id === stop.floorId);
  if (!floor) {
    throw new Error(`route references unknown floor ${stop.floorId}`);
  }
  return [stop.position[0], floor.elevation, stop.position[1]];
}
