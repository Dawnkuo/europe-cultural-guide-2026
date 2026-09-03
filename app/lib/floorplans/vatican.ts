import {
  rect,
  space,
  type FloorPlanInventoryEntry,
  type FloorPlanSpace,
  type PlanPoint,
  type StackedFloorPlan,
} from './core';

function polygonSpace(
  id: string,
  label: string,
  polygon: PlanPoint[],
  kind: FloorPlanSpace['kind'] = 'gallery',
): FloorPlanSpace {
  return { id, kind, label, polygon };
}

function ellipse(
  centerX: number,
  centerZ: number,
  radiusX: number,
  radiusZ: number,
  segments = 24,
): PlanPoint[] {
  const points = Array.from({ length: segments }, (_, index) => {
    const angle = (Math.PI * 2 * index) / segments;
    return [
      centerX + Math.cos(angle) * radiusX,
      centerZ + Math.sin(angle) * radiusZ,
    ] as PlanPoint;
  });
  return [...points, points[0]];
}

const museumSources = [
  {
    authority: 'official' as const,
    scope: ['footprint', 'levels', 'route', 'spaces'] as const,
    title: 'Vatican Museums Map - Collections and Services',
    url: 'https://www.museivaticani.va/content/dam/museivaticani/pdf/visita_musei/servizi_visitatori/mappa_musei_vaticani.pdf',
    verifiedAt: '2026-09-03',
  },
  {
    authority: 'official' as const,
    scope: ['levels', 'route', 'spaces'] as const,
    title: 'Visit itinerary without barriers - Vatican Museums',
    url: 'https://www.museivaticani.va/content/dam/museivaticani/pdf/visita_musei/servizi_visitatori/mappa_disabili_en.pdf',
    verifiedAt: '2026-09-03',
  },
];

