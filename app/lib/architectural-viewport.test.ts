import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  placesWithGuideNumbers,
  type ArchitecturalPlan,
  type MapPoint,
} from './architectural-plan';
import {
  createPlanDrawing,
  fitPlanDrawing,
  drawingLabels,
  drawingPoint,
  planViewportSize,
  worldPoint,
  scrollForPoint,
  zoomDrawing,
} from './architectural-viewport';

const plans = readdirSync('app/data/architectural-plans')
  .filter((f) => f.endsWith('.json'))
  .map(
    (f) =>
      JSON.parse(
        readFileSync(`app/data/architectural-plans/${f}`, 'utf8'),
      ) as ArchitecturalPlan,
  );
describe('readable architectural viewport', () => {
  it.each(plans)('$slug initially contains the complete floor and every label', plan => {
    for(const floor of plan.floors) for(const width of [284,352,700,1200]){
      const places=placesWithGuideNumbers(plan).filter(p=>p.floorId===floor.id);
      const viewport=planViewportSize(floor,width,places);
      const overview=fitPlanDrawing(createPlanDrawing(floor,places,viewport),viewport);
      expect(overview.width).toBe(viewport.width);
      expect(overview.height).toBe(viewport.height);
      for(const at of [[floor.bounds[0],floor.bounds[1]],[floor.bounds[2],floor.bounds[3]]] as MapPoint[]){
        const p=drawingPoint(overview,at);
        expect(p[0]).toBeGreaterThanOrEqual(16);
        expect(p[1]).toBeGreaterThanOrEqual(16);
        expect(p[0]).toBeLessThanOrEqual(viewport.width-16);
        expect(p[1]).toBeLessThanOrEqual(viewport.height-16);
      }
      const labels=drawingLabels(overview,places);
      expect(labels.map(p=>p.id).sort()).toEqual(places.map(p=>p.id).sort());
      for(const label of labels){
        expect(label.displayAt[0]-label.width/2).toBeGreaterThanOrEqual(-.001);
        expect(label.displayAt[1]-label.height/2).toBeGreaterThanOrEqual(-.001);
        expect(label.displayAt[0]+label.width/2).toBeLessThanOrEqual(viewport.width+.001);
        expect(label.displayAt[1]+label.height/2).toBeLessThanOrEqual(viewport.height+.001);
        for(const other of labels)if(label.id!==other.id)expect(
          Math.abs(label.displayAt[0]-other.displayAt[0])>=(label.width+other.width)/2 ||
          Math.abs(label.displayAt[1]-other.displayAt[1])>=(label.height+other.height)/2
        ).toBe(true);
      }
      const reading=zoomDrawing(overview,1/overview.labelScale!);
      expect(reading.labelScale).toBeCloseTo(1);
      expect(drawingLabels(reading,places).every(p=>p.height>=24)).toBe(true);
    }
  });
  it.each(plans)(
    '$slug keeps every identity, anchor and label size at each zoom',
    (plan) => {
      const before = JSON.stringify(plan);
      for (const floor of plan.floors)
        for (const viewport of [
          planViewportSize(
            floor,
            284,
            placesWithGuideNumbers(plan).filter((p) => p.floorId === floor.id),
          ),
          planViewportSize(
            floor,
            1200,
            placesWithGuideNumbers(plan).filter((p) => p.floorId === floor.id),
          ),
        ]) {
          const places = placesWithGuideNumbers(plan).filter(
            (p) => p.floorId === floor.id,
          );
          const baseline = createPlanDrawing(floor, places, viewport);
          expect(baseline.width).toBeGreaterThanOrEqual(viewport.width);
          expect(baseline.height).toBeGreaterThanOrEqual(viewport.height);
          const dimensions = new Map<string, string>();
          for (const zoom of [1, 2, 4]) {
            const drawing = zoomDrawing(baseline, zoom);
            const labels = drawingLabels(drawing, places);
            expect(labels.map((p) => p.id).sort()).toEqual(
              places.map((p) => p.id).sort(),
            );
            for (const label of labels) {
              const source = places.find((p) => p.id === label.id)!;
              expect(label.at).toEqual(drawingPoint(drawing, source.at));
              expect(label.label).toBe(source.label);
              expect(label.guideNumbers).toEqual(source.guideNumbers);
              const size = `${label.width}:${label.height}`;
              if (zoom === 1) dimensions.set(label.id, size);
              else expect(size).toBe(dimensions.get(label.id));
              expect(label.height).toBeGreaterThanOrEqual(24);
              expect(
                label.displayAt[0] - label.width / 2,
              ).toBeGreaterThanOrEqual(0);
              expect(
                label.displayAt[1] - label.height / 2,
              ).toBeGreaterThanOrEqual(0);
              expect(label.displayAt[0] + label.width / 2).toBeLessThanOrEqual(
                drawing.width,
              );
              expect(label.displayAt[1] + label.height / 2).toBeLessThanOrEqual(
                drawing.height,
              );
              for (const other of labels)
                if (label.id !== other.id)
                  expect(
                    Math.abs(label.displayAt[0] - other.displayAt[0]) >=
                      (label.width + other.width) / 2 + 5.99 ||
                      Math.abs(label.displayAt[1] - other.displayAt[1]) >=
                        (label.height + other.height) / 2 + 5.99,
                  ).toBe(true);
            }
            for (const point of [
              [floor.bounds[0], floor.bounds[1]],
              [floor.bounds[2], floor.bounds[3]],
            ] as MapPoint[]) {
              const projected = drawingPoint(drawing, point);
              expect(worldPoint(drawing, projected)[0]).toBeCloseTo(point[0]);
              expect(worldPoint(drawing, projected)[1]).toBeCloseTo(point[1]);
              const scroll = scrollForPoint(drawing, viewport, point);
              expect(scroll[0]).toBeGreaterThanOrEqual(0);
              expect(scroll[1]).toBeGreaterThanOrEqual(0);
              expect(projected[0]).toBeGreaterThanOrEqual(scroll[0]);
              expect(projected[0]).toBeLessThanOrEqual(
                scroll[0] + viewport.width,
              );
              expect(projected[1]).toBeGreaterThanOrEqual(scroll[1]);
              expect(projected[1]).toBeLessThanOrEqual(
                scroll[1] + viewport.height,
              );
            }
          }
        }
      expect(JSON.stringify(plan)).toBe(before);
    },
  );
  it('uses bounded floor proportions rather than tall empty panels for long houses', () => {
    const casa = plans.find((p) => p.slug === 'casa-batllo')!;
    expect(
      planViewportSize(
        casa.floors[0],
        352,
        casa.places.filter((p) => p.floorId === casa.floors[0].id),
      ).height,
    ).toBe(280);
    for (const plan of plans)
      for (const floor of plan.floors)
        for (const width of [282, 352, 700, 1040, 1400]) {
          const viewport = planViewportSize(
            floor,
            width,
            placesWithGuideNumbers(plan).filter((p) => p.floorId === floor.id),
          );
          expect(viewport.width).toBe(width);
          expect(viewport.height).toBeGreaterThanOrEqual(
            width <= 700 ? 280 : 340,
          );
          expect(viewport.height).toBeLessThanOrEqual(width <= 700 ? 460 : 560);
        }
  });
  it('gives the Vatican entrance floor actual reading space instead of a phone-width label grid', () => {
    const plan = plans.find((p) => p.slug === 'vatican-museums')!;
    const floor = plan.floors.find((f) => f.id === 'first')!;
    const places = placesWithGuideNumbers(plan).filter(
      (p) => p.floorId === floor.id,
    );
    expect(planViewportSize(floor, 350, places).height).toBe(460);
    const drawing = createPlanDrawing(floor, places, {
      width: 350,
      height: 460,
    });
    expect(drawing.width).toBeGreaterThan(600);
    const distances = drawingLabels(drawing, places)
      .map((p) =>
        Math.hypot(p.at[0] - p.displayAt[0], p.at[1] - p.displayAt[1]),
      )
      .sort((a, b) => a - b);
    expect(
      distances[Math.floor((distances.length - 1) * 0.9)],
    ).toBeLessThanOrEqual(45);
    expect(distances.at(-1)).toBeLessThanOrEqual(108);
  });
});
