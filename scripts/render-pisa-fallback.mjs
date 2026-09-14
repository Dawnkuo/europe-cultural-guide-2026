import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce' });
  await page.goto('http://localhost:55910/', { waitUntil: 'networkidle' });
  const image = await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const { mergeGeometries } = await import('/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js');
    const { buildPisaExterior } = await import('/app/lib/pisa-exterior-model.ts');
    const { perspectiveBoxFitDistance } = await import('/app/lib/exterior-geometry.ts');
    const model = buildPisaExterior(T, mergeGeometries);
    const scene = new T.Scene(); scene.background = new T.Color(0x061019); scene.add(model);
    scene.add(new T.HemisphereLight(0xe1ecf5, 0x26333d, 2));
    const light = new T.DirectionalLight(0xffecd4, 3.6); light.position.set(7, 13, 8); scene.add(light);
    const rim = new T.DirectionalLight(0xa9cbde, 2.1); rim.position.set(-8, 7, -7); scene.add(rim);
    const renderer = new T.WebGLRenderer({ antialias: true }); renderer.setSize(1080, 1800);
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    const camera = new T.PerspectiveCamera(35, 1080 / 1800, 0.1, 250);
    const bounds = new T.Box3().setFromObject(model), center = bounds.getCenter(new T.Vector3()), direction = new T.Vector3(2, 1.1, 10).normalize();
    camera.position.copy(center).addScaledVector(direction, perspectiveBoxFitDistance(bounds.getSize(new T.Vector3()).toArray(), direction.toArray(), camera.aspect, camera.fov));
    camera.lookAt(center); renderer.render(scene, camera);
    const data = renderer.domElement.toDataURL('image/png');
    model.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
    renderer.dispose(); return data;
  });
  const bytes = await sharp(Buffer.from(image.split(',')[1], 'base64')).webp({ quality: 92 }).toBuffer();
  await writeFile('public/models/pisa-exterior.webp', bytes);
  console.log(JSON.stringify({ bytes: bytes.length, dimensions: [1080, 1800] }));
} finally { await browser.close(); }
