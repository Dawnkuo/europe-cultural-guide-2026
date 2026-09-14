import { describe, expect, it } from 'vitest';
import { parseColosseumSurface } from './colosseum-obj-surface.mjs';

const triangle = `o source
v 0 0 0
v 1 0 0
v 0 1 0
vt 0 0
vt 1 0
vt 0 1
vn 0 0 1
f 1/1/1 2/2/1 3/3/1`;

describe('Colosseum source surface conversion', () => {
  it('preserves face positions, normal and UVs when loose edges follow faces', () => {
    const result = parseColosseumSurface(`${triangle}\n l 1 2\nl 2 3\n`);
    expect(result.sourceFaceCount).toBe(1);
    expect(result.sourceLineCount).toBe(2);
    expect(Array.from(result.geometry.attributes.position.array)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    expect(Array.from(result.geometry.attributes.normal.array)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    expect(Array.from(result.geometry.attributes.uv.array)).toEqual([0, 0, 1, 0, 0, 1]);
    result.geometry.dispose();
  });
  it('rejects an edge-only file rather than turning it into a surface', () => {
    expect(() => parseColosseumSurface('v 0 0 0\nv 1 0 0\nl 1 2')).toThrow('No mesh faces');
  });
  it('fails closed when face topology or object inventory changes', () => {
    expect(() => parseColosseumSurface(`${triangle} 1/1/1`)).toThrow('Expected triangular source faces');
    expect(() => parseColosseumSurface(`${triangle}\no second\nf 1/1/1 2/2/1 3/3/1`)).toThrow('Review additional source objects');
  });
});
