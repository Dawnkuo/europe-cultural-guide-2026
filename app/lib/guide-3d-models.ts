import type { GuideSpatialType } from '../data/types';

export type Vec3 = [number, number, number];

export type GuideModelBasis =
  | 'landmark-massing'
  | 'documented-floorplan'
  | 'urban-topography';

export type GuideSceneMaterial =
  | 'stone'
  | 'pale-stone'
  | 'brick'
  | 'marble'
  | 'metal'
  | 'glass'
  | 'roof'
  | 'water'
  | 'earth'
  | 'garden'
  | 'route';

export type GuideScenePart = {
  kind: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  material: GuideSceneMaterial;
  points?: Array<[number, number]>;
};

export type GuideModelRecipe = {
  profile: string;
  modelBasis: GuideModelBasis;
  environment:
    | 'interior'
    | 'plaza'
    | 'historic-site'
    | 'waterfront'
    | 'park'
    | 'hillside'
    | 'urban';
  parts: GuideScenePart[];
  route: Vec3[];
  camera: {
    position: Vec3;
    target: Vec3;
  };
};

type ModelFactory = (variant: number) => Omit<GuideModelRecipe, 'profile'>;

const rotation: Vec3 = [0, 0, 0];

function part(
  kind: string,
  position: Vec3,
  scale: Vec3,
  material: GuideSceneMaterial = 'stone',
  rotate: Vec3 = rotation,
): GuideScenePart {
  return { kind, material, position, rotation: rotate, scale };
}

function fingerprintOffset(variant: number) {
  return variant * 0.013;
}

function documentedGallery(
  variant: number,
  plan: 'linear' | 'courtyard' | 'u-shape' | 'palace' = 'linear',
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const route: Vec3[] =
    plan === 'u-shape'
      ? [
          [-5, 0.15, 4],
          [-5, 0.15, -3],
          [0, 0.15, -4],
          [5, 0.15, -3],
          [5, 0.15, 4],
        ]
      : plan === 'courtyard'
        ? [
            [-4, 0.15, 4],
            [-4, 0.15, -3.5],
            [3.8, 0.15, -3.5],
            [3.8, 0.15, 3.4],
            [0, 0.15, 4.2],
          ]
        : plan === 'palace'
          ? [
              [-5.2, 0.15, 2.8],
              [-2.5, 0.15, -1.8],
              [0, 0.15, 2.2],
              [2.6, 0.15, -1.6],
              [5.2, 0.15, 2.6],
            ]
          : [
              [-5.5, 0.15, 0],
              [-2.8, 0.15, 0.8],
              [0, 0.15, -0.4],
              [2.8, 0.15, 0.75],
              [5.5, 0.15, 0],
            ];
  const parts =
    plan === 'u-shape'
      ? [
          part(
            'gallery-wing',
            [-5, 0.7, 0],
            [1.25 + delta, 1.4, 9],
            'pale-stone',
          ),
          part('gallery-wing', [5, 0.7, 0], [1.25, 1.4, 9], 'pale-stone'),
          part('gallery-wing', [0, 0.7, -4], [9, 1.4, 1.25], 'pale-stone'),
          part('loggia', [0, 1.45, -4], [8.6, 0.28, 0.82], 'marble'),
          part('courtyard', [0, 0.04, 1], [8.5, 0.08, 5.5], 'route'),
        ]
      : plan === 'courtyard'
        ? [
            part(
              'gallery-wing',
              [-4.4, 0.7, 0],
              [1.4, 1.4 + delta, 8.6],
              'pale-stone',
            ),
            part('gallery-wing', [4.4, 0.7, 0], [1.4, 1.4, 8.6], 'pale-stone'),
            part('gallery-wing', [0, 0.7, -3.6], [7.5, 1.4, 1.4], 'pale-stone'),
            part('gallery-wing', [0, 0.7, 3.6], [7.5, 1.4, 1.4], 'pale-stone'),
            part('courtyard', [0, 0.04, 0], [7.2, 0.08, 5.7], 'route'),
          ]
        : plan === 'palace'
          ? [
              part(
                'palace-room',
                [-4.6, 0.72, 0],
                [2.3, 1.44, 5.8 + delta],
                'brick',
              ),
              part(
                'palace-room',
                [-1.6, 0.72, 0.2],
                [2.3, 1.44, 5.3],
                'pale-stone',
              ),
              part(
                'palace-room',
                [1.5, 0.72, -0.1],
                [2.3, 1.44, 5.6],
                'marble',
              ),
              part(
                'palace-room',
                [4.6, 0.72, 0.15],
                [2.3, 1.44, 5.2],
                'pale-stone',
              ),
              part('grand-stair', [-5.7, 0.34, 3.3], [2, 0.68, 2.8], 'marble'),
            ]
          : [
              part(
                'gallery-room',
                [-4.8, 0.72, 0],
                [2.2, 1.44, 4.2],
                'pale-stone',
              ),
              part(
                'gallery-room',
                [-2.35, 0.72, 0.55],
                [2.1, 1.44, 3.6],
                'pale-stone',
              ),
              part('gallery-room', [0, 0.72, -0.35], [2.1, 1.44, 4], 'marble'),
              part(
                'gallery-room',
                [2.35, 0.72, 0.55],
                [2.1, 1.44, 3.6],
                'pale-stone',
              ),
              part(
                'gallery-room',
                [4.8 + delta, 0.72, 0],
                [2.2, 1.44, 4.2],
                'pale-stone',
              ),
            ];
  return {
    camera: { position: [11, 9, 13], target: [0, 0.4, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts,
    route,
  };
}

function crossChurch(
  variant: number,
  gothic = false,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const parts = [
    part(
      'nave',
      [0, 1, 0.8],
      [3.2 + delta, 2, 8.4],
      gothic ? 'pale-stone' : 'brick',
    ),
    part('transept', [0, 1.15, -1], [7.4, 2.3, 2.35], 'pale-stone'),
    part('apse', [0, 1.25, -4.1], [3.1, 2.5, 2.1], 'marble'),
    part('dome', [0, 2.55, -1], [2.35, 1.4, 2.35], gothic ? 'roof' : 'marble'),
    part(
      gothic ? 'gothic-spire' : 'bell-tower',
      [-1.35, 2.35, 5],
      [0.9, 4.7, 0.9],
      'stone',
    ),
    part(
      gothic ? 'gothic-spire' : 'bell-tower',
      [1.35, 2.35, 5],
      [0.9, 4.7 + delta, 0.9],
      'stone',
    ),
    part('facade', [0, 1.45, 4.6], [3.8, 2.9, 0.55], 'marble'),
  ];
  return {
    camera: { position: [12, 9, 15], target: [0, 1.1, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts,
    route: [
      [0, 0.15, 5.4],
      [0, 0.15, 2.4],
      [-1.7, 0.15, 0.2],
      [0, 0.15, -1],
      [0, 0.15, -4.2],
      [2.2, 0.15, -1.2],
    ],
  };
}

function gothicCathedral(
  variant: number,
  terrace = false,
): Omit<GuideModelRecipe, 'profile'> {
  const base = crossChurch(variant, true);
  base.parts.push(
    part(
      'buttress',
      [-2.15, 1.05, 1.5],
      [0.35, 2.1, 5.8],
      'stone',
      [0, 0, -0.08],
    ),
    part(
      'buttress',
      [2.15, 1.05, 1.5],
      [0.35, 2.1, 5.8],
      'stone',
      [0, 0, 0.08],
    ),
  );
  if (terrace) {
    base.parts.push(
      part('terrace', [0, 2.05, 0.8], [3.4, 0.18, 7.8], 'marble'),
      ...Array.from({ length: 7 }, (_, index) =>
        part(
          'pinnacle',
          [-2.1 + index * 0.7, 3.1 + (index % 2) * 0.25, 0.5],
          [0.22, 2.2, 0.22],
          'marble',
        ),
      ),
    );
  }
  return base;
}

function theater(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [10, 7.5, 12], target: [0, 1.1, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts: [
      part(
        'horseshoe-auditorium',
        [0, 1.2, 0.2],
        [7.6 + delta, 2.4, 7],
        'brick',
      ),
      part('stage', [0, 0.55, -4.1], [5.2, 1.1, 2.1], 'route'),
      part('proscenium', [0, 2.05, -3.1], [5.6, 4.1, 0.5], 'marble'),
      part('royal-box', [0, 2.2, 3.45], [2.25, 1.7, 0.8], 'marble'),
      part('box-tier', [-3.3, 2.1, 0.4], [0.75, 3.2, 5.5], 'pale-stone'),
      part('box-tier', [3.3, 2.1, 0.4], [0.75, 3.2, 5.5], 'pale-stone'),
    ],
    route: [
      [0, 0.15, 5],
      [-2.8, 0.15, 2.6],
      [-2.1, 0.4, 0],
      [0, 0.45, 1.5],
      [0, 0.3, -3.2],
      [2.6, 2.2, 0.8],
    ],
  };
}

function courtyardPalace(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 10, 14], target: [0, 1.2, 0] },
    environment: 'historic-site',
    modelBasis: 'landmark-massing',
    parts: [
      part('palace-wing', [-4.8, 1.25, 0], [1.6, 2.5, 9], 'brick'),
      part('palace-wing', [4.8, 1.25, 0], [1.6, 2.5, 9], 'brick'),
      part('palace-wing', [0, 1.25, -4.4], [8, 2.5, 1.6], 'stone'),
      part('palace-wing', [0, 1.25, 4.4], [8, 2.5, 1.6], 'stone'),
      part('courtyard', [0, 0.05, 0], [7.8, 0.1, 7.2], 'route'),
      part('gate-tower', [0, 2.3 + delta, 4.55], [1.55, 4.6, 1.55], 'brick'),
    ],
    route: [
      [0, 0.15, 5.5],
      [0, 0.15, 2.9],
      [-2.7, 0.15, 0],
      [0, 0.15, -3.6],
      [3, 0.15, 0],
      [0, 0.15, 3],
    ],
  };
}

function stoneBridge(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 7.5, 12], target: [0, 0.6, 0] },
    environment: 'waterfront',
    modelBasis: 'landmark-massing',
    parts: [
      part('water', [0, -0.15, 0], [16, 0.12, 8], 'water'),
      part('bridge-deck', [0, 1.25, 0], [12, 0.55, 2.3], 'stone'),
      part('bridge-arch', [-3.7, 0.65, 0], [3.2, 1.7, 2.5], 'stone'),
      part('bridge-arch', [0, 0.65, 0], [3.2 + delta, 1.7, 2.5], 'stone'),
      part('bridge-arch', [3.7, 0.65, 0], [3.2, 1.7, 2.5], 'stone'),
      part('bridge-shop', [-2.8, 2.15, 0], [2.2, 1.35, 2], 'brick'),
      part('bridge-shop', [2.8, 2.15, 0], [2.2, 1.35, 2], 'brick'),
    ],
    route: [
      [-6.5, 0.15, 2.8],
      [-4.5, 1.6, 0],
      [0, 1.65, 0],
      [4.5, 1.6, 0],
      [6.5, 0.15, -2.8],
    ],
  };
}

