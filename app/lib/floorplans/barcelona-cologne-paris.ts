import {
  rect,
  space,
  type FloorPlanInventoryEntry,
  type FloorPlanSource,
  type PlanPoint,
  type StackedFloorPlan,
} from './core';

const VERIFIED_AT = '2026-09-03';

const laPedreraSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels'],
    title: 'Casa Mila architecture and visitable spaces',
    url: 'https://www.lapedrera.com/en/casa-mila/architecture/',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['levels', 'route'],
    title: 'Casa Mila accessibility and visitor circulation',
    url: 'https://www.lapedrera.com/en/accessibility/',
    verifiedAt: VERIFIED_AT,
  },
];

const palauMusicaSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels'],
    title: 'Palau de la Musica Catalana auditorium plan',
    url: 'https://www.palaumusica.cat/map-sala-de-concerts_129567.pdf',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['spaces', 'route'],
    title: 'Palau de la Musica Catalana self-guided route',
    url: 'https://www.palaumusica.cat/en/visites/self-guided-tour_1174326',
    verifiedAt: VERIFIED_AT,
  },
];

const barcelonaCathedralSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['spaces', 'levels', 'route'],
    title: 'Barcelona Cathedral visitable spaces',
    url: 'https://catedralbcn.org/en/tourist-visit/visitable-spaces/',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['footprint', 'spaces'],
    title: 'Barcelona Cathedral chapels and saints plan',
    url: 'https://catedralbcn.org/en/worship-and-prayer/saints/',
    verifiedAt: VERIFIED_AT,
  },
];

const picassoBarcelonaSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'Museu Picasso Barcelona visitor floor map',
    url: 'https://museupicassobcn.cat/sites/default/files/inline-images/Museu/planol/PLANOL_EN.pdf',
    verifiedAt: VERIFIED_AT,
  },
];

const santaMariaMarSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels'],
    title: 'Santa Maria del Mar building guide',
    url: 'https://www.santamariadelmar.barcelona/en/building/',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['spaces', 'route'],
    title: 'Santa Maria del Mar virtual tour',
    url: 'https://www.santamariadelmar.barcelona/en/virtual-tour/',
    verifiedAt: VERIFIED_AT,
  },
];

const museumLudwigSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['spaces', 'levels'],
    title: 'Museum Ludwig current floor assignments',
    url: 'https://www.museum-ludwig.de/de/kasse',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'authoritative',
    scope: ['footprint', 'spaces'],
    title: 'Museum Ludwig building geometry diagram',
    url: 'https://www.museum-ludwig.de/fileadmin/content/01_Programm/ML_Z08-Credit-400x234_lay_10.pdf',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['levels', 'route'],
    title: 'Museum Ludwig visitor accessibility information',
    url: 'https://www.museum-ludwig.de/en/home/visit/information/faq-plan-your-visit',
    verifiedAt: VERIFIED_AT,
  },
];

const kolnTriangleSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'KoelnTriangle Panorama visitor guide',
    url: 'https://koelntrianglepanorama.de/en/homepage',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'authoritative',
    scope: ['spaces', 'levels', 'route'],
    title: 'Cologne Tourism KoelnTriangle route description',
    url: 'https://willkommen.koelntourismus.de/en/poi/koelntriangle',
    verifiedAt: VERIFIED_AT,
  },
];

const notreDameTowersSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['spaces', 'levels', 'route'],
    title: 'Notre-Dame Towers official visit guide',
    url: 'https://www.tours-notre-dame-de-paris.fr/en/visit/visits-and-activities',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'Notre-Dame Towers official route description',
    url: 'https://www.tours-notre-dame-de-paris.fr/en/actualites/the-new-notre-dame-de-paris-towers-tour',
    verifiedAt: VERIFIED_AT,
  },
];

const gaudiHouseSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['spaces', 'levels'],
    title: 'Gaudi House Museum official guide',
    url: 'https://sagradafamilia.org/en/gaudi-house-museum',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['spaces'],
    title: 'Park Guell Gaudi House feature guide',
    url: 'https://parkguell.barcelona/en/park-guell/emblematic-features/gaudi-museum-house',
    verifiedAt: VERIFIED_AT,
  },
];

const chocolateMuseumSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['spaces', 'levels'],
    title: 'Chocolate Museum Cologne exhibition guide',
    url: 'https://www.schokoladenmuseum.de/en/the-museum/exhibition/',
    verifiedAt: VERIFIED_AT,
  },
  {
    authority: 'official',
    scope: ['levels', 'route'],
    title: 'Chocolate Museum Cologne visitor accessibility guide',
    url: 'https://www.schokoladenmuseum.de/en/plan-a-visit/',
    verifiedAt: VERIFIED_AT,
  },
];

const elBornSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces'],
    title: 'El Born Centre de Cultura i Memoria visitor map',
    url: 'https://elbornculturaimemoria.barcelona.cat/wp-content/uploads/2015/05/planol-angles.pdf',
    verifiedAt: VERIFIED_AT,
  },
];

