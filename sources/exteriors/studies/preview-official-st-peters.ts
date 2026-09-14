// Internal inspection of the geometry served by the basilica's public viewer.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { perspectiveBoxFitDistance } from "../../../app/lib/exterior-geometry";

export async function mountOfficialStudy(nodeName = "exteriorMesh") {
  const gltf = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync("/work/experience/st-peters-source/basilica_low_241217_opt.glb");
  gltf.scene.updateMatrixWorld(true);
  const source = gltf.scene.getObjectByName(nodeName);
  if (!source) throw new Error(`Missing source node ${nodeName}`);
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "display:block;width:100vw;height:100vh;touch-action:none";
  document.body.replaceChildren(canvas);
  document.body.style.margin = "0";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061019);
  const model = new THREE.Group();
  scene.add(model);
  model.attach(source);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const factor = 20 / Math.max(size.x, size.z);
  model.position.copy(center).multiplyScalar(-factor);
  model.scale.setScalar(factor);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.85,
    metalness: 0,
  });
  let vertices = 0;
  let triangles = 0;
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const previous = Array.isArray(object.material)
      ? object.material
      : [object.material];
    previous.forEach((item) => item.dispose());
    object.material = material;
    vertices += object.geometry.getAttribute("position").count;
    triangles +=
      (object.geometry.index?.count ??
        object.geometry.getAttribute("position").count) / 3;
  });
  scene.add(new THREE.HemisphereLight(0xe1ecf5, 0x283844, 2));
  const key = new THREE.DirectionalLight(0xffead0, 3.2);
  key.position.set(7, 13, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9dcce3, 1.5);
  rim.position.set(-8, 5, -5);
  scene.add(rim);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const camera = new THREE.PerspectiveCamera(
    35,
    innerWidth / innerHeight,
    0.01,
    200,
  );
  const controls = new OrbitControls(camera, canvas);
  function view(direction = [3, 6, 15]) {
    const current = new THREE.Box3().setFromObject(model);
    const d = new THREE.Vector3(...direction).normalize();
    controls.target.copy(current.getCenter(new THREE.Vector3()));
    camera.position
      .copy(controls.target)
      .addScaledVector(
        d,
        perspectiveBoxFitDistance(
          current.getSize(new THREE.Vector3()).toArray(),
          d.toArray(),
          camera.aspect,
          camera.fov,
        ),
      );
    controls.update();
    renderer.render(scene, camera);
  }
  controls.addEventListener("change", () => renderer.render(scene, camera));
  view();
  canvas.dataset.ready = "true";
  return {
    view,
    stats: {
      nodeName,
      vertices,
      triangles,
      bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
      drawCalls: renderer.info.render.calls,
    },
  };
}