const vaticanMuseums: StackedFloorPlan = {
  mode: 'stacked-floorplan',
  floors: [
    {
      id: 'basement',
      label: '地下层：车马馆与民族学馆',
      elevation: -4,
      stackOrder: 0,
      outline: [
        [-112, -26],
        [38, -26],
        [38, 48],
        [-56, 48],
        [-56, 72],
        [-112, 72],
        [-112, -26],
      ],
      voids: [rect(-22, 18, 34, 38)],
      spaces: [
        space('numismatic', '集邮与钱币博物馆', -96, -11, 24, 18),
        space('anima-mundi', '民族学博物馆 Anima Mundi', -91, 48, 28, 36),
        space('carriages', '教皇车马馆', 21, 17, 24, 52),
        polygonSpace(
          'square-garden-basement',
          '方形花园挑空',
          rect(-22, 18, 34, 38),
          'courtyard',
        ),
      ],
    },
    {
      id: 'first',
      label: '一层：入口、古典馆、绘画馆与西斯廷礼拜堂',
      elevation: 0,
      stackOrder: 1,
      outline: [
        [-120, -38],
        [118, -38],
        [118, 39],
        [-56, 39],
        [-56, 96],
        [-112, 96],
        [-112, 39],
        [-120, 39],
        [-120, -38],
      ],
      voids: [rect(-34, -6, 52, 24), rect(-82, 65, 18, 32)],
      spaces: [
        space('entrance', '入口大厅与四门厅', -112, 22, 14, 22, 'circulation'),
        space('pio-clementino', '庇奥-克莱门蒂诺博物馆', -104, -24, 24, 20),
        space('egyptian', '格里高利埃及博物馆', -82, -31, 18, 9),
        space('chiaramonti', '奇拉蒙蒂馆与新翼', -52, -31, 40, 9),
        polygonSpace(
          'pinecone-courtyard',
          '松果庭院',
          rect(-34, -6, 52, 24),
          'courtyard',
        ),
        space(
          'library',
          '梵蒂冈图书馆博物馆长廊',
          25,
          23,
          105,
          10,
          'circulation',
        ),
        space('borgia', '波吉亚寓所', 94, 4, 21, 14),
        space('sistine', '西斯廷礼拜堂', 108, 26, 16, 20, 'chapel'),
        space('pinacoteca', '梵蒂冈绘画馆', -97, 67, 20, 50),
        polygonSpace(
          'square-garden-first',
          '方形花园挑空',
          rect(-82, 65, 18, 32),
          'courtyard',
        ),
      ],
    },
    {
      id: 'second',
      label: '二层：伊特鲁里亚馆、三大长廊与拉斐尔画室',
      elevation: 5,
      stackOrder: 2,
      outline: [
        [-112, -34],
        [116, -34],
        [116, 34],
        [86, 34],
        [86, 22],
        [-76, 22],
        [-76, 36],
        [-112, 36],
        [-112, -34],
      ],
      voids: [rect(-40, -4, 48, 18)],
      spaces: [
        space('etruscan', '格里高利伊特鲁里亚博物馆', -101, -13, 20, 34),
        polygonSpace(
          'pinecone-courtyard-upper',
          '松果庭院挑空',
          rect(-40, -4, 48, 18),
          'courtyard',
        ),
        space('candelabra', '烛台廊', -61, 15, 28, 10, 'circulation'),
        space('tapestries', '挂毯廊', -22, 15, 34, 10, 'circulation'),
        space('maps', '地图廊', 25, 15, 52, 10, 'circulation'),
        space('immaculate', '圣母无原罪厅', 72, 15, 17, 10),
        space('raphael', '拉斐尔画室', 99, 12, 24, 26),
      ],
    },
  ],
  openings: [
    {
      floorId: 'first',
      kind: 'gate',
      position: [-119, 22],
      connects: ['entrance'],
    },
    {
      floorId: 'first',
      kind: 'archway',
      position: [-106, 7],
      connects: ['entrance', 'pio-clementino'],
    },
    {
      floorId: 'first',
      kind: 'archway',
      position: [-92, -29],
      connects: ['pio-clementino', 'egyptian'],
    },
    {
      floorId: 'first',
      kind: 'archway',
      position: [-72, -31],
      connects: ['egyptian', 'chiaramonti'],
    },
    {
      floorId: 'first',
      kind: 'door',
      position: [-101, 39],
      connects: ['entrance', 'pinacoteca'],
    },
    {
      floorId: 'first',
      kind: 'door',
      position: [84, 23],
      connects: ['library', 'borgia'],
    },
    {
      floorId: 'first',
      kind: 'door',
      position: [103, 19],
      connects: ['borgia', 'sistine'],
    },
    {
      floorId: 'second',
      kind: 'archway',
      position: [-78, 15],
      connects: ['etruscan', 'candelabra'],
    },
    {
      floorId: 'second',
      kind: 'archway',
      position: [-43, 15],
      connects: ['candelabra', 'tapestries'],
    },
    {
      floorId: 'second',
      kind: 'archway',
      position: [-3, 15],
      connects: ['tapestries', 'maps'],
    },
    {
      floorId: 'second',
      kind: 'archway',
      position: [63, 15],
      connects: ['maps', 'immaculate'],
    },
    {
      floorId: 'second',
      kind: 'door',
      position: [84, 15],
      connects: ['immaculate', 'raphael'],
    },
  ],
  verticalLinks: [
    {
      id: 'entrance-lift',
      kind: 'lift',
      label: '入口大厅电梯',
      landings: [
        { floorId: 'basement', position: [-104, 22] },
        { floorId: 'first', position: [-112, 22] },
      ],
    },
    {
      id: 'belvedere-stairs',
      kind: 'stairs',
      label: '观景楼楼梯',
      landings: [
        { floorId: 'first', position: [-94, -20] },
        { floorId: 'second', position: [-94, -13] },
      ],
    },
    {
      id: 'sistine-stairs',
      kind: 'stairs',
      label: '拉斐尔画室至西斯廷礼拜堂楼梯',
      landings: [
        { floorId: 'second', position: [104, 18] },
        { floorId: 'first', position: [103, 18] },
      ],
    },
  ],
  routeStops: [
    { floorId: 'first', spaceId: 'entrance', position: [-112, 22] },
    { floorId: 'first', spaceId: 'pinacoteca', position: [-97, 67] },
    { floorId: 'first', spaceId: 'pio-clementino', position: [-104, -24] },
    { floorId: 'first', spaceId: 'pinecone-courtyard', position: [-34, -6] },
    { floorId: 'second', spaceId: 'etruscan', position: [-101, -13] },
    { floorId: 'second', spaceId: 'candelabra', position: [-61, 15] },
    { floorId: 'second', spaceId: 'tapestries', position: [-22, 15] },
    { floorId: 'second', spaceId: 'maps', position: [25, 15] },
    { floorId: 'second', spaceId: 'raphael', position: [99, 12] },
    { floorId: 'first', spaceId: 'borgia', position: [94, 4] },
    { floorId: 'first', spaceId: 'sistine', position: [108, 26] },
    { floorId: 'first', spaceId: 'entrance', position: [-112, 27] },
  ],
  sourceManifest: museumSources.map((source) => ({
    ...source,
    scope: [...source.scope],
  })),
};

