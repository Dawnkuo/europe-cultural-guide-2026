import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'work/experience/vatican-registration';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1650, height: 1050 }, serviceWorkers: 'block' });
  await page.goto('http://localhost:55910/', { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/st-peters-exterior.glb');
    const scene = new T.Scene();
    scene.background = new T.Color(0x061019);
    scene.add(gltf.scene, new T.HemisphereLight(0xffffff, 0x708090, 3));
    const light = new T.DirectionalLight(0xffffff, 2);
    light.position.set(100, 500, 200);
    scene.add(light);
    const camera = new T.OrthographicCamera(-275, 275, 175, -175, 0.1, 1000);
    camera.position.set(125, 500, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(125, 0, 0);
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(1650, 1050);
    renderer.render(scene, camera);
    const png = renderer.domElement.toDataURL('image/png');
    const positions = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(object => {
      if (!object.isMesh) return;
      const p = object.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const v = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(object.matrixWorld);
        if (v.x > 150 && v.y > -15) positions.push(v.toArray());
      }
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
    });
    renderer.dispose();
    renderer.forceContextLoss();
    return { png, positions };
  });
  await writeFile(`${output}/mesh-top.png`, Buffer.from(result.png.split(',')[1], 'base64'));
  await writeFile(`${output}/square-vertices.json`, JSON.stringify(result.positions));
  await writeFile(`${output}/projection.json`, JSON.stringify({ image: [1650, 1050], pixelPerWorldUnit: 3, imagePoint: ['3*(worldX+150)', '3*(worldZ+175)'], source: 'public/models/st-peters-exterior.glb', outputIsSourceInspectionOnly: true }, null, 2));
  console.log(JSON.stringify({ squareVertices: result.positions.length, output }));
} finally {
  await browser.close();
}
