import {
  rect,
  space,
  type FloorPlanInventoryEntry,
  type FloorPlanSource,
  type PlanPoint,
  type StackedFloorPlan,
} from './core';

const verifiedAt = '2026-09-03';

const milanDuomoSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'Duomo di Milano official visitor leaflet',
    url: 'https://www.duomomilano.it/wp-content/uploads/2025/03/Volantino-eng_202504.pdf',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces', 'levels', 'route'],
    title: 'Duomo di Milano official terraces guide',
    url: 'https://www.duomomilano.it/en/art-and-culture/the-terraces/',
    verifiedAt,
  },
];

const laScalaSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels'],
    title: 'Teatro alla Scala official seating plans',
    url: 'https://www.teatroallascala.org/it/stagione/biglietteria/biglietti/prezzi-e-piante-posti.html',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces', 'levels', 'route'],
    title: 'Museo Teatrale alla Scala official museum map',
    url: 'https://www.museoscala.org/static/upload/map/mappa-del-museo-teatrale-1.pdf',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['route'],
    title: 'Teatro alla Scala official audience access guide',
    url: 'https://www.teatroallascala.org/en/visit/information/during-the-performance.html',
    verifiedAt,
  },
];

const lastSupperSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'route'],
    title: 'Museo del Cenacolo Vinciano official museum route plan',
    url: 'https://cenacolovinciano.org/wp-content/uploads/2019/12/Map-Cenacolo-Vinciano.pdf',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces', 'route'],
    title: 'Museo del Cenacolo Vinciano official visitor information',
    url: 'https://cenacolovinciano.org/en/info/',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces'],
    title: 'Museo del Cenacolo Vinciano official Last Supper guide',
    url: 'https://cenacolovinciano.org/en/museum/the-works/the-last-supper-leonardo-da-vinci-1452-1519/',
    verifiedAt,
  },
];

const santaMariaGrazieSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'route'],
    title:
      'Museo del Cenacolo Vinciano official Santa Maria delle Grazie architectural guide',
    url: 'https://cenacolovinciano.org/en/story/saint-maria-delle-grazie/',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['route'],
    title: 'Santa Maria delle Grazie official visitor hours',
    url: 'https://legraziemilano.it/orari/',
    verifiedAt,
  },
];

const breraSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'Pinacoteca di Brera official interactive visitor map',
    url: 'https://pinacotecabrera.org/wp-content/uploads/2024/11/Pinacoteca-Brera-Mappa-interattiva-2023.pdf',
    verifiedAt,
  },
];

const stMarkCampanileSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'Basilica di San Marco official bell tower ticket guide',
    url: 'https://tickets.basilicasanmarco.it/en/product/tickets/bell-tower/2524/9691',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces', 'levels'],
    title: 'Basilica di San Marco official bell tower history',
    url: 'https://www.basilicasanmarco.it/en/bell-tower/',
    verifiedAt,
  },
];

const correrSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'Museo Correr official 2025 visitor route map',
    url: 'https://correr.visitmuve.it/wp-content/uploads/sites/3/2026/01/MAPPA-PERCORSI-DI-VISITA-MUSEO-CORRER-2025.pdf',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces', 'levels'],
    title: 'Museo Correr official layout and collections guide',
    url: 'https://correr.visitmuve.it/en/layout-and-collections/',
    verifiedAt,
  },
];

const stMarkBasilicaSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title:
      'Basilica di San Marco official basilica, Pala d’Oro, museum and loggia route',
    url: 'https://tickets.basilicasanmarco.it/en/product/tickets/basilica-s-marco-pala-d-oro-museum-loggia-cavalli/2524/9690',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels'],
    title: 'Basilica di San Marco official visitor guide',
    url: 'https://www.basilicasanmarco.it/en/',
    verifiedAt,
  },
];

const accademiaVeniceSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'levels', 'route'],
    title: 'Gallerie dell’Accademia official museum map',
    url: 'https://www.gallerieaccademia.it/themes/custom/accademia/images/Map_gallerie.pdf',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces', 'route'],
    title: 'Gallerie dell’Accademia official visitor routes',
    url: 'https://www.gallerieaccademia.it/vivi-museo/percorsi-di-visita/',
    verifiedAt,
  },
];

const galleriaVittorioSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['spaces', 'route'],
    title: 'YesMilano official city map and visitor guide',
    url: 'https://www.yesmilano.it/system/files/allegati/paragrafi/35200/Mappa_YMCVB_04.2025.pdf',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces'],
    title: 'YesMilano official Galleria Vittorio Emanuele II guide',
    url: 'https://www.yesmilano.it/en/see-and-do/venues/galleria-vittorio-emanuele-ii',
    verifiedAt,
  },
];

const sforzaSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['footprint', 'spaces', 'route'],
    title: 'Castello Sforzesco official castle map and museum itinerary',
    url: 'https://www.milanocastello.it/documents/461595483/477971915/mappa-castello%2Be%2B%2Bitinerario_def%2BLL%2B14.01.25.pdf/b3319db7-1c76-758b-f6a8-8e2453136a9e?t=1754403241406',
    verifiedAt,
  },
];

