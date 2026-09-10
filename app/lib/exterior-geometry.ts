import type * as ThreeType from "three";

function unitBounds(geometry: ThreeType.BufferGeometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = box.min.clone().add(box.max).multiplyScalar(0.5);
  const size = box.max.clone().sub(box.min);
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(1 / size.x, 1 / size.y, 1 / size.z);
  return geometry;
}

// Semantic silhouettes only: these do not add undocumented windows or rooms.
export function specialExteriorGeometry(THREE: typeof ThreeType, kind: string) {
  if (kind === "dragon-roof") {
    const section = new THREE.Shape();
    section.moveTo(-0.5, -0.5);
    section.lineTo(0.5, -0.5);
    section.bezierCurveTo(0.5, 0.05, 0.32, 0.51, 0.03, 0.5);
    section.bezierCurveTo(-0.18, 0.48, -0.44, 0.14, -0.5, -0.5);
    const geometry = new THREE.ExtrudeGeometry(section, {
      depth: 1,
      curveSegments: 40,
      bevelEnabled: false,
    });
    return unitBounds(geometry);
  }
  if (kind === "wavy-facade" || kind === "curved-facade") {
    const geometry = new THREE.BoxGeometry(1, 1, 1, 48, 1, 1);
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      if (z > 0) positions.setZ(i, z + 0.055 * Math.cos(x * Math.PI * 6));
    }
    geometry.computeVertexNormals();
    return geometry;
  }
  if (kind === "gaudi-bell-tower") {
    const points = [
      [0.44, -0.5],
      [0.45, -0.36],
      [0.44, -0.18],
      [0.4, 0.04],
      [0.33, 0.23],
      [0.22, 0.4],
      [0.13, 0.46],
      [0, 0.5],
    ];
    return new THREE.LatheGeometry(
      points.map(([x, y]) => new THREE.Vector2(x, y)),
      32,
    );
  }
  if (kind.includes("dome")) {
    return unitBounds(
      new THREE.SphereGeometry(0.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    );
  }
  return undefined;
}

export function perspectiveFitDistance(
  radius: number,
  aspect: number,
  verticalFov: number,
  margin = 1.16,
) {
  const halfVertical = (verticalFov * Math.PI) / 360;
  const halfHorizontal = Math.atan(
    Math.tan(halfVertical) * Math.max(aspect, 0.1),
  );
  return (radius * margin) / Math.sin(Math.min(halfVertical, halfHorizontal));
}

// Camera-space box corners give elongated compounds a much tighter fit than
// a bounding sphere, without stretching the model or clipping a tall dome.
export function perspectiveBoxFitDistance(
  size: [number, number, number],
  direction: [number, number, number],
  aspect: number,
  verticalFov: number,
  margin = 1.08,
) {
  const length = Math.hypot(...direction);
  const [dx, dy, dz] = direction.map((n) => n / length);
  const horizontal = Math.hypot(dx, dz);
  const right: [number, number, number] =
    horizontal > 1e-8 ? [dz / horizontal, 0, -dx / horizontal] : [1, 0, 0];
  const up = [
    dy * right[2] - dz * right[1],
    dz * right[0] - dx * right[2],
    dx * right[1] - dy * right[0],
  ];
  const tanV = Math.tan((verticalFov * Math.PI) / 360),
    tanH = tanV * Math.max(0.1, aspect);
  let distance = 0;
  for (const x of [-size[0] / 2, size[0] / 2])
    for (const y of [-size[1] / 2, size[1] / 2])
      for (const z of [-size[2] / 2, size[2] / 2]) {
        const depth = x * dx + y * dy + z * dz;
        distance = Math.max(
          distance,
          depth +
            (Math.abs(x * right[0] + y * right[1] + z * right[2]) * margin) /
              tanH,
          depth + (Math.abs(x * up[0] + y * up[1] + z * up[2]) * margin) / tanV,
        );
      }
  return distance;
}