function laPedreraPlan(): StackedFloorPlan {
  const blockOutline: PlanPoint[] = [
    [-14, -8],
    [8, -8],
    [13, -5],
    [14, 2],
    [12, 8],
    [-14, 8],
    [-14, -8],
  ];
  const upperOutline: PlanPoint[] = [
    [-13, -7.5],
    [7.5, -7.5],
    [12, -4.5],
    [13, 2],
    [11, 7.5],
    [-13, 7.5],
    [-13, -7.5],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '底层庭院',
        elevation: 0,
        stackOrder: 0,
        outline: blockOutline,
        spaces: [
          space(
            'street-approach',
            'Passeig de Gracia 转角与入口',
            0,
            -5.8,
            16,
            2,
            'outdoor',
          ),
          space('flower-courtyard', '花卉庭院', -6.4, 0.4, 7, 9, 'courtyard'),
          space('butterfly-courtyard', '蝴蝶庭院', 5.5, 1, 7, 8, 'courtyard'),
          space(
            'ground-circulation',
            '庭院连廊与访客电梯',
            0,
            5.7,
            18,
            2.4,
            'circulation',
          ),
        ],
      },
      {
        id: 'apartment',
        label: '四层住宅公寓',
        elevation: 3,
        stackOrder: 1,
        outline: upperOutline,
        spaces: [
          space(
            'apartment-entry',
            '住宅公寓入口与环形动线',
            7.5,
            4.8,
            6,
            3.2,
            'circulation',
          ),
          space(
            'period-apartment',
            '1911 年住宅公寓陈设',
            -2.5,
            -0.5,
            17,
            10,
            'gallery',
          ),
          space(
            'apartment-service-stair',
            '通往阁楼的服务楼梯',
            8.3,
            -3.5,
            4,
            3,
            'circulation',
          ),
        ],
      },
      {
        id: 'attic',
        label: '鲸腹阁楼',
        elevation: 6,
        stackOrder: 2,
        outline: upperOutline,
        spaces: [
          space('attic-arrival', '阁楼到达区', 8, -3.5, 4.5, 3, 'circulation'),
          space(
            'whale-attic',
            '鲸腹阁楼与高迪展览',
            -1.5,
            0,
            19,
            11,
            'gallery',
          ),
          space(
            'roof-stair-exits',
            '屋顶螺旋楼梯出口',
            1,
            5.2,
            11,
            3,
            'circulation',
          ),
        ],
      },
      {
        id: 'roof',
        label: '武士屋顶',
        elevation: 9,
        stackOrder: 3,
        outline: upperOutline,
        spaces: [
          space('roof-arrival', '屋顶楼梯出口', 1, 5.2, 10, 3, 'circulation'),
          space(
            'warrior-roof',
            '烟囱、通风塔与楼梯间群',
            -1.5,
            0,
            21,
            11,
            'outdoor',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [0, -7.2],
        connects: ['street-approach', 'flower-courtyard'],
      },
      {
        floorId: 'ground',
        kind: 'archway',
        position: [0, 4.8],
        connects: ['flower-courtyard', 'ground-circulation'],
      },
      {
        floorId: 'apartment',
        kind: 'door',
        position: [5, 4.8],
        connects: ['apartment-entry', 'period-apartment'],
      },
      {
        floorId: 'apartment',
        kind: 'door',
        position: [6.8, -3.5],
        connects: ['period-apartment', 'apartment-service-stair'],
      },
      {
        floorId: 'attic',
        kind: 'archway',
        position: [5.8, -3.5],
        connects: ['attic-arrival', 'whale-attic'],
      },
      {
        floorId: 'attic',
        kind: 'archway',
        position: [1, 4.4],
        connects: ['whale-attic', 'roof-stair-exits'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'street-approach', position: [0, -6.6] },
      { floorId: 'ground', spaceId: 'flower-courtyard', position: [-6.4, 0.4] },
      {
        floorId: 'apartment',
        spaceId: 'period-apartment',
        position: [-2.5, -0.5],
      },
      { floorId: 'attic', spaceId: 'whale-attic', position: [-1.5, 0] },
      { floorId: 'roof', spaceId: 'warrior-roof', position: [-1.5, 0] },
    ],
    sourceManifest: laPedreraSources,
    verticalLinks: [
      {
        id: 'courtyard-lift',
        kind: 'lift',
        label: '庭院访客电梯',
        landings: [
          { floorId: 'ground', position: [8, 5.7] },
          { floorId: 'apartment', position: [8, 4.8] },
        ],
      },
      {
        id: 'apartment-attic-stair',
        kind: 'stairs',
        label: '住宅公寓至鲸腹阁楼楼梯',
        landings: [
          { floorId: 'apartment', position: [8.3, -3.5] },
          { floorId: 'attic', position: [8, -3.5] },
        ],
      },
      {
        id: 'attic-roof-stair',
        kind: 'stairs',
        label: '阁楼至屋顶螺旋楼梯',
        landings: [
          { floorId: 'attic', position: [1, 5.2] },
          { floorId: 'roof', position: [1, 5.2] },
        ],
      },
    ],
  };
}

function palauMusicaPlan(): StackedFloorPlan {
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '门厅层',
        elevation: 0,
        stackOrder: 0,
        outline: rect(0, 0, 24, 16),
        spaces: [
          space('foyer', '门厅', 0, -4.8, 19, 4.5, 'hall'),
          space('main-stair', '主楼梯', -7.8, 2.8, 5, 8, 'circulation'),
          space('ground-service', '票务与服务区', 7.8, 2.8, 5, 8, 'service'),
        ],
      },
      {
        id: 'first',
        label: '音乐厅主层',
        elevation: 3,
        stackOrder: 1,
        outline: rect(0, 0, 24, 16),
        spaces: [
          space('millet-hall', 'Lluis Millet 厅', -7, -4.8, 8, 4.5, 'hall'),
          space('lower-auditorium', '音乐厅下层座席', -2, 2, 13, 9, 'hall'),
          space('stage', '舞台、雕塑群与管风琴', 7.3, 2, 5, 9, 'hall'),
          space(
            'first-circulation',
            '主楼梯上层平台',
            -9,
            2,
            3,
            7,
            'circulation',
          ),
        ],
      },
      {
        id: 'second',
        label: '音乐厅上层',
        elevation: 6,
        stackOrder: 2,
        outline: rect(0, 0, 24, 16),
        spaces: [
          space(
            'upper-seating',
            '上层座席与彩玻璃穹顶视域',
            -1.5,
            1.5,
            16,
            10,
            'hall',
          ),
          space(
            'upper-circulation',
            '上层楼梯与电梯平台',
            -9,
            1.5,
            3,
            7,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [0, -7.2],
        connects: ['foyer'],
      },
      {
        floorId: 'ground',
        kind: 'archway',
        position: [-6.5, -2.8],
        connects: ['foyer', 'main-stair'],
      },
      {
        floorId: 'first',
        kind: 'door',
        position: [-7, -3],
        connects: ['first-circulation', 'millet-hall'],
      },
      {
        floorId: 'first',
        kind: 'archway',
        position: [-6.5, 2],
        connects: ['first-circulation', 'lower-auditorium'],
      },
      {
        floorId: 'first',
        kind: 'archway',
        position: [4.5, 2],
        connects: ['lower-auditorium', 'stage'],
      },
      {
        floorId: 'second',
        kind: 'archway',
        position: [-7.5, 1.5],
        connects: ['upper-circulation', 'upper-seating'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'foyer', position: [0, -4.8] },
      { floorId: 'first', spaceId: 'millet-hall', position: [-7, -4.8] },
      { floorId: 'first', spaceId: 'lower-auditorium', position: [-2, 2] },
      { floorId: 'first', spaceId: 'stage', position: [7.3, 2] },
      { floorId: 'second', spaceId: 'upper-seating', position: [-1.5, 1.5] },
    ],
    sourceManifest: palauMusicaSources,
    verticalLinks: [
      {
        id: 'main-stair',
        kind: 'stairs',
        label: '主楼梯',
        landings: [
          { floorId: 'ground', position: [-7.8, 2.8] },
          { floorId: 'first', position: [-9, 2] },
          { floorId: 'second', position: [-9, 1.5] },
        ],
      },
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: '访客电梯',
        landings: [
          { floorId: 'ground', position: [8, 2.8] },
          { floorId: 'first', position: [-8.5, 4.5] },
          { floorId: 'second', position: [-8.5, 4.5] },
        ],
      },
    ],
  };
}