const basilicaSources = [
  {
    authority: 'official' as const,
    scope: ['footprint', 'levels', 'route', 'spaces'] as const,
    title: "Explore St. Peter's Basilica - official digital experience",
    url: 'https://virtual.basilicasanpietro.va/en/explore-the-basilica',
    verifiedAt: '2026-09-03',
  },
  {
    authority: 'official' as const,
    scope: ['footprint', 'spaces'] as const,
    title: "St. Peter's Basilica orthographic plan",
    url: 'https://virtual-cdn.basilicasanpietro.va/explore-the-basilica/basilica.webp',
    verifiedAt: '2026-09-03',
  },
  {
    authority: 'official' as const,
    scope: ['footprint', 'levels', 'spaces'] as const,
    title: 'Vatican Grottoes orthographic plan',
    url: 'https://virtual-cdn.basilicasanpietro.va/explore-the-basilica/grottoes.webp',
    verifiedAt: '2026-09-03',
  },
  {
    authority: 'official' as const,
    scope: ['footprint', 'levels', 'spaces'] as const,
    title: "St. Peter's Dome orthographic plan",
    url: 'https://virtual-cdn.basilicasanpietro.va/explore-the-basilica/cupola.webp',
    verifiedAt: '2026-09-03',
  },
];

const basilicaOutline: PlanPoint[] = [
  [-25, 84],
  [25, 84],
  [25, 32],
  [48, 32],
  [48, 14],
  [80, 14],
  [80, -20],
  [48, -20],
  [48, -43],
  [25, -43],
  [25, -82],
  [-25, -82],
  [-25, -43],
  [-48, -43],
  [-48, -20],
  [-80, -20],
  [-80, 14],
  [-48, 14],
  [-48, 32],
  [-25, 32],
  [-25, 84],
];

