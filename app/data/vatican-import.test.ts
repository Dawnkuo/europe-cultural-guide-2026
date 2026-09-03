import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const importRoot = resolve(process.cwd(), 'public/vatican-guide');

const reusedImages = [
  'e74b56fe93a51192d6.webp',
  '60870758ced9f2717c.webp',
  '414f85f266b23488b8.webp',
  'd17104dfc05130fee8.webp',
  '942ae98cc350e8c5ec.webp',
  '87a903cd3ef4e8f849.webp',
  '0adf582fd3b337d9b7.webp',
  '8468f3720f411fd64b.webp',
  '87b056610ddec2ee19.webp',
  '7c8ef6daf2c79cae8b.webp',
];

describe('native Vatican guide material', () => {
  it('keeps the reviewed local artwork and architecture images', () => {
    for (const image of reusedImages) {
      const path = resolve(importRoot, 'assets', 'images', image);
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(0);
    }
  });

  it('does not retain the legacy solid-model runtime shell', () => {
    for (const file of [
      'index.html',
      'assets/app.js',
      'assets/app.css',
      'assets/offline.js',
      'manifest.webmanifest',
      'precache.json',
      'sw.js',
    ]) {
      expect(existsSync(resolve(importRoot, file))).toBe(false);
    }
  });
});