const feniceSources: FloorPlanSource[] = [
  {
    authority: 'official',
    scope: ['spaces', 'levels'],
    title: 'Teatro La Fenice official app and visitor guide',
    url: 'https://www.teatrolafenice.it/en/la-fenice-app/',
    verifiedAt,
  },
  {
    authority: 'official',
    scope: ['spaces', 'route'],
    title: 'Teatro La Fenice official visit preparation guide',
    url: 'https://www.teatrolafenice.it/en/prepare-your-visit/',
    verifiedAt,
  },
];

function milanDuomoPlan(): StackedFloorPlan {
  const cathedralOutline: PlanPoint[] = [
    [-4.8, 7.5],
    [4.8, 7.5],
    [4.8, 1.2],
    [6.2, 1.2],
    [6.2, -2.2],
    [4.2, -2.2],
    [4.2, -7.2],
    [-4.2, -7.2],
    [-4.2, -2.2],
    [-6.2, -2.2],
    [-6.2, 1.2],
    [-4.8, 1.2],
    [-4.8, 7.5],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'cathedral',
        label: '教堂层：西立面、中殿与后殿',
        elevation: 0,
        stackOrder: 0,
        outline: cathedralOutline,
        spaces: [
          space(
            'west-front',
            '西立面与广场到达区',
            0,
            6.6,
            8.6,
            1.4,
            'outdoor',
          ),
          space('nave', '中殿柱列与侧廊', 0, 2.6, 8.4, 6.2, 'hall'),
          space(
            'choir',
            '后唱诗席与圣巴多罗买雕像',
            0,
            -2.3,
            5.8,
            2.8,
            'chapel',
          ),
          space('apse', '后殿与彩窗', 0, -5.6, 5.8, 2.4, 'chapel'),
          space(
            'terrace-lift-entry',
            '露台电梯入口',
            4.9,
            0,
            1.8,
            1.8,
            'circulation',
          ),
        ],
      },
      {
        id: 'lower-terrace',
        label: '约31米：首层露台',
        elevation: 3.4,
        stackOrder: 1,
        outline: rect(0, 0, 9.6, 13.4),
        spaces: [
          space(
            'lift-landing',
            '露台电梯平台',
            3.7,
            4.8,
            1.5,
            1.8,
            'circulation',
          ),
          space(
            'lower-walkway',
            '飞扶壁与首层露台步道',
            0,
            0,
            7.2,
            10.4,
            'outdoor',
          ),
          space(
            'upper-stair-foot',
            '中央露台上行楼梯',
            0,
            -5.3,
            2.2,
            1.5,
            'circulation',
          ),
        ],
      },
      {
        id: 'central-terrace',
        label: '约45米：中央露台与大尖塔',
        elevation: 6.8,
        stackOrder: 2,
        outline: rect(0, -0.7, 6.6, 8.6),
        spaces: [
          space(
            'upper-stair-head',
            '中央露台楼梯口',
            0,
            2.7,
            2,
            1.4,
            'circulation',
          ),
          space(
            'central-platform',
            '中央露台与大尖塔视点',
            0,
            -0.8,
            5.2,
            5,
            'outdoor',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'cathedral',
        kind: 'gate',
        position: [0, 7.3],
        connects: ['west-front'],
      },
      {
        floorId: 'cathedral',
        kind: 'archway',
        position: [0, 5.5],
        connects: ['west-front', 'nave'],
      },
      {
        floorId: 'cathedral',
        kind: 'archway',
        position: [0, -0.6],
        connects: ['nave', 'choir'],
      },
      {
        floorId: 'cathedral',
        kind: 'archway',
        position: [0, -3.7],
        connects: ['choir', 'apse'],
      },
    ],
    routeStops: [
      { floorId: 'cathedral', spaceId: 'west-front', position: [0, 6.6] },
      { floorId: 'cathedral', spaceId: 'nave', position: [0, 2.6] },
      { floorId: 'cathedral', spaceId: 'choir', position: [0, -2.3] },
      { floorId: 'cathedral', spaceId: 'apse', position: [0, -5.6] },
      { floorId: 'lower-terrace', spaceId: 'lower-walkway', position: [0, 0] },
      {
        floorId: 'central-terrace',
        spaceId: 'central-platform',
        position: [0, -0.8],
      },
    ],
    sourceManifest: milanDuomoSources,
    verticalLinks: [
      {
        id: 'terrace-lift',
        kind: 'lift',
        label: '露台电梯至首层露台',
        landings: [
          { floorId: 'cathedral', position: [4.9, 0] },
          { floorId: 'lower-terrace', position: [3.7, 4.8] },
        ],
      },
      {
        id: 'central-terrace-stair',
        kind: 'stairs',
        label: '首层露台至中央露台楼梯',
        landings: [
          { floorId: 'lower-terrace', position: [0, -5.3] },
          { floorId: 'central-terrace', position: [0, 2.7] },
        ],
      },
    ],
  };
}