function barcelonaCathedralPlan(): StackedFloorPlan {
  const cathedralOutline: PlanPoint[] = [
    [-5, -12],
    [5, -12],
    [5, -7],
    [11, -7],
    [11, 8],
    [5, 8],
    [5, 12],
    [-5, 12],
    [-5, 8],
    [-14, 8],
    [-14, -7],
    [-5, -7],
    [-5, -12],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'crypt',
        label: '圣欧拉利娅地下墓室',
        elevation: -3,
        stackOrder: 0,
        outline: rect(0, 3.5, 8, 7),
        spaces: [
          space(
            'eulalia-crypt',
            '圣欧拉利娅墓室与石棺',
            0,
            3.5,
            6,
            5,
            'chapel',
          ),
          space('crypt-stair', '墓室楼梯平台', 0, 0.7, 4, 1.2, 'circulation'),
        ],
      },
      {
        id: 'cathedral',
        label: '主教座堂与回廊',
        elevation: 0,
        stackOrder: 1,
        outline: cathedralOutline,
        spaces: [
          space('nave', '中殿与侧廊小堂', 0, -2, 9, 18, 'chapel'),
          space('choir', '唱诗席与金羊毛骑士团徽章', 0, 2.5, 7, 5, 'hall'),
          space('crypt-access', '地下墓室入口', 0, 0.7, 4, 2, 'circulation'),
          space(
            'lepanto-chapel',
            '勒班陀圣基督小堂',
            7.2,
            -1.5,
            5.5,
            7,
            'chapel',
          ),
          space(
            'cloister',
            '回廊、花园与十三只鹅',
            -9.5,
            0.5,
            8,
            13,
            'courtyard',
          ),
          space(
            'roof-lift-chapel',
            'Holy Innocents 小堂旁屋顶电梯',
            4,
            6.5,
            2,
            2,
            'circulation',
          ),
        ],
      },
      {
        id: 'roof',
        label: '屋顶',
        elevation: 4,
        stackOrder: 2,
        outline: cathedralOutline,
        spaces: [
          space(
            'roof-lift-arrival',
            '屋顶电梯到达处',
            4,
            6.5,
            2,
            2,
            'circulation',
          ),
          space(
            'roof-walk',
            '主教座堂屋顶与哥特区天际线',
            0,
            0,
            9,
            18,
            'outdoor',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'cathedral',
        kind: 'gate',
        position: [0, -11],
        connects: ['nave'],
      },
      {
        floorId: 'cathedral',
        kind: 'archway',
        position: [0, 0.7],
        connects: ['choir', 'crypt-access'],
      },
      {
        floorId: 'cathedral',
        kind: 'archway',
        position: [5.2, -1.5],
        connects: ['nave', 'lepanto-chapel'],
      },
      {
        floorId: 'cathedral',
        kind: 'door',
        position: [-5.2, 0.5],
        connects: ['nave', 'cloister'],
      },
      {
        floorId: 'cathedral',
        kind: 'door',
        position: [4, 5.3],
        connects: ['nave', 'roof-lift-chapel'],
      },
      {
        floorId: 'crypt',
        kind: 'archway',
        position: [0, 1.2],
        connects: ['crypt-stair', 'eulalia-crypt'],
      },
    ],
    routeStops: [
      { floorId: 'cathedral', spaceId: 'nave', position: [0, -2] },
      { floorId: 'cathedral', spaceId: 'choir', position: [0, 2.5] },
      { floorId: 'crypt', spaceId: 'eulalia-crypt', position: [0, 3.5] },
      {
        floorId: 'cathedral',
        spaceId: 'lepanto-chapel',
        position: [7.2, -1.5],
      },
      { floorId: 'cathedral', spaceId: 'cloister', position: [-9.5, 0.5] },
      { floorId: 'roof', spaceId: 'roof-walk', position: [0, 0] },
    ],
    sourceManifest: barcelonaCathedralSources,
    verticalLinks: [
      {
        id: 'crypt-stair',
        kind: 'stairs',
        label: '圣欧拉利娅墓室楼梯',
        landings: [
          { floorId: 'crypt', position: [0, 0.7] },
          { floorId: 'cathedral', position: [0, 0.7] },
        ],
      },
      {
        id: 'roof-lift',
        kind: 'lift',
        label: 'Holy Innocents 小堂旁屋顶电梯',
        landings: [
          { floorId: 'cathedral', position: [4, 6.5] },
          { floorId: 'roof', position: [4, 6.5] },
        ],
      },
    ],
  };
}