function canal(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 8.5, 13], target: [0, 0.7, 0] },
    environment: 'waterfront',
    modelBasis: 'urban-topography',
    parts: [
      part(
        'water',
        [0, -0.12, 0],
        [6.2 + delta, 0.12, 16],
        'water',
        [0, 0.16, 0],
      ),
      part('palazzo', [-4.4, 1.7, -4.9], [2.6, 3.4, 4.2], 'brick'),
      part('palazzo', [4.3, 1.5, -4.5], [2.4, 3, 4], 'pale-stone'),
      part('palazzo', [-4.2, 1.35, 0], [2.2, 2.7, 4.1], 'pale-stone'),
      part('palazzo', [4.4, 1.8, 0.4], [2.7, 3.6, 4.3], 'brick'),
      part('palazzo', [-4.25, 1.6, 5], [2.5, 3.2, 4], 'marble'),
      part('palazzo', [4.2, 1.45, 5], [2.4, 2.9, 4.1], 'stone'),
    ],
    route: [
      [0, 0.12, -7],
      [-1.3, 0.12, -4],
      [1.2, 0.12, -1],
      [-1, 0.12, 2],
      [1.2, 0.12, 4.7],
      [0, 0.12, 7],
    ],
  };
}

function plaza(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 8.5, 13], target: [0, 0.5, 0] },
    environment: 'plaza',
    modelBasis: 'urban-topography',
    parts: [
      part('plaza', [0, 0.02, 0], [13, 0.08, 9], 'route'),
      part('palazzo', [-5.6, 1.65, 0], [1.3, 3.3, 8.5], 'stone'),
      part('palazzo', [5.6, 1.45, 0], [1.3, 2.9, 8.5], 'brick'),
      part('monument', [0, 1.25, 0], [1.1, 2.5 + delta, 1.1], 'marble'),
      part('fountain-basin', [2.8, 0.22, -2.1], [2.2, 0.44, 2.2], 'water'),
      part('arcade', [0, 1.25, -4.2], [8, 2.5, 0.9], 'pale-stone'),
    ],
    route: [
      [-5, 0.15, 3.2],
      [-2.3, 0.15, 0],
      [0, 0.15, 0],
      [2.8, 0.15, -2.1],
      [5, 0.15, 3],
    ],
  };
}

function urbanDistrict(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 10, 14], target: [0, 0.8, 0] },
    environment: 'urban',
    modelBasis: 'urban-topography',
    parts: [
      part('street-block', [-4.6, 1.35, -3.7], [3.6, 2.7, 3.1], 'brick'),
      part('street-block', [0, 1.65, -4], [3.4, 3.3, 2.7], 'pale-stone'),
      part('street-block', [4.5, 1.2, -3.5], [3.1, 2.4, 3.4], 'stone'),
      part('street-block', [-4.2, 1.55, 3.5], [3.4, 3.1, 3.2], 'pale-stone'),
      part('street-block', [1.1, 1.25 + delta, 3.8], [5.4, 2.5, 2.8], 'brick'),
      part('plaza', [0, 0.03, 0], [5.2, 0.08, 4.5], 'route'),
    ],
    route: [
      [-6, 0.12, -1.5],
      [-2.2, 0.12, -0.5],
      [0, 0.12, 0],
      [2, 0.12, 1],
      [5.8, 0.12, 2.4],
    ],
  };
}

function hill(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 10, 14], target: [0, 1.4, 0] },
    environment: 'hillside',
    modelBasis: 'urban-topography',
    parts: [
      part(
        'terrain',
        [0, 0.2, 0],
        [14, 2.2 + delta, 11],
        'earth',
        [0, 0, -0.07],
      ),
      part('terrace', [0, 1.35, -1], [8.5, 0.22, 5.5], 'stone'),
      part('retaining-wall', [0, 0.8, 2], [8.7, 1.6, 0.45], 'stone'),
      part('stair', [-3.8, 1, 1.3], [1.2, 1.4, 3.8], 'stone', [0.18, 0, 0]),
      part('monument', [0, 2.2, -1], [1.2, 3.2, 1.2], 'marble'),
      part('belvedere', [4.2, 1.4, -1], [1.8, 0.3, 4.2], 'pale-stone'),
    ],
    route: [
      [-5, 0.5, 3.6],
      [-3.5, 1.1, 1],
      [0, 1.5, 0],
      [3.4, 1.5, -1.4],
      [5.3, 1.6, -2.8],
    ],
  };
}

function pantheon(): Omit<GuideModelRecipe, 'profile'> {
  return {
    camera: { position: [11, 8, 14], target: [0, 1.5, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      part('rotunda', [0, 1.65, -1.2], [6.8, 3.3, 6.8], 'brick'),
      part('dome', [0, 3.15, -1.2], [6.7, 3.25, 6.7], 'stone'),
      part('portico', [0, 1.1, 3], [6.6, 2.2, 3.4], 'pale-stone'),
      ...[-2.45, -1.65, -0.82, 0, 0.82, 1.65, 2.45].map((x) =>
        part('column', [x, 1.25, 4.15], [0.34, 2.5, 0.34], 'stone'),
      ),
      part('pediment', [0, 2.65, 3.8], [6.4, 1.55, 0.65], 'marble'),
      part('oculus', [0, 4.8, -1.2], [1.15, 0.15, 1.15], 'route'),
    ],
    route: [
      [0, 0.15, 5.4],
      [0, 0.15, 3.7],
      [0, 0.15, -1.2],
      [2.35, 0.15, -1],
      [0, 0.15, -3.7],
    ],
  };
}

function colosseum(): Omit<GuideModelRecipe, 'profile'> {
  return {
    camera: { position: [13, 9, 14], target: [0, 1.1, 0] },
    environment: 'historic-site',
    modelBasis: 'landmark-massing',
    parts: [
      part('elliptical-ring', [0, 0.8, 0], [9.8, 1.6, 7.6], 'stone'),
      part('elliptical-ring', [0, 1.75, 0], [9.5, 1.25, 7.3], 'pale-stone'),
      part('elliptical-ring', [0, 2.55, 0], [9.2, 0.85, 7], 'brick'),
      part('arena', [0, 0.1, 0], [6.3, 0.18, 4.2], 'earth'),
      part('hypogeum', [0, 0.28, 0], [5.7, 0.5, 3.7], 'brick'),
      part('arena-wall', [0, 0.58, -2.2], [6.2, 0.95, 0.35], 'stone'),
    ],
    route: [
      [-5.5, 0.15, 3.5],
      [-4, 0.5, 1.8],
      [-1.8, 0.3, 0],
      [0, 0.3, 0],
      [2.4, 0.6, 0],
      [4.2, 1.8, -1.6],
    ],
  };
}

function leaningTower(): Omit<GuideModelRecipe, 'profile'> {
  return {
    camera: { position: [11, 8.5, 13], target: [0, 2.6, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      ...Array.from({ length: 7 }, (_, level) =>
        part(
          'leaning-drum',
          [level * 0.1, 0.45 + level * 0.72, 0],
          [2.5 - level * 0.04, 0.62, 2.5 - level * 0.04],
          'marble',
          [0, 0, -0.065],
        ),
      ),
      part(
        'belfry',
        [0.76, 5.6, 0],
        [2.15, 0.82, 2.15],
        'pale-stone',
        [0, 0, -0.065],
      ),
      part('plaza', [0, 0.02, 0], [11, 0.08, 8], 'garden'),
    ],
    route: [
      [-2.5, 0.15, 2.7],
      [-1.2, 0.8, 1.1],
      [0.2, 2.3, 0],
      [0.6, 4.8, 0],
      [0.8, 5.9, 0],
    ],
  };
}

function sagradaFamilia(): Omit<GuideModelRecipe, 'profile'> {
  const spires = [
    [-2.4, 3.4, 3.3],
    [-0.8, 4.2, 3.5],
    [0.8, 4.5, 3.5],
    [2.4, 3.5, 3.3],
    [-2.2, 3.1, -3.2],
    [-0.75, 4, -3.5],
    [0.75, 4.2, -3.5],
    [2.2, 3.2, -3.2],
  ] as Vec3[];
  return {
    camera: { position: [13, 10, 15], target: [0, 2.1, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      part('nave', [0, 1.3, 0], [5.6, 2.6, 8.5], 'pale-stone'),
      part('transept', [0, 1.5, 0], [8, 3, 2.4], 'stone'),
      part('apse', [0, 1.4, -4.1], [5, 2.8, 2.1], 'pale-stone'),
      ...spires.map((position, index) =>
        part(
          'spire',
          position,
          [0.85, 5.5 + index * 0.12, 0.85],
          index < 4 ? 'marble' : 'stone',
        ),
      ),
      part('crossing-tower', [0, 4.6, 0], [1.35, 7.2, 1.35], 'marble'),
    ],
    route: [
      [-3.5, 0.15, 4.8],
      [0, 0.15, 2],
      [0, 0.15, -2.5],
      [3.1, 3.5, -1],
      [3.8, 0.15, -2.8],
      [-3.8, 0.15, 3.4],
    ],
  };
}

function cologneCathedral(): Omit<GuideModelRecipe, 'profile'> {
  const base = gothicCathedral(59, false);
  base.parts = base.parts.filter((item) => item.kind !== 'gothic-spire');
  base.parts.push(
    part('gothic-spire', [-1.5, 4.4, 5], [1.35, 8.8, 1.35], 'stone'),
    part('gothic-spire', [1.5, 4.4, 5], [1.35, 8.8, 1.35], 'stone'),
    part('buttress', [-2.4, 1.45, 0], [0.45, 2.9, 7.2], 'stone'),
    part('buttress', [2.4, 1.45, 0], [0.45, 2.9, 7.2], 'stone'),
    part('treasury-vault', [-3.3, -0.1, 1.2], [2.4, 0.5, 3], 'brick'),
  );
  base.route = [
    [0, 0.15, 6],
    [0, 0.15, 1.8],
    [-1.8, 0.15, -0.4],
    [1.8, 0.15, -0.3],
    [-3.2, -0.2, 1.2],
    [1.5, 5.2, 5],
  ];
  return base;
}

function hohenzollern(): Omit<GuideModelRecipe, 'profile'> {
  return {
    camera: { position: [14, 8, 13], target: [0, 0.8, 0] },
    environment: 'waterfront',
    modelBasis: 'landmark-massing',
    parts: [
      part('water', [0, -0.15, 0], [16, 0.12, 9], 'water'),
      ...[-4.8, 0, 4.8].map((x) =>
        part('bridge-arch', [x, 1, 0], [4.3, 2.4, 3.4], 'metal'),
      ),
      part('bridge-deck', [0, 1.15, 0], [15.5, 0.42, 3.4], 'metal'),
      part('rail-truss', [0, 2.2, -1.25], [15, 2.3, 0.22], 'metal'),
      part('rail-truss', [0, 2.2, 1.25], [15, 2.3, 0.22], 'metal'),
    ],
    route: [
      [-7.4, 1.45, 1.1],
      [-3.5, 1.45, 1.1],
      [0, 1.45, 1.1],
      [7.4, 1.45, 1.1],
    ],
  };
}

function landmarkTower(
  variant: number,
  glass = false,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [10, 8, 13], target: [0, 2.3, 0] },
    environment: 'urban',
    modelBasis: 'landmark-massing',
    parts: [
      part(
        glass ? 'glass-tower' : 'bell-tower',
        [0, 2.7, 0],
        [2.8 + delta, 5.4, 2.8],
        glass ? 'glass' : 'stone',
      ),
      part(
        'tower-crown',
        [0, 5.75, 0],
        [2.5, 0.7, 2.5],
        glass ? 'metal' : 'marble',
      ),
      part('observation-deck', [0, 5.4, 0], [3, 0.18, 3], 'glass'),
      part('entrance', [0, 0.7, 2], [1.5, 1.4, 0.8], 'pale-stone'),
      part('plaza', [0, 0.03, 0], [9, 0.08, 8], 'route'),
    ],
    route: [
      [0, 0.15, 4],
      [0, 0.15, 2.2],
      [0, 3, 0],
      [0, 5.5, 0],
      [2.6, 5.5, 0],
    ],
  };
}

function fountain(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 7.5, 12], target: [0, 1.2, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      part('palazzo-facade', [0, 2.25, -3.1], [9, 4.5, 1.2], 'pale-stone'),
      part('central-niche', [0, 2.1, -2.3], [2.7, 3.3, 1], 'marble'),
      part('fountain-basin', [0, 0.22, 1.1], [7.5, 0.44, 4.5], 'water'),
      part('rockwork', [0, 0.85, -0.6], [5.5, 1.7 + delta, 2.5], 'stone'),
      part('statue', [0, 1.9, -1.4], [0.8, 2.2, 0.8], 'marble'),
      part('statue', [-2.2, 1.25, -0.9], [0.55, 1.5, 0.55], 'marble'),
      part('statue', [2.2, 1.25, -0.9], [0.55, 1.5, 0.55], 'marble'),
    ],
    route: [
      [-5, 0.15, 4],
      [0, 0.15, 4],
      [0, 0.15, 1],
      [-2.4, 0.15, 0],
      [5, 0.15, 3.7],
    ],
  };
}