const stPetersBasilica: StackedFloorPlan = {
  mode: 'stacked-floorplan',
  floors: [
    {
      id: 'grottoes',
      label: '地下层：梵蒂冈墓穴与圣彼得墓核心区',
      elevation: -5,
      stackOrder: 0,
      outline: [
        [-18, 70],
        [18, 70],
        [18, 20],
        [43, 20],
        [43, 8],
        [68, 8],
        [68, -15],
        [43, -15],
        [43, -34],
        [18, -34],
        [18, -68],
        [-18, -68],
        [-18, -34],
        [-43, -34],
        [-43, -15],
        [-68, -15],
        [-68, 8],
        [-43, 8],
        [-43, 20],
        [-18, 20],
        [-18, 70],
      ],
      spaces: [
        space('grotto-nave', '地下墓穴中央通道', 0, 38, 26, 56, 'circulation'),
        space('peter-tomb', '圣彼得墓与纪念核心', 0, -2, 26, 22, 'chapel'),
        space('papal-tombs', '教宗墓与侧礼拜堂', 38, -4, 52, 18, 'chapel'),
      ],
    },
    {
      id: 'basilica',
      label: '圣殿层：门廊、中殿、耳堂与后殿',
      elevation: 0,
      stackOrder: 1,
      outline: basilicaOutline,
      spaces: [
        space('portico', '正立面门廊', 0, 76, 46, 12, 'circulation'),
        space('pieta', '圣殇礼拜堂', -18, 58, 12, 14, 'chapel'),
        space('nave', '中央中殿', 0, 43, 32, 50, 'hall'),
        space('crossing', '穹顶交叉部与青铜华盖', 0, 0, 38, 34, 'hall'),
        space('north-transept', '北耳堂', 54, -3, 48, 18, 'hall'),
        space('south-transept', '南耳堂', -54, -3, 48, 18, 'hall'),
        space('cathedra', '圣彼得宝座与后殿', 0, -59, 32, 34, 'chapel'),
      ],
    },
    {
      id: 'roof',
      label: '屋顶平台：电梯终点与穹顶外环',
      elevation: 44,
      stackOrder: 2,
      outline: ellipse(0, 0, 35, 35),
      voids: [ellipse(0, 0, 22, 22)],
      spaces: [
        polygonSpace(
          'roof-east',
          '屋顶平台与电梯出口',
          [
            [22, -7],
            [33, -5],
            [33, 5],
            [22, 7],
            [22, -7],
          ],
          'outdoor',
        ),
        polygonSpace(
          'roof-west',
          '穹顶外环入口',
          [
            [-22, -7],
            [-33, -5],
            [-33, 5],
            [-22, 7],
            [-22, -7],
          ],
          'circulation',
        ),
      ],
    },
    {
      id: 'inner-dome',
      label: '穹顶内环：马赛克近观与窄梯起点',
      elevation: 53,
      stackOrder: 3,
      outline: ellipse(0, 0, 27, 27),
      voids: [ellipse(0, 0, 18, 18)],
      spaces: [
        polygonSpace(
          'inner-ring-east',
          '穹顶内环东段',
          [
            [18, -6],
            [26, -4],
            [26, 4],
            [18, 6],
            [18, -6],
          ],
          'circulation',
        ),
        polygonSpace(
          'inner-ring-west',
          '穹顶内环西段',
          [
            [-18, -6],
            [-26, -4],
            [-26, 4],
            [-18, 6],
            [-18, -6],
          ],
          'circulation',
        ),
      ],
    },
    {
      id: 'summit',
      label: '顶部层：灯笼观景台',
      elevation: 119,
      stackOrder: 4,
      outline: ellipse(0, 0, 8, 8, 20),
      spaces: [
        polygonSpace(
          'lantern',
          '灯笼观景台',
          ellipse(0, 0, 7, 7, 20),
          'outdoor',
        ),
      ],
    },
  ],
  openings: [
    {
      floorId: 'basilica',
      kind: 'gate',
      position: [0, 82],
      connects: ['portico'],
    },
    {
      floorId: 'basilica',
      kind: 'door',
      position: [0, 69],
      connects: ['portico', 'nave'],
    },
    {
      floorId: 'basilica',
      kind: 'archway',
      position: [0, 18],
      connects: ['nave', 'crossing'],
    },
    {
      floorId: 'basilica',
      kind: 'archway',
      position: [20, 0],
      connects: ['crossing', 'north-transept'],
    },
    {
      floorId: 'basilica',
      kind: 'archway',
      position: [-20, 0],
      connects: ['crossing', 'south-transept'],
    },
    {
      floorId: 'basilica',
      kind: 'archway',
      position: [0, -20],
      connects: ['crossing', 'cathedra'],
    },
    {
      floorId: 'grottoes',
      kind: 'archway',
      position: [0, 12],
      connects: ['grotto-nave', 'peter-tomb'],
    },
    {
      floorId: 'grottoes',
      kind: 'archway',
      position: [14, -2],
      connects: ['peter-tomb', 'papal-tombs'],
    },
  ],
  verticalLinks: [
    {
      id: 'grotto-stairs',
      kind: 'stairs',
      label: '圣殿至地下墓穴楼梯',
      landings: [
        { floorId: 'grottoes', position: [0, 16] },
        { floorId: 'basilica', position: [0, 14] },
      ],
    },
    {
      id: 'dome-lift',
      kind: 'lift',
      label: '穹顶电梯至屋顶平台',
      landings: [
        { floorId: 'basilica', position: [20, 69] },
        { floorId: 'roof', position: [28, 0] },
      ],
    },
    {
      id: 'inner-ring-stairs',
      kind: 'stairs',
      label: '屋顶平台至穹顶内环楼梯',
      landings: [
        { floorId: 'roof', position: [-28, 0] },
        { floorId: 'inner-dome', position: [-22, 0] },
      ],
    },
    {
      id: 'lantern-stairs',
      kind: 'stairs',
      label: '穹顶夹层窄梯至灯笼观景台',
      landings: [
        { floorId: 'inner-dome', position: [22, 0] },
        { floorId: 'summit', position: [0, 0] },
      ],
    },
  ],
  routeStops: [
    { floorId: 'basilica', spaceId: 'portico', position: [0, 76] },
    { floorId: 'basilica', spaceId: 'pieta', position: [-18, 58] },
    { floorId: 'basilica', spaceId: 'nave', position: [0, 43] },
    { floorId: 'basilica', spaceId: 'crossing', position: [0, 0] },
    { floorId: 'basilica', spaceId: 'cathedra', position: [0, -59] },
    { floorId: 'grottoes', spaceId: 'peter-tomb', position: [0, -2] },
    { floorId: 'basilica', spaceId: 'north-transept', position: [54, -3] },
    { floorId: 'roof', spaceId: 'roof-east', position: [28, 0] },
    { floorId: 'inner-dome', spaceId: 'inner-ring-west', position: [-22, 0] },
    { floorId: 'summit', spaceId: 'lantern', position: [0, 0] },
  ],
  sourceManifest: basilicaSources.map((source) => ({
    ...source,
    scope: [...source.scope],
  })),
};

export const vaticanFloorPlans: Record<string, StackedFloorPlan> = {
  'st-peters-basilica': stPetersBasilica,
  'vatican-museums': vaticanMuseums,
};

export const vaticanInventory: Record<string, FloorPlanInventoryEntry> =
  Object.fromEntries(
    Object.entries(vaticanFloorPlans).map(([slug, floorPlan]) => [
      slug,
      {
        note: '已依据梵蒂冈官方游客平面和数字体验正交平面重绘分层拓扑。',
        sources: floorPlan.sourceManifest,
        status: 'ready' as const,
      },
    ]),
  );