function laScalaPlan(): StackedFloorPlan {
  const theaterOutline = rect(0, 0, 14, 12);

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '地面层：两侧入口、门厅、池座与舞台',
        elevation: 0,
        stackOrder: 0,
        outline: theaterOutline,
        spaces: [
          space(
            'museum-entry',
            'Largo Ghiringhelli博物馆入口',
            -4.8,
            4.9,
            3,
            1.2,
            'circulation',
          ),
          space(
            'evening-entry',
            '斯卡拉广场晚间观众入口',
            4.2,
            4.9,
            4.4,
            1.2,
            'circulation',
          ),
          space('foyer', '观众门厅与楼层交通', 2.4, 2.8, 6.2, 2.2, 'hall'),
          space('stalls', '马蹄形池座与乐团位置', 0, -0.2, 8.4, 4.5, 'hall'),
          space('stage', '镜框舞台', 0, -4.3, 7, 2.5, 'hall'),
        ],
      },
      {
        id: 'museum',
        label: '博物馆层：主题展室与档案材料',
        elevation: 2.8,
        stackOrder: 1,
        outline: theaterOutline,
        spaces: [
          space(
            'rooms-1-4',
            '第一、第三和第四主题展室',
            -2.5,
            1.9,
            7.2,
            4.2,
            'gallery',
          ),
          space(
            'room-9',
            '第九室档案及图书馆材料',
            3.6,
            1.9,
            3.6,
            4.2,
            'gallery',
          ),
          space(
            'museum-corridor',
            '博物馆走廊',
            0,
            -2.1,
            10.5,
            1.8,
            'circulation',
          ),
          space('box-access', '历史包厢通道', 4.8, -4, 2.2, 1.8, 'circulation'),
        ],
      },
      {
        id: 'box-tier',
        label: '包厢层：历史包厢与观众厅视角',
        elevation: 5.6,
        stackOrder: 2,
        outline: theaterOutline,
        spaces: [
          space(
            'historic-box',
            '博物馆历史包厢视角',
            4.6,
            -0.5,
            2.2,
            3.4,
            'hall',
          ),
          space('box-ring', '马蹄形包厢环带', 0, 0, 9.2, 6.8, 'hall'),
          space('box-stair', '包厢层楼梯厅', 4.8, 4.2, 2.2, 2, 'circulation'),
        ],
      },
      {
        id: 'first-gallery',
        label: '第一楼座层',
        elevation: 8.4,
        stackOrder: 3,
        outline: theaterOutline,
        spaces: [
          space('gallery-one', '第一楼座与上层视线区', 0, 0, 9.4, 7, 'hall'),
          space(
            'gallery-one-stair',
            '第一楼座楼梯厅',
            4.8,
            4.2,
            2.2,
            2,
            'circulation',
          ),
        ],
      },
      {
        id: 'second-gallery',
        label: '第二楼座及顶层票区',
        elevation: 11.2,
        stackOrder: 4,
        outline: theaterOutline,
        spaces: [
          space('ticketed-zone', '票面楼层座席或站位区', 0, 0, 9.4, 7, 'hall'),
          space(
            'gallery-two-stair',
            '第二楼座楼梯厅',
            4.8,
            4.2,
            2.2,
            2,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [-4.8, 5.5],
        connects: ['museum-entry'],
      },
      {
        floorId: 'ground',
        kind: 'gate',
        position: [4.2, 5.5],
        connects: ['evening-entry'],
      },
      {
        floorId: 'ground',
        kind: 'archway',
        position: [2.4, 1.7],
        connects: ['foyer', 'stalls'],
      },
      {
        floorId: 'ground',
        kind: 'archway',
        position: [0, -2.4],
        connects: ['stalls', 'stage'],
      },
      {
        floorId: 'museum',
        kind: 'door',
        position: [1.1, 1.9],
        connects: ['rooms-1-4', 'room-9'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'museum-entry', position: [-4.8, 4.9] },
      { floorId: 'museum', spaceId: 'rooms-1-4', position: [-2.5, 1.9] },
      { floorId: 'museum', spaceId: 'room-9', position: [3.6, 1.9] },
      { floorId: 'box-tier', spaceId: 'historic-box', position: [4.6, -0.5] },
      { floorId: 'ground', spaceId: 'evening-entry', position: [4.2, 4.9] },
      { floorId: 'ground', spaceId: 'foyer', position: [2.4, 2.8] },
      { floorId: 'ground', spaceId: 'stalls', position: [0, -0.2] },
      { floorId: 'second-gallery', spaceId: 'ticketed-zone', position: [0, 0] },
    ],
    sourceManifest: laScalaSources,
    verticalLinks: [
      {
        id: 'museum-stair',
        kind: 'stairs',
        label: '博物馆入口楼梯',
        landings: [
          { floorId: 'ground', position: [-4.8, 3.9] },
          { floorId: 'museum', position: [-4.8, 3.9] },
        ],
      },
      {
        id: 'historic-box-passage',
        kind: 'stairs',
        label: '博物馆至历史包厢通道',
        landings: [
          { floorId: 'museum', position: [4.8, -4] },
          { floorId: 'box-tier', position: [4.6, -2.2] },
        ],
      },
      {
        id: 'audience-stairs',
        kind: 'stairs',
        label: '观众公共楼梯',
        landings: [
          { floorId: 'ground', position: [4.8, 4.2] },
          { floorId: 'box-tier', position: [4.8, 4.2] },
          { floorId: 'first-gallery', position: [4.8, 4.2] },
          { floorId: 'second-gallery', position: [4.8, 4.2] },
        ],
      },
      {
        id: 'gallery-lift',
        kind: 'lift',
        label: '楼座电梯（不通包厢）',
        landings: [
          { floorId: 'ground', position: [-4.8, 4.2] },
          { floorId: 'first-gallery', position: [-4.8, 4.2] },
          { floorId: 'second-gallery', position: [-4.8, 4.2] },
        ],
      },
    ],
  };
}