function steppedMonument(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 8, 14], target: [0, 1.2, 0] },
    environment: 'plaza',
    modelBasis: 'urban-topography',
    parts: [
      part('fountain-basin', [0, 0.16, 4.2], [2.4, 0.32, 2.4], 'water'),
      part('stair', [0, 0.38, 2.2], [5.5, 0.75, 3], 'marble', [-0.12, 0, 0]),
      part('stair', [0, 0.9, 0], [7.3, 0.8, 2.6], 'marble', [-0.08, 0, 0]),
      part(
        'stair',
        [0, 1.45, -2],
        [5.7, 0.8 + delta, 2.6],
        'marble',
        [-0.08, 0, 0],
      ),
      part('obelisk', [0, 3.25, -4], [0.5, 3.5, 0.5], 'stone'),
      part('church-facade', [0, 2.5, -5], [4.8, 4.3, 1], 'pale-stone'),
    ],
    route: [
      [0, 0.15, 4.4],
      [0, 0.45, 2.4],
      [0, 1, 0],
      [0, 1.55, -2],
      [0, 1.9, -4.2],
    ],
  };
}

function park(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 10, 15], target: [0, 1.1, 0] },
    environment: 'park',
    modelBasis: 'urban-topography',
    parts: [
      part(
        'terrain',
        [0, 0, 0],
        [15, 1.2 + delta, 12],
        'garden',
        [0, 0, -0.05],
      ),
      part('serpentine-terrace', [0, 1.55, -2.2], [9, 0.4, 4.4], 'marble'),
      ...Array.from({ length: 8 }, (_, index) =>
        part('column', [-3.5 + index, 0.75, 0.4], [0.32, 1.5, 0.32], 'stone'),
      ),
      part('grand-stair', [0, 0.65, 3], [4.2, 1.2, 4], 'marble', [-0.12, 0, 0]),
      part('gatehouse', [-3.2, 1.6, 5], [2.2, 3.2, 2.2], 'pale-stone'),
      part('gatehouse', [3.2, 1.35, 5], [2.3, 2.7, 2.3], 'pale-stone'),
    ],
    route: [
      [-5, 0.25, -4],
      [0, 1.8, -2],
      [0, 0.9, 0.4],
      [0, 0.8, 3],
      [3.2, 0.2, 5],
      [-5, 0.8, 1],
    ],
  };
}

function houseModel(
  variant: number,
  kind: 'mila' | 'batllo',
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const isMila = kind === 'mila';
  return {
    camera: { position: [10, 8, 13], target: [0, 2, 0] },
    environment: 'urban',
    modelBasis: 'documented-floorplan',
    parts: isMila
      ? [
          part('curved-facade', [0, 2.2, 0], [8.5, 4.4, 3.4], 'stone'),
          part('courtyard', [-1.9, 1.8, 0], [2.3, 3.7, 2.3], 'route'),
          part('courtyard', [2.1, 1.8, 0], [2.1, 3.7, 2.1], 'route'),
          part('attic-arches', [0, 4.25, 0], [7.7, 1.1, 3], 'brick'),
          part('roof', [0, 5.05, 0], [7.8, 0.25, 3.2], 'roof'),
          ...[-2.8, -1.1, 1.2, 2.9].map((x, index) =>
            part(
              'chimney',
              [x, 5.65 + index * 0.08, 0],
              [0.65, 1.5, 0.65],
              'pale-stone',
            ),
          ),
        ]
      : [
          part(
            'wavy-facade',
            [0, 2.3, 0],
            [5.2 + delta, 4.6, 2.6],
            'pale-stone',
          ),
          part('main-floor', [0, 1.6, -0.2], [4.8, 1.2, 2.8], 'marble'),
          part('light-well', [0, 2.7, -0.8], [1.6, 3.8, 1.2], 'glass'),
          part('attic-arches', [0, 4.35, 0], [4.7, 0.9, 2.5], 'stone'),
          part(
            'dragon-roof',
            [0, 5.2, 0],
            [5.2, 1.3, 2.6],
            'roof',
            [0, 0, 0.08],
          ),
          part('chimney', [-1.5, 5.75, 0], [0.55, 1.4, 0.55], 'marble'),
          part('chimney', [1.5, 5.65, 0], [0.55, 1.25, 0.55], 'marble'),
        ],
    route: isMila
      ? [
          [0, 0.15, 3],
          [-1.9, 0.15, 0],
          [1.8, 2.2, 0],
          [0, 4.4, 0],
          [0, 5.3, 0],
        ]
      : [
          [0, 0.15, 3],
          [0, 1.5, 0.4],
          [0, 2.6, -0.7],
          [0, 4.4, 0],
          [0, 5.3, 0],
          [1.8, 2.4, 0],
        ],
  };
}

function ruins(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 9, 14], target: [0, 0.7, 0] },
    environment: 'historic-site',
    modelBasis: 'urban-topography',
    parts: [
      part('terrain', [0, -0.05, 0], [15, 0.55 + delta, 11], 'earth'),
      part('ruin-wall', [-4, 1, -2], [4.5, 2, 0.45], 'brick'),
      part('ruin-wall', [2.8, 0.75, -3], [5, 1.5, 0.45], 'stone'),
      part('temple-columns', [-1, 1.25, 1.2], [3.2, 2.5, 1.2], 'marble'),
      part('triumphal-arch', [4.6, 1.5, 2.5], [2.8, 3, 1.1], 'stone'),
      part(
        'ancient-road',
        [0, 0.15, 0],
        [12, 0.18, 1.3],
        'route',
        [0, -0.22, 0],
      ),
    ],
    route: [
      [-6, 0.2, 2.8],
      [-3, 0.2, 1.5],
      [-1, 0.25, 1.2],
      [2.5, 0.2, -2.4],
      [5.2, 0.25, 2.7],
    ],
  };
}

function waterfront(
  variant: number,
  harbour = false,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [14, 9, 14], target: [0, 0.7, 0] },
    environment: 'waterfront',
    modelBasis: 'urban-topography',
    parts: [
      part('water', [0, -0.15, 2.5], [16, 0.12, 7], 'water'),
      part('quay', [0, 0.12, -2.2], [15, 0.24, 4], 'stone'),
      part(
        harbour ? 'crane-house' : 'riverfront',
        [-4.7, 2.2, -4.4],
        [2.8, 4.4 + delta, 2.1],
        'glass',
      ),
      part(
        harbour ? 'crane-house' : 'riverfront',
        [0, 2.5, -4.4],
        [2.8, 5, 2.1],
        'glass',
      ),
      part(
        harbour ? 'crane-house' : 'riverfront',
        [4.7, 2.3, -4.4],
        [2.8, 4.6, 2.1],
        'glass',
      ),
      part('warehouse', [-4, 1, -1.8], [5, 2, 1.8], 'brick'),
    ],
    route: [
      [-6, 0.25, -1],
      [-3, 0.25, -1],
      [0, 0.25, -1],
      [3, 0.25, -1],
      [6, 0.25, -1],
    ],
  };
}

