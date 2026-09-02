import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type PrecacheManifest = {
  files: Array<{ url: string; bytes: number }>;
};

const importRoot = resolve(process.cwd(), "public/vatican-guide");

describe("embedded Vatican offline guide", () => {
  it("keeps every precached asset inside the imported local directory", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(importRoot, "precache.json"), "utf8"),
    ) as PrecacheManifest;

    for (const file of manifest.files) {
      expect(file.url.startsWith("./")).toBe(true);
      const path = resolve(importRoot, file.url.slice(2));
      expect(path.startsWith(`${importRoot}/`)).toBe(true);
      expect(statSync(path).size).toBe(file.bytes);
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
      expect(readFileSync(resolve(importRoot, file), "utf8")).not.toContain(
        "dawnkuo.github.io/vatican-offline-guide",
      );
    }
  });
});