function lastSupperPlan(): StackedFloorPlan {
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '地面层：核验、恒温闸室与旧食堂',
        elevation: 0,
        stackOrder: 0,
        outline: rect(0, 0, 18, 7),
        spaces: [
          space('ticket-check', '票务与身份核验处', -7.6, 0, 2, 4.8, 'service'),
          space('lockers', '强制寄存柜', -5.5, 0, 1.6, 4.8, 'service'),
          space(
            'airlock-one',
            '第一空气调节闸室',
            -3.7,
            0,
            1.4,
            3,
            'circulation',
          ),
          space(
            'airlock-two',
            '第二空气调节闸室',
            -2.1,
            0,
            1.4,
            3,
            'circulation',
          ),
          space('refectory', '旧修道院食堂', 2.4, 0, 7, 5.4, 'hall'),
          space(
            'exit-court',
            '出口及庭院过渡区',
            7.3,
            0,
            2.4,
            4.8,
            'courtyard',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'door',
        position: [-6.5, 0],
        connects: ['ticket-check', 'lockers'],
      },
      {
        floorId: 'ground',
        kind: 'door',
        position: [-4.6, 0],
        connects: ['lockers', 'airlock-one'],
      },
      {
        floorId: 'ground',
        kind: 'door',
        position: [-2.9, 0],
        connects: ['airlock-one', 'airlock-two'],
      },
      {
        floorId: 'ground',
        kind: 'door',
        position: [-1.3, 0],
        connects: ['airlock-two', 'refectory'],
      },
      {
        floorId: 'ground',
        kind: 'door',
        position: [6.2, 0],
        connects: ['refectory', 'exit-court'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'ticket-check', position: [-7.6, 0] },
      { floorId: 'ground', spaceId: 'lockers', position: [-5.5, 0] },
      { floorId: 'ground', spaceId: 'airlock-two', position: [-2.1, 0] },
      { floorId: 'ground', spaceId: 'refectory', position: [2.4, -1.5] },
      { floorId: 'ground', spaceId: 'refectory', position: [2.4, 1.5] },
      { floorId: 'ground', spaceId: 'exit-court', position: [7.3, 0] },
    ],
    sourceManifest: lastSupperSources,
    verticalLinks: [],
  };
}

function santaMariaGraziePlan(): StackedFloorPlan {
  const churchOutline: PlanPoint[] = [
    [-4.5, 8],
    [4.5, 8],
    [4.5, 2],
    [7, 2],
    [7, -3],
    [4.5, -3],
    [4.5, -8],
    [-4.5, -8],
    [-4.5, -3],
    [-7, -3],
    [-7, 2],
    [-4.5, 2],
    [-4.5, 8],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'church',
        label: '教堂层：三廊长堂、礼拜堂与布拉曼特东部',
        elevation: 0,
        stackOrder: 0,
        outline: churchOutline,
        spaces: [
          space(
            'west-entry',
            '西立面与广场入口',
            0,
            7.1,
            7.5,
            1.4,
            'circulation',
          ),
          space('nave', '索拉里三廊中殿', 0, 3.5, 7.5, 5, 'hall'),
          space('side-chapels', '两侧礼拜堂', 0, 0.8, 12, 2.2, 'chapel'),
          space('crossing', '交叉部与布拉曼特圆顶', 0, -2.2, 8, 3.2, 'hall'),
          space('choir-apse', '唱诗席及后殿', 0, -6, 7.5, 3, 'chapel'),
          space(
            'cloister-view',
            '开放时可见的回廊视角',
            5.6,
            -0.2,
            2,
            2.6,
            'courtyard',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'church',
        kind: 'gate',
        position: [0, 7.8],
        connects: ['west-entry'],
      },
      {
        floorId: 'church',
        kind: 'archway',
        position: [0, 6.4],
        connects: ['west-entry', 'nave'],
      },
      {
        floorId: 'church',
        kind: 'archway',
        position: [0, 1.6],
        connects: ['nave', 'side-chapels'],
      },
      {
        floorId: 'church',
        kind: 'archway',
        position: [0, -0.6],
        connects: ['side-chapels', 'crossing'],
      },
      {
        floorId: 'church',
        kind: 'archway',
        position: [0, -3.8],
        connects: ['crossing', 'choir-apse'],
      },
      {
        floorId: 'church',
        kind: 'door',
        position: [4.5, -0.2],
        connects: ['crossing', 'cloister-view'],
      },
    ],
    routeStops: [
      { floorId: 'church', spaceId: 'west-entry', position: [0, 7.1] },
      { floorId: 'church', spaceId: 'nave', position: [0, 3.5] },
      { floorId: 'church', spaceId: 'side-chapels', position: [3.8, 0.8] },
      { floorId: 'church', spaceId: 'crossing', position: [0, -2.2] },
      { floorId: 'church', spaceId: 'choir-apse', position: [0, -6] },
      { floorId: 'church', spaceId: 'cloister-view', position: [5.6, -0.2] },
    ],
    sourceManifest: santaMariaGrazieSources,
    verticalLinks: [],
  };
}

