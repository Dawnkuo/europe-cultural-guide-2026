import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseColosseumSurface } from './colosseum-obj-surface.mjs';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

// Study output stays outside public/. Acceptance of the scene, source and
// current-state limitations is separate from successful asset conversion.
const directory = 'work/experience/colosseum-source-study';
const venueClay = process.argv.includes('--venue-clay');
const settings = JSON.parse(await readFile(`${directory}/settings.json`, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const aligned = size => Math.ceil(size / 4) * 4;
const obj = await readFile(`${directory}/colosseum_rgb.obj`);
assert.ok(obj.length > 1000000 && obj.includes(Buffer.from('\nv ')), 'Not an OBJ mesh');
const { geometry, sourceFaceCount, sourceLineCount } = parseColosseumSurface(obj.toString());
const position = geometry.attributes.position;
const normal = geometry.attributes.normal;
const uv = geometry.attributes.uv;
assert.equal(position.count, normal.count);
assert.equal(position.count, uv.count);
assert.equal(position.count % 3, 0);
assert.equal(position.count / 3, sourceFaceCount, 'Unexpected face conversion');

// Deduplicate only byte-identical complete vertex tuples. No rounding,
// decimation, smoothing, axis scaling or hole filling is performed.
const attributes = venueClay ? [position, normal] : [position, normal, uv];
const bitViews = attributes.map(attribute => new Uint32Array(attribute.array.buffer, attribute.array.byteOffset, attribute.array.length));
const unique = new Map();
const sourceIndices = [];
const includedCorners = [];
for (let face = 0; face < position.count; face += 3) {
  // Retain whole triangles intersecting the published research ROI plus a
  // context margin. No slicing, capping or modification of retained surfaces.
  const outside = venueClay && [0, 2].some(axis => {
    const values = [0, 1, 2].map(corner => position.array[(face + corner) * 3 + axis]);
    return Math.max(...values) < settings.scene.x_min[axis] - 0.35 || Math.min(...values) > settings.scene.x_max[axis] + 0.35;
  });
  if (!outside) includedCorners.push(face, face + 1, face + 2);
}
const indices = new Uint32Array(includedCorners.length);
for (const [corner, i] of includedCorners.entries()) {
  const bits = bitViews.flatMap((view, a) => Array.from(view.subarray(i * attributes[a].itemSize, (i + 1) * attributes[a].itemSize)));
  const key = bits.join(',');
  let index = unique.get(key);
  if (index === undefined) {
    index = sourceIndices.length;
    unique.set(key, index);
    sourceIndices.push(i);
  }
  indices[corner] = index;
}
unique.clear();
const packed = attributes.map(attribute => {
  const array = new Float32Array(sourceIndices.length * attribute.itemSize);
  sourceIndices.forEach((sourceIndex, i) => {
    for (let axis = 0; axis < attribute.itemSize; axis++) {
      const value = attribute.array[sourceIndex * attribute.itemSize + axis];
      assert.ok(Number.isFinite(value), 'Non-finite source attribute');
      array[i * attribute.itemSize + axis] = value;
    }
  });
  return array;
});
for (let i = 0; i < indices.length; i++) {
  for (let a = 0; a < attributes.length; a++) {
    for (let axis = 0; axis < attributes[a].itemSize; axis++) {
      assert.equal(packed[a][indices[i] * attributes[a].itemSize + axis], attributes[a].array[includedCorners[i] * attributes[a].itemSize + axis]);
    }
  }
}
geometry.computeBoundingBox();
const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
for (let i = 0; i < packed[0].length; i++) {
  const axis = i % 3;
  bounds.min[axis] = Math.min(bounds.min[axis], packed[0][i]);
  bounds.max[axis] = Math.max(bounds.max[axis], packed[0][i]);
}
const texture = await readFile(`${directory}/a-Colosseum.jpg`);
const textureInfo = await sharp(texture).metadata();
const webp = await sharp(texture).resize({ width: 4096, height: 4096, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
await MeshoptEncoder.ready;
const bufferViews = [];
const accessors = [];
const chunks = [];
let offset = 0;
let decodedOffset = 0;
function chunk(bytes) {
  const at = offset;
  const padded = Buffer.alloc(aligned(bytes.byteLength));
  padded.set(bytes);
  chunks.push(padded);
  offset += padded.length;
  return at;
}
function attribute(array, components, type, componentType, extra = {}) {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  const mode = type === 'SCALAR' ? 'TRIANGLES' : 'ATTRIBUTES';
  const stride = components * 4;
  const count = array.length / components;
  const encoded = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
  const bufferView = bufferViews.length;
  bufferViews.push({
    buffer: 1, byteOffset: decodedOffset, byteLength: bytes.length,
    ...(type === 'SCALAR' ? { target: 34963 } : { target: 34962, byteStride: stride }),
    extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: chunk(encoded), byteLength: encoded.length, byteStride: stride, count, mode } },
  });
  decodedOffset += aligned(bytes.length);
  accessors.push({ bufferView, componentType, count, type, ...extra });
  return accessors.length - 1;
}
const primitive = {
  attributes: {
    POSITION: attribute(packed[0], 3, 'VEC3', 5126, bounds),
    NORMAL: attribute(packed[1], 3, 'VEC3', 5126),
    // OBJ/Blender and glTF use opposite texture V origins.
    ...(venueClay ? {} : { TEXCOORD_0: attribute(packed[2].map((value, i) => i % 2 ? 1 - value : value), 2, 'VEC2', 5126) }),
  },
  indices: attribute(indices, 1, 'SCALAR', 5125), material: 0,
};
const imageView = bufferViews.length;
if (!venueClay) bufferViews.push({ buffer: 0, byteOffset: chunk(webp), byteLength: webp.length });
const json = {
  asset: { version: '2.0', generator: 'Internal lossless-geometry Colosseum source review' },
  extensionsUsed: ['EXT_meshopt_compression', ...(venueClay ? [] : ['EXT_texture_webp'])],
  extensionsRequired: ['EXT_meshopt_compression', ...(venueClay ? [] : ['EXT_texture_webp'])],
  buffers: [{ byteLength: offset }, { byteLength: decodedOffset, extensions: { EXT_meshopt_compression: { fallback: true } } }],
  bufferViews, accessors,
  ...(venueClay ? {} : {
    images: [{ bufferView: imageView, mimeType: 'image/webp' }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    textures: [{ sampler: 0, extensions: { EXT_texture_webp: { source: 0 } } }],
  }),
  materials: [{ pbrMetallicRoughness: { ...(venueClay ? { baseColorFactor: [0.58, 0.51, 0.4, 1] } : { baseColorTexture: { index: 0 } }), metallicFactor: 0, roughnessFactor: 1 } }],
  meshes: [{ name: 'Colosseum source mesh, not a surveyed visitor plan', primitives: [primitive] }],
  nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }], scene: 0,
};
const jsonBytes = Buffer.from(JSON.stringify(json));
const text = Buffer.alloc(aligned(jsonBytes.length), 0x20);
text.set(jsonBytes);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + text.length + offset, 8);
header.writeUInt32LE(text.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(offset, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
const glb = Buffer.concat([header, text, binHeader, ...chunks]);
const prefix = venueClay ? 'colosseum-venue-study' : 'colosseum-study';
await writeFile(`${directory}/${prefix}.glb`, glb);
const manifest = {
  status: 'unreviewed-exterior-study-not-release',
  sourceProject: 'https://github.com/Anttwo/MACARONS',
  sourceFolder: 'https://drive.google.com/drive/folders/1J4yz-5Ii2qfLX2DHLoDdtEcu4OaWPXf_',
  creator: 'Brian Trepanier',
  originalModel: 'https://sketchfab.com/3d-models/colosseum-rome-italy-535dc96e586f40bd956ea3cbff810055',
  sourceObjSha256: sha(obj), sourceTextureSha256: sha(texture), outputSha256: sha(glb),
  sourceBytes: obj.length, outputBytes: glb.length,
  triangles: indices.length / 3, vertices: sourceIndices.length,
  sourceLooseEdgesExcluded: sourceLineCount,
  sourceTriangles: sourceFaceCount,
  contextTrianglesExcluded: sourceFaceCount - indices.length / 3,
  retainedTriangleIndicesSha256: sha(new Uint32Array(includedCorners.filter((_, i) => i % 3 === 0).map(index => index / 3))),
  contextSelection: venueClay ? { xMin: settings.scene.x_min[0] - 0.35, xMax: settings.scene.x_max[0] + 0.35, zMin: settings.scene.x_min[2] - 0.35, zMax: settings.scene.x_max[2] + 0.35 } : null,
  bounds,
  texture: venueClay
    ? { embedded: false, sourceWidth: textureInfo.width, sourceHeight: textureInfo.height }
    : { embedded: true, sourceWidth: textureInfo.width, sourceHeight: textureInfo.height, outputMaxDimension: 4096, bytes: webp.length },
  conversion: venueClay
    ? 'Whole triangles intersecting the research ROI plus 0.35 source-unit context margin retained. Exact float32 position/normal tuples indexed and losslessly compressed. No smoothing, simplification, hole filling or capping; neutral material instead of the visibly triangulated source texture.'
    : 'Original parsed float32 position/normal tuples retained exactly; duplicate tuples indexed; texture V converted from OBJ to glTF origin; meshopt lossless attribute compression. Texture downsampled to 4096 WebP. No geometry simplification.',
  limitation: 'The research dataset establishes asset provenance, not surveying accuracy or the current visitor route. Capture methodology and current structural details still require review.',
};
await writeFile(`${directory}/${venueClay ? 'venue-mesh-study' : 'mesh-study'}.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
