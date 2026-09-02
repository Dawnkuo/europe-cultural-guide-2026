import type { GuideSpatialType } from '../data/types';

export type GuideSceneNode = {
  label: string;
  position: [number, number, number];
  scale: [number, number, number];
  shape: 'box' | 'cylinder' | 'tower' | 'dome';
};

export type GuideSceneLayout = {
  nodes: GuideSceneNode[];
  paths: Array<[number, number]>;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
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

function floorplanPosition(index: number, count: number) {
  const x = (index - (count - 1) / 2) * 3.1;
  const z = index === 0 || index === count - 1 ? 0 : index % 2 ? -0.85 : 0.85;
  return [x, 0, z] as [number, number, number];
}

function sitePosition(index: number, count: number) {
  const progress = count <= 1 ? 0 : index / (count - 1);
  return [
    (progress - 0.5) * 11,
    progress * 1.7,
    Math.sin(progress * Math.PI * 1.6) * 2.15,
  ] as [number, number, number];
}

function viewpointPosition(index: number, count: number) {
  if (index === 0) return [0, 0, 0] as [number, number, number];
  const angle = ((index - 1) / Math.max(1, count - 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 5.2 + (index % 2) * 0.7;
  return [Math.cos(angle) * radius, 0.28 * index, Math.sin(angle) * radius] as [
    number,
    number,
    number,
  ];
}

function districtPosition(index: number, count: number) {
  const columns = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(count))));
  const column = index % columns;
  const row = Math.floor(index / columns);
  const routeColumn = row % 2 === 0 ? column : columns - 1 - column;
  return [
    (routeColumn - (columns - 1) / 2) * 4.1,
    0,
    (row - 0.5) * 4.1,
  ] as [number, number, number];
}

function shapeFor(label: string, type: GuideSpatialType, index: number) {
  if (/穹顶|圆厅|圆顶|穹隆/.test(label)) return 'dome' as const;
  if (/塔|钟楼|尖塔|高处|屋顶|露台/.test(label)) return 'tower' as const;
  if (/柱|广场|庭院|中庭|喷泉/.test(label)) return 'cylinder' as const;
  if (type === 'viewpoints' && index === 0) return 'tower' as const;
  return 'box' as const;
}

export function buildGuideSceneLayout({
  slug,
  type,
  stops,
}: BuildGuideSceneLayoutInput): GuideSceneLayout {
  const seed = hashText(`${slug}:${type}`);
  const positionFor = {
    floorplan: floorplanPosition,
    site: sitePosition,
    viewpoints: viewpointPosition,
    district: districtPosition,
  }[type];

  const nodes = stops.map((label, index) => {
    const isStartOrEnd = index === 0 || index === stops.length - 1;
    const width = type === 'district' ? 2.3 : isStartOrEnd ? 1.65 : 2.05;
    const height =
      type === 'viewpoints' && index === 0
        ? 4.8
        : type === 'district'
          ? 2.1 + (index % 3) * 0.55
          : isStartOrEnd
            ? 1.65
            : 2.35;

    return {
      label,
      position: positionFor(index, stops.length),
      scale: [
        width,
        height,
        type === 'floorplan' ? 1.7 : width * 0.82,
      ] as [number, number, number],
      shape: shapeFor(label, type, index),
    };
  });

  return {
    nodes,
    paths: nodes.slice(1).map((_, index) => [index, index + 1]),
    camera: {
      position:
        type === 'floorplan'
          ? [10.5, 8.5, 12]
          : type === 'viewpoints'
            ? [11, 10, 11]
            : [12, 9.5, 13],
      target: [0, 1.4, 0],
    },
    accent: accents[seed % accents.length],
  };
}
