import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { perspectiveBoxFitDistance } from '../../../app/lib/exterior-geometry';

// Isolated inspection surface. Never imported by an application route.
export async function mountMeshStudy(venueClay = false) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100vw;height:100vh;touch-action:none';
  canvas.setAttribute('aria-label', 'Colosseum candidate mesh study');
  document.body.replaceChildren(canvas);
  document.body.style.margin = '0';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061019);
  scene.add(new THREE.HemisphereLight(0xe1ecf5, 0x334047, 2));
  const key = new THREE.DirectionalLight(0xffecd4, 2.4);
  key.position.set(7, 13, 8); scene.add(key);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    .loadAsync(`/work/experience/colosseum-source-study/colosseum-${venueClay ? 'venue-' : ''}study.glb`);
  const model = gltf.scene;
  scene.add(model);
  // Camera ROI published with the research dataset; no geometry is clipped.
  const bounds = new THREE.Box3(new THREE.Vector3(-5.132, -1.077, -4.304), new THREE.Vector3(5.256, 2.28, 3.931));
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 250);
  const controls = new OrbitControls(camera, canvas);
  const materials: { mesh: THREE.Mesh; original: THREE.Material | THREE.Material[]; clay: THREE.Material }[] = [];
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    materials.push({ mesh: object, original: object.material, clay: new THREE.MeshStandardMaterial({ color: 0xb7a88f, roughness: 1, side: THREE.DoubleSide }) });
  });
  const draw = () => {
    renderer.render(scene, camera);
    canvas.dataset.camera = camera.position.toArray().join(',');
    canvas.dataset.triangles = String(renderer.info.render.triangles);
  };
  function view(direction: [number, number, number], clay = false, focus?: { min: [number, number, number]; max: [number, number, number] }) {
    const normalized = new THREE.Vector3(...direction).normalize();
    const box = focus ? new THREE.Box3(new THREE.Vector3(...focus.min), new THREE.Vector3(...focus.max)) : bounds;
    const target = focus ? box.getCenter(new THREE.Vector3()) : center;
    const dimensions = focus ? box.getSize(new THREE.Vector3()) : size;
    const distance = perspectiveBoxFitDistance(dimensions.toArray(), normalized.toArray(), camera.aspect, camera.fov);
    camera.position.copy(target).addScaledVector(normalized, distance);
    controls.target.copy(target);
    materials.forEach(record => { record.mesh.material = clay ? record.clay : record.original; });
    controls.update(); draw();
  }
  controls.addEventListener('change', draw);
  view([10, 9, 10]);
  return {
    view,
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
    dispose: () => {
      controls.dispose();
      materials.forEach(({ mesh, original, clay }) => {
        mesh.geometry.dispose();
        for (const material of Array.isArray(original) ? original : [original]) {
          const textured = material as THREE.MeshStandardMaterial;
          textured.map?.dispose();
          const image = textured.map?.source.data;
          if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
          material.dispose();
        }
        clay.dispose();
      });
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
