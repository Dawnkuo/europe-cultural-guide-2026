import * as THREE from 'three';
import { campusToScene, vaticanRegistration } from '../data/vatican-registration';
import { withBasePath } from './paths';
import { disposeStPetersModel, loadRawStPetersModel } from './st-peters-model';

export function registerCampusStPeters(source: THREE.Group) {
  const { a, b, tx, ty, scope } = vaticanRegistration;
  const model = new THREE.Group();
  model.add(source);
  model.rotation.y = -Math.atan2(b, a);
  const [x, z] = campusToScene([tx, ty]);
  model.position.set(x, 0, z);
  model.userData.scope = scope;
  model.updateMatrixWorld(true);
  return model;
}

async function loadPlanTexture(signal: AbortSignal) {
  const response = await fetch(withBasePath('/maps/vatican-campus.svg'), { signal });
  if (!response.ok) throw new Error(`Campus plan: HTTP ${response.status}`);
  const document = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  const svg = document.documentElement;
  if (svg.localName !== 'svg' || document.querySelector('parsererror')) throw new Error('Invalid campus vector');
  const [x, y, width, height] = vaticanRegistration.campusViewBox;
  svg.setAttribute('width', String(width * 2));
  svg.setAttribute('height', String(height * 2));
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  for (const [name, value] of Object.entries({ x, y, width, height, fill: '#061019' })) background.setAttribute(name, String(value));
  svg.insertBefore(background, svg.firstChild);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  try {
    const texture = await new THREE.TextureLoader().loadAsync(url);
    if (signal.aborted) {
      texture.dispose();
      signal.throwIfAborted();
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function loadVaticanCampusModel(signal: AbortSignal) {
  const [meshResult, textureResult] = await Promise.allSettled([
    loadRawStPetersModel(signal), loadPlanTexture(signal),
  ]);
  if (meshResult.status === 'rejected' || textureResult.status === 'rejected') {
    if (meshResult.status === 'fulfilled') disposeStPetersModel(meshResult.value);
    if (textureResult.status === 'fulfilled') textureResult.value.dispose();
    throw new Error('Campus assets could not be loaded');
  }
  const mesh = registerCampusStPeters(meshResult.value);
  const texture = textureResult.value;
  if (signal.aborted) {
    disposeStPetersModel(mesh);
    texture.dispose();
    signal.throwIfAborted();
  }
  const { pixelsPerMeshUnit: scale, campusViewBox, displayPlaneY, scope } = vaticanRegistration;
  const model = new THREE.Group();
  model.add(mesh);
  const underlay = new THREE.Mesh(
    new THREE.PlaneGeometry(campusViewBox[2] / scale, campusViewBox[3] / scale),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }),
  );
  underlay.rotation.x = -Math.PI / 2;
  underlay.position.y = displayPlaneY;
  underlay.userData.scope = 'flat-source-derived-campus-context-not-building-geometry';
  model.add(underlay);
  model.userData.scope = scope;
  return { model, mesh, dispose() { texture.dispose(); disposeStPetersModel(model); } };
}
