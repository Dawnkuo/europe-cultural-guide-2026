'use client';

import { geoMercator, geoPath } from 'd3-geo';
import type { CSSProperties } from 'react';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';

const width = 1000;
const height = 620;

const cities = [
  {
    name: '巴黎',
    coordinates: [2.3522, 48.8566] as [number, number],
    tone: '#e0c279',
  },
  {
    name: '米兰',
    coordinates: [9.19, 45.4642] as [number, number],
    tone: '#c9a85a',
  },
  {
    name: '威尼斯',
    coordinates: [12.3155, 45.4408] as [number, number],
    tone: '#9eb5c8',
  },
  {
    name: '佛罗伦萨',
    coordinates: [11.2558, 43.7696] as [number, number],
    tone: '#e0c279',
  },
  {
    name: '比萨',
    coordinates: [10.4017, 43.7228] as [number, number],
    tone: '#c9a85a',
  },
  {
    name: '罗马',
    coordinates: [12.4964, 41.9028] as [number, number],
    tone: '#e0c279',
  },
  {
    name: '巴塞罗那',
    coordinates: [2.1734, 41.3851] as [number, number],
    tone: '#9eb5c8',
  },
  {
    name: '科隆',
    coordinates: [6.9603, 50.9375] as [number, number],
    tone: '#c9a85a',
  },
] as const;

const route = [
  '巴黎',
  '米兰',
  '威尼斯',
  '佛罗伦萨',
  '比萨',
  '佛罗伦萨',
  '罗马',
  '巴塞罗那',
  '科隆',
  '巴黎',
];

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
  const projection = geoMercator()
    .center([8, 46])
    .scale(1050)
    .translate([width / 2, height / 2])
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
  const path = geoPath(projection);
  const topology = world as unknown as WorldTopology;
  const geography = feature(topology, topology.objects.countries);
  const routePoints = route
    .map((name) => cities.find((city) => city.name === name))
    .filter((city): city is (typeof cities)[number] => Boolean(city))
    .map((city) => projection(city.coordinates))
    .filter((point): point is [number, number] => Boolean(point));
  const routePath = routePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]},${point[1]}`)
    .join(' ');

  return (
    <div className="europe-map" data-selected-city={selectedCity}>
      <svg
        aria-label="欧洲旅程总览地图"
        className="europe-map__canvas"
        viewBox={`0 0 ${width} ${height}`}
      >
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
          <path
            d={routePath}
            fill="none"
            stroke="var(--gold-bright)"
            strokeDasharray="3 8"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
          {cities.map((city) => {
            const point = projection(city.coordinates);
            if (!point) return null;
            return (
              <g
                key={city.name}
                transform={`translate(${point[0]} ${point[1]})`}
              >
                <circle
                  fill="var(--surface-deep)"
                  r="12"
                  stroke={city.tone}
                  strokeWidth="2"
                />
                <circle fill={city.tone} r="4" />
              </g>
            );
          })}
        </g>
      </svg>

      <div className="europe-map__markers" aria-label="旅程城市">
        {cities.map((city) => {
          const point = projection(city.coordinates);
          if (!point) return null;
          return (
            <button
              aria-label={`查看${city.name}行程`}
              className="europe-map__marker"
              data-active={selectedCity === city.name}
              key={city.name}
              onClick={() => onSelectCity(city.name)}
              style={
                {
                  '--marker-color': city.tone,
                  left: `${(point[0] / width) * 100}%`,
                  top: `${(point[1] / height) * 100}%`,
                } as CSSProperties
              }
              type="button"
            >
              {city.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const mapCities = cities;
