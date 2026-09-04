'use client';

import { MapPinned, Route } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  cityMapLabels,
  isMapEligibleTripItem,
  mapLocationForTripItem,
  type CityMapId,
  type TripMapLocation,
  unlocatedMapItems,
} from '../data/trip-map-locations';
import type { TripDay, TripItem } from '../data/types';
import { withBasePath } from '../lib/paths';

const MAP_WIDTH = 760;
const MAP_HEIGHT = 430;
const MAP_PADDING = 42;
const LAYERS = ['water', 'rail', 'road', 'majorRoad', 'pedestrian'] as const;
const roundMapCoordinate = (value: number) => Number(value.toFixed(1));

type MapLayer = (readonly [number, number])[][];
type CityLinework = {
  bounds: readonly [number, number, number, number];
  layers: Record<(typeof LAYERS)[number], MapLayer>;
};
type CityLineworkFile = { map: CityLinework };
type LocatedItem = {
  item: TripItem;
  location: TripMapLocation;
  itemIndex: number;
};
export type DayMapGroup = {
  cityMapId: CityMapId;
  items: LocatedItem[];
  scheduled: LocatedItem[];
  alternatives: LocatedItem[];
};

const lineworkPromises = new Map<CityMapId, Promise<CityLinework>>();

export function groupMapItemsForDay(day: TripDay) {
  const groups = new Map<CityMapId, DayMapGroup>();
  const unlocated: Array<{ item: TripItem; reason: string }> = [];

  day.items.forEach((item, itemIndex) => {
    if (!isMapEligibleTripItem(item)) return;
    const location = mapLocationForTripItem(item);
    if (!location) {
      const reason = unlocatedMapItems[item.id];
      if (reason) unlocated.push({ item, reason });
      return;
    }

    const group = groups.get(location.cityMapId) ?? {
      cityMapId: location.cityMapId,
      items: [],
      scheduled: [],
      alternatives: [],
    };
    const locatedItem = { item, location, itemIndex };
    group.items.push(locatedItem);
    if (item.routePoint === false) group.alternatives.push(locatedItem);
    else group.scheduled.push(locatedItem);
    groups.set(location.cityMapId, group);
  });

  return { groups: [...groups.values()], unlocated };
}

function loadLinework(cityMapId: CityMapId) {
  const cached = lineworkPromises.get(cityMapId);
  if (cached) return cached;

  const request = fetch(withBasePath(`/map-data/${cityMapId}.json`))
    .then((response) => {
      if (!response.ok) throw new Error(`Map data returned ${response.status}`);
      return response.json() as Promise<CityLineworkFile>;
    })
    .then((payload) => payload.map);
  lineworkPromises.set(cityMapId, request);
  return request;
}

