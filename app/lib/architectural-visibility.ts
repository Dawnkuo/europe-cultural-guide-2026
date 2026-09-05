import type { Camera, Object3D, Raycaster, Vector3 } from 'three';

// Orthographic label anchors obey the same solid geometry as room picking.
export function isPlanAnchorVisible(anchor: Vector3, camera: Camera, meshes: Object3D[], raycaster: Raycaster) {
  const projected = anchor.clone().project(camera);
  if (Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1 || Math.abs(projected.z) > 1) return false;
  raycaster.ray.origin.copy(projected).setZ(-1).unproject(camera);
  camera.getWorldDirection(raycaster.ray.direction);
  raycaster.near = 0;
  raycaster.far = Math.max(0, raycaster.ray.origin.distanceTo(anchor) - .002);
  return raycaster.intersectObjects(meshes, false).length === 0;
}

// Change only the viewing angle when another displayed floor masks the target.
// Geometry and occlusion rules remain intact; manual orbiting is never overridden.
export function focusPlanAnchor(anchor: Vector3, camera: Camera, target: Vector3, meshes: Object3D[], raycaster: Raycaster) {
  const offset = camera.position.clone().sub(target);
  target.copy(anchor);
  const orient = () => { camera.lookAt(target); camera.updateMatrixWorld(); };
  camera.position.copy(anchor).add(offset);
  orient();
  if (isPlanAnchorVisible(anchor, camera, meshes, raycaster)) return true;
  const distance = offset.length();
  const azimuth = Math.atan2(offset.z, offset.x);
  for (const elevation of [30, 20, 12, 45, 60]) for (const turn of [0, 45, -45, 90, -90, 180, 135, -135]) {
    const pitch = elevation * Math.PI / 180, yaw = azimuth + turn * Math.PI / 180;
    camera.position.set(Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch)).multiplyScalar(distance).add(anchor);
    orient();
    if (isPlanAnchorVisible(anchor, camera, meshes, raycaster)) return true;
  }
  camera.position.copy(anchor).add(offset);
  orient();
  return false;
}
