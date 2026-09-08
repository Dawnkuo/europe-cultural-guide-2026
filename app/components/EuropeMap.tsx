'use client';

import { geoMercator, geoPath } from 'd3-geo';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { formatJourneyStep, journeyCityOrder } from '../lib/journey-route';

const cities = [
  {
    name: '巴黎',
    coordinates: [2.3522, 48.8566] as [number, number],
    tone: '#e0c279',
    labelAt: [.20, .30],
  },
  {
    name: '米兰',
    coordinates: [9.19, 45.4642] as [number, number],
    tone: '#c9a85a',
    labelAt: [.25, .45],
  },
  {
    name: '威尼斯',
    coordinates: [12.3155, 45.4408] as [number, number],
    tone: '#9eb5c8',
    labelAt: [.79, .43],
  },
  {
    name: '佛罗伦萨',
    coordinates: [11.2558, 43.7696] as [number, number],
    tone: '#e0c279',
    labelAt: [.77, .59],
  },
  {
    name: '比萨',
    coordinates: [10.4017, 43.7228] as [number, number],
    tone: '#c9a85a',
    labelAt: [.22, .65],
  },
  {
    name: '罗马',
    coordinates: [12.4964, 41.9028] as [number, number],
    tone: '#e0c279',
    labelAt: [.76, .82],
  },
  {
    name: '巴塞罗那',
    coordinates: [2.1734, 41.3851] as [number, number],
    tone: '#9eb5c8',
    labelAt: [.19, .85],
  },
  {
    name: '科隆',
    coordinates: [6.9603, 50.9375] as [number, number],
    tone: '#c9a85a',
    labelAt: [.53, .10],
  },
] as const;

const europeCountryIds = new Set([
  '040',
  '056',
  '191',
  '203',
  '208',
  '250',
  '276',
  '336',
  '348',
  '372',
  '380',
  '442',
  '528',
  '616',
  '620',
  '703',
  '705',
  '724',
  '756',
  '826',
]);

type WorldTopology = Topology<{
  countries: GeometryCollection<{ name?: string }>;
}>;

type EuropeMapProps = {
  selectedCity: string;
  onSelectCity: (city: string) => void;
};

