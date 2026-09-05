import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, OrthographicCamera, Raycaster, Vector3 } from 'three';
import { isPlanAnchorVisible } from './architectural-visibility';
import { MeshBVH, acceleratedRaycast, disposeBoundsTree } from 'three-mesh-bvh';

describe('architectural label occlusion', () => {
  it('hides lower-floor labels behind a floor slab, but restores them from an unobstructed angle', () => {
    const camera = new OrthographicCamera(-8, 8, 8, -8, .1, 100);
    const geometry = new BoxGeometry(4, .1, 4);
    const material = new MeshBasicMaterial();
    const slab = new Mesh(geometry, material);
    slab.position.y = 3;
    slab.updateMatrixWorld();
    const anchor = new Vector3(0, .14, 0);
    const raycaster = new Raycaster();
    camera.position.set(0, 15, .01); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    expect(isPlanAnchorVisible(anchor, camera, [slab], raycaster)).toBe(false);
    geometry.boundsTree = new MeshBVH(geometry);
    slab.raycast = acceleratedRaycast;
    raycaster.firstHitOnly = true;
    expect(isPlanAnchorVisible(anchor, camera, [slab], raycaster)).toBe(false);
    expect(isPlanAnchorVisible(new Vector3(0, 3.14, 0), camera, [slab], raycaster)).toBe(true);
    camera.position.set(12, 6, 12); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    expect(isPlanAnchorVisible(anchor, camera, [slab], raycaster)).toBe(true);
    expect(isPlanAnchorVisible(new Vector3(100, 0, 0), camera, [slab], raycaster)).toBe(false);
    disposeBoundsTree.call(geometry); geometry.dispose(); material.dispose();
  });
});