function picassoBarcelonaPlan(): StackedFloorPlan {
  const palaceOutline: PlanPoint[] = [
    [-18, -6],
    [18, -6],
    [18, 6],
    [10, 6],
    [10, 4.5],
    [3, 4.5],
    [3, 6],
    [-4, 6],
    [-4, 4.5],
    [-11, 4.5],
    [-11, 6],
    [-18, 6],
    [-18, -6],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'level-0',
        label: 'Level 0 宫殿庭院',
        elevation: 0,
        stackOrder: 0,
        outline: palaceOutline,
        spaces: [
          space(
            'montcada-entry',
            'Montcada 街入口',
            -16,
            -4.5,
            3,
            2,
            'circulation',
          ),
          space(
            'palace-courts',
            '五座宫殿庭院与外楼梯',
            -7,
            0,
            14,
            9,
            'courtyard',
          ),
          space('noguera-court', 'Noguera 庭院', 3.5, 0, 6, 8, 'courtyard'),
          space(
            'ground-services',
            '票务、衣帽间与书店',
            12.5,
            0,
            8,
            9,
            'service',
          ),
        ],
      },
      {
        id: 'level-1',
        label: 'Level 1 常设展',
        elevation: 3,
        stackOrder: 1,
        outline: palaceOutline,
        spaces: [
          space(
            'rooms-1-7',
            '展厅 1–7：少年学院训练与家庭时期',
            -14,
            0,
            7,
            9,
            'gallery',
          ),
          space(
            'rooms-8-11',
            '展厅 8–11：蓝色时期与巴黎转折',
            -7,
            0,
            6,
            9,
            'gallery',
          ),
          space(
            'room-12',
            '展厅 12：1917 年巴塞罗那作品',
            -1.5,
            0,
            4,
            9,
            'gallery',
          ),
          space(
            'rooms-13-16',
            '展厅 13–16：《宫娥》系列',
            5,
            0,
            8,
            9,
            'gallery',
          ),
          space(
            'ceramics-annex',
            '陶瓷与捐赠脉络展区',
            13.5,
            0,
            7,
            9,
            'gallery',
          ),
          space(
            'upper-arrival',
            '宫殿外楼梯与电梯到达处',
            -16.5,
            -4.5,
            2,
            2,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'level-0',
        kind: 'gate',
        position: [-17.2, -4.5],
        connects: ['montcada-entry', 'palace-courts'],
      },
      {
        floorId: 'level-0',
        kind: 'archway',
        position: [0, 0],
        connects: ['palace-courts', 'noguera-court'],
      },
      {
        floorId: 'level-0',
        kind: 'archway',
        position: [7.5, 0],
        connects: ['noguera-court', 'ground-services'],
      },
      {
        floorId: 'level-1',
        kind: 'archway',
        position: [-10.5, 0],
        connects: ['rooms-1-7', 'rooms-8-11'],
      },
      {
        floorId: 'level-1',
        kind: 'archway',
        position: [-4, 0],
        connects: ['rooms-8-11', 'room-12'],
      },
      {
        floorId: 'level-1',
        kind: 'archway',
        position: [0.5, 0],
        connects: ['room-12', 'rooms-13-16'],
      },
      {
        floorId: 'level-1',
        kind: 'archway',
        position: [9.5, 0],
        connects: ['rooms-13-16', 'ceramics-annex'],
      },
    ],
    routeStops: [
      { floorId: 'level-0', spaceId: 'palace-courts', position: [-7, 0] },
      { floorId: 'level-1', spaceId: 'rooms-1-7', position: [-14, 0] },
      { floorId: 'level-1', spaceId: 'rooms-8-11', position: [-7, 0] },
      { floorId: 'level-1', spaceId: 'room-12', position: [-1.5, 0] },
      { floorId: 'level-1', spaceId: 'rooms-13-16', position: [5, 0] },
      { floorId: 'level-1', spaceId: 'ceramics-annex', position: [13.5, 0] },
    ],
    sourceManifest: picassoBarcelonaSources,
    verticalLinks: [
      {
        id: 'palace-stair',
        kind: 'stairs',
        label: '宫殿庭院外楼梯',
        landings: [
          { floorId: 'level-0', position: [-14, -3.8] },
          { floorId: 'level-1', position: [-16.5, -4.5] },
        ],
      },
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: 'Level 0–1 访客电梯',
        landings: [
          { floorId: 'level-0', position: [10.5, 3.5] },
          { floorId: 'level-1', position: [10.5, 3.5] },
        ],
      },
    ],
  };
}

