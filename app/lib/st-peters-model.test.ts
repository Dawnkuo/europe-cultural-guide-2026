// @vitest-environment node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import {
  decodeAccessor,
  readGlb,
} from "../../scripts/extract-st-peters-exterior.mjs";
import { disposeStPetersModel, prepareStPetersModel } from "./st-peters-model";

const path = "public/models/st-peters-exterior.glb";
const sha = (data: Uint8Array) =>
  createHash("sha256").update(data).digest("hex");

describe("reviewed St Peter exterior asset", () => {
  it("retains every source vertex, normal, color and index without loading the interior or remote assets", async () => {
    const bytes = await readFile(path);
    const manifest = JSON.parse(
      await readFile("sources/exteriors/st-peters-model.json", "utf8"),
    );
    expect(sha(bytes)).toBe(manifest.outputSha256);
    expect(bytes.length).toBeLessThan(8_000_000);
    const source = readGlb(bytes);
    expect(source.json.meshes).toHaveLength(1);
    expect(source.json.nodes).toHaveLength(2);
    expect(source.json.images).toBeUndefined();
    expect(
      source.json.buffers.every((buffer: { uri?: string }) => !buffer.uri),
    ).toBe(true);
    for (const accessor of manifest.accessors) {
      const decoded = await decodeAccessor(source, accessor.outputAccessor);
      expect(sha(decoded.bytes), accessor.semantic).toBe(
        accessor.decodedSha256,
      );
    }
    expect(source.json.accessors[0].count).toBe(684737);
    expect(source.json.accessors.at(-1).count / 3).toBe(501503);
  });

  it("loads using the browser decoder, keeps one material draw and provides distinct finite camera regions", async () => {
    const bytes = await readFile(path);
    const gltf = await new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .parseAsync(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
        "",
      );
    const model = prepareStPetersModel(gltf.scene);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    expect(size.z).toBeCloseTo(20);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(size.x).toBeCloseTo(10.235);
    expect(size.y).toBeGreaterThan(6);
    const meshes: THREE.Mesh[] = [];
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) meshes.push(object);
    });
    expect(meshes).toHaveLength(1);
    expect(
      (meshes[0].material as THREE.MeshStandardMaterial).vertexColors,
    ).toBe(true);
    const regions = model.userData.focusRegions;
    expect(regions.map((r: { id: string }) => r.id)).toEqual([
      "basilica",
      "square",
    ]);
    expect(regions[0].max[2]).toBeLessThan(regions[1].max[2]);
    for (const region of regions) {
      expect([...region.min, ...region.max].every(Number.isFinite)).toBe(true);
      region.min.forEach((value: number, index: number) =>
        expect(value).toBeLessThan(region.max[index]),
      );
    }
    disposeStPetersModel(model);
  });
});
