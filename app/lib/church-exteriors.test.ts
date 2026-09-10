// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi, afterEach } from 'vitest';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { builders } from '../../sources/exteriors/churches/models.mjs';
import { churchExteriorSlugs, hasChurchExterior } from './church-exterior-registry';
import { disposeChurchTextures, loadChurchExterior } from './church-exterior-model';

const directory = new URL('../../public/models/churches/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', directory), 'utf8'));
const evidence = JSON.parse(await readFile(new URL('../../sources/exteriors/churches/source-manifest.json', import.meta.url), 'utf8'));
function dispose(root: T.Object3D) {
  const materials = new Set<T.Material>();
  root.traverse(o => {
    if (!(o instanceof T.Mesh)) return;
    o.geometry.dispose();
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m));
  });
  materials.forEach(m => m.dispose());
}

describe('church exterior delivery', () => {
  it('covers every selected site with local geometry, evidence and fallback', async () => {
    expect(catalog.map((x: {slug: string}) => x.slug).sort()).toEqual([...churchExteriorSlugs, 'st-peters-basilica'].sort());
    expect(evidence.sites.map((x: {slug: string}) => x.slug).sort()).toEqual(catalog.map((x: {slug: string}) => x.slug).sort());
    for (const item of catalog) {
      expect((await readFile(new URL(item.asset, directory))).byteLength).toBeGreaterThan(1000);
      expect((await readFile(new URL(item.fallback, directory))).byteLength).toBeGreaterThan(1000);
    }
    expect(hasChurchExterior('uffizi')).toBe(false);
    expect(hasChurchExterior('../unknown')).toBe(false);
  });
  it.each(churchExteriorSlugs)('%s GLB loads with finite UVs and uniformly framed geometry', async slug => {
    const bytes = await readFile(new URL(`${slug}.glb`, directory));
    const root = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), '')).scene;
    const bounds = new T.Box3().setFromObject(root), size = bounds.getSize(new T.Vector3());
    expect(Math.max(size.x, size.z)).toBeCloseTo(16, 3);
    expect(bounds.min.y).toBeCloseTo(0, 3);
    expect(size.y).toBeGreaterThan(2);
    let triangles = 0;
    root.traverse(o => {
      if (!(o instanceof T.Mesh)) return;
      const g = o.geometry;
      for (const name of ['position', 'normal', 'uv']) {
        expect([...g.getAttribute(name).array].every(Number.isFinite)).toBe(true);
      }
      triangles += (g.index?.count ?? g.attributes.position.count) / 3;
    });
    expect(triangles).toBe(catalog.find((x: {slug: string}) => x.slug === slug).triangles);
    dispose(root);
  });
  it('preserves the approved Milan building geometry and distinct new silhouettes', () => {
    expect(catalog.find((x: {slug: string}) => x.slug === 'milan-duomo').geometryHash).toBe('a6583e90afcfd4d05f24bf76db15ffc586c52ac7efa8749d2fc8deb06c304a40');
    const generated = catalog.filter((x: {method: string}) => x.method === 'new-massing');
    expect(generated).toHaveLength(9);
    expect(new Set(generated.map((x: {geometryHash: string}) => x.geometryHash)).size).toBe(9);
    expect(generated.every((x: {triangles: number}) => x.triangles < 30000)).toBe(true);
  });
  it.each([
    ['st-mark-basilica', 'principal-dome', 5],
    ['florence-duomo', 'major-tribune', 3],
    ['cologne-cathedral', 'principal-tower', 2],
    ['notre-dame-towers', 'principal-tower', 2],
    ['barcelona-cathedral', 'presbytery-bell-tower', 2],
    ['santa-maria-mar', 'principal-tower', 2],
  ] as const)('%s retains its defining major component layout', (slug, feature, count) => {
    const root = builders[slug]();
    expect(root.userData.featureCounts[feature]).toBe(count);
    dispose(root);
  });
  it('keeps the Pisa drum elliptical and the Barcelona entrance spire away from the choir towers', () => {
    const pisa = builders['pisa-cathedral']();
    const drum = new T.Box3().setFromObject(pisa.getObjectByName('elliptical-drum')!).getSize(new T.Vector3());
    expect(drum.z / drum.x).toBeCloseTo(12.9 / 9.5, 3);
    const barcelona = builders['barcelona-cathedral']();
    const center = (name: string) => new T.Box3().setFromObject(barcelona.getObjectByName(name)!).getCenter(new T.Vector3());
    expect(center('entrance-cimbori').z - center('octagonal-bell-tower').z).toBeGreaterThan(40);
    dispose(pisa); dispose(barcelona);
  });
});

describe('church exterior loader lifecycle', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  function mockModel() {
    const root = new T.Group(), material = new T.MeshStandardMaterial({name:'marble'});
    root.add(new T.Mesh(new T.BoxGeometry(), material));
    vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockResolvedValue({scene:root} as never);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true, arrayBuffer:async()=>new ArrayBuffer(1)}));
    return {root, material};
  }
  it('keeps useful geometry if the decorative texture fails', async () => {
    const {root} = mockModel();
    vi.spyOn(T.TextureLoader.prototype, 'loadAsync').mockRejectedValue(new Error('offline texture'));
    expect(await loadChurchExterior('milan-duomo', new AbortController().signal)).toBe(root);
    expect(root.userData.materialStatus).toBe('untextured');
    dispose(root);
  });
  it('disposes a texture and geometry when navigation interrupts loading', async () => {
    const {root, material} = mockModel(), controller = new AbortController();
    const texture = new T.Texture<HTMLImageElement>(), textureDisposed = vi.spyOn(texture, 'dispose');
    const materialDisposed = vi.spyOn(material, 'dispose');
    const geometryDisposed = vi.spyOn((root.children[0] as T.Mesh).geometry, 'dispose');
    vi.spyOn(T.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => {controller.abort(); return texture;});
    await expect(loadChurchExterior('milan-duomo', controller.signal)).rejects.toThrow();
    expect(textureDisposed).toHaveBeenCalledOnce();
    expect(materialDisposed).toHaveBeenCalledOnce();
    expect(geometryDisposed).toHaveBeenCalledOnce();
  });
  it('shares and releases the loaded local marble texture once', async () => {
    const {root, material} = mockModel(), texture = new T.Texture<HTMLImageElement>();
    root.add(new T.Mesh(new T.BoxGeometry(), material));
    vi.spyOn(T.TextureLoader.prototype, 'loadAsync').mockResolvedValue(texture);
    await loadChurchExterior('milan-duomo', new AbortController().signal);
    expect(material.map).toBe(texture);
    expect(texture.wrapS).toBe(T.RepeatWrapping);
    const released = vi.spyOn(texture, 'dispose');
    disposeChurchTextures(root);
    expect(released).toHaveBeenCalledOnce();
    dispose(root);
  });
});