function santaMariaMarPlan(): StackedFloorPlan {
  const basilicaOutline: PlanPoint[] = [
    [-8, -14],
    [8, -14],
    [8, 8],
    [6, 12],
    [3, 14],
    [-3, 14],
    [-6, 12],
    [-8, 8],
    [-8, -14],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'church',
        label: '教堂主层',
        elevation: 0,
        stackOrder: 0,
        outline: basilicaOutline,
        spaces: [
          space('west-entry', '西立面与主入口', 0, -12.5, 6, 2, 'circulation'),
          space('central-nave', '中央中殿柱列视野', 0, -2, 7, 18, 'hall'),
          space(
            'side-aisles',
            '八角柱、侧廊与小堂边界',
            -5.5,
            -1,
            4,
            19,
            'chapel',
          ),
          space('apse', '主祭坛与后殿', 0, 10.5, 8, 5, 'chapel'),
          space(
            'rose-window-view',
            '玫瑰窗与幸存彩色玻璃视点',
            0,
            -9.5,
            6,
            3,
            'hall',
          ),
          space(
            'born-entry',
            'Born 侧入口与 Bastaixos 细部',
            6,
            -3.5,
            3,
            6,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'church',
        kind: 'gate',
        position: [0, -13.6],
        connects: ['west-entry'],
      },
      {
        floorId: 'church',
        kind: 'archway',
        position: [0, -11],
        connects: ['west-entry', 'central-nave'],
      },
      {
        floorId: 'church',
        kind: 'archway',
        position: [-3.8, -1],
        connects: ['central-nave', 'side-aisles'],
      },
      {
        floorId: 'church',
        kind: 'archway',
        position: [0, 8.2],
        connects: ['central-nave', 'apse'],
      },
      {
        floorId: 'church',
        kind: 'gate',
        position: [7.4, -3.5],
        connects: ['born-entry'],
      },
    ],
    routeStops: [
      { floorId: 'church', spaceId: 'west-entry', position: [0, -12.5] },
      { floorId: 'church', spaceId: 'central-nave', position: [0, -2] },
      { floorId: 'church', spaceId: 'side-aisles', position: [-5.5, -1] },
      { floorId: 'church', spaceId: 'apse', position: [0, 10.5] },
      { floorId: 'church', spaceId: 'rose-window-view', position: [0, -9.5] },
      { floorId: 'church', spaceId: 'born-entry', position: [6, -3.5] },
    ],
    sourceManifest: santaMariaMarSources,
    verticalLinks: [],
  };
}