function galleriaArcade(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 9, 14], target: [0, 1.4, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts: [
      part('arcade-wing', [0, 1.25, 0], [3.5, 2.5, 11], 'pale-stone'),
      part('arcade-wing', [0, 1.25, 0], [11, 2.5, 3.5], 'pale-stone'),
      part('glass-vault', [0, 2.75, 0], [3.1, 1.15, 10.6], 'glass'),
      part('glass-vault', [0, 2.75, 0], [10.6, 1.15, 3.1], 'glass'),
      part('octagonal-dome', [0, 3.15, 0], [4.6 + delta, 1.7, 4.6], 'glass'),
      part('mosaic-floor', [0, 0.06, 0], [4.2, 0.12, 4.2], 'marble'),
      part('triumphal-arch', [0, 1.8, 5.4], [4, 3.6, 0.8], 'marble'),
    ],
    route: [
      [0, 0.15, 6.2],
      [0, 0.15, 3.2],
      [0, 0.15, 0],
      [-3.2, 0.15, 0],
      [3.2, 0.15, 0],
      [0, 0.15, -6.2],
    ],
  };
}

function enclosedBridge(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 7, 12], target: [0, 1.3, 0] },
    environment: 'waterfront',
    modelBasis: 'landmark-massing',
    parts: [
      part('water', [0, -0.12, 0], [6.5, 0.12, 13], 'water'),
      part('palace-wall', [-3.5, 2.4, 0], [3.8, 4.8, 10], 'pale-stone'),
      part('prison-wall', [3.5, 2.1, 0], [3.8, 4.2, 10], 'brick'),
      part('bridge-arch', [0, 1.8, 0], [3.4 + delta, 3.2, 2.5], 'marble'),
      part('enclosed-passage', [0, 2.6, 0], [3.5, 1.9, 2.3], 'pale-stone'),
      part('stone-window', [0, 2.7, -1.2], [1.2, 0.8, 0.2], 'stone'),
    ],
    route: [
      [-4.8, 0.15, -5.4],
      [-2.2, 0.15, -2.2],
      [0, 2.6, 0],
      [2.2, 0.15, 2.2],
      [4.8, 0.15, 5.4],
    ],
  };
}

function rialtoBridge(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 7, 13], target: [0, 1.3, 0] },
    environment: 'waterfront',
    modelBasis: 'landmark-massing',
    parts: [
      part('water', [0, -0.14, 0], [16, 0.12, 8], 'water'),
      part('bridge-arch', [0, 1.25, 0], [11 + delta, 2.8, 3.4], 'marble'),
      part('stepped-deck', [0, 2.15, 0], [11.5, 0.5, 3.2], 'stone'),
      part('bridge-shop', [-2.7, 2.75, 0], [2.1, 1.25, 2.6], 'pale-stone'),
      part('bridge-shop', [0, 2.9, 0], [2.1, 1.25, 2.6], 'pale-stone'),
      part('bridge-shop', [2.7, 2.75, 0], [2.1, 1.25, 2.6], 'pale-stone'),
      part('central-portico', [0, 3.35, 0], [1.5, 1.6, 2.8], 'marble'),
    ],
    route: [
      [-6, 0.15, 2.5],
      [-4.2, 1.4, 0],
      [0, 2.6, 0],
      [4.2, 1.4, 0],
      [6, 0.15, -2.5],
    ],
  };
}

function florenceDuomo(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 10, 15], target: [0, 2.2, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      part('nave', [0, 1.35, 0.8], [4.3, 2.7, 9.5], 'marble'),
      part('transept', [0, 1.5, -1.8], [7, 3, 3], 'marble'),
      part('octagonal-drum', [0, 2.5, -1.8], [4.8, 1.5, 4.8], 'marble'),
      part('dome', [0, 4.05, -1.8], [4.8 + delta, 3.2, 4.8], 'roof'),
      part('lantern', [0, 6, -1.8], [0.8, 1.6, 0.8], 'marble'),
      part('facade', [0, 1.7, 5.2], [5.4, 3.4, 0.7], 'marble'),
      part('bell-tower', [-4.5, 2.9, 3.7], [1.35, 5.8, 1.35], 'marble'),
    ],
    route: [
      [0, 0.15, 6],
      [2.8, 0.15, -1.8],
      [-1.7, 0.15, 4.6],
      [0, 3.4, -1.8],
      [0, 6.1, -1.8],
    ],
  };
}

function stMarkBasilica(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const domes: Array<[number, number]> = [
    [0, 0],
    [0, 2.5],
    [0, -2.5],
    [-2.4, 0],
    [2.4, 0],
  ];
  return {
    camera: { position: [12, 9, 14], target: [0, 1.6, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      part('basilica-cross', [0, 1.15, 0], [7.2, 2.3, 7.8], 'brick'),
      ...domes.map(([x, z], index) =>
        part(
          'dome',
          [x, 2.35, z],
          [2.6 + (index === 0 ? delta : 0), 1.55, 2.6],
          'roof',
        ),
      ),
      part('arcaded-facade', [0, 1.65, 4.1], [7.6, 3.3, 0.8], 'marble'),
      part('quadriga-terrace', [0, 3.25, 4.2], [4.2, 0.35, 1], 'metal'),
    ],
    route: [
      [0, 0.15, 5.1],
      [0, 0.15, 3.5],
      [0, 0.15, 0.8],
      [0, 0.15, -1.8],
      [-2.8, 2.6, 2.8],
      [0, 3.4, 4.2],
    ],
  };
}

function mediciChapels(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 8.5, 13], target: [0, 1.6, 0] },
    environment: 'historic-site',
    modelBasis: 'documented-floorplan',
    parts: [
      part('crypt', [0, -0.15, 2.8], [5.8, 0.5, 3.6], 'brick'),
      part('octagonal-chapel', [0, 1.8, -0.6], [6.2, 3.6, 6.2], 'marble'),
      part('dome', [0, 3.7, -0.6], [5.8 + delta, 3.2, 5.8], 'roof'),
      part('new-sacristy', [-4.2, 1.3, 1.4], [2.8, 2.6, 3.4], 'pale-stone'),
      part('treasury', [4.1, 1.1, 1.7], [2.8, 2.2, 3.1], 'stone'),
      part('lantern', [0, 5.55, -0.6], [0.75, 1.3, 0.75], 'marble'),
    ],
    route: [
      [0, -0.2, 3],
      [4, 0.15, 1.7],
      [0, 0.15, -0.6],
      [-4.2, 0.15, 1.4],
      [0, -0.2, 2],
    ],
  };
}

function navonaPlaza(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 10, 15], target: [0, 0.4, 0] },
    environment: 'plaza',
    modelBasis: 'urban-topography',
    parts: [
      part('stadium-plaza', [0, 0.03, 0], [6.4, 0.08, 14], 'route'),
      part('fountain-basin', [0, 0.2, -4.5], [2.1, 0.4, 2.1], 'water'),
      part('fountain-basin', [0, 0.25, 0], [2.8 + delta, 0.5, 2.8], 'water'),
      part('obelisk', [0, 2.2, 0], [0.45, 4, 0.45], 'stone'),
      part('fountain-basin', [0, 0.2, 4.5], [2.1, 0.4, 2.1], 'water'),
      part('church-facade', [3.4, 1.8, 0], [0.8, 3.6, 4.5], 'marble', [
        0,
        Math.PI / 2,
        0,
      ]),
      part('palazzo', [-3.4, 1.4, 0], [0.9, 2.8, 12], 'brick'),
    ],
    route: [
      [0, 0.15, -6.2],
      [0, 0.15, 0],
      [3.2, 0.15, 0],
      [0, 0.15, 4.5],
      [0, 0.15, 6.2],
    ],
  };
}

function stPetersSquare(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const columns = Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2;
    return part(
      'column',
      [Math.cos(angle) * 6.2, 0.7, Math.sin(angle) * 4.25 + 1.2],
      [0.22, 1.4 + delta * 0.05, 0.22],
      'pale-stone',
    );
  });
  return {
    camera: { position: [13, 10, 15], target: [0, 0.7, 0] },
    environment: 'plaza',
    modelBasis: 'urban-topography',
    parts: [
      part('elliptical-plaza', [0, 0.03, 1.2], [13, 0.08, 9], 'route'),
      ...columns,
      part('obelisk', [0, 2.2, 1.2], [0.45, 4.2, 0.45], 'stone'),
      part('fountain-basin', [-3.1, 0.18, 1.2], [1.35, 0.36, 1.35], 'water'),
      part('fountain-basin', [3.1, 0.18, 1.2], [1.35, 0.36, 1.35], 'water'),
      part('basilica-facade', [0, 2.1, -5], [9.5, 4.2, 1], 'marble'),
    ],
    route: [
      [0, 0.15, 7],
      [0, 0.15, 1.2],
      [-6.2, 0.15, 1.2],
      [-3.1, 0.15, 1.2],
      [0, 0.15, -4.4],
    ],
  };
}

function vaticanMuseumsExterior(
  variant: number,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [15, 11, 16], target: [0, 1.1, 0] },
    environment: 'historic-site',
    modelBasis: 'landmark-massing',
    parts: [
      part('pinecone-courtyard', [0, 0.04, 1.8], [5.5, 0.08, 5], 'route'),
      part('belvedere-west-wing', [-4.5, 1.4, 0], [2, 2.8, 11], 'brick'),
      part('belvedere-east-wing', [4.5, 1.4, 0], [2, 2.8, 11], 'pale-stone'),
      part('bramante-corridor', [0, 1.5, -5], [7.2, 3, 1.4], 'stone'),
      part('pinacoteca-wing', [-3.2, 1.15, 5.2], [4.6, 2.3, 1.8], 'brick'),
      part('sistine-chapel', [3.2, 1.7, 5.2], [3.8 + delta, 3.4, 2.2], 'brick'),
      part('octagonal-court', [-1.4, 0.08, -1.8], [2.8, 0.12, 2.8], 'marble'),
    ],
    route: [
      [-5.8, 0.15, 5.2],
      [-4.5, 0.15, 1.8],
      [-1.4, 0.15, -1.8],
      [0, 1.55, -5],
      [4.5, 1.55, 0],
      [3.2, 0.15, 5.2],
    ],
  };
}

