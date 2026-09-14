// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import clipping from 'polygon-clipping';
import { museumExteriorSlugs, hasMuseumExterior } from './museum-exterior-registry';
import { loadMuseumExterior } from './church-exterior-model';
import { museums } from '../../sources/exteriors/museums/catalog.mjs';
import { readFootprints, selectedGeometry, area } from '../../sources/exteriors/museums/footprints.mjs';

const directory = new URL('../../public/models/museums/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('catalog.json', directory), 'utf8'));
const evidence = JSON.parse(await readFile(new URL('../../sources/exteriors/museums/source-manifest.json', import.meta.url), 'utf8'));
async function model(slug: string) {
  const bytes = await readFile(new URL(slug + '.glb', directory));
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), '')).scene;
}
function dispose(root: T.Object3D) {
  const materials = new Set<T.Material>();
  root.traverse(o => { if (o instanceof T.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } });
  materials.forEach(m => m.dispose());
}
function contains(r: number[][], [x, y]: number[]) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [ax, ay] = r[i], [bx, by] = r[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

describe('museum exterior delivery', () => {
  it('covers the entire agreed museum batch, without duplicate church models', () => {
    const expected = [...museumExteriorSlugs].sort();
    expect(expected).toHaveLength(21);
    expect(museums.map(m => m.slug).sort()).toEqual(expected);
    expect(catalog.map((m: {slug: string}) => m.slug).sort()).toEqual(expected);
    expect(evidence.sites.map((m: {slug: string}) => m.slug).sort()).toEqual(expected);
    expect(new Set(catalog.map((m: {geometryHash: string}) => m.geometryHash)).size).toBe(21);
    expect(hasMuseumExterior('cologne-treasury')).toBe(false);
    expect(hasMuseumExterior('../uffizi')).toBe(false);
  });
  it.each(museumExteriorSlugs)('%s has loadable local geometry, footprint evidence and a nonempty fallback', async slug => {
    const root = await model(slug), size = new T.Box3().setFromObject(root).getSize(new T.Vector3());
    expect(Math.max(size.x, size.z)).toBeCloseTo(16, 3);
    expect(new T.Box3().setFromObject(root).min.y).toBeCloseTo(0, 3);
    let triangles = 0;
    root.traverse(o => {
      if (!(o instanceof T.Mesh)) return;
      for (const name of ['position', 'normal', 'uv']) expect([...o.geometry.getAttribute(name).array].every(Number.isFinite)).toBe(true);
      triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    });
    expect(triangles).toBe(catalog.find((m: {slug: string}) => m.slug === slug).triangles);
    const fallback = await readFile(new URL(slug + '.svg', directory), 'utf8');
    expect(fallback).toContain('<polygon');
    expect(fallback).not.toMatch(/NaN|undefined/);
    const item = museums.find(m => m.slug === slug)!, source = readFootprints(slug);
    for (const key of item.keys) {
      const tags = source.lookup.get(key).tags;
      const retainedCampus = slug === 'vatican-museums' && key === 'w255959482' && tags.tourism === 'museum';
      expect(tags.building || tags['building:part'] || retainedCampus).toBeTruthy();
      expect(source.polygon(key).length).toBeGreaterThan(0);
    }
    expect(evidence.sites.find((m: {slug: string}) => m.slug === slug).architecturalSources.length).toBeGreaterThan(0);
    dispose(root);
  });
  it('retains the Vatican campus ground and all four court surfaces without excavation', async () => {
    const root = await model('vatican-museums');
    const ground = root.getObjectByName('retained-campus-ground');
    expect(ground).toBeTruthy();
    expect(new T.Box3().setFromObject(ground!).getSize(new T.Vector3()).y).toBeGreaterThan(0);
    const building = root.getObjectByName('vatican-museums')!;
    expect(building.userData.featureCounts['courtyard-ground']).toBe(4);
    expect(evidence.sites.find((m: {slug: string}) => m.slug === 'vatican-museums').retainedGroundCourts).toHaveLength(4);
    dispose(root);
  });
  it('gives each Vatican court one ground surface, without a competing base cap', async () => {
    const root = await model('vatican-museums');
    root.updateMatrixWorld(true);
    const ground: T.Mesh[] = [];
    root.traverse(o => { if (o instanceof T.Mesh && /^(retained-campus-ground|courtyard-ground)/.test(o.name)) ground.push(o); });
    const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
    const cross = new T.Vector3(), ray = new T.Raycaster();
    let surfaceArea = 0, samples = 0;
    for (const mesh of ground) {
      expect(mesh.userData.surfaceRole).toBe('ground');
      expect((mesh.material as T.Material).side).toBe(T.FrontSide);
      const p = mesh.geometry.attributes.position, index = mesh.geometry.index;
      for (let i = 0; i < (index?.count ?? p.count); i += 3) {
        [a,b,c].forEach((v,j) => v.fromBufferAttribute(p,index ? index.getX(i+j) : i+j).applyMatrix4(mesh.matrixWorld));
        cross.crossVectors(b.clone().sub(a),c.clone().sub(a));
        if (cross.y <= 1e-9) continue;
        surfaceArea += cross.y / 2;
        if (!mesh.name.startsWith('courtyard-ground')) continue;
        const center = a.clone().add(b).add(c).divideScalar(3);
        ray.set(center.clone().add(new T.Vector3(0,1,0)),new T.Vector3(0,-1,0));
        const hits = ray.intersectObjects(ground).filter(hit => (hit.face?.normal.y ?? 0) > .99);
        expect(hits, `ground overlap at ${center.toArray().join(',')}`).toHaveLength(1);
        expect(hits[0].object).toBe(mesh);
        samples++;
      }
    }
    const source = readFootprints('vatican-museums'), item = museums.find(m => m.slug === 'vatican-museums')!;
    const scale = ground[0].getWorldScale(new T.Vector3()).x;
    const groundCourts: string[] = evidence.sites.find((m: {slug: string}) => m.slug === 'vatican-museums').retainedGroundCourts;
    const footprint = clipping.union(selectedGeometry(source,item.keys),...groundCourts.map(key=>source.polygon(key)));
    expect(surfaceArea).toBeCloseTo(area(footprint) * scale * scale, 4);
    expect(samples).toBeGreaterThan(8);
    dispose(root);
  });
  it.each([
    ['uffizi', 'tribuna-dome'], ['accademia-florence', 'david-tribuna-skylight'],
    ['brera', 'observatory-dome'], ['gaudi-house', 'house-spire'],
  ])('%s keeps its landmark roof anchored within its own building footprint', async (slug, feature) => {
    const root = await model(slug), part = root.getObjectByName(feature)! as T.Mesh;
    const localCenter = part.geometry.boundingBox ?? (part.geometry.computeBoundingBox(), part.geometry.boundingBox);
    const p = localCenter!.getCenter(new T.Vector3());
    const source = readFootprints(slug), item = museums.find(m => m.slug === slug)!;
    const footprint = selectedGeometry(source, item.keys);
    expect(footprint.some(poly => contains(poly[0], [p.x,p.z]) && !poly.slice(1).some(r => contains(r,[p.x,p.z])))).toBe(true);
    dispose(root);
  });
  it.each(['brera', 'camposanto', 'uffizi', 'doges-palace'])('%s includes open colonnade geometry', async slug => {
    const root = await model(slug);
    expect(root.getObjectByName('open-loggia')).toBeTruthy();
    dispose(root);
  });
});

describe('museum loader isolation', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('loads only the selected museum asset and does not fetch unnecessary marble textures', async () => {
    const root = new T.Group(); root.add(new T.Mesh(new T.BoxGeometry(), new T.MeshStandardMaterial({name:'brick'})));
    vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockResolvedValue({scene:root} as never);
    const fetcher = vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});
    vi.stubGlobal('fetch',fetcher);
    const texture = vi.spyOn(T.TextureLoader.prototype,'loadAsync');
    await loadMuseumExterior('brera',new AbortController().signal);
    expect(fetcher.mock.calls[0][0]).toMatch(/\/models\/museums\/brera\.glb$/);
    expect(root.userData.id).toBe('museum-massing:brera');
    expect(texture).not.toHaveBeenCalled(); dispose(root);
  });
  it('rejects a non-museum before making a request', async () => {
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
    await expect(loadMuseumExterior('notre-dame-towers',new AbortController().signal)).rejects.toThrow('Unsupported museum');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('keeps ground as a shadow receiver without turning it into a self-shadowing caster', async () => {
    const root = new T.Group();
    const ground = new T.Mesh(new T.PlaneGeometry(),new T.MeshStandardMaterial({name:'garden'}));
    ground.userData.surfaceRole='ground';
    const building = new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({name:'brick'}));
    root.add(ground,building);
    vi.spyOn(GLTFLoader.prototype,'parseAsync').mockResolvedValue({scene:root} as never);
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}));
    await loadMuseumExterior('vatican-museums',new AbortController().signal);
    expect(ground.castShadow).toBe(false);
    expect(ground.receiveShadow).toBe(true);
    expect(building.castShadow).toBe(true);
    dispose(root);
  });
});
