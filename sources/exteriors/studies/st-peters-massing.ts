// Superseded silhouette study. The site uses st-peters-model.ts and its official GLB.
import type * as ThreeType from "three";
import {
  stPetersPlan as plan,
  stPetersWorld as world,
  stPetersDomeProfile,
  stPetersFacade as facade,
  type ExteriorPoint,
} from "./st-peters-plan";

type V3 = [number, number, number];
type Merge = (
  geometries: ThreeType.BufferGeometry[],
) => ThreeType.BufferGeometry | null;

export function buildStPetersExterior(THREE: typeof ThreeType, merge: Merge) {
  const group = new THREE.Group();
  const batches = new Map<number, ThreeType.BufferGeometry[]>();
  const features: Record<string, number> = {};
  const stone = 0xc9bba3,
    trim = 0xe0d4bc,
    roof = 0x737d7a,
    dark = 0x263840,
    paving = 0x36454d;
  function add(
    kind: string,
    geometry: ThreeType.BufferGeometry,
    color: number,
    at: V3 = [0, 0, 0],
    scale: V3 = [1, 1, 1],
    rotation: V3 = [0, 0, 0],
  ) {
    geometry.deleteAttribute("uv");
    geometry.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3(...at),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
        new THREE.Vector3(...scale),
      ),
    );
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    const batch = batches.get(color) ?? [];
    batch.push(part);
    batches.set(color, batch);
    features[kind] = (features[kind] ?? 0) + 1;
  }
  const box = (kind: string, at: V3, size: V3, color = stone, rotation?: V3) =>
    add(kind, new THREE.BoxGeometry(1, 1, 1), color, at, size, rotation);
  function line(kind: string, points: V3[], radius: number, color = trim) {
    // Straight segments preserve roof/pediment corners instead of overshooting
    // them with a smoothed spline. Curved profiles supply their own samples.
    for (let i = 1; i < points.length; i++) {
      const a = new THREE.Vector3(...points[i - 1]),
        b = new THREE.Vector3(...points[i]);
      const delta = b.clone().sub(a),
        length = delta.length();
      if (length < 1e-6) continue;
      const geometry = new THREE.CylinderGeometry(radius, radius, length, 6);
      geometry.applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          delta.normalize(),
        ),
      );
      add(kind, geometry, color, a.add(b).multiplyScalar(0.5).toArray() as V3);
    }
  }
  function polygon(
    kind: string,
    points: ExteriorPoint[],
    base: number,
    height: number,
    color: number,
  ) {
    const shape = new THREE.Shape(
      points.map((p) => {
        const [x, z] = world(p);
        return new THREE.Vector2(x, -z);
      }),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      steps: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    add(kind, geometry, color, [0, base, 0]);
  }
  function rim(
    kind: string,
    points: ExteriorPoint[],
    y: number,
    radius: number,
    color = trim,
  ) {
    line(
      kind,
      points.map((p) => {
        const [x, z] = world(p);
        return [x, y, z];
      }),
      radius,
      color,
    );
  }
  function ring(
    kind: string,
    x: number,
    z: number,
    y: number,
    r: number,
    width: number,
    color = trim,
  ) {
    add(
      kind,
      new THREE.TorusGeometry(r, width, 5, 64),
      color,
      [x, y, z],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
  }
  function column(
    kind: string,
    x: number,
    z: number,
    base: number,
    height: number,
    r: number,
  ) {
    box(
      "column-plinth",
      [x, base + r * 0.3, z],
      [r * 2.8, r * 0.6, r * 2.8],
      trim,
    );
    add(
      kind,
      new THREE.CylinderGeometry(r * 0.8, r, height - r * 2.5, 12),
      stone,
      [x, base + height * 0.5, z],
    );
    add(
      "capital-envelope",
      new THREE.CylinderGeometry(r * 1.35, r * 0.85, r * 1.5, 8),
      trim,
      [x, base + height - r * 0.6, z],
    );
    box(
      "capital-abacus",
      [x, base + height, z],
      [r * 2.9, r * 0.55, r * 2.9],
      trim,
    );
  }
  function statue(
    kind: string,
    x: number,
    z: number,
    y: number,
    height: number,
  ) {
    box(
      "statue-pedestal",
      [x, y + 0.025, z],
      [height * 0.38, 0.05, height * 0.38],
      trim,
    );
    add(
      kind,
      new THREE.CylinderGeometry(
        height * 0.08,
        height * 0.16,
        height * 0.68,
        7,
      ),
      trim,
      [x, y + height * 0.42, z],
    );
    add(
      "statue-head-envelope",
      new THREE.SphereGeometry(height * 0.105, 8, 6),
      trim,
      [x, y + height * 0.86, z],
    );
  }
  function cross(x: number, z: number, y: number, size: number) {
    box("cross-upright", [x, y, z], [size * 0.1, size, size * 0.1], trim);
    box(
      "cross-arm",
      [x, y + size * 0.12, z],
      [size * 0.6, size * 0.1, size * 0.1],
      trim,
    );
  }
  function roofBlock(
    kind: string,
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    base: number,
    rise: number,
    acrossX = true,
  ) {
    const [a, b] = world([x0, z0]),
      [c, d] = world([x1, z1]);
    const shape = new THREE.Shape();
    const half = (acrossX ? c - a : d - b) / 2;
    shape.moveTo(-half, 0);
    shape.lineTo(0, rise);
    shape.lineTo(half, 0);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: acrossX ? d - b : c - a,
      bevelEnabled: false,
    });
    if (acrossX) add(kind, geometry, roof, [(a + c) / 2, base, b]);
    else
      add(
        kind,
        geometry,
        roof,
        [a, base, (b + d) / 2],
        [1, 1, 1],
        [0, Math.PI / 2, 0],
      );
  }
  // The arrival porch is a separate open volume, not buried in the body solid.
  const body = plan.basilica.map(
    ([x, z]): ExteriorPoint => [x, Math.min(z, plan.facade.back)],
  );
  polygon("basilica-body", body, 0, 2.12, stone);
  polygon("basilica-roof", body, 2.12, 0.065, trim);
  rim("roof-parapet", body, 2.23, 0.032);
  for (const y of [0.16, 1.58, 1.68]) rim("body-stringcourse", body, y, 0.027);
  polygon("sacristy", plan.sacristy, 0, 1.8, stone);
  polygon("sacristy-roof", plan.sacristy, 1.8, 0.06, roof);
  rim("sacristy-parapet", plan.sacristy, 1.9, 0.028);
  roofBlock("nave-roof", 466, 310, 540, 565, 2.18, 0.32);
  roofBlock("choir-roof", 468, 132, 535, 235, 2.18, 0.27);
  roofBlock("north-transept-roof", 326, 246, 469, 303, 2.18, 0.28, false);
  roofBlock("south-transept-roof", 540, 246, 681, 305, 2.18, 0.28, false);

  const [cx, cz] = world(plan.crossing),
    radius = plan.domeRadius * plan.scale;
  add(
    "crossing-attic-base",
    new THREE.CylinderGeometry(radius * 1.06, radius * 1.12, 0.72, 32),
    stone,
    [cx, 2.53, cz],
  );
  add(
    "drum-base",
    new THREE.CylinderGeometry(radius * 1.06, radius * 1.1, 0.27, 64),
    stone,
    [cx, 2.9, cz],
  );
  add(
    "drum-wall",
    new THREE.CylinderGeometry(radius * 0.89, radius * 0.89, 0.83, 64),
    stone,
    [cx, 3.41, cz],
  );
  for (const y of [3.02, 3.81, 3.88])
    ring("drum-cornice", cx, cz, y, radius * 1.04, 0.045);
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8,
      nx = Math.sin(angle),
      nz = Math.cos(angle);
    const tangent = new THREE.Vector3(nz, 0, -nx);
    for (const side of [-1, 1]) {
      const x = cx + nx * radius + side * tangent.x * 0.068,
        z = cz + nz * radius + side * tangent.z * 0.068;
      column("drum-paired-column", x, z, 3.04, 0.71, 0.046);
    }
    const middle = angle + Math.PI / 16,
      x = cx + Math.sin(middle) * radius * 0.905,
      z = cz + Math.cos(middle) * radius * 0.905;
    box("drum-window", [x, 3.4, z], [0.21, 0.43, 0.025], dark, [0, middle, 0]);
    box("drum-window-lintel", [x, 3.65, z], [0.27, 0.045, 0.065], trim, [
      0,
      middle,
      0,
    ]);
    for (const offset of [-0.12, 0.12])
      box(
        "drum-window-jamb",
        [x + Math.cos(middle) * offset, 3.4, z - Math.sin(middle) * offset],
        [0.035, 0.49, 0.065],
        trim,
        [0, middle, 0],
      );
  }
  const profileScale = radius / 208;
  const profile = stPetersDomeProfile.map(
    ([r, y]) =>
      new THREE.Vector2(r * profileScale, 3.88 + (601 - y) * profileScale),
  );
  add("ogival-dome-shell", new THREE.LatheGeometry(profile, 96), roof, [
    cx,
    0,
    cz,
  ]);
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    line(
      "dome-rib",
      profile.map((p) => [
        cx + Math.sin(a) * (p.x + 0.014),
        p.y,
        cz + Math.cos(a) * (p.x + 0.014),
      ]),
      0.026,
    );
    // Three rings of documented roof openings, not interior windows or stops.
    for (const j of [1, 3, 5]) {
      const p = profile[j],
        angle = a + Math.PI / 16;
      add(
        "dome-roof-opening",
        new THREE.CircleGeometry(j === 1 ? 0.034 : 0.025, 8),
        dark,
        [
          cx + Math.sin(angle) * (p.x + 0.018),
          p.y + 0.014,
          cz + Math.cos(angle) * (p.x + 0.018),
        ],
        [1, 1, 1],
        [-0.1 * (j - 1), angle, 0],
      );
    }
  }
  const crown = profile.at(-1)!.y,
    lanternRadius = (radius * 60) / 208;
  add(
    "lantern-base",
    new THREE.CylinderGeometry(
      lanternRadius * 1.13,
      lanternRadius * 1.2,
      0.1,
      32,
    ),
    trim,
    [cx, crown + 0.02, cz],
  );
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    column(
      "lantern-column",
      cx + Math.sin(a) * lanternRadius * 0.86,
      cz + Math.cos(a) * lanternRadius * 0.86,
      crown + 0.07,
      0.44,
      0.025,
    );
  }
  // Open lantern bays retain sky between the columns.
  ring("lantern-entablature", cx, cz, crown + 0.53, lanternRadius, 0.044);
  const cap = [
    new THREE.Vector2(lanternRadius, crown + 0.56),
    new THREE.Vector2(lanternRadius * 0.77, crown + 0.63),
    new THREE.Vector2(lanternRadius * 0.4, crown + 0.75),
    new THREE.Vector2(0.07, crown + 0.97),
    new THREE.Vector2(0.035, crown + 1.02),
  ];
  add("lantern-cap", new THREE.LatheGeometry(cap, 48), roof, [cx, 0, cz]);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    line(
      "lantern-cap-rib",
      cap.map((p) => [cx + Math.sin(a) * p.x, p.y, cz + Math.cos(a) * p.x]),
      0.012,
    );
  }
  add("gilded-orb", new THREE.SphereGeometry(0.072, 16, 10), 0xc6a755, [
    cx,
    crown + 1.08,
    cz,
  ]);
  cross(cx, cz, crown + 1.24, 0.25);

  function minorDome(point: ExteriorPoint, tall: boolean) {
    const [x, z] = world(point),
      r = tall ? 0.39 : 0.33;
    add(
      tall ? "minor-dome-drum" : "rear-low-roof-drum",
      new THREE.CylinderGeometry(r, r, tall ? 0.39 : 0.15, 16),
      stone,
      [x, tall ? 2.375 : 2.25, z],
    );
    const p = [
      new THREE.Vector2(r, 2.57),
      new THREE.Vector2(r * 0.94, 2.68),
      new THREE.Vector2(r * 0.73, 2.85),
      new THREE.Vector2(r * 0.26, 3.04),
    ];
    if (!tall) p.forEach((v) => (v.y = 2.32 + (v.y - 2.57) * 0.18));
    add(
      tall ? "built-chapel-dome" : "rear-low-roof",
      new THREE.LatheGeometry(p, 32),
      roof,
      [x, 0, z],
    );
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      line(
        "minor-roof-rib",
        p.map((v) => [x + Math.sin(a) * v.x, v.y, z + Math.cos(a) * v.x]),
        0.013,
      );
    }
    if (tall) {
      ring("minor-dome-base", x, z, 2.57, r, 0.025);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        column(
          "minor-lantern-column",
          x + Math.sin(a) * 0.085,
          z + Math.cos(a) * 0.085,
          3.03,
          0.18,
          0.014,
        );
        box(
          "minor-drum-window",
          [x + Math.sin(a) * r, 2.39, z + Math.cos(a) * r],
          [0.075, 0.18, 0.012],
          dark,
          [0, a, 0],
        );
      }
      add("minor-lantern-roof", new THREE.ConeGeometry(0.13, 0.2, 12), roof, [
        x,
        3.31,
        z,
      ]);
      cross(x, z, 3.48, 0.18);
    }
  }
  plan.tallMinorDomes.forEach((p) => minorDome(p, true));
  plan.lowRearRoofs.forEach((p) => minorDome(p, false));
  for (const p of plan.ovalSkylights) {
    const [x, z] = world(p);
    add(
      "oval-rooflight",
      new THREE.SphereGeometry(0.145, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      roof,
      [x, 2.2, z],
      [1, 0.45, 1.5],
    );
    add(
      "oval-rooflight-rim",
      new THREE.TorusGeometry(0.15, 0.022, 5, 24),
      trim,
      [x, 2.205, z],
      [1, 1.5, 1],
      [Math.PI / 2, 0, 0],
    );
  }
  for (const p of plan.smallRoundSkylights) {
    const [x, z] = world(p);
    add(
      "round-rooflight",
      new THREE.CylinderGeometry(0.073, 0.08, 0.055, 16),
      roof,
      [x, 2.215, z],
    );
    ring("round-rooflight-rim", x, z, 2.24, 0.078, 0.013);
  }

  const [left, front] = world([plan.facade.left, plan.facade.front]);
  const [right, back] = world([plan.facade.right, plan.facade.back]);
  const fx = (u: number) =>
    left +
    ((u - facade.imageEdges[0]) /
      (facade.imageEdges[1] - facade.imageEdges[0])) *
      (right - left);
  const fw = (pixels: number) =>
    (pixels / (facade.imageEdges[1] - facade.imageEdges[0])) * (right - left);
  const wall = new THREE.Shape();
  wall.moveTo(left, 0);
  for (const gate of facade.gates) {
    const x = fx(gate.x),
      r = fw(gate.width) / 2,
      h = gate.height * 0.68;
    wall.lineTo(x - r, 0);
    if (gate.arch) {
      wall.lineTo(x - r, h - r);
      wall.absarc(x, h - r, r, Math.PI, 0, true);
    } else {
      wall.lineTo(x - r, h);
      wall.lineTo(x + r, h);
    }
    wall.lineTo(x + r, 0);
  }
  wall.lineTo(right, 0);
  wall.lineTo(right, 1.49);
  wall.lineTo(left, 1.49);
  wall.closePath();
  add(
    "open-narthex-front",
    new THREE.ExtrudeGeometry(wall, {
      depth: front - back,
      bevelEnabled: false,
    }),
    stone,
    [0, 0, back],
  );
  box(
    "facade-frieze",
    [(left + right) / 2, 1.6, (front + back) / 2],
    [right - left, 0.22, front - back + 0.02],
    trim,
  );
  for (const y of [1.5, 1.72, 2.18])
    box(
      "facade-cornice",
      [(left + right) / 2, y, (front + back) / 2],
      [right - left + 0.13, 0.06, front - back + 0.12],
      trim,
    );
  box(
    "facade-attic",
    [(left + right) / 2, 1.95, (front + back) / 2],
    [right - left, 0.45, front - back],
    stone,
  );
  for (const u of facade.columns)
    column("facade-giant-column", fx(u), front + 0.065, 0.045, 1.41, 0.068);
  for (const u of facade.pilasters) {
    box(
      "facade-pilaster",
      [fx(u), 0.76, front + 0.025],
      [0.08, 1.43, 0.07],
      trim,
    );
    box(
      "pilaster-capital",
      [fx(u), 1.435, front + 0.04],
      [0.15, 0.065, 0.105],
      trim,
    );
  }
  const frontPlane = front + 0.04;
  for (const u of facade.windows) {
    const x = fx(u),
      width = fw(u === 400 ? 37 : 29);
    box(
      "facade-upper-window",
      [x, 1.07, frontPlane],
      [width, 0.35, 0.015],
      dark,
    );
    box(
      "window-head",
      [x, 1.28, frontPlane + 0.02],
      [width + 0.08, 0.035, 0.035],
      trim,
    );
    for (const side of [-1, 1])
      box(
        "window-jamb",
        [x + (side * (width + 0.035)) / 2, 1.075, frontPlane + 0.02],
        [0.035, 0.4, 0.035],
        trim,
      );
    if ([255, 400, 551].includes(u)) {
      box(
        "benediction-balcony",
        [x, 0.875, front + 0.11],
        [width + 0.09, 0.09, 0.19],
        trim,
      );
      for (let bal = 0; bal < 5; bal++)
        box(
          "balcony-baluster",
          [x - width / 2 + (bal * width) / 4, 0.95, front + 0.2],
          [0.016, 0.1, 0.025],
          trim,
        );
    }
  }
  for (const u of facade.atticWindows) {
    const x = fx(u),
      width = fw([88, 716].includes(u) ? 34 : 31);
    box("attic-window", [x, 1.95, frontPlane], [width, 0.18, 0.02], dark);
    for (const y of [1.83, 2.075])
      box(
        "attic-frame",
        [x, y, frontPlane + 0.02],
        [width + 0.065, 0.025, 0.04],
        trim,
      );
    for (const sign of [-1, 1])
      box(
        "attic-frame",
        [x + (sign * (width + 0.04)) / 2, 1.95, frontPlane + 0.02],
        [0.025, 0.245, 0.04],
        trim,
      );
  }
  const pediment = new THREE.Shape();
  pediment.moveTo(fx(283), 1.74);
  pediment.lineTo(fx(400), 2.11);
  pediment.lineTo(fx(518), 1.74);
  pediment.closePath();
  add(
    "central-pediment",
    new THREE.ExtrudeGeometry(pediment, { depth: 0.09, bevelEnabled: false }),
    stone,
    [0, 0, front + 0.1],
  );
  line(
    "pediment-cornice",
    [
      [fx(282), 1.755, front + 0.2],
      [fx(400), 2.14, front + 0.2],
      [fx(519), 1.755, front + 0.2],
    ],
    0.026,
  );
  const statues = facade.statues.map(
    (u) => left + ((u - 20) / 960) * (right - left),
  );
  for (const x of statues)
    statue("facade-statue-envelope", x, front + 0.01, 2.215, 0.29);
  for (const u of [87, 720]) {
    const x = fx(u);
    add("clock-face", new THREE.CircleGeometry(0.135, 32), 0xcbbf9e, [
      x,
      2.41,
      front + 0.08,
    ]);
    add("clock-rim", new THREE.TorusGeometry(0.14, 0.025, 5, 32), trim, [
      x,
      2.41,
      front + 0.095,
    ]);
    line(
      "clock-hand",
      [
        [x - 0.055, 2.46, front + 0.12],
        [x, 2.41, front + 0.12],
        [x + 0.01, 2.495, front + 0.12],
      ],
      0.007,
      dark,
    );
    for (const side of [-1, 1])
      add(
        "clock-scroll-envelope",
        new THREE.SphereGeometry(0.08, 12, 8),
        trim,
        [x + side * 0.18, 2.34, front + 0.035],
        [0.8, 1.2, 0.6],
      );
    cross(x, front + 0.02, 2.67, 0.19);
  }
  // Horizontal wall articulation follows the existing envelope, not cloned
  // high domes from the historical elevation's unexecuted roof scheme.
  for (const z of [397, 453, 507])
    for (const x of [365, 628]) {
      const [wx, wz] = world([x, z]),
        direction = x < 500 ? -1 : 1;
      box(
        "side-window",
        [wx + direction * 0.03, 1.17, wz],
        [0.018, 0.42, 0.2],
        dark,
      );
      for (const delta of [-0.14, 0.14])
        box(
          "side-window-frame",
          [wx + direction * 0.05, 1.17, wz + delta],
          [0.05, 0.48, 0.035],
          trim,
        );
      box(
        "side-window-lintel",
        [wx + direction * 0.05, 1.42, wz],
        [0.06, 0.04, 0.31],
        trim,
      );
    }
  for (let i = 0; i < 8; i++) {
    const inset = i * 0.7,
      depth = 23 - i * 1.7;
    polygon(
      "facade-step",
      [
        [325 + inset, 613],
        [642 - inset, 613],
        [642 - inset, 613 + depth],
        [325 + inset, 613 + depth],
        [325 + inset, 613],
      ],
      -0.055 + i * 0.008,
      0.025,
      trim,
    );
  }

  // The square is exterior context. Curves follow the actual plan; column
  // spacing and anonymous statue envelopes are diagrammatic, not scan meshes.
  const plazaBoundary = [
    ...plan.colonnades[0].outer,
    ...plan.colonnades[1].outer.toReversed(),
  ];
  plazaBoundary.push(plazaBoundary[0]);
  polygon("square-paving", plazaBoundary, -0.065, 0.025, paving);
  polygon(
    "forecourt",
    [
      [325, 615],
      [642, 615],
      [640, 915],
      [625, 922],
      [380, 920],
      [350, 900],
      [325, 615],
    ],
    -0.065,
    0.025,
    paving,
  );
  for (const arm of [plan.northArm, plan.southArm]) {
    polygon("closed-ambulatory", arm, 0, 0.72, stone);
    polygon("ambulatory-roof", arm, 0.72, 0.05, trim);
    rim("ambulatory-parapet", arm, 0.82, 0.025);
  }
  for (const half of plan.colonnades) {
    const outer = new THREE.CatmullRomCurve3(
      half.outer.map((p) => {
        const [x, z] = world(p);
        return new THREE.Vector3(x, 0, z);
      }),
    );
    const inner = new THREE.CatmullRomCurve3(
      half.inner.map((p) => {
        const [x, z] = world(p);
        return new THREE.Vector3(x, 0, z);
      }),
    );
    const count = 96;
    const strip = [
      ...Array.from({ length: count + 1 }, (_, i) => outer.getPoint(i / count)),
      ...Array.from({ length: count + 1 }, (_, i) =>
        inner.getPoint(1 - i / count),
      ),
    ];
    const stripPixels = strip.map(
      (p) => [p.x / plan.scale + 500, p.z / plan.scale + 670] as ExteriorPoint,
    );
    stripPixels.push(stripPixels[0]);
    polygon("colonnade-stylobate", stripPixels, 0, 0.045, trim);
    polygon("colonnade-entablature", stripPixels, 0.7, 0.095, stone);
    rim("colonnade-cornice", stripPixels, 0.81, 0.025);
    // The official census is284 columns/four rows. Individual positions are
    // an equal-distance exterior illustration, not reviewed bay assignments.
    for (let row = 0; row < 4; row++) {
      const n = row < 2 ? 36 : 35;
      for (let i = 0; i < n; i++) {
        const t = 0.018 + (i / (n - 1)) * 0.964,
          p = outer
            .getPointAt(t)
            .lerp(inner.getPointAt(t), 0.1 + (row * 0.8) / 3);
        column("colonnade-column", p.x, p.z, 0.04, 0.64, 0.035);
      }
    }
    for (let i = 0; i < 70; i++) {
      const t = 0.018 + (i / 69) * 0.964,
        p = (i % 2 ? inner : outer).getPointAt(t);
      statue("colonnade-statue-envelope", p.x, p.z, 0.83, 0.17);
    }
  }
  const [ox, oz] = world(plan.obelisk);
  box("obelisk-base", [ox, 0.09, oz], [0.45, 0.18, 0.45], trim);
  box("obelisk-pedestal", [ox, 0.3, oz], [0.27, 0.25, 0.27], stone);
  add(
    "obelisk-shaft",
    new THREE.CylinderGeometry(0.055, 0.095, 1.05, 4),
    0xb9a382,
    [ox, 0.94, oz],
    [1, 1, 1],
    [0, Math.PI / 4, 0],
  );
  add(
    "obelisk-tip",
    new THREE.ConeGeometry(0.076, 0.15, 4),
    0xb9a382,
    [ox, 1.54, oz],
    [1, 1, 1],
    [0, Math.PI / 4, 0],
  );
  cross(ox, oz, 1.7, 0.16);
  for (const p of plan.fountains) {
    const [x, z] = world(p);
    add(
      "fountain-pool",
      new THREE.CylinderGeometry(0.3, 0.32, 0.05, 32),
      0x416573,
      [x, 0.045, z],
    );
    ring("fountain-pool-rim", x, z, 0.08, 0.31, 0.035);
    add(
      "fountain-stem",
      new THREE.CylinderGeometry(0.04, 0.075, 0.29, 12),
      trim,
      [x, 0.2, z],
    );
    add(
      "fountain-upper-basin",
      new THREE.CylinderGeometry(0.16, 0.045, 0.1, 24),
      trim,
      [x, 0.34, z],
    );
    add("fountain-crown", new THREE.SphereGeometry(0.035, 10, 8), trim, [
      x,
      0.43,
      z,
    ]);
  }
  for (const [color, parts] of batches) {
    const geometry = merge(parts);
    parts.forEach((p) => p.dispose());
    if (!geometry) throw new Error("Cannot merge St Peter exterior");
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82,
        metalness: color === roof ? 0.18 : 0.02,
      }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.featureCounts = features;
  group.userData.scope = "source-reviewed-exterior-silhouette";
  group.userData.entryOpenings = facade.gates.map((g) => ({
    x: fx(g.x),
    z: front,
    y: g.height * 0.25,
  }));
  group.userData.domeCenter = [cx, cz];
  group.userData.roofPlanSource = plan.source;
  group.userData.focusRegions = [
    {
      id: "basilica",
      label: "圣彼得大教堂",
      min: [-6.7, 0, -10.7],
      max: [3.6, 6.9, -0.9],
    },
    {
      id: "square",
      label: "圣彼得广场",
      min: [-5.2, 0, -1],
      max: [5.3, 1.8, 10.7],
    },
  ];
  return group;
}
