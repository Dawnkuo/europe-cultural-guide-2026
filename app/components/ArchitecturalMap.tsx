'use client';

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, MapPin, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { GuideRecord } from '../data/types';
import mapNotes from '../data/architectural-map-notes.json';
import stopNotes from '../data/architectural-stop-notes.json';
import { placeRoomLabels, placesForStop, placesWithGuideNumbers, planTones, polygonPath, spaceAtPoint, spaceForFeature, spaceForPlace, type ArchitecturalPlan, type MapPoint, type PlanPlace } from '../lib/architectural-plan';
import './architectural-map.css';
import { PlanPlaceMarker } from './PlanPlaceMarker';
import { resolveArchitecturalEntry } from '../lib/architectural-entry';

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The bounded map viewport is intentionally keyboard-focusable for arrow-key scrolling; room actions remain native buttons. */

const ArchitecturalScene = lazy(() => import('./ArchitecturalScene'));

export function ArchitecturalMap({ plan, guide, active = true }: { plan: ArchitecturalPlan; guide: GuideRecord; active?: boolean }) {
  const visitorNotes = (mapNotes as Record<string, string[]>)[plan.slug] ?? plan.limitations;
  const entry = useMemo(() => resolveArchitecturalEntry(plan), [plan]);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [floorId, setFloorId] = useState(() => entry.floor.id);
  const [selected, setSelected] = useState<string>();
  const [activeStop, setActiveStop] = useState<number>();
  const [zoom, setZoom] = useState(1);
  const [sceneCommand, setSceneCommand] = useState({ id: 0, action: 'reset' });
  const [webglFailed, setWebglFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [availableSize, setAvailableSize] = useState({ width: 1000, height: 560 });
  const viewport = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const floor = plan.floors.find((f) => f.id === floorId)!;
  const numberedPlaces = useMemo(() => placesWithGuideNumbers(plan), [plan]);
  const floorPlaces = useMemo(() => numberedPlaces.filter((p) => p.floorId === floorId), [numberedPlaces, floorId]);
  const locatedStops = guide.spatial.stops.filter((_, index) => placesForStop(plan, index).length > 0).length;
  const pixelsPerUnit = Math.min((availableSize.width - 50) / (floor.bounds[2] - floor.bounds[0]), (availableSize.height - 50) / (floor.bounds[3] - floor.bounds[1]));
  const minX = (floor.bounds[0] + floor.bounds[2]) / 2 - availableSize.width / pixelsPerUnit / 2;
  const minY = (floor.bounds[1] + floor.bounds[3]) / 2 - availableSize.height / pixelsPerUnit / 2;
  const maxX = minX + availableSize.width / pixelsPerUnit;
  const maxY = minY + availableSize.height / pixelsPerUnit;
  const labels = useMemo(() => {
    const projected = floorPlaces.map((p) => ({ ...p, at: [(p.at[0] - minX) * pixelsPerUnit, (p.at[1] - minY) * pixelsPerUnit] as MapPoint }));
    return placeRoomLabels(projected, 1, [availableSize.width, availableSize.height]).map((p) => ({
      ...p, at: floorPlaces.find((source) => source.id === p.id)!.at,
      displayAt: [p.displayAt[0] / pixelsPerUnit + minX, p.displayAt[1] / pixelsPerUnit + minY] as MapPoint,
      width: p.width / pixelsPerUnit, height: p.height / pixelsPerUnit,
    }));
  }, [floorPlaces, pixelsPerUnit, minX, minY, availableSize]);
  const current = plan.places.find((p) => p.id === selected);
  const selectedSpace = spaceForPlace(plan, selected);
  const orderedFloors = [...plan.floors].sort((a, b) => b.order - a.order);

  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width <= 0) return;
      setAvailableSize({ width: Math.max(240, entry.contentRect.width), height: window.matchMedia('(max-width: 700px)').matches ? 460 : 560 });
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  function selectPlace(place: PlanPlace, focus = false, stopIndex?: number) {
    setSelected(place.id);
    setFloorId(place.floorId);
    setActiveStop(stopIndex);
    if (focus && view === '2d') requestAnimationFrame(() => {
      const node = viewport.current?.querySelector<HTMLElement>(`[data-place-id="${place.id}"]`);
      const host = viewport.current;
      if (!node || !host) return;
      const rect = node.getBoundingClientRect(), bounds = host.getBoundingClientRect();
      host.scrollBy({ left: rect.x + rect.width / 2 - bounds.x - bounds.width / 2, top: rect.y + rect.height / 2 - bounds.y - bounds.height / 2 });
    });
  }

  function command(action: string) {
    setSceneCommand((old) => ({ id: old.id + 1, action }));
    if (action === 'reset') {
      setZoom(1);
      viewport.current?.scrollTo({ left: 0, top: 0 });
    } else setZoom((old) => Math.min(4, Math.max(1, old + (action === 'in' ? .5 : -.5))));
  }

  return (
    <div ref={root} className="architectural-map" data-plan-version="2" data-guide-slug={plan.slug} data-entry-status={entry.status}>
      <div className="architectural-map__toolbar">
        <fieldset className="architectural-map__segments" aria-label="地图显示模式">
          <button type="button" aria-pressed={view === '2d'} onClick={() => setView('2d')}>2D 俯视</button>
          <button type="button" aria-pressed={view === '3d'} disabled={webglFailed} onClick={() => setView('3d')}>3D</button>
        </fieldset>
        <div className="architectural-map__tools">
          <button type="button" aria-label="缩小地图" title="缩小" onClick={() => command('out')}><ZoomOut size={19} /></button>
          <button type="button" aria-label="放大地图" title="放大" onClick={() => command('in')}><ZoomIn size={19} /></button>
          <button type="button" aria-label="重置地图视角" title="重置视角" onClick={() => command('reset')}><RotateCcw size={18} /></button>
        </div>
      </div>
      <div className="architectural-map__route-key">
        <span><b className="architectural-map__stop-number" aria-hidden="true">1</b>导览序号</span>
        <span>展厅 / 空间</span>
        <strong data-located-stops={locatedStops}>已定位 {locatedStops}/{guide.spatial.stops.length} 个步骤</strong>
      </div>
      {entry.notice && <p className="architectural-map__notice" data-entry-notice>{entry.notice}</p>}
      {webglFailed && <output className="architectural-map__notice">3D 当前不可用，已切换到可操作的俯视地图。</output>}
      {view === '3d' ? active && <Suspense fallback={<div className="architectural-map__loading">正在加载分层地图</div>}>
        <ArchitecturalScene plan={plan} floorId={floorId} selected={selected} command={sceneCommand} onSelect={(id) => { const p = plan.places.find((p) => p.id === id); if (p) selectPlace(p); }} onFailure={() => { setWebglFailed(true); setView('2d'); }} />
      </Suspense> : <section
        className="architectural-map__viewport" aria-label={`${guide.title}俯视地图，可滚动`} tabIndex={0} ref={viewport}
        onClick={(event) => {
          if (drag.current?.moved || (event.target as Element).closest('button')) return;
          const matrix = svg.current?.getScreenCTM();
          if (!matrix) return;
          const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
          const space = spaceAtPoint(plan, floorId, [point.x, point.y]);
          const place = space && plan.places.find((p) => p.id === space.placeId);
          if (place) selectPlace(place);
        }}
        onKeyDown={(event) => {
          const move: Record<string, [number, number]> = { ArrowLeft: [-80,0], ArrowRight: [80,0], ArrowUp:[0,-80], ArrowDown:[0,80] };
          if (event.target === event.currentTarget && move[event.key]) { event.preventDefault(); event.currentTarget.scrollBy(...move[event.key]); }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || event.pointerType === 'touch' || (event.target as Element).closest('button')) return;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state || state.id !== event.pointerId) return;
          const dx = event.clientX - state.x, dy = event.clientY - state.y;
          state.moved ||= Math.hypot(dx, dy) > 5;
          if (state.moved) event.currentTarget.scrollTo(state.left - dx, state.top - dy);
        }}
        onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { setTimeout(() => { drag.current = null; }, 0); }}
        onBlur={(event) => {
          const state = drag.current;
          if (state && event.currentTarget.hasPointerCapture(state.id)) event.currentTarget.releasePointerCapture(state.id);
          drag.current = null;
        }}
      >
        <div className="architectural-map__plane" style={{ width: availableSize.width * zoom, height: availableSize.height * zoom }}>
        <svg ref={svg} aria-label={`${floor.label}俯视图`} viewBox={`${minX} ${minY} ${maxX-minX} ${maxY-minY}`} style={{ width: (maxX-minX)*pixelsPerUnit*zoom, height: (maxY-minY)*pixelsPerUnit*zoom }}>
          <title>{floor.label}</title>
          {floor.features.map((feature) => <g key={feature.id} data-feature-id={feature.id} data-space-id={spaceForFeature(plan, feature.id)?.id}
            fill={selectedSpace && spaceForFeature(plan, feature.id)?.id === selectedSpace.id ? '#b99443' : planTones[feature.tone]} opacity={feature.kind === 'detail' ? .65 : 1}>
            {feature.polygons.map((polygon, index) => <path key={index} d={polygonPath(polygon)} fillRule="evenodd"
              stroke={feature.kind === 'detail' ? planTones[feature.tone] : undefined}
              strokeWidth={feature.kind === 'detail' ? .35 : undefined} vectorEffect="non-scaling-stroke" />)}
          </g>)}
          {selectedSpace?.floorId === floorId && <g data-selected-space-id={selectedSpace.id} fill="#e8bd5e" fillOpacity=".65" stroke="#f3d894" strokeWidth={1 / pixelsPerUnit} pointerEvents="none">
            {selectedSpace.polygons.map((polygon, index) => <path key={index} d={polygonPath(polygon)} fillRule="evenodd" />)}
          </g>}
          {labels.map((place) => <g key={place.id} data-anchor-id={place.id}>
            <line x1={place.at[0]} y1={place.at[1]} x2={place.displayAt[0]} y2={place.displayAt[1]} stroke="#e7cc85" strokeWidth={1/pixelsPerUnit} />
            <circle cx={place.at[0]} cy={place.at[1]} r={1.7/pixelsPerUnit} fill="#ead797" />
          </g>)}
        </svg>
        <div className="architectural-map__2d-labels">
          {labels.map((place) => <div key={place.id} data-place-id={place.id} style={{
            left: (place.displayAt[0] - place.width / 2 - minX) * pixelsPerUnit * zoom,
            top: (place.displayAt[1] - place.height / 2 - minY) * pixelsPerUnit * zoom,
            width: place.width * pixelsPerUnit * zoom, height: place.height * pixelsPerUnit * zoom,
          }}>
              <button className="architectural-map__room" type="button" title={place.name} data-place-kind={place.kind} aria-label={`${place.label} ${place.name}`} aria-pressed={selected === place.id}
                data-room-id={place.kind === 'room' ? place.id : undefined} aria-describedby={place.guideNumbers?.length ? `${plan.slug}-${place.id}-guide-2d` : undefined} style={{ fontSize:13*zoom, borderWidth:zoom, borderRadius:2*zoom }}
                onClick={() => { if (!drag.current?.moved) selectPlace(place); }}><PlanPlaceMarker place={place} zoom={zoom} descriptionId={place.guideNumbers?.length ? `${plan.slug}-${place.id}-guide-2d` : undefined} /></button>
          </div>)}
        </div>
        </div>
      </section>}
      <fieldset className="architectural-map__floors" aria-label="楼层">
        {orderedFloors.map((f) => <button key={f.id} type="button" aria-pressed={floorId === f.id} onClick={() => { setFloorId(f.id); viewport.current?.scrollTo(0,0); }}>{f.label}</button>)}
      </fieldset>
      <div className="architectural-map__inspector">
        <span>{floorPlaces.length} 个空间标记</span>
        <strong>{current?.floorId === floorId ? `${current.label}${current.name !== current.label ? ` · ${current.name}` : ''}` : floor.label}</strong>
        <label>地点<select aria-label="定位地点" value={current?.floorId === floorId ? current.id : ''} onChange={(event) => { const p = plan.places.find((p) => p.id === event.target.value); if (p) selectPlace(p, true); }}>
          <option value="">选择地点</option>{floorPlaces.map((p) => <option key={p.id} value={p.id}>{p.label}{p.name !== p.label ? ` · ${p.name}` : ''}</option>)}
        </select></label>
      </div>
      {plan.verticalLinks.length > 0 && <div className="architectural-map__connections">
        {plan.verticalLinks.map((link) => {
          const from = plan.places.find((p) => p.id === link.fromPlaceId)!;
          const to = plan.places.find((p) => p.id === link.toPlaceId)!;
          if (from.floorId !== floorId && to.floorId !== floorId) return null;
          const target = from.floorId === floorId ? to : from;
          return <button key={link.id} type="button" onClick={() => selectPlace(target, true)}><ArrowUpDown size={16} aria-hidden="true" />{link.label} → {plan.floors.find((f) => f.id === target.floorId)!.label}</button>;
        })}
      </div>}
      <details className="architectural-map__notes"><summary>平面范围与说明</summary>
        <p>平面保留资料图上比例；墙高、层间距与楼层错位仅为示意，不代表实测尺寸或楼层的实际水平对齐。</p>
        {visitorNotes.map((text) => <p key={text}>{text}</p>)}
        {plan.unlocatedPlaces?.map((place) => <p key={place.id}>{place.label} · {place.name}：{place.reason}</p>)}
      </details>
      <ol className="architectural-map__stops">{guide.spatial.stops.map((stop, index) => {
        const places = placesForStop(plan, index);
        const selectedStop = activeStop === index || (activeStop === undefined && places.some((place) => place.id === selected));
        return <li key={`${index}-${stop}`} data-stop-index={index} data-location-state={places.length ? 'located' : 'unlocated'} data-selected={selectedStop}>
          <span className="architectural-map__stop-number" aria-hidden="true">{index + 1}</span>
          <div className="architectural-map__stop-body">
            {places.length === 1 ? <button type="button" className="architectural-map__stop-focus" aria-current={selectedStop ? 'step' : undefined} onClick={() => selectPlace(places[0], true, index)}><MapPin size={15} aria-hidden="true" />{stop}</button> : <span>{stop}</span>}
            {places.length === 1 && <small className="architectural-map__stop-location">{plan.floors.find((floor) => floor.id === places[0].floorId)!.label} · {places[0].label}</small>}
            {places.length > 1 && <div className="architectural-map__stop-targets">{places.map((place) => <button key={place.id} type="button" aria-label={`定位：${place.name}`} onClick={() => selectPlace(place, true, index)}><MapPin size={15} aria-hidden="true" /><span>{place.name}<small className="architectural-map__stop-location">{plan.floors.find((floor) => floor.id === place.floorId)!.label} · {place.label}</small></span></button>)}</div>}
            {!places.length && <p className="architectural-map__stop-unlocated"><strong>未定位</strong>{(stopNotes as Record<string, string[]>)[plan.slug]?.[index] ?? '当前平面资料未能定位此步骤，保留文字导览。'}</p>}
          </div>
        </li>;
      })}</ol>
    </div>
  );
}