function museumLudwigPlan(): StackedFloorPlan {
  const museumOutline: PlanPoint[] = [
    [-13, -9],
    [9, -9],
    [13, -5],
    [13, 9],
    [-13, 9],
    [-13, -9],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'basement',
        label: '地下层',
        elevation: -3,
        stackOrder: 0,
        outline: museumOutline,
        spaces: [
          space(
            'basement-arrival',
            '地下层电梯与楼梯平台',
            -9.5,
            -6,
            4,
            3,
            'circulation',
          ),
          space('contemporary', '当代艺术陈列', 0, 0, 20, 14, 'gallery'),
        ],
      },
      {
        id: 'foyer',
        label: '入口与中庭',
        elevation: 0,
        stackOrder: 1,
        outline: museumOutline,
        spaces: [
          space('entrance', '入口、票务与衣帽间', -7, -6, 9, 3.5, 'service'),
          space('atrium', '中庭与楼层图', 0, 0, 18, 12, 'hall'),
          space('lift-core', '电梯核心', -10, 5.5, 3, 3, 'circulation'),
        ],
      },
      {
        id: 'level-1',
        label: '第一层',
        elevation: 3,
        stackOrder: 2,
        outline: museumOutline,
        spaces: [
          space(
            'level-1-arrival',
            '第一层电梯平台',
            -10,
            5.5,
            3,
            3,
            'circulation',
          ),
          space(
            'pop-fluxus',
            '美国波普艺术、Fluxus 与观念艺术',
            0,
            0,
            20,
            14,
            'gallery',
          ),
        ],
      },
      {
        id: 'level-2',
        label: '第二层',
        elevation: 6,
        stackOrder: 3,
        outline: museumOutline,
        spaces: [
          space(
            'level-2-arrival',
            '第二层电梯平台',
            -10,
            5.5,
            3,
            3,
            'circulation',
          ),
          space(
            'haubrich-expressionism',
            'Haubrich 收藏与德国表现主义',
            -4.8,
            0,
            9,
            14,
            'gallery',
          ),
          space(
            'avant-garde-picasso',
            '俄罗斯先锋派、摄影与毕加索',
            5.2,
            0,
            9,
            14,
            'gallery',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'foyer',
        kind: 'gate',
        position: [-7, -8.2],
        connects: ['entrance'],
      },
      {
        floorId: 'foyer',
        kind: 'archway',
        position: [-4, -4.5],
        connects: ['entrance', 'atrium'],
      },
      {
        floorId: 'level-1',
        kind: 'archway',
        position: [-8.2, 5.5],
        connects: ['level-1-arrival', 'pop-fluxus'],
      },
      {
        floorId: 'level-2',
        kind: 'archway',
        position: [-8.2, 5.5],
        connects: ['level-2-arrival', 'haubrich-expressionism'],
      },
      {
        floorId: 'level-2',
        kind: 'archway',
        position: [0, 0],
        connects: ['haubrich-expressionism', 'avant-garde-picasso'],
      },
      {
        floorId: 'basement',
        kind: 'archway',
        position: [-7.2, -6],
        connects: ['basement-arrival', 'contemporary'],
      },
    ],
    routeStops: [
      { floorId: 'foyer', spaceId: 'atrium', position: [0, 0] },
      {
        floorId: 'level-2',
        spaceId: 'haubrich-expressionism',
        position: [-4.8, 0],
      },
      {
        floorId: 'level-2',
        spaceId: 'avant-garde-picasso',
        position: [5.2, 0],
      },
      { floorId: 'level-1', spaceId: 'pop-fluxus', position: [0, 0] },
      { floorId: 'basement', spaceId: 'contemporary', position: [0, 0] },
    ],
    sourceManifest: museumLudwigSources,
    verticalLinks: [
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: '全展览楼层访客电梯',
        landings: [
          { floorId: 'basement', position: [-9.5, -6] },
          { floorId: 'foyer', position: [-10, 5.5] },
          { floorId: 'level-1', position: [-10, 5.5] },
          { floorId: 'level-2', position: [-10, 5.5] },
        ],
      },
      {
        id: 'forum-stair',
        kind: 'stairs',
        label: 'Forum 纪念性楼梯',
        landings: [
          { floorId: 'foyer', position: [8, 5] },
          { floorId: 'level-1', position: [8, 5] },
        ],
      },
    ],
  };
}