function breraPlan(): StackedFloorPlan {
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '地面层：拿破仑庭院与上楼入口',
        elevation: 0,
        stackOrder: 0,
        outline: rect(0, 0, 12, 9),
        spaces: [
          space('courtyard', '布雷拉宫拿破仑庭院', 0, 0, 7.4, 5.8, 'courtyard'),
          space(
            'main-stair-foot',
            '首层检票方向与大阶梯入口',
            4.7,
            -2.6,
            1.8,
            2.2,
            'circulation',
          ),
          space(
            'lift-foot',
            '访客电梯入口',
            -4.7,
            -2.6,
            1.8,
            2.2,
            'circulation',
          ),
        ],
      },
      {
        id: 'piano-nobile',
        label: '首层：连续画廊与第VI、XXIV、XXVIII室',
        elevation: 3.2,
        stackOrder: 1,
        outline: rect(0, 0, 14, 11),
        spaces: [
          space(
            'ticket-start',
            '首层检票与开端展室',
            -5.5,
            3.9,
            2.2,
            2.2,
            'circulation',
          ),
          space('room-vi', '第VI室：曼特尼亚', -2.8, 3.9, 2.5, 2.2, 'gallery'),
          space(
            'lombard-venetian',
            '中段伦巴第及威尼斯绘画展室',
            1.2,
            2.2,
            5,
            5.6,
            'gallery',
          ),
          space('room-xxiv', '第XXIV室：拉斐尔', 4.8, 1.3, 2.4, 2.5, 'gallery'),
          space(
            'room-xxviii',
            '第XXVIII室：卡拉瓦乔',
            4.8,
            -2.1,
            2.4,
            2.5,
            'gallery',
          ),
          space(
            'return-gallery',
            '回程画廊与出口方向',
            -1.5,
            -3.8,
            8.8,
            2.1,
            'circulation',
          ),
          space(
            'main-stair-head',
            '拿破仑庭院大阶梯上层',
            -5.5,
            -3.8,
            2.2,
            2.1,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [0, 3],
        connects: ['courtyard'],
      },
      {
        floorId: 'piano-nobile',
        kind: 'archway',
        position: [-4.2, 3.9],
        connects: ['ticket-start', 'room-vi'],
      },
      {
        floorId: 'piano-nobile',
        kind: 'archway',
        position: [-1.5, 3.3],
        connects: ['room-vi', 'lombard-venetian'],
      },
      {
        floorId: 'piano-nobile',
        kind: 'door',
        position: [3.7, 1.3],
        connects: ['lombard-venetian', 'room-xxiv'],
      },
      {
        floorId: 'piano-nobile',
        kind: 'door',
        position: [4.8, -0.4],
        connects: ['room-xxiv', 'room-xxviii'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'courtyard', position: [0, 0] },
      {
        floorId: 'piano-nobile',
        spaceId: 'ticket-start',
        position: [-5.5, 3.9],
      },
      { floorId: 'piano-nobile', spaceId: 'room-vi', position: [-2.8, 3.9] },
      {
        floorId: 'piano-nobile',
        spaceId: 'lombard-venetian',
        position: [1.2, 2.2],
      },
      { floorId: 'piano-nobile', spaceId: 'room-xxiv', position: [4.8, 1.3] },
      {
        floorId: 'piano-nobile',
        spaceId: 'room-xxviii',
        position: [4.8, -2.1],
      },
    ],
    sourceManifest: breraSources,
    verticalLinks: [
      {
        id: 'napoleon-stair',
        kind: 'stairs',
        label: '拿破仑庭院大阶梯',
        landings: [
          { floorId: 'ground', position: [4.7, -2.6] },
          { floorId: 'piano-nobile', position: [-5.5, -3.8] },
        ],
      },
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: '访客电梯',
        landings: [
          { floorId: 'ground', position: [-4.7, -2.6] },
          { floorId: 'piano-nobile', position: [-5.5, 3] },
        ],
      },
    ],
  };
}

function stMarkCampanilePlan(): StackedFloorPlan {
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'base',
        label: '塔基：桑索维诺小凉廊与电梯入口',
        elevation: 0,
        stackOrder: 0,
        outline: rect(0, 0, 6, 6),
        spaces: [
          space('loggetta', '桑索维诺小凉廊与塔基', 0, 1.6, 4.8, 1.8, 'hall'),
          space(
            'ticket-lift',
            '票务入口及电梯',
            0,
            -1.2,
            3.6,
            2.4,
            'circulation',
          ),
        ],
      },
      {
        id: 'belfry',
        label: '约60米：钟室观景层',
        elevation: 4.2,
        stackOrder: 1,
        outline: rect(0, 0, 6, 6),
        spaces: [
          space('lift-landing', '钟室电梯平台', 0, 0, 2.2, 2.2, 'circulation'),
          space('south-view', '南向潟湖视角', 0, -2, 4.8, 1.2, 'outdoor'),
          space('west-view', '西向主广场视角', -2, 0, 1.2, 4.8, 'outdoor'),
          space('north-view', '北向城市屋顶视角', 0, 2, 4.8, 1.2, 'outdoor'),
          space(
            'angel-view',
            '塔顶加百列天使观察点',
            2,
            0,
            1.2,
            4.8,
            'outdoor',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'base',
        kind: 'gate',
        position: [0, 2.5],
        connects: ['loggetta'],
      },
      {
        floorId: 'base',
        kind: 'door',
        position: [0, 0.6],
        connects: ['loggetta', 'ticket-lift'],
      },
    ],
    routeStops: [
      { floorId: 'base', spaceId: 'loggetta', position: [0, 1.6] },
      { floorId: 'base', spaceId: 'ticket-lift', position: [0, -1.2] },
      { floorId: 'belfry', spaceId: 'south-view', position: [0, -2] },
      { floorId: 'belfry', spaceId: 'west-view', position: [-2, 0] },
      { floorId: 'belfry', spaceId: 'north-view', position: [0, 2] },
      { floorId: 'belfry', spaceId: 'angel-view', position: [2, 0] },
    ],
    sourceManifest: stMarkCampanileSources,
    verticalLinks: [
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: '塔基至钟室访客电梯',
        landings: [
          { floorId: 'base', position: [0, -1.2] },
          { floorId: 'belfry', position: [0, 0] },
        ],
      },
    ],
  };
}