function useLazyLinework(cityMapId: CityMapId) {
  const rootRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [linework, setLinework] = useState<CityLinework>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: '360px' },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    let active = true;
    loadLinework(cityMapId)
      .then((data) => {
        if (active) setLinework(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [cityMapId, shouldLoad]);

  return { failed, linework, rootRef, shouldLoad };
}

type WorldPoint = readonly [number, number];
type Projection = {
  project: (coordinates: readonly [number, number]) => [number, number];
  worldBounds: readonly [number, number, number, number];
};

function createProjection(items: LocatedItem[]): Projection {
  const coordinates = items.map(({ location }) => location.coordinates);
  const averageLatitude =
    coordinates.reduce((total, coordinate) => total + coordinate[1], 0) /
    coordinates.length;
  const longitudeScale = Math.cos((averageLatitude * Math.PI) / 180);
  const toWorld = ([longitude, latitude]: readonly [
    number,
    number,
  ]): WorldPoint => [longitude * longitudeScale, -latitude];
  const points = coordinates.map(toWorld);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  let minimumX = Math.min(...xs);
  let maximumX = Math.max(...xs);
  let minimumY = Math.min(...ys);
  let maximumY = Math.max(...ys);
  const centerX = (minimumX + maximumX) / 2;
  const centerY = (minimumY + maximumY) / 2;
  const minimumLongitudeSpan = 0.004 * longitudeScale;
  const minimumLatitudeSpan = 0.003;
  let width = Math.max(maximumX - minimumX, minimumLongitudeSpan);
  let height = Math.max(maximumY - minimumY, minimumLatitudeSpan);
  const targetRatio =
    (MAP_WIDTH - MAP_PADDING * 2) / (MAP_HEIGHT - MAP_PADDING * 2);

  width *= 1.28;
  height *= 1.28;
  if (width / height > targetRatio) height = width / targetRatio;
  else width = height * targetRatio;

  minimumX = centerX - width / 2;
  maximumX = centerX + width / 2;
  minimumY = centerY - height / 2;
  maximumY = centerY + height / 2;

  const scale = Math.min(
    (MAP_WIDTH - MAP_PADDING * 2) / width,
    (MAP_HEIGHT - MAP_PADDING * 2) / height,
  );

  return {
    project: (coordinate) => {
      const [x, y] = toWorld(coordinate);
      return [
        roundMapCoordinate(MAP_WIDTH / 2 + (x - centerX) * scale),
        roundMapCoordinate(MAP_HEIGHT / 2 + (y - centerY) * scale),
      ];
    },
    worldBounds: [minimumX, minimumY, maximumX, maximumY],
  };
}

function pathIntersectsView(
  path: readonly (readonly [number, number])[],
  worldBounds: Projection['worldBounds'],
  averageLatitude: number,
) {
  const longitudeScale = Math.cos((averageLatitude * Math.PI) / 180);
  let minimumX = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let minimumY = Number.POSITIVE_INFINITY;
  let maximumY = Number.NEGATIVE_INFINITY;
  path.forEach(([longitude, latitude]) => {
    const x = longitude * longitudeScale;
    const y = -latitude;
    minimumX = Math.min(minimumX, x);
    maximumX = Math.max(maximumX, x);
    minimumY = Math.min(minimumY, y);
    maximumY = Math.max(maximumY, y);
  });
  return !(
    maximumX < worldBounds[0] ||
    minimumX > worldBounds[2] ||
    maximumY < worldBounds[1] ||
    minimumY > worldBounds[3]
  );
}

function pathsToD(
  paths: MapLayer,
  projection: Projection,
  averageLatitude: number,
) {
  return paths
    .filter((path) =>
      pathIntersectsView(path, projection.worldBounds, averageLatitude),
    )
    .map((path) =>
      path
        .map((coordinates, index) => {
          const [x, y] = projection.project(coordinates);
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(''),
    )
    .join('');
}

function markerOffsets(items: LocatedItem[]) {
  const offsets = new Map<string, [number, number]>();
  const coincident = new Map<string, LocatedItem[]>();
  items.forEach((entry) => {
    const key = entry.location.coordinates.join(',');
    coincident.set(key, [...(coincident.get(key) ?? []), entry]);
  });
  coincident.forEach((entries) => {
    entries.forEach((entry, index) => {
      if (entries.length === 1) offsets.set(entry.item.id, [0, 0]);
      else {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / entries.length;
        offsets.set(entry.item.id, [
          roundMapCoordinate(Math.cos(angle) * 17),
          roundMapCoordinate(Math.sin(angle) * 17),
        ]);
      }
    });
  });
  return offsets;
}

function CityMapPanel({ day, group }: { day: TripDay; group: DayMapGroup }) {
  const { failed, linework, rootRef, shouldLoad } = useLazyLinework(
    group.cityMapId,
  );
  const projection = useMemo(
    () => createProjection(group.items),
    [group.items],
  );
  const offsets = useMemo(() => markerOffsets(group.items), [group.items]);
  const scheduledNumbers = new Map(
    group.scheduled.map((entry, index) => [entry.item.id, index + 1]),
  );
  const averageLatitude =
    group.items.reduce(
      (total, entry) => total + entry.location.coordinates[1],
      0,
    ) / group.items.length;
  const routeD = group.scheduled
    .map((entry, index) => {
      const [x, y] = projection.project(entry.location.coordinates);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join('');

  return (
    <article
      className="day-route-map__city"
      data-city-map={group.cityMapId}
      ref={rootRef}
    >
      <header className="day-route-map__city-header">
        <div>
          <p>城市路线</p>
          <h4>{cityMapLabels[group.cityMapId]}</h4>
        </div>
        <span>
          {group.scheduled.length} 个主行程
          {group.alternatives.length > 0
            ? ` · ${group.alternatives.length} 个备选`
            : ''}
        </span>
      </header>

      <div className="day-route-map__layout">
        <div className="day-route-map__stage">
          <svg
            aria-labelledby={`${day.date}-${group.cityMapId}-map-title`}
            className="day-route-map__svg"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          >
            <title id={`${day.date}-${group.cityMapId}-map-title`}>
              {`${day.label}${cityMapLabels[group.cityMapId]}当日景点地图`}
            </title>
            <rect
              className="day-route-map__paper"
              height={MAP_HEIGHT}
              width={MAP_WIDTH}
            />
            {linework &&
              LAYERS.map((layer) => (
                <path
                  className={`day-route-map__${layer.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`}
                  d={pathsToD(
                    linework.layers[layer] ?? [],
                    projection,
                    averageLatitude,
                  )}
                  key={layer}
                />
              ))}
            {routeD && (
              <>
                <path className="day-route-map__route-casing" d={routeD} />
                <path className="day-route-map__route" d={routeD} />
              </>
            )}
            {group.items.map((entry) => {
              const [pointX, pointY] = projection.project(
                entry.location.coordinates,
              );
              const [offsetX, offsetY] = offsets.get(entry.item.id) ?? [0, 0];
              const markerX = roundMapCoordinate(pointX + offsetX);
              const markerY = roundMapCoordinate(pointY + offsetY);
              const isAlternative = entry.item.routePoint === false;
              const markerText = isAlternative
                ? '备'
                : String(scheduledNumbers.get(entry.item.id));
              return (
                <g key={entry.item.id}>
                  {(offsetX !== 0 || offsetY !== 0) && (
                    <path
                      className="day-route-map__marker-leader"
                      d={`M${pointX.toFixed(1)} ${pointY.toFixed(1)}L${markerX.toFixed(1)} ${markerY.toFixed(1)}`}
                    />
                  )}
                  <a
                    aria-label={`跳到行程：${entry.item.title}`}
                    className="day-route-map__marker-link"
                    data-map-item={entry.item.id}
                    data-route-kind={
                      isAlternative ? 'alternative' : 'scheduled'
                    }
                    href={`#${day.date}-${entry.item.id}`}
                  >
                    <title>
                      {`${entry.item.time} · ${entry.item.title}${
                        entry.location.precision === 'area-representative'
                          ? '（区域代表点）'
                          : ''
                      }`}
                    </title>
                    <circle
                      className={
                        isAlternative
                          ? 'day-route-map__marker day-route-map__marker--alternative'
                          : 'day-route-map__marker'
                      }
                      cx={markerX}
                      cy={markerY}
                      r={isAlternative ? 14 : 15}
                    />
                    <text x={markerX} y={markerY}>
                      {markerText}
                    </text>
                  </a>
                </g>
              );
            })}
            <g aria-hidden="true" className="day-route-map__north">
              <path d="M716 55L724 34L732 55L724 50Z" />
              <text x="724" y="27">
                N
              </text>
            </g>
          </svg>
          <output aria-live="polite" className="day-route-map__load-state">
            {!shouldLoad && '底图将在接近视口时加载'}
            {shouldLoad && !linework && !failed && '正在加载城市线稿…'}
            {failed && '底图暂不可用，景点位置与行程路线仍可查看'}
          </output>
          <p className="day-route-map__attribution">
            © OpenStreetMap contributors · 示意线稿，非导航
          </p>
        </div>

        <ol
          className="day-route-map__legend"
          aria-label={`${cityMapLabels[group.cityMapId]}地图景点`}
        >
          {group.scheduled.map((entry, index) => (
            <li key={entry.item.id}>
              <a href={`#${day.date}-${entry.item.id}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <time>{entry.item.time}</time>
                  <strong>{entry.item.title}</strong>
                  {entry.location.precision === 'area-representative' && (
                    <small>区域代表点</small>
                  )}
                </div>
              </a>
            </li>
          ))}
          {group.alternatives.map((entry) => (
            <li
              className="day-route-map__legend-alternative"
              key={entry.item.id}
            >
              <a href={`#${day.date}-${entry.item.id}`}>
                <span>备</span>
                <div>
                  <time>不加入路线</time>
                  <strong>{entry.item.title}</strong>
                  {entry.location.precision === 'area-representative' && (
                    <small>区域代表点</small>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export function DayRouteMap({ day }: { day: TripDay }) {
  const { groups, unlocated } = useMemo(() => groupMapItemsForDay(day), [day]);
  if (groups.length === 0 && unlocated.length === 0) return null;

  return (
    <section
      className="day-route-map"
      aria-labelledby={`${day.date}-map-heading`}
    >
      <header className="day-route-map__heading">
        <div>
          <MapPinned aria-hidden="true" size={18} />
          <h3 id={`${day.date}-map-heading`}>当日城市地图</h3>
        </div>
        <p>
          <Route aria-hidden="true" size={15} />
          主路线按现有行程顺序连接；备选仅标记，不加入路线。
        </p>
      </header>
      <div className="day-route-map__cities">
        {groups.map((group) => (
          <CityMapPanel day={day} group={group} key={group.cityMapId} />
        ))}
      </div>
      {unlocated.length > 0 && (
        <div className="day-route-map__unlocated">
          <strong>无固定地图点</strong>
          {unlocated.map(({ item, reason }) => (
            <a href={`#${day.date}-${item.id}`} key={item.id}>
              {item.title}：{reason}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
