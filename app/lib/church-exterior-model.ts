import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { withBasePath } from './paths';
import { hasChurchExterior } from './church-exterior-registry';

export function disposeChurchTextures(model: THREE.Object3D | undefined) {
  const textures = new Set<THREE.Texture>();
  model?.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material.map) textures.add(material.map);
    }
  });
  textures.forEach(texture => texture.dispose());
}

function disposeModel(model: THREE.Object3D) {
  disposeChurchTextures(model);
  const materials = new Set<THREE.Material>();
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  materials.forEach(material => material.dispose());
}

export async function loadChurchExterior(slug: string, signal: AbortSignal, anisotropy = 4) {
  if (!hasChurchExterior(slug)) throw new Error(`Unsupported church exterior: ${slug}`);
  const response = await fetch(withBasePath(`/models/churches/${slug}.glb`), { signal });
  if (!response.ok) throw new Error(`Church model: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  const model = (await new GLTFLoader().parseAsync(bytes, '')).scene;
  try {
    signal.throwIfAborted();
    let texture: THREE.Texture | undefined;
    const targets: THREE.MeshStandardMaterial[] = [];
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material instanceof THREE.MeshStandardMaterial && ['marble', 'trim'].includes(material.name)) targets.push(material);
      }
    });
    if (targets.length) {
      try {
        texture = await new THREE.TextureLoader().loadAsync(withBasePath('/textures/pale-marble-albedo.png'));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = anisotropy;
        texture.flipY = false;
      } catch {
        // A missing decorative texture must not discard usable building geometry.
        model.userData.materialStatus = 'untextured';
      }
      if (signal.aborted) { texture?.dispose(); signal.throwIfAborted(); }
      if (texture) {
        for (const material of targets) { material.map = texture; material.needsUpdate = true; }
        model.userData.materialStatus = 'textured';
      }
    } else model.userData.materialStatus = 'building-palette';
    model.userData.id = `church-massing:${slug}`;
    model.userData.scope = 'evidence-backed-exterior-massing';
    return model;
  } catch (error) { disposeModel(model); throw error; }
}