function correrPlan(): StackedFloorPlan {
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '地面层：拿破仑翼入口',
        elevation: 0,
        stackOrder: 0,
        outline: rect(0, 0, 12, 8),
        spaces: [
          space(
            'napoleonic-entry',
            '拿破仑翼入口与大阶梯',
            0,
            1.8,
            8.5,
            2.5,
            'circulation',
          ),
          space(
            'lift-foot',
            '无障碍电梯入口',
            4.6,
            -2.2,
            1.7,
            1.7,
            'circulation',
          ),
        ],
      },
      {
        id: 'first',
        label: '一层：新古典宫室与威尼斯生活展区',
        elevation: 3.2,
        stackOrder: 1,
        outline: rect(0, 0, 15, 10),
        spaces: [
          space('ballroom', '舞厅及新古典宫室', -4.8, 2.6, 4.2, 3.2, 'hall'),
          space(
            'venetian-life',
            '威尼斯生活与制度展区',
            0,
            2.2,
            4.6,
            4,
            'gallery',
          ),
          space(
            'barbari-map',
            '德巴尔巴里城市图及木版',
            4.8,
            2.2,
            3.6,
            4,
            'gallery',
          ),
          space(
            'first-corridor',
            '新行政官邸连接走廊',
            0,
            -2.6,
            12.5,
            2.4,
            'circulation',
          ),
          space(
            'stair-head',
            '大阶梯上层',
            -5.8,
            -3.8,
            1.8,
            1.5,
            'circulation',
          ),
        ],
      },
      {
        id: 'second',
        label: '二层：绘画馆与行政官邸出口段',
        elevation: 6.4,
        stackOrder: 2,
        outline: rect(0, 0, 15, 10),
        spaces: [
          space('picture-gallery', '绘画馆', -2.6, 1.3, 8.4, 6.2, 'gallery'),
          space(
            'procuratie-exit',
            '与行政官邸相连的出口段',
            4.3,
            1.3,
            4.2,
            6.2,
            'circulation',
          ),
          space(
            'second-landing',
            '二层楼梯与电梯厅',
            0,
            -3.6,
            8.5,
            1.6,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [0, 3],
        connects: ['napoleonic-entry'],
      },
      {
        floorId: 'first',
        kind: 'archway',
        position: [-2.6, 2.4],
        connects: ['ballroom', 'venetian-life'],
      },
      {
        floorId: 'first',
        kind: 'archway',
        position: [2.4, 2.2],
        connects: ['venetian-life', 'barbari-map'],
      },
      {
        floorId: 'second',
        kind: 'archway',
        position: [1.6, 1.3],
        connects: ['picture-gallery', 'procuratie-exit'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'napoleonic-entry', position: [0, 1.8] },
      { floorId: 'first', spaceId: 'ballroom', position: [-4.8, 2.6] },
      { floorId: 'first', spaceId: 'venetian-life', position: [0, 2.2] },
      { floorId: 'first', spaceId: 'barbari-map', position: [4.8, 2.2] },
      { floorId: 'second', spaceId: 'picture-gallery', position: [-2.6, 1.3] },
      { floorId: 'second', spaceId: 'procuratie-exit', position: [4.3, 1.3] },
    ],
    sourceManifest: correrSources,
    verticalLinks: [
      {
        id: 'monumental-stair',
        kind: 'stairs',
        label: '拿破仑翼纪念性大阶梯',
        landings: [
          { floorId: 'ground', position: [-4.2, -2.2] },
          { floorId: 'first', position: [-5.8, -3.8] },
        ],
      },
      {
        id: 'gallery-stair',
        kind: 'stairs',
        label: '一层至二层绘画馆楼梯',
        landings: [
          { floorId: 'first', position: [0, -2.6] },
          { floorId: 'second', position: [0, -3.6] },
        ],
      },
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: '各展览层访客电梯',
        landings: [
          { floorId: 'ground', position: [4.6, -2.2] },
          { floorId: 'first', position: [5.8, -3.5] },
          { floorId: 'second', position: [3.2, -3.6] },
        ],
      },
    ],
  };
}

