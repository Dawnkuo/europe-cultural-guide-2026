'use client';

import type { ArchitecturalPlan, PlanPlace } from '../lib/architectural-plan';
import { planTones, polygonPath, spaceForPlace } from '../lib/architectural-plan';

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- An inline SVG needs an accessible image role; an img cannot host the source-derived geometry. */

export function GuideLocationPreview({ plan, place }: { plan: ArchitecturalPlan; place: PlanPlace }) {
  const floor = plan.floors.find(f => f.id === place.floorId);
  if (!floor) return null;
  const [x, y, right, bottom] = floor.bounds;
  const span = Math.max(right - x, bottom - y);
  const pad = span * .04;
  const space = spaceForPlace(plan, place.id);
  return <figure className="guide-location-preview">
    <svg viewBox={`${x - pad} ${y - pad} ${right - x + pad * 2} ${bottom - y + pad * 2}`} role="img" aria-label={`${floor.label}，${place.name}位置概览`}>
      {floor.features.map(feature => <g key={feature.id} fill={planTones[feature.tone] ?? planTones.neutral}>{feature.polygons.map((polygon, i) => <path key={i} d={polygonPath(polygon)} fillRule="evenodd" />)}</g>)}
      {space && <g fill="#e0c279" fillOpacity=".5" stroke="#f4d787" strokeWidth={span / 350}>{space.polygons.map((polygon, i) => <path key={i} d={polygonPath(polygon)} fillRule="evenodd" />)}</g>}
      <circle cx={place.at[0]} cy={place.at[1]} r={span / 45} fill="#081522" stroke="#f4d787" strokeWidth={span / 180} />
      <circle cx={place.at[0]} cy={place.at[1]} r={span / 100} fill="#f4d787" />
    </svg>
    <figcaption>{floor.label} · {place.name}</figcaption>
  </figure>;
}
