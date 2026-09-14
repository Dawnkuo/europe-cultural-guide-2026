export type LibraryPoint = [number, number];
export type LibraryRect = [number, number, number, number];

// Letarouilly II, Belvedere plate 14, canvas 7007670, native 4000 x 5490.
// The library plan and its transverse section have DIFFERENT graphic scales.
export const libraryCalibration = {
  planBar: { from: [1521, 2687], to: [2344, 2687], metres: 48 },
  sectionBar: { from: [1527, 2557], to: [2348, 2555], metres: 8 },
  origin: [1880, 3892] as LibraryPoint,
  sectionFloorY: 2310,
  sectionSpringY: 1757,
  sectionCrownY: 1390,
  sectionRidgeY: 1065,
  sectionEavesY: 1480,
} as const;

export const libraryPlanPPM = (2344 - 1521) / 48;
export const librarySectionPPM = Math.hypot(2348 - 1527, 2555 - 2557) / 8;
export const libraryPlanPoint = ([x, y]: LibraryPoint): LibraryPoint => [
  (x - libraryCalibration.origin[0]) / libraryPlanPPM,
  (y - libraryCalibration.origin[1]) / libraryPlanPPM,
];
export const libraryHeight = (y: number) => (libraryCalibration.sectionFloorY - y) / librarySectionPPM;

// Include both vestibules: this extent is NOT the modern 70 m hall measurement.
export const librarySpaces = [
  { id: 'west-vestibule', name: '西侧连接空间', polygon: [[1208, 3765], [1465, 3765], [1465, 4020], [1208, 4020]] as LibraryPoint[], label: [1335, 3970] as LibraryPoint },
  { id: 'sistine-hall', name: '西斯廷大厅', polygon: [[1465, 3765], [2415, 3765], [2415, 4020], [1465, 4020]] as LibraryPoint[], label: [1950, 3970] as LibraryPoint },
  { id: 'east-vestibule', name: '东侧连接空间', polygon: [[2415, 3765], [2558, 3765], [2558, 4020], [2415, 4020]] as LibraryPoint[], label: [2487, 3885] as LibraryPoint },
];

// Each dark pier was individually picked; dotted vault diagonals are NOT walls.
export const libraryPiers: LibraryRect[] = [
  [1580, 3882, 1613, 3903], [1728, 3878, 1761, 3900],
  [1866, 3878, 1899, 3901], [1997, 3877, 2031, 3899],
  [2132, 3875, 2164, 3898], [2273, 3875, 2305, 3897],
];
export const libraryWalls: LibraryRect[] = [
  [1185, 3765, 1208, 3946], [1185, 3984, 1208, 4020],
  [1208, 3745, 1237, 3765], [1273, 3745, 1360, 3765],
  [1360, 3745, 1405, 3765], [1438, 3745, 1488, 3765],
  [1547, 3740, 1661, 3765], [1700, 3740, 1805, 3765],
  [1836, 3740, 1945, 3765], [1977, 3740, 2075, 3765],
  [2110, 3740, 2204, 3765], [2241, 3740, 2340, 3765],
  [2380, 3740, 2447, 3765], [2490, 3740, 2558, 3765],
  [1208, 4020, 1245, 4045], [1273, 4020, 1400, 4045],
  [1430, 4020, 1532, 4045], [1568, 4020, 1664, 4045],
  [1697, 4020, 1798, 4045], [1830, 4020, 1935, 4045],
  [1968, 4020, 2069, 4045], [2100, 4020, 2199, 4045],
  [2235, 4020, 2332, 4045], [2367, 4020, 2470, 4045],
  [2512, 4020, 2558, 4045],
  [1448, 3765, 1465, 3786], [1448, 3858, 1465, 3929], [1448, 3990, 1465, 4020],
  [2415, 3765, 2440, 3936], [2415, 3981, 2440, 4020],
  [2558, 3765, 2590, 3937], [2558, 3982, 2590, 4020],
  [1312, 3860, 1328, 3932], [1328, 3902, 1357, 3919],
];

// Bay divisions use the observed centres, never an evenly repeated generic room.
export const libraryBayEdges = [1465, ...libraryPiers.map(([a, , b]) => (a + b) / 2), 2415];
export const libraryScope = {
  id: 'sistine-library-transverse-cutaway',
  completeBuilding: false,
  campusRegistration: 'none-independent-local-study',
  sourcePlateDate: 1882,
  wallHeight: 'display-cut-1.1m-not-a-building-height',
  vaults: 'section-profile-frames-not-full-vault-surfaces',
  roof: 'section-silhouette-only-no-current-roof-detail',
  excludes: ['lower-library-floors', 'modern-lifts', 'book-storage', 'roof-trusses', 'frescoes', 'furniture'],
} as const;
