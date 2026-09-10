import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { withBasePath } from "./paths";

export function disposeStPetersModel(model: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      material.dispose();
  });
}

export function prepareStPetersModel(source: THREE.Group) {
  const model = new THREE.Group();
  model.add(source);
  model.rotation.y = -Math.PI / 2;
  const initial = new THREE.Box3().setFromObject(model);
  const center = initial.getCenter(new THREE.Vector3());
  const scale = 20 / initial.getSize(new THREE.Vector3()).z;
  model.scale.setScalar(scale);
  model.position.set(
    -center.x * scale,
    -initial.min.y * scale,
    -center.z * scale,
  );
  model.updateMatrixWorld(true);
  // These are camera framing regions only, not indoor boundaries or navigation geometry.
  const regions = [
    { id: "basilica", min: [-128, -28, -110], max: [106, 134, 110] },
    { id: "square", min: [98, -28, -134], max: [382, 28, 128] },
  ].map((region) => {
    const bounds = new THREE.Box3(
      new THREE.Vector3(...region.min),
      new THREE.Vector3(...region.max),
    ).applyMatrix4(model.matrixWorld);
    return {
      id: region.id,
      min: bounds.min.toArray(),
      max: bounds.max.toArray(),
    };
  });
  model.userData.focusRegions = regions;
  model.userData.scope = "official-exterior-mesh";
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  return model;
}

export async function loadRawStPetersModel(signal: AbortSignal) {
  const response = await fetch(withBasePath("/models/st-peters-exterior.glb"), {
    signal,
  });
  if (!response.ok) throw new Error(`Exterior model: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  const gltf = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(bytes, "");
  if (signal.aborted) {
    disposeStPetersModel(gltf.scene);
    signal.throwIfAborted();
  }
  return gltf.scene;
}

export async function loadStPetersModel(signal: AbortSignal) {
  return prepareStPetersModel(await loadRawStPetersModel(signal));
}
