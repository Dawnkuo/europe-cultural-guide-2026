import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Source-space inspection only. These images do not alter the runtime mesh.
const output = 'work/experience/vatican-compound-source';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://localhost:55910/', { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
    const { scene: source } = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/st-peters-exterior.glb');
    source.updateMatrixWorld(true);
    const scene = new T.Scene();
    scene.background = new T.Color('#061019');
    scene.add(source, new T.HemisphereLight(0xffffff, 0x567183, 2.4));
    const sun = new T.DirectionalLight(0xfff3df, 2.5);
    sun.position.set(30, 500, -300);
    scene.add(sun);
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(1400, 1000);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const images = [];
    for (const { id, position, target, up, height } of [
      { id: 'top', position: [50, 500, -80], target: [50, 0, -80], up: [0, 0, -1], height: 32 },
      { id: 'north-west', position: [-80, 135, -200], target: [48, 14, -80], up: [0, 1, 0], height: 47 },
      { id: 'north-east', position: [180, 135, -200], target: [48, 14, -80], up: [0, 1, 0], height: 47 },
    ]) {
      const camera = new T.OrthographicCamera(-height * 1.4, height * 1.4, height, -height, .1, 2000);
      camera.position.set(...position); camera.up.set(...up); camera.lookAt(...target);
      renderer.render(scene, camera);
      images.push({ id, png: renderer.domElement.toDataURL('image/png'), position, target, halfHeight: height });
    }
    const samples = [];
    const ray = new T.Raycaster();
    for (const x of [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]) {
      for (const z of [-100, -95, -90, -85, -80, -75, -70, -65]) {
        ray.set(new T.Vector3(x, 200, z), new T.Vector3(0, -1, 0));
        const hit = ray.intersectObject(source, true)[0];
        samples.push({ x, z, y: hit ? Number(hit.point.y.toFixed(3)) : null });
      }
    }
    source.traverse(o => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
    });
    renderer.dispose(); renderer.forceContextLoss();
    return { images, samples };
  });
  for (const { id, png } of result.images) await writeFile(`${output}/mesh-sistine-${id}.png`, Buffer.from(png.split(',')[1], 'base64'));
  await writeFile(`${output}/mesh-sistine-inspection.json`, JSON.stringify({
    source: 'public/models/st-peters-exterior.glb',
    views: result.images.map(({ png: _png, ...view }) => view), samples: result.samples,
  }, null, 2));
  console.log(result.samples);
} finally { await browser.close(); }
