import type { GuideSpatialType } from '../data/types';
import {
  buildGuideModel,
  type GuideModelBasis,
  type GuideScenePart,
  type Vec3,
} from './guide-3d-models';

export type GuideSceneNode = {
  floorId?: string;
  label: string;
  position: Vec3;
  spaceId?: string;
};

export type GuideExteriorSceneLayout = {
  mode: 'exterior3d';
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
  unlocatedStops: string[];
  paths: Array<[number, number]>;
  camera: {
    position: Vec3;
    target: Vec3;
  };
  accent: number;
};

export type BuildGuideSceneLayoutInput = {
  slug: string;
  type: GuideSpatialType;
  stops: string[];
};

const accents = [0xc9a85a, 0xe0c279, 0x9eb5c8];

function hashText(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function guideSceneAccent(slug: string, type: GuideSpatialType) {
  const seed = hashText(`${slug}:${type}`);
  return accents[seed % accents.length];
}

export function buildGuideExteriorSceneLayout({
  slug,
  type,
  stops,
}: BuildGuideSceneLayoutInput): GuideExteriorSceneLayout {
  const model = buildGuideModel(slug, type);
  return {
    ...model,
    mode: 'exterior3d',
    accent: guideSceneAccent(slug, type),
    // A massing recipe has no reviewed stop-to-feature bindings. Its sampled
    // polyline must not be presented as the location of named visitor stops.
    nodes: [],
    paths: [],
    unlocatedStops: [...stops],
  };
}