function stPetersBasilica(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [14, 11, 17], target: [0, 2, -0.5] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      part('basilica-nave', [0, 1.65, 0], [4.4, 3.3, 10.5], 'pale-stone'),
      part('basilica-transept', [0, 1.75, -2.2], [9.2, 3.5, 3], 'pale-stone'),
      part('basilica-apse', [0, 1.9, -5.5], [4.6, 3.8, 2.6], 'marble'),
      part('michelangelo-drum', [0, 3.55, -2.2], [3.5, 2.2, 3.5], 'stone'),
      part(
        'michelangelo-dome',
        [0, 5.2, -2.2],
        [4.8 + delta, 2.7, 4.8],
        'roof',
      ),
      part('lantern', [0, 7.1, -2.2], [0.65, 1.5, 0.65], 'marble'),
      part('maderno-facade', [0, 2.1, 5.25], [10.5, 4.2, 1], 'marble'),
      part('facade-clock-tower', [-4.3, 3.5, 5.1], [1.4, 2.2, 1.4], 'stone'),
      part('facade-clock-tower', [4.3, 3.5, 5.1], [1.4, 2.2, 1.4], 'stone'),
    ],
    route: [
      [0, 0.15, 6.5],
      [0, 0.15, 4.5],
      [-1.5, 0.15, 1.5],
      [0, 0.15, -2.2],
      [0, 3.6, -2.2],
      [0, 7.2, -2.2],
    ],
  };
}

function gondolaModel(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const model = canal(variant);
  model.parts = [
    part('water', [0, -0.12, 0], [6.5, 0.12, 16], 'water'),
    part('canal-wall', [-3.4, 0.75, 0], [0.7, 1.5, 16], 'stone'),
    part('canal-wall', [3.4, 0.75, 0], [0.7, 1.5, 16], 'brick'),
    part('boat-hull', [0, 0.18, -2], [1.1, 0.35, 4.8], 'metal'),
    part('ferro', [0, 0.85, -4.2], [0.12, 1.5, 0.12], 'metal', [0.18, 0, 0]),
    part('bridge-arch', [0, 1.1, 2.6], [6.4, 2.3, 1.5], 'stone'),
  ];
  return model;
}

function beachModel(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 8, 14], target: [0, 0.3, 0] },
    environment: 'waterfront',
    modelBasis: 'urban-topography',
    parts: [
      part('water', [0, -0.12, 3.8], [16, 0.12, 7], 'water'),
      part('sand', [0, -0.02, -0.3], [16, 0.12, 5.5 + delta], 'earth'),
      part('promenade', [0, 0.08, -3.5], [16, 0.16, 1.5], 'stone'),
      part('urban-block', [-4.6, 1.3, -5.2], [3.5, 2.6, 2.2], 'brick'),
      part('urban-block', [0, 1.55, -5.2], [3.5, 3.1, 2.2], 'pale-stone'),
      part('urban-block', [4.6, 1.2, -5.2], [3.5, 2.4, 2.2], 'brick'),
      part('public-art', [-2, 1.1, -1], [1.1, 2.2, 1.1], 'metal', [0, 0, 0.25]),
    ],
    route: [
      [-6, 0.15, -3.4],
      [-2, 0.15, -1],
      [0, 0.15, 1.6],
      [4, 0.15, -3.4],
      [6, 0.15, -5],
    ],
  };
}

function notreDameTowers(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 9, 14], target: [0, 2.2, 0] },
    environment: 'plaza',
    modelBasis: 'documented-floorplan',
    parts: [
      part('nave', [0, 1.3, -1.1], [4, 2.6, 8.5], 'pale-stone'),
      part('transept', [0, 1.4, -2], [7, 2.8, 2.3], 'stone'),
      part(
        'square-tower',
        [-1.65, 3.15, 3.5],
        [2.7, 6.3 + delta, 2.4],
        'stone',
      ),
      part('square-tower', [1.65, 3.15, 3.5], [2.7, 6.3, 2.4], 'stone'),
      part('gallery', [0, 3.3, 3.8], [3.2, 1, 0.7], 'marble'),
      part('spire', [0, 4.2, -1.8], [0.75, 5.2, 0.75], 'roof'),
      part('buttress', [-2.5, 1.2, -1.5], [0.4, 2.4, 6.5], 'stone'),
      part('buttress', [2.5, 1.2, -1.5], [0.4, 2.4, 6.5], 'stone'),
    ],
    route: [
      [1.65, 0.15, 4.8],
      [0, 1.6, 3.5],
      [1.65, 3.2, 3.5],
      [0, 5.9, 3.5],
      [-1.65, 3.2, 3.5],
      [-1.65, 0.15, 4.8],
    ],
  };
}

function accademiaFlorence(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 8, 13], target: [0, 0.7, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts: [
      part('colossus-hall', [-4.4, 0.75, 0], [2.5, 1.5, 5], 'pale-stone'),
      part('prisoners-gallery', [-1.4, 0.75, 0], [2.5, 1.5, 6.4], 'stone'),
      part('david-tribune', [2.3, 0.8, 0], [4.2 + delta, 1.6, 4.2], 'marble'),
      part('statue', [2.3, 1.75, 0], [0.55, 2.8, 0.55], 'marble'),
      part('plaster-hall', [5.1, 0.75, -1], [2.2, 1.5, 4.8], 'brick'),
      part('instrument-wing', [4.7, 0.75, 2.8], [2.7, 1.5, 2], 'pale-stone'),
    ],
    route: [
      [-5.5, 0.15, 0],
      [-2.5, 0.15, 0],
      [2.3, 0.15, 0],
      [5.1, 0.15, -1],
      [4.7, 0.15, 2.8],
    ],
  };
}

function sinopieHall(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 7, 13], target: [0, 0.7, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts: [
      part('long-hall', [0, 0.9, 0], [11.5, 1.8, 4.2 + delta], 'brick'),
      part('panel-wall', [-3.8, 1.05, -1.7], [2.8, 1.5, 0.18], 'pale-stone'),
      part('panel-wall', [-0.5, 1.05, 1.7], [2.8, 1.5, 0.18], 'pale-stone'),
      part('panel-wall', [2.8, 1.05, -1.7], [2.8, 1.5, 0.18], 'pale-stone'),
      part('apse-end', [5.5, 0.9, 0], [1.2, 1.8, 4], 'stone'),
    ],
    route: [
      [-5.2, 0.15, 0],
      [-2.2, 0.15, -1],
      [1, 0.15, 1],
      [4.8, 0.15, 0],
    ],
  };
}

function accademiaVenice(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 8, 14], target: [0, 0.7, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts: [
      part('scuola-hall', [-3.8, 0.85, 1], [4.2, 1.7, 6.8], 'pale-stone'),
      part('church-gallery', [0, 0.85, -1.6], [3.2, 1.7, 8.2 + delta], 'brick'),
      part('monastery-wing', [3.6, 0.85, 0.8], [3.4, 1.7, 6.3], 'stone'),
      part('upper-bridge', [0, 1.9, 2.2], [7.2, 0.45, 1.2], 'marble'),
      part('canal-edge', [-5.8, 0.05, 0], [1, 0.1, 8], 'water'),
    ],
    route: [
      [-5, 0.15, 2.8],
      [-3.8, 0.15, 0],
      [0, 0.15, -4],
      [3.6, 0.15, -1],
      [3.6, 1.9, 2.2],
      [0, 0.15, 2.6],
    ],
  };
}

function breraGallery(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const base = documentedGallery(variant, 'courtyard');
  base.parts.push(
    part('napoleon-statue', [0, 1, 0], [0.55, 1.9 + delta, 0.55], 'marble'),
    part('entry-arch', [0, 1.2, 3.7], [2.2, 2.4, 0.55], 'stone'),
  );
  base.route = [
    [0, 0.15, 4.5],
    [0, 0.15, 0],
    [-4.4, 1.55, -1],
    [0, 1.55, -3.6],
    [4.4, 1.55, -1],
    [4.4, 1.55, 2.5],
  ];
  return base;
}

function camposantoCloister(
  variant: number,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 9, 15], target: [0, 0.5, 0] },
    environment: 'historic-site',
    modelBasis: 'documented-floorplan',
    parts: [
      part('cloister-wing', [-5.6, 0.8, 0], [1.2, 1.6, 11], 'marble'),
      part('cloister-wing', [5.6, 0.8, 0], [1.2, 1.6, 11], 'marble'),
      part('cloister-wing', [0, 0.8, -5], [10, 1.6, 1.2], 'marble'),
      part('cloister-wing', [0, 0.8, 5], [10 + delta, 1.6, 1.2], 'marble'),
      part('burial-lawn', [0, 0.03, 0], [9.8, 0.08, 8.8], 'garden'),
      part('chapel', [0, 1.25, -5], [2.3, 2.5, 1.6], 'stone'),
    ],
    route: [
      [-5.6, 0.15, 4.2],
      [-5.6, 0.15, -4.2],
      [0, 0.15, -5],
      [5.6, 0.15, -2],
      [5.6, 0.15, 4.2],
    ],
  };
}

function dogesPalace(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const base = documentedGallery(variant, 'courtyard');
  base.parts.push(
    part(
      'giants-stair',
      [-1.9, 0.55, -2.8],
      [1.4, 1.1, 3],
      'marble',
      [-0.18, 0, 0],
    ),
    part('great-council-hall', [4.8, 1.5, 0], [2.1, 3 + delta, 7], 'marble'),
    part('sighs-passage', [6.5, 2.1, -2.5], [2.2, 0.8, 1], 'stone'),
    part('prison-block', [8, 1.5, -2.5], [2.2, 3, 3], 'brick'),
  );
  base.camera = { position: [15, 10, 16], target: [1.5, 1, 0] };
  base.route = [
    [-4.2, 0.15, 4.2],
    [0, 0.15, 0],
    [-1.9, 1, -2.8],
    [4.8, 1.7, 0],
    [3, 1.7, -3],
    [8, 1.7, -2.5],
  ];
  return base;
}

function basilicaWithCloister(
  variant: number,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const base = gothicCathedral(variant, false);
  base.parts.push(
    part('cloister-wing', [5.1, 0.8, 0], [1, 1.6, 6.2], 'stone'),
    part('cloister-wing', [3.4, 0.8, -3], [3.2, 1.6, 1], 'stone'),
    part('cloister-garden', [3.5, 0.04, 0], [2.5 + delta, 0.08, 5], 'garden'),
    part('roof-walk', [0, 2.6, 0.5], [4, 0.2, 7], 'marble'),
  );
  return base;
}

