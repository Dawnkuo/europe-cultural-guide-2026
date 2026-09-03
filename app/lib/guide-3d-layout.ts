import type { GuideSpatialType } from '../data/types';
import {
  buildGuideModel,
  type GuideModelBasis,
  type GuideScenePart,
  type Vec3,
} from './guide-3d-models';

export type GuideSceneNode = {
  label: string;
  position: Vec3;
};

export type GuideSceneLayout = {
  profile: string;
  modelBasis: GuideModelBasis;
  environment:
    | 'interior'
    | 'plaza'
    | 'historic-site'
    | 'waterfront'
    | 'park'
    | 'hillside'
    | 'urban';
  parts: GuideScenePart[];
  nodes: GuideSceneNode[];
  paths: Array<[number, number]>;
  camera: {
    position: Vec3;
    target: Vec3;
  };
  accent: number;
};

type BuildGuideSceneLayoutInput = {
  slug: string;
  type: GuideSpatialType;
  stops: string[];
};

const accents = [0xc9a35f, 0xb95f4c, 0x6f9a8d, 0x8b7dac, 0xb58655];

function hashText(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function distance(left: Vec3, right: Vec3) {
  return Math.hypot(right[0] - left[0], right[1] - left[1], right[2] - left[2]);
}

function interpolate(left: Vec3, right: Vec3, progress: number): Vec3 {
  return [
    left[0] + (right[0] - left[0]) * progress,
    left[1] + (right[1] - left[1]) * progress,
    left[2] + (right[2] - left[2]) * progress,
  ];
}

function sampleRoute(route: Vec3[], count: number) {
  if (count <= 0) return [];
  if (route.length === 0) {
    return Array.from({ length: count }, () => [0, 0.15, 0] as Vec3);
  }
  if (route.length === 1 || count === 1) return [route[0]];

  const segments = route.slice(1).map((point, index) => ({
    from: route[index],
    length: distance(route[index], point),
    to: point,
  }));
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);

  return Array.from({ length: count }, (_, index) => {
    const target = (index / (count - 1)) * total;
    let traversed = 0;
    for (const segment of segments) {
      if (traversed + segment.length >= target) {
        const progress =
          segment.length === 0 ? 0 : (target - traversed) / segment.length;
        return interpolate(segment.from, segment.to, progress);
      }
      traversed += segment.length;
    }
    return route.at(-1)!;
  });
}

export function buildGuideSceneLayout({
  slug,
  type,
  stops,
}: BuildGuideSceneLayoutInput): GuideSceneLayout {
  const seed = hashText(`${slug}:${type}`);
  const model = buildGuideModel(slug, type);
  const positions = sampleRoute(model.route, stops.length);

  return {
    ...model,
    accent: accents[seed % accents.length],
    nodes: stops.map((label, index) => ({
      label,
      position: positions[index],
    })),
    paths: stops.slice(1).map((_, index) => [index, index + 1]),
  };
}