export function EuropeMap({ selectedCity, onSelectCity }: EuropeMapProps) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 560 });
  const { width, height } = size;
  const arrowId = `journey-direction-${useId().replaceAll(':', '')}`;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (typeof ResizeObserver === 'undefined') {
      const measure = () => {
        const { width, height } = element.getBoundingClientRect();
        if (width > 0 && height > 0) setSize({ width, height });
      };
      measure();
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const projection = geoMercator()
    .fitExtent([[width * .22, height * .18], [width * .82, height * .80]], {
      type: 'MultiPoint', coordinates: cities.map((city) => city.coordinates),
    })
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
  const path = geoPath(projection);
  const topology = world as unknown as WorldTopology;
  const geography = feature(topology, topology.objects.countries);
  const markers = cities.map((city) => {
    const steps = journeyCityOrder.flatMap((name, index) => name === city.name ? [formatJourneyStep(index)] : []);
    const labelWidth = city.name.length * 14 + steps.length * 24 + (steps.length - 1) * 3 + 26;
    const compactLabels: Record<string, [number, number]> = {
      巴黎: [.20, .26], 米兰: [.25, .43], 佛罗伦萨: [.30, .54],
      比萨: [.22, .64], 巴塞罗那: [.19, .87], 罗马: [.76, .94],
    };
    const labelAt = width < 800 ? compactLabels[city.name] ?? city.labelAt : city.labelAt;
    return {
      ...city, steps, labelWidth, point: projection(city.coordinates)!,
      label: [Math.max(labelWidth / 2 + 6, Math.min(width - labelWidth / 2 - 6, width * labelAt[0])), height * labelAt[1]],
    };
  });
  const routePoints = journeyCityOrder.map((name) => markers.find((city) => city.name === name)!.point);
  const legs = routePoints.slice(1).map((to, index) => {
    const from = routePoints[index];
    const dx = to[0] - from[0], dy = to[1] - from[1], distance = Math.hypot(dx, dy);
    const returnLeg = journeyCityOrder.some((name, step) => name === journeyCityOrder[index + 1] && journeyCityOrder[step + 1] === journeyCityOrder[index]);
    // Separate both directions of the Pisa day trip without moving city anchors.
    const bend = returnLeg ? 26 : 0;
    const control = [(from[0] + to[0]) / 2 - dy / distance * bend, (from[1] + to[1]) / 2 + dx / distance * bend];
    const midpoint = [from[0] * .25 + control[0] * .5 + to[0] * .25, from[1] * .25 + control[1] * .5 + to[1] * .25];
    return {
      from: journeyCityOrder[index], to: journeyCityOrder[index + 1],
      path: `M${from.join(',')} Q${control.join(',')} ${to.join(',')}`,
      arrow: `M${midpoint[0] - dx / distance * 4},${midpoint[1] - dy / distance * 4} L${midpoint[0] + dx / distance * 4},${midpoint[1] + dy / distance * 4}`,
    };
  });

  return (
    <div className="europe-map" ref={root} data-selected-city={selectedCity}>
      <svg
        aria-label="欧洲旅程总览地图"
        className="europe-map__canvas"
        viewBox={`0 0 ${width} ${height}`}
      >
        <desc>{journeyCityOrder.map((name, index) => `${formatJourneyStep(index)} ${name}`).join(' → ')}</desc>
        <defs>
          <marker id={arrowId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--gold-bright)" />
          </marker>
        </defs>
        <rect width={width} height={height} fill="var(--surface-deep)" />
        <g aria-hidden="true">
          {geography.features
            .filter((country) =>
              europeCountryIds.has(String(country.id).padStart(3, '0')),
            )
            .map((country, index) => (
              <path
                d={path(country) ?? undefined}
                fill="var(--surface-raised)"
                key={country.id ?? index}
                stroke="var(--control-line)"
                strokeWidth="0.7"
              />
            ))}
          {legs.map((leg, index) => <g key={index} data-route-leg={index + 1} data-route-from={leg.from} data-route-to={leg.to}>
            <path d={leg.path} fill="none" stroke="var(--gold-bright)" strokeDasharray="3 7" strokeLinecap="round" strokeWidth="1.8" />
            <path d={leg.arrow} fill="none" stroke="var(--gold-bright)" strokeWidth="1.8" markerEnd={`url(#${arrowId})`} />
          </g>)}
          {markers.map((city) => <line key={city.name} data-city-leader={city.name} x1={city.point[0]} y1={city.point[1]} x2={city.label[0]} y2={city.label[1]} stroke={city.tone} strokeOpacity=".7" strokeWidth="1" />)}
          {markers.map((city) => {
            const point = city.point;
            return (
              <g
                key={city.name}
                data-city-anchor={city.name}
                transform={`translate(${point[0]} ${point[1]})`}
              >
                <circle
                  fill="var(--surface-deep)"
                  r="6"
                  stroke={city.tone}
                  strokeWidth="2"
                />
                <circle fill={city.tone} r="2" />
              </g>
            );
          })}
        </g>
      </svg>

      <div className="europe-map__markers" aria-label="旅程城市">
        {markers.map((city) => {
          return (
            <button
              aria-label={`查看${city.name}行程`}
              title={`第${city.steps.join('、')}站 · ${city.name}`}
              className="europe-map__marker"
              data-city={city.name}
              data-journey-steps={city.steps.join(',')}
              data-active={selectedCity === city.name}
              aria-pressed={selectedCity === city.name}
              key={city.name}
              onClick={() => onSelectCity(city.name)}
              style={
                {
                  '--marker-color': city.tone,
                  left: `${(city.label[0] / width) * 100}%`,
                  top: `${(city.label[1] / height) * 100}%`,
                  width: city.labelWidth,
                } as CSSProperties
              }
              type="button"
            >
              <span className="europe-map__steps" aria-hidden="true">{city.steps.map((step) => <b key={step}>{step}</b>)}</span>
              <span>{city.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const mapCities = cities;
