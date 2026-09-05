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