function kolnTrianglePlan(): StackedFloorPlan {
  const triangleOutline: PlanPoint[] = [
    [0, -10],
    [7, -7],
    [11, -1],
    [10, 5],
    [5, 9],
    [0, 10],
    [-5, 9],
    [-10, 5],
    [-11, -1],
    [-7, -7],
    [0, -10],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: 'Ottoplatz 大堂',
        elevation: 0,
        stackOrder: 0,
        outline: triangleOutline,
        spaces: [
          space(
            'entrance-lobby',
            'Ottoplatz 1 入口与售票大堂',
            0,
            -4.5,
            11,
            6,
            'hall',
          ),
          space('ground-lift-bank', '访客电梯组', 0, 2.5, 7, 5, 'circulation'),
        ],
      },
      {
        id: 'level-28',
        label: '28 层电梯到达层',
        elevation: 4,
        stackOrder: 1,
        outline: triangleOutline,
        spaces: [
          space('lift-arrival', '28 层电梯到达处', 0, 1, 7, 5, 'circulation'),
          space(
            'final-stair',
            '通往 29 层的末段楼梯',
            0,
            -4.5,
            6,
            4,
            'circulation',
          ),
        ],
      },
      {
        id: 'level-29',
        label: '29 层屋顶观景台',
        elevation: 7,
        stackOrder: 2,
        outline: triangleOutline,
        spaces: [
          space(
            'platform-arrival',
            '观景台楼梯到达处',
            0,
            -4.5,
            6,
            4,
            'circulation',
          ),
          space('west-view', '西向：大教堂、桥与老城', -5, 1, 7, 10, 'outdoor'),
          space(
            'south-view',
            '南向：莱茵河与 Rheinauhafen',
            0,
            -5.5,
            5,
            4,
            'outdoor',
          ),
          space(
            'north-east-view',
            '北向与东向城市远景',
            6.5,
            2,
            3,
            7,
            'outdoor',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [0, -8.8],
        connects: ['entrance-lobby'],
      },
      {
        floorId: 'ground',
        kind: 'door',
        position: [0, -1.2],
        connects: ['entrance-lobby', 'ground-lift-bank'],
      },
      {
        floorId: 'level-28',
        kind: 'door',
        position: [0, -1.2],
        connects: ['lift-arrival', 'final-stair'],
      },
      {
        floorId: 'level-29',
        kind: 'gate',
        position: [0, -2.8],
        connects: ['platform-arrival', 'south-view'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'entrance-lobby', position: [0, -4.5] },
      { floorId: 'level-28', spaceId: 'lift-arrival', position: [0, 1] },
      { floorId: 'level-29', spaceId: 'west-view', position: [-5, 1] },
      { floorId: 'level-29', spaceId: 'south-view', position: [0, -5.5] },
      { floorId: 'level-29', spaceId: 'north-east-view', position: [6.5, 2] },
    ],
    sourceManifest: kolnTriangleSources,
    verticalLinks: [
      {
        id: 'panorama-lift',
        kind: 'lift',
        label: '大堂至 28 层高速电梯',
        landings: [
          { floorId: 'ground', position: [0, 2.5] },
          { floorId: 'level-28', position: [0, 1] },
        ],
      },
      {
        id: 'roof-stair',
        kind: 'stairs',
        label: '28 层至 29 层末段楼梯',
        landings: [
          { floorId: 'level-28', position: [0, -4.5] },
          { floorId: 'level-29', position: [0, -4.5] },
        ],
      },
    ],
  };
}

function notreDameTowersPlan(): StackedFloorPlan {
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'reception',
        label: '南塔入口与接待层',
        elevation: 0,
        stackOrder: 0,
        outline: rect(0, 0, 18, 10),
        spaces: [
          space(
            'south-entry',
            '面对教堂右侧入口',
            5,
            -2.5,
            6,
            4,
            'circulation',
          ),
          space('reception-hall', '下层接待厅', 4.5, 2, 7, 4, 'hall'),
          space('north-exit', '北塔出口', -5, -2.5, 6, 4, 'circulation'),
        ],
      },
      {
        id: 'four-leaf',
        label: '四叶厅',
        elevation: 3,
        stackOrder: 1,
        outline: rect(4.5, 0, 8, 8),
        spaces: [
          space(
            'four-leaf-hall',
            '模型、声景与原奇美拉',
            4.5,
            0,
            6,
            6,
            'gallery',
          ),
        ],
      },
      {
        id: 'belfries',
        label: '南北塔钟楼层',
        elevation: 6,
        stackOrder: 2,
        outline: rect(0, 0, 18, 9),
        spaces: [
          space('south-belfry', '南塔钟楼木构', 5, 0, 6, 7, 'hall'),
          space('belfry-crossing', '塔间转换通道', 0, 0, 3.5, 4, 'circulation'),
          space('north-belfry', '北塔钟架与声景下降起点', -5, 0, 6, 7, 'hall'),
        ],
      },
      {
        id: 'chimera-gallery',
        label: '奇美拉长廊层',
        elevation: 9,
        stackOrder: 3,
        outline: rect(0, 0, 18, 7),
        spaces: [
          space('chimera-walk', '奇美拉长廊', 0, 0, 16, 3, 'outdoor'),
          space(
            'south-terrace-stair',
            '南塔眺望台楼梯',
            5,
            2.2,
            4,
            2,
            'circulation',
          ),
        ],
      },
      {
        id: 'upper-route',
        label: '南塔眺望台与屋顶路线',
        elevation: 12,
        stackOrder: 4,
        outline: rect(0, 0, 18, 10),
        spaces: [
          space('south-terrace', '南塔 69 米眺望台', 5, -2.5, 6, 4, 'outdoor'),
          space(
            'bells-cistern-roof',
            '大钟、蓄水池庭院与屋顶森林视角',
            0,
            2,
            14,
            4,
            'outdoor',
          ),
          space(
            'north-descent',
            '通往北塔钟楼的下降楼梯',
            -5,
            -2.5,
            5,
            3,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'reception',
        kind: 'gate',
        position: [5, -4.5],
        connects: ['south-entry'],
      },
      {
        floorId: 'reception',
        kind: 'door',
        position: [4.5, -0.5],
        connects: ['south-entry', 'reception-hall'],
      },
      {
        floorId: 'belfries',
        kind: 'archway',
        position: [2.5, 0],
        connects: ['south-belfry', 'belfry-crossing'],
      },
      {
        floorId: 'belfries',
        kind: 'archway',
        position: [-2.5, 0],
        connects: ['belfry-crossing', 'north-belfry'],
      },
      {
        floorId: 'chimera-gallery',
        kind: 'archway',
        position: [4, 1.2],
        connects: ['chimera-walk', 'south-terrace-stair'],
      },
      {
        floorId: 'upper-route',
        kind: 'gate',
        position: [3, -1],
        connects: ['south-terrace', 'bells-cistern-roof'],
      },
      {
        floorId: 'upper-route',
        kind: 'gate',
        position: [-3, -1],
        connects: ['bells-cistern-roof', 'north-descent'],
      },
    ],
    routeStops: [
      { floorId: 'reception', spaceId: 'reception-hall', position: [4.5, 2] },
      { floorId: 'four-leaf', spaceId: 'four-leaf-hall', position: [4.5, 0] },
      { floorId: 'belfries', spaceId: 'south-belfry', position: [5, 0] },
      { floorId: 'chimera-gallery', spaceId: 'chimera-walk', position: [0, 0] },
      {
        floorId: 'upper-route',
        spaceId: 'bells-cistern-roof',
        position: [0, 2],
      },
      { floorId: 'belfries', spaceId: 'north-belfry', position: [-5, 0] },
    ],
    sourceManifest: notreDameTowersSources,
    verticalLinks: [
      {
        id: 'north-descent-stair',
        kind: 'stairs',
        label: '屋顶至北塔钟楼下降楼梯',
        landings: [
          { floorId: 'upper-route', position: [-5, -2.5] },
          { floorId: 'belfries', position: [-5, 0] },
        ],
      },
      {
        id: 'south-oak-stair',
        kind: 'stairs',
        label: '南塔双向橡木楼梯',
        landings: [
          { floorId: 'reception', position: [4.5, 2] },
          { floorId: 'four-leaf', position: [4.5, 0] },
          { floorId: 'belfries', position: [5, 0] },
        ],
      },
      {
        id: 'south-upper-stair',
        kind: 'stairs',
        label: '南塔钟楼、奇美拉长廊与眺望台楼梯',
        landings: [
          { floorId: 'belfries', position: [5, 0] },
          { floorId: 'chimera-gallery', position: [5, 2.2] },
          { floorId: 'upper-route', position: [5, -2.5] },
        ],
      },
    ],
  };
}

