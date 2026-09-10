import type * as ThreeType from 'three';
import type { Vec3 } from './guide-3d-models';

type Merge = (
  geometries: ThreeType.BufferGeometry[],
  useGroups?: boolean,
) => ThreeType.BufferGeometry | null;

// Source-reviewed facade silhouettes, not interiors or surveying geometry.
// The drawing controls and scope are recorded in sources/exteriors/review.md.
export function buildDetailedExterior(
  THREE: typeof ThreeType,
  merge: Merge,
  slug: string,
) {
  if (!['sagrada-familia', 'casa-batllo', 'pantheon'].includes(slug)) return undefined;
  const group = new THREE.Group();
  const batches = new Map<number, ThreeType.BufferGeometry[]>();
  const featureCounts: Record<string, number> = {};
  const stone = 0xc9b89a,
    light = 0xeadfc5,
    shadow = 0x304b4e,
    green = 0x668780;
  function add(
    kind: string,
    geometry: ThreeType.BufferGeometry,
    color: number,
    at: Vec3 = [0, 0, 0],
    scale: Vec3 = [1, 1, 1],
    rotation: Vec3 = [0, 0, 0],
  ) {
    geometry.deleteAttribute('uv');
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...at),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...scale),
    );
    geometry.applyMatrix4(matrix);
    const list = batches.get(color) ?? [];
    const unindexed = geometry.index ? geometry.toNonIndexed() : geometry;
    if (unindexed !== geometry) geometry.dispose();
    list.push(unindexed);
    batches.set(color, list);
    featureCounts[kind] = (featureCounts[kind] ?? 0) + 1;
  }
  const box = (
    kind: string,
    at: Vec3,
    scale: Vec3,
    color = stone,
    rotation?: Vec3,
  ) => add(kind, new THREE.BoxGeometry(1, 1, 1), color, at, scale, rotation);
  function tube(
    kind: string,
    points: Vec3[],
    radius: number,
    color = light,
    closed = false,
  ) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      closed,
    );
    add(
      kind,
      new THREE.TubeGeometry(
        curve,
        Math.max(24, points.length * 5),
        radius,
        6,
        closed,
      ),
      color,
    );
  }
  function oval(
    kind: string,
    at: Vec3,
    width: number,
    height: number,
    color = light,
  ) {
    const pts: Vec3[] = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return [
        at[0] + (Math.cos(a) * width) / 2,
        at[1] + (Math.sin(a) * height) / 2,
        at[2],
      ];
    });
    tube(kind, pts, 0.04, color, true);
  }
  function cross(at: Vec3, size: number) {
    box('cross', at, [size * 0.22, size, size * 0.22], light);
    box(
      'cross-arm',
      [at[0], at[1] + size * 0.12, at[2]],
      [size * 0.8, size * 0.2, size * 0.2],
      light,
    );
    box(
      'cross-arm',
      [at[0], at[1] + size * 0.12, at[2]],
      [size * 0.2, size * 0.2, size * 0.8],
      light,
    );
  }
  function star(at: Vec3, size: number) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2,
        r = (i % 2 ? 0.3 : 0.5) * size;
      const x = Math.sin(a) * r,
        y = Math.cos(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    add(
      'mary-star',
      new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false }),
      light,
      at,
    );
  }
  if (slug === 'sagrada-familia') {
    // Booklet 10, p.2: the two built apostle groups flank the crossing;
    // they are not two rows across the front/back ends of the nave.
    box('nave', [0, 1.4, 0.7], [4.3, 2.8, 7.7]);
    box('transept', [0, 1.55, -1], [6.2, 3.1, 2.8]);
    add(
      'apse',
      new THREE.CylinderGeometry(2.15, 2.15, 2.8, 14),
      stone,
      [0, 1.4, -3.15],
      [1, 1, 0.7],
    );
    for (const x of [-2.08, 2.08]) {
      for (let bay = 0; bay < 6; bay++) {
        const z = -2.7 + bay * 1.14;
        box('aisle-pier', [x, 1.45, z], [0.16, 2.9, 0.2], light);
        box(
          'aisle-window',
          [x * 1.025, 1.62, z + 0.4],
          [0.035, 1.32, 0.48],
          shadow,
        );
        add('aisle-pinnacle', new THREE.ConeGeometry(0.22, 1.3, 8), light, [
          x,
          3.32,
          z,
        ]);
        add(
          'fruit-finial',
          new THREE.SphereGeometry(0.13, 10, 8),
          bay % 2 ? 0xc7a04d : 0x809772,
          [x, 4.03, z],
        );
      }
    }
    // These repetitions describe the louvred/ribbed silhouette, not an exact
    // census of openings. The official source specifies 12/14 vertical ribs.
    function tower(
      name: string,
      x: number,
      z: number,
      height: number,
      radius: number,
      base: number,
      ribs: number,
    ) {
      const h = height - base;
      const radial = (t: number) => radius * Math.sqrt(Math.max(0.012, 1 - t));
      const profile = Array.from(
        { length: 32 },
        (_, i) => new THREE.Vector2(radial(i / 31) * 0.83, (h * i) / 31),
      );
      add(name, new THREE.LatheGeometry(profile, 32), shadow, [x, base, z]);
      for (let i = 0; i < ribs; i++) {
        const a = (i / ribs) * Math.PI * 2;
        const points: Vec3[] = Array.from({ length: 20 }, (_, j) => {
          const t = j / 19,
            r = radial(t);
          return [x + Math.cos(a) * r, base + h * t, z + Math.sin(a) * r];
        });
        tube(
          'tower-rib',
          points,
          radius * 0.09,
          name === 'nativity-tower' ? stone : light,
        );
      }
      for (let row = 1; row < 22; row++) {
        const t = row / 22,
          r = radial(t) * 0.93;
        add(
          'louvre-band',
          new THREE.TorusGeometry(r, 0.029, 4, 32),
          stone,
          [x, base + h * t, z],
          [1, 1, 1],
          [Math.PI / 2, 0, 0],
        );
      }
    }
    for (const side of [-1, 1]) {
      [-2.55, -1.55, -0.45, 0.55].forEach((z, index) => {
        const h = [5.22, 5.7, 5.7, 5.22][index] + (side < 0 ? 0.25 : 0);
        tower(
          side > 0 ? 'nativity-tower' : 'passion-tower',
          side * 2.6,
          z,
          h,
          0.35,
          1.7,
          side > 0 ? 12 : 14,
        );
        add(
          'apostle-pinnacle',
          new THREE.SphereGeometry(0.12, 10, 8),
          index % 2 ? 0x799d9a : 0xc7a04d,
          [side * 2.6, h + 0.14, z],
          [0.85, 1.5, 0.85],
        );
      });
    }
    for (const x of [-0.9, 0.9])
      for (const z of [-1.8, -0.25]) {
        tower('evangelist-tower', x, z, 7.05, 0.44, 2.8, 8);
        add(
          'evangelist-terminal',
          new THREE.OctahedronGeometry(0.17),
          light,
          [x, 7.25, z],
          [0.8, 1.5, 0.8],
        );
      }
    tower('mary-tower', 0, -3.2, 7.12, 0.61, 2.8, 14);
    star([0, 7.43, -3.2], 0.58);
    tower('jesus-tower', 0, -1, 8.39, 0.73, 3.0, 12);
    cross([0, 8.85, -1], 0.84);
    // The not-yet-built Glory towers are intentionally absent from this
    // 2026 exterior state, not represented as four invented finished spires.
    box('glory-entrance', [0, 1.12, 4.59], [3.8, 2.24, 0.12], stone);
    for (const x of [-1.35, -0.45, 0.45, 1.35])
      box('glory-door', [x, 0.72, 4.68], [0.6, 1.42, 0.06], green);
    for (const side of [-1, 1]) {
      for (let arch = 0; arch < 3; arch++) {
        const z = -2.4 + arch * 1.07;
        tube(
          'facade-portal',
          [
            [side * 3.12, 0, z - 0.42],
            [side * 3.12, 1.05, z - 0.4],
            [side * 3.12, 1.9, z],
            [side * 3.12, 1.05, z + 0.4],
            [side * 3.12, 0, z + 0.42],
          ],
          0.11,
          light,
        );
      }
    }
  } else if (slug === 'casa-batllo') {
    // Hiroya Tanaka's 1990 front elevation: source x 305..930, ground y1595.
    const point = (x: number, y: number, z = 0.06): Vec3 => [
      (x - 617.5) / 100,
      (1595 - y) / 100,
      z,
    ];
    box('rear-massing', [0, 4.8, -2.4], [6.25, 9.6, 4.8], stone);
    const face = new THREE.Shape();
    const outline = [
      [305, 1595],
      [305, 620],
      [410, 558],
      [470, 549],
      [523, 519],
      [556, 478],
      [594, 464],
      [635, 472],
      [678, 500],
      [724, 527],
      [805, 552],
      [877, 592],
      [930, 620],
      [930, 1595],
    ];
    outline.forEach(([x, y], i) => {
      const p = point(x, y);
      if (i === 0) face.moveTo(p[0], p[1]);
      else face.lineTo(p[0], p[1]);
    });
    face.closePath();
    add(
      'mosaic-facade',
      new THREE.ExtrudeGeometry(face, { depth: 0.16, bevelEnabled: false }),
      0xadc3af,
    );
    const xs = [384, 524, 692, 842];
    function window(
      x: number,
      y: number,
      w: number,
      h: number,
      organic = false,
    ) {
      const p = point(x, y, 0.19);
      if (organic) {
        add('bay-glass', new THREE.SphereGeometry(0.5, 24, 16), shadow, p, [
          w,
          h,
          0.18,
        ]);
        oval('bay-stone-frame', [p[0], p[1], 0.34], w, h, light);
      } else {
        box('window-frame', p, [w + 0.12, h + 0.12, 0.12], light);
        box('window-glass', [p[0], p[1], 0.28], [w, h, 0.07], shadow);
        for (const dx of [-0.28, 0.28])
          box(
            'shutter',
            [p[0] + dx * w, p[1], 0.34],
            [w * 0.3, h, 0.06],
            green,
          );
      }
      box('window-mullion', [p[0], p[1], 0.37], [0.035, h, 0.04], green);
      box(
        'window-crossbar',
        [p[0], p[1] + h * 0.08, 0.37],
        [w, 0.035, 0.04],
        green,
      );
    }
    xs.forEach((x) => [700, 842, 993].forEach((y) => window(x, y, 0.63, 0.88)));
    // Ground doors, the projecting noble-floor bay and its bone-like columns.
    [370, 511, 615, 718, 847].forEach((x, i) =>
      window(x, 1510, i === 0 ? 1.12 : 0.88, 1.55, true),
    );
    [376, 510, 616, 721, 850].forEach((x, i) =>
      window(x, 1310, i === 0 || i === 4 ? 0.96 : 1.18, 1.5, true),
    );
    [449, 551, 655, 774].forEach((x) =>
      tube(
        'bone-column',
        [
          point(x, 1410, 0.37),
          point(x - 6, 1320, 0.55),
          point(x + 3, 1225, 0.37),
        ],
        0.045,
        light,
      ),
    );
    window(384, 1150, 0.72, 1.32, true);
    window(842, 1150, 0.72, 1.32, true);
    window(524, 1134, 0.65, 1.0);
    window(692, 1134, 0.65, 1.0);
    const masks = [
      [384, 739],
      [842, 754],
      [384, 895],
      [524, 895],
      [692, 895],
      [842, 895],
      [524, 1042],
      [692, 1042],
    ];
    for (const [x, y] of masks) {
      const p = point(x, y, 0.55),
        shell = new THREE.Shape();
      shell.moveTo(-0.53, 0.25);
      shell.bezierCurveTo(-0.27, 0.17, -0.12, 0.37, 0, 0.26);
      shell.bezierCurveTo(0.18, 0.35, 0.3, 0.14, 0.53, 0.25);
      shell.bezierCurveTo(0.49, -0.04, 0.34, -0.28, 0, -0.25);
      shell.bezierCurveTo(-0.36, -0.28, -0.51, -0.04, -0.53, 0.25);
      for (const x of [-0.23, 0.23]) {
        const hole = new THREE.Path();
        hole.absellipse(x, 0.015, 0.175, 0.105, 0, Math.PI * 2, true, 0);
        shell.holes.push(hole);
      }
      add(
        'mask-balcony',
        new THREE.ExtrudeGeometry(shell, {
          depth: 0.11,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.025,
          bevelThickness: 0.025,
        }),
        light,
        p,
      );
      add(
        'balcony-base',
        new THREE.SphereGeometry(0.5, 20, 10),
        stone,
        [p[0], p[1] - 0.25, p[2] - 0.04],
        [0.94, 0.25, 0.6],
      );
      for (const dx of [-0.34, -0.23, -0.12, 0.12, 0.23, 0.34])
        box(
          'balcony-iron',
          [p[0] + dx, p[1] + 0.02, p[2] + 0.06],
          [0.018, 0.19, 0.025],
          shadow,
        );
    }
    window(617, 555, 0.42, 0.65);
    const tulip = point(617, 620, 0.47);
    oval('tulip-balcony', tulip, 0.53, 0.6, light);
    for (const dx of [-0.17, 0, 0.17])
      tube(
        'tulip-rib',
        [
          [tulip[0] + dx, tulip[1] - 0.25, 0.47],
          [tulip[0] + dx * 0.5, tulip[1], 0.6],
          [tulip[0] + dx, tulip[1] + 0.25, 0.47],
        ],
        0.038,
        light,
      );
    // Organic roof crest follows the independent elevation, not a cone.
    const roofOutline = [
      [305, 620],
      [305, 468],
      [393, 428],
      [470, 398],
      [525, 288],
      [585, 250],
      [640, 258],
      [696, 311],
      [755, 379],
      [798, 351],
      [875, 393],
      [930, 470],
      [930, 620],
      [805, 552],
      [724, 527],
      [635, 472],
      [594, 464],
      [556, 478],
      [523, 519],
      [470, 549],
      [410, 558],
    ];
    const roof = new THREE.Shape();
    roofOutline.forEach(([x, y], i) => {
      const p = point(x, y);
      if (i === 0) roof.moveTo(p[0], p[1]);
      else roof.lineTo(p[0], p[1]);
    });
    roof.closePath();
    add(
      'dragon-roof',
      new THREE.ExtrudeGeometry(roof, {
        depth: 1.05,
        bevelEnabled: true,
        bevelSize: 0.05,
        bevelThickness: 0.05,
        bevelSegments: 2,
      }),
      0x598e8c,
      [0, 0, -0.95],
    );
    const crest = [
      [305, 468],
      [393, 428],
      [470, 398],
      [525, 288],
      [585, 250],
      [640, 258],
      [696, 311],
      [755, 379],
      [798, 351],
      [875, 393],
      [930, 470],
    ].map(([x, y]) => point(x, y, 0.16));
    tube('roof-ridge', crest, 0.11, 0x387f7e);
    const ridgeCurve = new THREE.CatmullRomCurve3(
      crest.map((p) => new THREE.Vector3(...p)),
    );
    for (let i = 0; i < 35; i++)
      add(
        'ridge-cap',
        new THREE.SphereGeometry(0.13, 12, 8),
        i % 3 ? 0x4c8c86 : 0x99a987,
        ridgeCurve.getPoint(i / 34).toArray() as Vec3,
        [1, 0.75, 1],
      );
    const turret = point(477, 449, -0.02);
    add(
      'cross-turret',
      new THREE.CylinderGeometry(0.28, 0.34, 1.58, 32),
      light,
      [turret[0], turret[1] + 0.12, turret[2]],
    );
    const bulb = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.47, 0.08),
      new THREE.Vector2(0.52, 0.34),
      new THREE.Vector2(0.3, 0.74),
      new THREE.Vector2(0.14, 1.13),
      new THREE.Vector2(0.09, 1.42),
    ];
    add('turret-bulb', new THREE.LatheGeometry(bulb, 32), light, [
      turret[0],
      turret[1] + 0.87,
      turret[2],
    ]);
    cross([turret[0], turret[1] + 2.55, turret[2]], 0.7);
    // Ceramic discs: material pattern only, never labelled architectural facts.
    for (let row = 0; row < 28; row++)
      for (let col = 0; col < 20; col++) {
        const x = -3 + col * 0.31 + 0.08 * Math.sin(row * 3 + col),
          y = 4 + row * 0.25;
        if (
          y > 9.8 ||
          (xs.some((px) => Math.abs(point(px, 0)[0] - x) < 0.47) &&
            [700, 842, 993, 1134].some(
              (py) => Math.abs(point(0, py)[1] - y) < 0.55,
            ))
        )
          continue;
        add(
          'ceramic-disc',
          new THREE.CircleGeometry(0.035 + (col % 3) * 0.016, 8),
          [0x6a94a0, 0xc1c394, 0x839c96, 0xd4c5ae][(row + col) % 4],
          [x, y, 0.18],
        );
      }
  } else if (slug === 'pantheon') {
    const brick = 0xad8069, roofMetal = 0x9ba79e;
    // Soane plan 45/3/52: the column centers are traced, not equally
    // distributed over a box. Plan x points toward the northern entrance.
    const planPoint = (u: number, v: number): Vec3 => [
      (280 - v) * 0.022,
      0,
      (u - 370) * 0.022,
    ];
    const columns: [number, number][] = [
      ...[144, 183, 222, 261, 302, 341, 380, 418].map(v => [774, v] as [number, number]),
      ...[144, 222, 341, 418].map(v => [736, v] as [number, number]),
      ...[144, 222, 341, 418].map(v => [697, v] as [number, number]),
    ];
    box('portico-stylobate', [0, 0.08, 7.87], [6.85, 0.16, 2.7], light);
    for (const [u, v] of columns) {
      const [x, , z] = planPoint(u, v);
      box('column-plinth', [x, 0.2, z], [0.42, 0.13, 0.42], light);
      add('column-base', new THREE.CylinderGeometry(0.21, 0.24, 0.13, 24), light, [x, 0.33, z]);
      add(u === 774 ? 'front-granite-column' : 'rear-granite-column',
        new THREE.CylinderGeometry(0.155, 0.185, 2.3, 32), u === 774 ? 0x858780 : 0xa88f84, [x, 1.53, z]);
      add('corinthian-capital', new THREE.CylinderGeometry(0.24, 0.17, 0.32, 8), light, [x, 2.82, z]);
      box('capital-abacus', [x, 3.01, z], [0.49, 0.09, 0.49], light);
      for (let leaf = 0; leaf < 8; leaf++) {
        const a = leaf * Math.PI / 4;
        add('capital-leaf', new THREE.SphereGeometry(0.055, 6, 5), stone,
          [x + 0.16 * Math.cos(a), 2.77, z + 0.16 * Math.sin(a)], [1, 2.6, 1]);
      }
    }
    const front = 9.13, back = 6.45;
    box('portico-entablature-front', [0, 3.24, front], [6.85, 0.38, 0.29], light);
    box('portico-cornice-front', [0, 3.48, front], [7, 0.11, 0.39], light);
    for (const x of [-3.23, 3.23]) {
      box('portico-side-entablature', [x, 3.24, (front + back) / 2], [0.3, 0.38, front - back], light);
      box('portico-side-cornice', [x, 3.48, (front + back) / 2], [0.4, 0.11, front - back], light);
    }
    const pediment = new THREE.Shape();
    pediment.moveTo(-3.5, 3.53); pediment.lineTo(3.5, 3.53); pediment.lineTo(0, 4.95); pediment.closePath();
    add('front-pediment', new THREE.ExtrudeGeometry(pediment, { depth: 0.17, bevelEnabled: false }), light, [0, 0, front]);
    // The pitched roof is an exterior shell above the open porch, never a
    // floor-to-ceiling portico block. A traced section governs its height.
    const roof = new THREE.Shape();
    roof.moveTo(-3.5, 3.58); roof.lineTo(0, 5); roof.lineTo(3.5, 3.58); roof.lineTo(3.4, 3.54); roof.lineTo(0, 4.85); roof.lineTo(-3.4, 3.54); roof.closePath();
    add('portico-pitched-roof', new THREE.ExtrudeGeometry(roof, { depth: front - back, bevelEnabled: false }), 0x97654a, [0, 0, back]);
    for (const side of [-1, 1]) {
      tube('pediment-raking-cornice', [[side * 3.54, 3.58, front + 0.21], [0, 5.02, front + 0.21]], 0.065, light);
    }
    for (let tile = 0; tile < 32; tile++) {
      const x = -3.4 + tile * 6.8 / 31;
      const y = 5 - Math.abs(x) * 1.42 / 3.5;
      box('roof-tile-joint', [x, y + 0.018, (front + back) / 2], [0.023, 0.025, front - back], stone);
    }
    // Vestibule flanks leave the actual central approach open.
    for (const x of [-2.2, 2.2]) box('intermediate-side-block', [x, 2.93, 5.66], [2.24, 5.86, 1.75], brick);
    box('intermediate-door-head', [0, 3.91, 5.66], [2.16, 3.9, 1.75], brick);
    box('bronze-door', [0, 0.95, 5.88], [0.98, 1.9, 0.09], 0x44665a);
    box('door-lintel', [0, 2.01, 6.02], [1.36, 0.17, 0.22], light);
    for (const x of [-0.62, 0.62]) box('door-jamb', [x, 1.02, 6.02], [0.18, 2.04, 0.22], light);
    for (const x of [-0.25, 0.25]) for (const y of [0.46, 1.34]) box('bronze-door-panel', [x, y, 5.94], [0.33, 0.56, 0.04], green);
    const drumProfile = [new THREE.Vector2(4.28, 0), new THREE.Vector2(5.42, 0), new THREE.Vector2(5.42, 5.84), new THREE.Vector2(4.83, 5.84), new THREE.Vector2(4.28, 4.24), new THREE.Vector2(4.28, 0)];
    add('brick-rotunda', new THREE.LatheGeometry(drumProfile, 128), brick);
    for (const y of [0.28, 2.75, 5.69]) add('drum-cornice', new THREE.TorusGeometry(5.43, 0.08, 4, 128), stone, [0, y, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
    // Piranesi 1786 longitudinal section: preserve equal-axis profile,
    // including the stepped haunch. No extra towers or closed oculus cap.
    const outline = [[232, 483], [274, 483], [274, 434], [306, 434], [306, 419], [326, 419], [326, 404], [346, 404], [346, 387], [366, 387], [366, 370], [386, 370], [386, 355], [406, 355], [406, 337], [432, 337], [478, 300], [524, 270], [568, 245], [612, 224], [612, 214], [647, 214], [647, 245]];
    const profile = outline.map(([u, v]) => new THREE.Vector2((724 - u) * 0.0108, (1025 - v) * 0.0108));
    const innerR = 4.27, spring = 4.22;
    for (let i = 0; i <= 40; i++) {
      const a = 0.2 + (Math.PI / 2 - 0.2) * i / 40;
      profile.push(new THREE.Vector2(innerR * Math.sin(a), spring + innerR * Math.cos(a)));
    }
    profile.push(new THREE.Vector2(5.3136, 5.8536));
    add('stepped-dome-with-open-oculus', new THREE.LatheGeometry(profile, 160), roofMetal);
    group.userData.oculusRadius = (724 - 647) * 0.0108;
    group.userData.porticoColumnCenters = columns.map(([u, v]) => planPoint(u, v));
  }
  for (const [color, geometries] of batches) {
    const geometry = merge(geometries);
    geometries.forEach((g) => g.dispose());
    if (!geometry) throw new Error(`Cannot merge exterior ${slug}`);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        metalness: 0.03,
      }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.featureCounts = featureCounts;
  group.userData.scope = 'source-reviewed-exterior-silhouette';
  return group;
}