function stMarkBasilicaPlan(): StackedFloorPlan {
  const basilicaOutline: PlanPoint[] = [
    [-5.5, 6.5],
    [5.5, 6.5],
    [5.5, 2.4],
    [7, 2.4],
    [7, -2.4],
    [5, -2.4],
    [5, -6.5],
    [-5, -6.5],
    [-5, -2.4],
    [-7, -2.4],
    [-7, 2.4],
    [-5.5, 2.4],
    [-5.5, 6.5],
  ];

  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'basilica',
        label: '教堂层：前厅、主堂与黄金祭坛',
        elevation: 0,
        stackOrder: 0,
        outline: basilicaOutline,
        spaces: [
          space(
            'porta-san-pietro',
            '圣彼得门与前厅',
            -3.5,
            5.5,
            3,
            1.6,
            'circulation',
          ),
          space('genesis-dome', '《创世纪》穹顶', 1.8, 5, 5.6, 2.2, 'hall'),
          space('nave', '主堂中轴与金色马赛克穹顶', 0, 0.9, 9, 6.2, 'hall'),
          space('pala-doro', '主祭坛及黄金祭坛', 0, -4.8, 6.8, 2.6, 'chapel'),
          space(
            'foresti-stair',
            'Foresti楼梯入口',
            -5.8,
            -0.2,
            1.5,
            2.4,
            'circulation',
          ),
        ],
      },
      {
        id: 'museum-loggia',
        label: '上层：圣马可博物馆与马廊',
        elevation: 3.6,
        stackOrder: 1,
        outline: rect(0, 1.3, 11, 9),
        spaces: [
          space(
            'foresti-landing',
            'Foresti楼梯上层',
            -4.4,
            -1.4,
            1.5,
            2.4,
            'circulation',
          ),
          space('museum', '圣马可博物馆', 0, -0.8, 6.5, 4.4, 'gallery'),
          space(
            'horses-loggia',
            '原青铜驷马与圣马可马廊',
            0,
            4,
            8.5,
            2.5,
            'outdoor',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'basilica',
        kind: 'gate',
        position: [-3.5, 6.3],
        connects: ['porta-san-pietro'],
      },
      {
        floorId: 'basilica',
        kind: 'archway',
        position: [-1.9, 5.3],
        connects: ['porta-san-pietro', 'genesis-dome'],
      },
      {
        floorId: 'basilica',
        kind: 'archway',
        position: [0, 3.7],
        connects: ['genesis-dome', 'nave'],
      },
      {
        floorId: 'basilica',
        kind: 'archway',
        position: [0, -2.2],
        connects: ['nave', 'pala-doro'],
      },
      {
        floorId: 'museum-loggia',
        kind: 'door',
        position: [-3.5, -1.2],
        connects: ['foresti-landing', 'museum'],
      },
      {
        floorId: 'museum-loggia',
        kind: 'archway',
        position: [0, 2.4],
        connects: ['museum', 'horses-loggia'],
      },
    ],
    routeStops: [
      {
        floorId: 'basilica',
        spaceId: 'porta-san-pietro',
        position: [-3.5, 5.5],
      },
      { floorId: 'basilica', spaceId: 'genesis-dome', position: [1.8, 5] },
      { floorId: 'basilica', spaceId: 'nave', position: [0, 0.9] },
      { floorId: 'basilica', spaceId: 'pala-doro', position: [0, -4.8] },
      { floorId: 'basilica', spaceId: 'foresti-stair', position: [-5.8, -0.2] },
      { floorId: 'museum-loggia', spaceId: 'horses-loggia', position: [0, 4] },
    ],
    sourceManifest: stMarkBasilicaSources,
    verticalLinks: [
      {
        id: 'foresti-stair',
        kind: 'stairs',
        label: 'Foresti楼梯',
        landings: [
          { floorId: 'basilica', position: [-5.8, -0.2] },
          { floorId: 'museum-loggia', position: [-4.4, -1.4] },
        ],
      },
    ],
  };
}

