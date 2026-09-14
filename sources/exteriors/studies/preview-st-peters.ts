// Internal source/model comparison. No itinerary or visitor route imports it.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildStPetersExterior } from "./st-peters-massing";
import { perspectiveFitDistance } from "../../../app/lib/exterior-geometry";

export function mountStudy(closeup = false) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "display:block;width:100vw;height:100vh;touch-action:none";
  canvas.setAttribute("aria-label", "St Peter exterior source review");
  document.body.replaceChildren(canvas);
  document.body.style.margin = "0";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061019);
  scene.add(new THREE.HemisphereLight(0xe1ecf5, 0x26333d, 2));
  const key = new THREE.DirectionalLight(0xffecd4, 3.6);
  key.position.set(7, 13, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa9cbde, 2.1);
  rim.position.set(-8, 7, -7);
  scene.add(rim);
  const model = buildStPetersExterior(THREE, mergeGeometries);
  scene.add(model);
  const sphere = closeup
    ? new THREE.Sphere(new THREE.Vector3(0, 2.5, -6), 5.5)
    : new THREE.Box3()
        .setFromObject(model)
        .getBoundingSphere(new THREE.Sphere());
  const camera = new THREE.PerspectiveCamera(
    35,
    innerWidth / innerHeight,
    0.1,
    250,
  );
  camera.position
    .copy(sphere.center)
    .addScaledVector(
      new THREE.Vector3(7, 7, 13).normalize(),
      perspectiveFitDistance(sphere.radius, camera.aspect, camera.fov),
    );
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(sphere.center);
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.update();
  function draw() {
    renderer.render(scene, camera);
    canvas.dataset.camera = camera.position.toArray().join(",");
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
  }
  controls.addEventListener("change", draw);
  draw();
  return () => {
    controls.dispose();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.dispose();
      }
    });
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