function santaMariaMar(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 8, 14], target: [0, 1.1, 0] },
    environment: 'plaza',
    modelBasis: 'documented-floorplan',
    parts: [
      part('wide-nave', [0, 1.4, 0], [6.2 + delta, 2.8, 10], 'stone'),
      part('side-aisle', [-3.4, 1, 0], [1.2, 2, 9.2], 'pale-stone'),
      part('side-aisle', [3.4, 1, 0], [1.2, 2, 9.2], 'pale-stone'),
      part('apse', [0, 1.4, -5], [5.8, 2.8, 2.4], 'stone'),
      part('rose-facade', [0, 1.8, 5], [7.2, 3.6, 0.7], 'pale-stone'),
      part('octagonal-tower', [-2.7, 2.7, -3.6], [1.1, 3.2, 1.1], 'stone'),
      part('octagonal-tower', [2.7, 2.7, -3.6], [1.1, 3.2, 1.1], 'stone'),
    ],
    route: [
      [0, 0.15, 5.6],
      [0, 0.15, 2],
      [-2.5, 0.15, 0],
      [0, 0.15, -4.5],
      [0, 0.15, 4.7],
      [3.4, 0.15, 1],
    ],
  };
}

function borgheseVilla(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 8, 14], target: [0, 1.1, 0] },
    environment: 'park',
    modelBasis: 'documented-floorplan',
    parts: [
      part('villa-core', [0, 1.35, 0], [7.2, 2.7, 5.5], 'pale-stone'),
      part('villa-wing', [-4.2, 1.1, 0], [1.8, 2.2, 4.5], 'marble'),
      part('villa-wing', [4.2, 1.1, 0], [1.8, 2.2, 4.5], 'marble'),
      part('portico', [0, 1, 3.1], [4.8 + delta, 2, 1.2], 'marble'),
      part('roof-pavilion', [0, 3, 0], [2.6, 0.8, 2.3], 'roof'),
      part('garden', [0, 0.02, 5], [11, 0.08, 3], 'garden'),
    ],
    route: [
      [0, 0.15, 5],
      [-3.2, 0.15, 1],
      [-1, 0.15, -1.5],
      [2.2, 0.15, -1],
      [3.8, 1.7, 0],
      [0, 0.15, 3.4],
    ],
  };
}

function gaudiGardenHouse(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [10, 8, 13], target: [0, 1, 0] },
    environment: 'park',
    modelBasis: 'documented-floorplan',
    parts: [
      part('garden', [0, 0.03, 0], [12, 0.08, 10], 'garden'),
      part('slender-villa', [0, 1.55, 0], [4.2 + delta, 3.1, 5.4], 'brick'),
      part('corner-tower', [-1.6, 2.7, -2], [0.9, 3.2, 0.9], 'pale-stone'),
      part('veranda', [0, 0.75, 3], [4.8, 1.5, 1.2], 'pale-stone'),
      part('garden-path', [0, 0.1, 4.5], [2.2, 0.14, 4], 'route'),
      part('ironwork', [2.7, 0.9, 2.6], [1.2, 1.8, 0.2], 'metal'),
    ],
    route: [
      [0, 0.15, 5],
      [0, 0.15, 2.5],
      [-1, 0.15, 0.8],
      [1, 1.7, -1],
      [-2.6, 0.15, 2.4],
    ],
  };
}

function linearBoulevard(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 9, 15], target: [0, 0.6, 0] },
    environment: 'urban',
    modelBasis: 'urban-topography',
    parts: [
      part('promenade', [0, 0.03, 0], [3.6 + delta, 0.08, 14], 'route'),
      part('street-wall', [-4.2, 1.6, 0], [3.6, 3.2, 14], 'brick'),
      part('street-wall', [4.2, 1.5, 0], [3.6, 3, 14], 'pale-stone'),
      ...[-5, -2.5, 0, 2.5, 5].flatMap((z) => [
        part('tree', [-1.35, 1, z], [0.5, 2, 0.5], 'garden'),
        part('tree', [1.35, 1, z], [0.5, 2, 0.5], 'garden'),
      ]),
      part('monument', [0, 1.8, 6.4], [0.8, 3.6, 0.8], 'marble'),
    ],
    route: [
      [0, 0.15, -6.5],
      [0, 0.15, -3.5],
      [0, 0.15, -1],
      [0, 0.15, 1.5],
      [0, 0.15, 4],
      [0, 0.15, 6.5],
    ],
  };
}

function elBornDistrict(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 9, 14], target: [0, 0.7, 0] },
    environment: 'urban',
    modelBasis: 'urban-topography',
    parts: [
      part('market-hall', [3.8, 1.5, -1.5], [5.2, 3, 7.2 + delta], 'metal'),
      part('glass-roof', [3.8, 3.2, -1.5], [5, 1, 7], 'glass'),
      part('promenade', [-1.5, 0.03, 0], [5.5, 0.08, 3], 'route'),
      part('church-facade', [-5.2, 1.6, -2], [1, 3.2, 4], 'stone', [
        0,
        Math.PI / 2,
        0,
      ]),
      part('memorial-plaza', [-4, 0.04, 2.6], [3.5, 0.08, 3], 'marble'),
      part('street-block', [-0.5, 1.2, -4.2], [3.5, 2.4, 2.2], 'brick'),
    ],
    route: [
      [-5.2, 0.15, -2],
      [-2.5, 0.15, 0],
      [0, 0.15, 0],
      [3.8, 0.15, -1.5],
      [6, 0.15, 2.5],
    ],
  };
}

function cologneOldTown(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 9, 14], target: [0, 0.8, 0] },
    environment: 'urban',
    modelBasis: 'urban-topography',
    parts: [
      part('market-square', [-2, 0.03, 1], [7, 0.08, 5], 'route'),
      part('town-hall', [-5, 1.8, -1.5], [2.4, 3.6, 4.2], 'pale-stone'),
      part(
        'town-hall-tower',
        [-5.2, 3.3, -1.5],
        [1.1, 4.2 + delta, 1.1],
        'stone',
      ),
      part('roman-church', [3.5, 1.6, -1.8], [4.2, 3.2, 5.5], 'brick'),
      part('crossing-tower', [3.5, 3.6, -1.8], [1.6, 3.4, 1.6], 'stone'),
      part('river-edge', [0, 0.02, 5], [13, 0.08, 2.4], 'water'),
    ],
    route: [
      [-4.5, 0.15, 1.5],
      [-5, 0.15, -1.5],
      [3.5, 0.15, -1.8],
      [2, 0.15, 2.8],
      [0, 0.15, 4.8],
    ],
  };
}

function vaticanBorgo(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [14, 9, 15], target: [0, 0.7, 0] },
    environment: 'urban',
    modelBasis: 'urban-topography',
    parts: [
      part('axial-avenue', [0, 0.03, 0], [3.2, 0.08, 13], 'route'),
      part('borgo-block', [-3.8, 1.4, -2.8], [4.2, 2.8, 5.2], 'brick'),
      part('borgo-block', [3.8, 1.25, -2.5], [4.2, 2.5, 5.8], 'pale-stone'),
      part('passetto-wall', [-4.8, 1.6, 3.8], [1, 3.2, 5], 'stone'),
      part('castle-rotunda', [4.5, 1.6, 5], [4 + delta, 3.2, 4], 'stone'),
      part('river-edge', [4.5, 0.02, 7], [8, 0.08, 2], 'water'),
    ],
    route: [
      [-4, 0.15, -4],
      [3.5, 0.15, -2.5],
      [-4.8, 0.15, 3.8],
      [0, 0.15, 2],
      [4.5, 0.15, 5],
    ],
  };
}

function feniceTheater(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const base = theater(variant);
  base.parts.push(
    part('canal-water', [5, -0.08, 0], [2.6, 0.12, 8], 'water'),
    part('water-gate', [4.1, 0.8, 2], [1, 1.6, 1.5], 'stone'),
    part('apollo-rooms', [-4.5, 1.2, 0], [2.2, 2.4, 5.5 + delta], 'pale-stone'),
  );
  base.camera = { position: [13, 8, 14], target: [0, 1.1, 0] };
  return base;
}

function odeonBookstore(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 7.5, 13], target: [0, 0.9, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts: [
      part('cinema-hall', [0, 1.4, 0], [8.5, 2.8, 9 + delta], 'pale-stone'),
      part('stage', [0, 0.6, -4.3], [5.5, 1.2, 1.4], 'route'),
      part('bookcase-grid', [-2.5, 0.8, 0], [1.4, 1.6, 5.5], 'brick'),
      part('bookcase-grid', [0, 0.8, 0], [1.4, 1.6, 5.5], 'brick'),
      part('bookcase-grid', [2.5, 0.8, 0], [1.4, 1.6, 5.5], 'brick'),
      part('balcony', [0, 2.2, 3.2], [7.8, 0.5, 2], 'marble'),
    ],
    route: [
      [0, 0.15, 5],
      [-2.5, 0.15, 1.8],
      [0, 0.15, 0],
      [0, 0.15, -4.2],
    ],
  };
}

function palauMusica(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [11, 8, 13], target: [0, 1.2, 0] },
    environment: 'interior',
    modelBasis: 'documented-floorplan',
    parts: [
      part('concert-hall', [0, 1.4, 0], [7.4, 2.8, 8.5], 'brick'),
      part('stage', [0, 0.7, -4], [5.4, 1.4, 1.4], 'marble'),
      part('organ-wall', [0, 2.3, -4.5], [4.2, 3.8, 0.5], 'metal'),
      part('side-gallery', [-3.5, 2.1, 0], [0.6, 1.1, 6.4], 'marble'),
      part('side-gallery', [3.5, 2.1, 0], [0.6, 1.1, 6.4], 'marble'),
      part('glass-dome', [0, 3.05, 0], [3.2 + delta, 1.7, 3.2], 'glass'),
    ],
    route: [
      [0, 0.15, 4.5],
      [-2.5, 1.8, 2.5],
      [0, 0.15, 1.5],
      [0, 0.15, -3.8],
      [2.8, 2.1, 0],
    ],
  };
}

