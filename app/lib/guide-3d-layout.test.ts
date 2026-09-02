import { describe, expect, it } from 'vitest';
import { buildGuideSceneLayout } from './guide-3d-layout';

const stops = ['入口', '主空间', '高处视点', '出口'];

describe('buildGuideSceneLayout', () => {
  it.each(['floorplan', 'site', 'viewpoints', 'district'] as const)(
    'builds a spatially distinct %s scene with one node per real stop',
    (type) => {
      const scene = buildGuideSceneLayout({
        slug: `test-${type}`,
        type,
        stops,
      });

      expect(scene.nodes.map((node) => node.label)).toEqual(stops);
      expect(
        new Set(scene.nodes.map((node) => node.position.join(','))).size,
      ).toBe(stops.length);
      expect(scene.paths.length).toBeGreaterThan(0);
      expect(scene.camera.position[1]).toBeGreaterThan(3);
    },
  );

  it('keeps the same attraction deterministic while changing another attraction', () => {
    const first = buildGuideSceneLayout({
      slug: 'pantheon',
      type: 'site',
      stops,
    });
    const repeat = buildGuideSceneLayout({
      slug: 'pantheon',
      type: 'site',
      stops,
    });
    const other = buildGuideSceneLayout({
      slug: 'colosseum',
      type: 'site',
      stops,
    });

    expect(repeat).toEqual(first);
    expect(other.accent).not.toEqual(first.accent);
  });

  it('keeps floorplan stops in visit order along a readable main axis', () => {
    const scene = buildGuideSceneLayout({
      slug: 'brera',
      type: 'floorplan',
      stops,
    });

    expect(scene.nodes.map((node) => node.position[0])).toEqual(
      [...scene.nodes]
        .map((node) => node.position[0])
        .sort((left, right) => left - right),
    );
    expect(scene.paths).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it('uses a central landmark with surrounding viewpoints', () => {
    const scene = buildGuideSceneLayout({
      slug: 'koln-triangle',
      type: 'viewpoints',
      stops,
    });

    expect(scene.nodes[0].position).toEqual([0, 0, 0]);
    expect(
      scene.nodes.slice(1).every((node) =>
        Math.hypot(node.position[0], node.position[2]) >= 4.8,
      ),
    ).toBe(true);
  });
});