export const barcelonaCologneParisFloorPlans: Record<string, StackedFloorPlan> =
  {
    'barcelona-cathedral': barcelonaCathedralPlan(),
    'koln-triangle': kolnTrianglePlan(),
    'la-pedrera': laPedreraPlan(),
    'museum-ludwig': museumLudwigPlan(),
    'notre-dame-towers': notreDameTowersPlan(),
    'palau-musica': palauMusicaPlan(),
    'picasso-barcelona': picassoBarcelonaPlan(),
    'santa-maria-mar': santaMariaMarPlan(),
  };

export const barcelonaCologneParisInventory: Record<
  string,
  FloorPlanInventoryEntry
> = {
  'barcelona-cathedral': {
    status: 'ready',
    note: '地下墓室、主教座堂与回廊、屋顶三层结构及已公开的屋顶电梯位置均有官方资料支持。',
    sources: barcelonaCathedralSources,
  },
  'chocolate-museum': {
    status: 'source-limited',
    note: '官网确认四个公共楼层、双层生产区与无障碍电梯，但未公布展区逐层分配和可核验平面拓扑，因此不生成室内图。',
    sources: chocolateMuseumSources,
  },
  'el-born': {
    status: 'source-limited',
    note: '现有官方资料可支持市场外壳和考古遗址位置，但不支持当前访客阳台、楼梯与电梯的完整连接关系，因此保持街区外部模型。',
    sources: elBornSources,
  },
  'gaudi-house': {
    status: 'source-limited',
    note: '官网确认三层住宅、地下室、尖塔和主要展陈主题，但未公布当前开放房间的逐层分配与访客连接路线，因此不推断内部布局。',
    sources: gaudiHouseSources,
  },
  'koln-triangle': {
    status: 'ready',
    note: '仅建模访客实际经过的大堂、28 层电梯到达层和 29 层屋顶平台，不生成中间办公楼层。',
    sources: kolnTriangleSources,
  },
  'la-pedrera': {
    status: 'ready',
    note: '按官方 Sunrise 参观空间建模底层双庭院、四层住宅公寓、鲸腹阁楼和武士屋顶。',
    sources: laPedreraSources,
  },
  'museum-ludwig': {
    status: 'ready',
    note: '按官网当前收藏楼层分配建模入口中庭、第一层、第二层和地下层；不把轮换作品固定到房间。',
    sources: museumLudwigSources,
  },
  'notre-dame-towers': {
    status: 'ready',
    note: '按 2025 年启用的官方单向路线建模南塔上行、奇美拉长廊、屋顶段和北塔下降。',
    sources: notreDameTowersSources,
  },
  'palau-musica': {
    status: 'ready',
    note: '按官方音乐厅座席平面与自助参观路线建模门厅、主层和上层座席。',
    sources: palauMusicaSources,
  },
  'picasso-barcelona': {
    status: 'ready',
    note: '按官方 Level 0/Level 1 地图建模五座宫殿庭院及展厅 1–16 的主题段落。',
    sources: picassoBarcelonaSources,
  },
  'santa-maria-mar': {
    status: 'ready',
    note: '当前行程只进入教堂主层，因此仅建模官方资料充分的中殿、侧廊小堂、后殿与两个入口。',
    sources: santaMariaMarSources,
  },
};