function palatineHill(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 10, 14], target: [0, 1.1, 0] },
    environment: 'hillside',
    modelBasis: 'urban-topography',
    parts: [
      part('terrain', [0, 0.3, 0], [14, 2.3 + delta, 11], 'earth'),
      part('palace-ruin', [-3.8, 1.7, -1], [4.2, 2.1, 5], 'brick'),
      part('palace-ruin', [1.2, 2, -2], [5.5, 2.5, 4], 'stone'),
      part('stadium', [3.7, 1.45, 2.8], [5.2, 0.6, 2.3], 'route'),
      part('garden-terrace', [-3.5, 1.6, 3.2], [4, 0.3, 3], 'garden'),
      part('retaining-wall', [0, 0.8, 4.5], [11, 1.6, 0.5], 'brick'),
    ],
    route: [
      [-6, 0.4, 4],
      [-3.8, 1.8, -1],
      [1.2, 2.2, -2],
      [3.7, 1.6, 2.8],
      [-3.5, 1.8, 3.2],
    ],
  };
}

function turoBunkers(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 10, 14], target: [0, 1.3, 0] },
    environment: 'hillside',
    modelBasis: 'urban-topography',
    parts: [
      part('rocky-ridge', [0, 0.35, 0], [14, 2.6 + delta, 10], 'earth'),
      part('gun-platform', [-3.5, 1.65, 0], [3, 0.4, 3], 'stone'),
      part('gun-platform', [0, 1.85, -2], [3.2, 0.4, 3.2], 'stone'),
      part('gun-platform', [3.4, 1.55, 0.5], [3, 0.4, 3], 'stone'),
      part('bunker', [0, 1.2, 2.5], [4.2, 1.2, 2.5], 'brick'),
      part('settlement-trace', [-4.3, 1.1, 3], [3, 0.5, 2.2], 'route'),
    ],
    route: [
      [-5, 0.7, 4],
      [-3.5, 1.8, 0],
      [0, 1.95, -2],
      [0, 1.3, 2.5],
      [-5.5, 1.2, -2],
    ],
  };
}

function michelangeloBelvedere(
  variant: number,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  const base = hill(variant);
  base.parts = [
    part('hillside', [0, 0.25, 0], [14, 1.5 + delta, 10], 'garden'),
    part('belvedere-terrace', [0, 1.1, 0], [11, 0.3, 7], 'stone'),
    part('retaining-wall', [0, 0.65, 3.3], [11, 1.3, 0.5], 'stone'),
    part('david-monument', [0, 2.1, 0], [1.2, 3.2, 1.2], 'marble'),
    part('loggia', [0, 1.8, -3.2], [8, 2.8, 1.2], 'pale-stone'),
    part('ramp', [-5, 0.75, 2], [1.5, 1, 5], 'route', [0.15, 0, 0]),
  ];
  return base;
}

function piazzaVenezia(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 9, 15], target: [0, 1.1, 0] },
    environment: 'plaza',
    modelBasis: 'urban-topography',
    parts: [
      part('traffic-plaza', [0, 0.03, 2], [12, 0.08, 7], 'route'),
      part(
        'vittoriano-stair',
        [0, 0.7, -2],
        [8, 1.4, 4],
        'marble',
        [-0.12, 0, 0],
      ),
      part('vittoriano', [0, 2.3, -4], [9 + delta, 4.6, 2], 'marble'),
      part('colonnade', [0, 3.2, -3], [7, 1.8, 0.8], 'pale-stone'),
      part('equestrian-statue', [0, 1.5, 0], [1.3, 2.5, 1.3], 'metal'),
      part('venezia-palace', [-5.2, 1.7, 0], [3, 3.4, 5.5], 'brick'),
    ],
    route: [
      [-5, 0.15, 2],
      [0, 0.15, -2],
      [0, 0.15, 0],
      [5, 0.15, 2],
    ],
  };
}

function stMarkSquareModel(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [13, 9, 15], target: [0, 0.9, 0] },
    environment: 'plaza',
    modelBasis: 'urban-topography',
    parts: [
      part('long-plaza', [0, 0.03, 0], [8, 0.08, 14], 'route'),
      part('procuratie', [-4.4, 1.3, 0], [1.2, 2.6, 13], 'pale-stone'),
      part('procuratie', [4.4, 1.3, 0], [1.2, 2.6, 13], 'pale-stone'),
      part('basilica-facade', [0, 1.8, -6.5], [8.2 + delta, 3.6, 1], 'marble'),
      part('campanile', [3.4, 3.5, -4.8], [1.2, 7, 1.2], 'brick'),
      part('lagoon-edge', [0, 0.02, 7], [10, 0.08, 2], 'water'),
      part('column', [-1.2, 1.6, 6.2], [0.35, 3.2, 0.35], 'stone'),
      part('column', [1.2, 1.6, 6.2], [0.35, 3.2, 0.35], 'stone'),
    ],
    route: [
      [0, 0.15, -6],
      [3.4, 0.15, -4.8],
      [-3.8, 0.15, -2],
      [0, 0.15, 3],
      [0, 0.15, 6.5],
    ],
  };
}

function pisaCathedralModel(
  variant: number,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 9, 15], target: [0, 1.5, 0] },
    environment: 'plaza',
    modelBasis: 'landmark-massing',
    parts: [
      part('five-aisle-nave', [0, 1.25, 0], [6.5 + delta, 2.5, 10], 'marble'),
      part('transept', [0, 1.35, -2.6], [9, 2.7, 2.5], 'marble'),
      part('dome', [0, 2.8, -2.6], [3.4, 2.1, 3.4], 'roof'),
      part('apse', [0, 1.25, -5.2], [5, 2.5, 2.2], 'marble'),
      part('arcaded-facade', [0, 1.8, 5.2], [7.4, 3.6, 0.8], 'marble'),
      part('bronze-door', [0, 0.8, 5.65], [1.5, 1.6, 0.18], 'metal'),
    ],
    route: [
      [0, 0.15, 5.8],
      [0, 0.15, 1],
      [-2.6, 0.15, -1],
      [0, 0.15, -4.8],
      [2.8, 0.15, 2.5],
    ],
  };
}

function santaMariaGrazieModel(
  variant: number,
): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [12, 9, 14], target: [0, 1.5, 0] },
    environment: 'historic-site',
    modelBasis: 'documented-floorplan',
    parts: [
      part('gothic-nave', [-1.8, 1.1, 0.8], [3.4, 2.2, 8.5], 'brick'),
      part(
        'renaissance-tribune',
        [1.7, 1.6, -2],
        [5.2, 3.2, 5.2],
        'pale-stone',
      ),
      part('dome', [1.7, 3.3, -2], [4.8 + delta, 2.8, 4.8], 'roof'),
      part('apse', [1.7, 1.2, -5], [3.8, 2.4, 1.8], 'brick'),
      part('cloister', [4.6, 0.7, 1.5], [3.8, 1.4, 4.5], 'stone'),
      part('facade', [-1.8, 1.3, 5], [4.2, 2.6, 0.6], 'brick'),
    ],
    route: [
      [-1.8, 0.15, 5.3],
      [-1.8, 0.15, 1.5],
      [0, 0.15, 0],
      [1.7, 0.15, -2],
      [1.7, 0.15, -4.8],
      [4.6, 0.15, 1.5],
    ],
  };
}

function tiberRiver(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [14, 9, 15], target: [0, 0.5, 0] },
    environment: 'waterfront',
    modelBasis: 'urban-topography',
    parts: [
      part(
        'water',
        [0, -0.15, 0],
        [7 + delta, 0.12, 16],
        'water',
        [0, -0.12, 0],
      ),
      part('castle-rotunda', [-4.8, 1.8, -5], [4.3, 3.6, 4.3], 'stone'),
      part('bridge-arch', [-2.2, 0.8, -3.8], [6.8, 1.8, 1.4], 'marble', [
        0,
        Math.PI / 2,
        0,
      ]),
      part('bridge-arch', [1.2, 0.7, 1], [6.8, 1.6, 1.3], 'stone', [
        0,
        Math.PI / 2,
        0,
      ]),
      part('island', [0.7, 0.05, 5], [4.2, 0.25, 2.2], 'earth'),
      part('embankment', [-4.2, 0.4, 1.5], [1.2, 0.8, 13], 'stone'),
      part('embankment', [4.2, 0.4, -1.5], [1.2, 0.8, 13], 'stone'),
    ],
    route: [
      [-4.8, 0.15, -5],
      [-2.2, 0.15, -3.8],
      [-4, 0.55, 0],
      [1.2, 0.15, 1],
      [0.7, 0.15, 5],
    ],
  };
}

function seineRiver(variant: number): Omit<GuideModelRecipe, 'profile'> {
  const delta = fingerprintOffset(variant);
  return {
    camera: { position: [14, 9, 15], target: [0, 0.6, 0] },
    environment: 'waterfront',
    modelBasis: 'urban-topography',
    parts: [
      part('water', [0, -0.15, 0], [16, 0.12, 9 + delta], 'water'),
      part('island', [0, 0.05, 0], [10, 0.3, 4.3], 'earth'),
      part('cathedral-massing', [0, 1.5, 0], [5.2, 3, 6], 'pale-stone'),
      part('flying-buttress', [-3, 1.1, 0], [0.4, 2.2, 4.5], 'stone'),
      part('flying-buttress', [3, 1.1, 0], [0.4, 2.2, 4.5], 'stone'),
      part('bridge-deck', [-5.2, 0.45, 0], [4, 0.4, 1.3], 'stone'),
      part('bridge-deck', [5.2, 0.45, 0], [4, 0.4, 1.3], 'stone'),
      part('quay', [0, 0.3, -5.2], [15, 0.6, 1.2], 'stone'),
    ],
    route: [
      [-6.5, 0.45, 0],
      [-2.5, 0.15, 0],
      [0, 0.15, 0],
      [5.2, 0.45, 0],
      [0, 0.45, -5.2],
    ],
  };
}

function defaultModel(
  type: GuideSpatialType,
  variant: number,
): Omit<GuideModelRecipe, 'profile'> {
  if (type === 'floorplan') return documentedGallery(variant, 'linear');
  if (type === 'district') return urbanDistrict(variant);
  if (type === 'viewpoints') return plaza(variant);
  return courtyardPalace(variant);
}