function accademiaVenicePlan(): StackedFloorPlan {
  return {
    mode: 'stacked-floorplan',
    floors: [
      {
        id: 'ground',
        label: '底层：入口、后段展室与出口',
        elevation: 0,
        stackOrder: 0,
        outline: rect(0, 0, 15, 10),
        spaces: [
          space(
            'campo-entry',
            'Campo della Carità入口与票务',
            -5.5,
            3.2,
            3,
            2.2,
            'circulation',
          ),
          space('ground-galleries', '底层展室', 0.4, 0, 8.4, 6.8, 'gallery'),
          space('ground-exit', '底层出口', 5.6, -3.2, 2.5, 1.8, 'circulation'),
          space(
            'main-stair-foot',
            '主楼梯与无障碍电梯入口',
            -5.5,
            -2.7,
            2.5,
            2.5,
            'circulation',
          ),
        ],
      },
      {
        id: 'first',
        label: '首层：第二十四、第八、第十室及后续画廊',
        elevation: 3.4,
        stackOrder: 1,
        outline: rect(0, 0, 16, 11),
        spaces: [
          space('room-xxiv', '第二十四室：提香', -5.6, 2.8, 3, 3.8, 'gallery'),
          space(
            'room-viii',
            '第八室：乔尔乔内',
            -1.8,
            2.8,
            3.6,
            3.8,
            'gallery',
          ),
          space('room-x', '第十室：委罗内塞', 2.4, 2.8, 3.8, 3.8, 'gallery'),
          space(
            'later-galleries',
            '后续威尼斯绘画展室',
            4.2,
            -1.8,
            6.2,
            4.2,
            'gallery',
          ),
          space(
            'first-corridor',
            '首层连续画廊通道',
            -1.4,
            -2.8,
            5,
            2.2,
            'circulation',
          ),
          space(
            'main-stair-head',
            '主楼梯与电梯上层',
            -6.4,
            -3.8,
            2.2,
            2.2,
            'circulation',
          ),
        ],
      },
    ],
    openings: [
      {
        floorId: 'ground',
        kind: 'gate',
        position: [-5.5, 4.3],
        connects: ['campo-entry'],
      },
      {
        floorId: 'first',
        kind: 'archway',
        position: [-3.8, 2.8],
        connects: ['room-xxiv', 'room-viii'],
      },
      {
        floorId: 'first',
        kind: 'archway',
        position: [0.1, 2.8],
        connects: ['room-viii', 'room-x'],
      },
      {
        floorId: 'first',
        kind: 'archway',
        position: [3.4, 0.8],
        connects: ['room-x', 'later-galleries'],
      },
      {
        floorId: 'ground',
        kind: 'door',
        position: [4.4, -3.2],
        connects: ['ground-galleries', 'ground-exit'],
      },
    ],
    routeStops: [
      { floorId: 'ground', spaceId: 'campo-entry', position: [-5.5, 3.2] },
      { floorId: 'first', spaceId: 'room-xxiv', position: [-5.6, 2.8] },
      { floorId: 'first', spaceId: 'room-viii', position: [-1.8, 2.8] },
      { floorId: 'first', spaceId: 'room-x', position: [2.4, 2.8] },
      { floorId: 'first', spaceId: 'later-galleries', position: [4.2, -1.8] },
      { floorId: 'ground', spaceId: 'ground-galleries', position: [0.4, 0] },
    ],
    sourceManifest: accademiaVeniceSources,
    verticalLinks: [
      {
        id: 'main-stair',
        kind: 'stairs',
        label: '主楼梯',
        landings: [
          { floorId: 'ground', position: [-5.5, -2.7] },
          { floorId: 'first', position: [-6.4, -3.8] },
        ],
      },
      {
        id: 'visitor-lift',
        kind: 'lift',
        label: '无障碍访客电梯',
        landings: [
          { floorId: 'ground', position: [-4.6, -2.7] },
          { floorId: 'first', position: [-5.4, -3.8] },
        ],
      },
    ],
  };
}

export const milanVeniceFloorPlans: Record<string, StackedFloorPlan> = {
  'accademia-venice': accademiaVenicePlan(),
  brera: breraPlan(),
  correr: correrPlan(),
  'la-scala': laScalaPlan(),
  'last-supper': lastSupperPlan(),
  'milan-duomo': milanDuomoPlan(),
  'santa-maria-grazie': santaMariaGraziePlan(),
  'st-mark-basilica': stMarkBasilicaPlan(),
  'st-mark-campanile': stMarkCampanilePlan(),
};

export const milanVeniceInventory: Record<string, FloorPlanInventoryEntry> = {
  'accademia-venice': {
    status: 'ready',
    note: '官方两层地图和参观路线支持首层作品节点、底层展室及楼梯/电梯连接。',
    sources: accademiaVeniceSources,
  },
  brera: {
    status: 'ready',
    note: '官方互动地图支持拿破仑庭院、首层连续画廊和目标展室顺序。',
    sources: breraSources,
  },
  correr: {
    status: 'ready',
    note: '官方路线图明确两层展览序列，入口层仅表达游客到达和垂直交通。',
    sources: correrSources,
  },
  fenice: {
    status: 'source-limited',
    note: '官方资料确认观众厅、皇家包厢、Sale Apollinee和多层包厢，但未公开足以重建精确楼层连接的平面资料。',
    sources: feniceSources,
  },
  'galleria-vittorio': {
    status: 'source-limited',
    note: '官方资料支持十字轴、中央八角厅和两端出口，但不足以重建可核验的店面边界、门洞和内部连接。',
    sources: galleriaVittorioSources,
  },
  'la-scala': {
    status: 'ready',
    note: '合并后的8个节点同时覆盖博物馆、历史包厢和晚间观众动线；楼座位置按官方座席图表达。',
    sources: laScalaSources,
  },
  'last-supper': {
    status: 'ready',
    note: '官方访问信息支持核验、寄存、分段恒温闸室、旧食堂两壁和出口的单层顺序。',
    sources: lastSupperSources,
  },
  'milan-duomo': {
    status: 'ready',
    note: '官方导览资料支持教堂层、约31米首层露台、约45米中央露台及电梯/楼梯连接。',
    sources: milanDuomoSources,
  },
  'santa-maria-grazie': {
    status: 'ready',
    note: '官方建筑资料支持三廊长堂、侧礼拜堂、交叉部圆顶、唱诗席和条件开放的回廊视角。',
    sources: santaMariaGrazieSources,
  },
  sforza: {
    status: 'source-limited',
    note: '官方城堡地图支持庭院和博物馆序列，但未公开足以绑定各馆楼层及精确垂直连接的资料。',
    sources: sforzaSources,
  },
  'st-mark-basilica': {
    status: 'ready',
    note: '官方组合路线明确前厅、主堂、Pala d’Oro、Foresti楼梯、上层博物馆与马廊。',
    sources: stMarkBasilicaSources,
  },
  'st-mark-campanile': {
    status: 'ready',
    note: '官方票务与钟楼资料支持塔基、电梯和约60米钟室四向观察序列。',
    sources: stMarkCampanileSources,
  },
};
