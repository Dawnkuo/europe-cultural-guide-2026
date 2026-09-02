import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type PrecacheManifest = {
  version: string;
  bytes: number;
  files: Array<{ url: string; bytes: number; sha256: string }>;
};

const importRoot = resolve(process.cwd(), "public/vatican-guide");

describe("embedded Vatican offline guide", () => {
  function fileManifest() {
    return JSON.parse(
      readFileSync(resolve(importRoot, "precache.json"), "utf8"),
    ) as PrecacheManifest;
  }

  function runtimeManifest() {
    const declaration = readFileSync(resolve(importRoot, "sw.js"), "utf8")
      .split("\n")
      .find((line) => line.startsWith("const PRECACHE = "))!;
    return JSON.parse(
      declaration.slice("const PRECACHE = ".length, -1),
    ) as PrecacheManifest;
  }

  it("keeps and verifies every runtime-precached asset inside the imported local directory", () => {
    const manifest = fileManifest();

    expect(runtimeManifest()).toEqual(manifest);
    expect(manifest.bytes).toBe(
      manifest.files.reduce((total, file) => total + file.bytes, 0),
    );

    for (const file of manifest.files) {
      expect(file.url.startsWith("./")).toBe(true);
      const path = resolve(importRoot, file.url.slice(2));
      expect(path.startsWith(`${importRoot}/`)).toBe(true);
      expect(statSync(path).size).toBe(file.bytes);
      expect(
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ).toBe(file.sha256);
    }
  });

  it("does not send visitors to the old hosted Vatican guide", () => {
    const searchableFiles = [
      "index.html",
      "assets/app.js",
      "assets/offline.js",
      "sw.js",
      "manifest.webmanifest",
    ];

    for (const file of searchableFiles) {
      const body = readFileSync(resolve(importRoot, file), "utf8");
      expect(body).not.toContain("dawnkuo.github.io/vatican-offline-guide");
      expect(body).not.toContain('"/vatican-offline-guide/"');
    }
  });
});
