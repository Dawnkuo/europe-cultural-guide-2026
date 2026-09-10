import * as THREE from 'three';

export const marbleSettings = { tileSize: 8, roughness: .83 };

// Project each triangle consistently in model space; changing UVs never moves vertices.
export function setMarbleUV(geometry, tileSize = marbleSettings.tileSize) {
  if (!(tileSize > 0)) throw new Error('Marble tile size must be positive.');
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i += 3) {
    const nx = Math.abs(normal.getX(i) + normal.getX(i + 1) + normal.getX(i + 2));
    const ny = Math.abs(normal.getY(i) + normal.getY(i + 1) + normal.getY(i + 2));
    const nz = Math.abs(normal.getZ(i) + normal.getZ(i + 1) + normal.getZ(i + 2));
    for (let j = i; j < i + 3; j++) {
      const x = position.getX(j), y = position.getY(j), z = position.getZ(j);
      uv[j * 2] = (ny >= nx && ny >= nz ? x : nx > nz ? z : x) / tileSize;
      uv[j * 2 + 1] = (ny >= nx && ny >= nz ? z : y) / tileSize;
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

export async function loadMarbleTexture(renderer) {
  const texture = await new THREE.TextureLoader().loadAsync(new URL('./assets/pale-marble-albedo.png', import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.name = 'pale-marble-albedo';
  return texture;
}