const definitions: Record<string, { factory: ModelFactory; label: string }> = {
  'galleria-vittorio': { factory: galleriaArcade, label: 'cross-glass-arcade' },
  'milan-duomo': {
    factory: (v) => gothicCathedral(v, true),
    label: 'milan-gothic-terraces',
  },
  'la-scala-evening': { factory: theater, label: 'la-scala-auditorium' },
  'la-scala': { factory: theater, label: 'la-scala-auditorium-and-museum' },
  'last-supper': {
    factory: (v) => documentedGallery(v, 'linear'),
    label: 'cenacolo-refectory',
  },
  'santa-maria-grazie': {
    factory: santaMariaGrazieModel,
    label: 'grazie-basilica',
  },
  sforza: { factory: courtyardPalace, label: 'sforza-castle-courtyards' },
  brera: { factory: breraGallery, label: 'brera-courtyard-gallery' },
  'la-scala-museum': { factory: theater, label: 'la-scala-museum-boxes' },
  'ponte-vecchio': { factory: stoneBridge, label: 'ponte-vecchio-shops' },
  'doges-palace': { factory: dogesPalace, label: 'doges-palace-courtyard' },
  'bridge-of-sighs': {
    factory: enclosedBridge,
    label: 'bridge-of-sighs-enclosed',
  },
  'st-mark-campanile': { factory: landmarkTower, label: 'san-marco-campanile' },
  'st-mark-square': { factory: stMarkSquareModel, label: 'piazza-san-marco' },
  correr: {
    factory: (v) => documentedGallery(v, 'palace'),
    label: 'correr-napoleonic-wing',
  },
  'st-mark-basilica': {
    factory: stMarkBasilica,
    label: 'san-marco-five-domes',
  },
  rialto: { factory: rialtoBridge, label: 'rialto-single-arch' },
  'grand-canal': { factory: canal, label: 'grand-canal-palazzi' },
  fenice: { factory: feniceTheater, label: 'fenice-auditorium' },
  'accademia-venice': {
    factory: accademiaVenice,
    label: 'venice-accademia-galleries',
  },
  gondola: { factory: gondolaModel, label: 'gondola-canal-route' },
  'florence-duomo': {
    factory: florenceDuomo,
    label: 'brunelleschi-dome-route',
  },
  'leaning-tower': { factory: leaningTower, label: 'pisa-leaning-campanile' },
  'pisa-cathedral': {
    factory: pisaCathedralModel,
    label: 'pisa-cathedral-transept',
  },
  'pisa-baptistery': {
    factory: (v) => ({
      ...pantheon(),
      parts: [
        part('baptistery-drum', [0, 1.7, 0], [5.6, 3.4, 5.6], 'marble'),
        part('conical-dome', [0, 4, 0], [5.4, 3.2, 5.4], 'roof'),
        part('column-ring', [0, 2.2, 0], [6, 1.2, 6], 'pale-stone'),
        part('font', [0, 0.45, 0], [1.7, 0.9, 1.7], 'marble'),
        part('pulpit', [1.9, 0.8, -0.8], [1, 1.6, 1], 'stone'),
      ],
      route: [
        [0, 0.15, 3.6],
        [0, 0.15, 0],
        [1.9, 0.15, -0.8],
        [0, 2.6 + fingerprintOffset(v), 0],
      ],
    }),
    label: 'pisa-baptistery-ring',
  },
  camposanto: { factory: camposantoCloister, label: 'camposanto-cloister' },
  sinopie: { factory: sinopieHall, label: 'sinopie-long-hall' },
  'opera-pisa': {
    factory: (v) => documentedGallery(v, 'courtyard'),
    label: 'opera-pisa-courtyard',
  },
  'piazzale-michelangelo': {
    factory: michelangeloBelvedere,
    label: 'michelangelo-belvedere',
  },
  'accademia-florence': {
    factory: accademiaFlorence,
    label: 'accademia-david-tribune',
  },
  'mercato-centrale': {
    factory: (v) => ({
      ...documentedGallery(v, 'courtyard'),
      environment: 'urban',
      parts: [
        part('market-hall', [0, 1.4, 0], [9, 2.8, 7], 'metal'),
        part('glass-roof', [0, 3, 0], [8.6, 1, 6.6], 'glass'),
        part('stall-grid', [-2.8, 0.5, 0], [2.2, 1, 5], 'brick'),
        part('stall-grid', [0, 0.5, 0], [2.2, 1, 5], 'pale-stone'),
        part('stall-grid', [2.8, 0.5, 0], [2.2, 1, 5], 'brick'),
      ],
    }),
    label: 'mercato-iron-hall',
  },
  'medici-chapels': {
    factory: mediciChapels,
    label: 'medici-octagonal-chapels',
  },
  signoria: { factory: plaza, label: 'signoria-sculpture-plaza' },
  'giunti-odeon': { factory: odeonBookstore, label: 'odeon-bookstore-theater' },
  uffizi: {
    factory: (v) => documentedGallery(v, 'u-shape'),
    label: 'uffizi-u-plan',
  },
  'vasari-corridor': {
    factory: (v) => ({
      ...stoneBridge(v),
      modelBasis: 'documented-floorplan',
      parts: [
        part(
          'elevated-corridor',
          [-4.5, 2.5, -1.5],
          [6, 0.9, 1.1],
          'pale-stone',
        ),
        part(
          'elevated-corridor',
          [0, 2.5, 0],
          [5, 0.9, 1.1],
          'pale-stone',
          [0, -0.45, 0],
        ),
        part('elevated-corridor', [4.2, 2.5, 1.5], [5, 0.9, 1.1], 'pale-stone'),
        part('bridge-deck', [0, 1.2, 0], [8, 0.5, 2.4], 'stone'),
        part('water', [0, -0.15, 0], [14, 0.12, 8], 'water'),
      ],
      route: [
        [-7, 2.6, -1.5],
        [-4, 2.6, -1.5],
        [0, 2.6, 0],
        [4, 2.6, 1.5],
        [7, 2.6, 1.5],
      ],
    }),
    label: 'vasari-elevated-corridor',
  },
  pitti: {
    factory: (v) => documentedGallery(v, 'palace'),
    label: 'pitti-palace-floors',
  },
  pantheon: { factory: pantheon, label: 'pantheon-rotunda-portico' },
  borghese: { factory: borgheseVilla, label: 'borghese-room-number-plan' },
  colosseum: { factory: colosseum, label: 'colosseum-hypogeum-arena' },
  'roman-forum': { factory: ruins, label: 'forum-sacra-via' },
  palatine: { factory: palatineHill, label: 'palatine-palace-hill' },
  'piazza-venezia': {
    factory: piazzaVenezia,
    label: 'venezia-vittoriano-axis',
  },
  trevi: { factory: fountain, label: 'trevi-palazzo-basin' },
  'spanish-steps': { factory: steppedMonument, label: 'spanish-steps-axis' },
  'piazza-navona': { factory: navonaPlaza, label: 'navona-stadium-axis' },
  'st-peters-square': {
    factory: stPetersSquare,
    label: 'st-peters-elliptical-colonnade',
  },
  'vatican-museums': {
    factory: vaticanMuseumsExterior,
    label: 'vatican-belvedere-courtyards',
  },
  'st-peters-basilica': {
    factory: stPetersBasilica,
    label: 'st-peters-basilica-dome',
  },
  'vatican-post': {
    factory: documentedGallery,
    label: 'vatican-post-counter-hall',
  },
  'vatican-surroundings': {
    factory: vaticanBorgo,
    label: 'borgo-street-network',
  },
  tiber: { factory: tiberRiver, label: 'tiber-river-bridges' },
  trastevere: { factory: urbanDistrict, label: 'trastevere-street-plazas' },
  'sagrada-familia': { factory: sagradaFamilia, label: 'sagrada-spires-nave' },
  'gaudi-house': {
    factory: gaudiGardenHouse,
    label: 'gaudi-house-garden-plan',
  },
  'park-guell': { factory: park, label: 'park-guell-monumental-zone' },
  'turo-rovira': { factory: turoBunkers, label: 'rovira-bunker-ridge' },
  'la-pedrera': {
    factory: (v) => houseModel(v, 'mila'),
    label: 'casa-mila-courtyards-roof',
  },
  'casa-batllo': {
    factory: (v) => houseModel(v, 'batllo'),
    label: 'casa-batllo-lightwell-roof',
  },
  'palau-musica': { factory: palauMusica, label: 'palau-musica-auditorium' },
  'barcelona-cathedral': {
    factory: basilicaWithCloister,
    label: 'barcelona-cathedral-cloister',
  },
  'picasso-barcelona': {
    factory: (v) => documentedGallery(v, 'courtyard'),
    label: 'picasso-five-palaces',
  },
  'santa-maria-mar': {
    factory: santaMariaMar,
    label: 'santa-maria-mar-wide-nave',
  },
  'el-born': { factory: elBornDistrict, label: 'born-market-street-axis' },
  barceloneta: { factory: beachModel, label: 'barceloneta-beachfront' },
  'gothic-quarter': { factory: urbanDistrict, label: 'gothic-quarter-lanes' },
  'la-rambla': { factory: linearBoulevard, label: 'rambla-linear-promenade' },
  'museum-ludwig': {
    factory: (v) => documentedGallery(v, 'u-shape'),
    label: 'ludwig-museum-levels',
  },
  hohenzollern: { factory: hohenzollern, label: 'hohenzollern-three-arches' },
  'koln-triangle': {
    factory: (v) => landmarkTower(v, true),
    label: 'koln-triangle-glass-tower',
  },
  'cologne-cathedral': {
    factory: cologneCathedral,
    label: 'cologne-cathedral-twin-spires',
  },
  'cologne-old-town': {
    factory: cologneOldTown,
    label: 'cologne-old-town-markets',
  },
  rheinauhafen: {
    factory: (v) => waterfront(v, true),
    label: 'rheinauhafen-crane-houses',
  },
  'chocolate-museum': {
    factory: documentedGallery,
    label: 'chocolate-museum-production-line',
  },
  'notre-dame-towers': {
    factory: notreDameTowers,
    label: 'notre-dame-twin-tower-loop',
  },
  seine: { factory: seineRiver, label: 'seine-island-quays' },
};

export function buildGuideModel(
  slug: string,
  type: GuideSpatialType,
): GuideModelRecipe {
  const slugs = Object.keys(definitions);
  const definition = definitions[slug];
  const variant = Math.max(1, slugs.indexOf(slug) + 1);
  const model = definition?.factory(variant) ?? defaultModel(type, variant);
  return {
    ...model,
    modelBasis:
      type === 'floorplan' ? 'documented-floorplan' : model.modelBasis,
    profile: `${slug}:${definition?.label ?? `${type}-fallback`}`,
  };
}
