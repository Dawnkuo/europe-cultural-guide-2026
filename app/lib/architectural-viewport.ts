import {
  placeLabelWidth,
  placeRoomLabels,
  type ArchitecturalFloor,
  type MapPoint,
  type PlanPlace,
} from './architectural-plan';

export type ViewportSize = { width: number; height: number };
export type PlanDrawing = ViewportSize & { min: MapPoint; scale: number; labelScale?: number };
const labelMetrics = { height: 28, gap: 6 };

export function planViewportSize(
  floor: ArchitecturalFloor,
  width: number,
  places: PlanPlace[],
): ViewportSize {
  const [x0, y0, x1, y1] = floor.bounds;
  const compact = width <= 700;
  const labelHeight =
    places.reduce((sum, place) => sum + (placeLabelWidth(place) + 6) * 34, 0) /
    (width * 0.2);
  const height = Math.max(
    compact ? 280 : 340,
    Math.min(
      compact ? 460 : 560,
      Math.max((width * (y1 - y0)) / (x1 - x0) + 80, labelHeight),
    ),
  );
  return { width, height: Math.round(height) };
}

export function drawingPoint(drawing: PlanDrawing, point: MapPoint): MapPoint {
  return [
    (point[0] - drawing.min[0]) * drawing.scale,
    (point[1] - drawing.min[1]) * drawing.scale,
  ];
}

export function worldPoint(drawing: PlanDrawing, point: MapPoint): MapPoint {
  return [
    point[0] / drawing.scale + drawing.min[0],
    point[1] / drawing.scale + drawing.min[1],
  ];
}

export function drawingLabels(drawing: PlanDrawing, places: PlanPlace[]) {
  const factor = drawing.labelScale ?? 1;
  return placeRoomLabels(
    places.map((place) => ({ ...place, at: drawingPoint(drawing, place.at).map(n => n / factor) as MapPoint })),
    1,
    [drawing.width / factor, drawing.height / factor],
    labelMetrics,
  ).map(place => ({ ...place,
    at: place.at.map(n => n * factor) as MapPoint,
    displayAt: place.displayAt.map(n => n * factor) as MapPoint,
    width: place.width * factor, height: place.height * factor,
  }));
}

// Compute a collision-free reading layout first. fitPlanDrawing derives the
// initial whole-floor overview; this larger layout remains reachable by zoom.
export function createPlanDrawing(
  floor: ArchitecturalFloor,
  places: PlanPlace[],
  viewport: ViewportSize,
): PlanDrawing {
  const [x0, y0, x1, y1] = floor.bounds;
  const longestLabel = Math.max(28, ...places.map(placeLabelWidth));
  const padding = Math.max(40, longestLabel / 2 + 8);
  const fit = Math.min(
    Math.max(120, viewport.width - padding * 2) / (x1 - x0),
    Math.max(120, viewport.height - padding * 2) / (y1 - y0),
  );
  const labelArea = places.reduce(
    (sum, place) => sum + (placeLabelWidth(place) + 6) * 34,
    0,
  );
  let factor = Math.max(
    1,
    Math.sqrt(labelArea / (viewport.width * viewport.height * 0.12)),
  );
  let drawing: PlanDrawing;
  for (let attempt = 0; ; attempt++) {
    const scale = fit * factor;
    const width = Math.max(viewport.width, (x1 - x0) * scale + padding * 2);
    const height = Math.max(viewport.height, (y1 - y0) * scale + padding * 2);
    drawing = {
      width,
      height,
      scale,
      min: [
        (x0 + x1) / 2 - width / scale / 2,
        (y0 + y1) / 2 - height / scale / 2,
      ],
    };
    const labels = drawingLabels(drawing, places);
    const distances = labels
      .map((place) =>
        Math.hypot(
          place.displayAt[0] - place.at[0],
          place.displayAt[1] - place.at[1],
        ),
      )
      .sort((a, b) => a - b);
    if (
      !distances.length ||
      (distances[Math.floor((distances.length - 1) * 0.9)] <= 45 &&
        distances.at(-1)! <= 108) ||
      attempt >= 5
    )
      return drawing;
    factor *= 1.3;
  }
}

export function zoomDrawing(drawing: PlanDrawing, zoom: number): PlanDrawing {
  return {
    ...drawing,
    width: drawing.width * zoom,
    height: drawing.height * zoom,
    scale: drawing.scale * zoom,
    labelScale: Math.min(1, (drawing.labelScale ?? 1) * zoom),
  };
}

// Fit the complete readable layout, including every label, on first opening.
// Zooming restores reading-size labels without deleting dense room numbers.
export function fitPlanDrawing(drawing: PlanDrawing, viewport: ViewportSize): PlanDrawing {
  const factor = Math.min((viewport.width - 32) / drawing.width, (viewport.height - 32) / drawing.height, 1);
  const scale = drawing.scale * factor;
  const center = worldPoint(drawing, [drawing.width / 2, drawing.height / 2]);
  return { ...viewport, scale, labelScale: factor,
    min: [center[0] - viewport.width / scale / 2, center[1] - viewport.height / scale / 2] };
}

export function scrollForPoint(
  drawing: PlanDrawing,
  viewport: ViewportSize,
  point: MapPoint,
): MapPoint {
  const [x, y] = drawingPoint(drawing, point);
  return [
    Math.max(
      0,
      Math.min(drawing.width - viewport.width, x - viewport.width / 2),
    ),
    Math.max(
      0,
      Math.min(drawing.height - viewport.height, y - viewport.height / 2),
    ),
  ];
}
