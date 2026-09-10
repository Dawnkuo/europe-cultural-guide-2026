import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const aligned = (value) => (value + 3) & ~3;
const hash = (value) => createHash("sha256").update(value).digest("hex");

export function readGlb(bytes) {
  if (
    bytes.readUInt32LE(0) !== 0x46546c67 ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw new Error("Invalid GLB");
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
  const binOffset = 28 + jsonLength;
  return { json, bin: bytes.subarray(binOffset) };
}

export async function decodeAccessor(source, index) {
  await MeshoptDecoder.ready;
  const accessor = source.json.accessors[index];
  const view = source.json.bufferViews[accessor.bufferView];
  const compression = view.extensions?.EXT_meshopt_compression;
  if (!compression || compression.buffer !== 0)
    throw new Error("Expected an embedded meshopt buffer");
  const decoded = new Uint8Array(compression.count * compression.byteStride);
  MeshoptDecoder.decodeGltfBuffer(
    decoded,
    compression.count,
    compression.byteStride,
    source.bin.subarray(
      compression.byteOffset,
      compression.byteOffset + compression.byteLength,
    ),
    compression.mode,
    compression.filter,
  );
  const offset = accessor.byteOffset ?? 0;
  const bytes = decoded.slice(
    offset,
    offset + accessor.count * compression.byteStride,
  );
  if (bytes.length !== accessor.count * compression.byteStride)
    throw new Error("Accessor exceeds its buffer");
  return { bytes, stride: compression.byteStride, mode: compression.mode };
}

export async function extractExterior(input) {
  // Encoding is an optional acquisition step; the shipped asset uses Three's decoder.
  const { MeshoptEncoder } = await import("meshoptimizer");
  await MeshoptEncoder.ready;
  const source = readGlb(input);
  const parent = source.json.nodes.find(
    (node) => node.name === "EXTERIOR_PARENT",
  );
  const named = source.json.nodes.find((node) => node.name === "exteriorMesh");
  const node = source.json.nodes[named?.children?.[0]];
  if (!parent || !node || node.mesh == null)
    throw new Error("Missing exterior hierarchy");
  const primitive = source.json.meshes[node.mesh].primitives;
  if (primitive.length !== 1 || primitive[0].targets)
    throw new Error("Unexpected exterior primitive structure");
  const original = primitive[0];
  const payloads = [];
  const bufferViews = [];
  const accessors = [];
  const verification = [];
  let compressedOffset = 0;
  let decodedOffset = 0;
  async function extract(index, semantic) {
    const data = await decodeAccessor(source, index);
    // Re-encode the already decoded bytes: no simplification, normal filtering or requantization.
    const encoded = MeshoptEncoder.encodeGltfBuffer(
      data.bytes,
      source.json.accessors[index].count,
      data.stride,
      data.mode,
    );
    const viewIndex = bufferViews.length;
    const count = source.json.accessors[index].count;
    const view = {
      buffer: 1,
      byteOffset: decodedOffset,
      byteLength: data.bytes.length,
      target: semantic === "indices" ? 34963 : 34962,
      ...(semantic === "indices" ? {} : { byteStride: data.stride }),
      extensions: {
        EXT_meshopt_compression: {
          buffer: 0,
          byteOffset: compressedOffset,
          byteLength: encoded.length,
          byteStride: data.stride,
          count,
          mode: data.mode,
        },
      },
    };
    bufferViews.push(view);
    const padded = Buffer.alloc(aligned(encoded.length));
    padded.set(encoded);
    payloads.push(padded);
    compressedOffset += padded.length;
    decodedOffset += aligned(data.bytes.length);
    accessors.push({
      ...source.json.accessors[index],
      bufferView: viewIndex,
      byteOffset: 0,
    });
    verification.push({
      semantic,
      sourceAccessor: index,
      outputAccessor: accessors.length - 1,
      count,
      decodedSha256: hash(data.bytes),
    });
    return accessors.length - 1;
  }
  const attributes = {};
  for (const [semantic, index] of Object.entries(original.attributes))
    attributes[semantic] = await extract(index, semantic);
  const indices = await extract(original.indices, "indices");
  const json = {
    asset: { version: "2.0", generator: "Lossless exterior-only extraction" },
    extensionsUsed: source.json.extensionsUsed,
    extensionsRequired: source.json.extensionsRequired,
    buffers: [
      { byteLength: compressedOffset },
      {
        byteLength: decodedOffset,
        extensions: { EXT_meshopt_compression: { fallback: true } },
      },
    ],
    bufferViews,
    accessors,
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [1, 1, 1, 1],
          metallicFactor: 0,
          roughnessFactor: 0.9,
        },
      },
    ],
    meshes: [
      {
        name: "Basilica and square exterior",
        primitives: [{ attributes, indices, material: 0 }],
      },
    ],
    nodes: [
      { ...parent, children: [1] },
      { ...node, name: "exteriorMesh", mesh: 0 },
    ],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
  const text = Buffer.from(JSON.stringify(json));
  const jsonChunk = Buffer.alloc(aligned(text.length), 0x20);
  text.copy(jsonChunk);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + jsonChunk.length + compressedOffset, 8);
  header.writeUInt32LE(jsonChunk.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(compressedOffset, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return {
    bytes: Buffer.concat([header, jsonChunk, binHeader, ...payloads]),
    verification,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const sourcePath =
    process.argv[2] ??
    "work/experience/st-peters-source/basilica_low_241217_opt.glb";
  const outputPath = "public/models/st-peters-exterior.glb";
  const source = await readFile(sourcePath);
  const result = await extractExterior(source);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, result.bytes);
  const manifest = {
    sourceUrl:
      "https://virtual-cdn.basilicasanpietro.va/basilica-viewer/gltf/basilica_low_241217_opt.glb",
    configUrl:
      "https://virtual-cdn.basilicasanpietro.va/basilica-viewer/config/basilicaconfig_2025.json",
    sourcePath,
    outputPath,
    sourceSha256: hash(source),
    outputSha256: hash(result.bytes),
    sourceBytes: source.length,
    outputBytes: result.bytes.length,
    operation:
      "Exterior subtree only; original transforms, vertices, colors, normals and triangles retained. No simplification. Meshopt triangle encoding may cyclically rotate a triangle index triplet without changing its geometry.",
    accessors: result.verification,
  };
  await writeFile(
    "sources/exteriors/st-peters-model.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      outputPath,
      bytes: result.bytes.length,
      vertices: result.verification[0].count,
      triangles: result.verification.at(-1).count / 3,
    }),
  );
}
