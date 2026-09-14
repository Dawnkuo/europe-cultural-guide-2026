'use client';

import { lazy, memo, Suspense, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Layers, MapPin, Maximize, Minimize, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { GuideRecord } from '../data/types';
import mapNotes from '../data/architectural-map-notes.json';
import stopNotes from '../data/architectural-stop-notes.json';
import completenessData from '../data/architectural-completeness.generated.json';
import { placesForStop, placesWithGuideNumbers, planTones, polygonPath, spaceAtPoint, spaceForFeature, spaceForPlace, type ArchitecturalPlan, type MapPoint, type PlanPlace } from '../lib/architectural-plan';
import { createPlanDrawing, fitPlanDrawing, drawingLabels, planViewportSize, scrollForPoint, worldPoint, zoomDrawing } from '../lib/architectural-viewport';
import './architectural-map.css';
import { PlanPlaceMarker } from './PlanPlaceMarker';
import { resolveArchitecturalEntry } from '../lib/architectural-entry';
import { useGuideExperience } from './GuideExperience';
import { GuideRoomWorks } from './GuideRoomWorks';
import { useArchitecturalTouch } from './useArchitecturalTouch';

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The bounded map viewport is intentionally keyboard-focusable for arrow-key scrolling; room actions remain native buttons. */

const ArchitecturalScene = lazy(() => import('./ArchitecturalScene'));
type CompletenessNotice = { scope: string; gaps: string[]; partialStops: Record<string, string>; sharedPlans: Array<{ floors: string[]; note: string }> };
const PlanGeometry = memo(function PlanGeometry({ plan, floorId, id, selectedSpaceId }: { plan: ArchitecturalPlan; floorId: string; id: string; selectedSpaceId?: string }) {
  return <g id={id}>{plan.floors.find(f => f.id === floorId)!.features.map(feature => <g key={feature.id} data-feature-id={feature.id} data-space-id={spaceForFeature(plan, feature.id)?.id}
    fill={selectedSpaceId && spaceForFeature(plan, feature.id)?.id === selectedSpaceId ? '#b99443' : planTones[feature.tone]} opacity={feature.kind === 'detail' ? .65 : 1}>
    {feature.polygons.map((polygon, index) => <path key={index} d={polygonPath(polygon)} fillRule="evenodd" stroke={feature.kind === 'detail' ? planTones[feature.tone] : undefined} strokeWidth={feature.kind === 'detail' ? .35 : undefined} vectorEffect="non-scaling-stroke" />)}
  </g>)}</g>;
});

export function ArchitecturalMap({ plan, guide, active = true }: { plan: ArchitecturalPlan; guide: GuideRecord; active?: boolean }) {
  const experience = useGuideExperience();
  const appliedTarget = useRef(0);
  const visitorNotes = (mapNotes as Record<string, string[]>)[plan.slug] ?? plan.limitations;
  const completeness = (completenessData as Record<string, CompletenessNotice>)[plan.slug];
  const entry = useMemo(() => resolveArchitecturalEntry(plan), [plan]);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [floorId, setFloorId] = useState(() => entry.floor.id);
  const [selected, setSelected] = useState<string>();
  const [activeStop, setActiveStop] = useState<number>();
  const [zoomState, setZoomState] = useState({ floorId, value: 1 });
  const zoom = zoomState.floorId === floorId ? zoomState.value : 1;
  const setZoom = (value: number) => setZoomState({ floorId, value });
  const [sceneCommand, setSceneCommand] = useState({ id: 0, action: 'reset' });
  const [webglFailed, setWebglFailed] = useState(false);
  const [showServices, setShowServices] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [layerPanel, setLayerPanel] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(1000);
  const [measured, setMeasured] = useState(false);
  const [focusRevision, setFocusRevision] = useState(0);
  const [scroll, setScroll] = useState<MapPoint>([0, 0]);
  const centres = useRef(new Map<string, MapPoint>());
  const requestedFocus = useRef<{ floorId: string; at: MapPoint } | null>(null);
  const requestedViewportFocus = useRef<{ scroll: boolean } | null>(null);
  const drawingId = useId();
  const viewport = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const floor = plan.floors.find((f) => f.id === floorId)!;
  const numberedPlaces = useMemo(() => placesWithGuideNumbers(plan), [plan]);
  const floorPlaces = useMemo(() => numberedPlaces.filter((p) => p.floorId === floorId), [numberedPlaces, floorId]);
  const availableSize = useMemo(() => planViewportSize(floor, viewportWidth, floorPlaces), [floor, viewportWidth, floorPlaces]);
  const locatedStops = guide.spatial.stops.filter((_, index) => placesForStop(plan, index).length > 0).length;
  const baseline = useMemo(() => fitPlanDrawing(createPlanDrawing(floor, floorPlaces, availableSize), availableSize), [floor, floorPlaces, availableSize]);
  const maxZoom = Math.max(4, 4 / baseline.labelScale!);
  const drawing = useMemo(() => zoomDrawing(baseline, zoom), [baseline, zoom]);
  const labelScale = drawing.labelScale ?? 1;
  const pixelsPerUnit = drawing.scale;
  const [minX, minY] = drawing.min;
  const viewBox = `${minX} ${minY} ${drawing.width / pixelsPerUnit} ${drawing.height / pixelsPerUnit}`;
  const allLabels = useMemo(() => drawingLabels(drawing, floorPlaces), [drawing, floorPlaces]);
  const labels = useMemo(() => allLabels.filter(p => showServices || p.kind !== 'service').map(p => ({ ...p, guideNumbers: showRoute ? p.guideNumbers : [] })), [allLabels, showServices, showRoute]);
  const current = plan.places.find((p) => p.id === selected);
  const selectedSpace = spaceForPlace(plan, selected);
  const orderedFloors = [...plan.floors].sort((a, b) => b.order - a.order);
  const touch = useArchitecturalTouch(viewport, drawing, zoom, `${floorId}:${view}:${active}`, (next, centre) => {
    requestedFocus.current = { floorId, at: centre };
    setZoom(next);
    setFocusRevision(revision => revision + 1);
  }, maxZoom);

  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);

  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width <= 0) return;
      setViewportWidth(Math.max(240, entry.contentRect.width));
      setMeasured(true);
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const host = viewport.current;
    if (!host || !measured || !active || view !== '2d') return;
    const target = requestedFocus.current?.floorId === floorId ? requestedFocus.current.at : centres.current.get(floorId)
      ?? (entry.floor.id === floorId ? entry.place?.at : undefined)
      ?? [(floor.bounds[0] + floor.bounds[2]) / 2, (floor.bounds[1] + floor.bounds[3]) / 2];
    requestedFocus.current = null;
    const at = scrollForPoint(drawing, availableSize, target as MapPoint);
    host.scrollTo({ left: at[0], top: at[1], behavior: 'instant' });
    setScroll(at);
    centres.current.set(floorId, worldPoint(drawing, [at[0] + availableSize.width / 2, at[1] + availableSize.height / 2]));
    if (requestedViewportFocus.current) {
      host.focus({ preventScroll: true });
      if (requestedViewportFocus.current.scroll) host.scrollIntoView({ block: 'center' });
      requestedViewportFocus.current = null;
    }
  }, [drawing, availableSize, floorId, floor, entry, view, active, measured, focusRevision]);

  const selectPlace = useCallback((place: PlanPlace, focus = false, stopIndex?: number) => {
    setSelected(place.id);
    setFloorId(place.floorId);
    setActiveStop(stopIndex);
    if (focus) {
      requestedFocus.current = { floorId: place.floorId, at: place.at };
      setFocusRevision(revision => revision + 1);
    }
  }, []);

  useEffect(() => {
    const target = experience?.mapTarget;
    if (!target || appliedTarget.current === target.serial) return;
    const place = plan.places.find(p => p.id === target.placeId);
    if (!place) return;
    const frame = requestAnimationFrame(() => {
      appliedTarget.current = target.serial;
      if (place.kind === 'service') setShowServices(true);
      requestedViewportFocus.current = { scroll: Boolean(target.scroll) };
      setView('2d');
      selectPlace(place, true);
    });
    return () => cancelAnimationFrame(frame);
  }, [experience?.mapTarget, plan, selectPlace]);

  function command(action: string) {
    setSceneCommand((old) => ({ id: old.id + 1, action }));
    if (action === 'reset') {
      requestedFocus.current = { floorId, at: [(floor.bounds[0] + floor.bounds[2]) / 2, (floor.bounds[1] + floor.bounds[3]) / 2] };
      setFocusRevision(revision => revision + 1);
      setZoom(1);
    } else setZoom(Math.min(maxZoom, Math.max(1, zoom * (action === 'in' ? 1.5 : 1 / 1.5))));
  }

  return (
    <div ref={root} className="architectural-map" data-plan-version="2" data-guide-slug={plan.slug} data-entry-status={entry.status}>
      <div className="architectural-map__toolbar">
        <fieldset className="architectural-map__segments" aria-label="地图显示模式">
          <button type="button" aria-pressed={view === '2d'} onClick={() => setView('2d')}>2D 俯视</button>
          <button type="button" aria-pressed={view === '3d'} disabled={webglFailed} onClick={() => setView('3d')}>3D</button>
        </fieldset>
        <div className="architectural-map__tools">
          <button type="button" aria-label="地图图层" title="图层" aria-expanded={layerPanel} onClick={() => setLayerPanel(value => !value)}><Layers size={19} /></button>
          <button type="button" aria-label="缩小地图" title="缩小" onClick={() => command('out')}><ZoomOut size={19} /></button>
          <button type="button" aria-label="放大地图" title="放大" onClick={() => command('in')}><ZoomIn size={19} /></button>
          <button type="button" aria-label="重置地图视角" title="重置视角" onClick={() => command('reset')}><RotateCcw size={18} /></button>
          <button type="button" aria-label={fullscreen ? '退出全屏地图' : '全屏地图'} title={fullscreen ? '退出全屏' : '全屏'} onClick={async () => {
            try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.current?.requestFullscreen(); setFullscreenError(false); } catch { setFullscreenError(true); }
          }}>{fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</button>
        </div>
      </div>
      {layerPanel && <fieldset className="architectural-map__layers" aria-label="地图图层设置"><label><input type="checkbox" checked={showServices} onChange={event => setShowServices(event.target.checked)} />服务设施</label><label><input type="checkbox" checked={showRoute} onChange={event => setShowRoute(event.target.checked)} />导览序号</label></fieldset>}
      {fullscreenError && <output className="architectural-map__notice">此浏览器暂不支持全屏，地图缩放仍可使用。</output>}
      <div className="architectural-map__route-key">
        <span><b className="architectural-map__stop-number" aria-hidden="true">1</b>导览序号</span>
        {floor.legend?.length ? floor.legend.map((item) => <span key={item.tone}><i className="architectural-map__swatch" style={{ backgroundColor: planTones[item.tone] }} aria-hidden="true" />{item.label}</span>) : <span>展厅 / 空间</span>}
        <strong data-located-stops={locatedStops}>{locatedStops}/{guide.spatial.stops.length} 步骤含定位点</strong>
      </div>
      {entry.notice && <p className="architectural-map__notice" data-entry-notice>{entry.notice}</p>}
      {completeness?.gaps.length > 0 && <details className="architectural-map__coverage architectural-map__notes">
        <summary>地图尚有缺项：{completeness.gaps.slice(0, 2).join('、')}{completeness.gaps.length > 2 ? '等' : ''}</summary>
        <p>{completeness.scope}</p>
        {completeness.gaps.map((gap) => <p key={gap}>{gap}</p>)}
      </details>}
      {completeness?.sharedPlans.filter((group) => group.floors.includes(floorId)).map((group) => <output key={group.floors.join('-')} className="architectural-map__notice">{group.note}</output>)}
      {webglFailed && <output className="architectural-map__notice">3D 当前不可用，已切换到可操作的俯视地图。</output>}
      {view === '3d' ? active && <Suspense fallback={<div className="architectural-map__loading">正在加载分层地图</div>}>
        <ArchitecturalScene plan={plan} floorId={floorId} selected={selected} command={sceneCommand} showServices={showServices} showRoute={showRoute} onFloorSelect={id => { setFloorId(id); setSelected(undefined); setActiveStop(undefined); }} onSelect={(id) => { const p = plan.places.find((p) => p.id === id); if (p) selectPlace(p); }} onFailure={() => { setWebglFailed(true); setView('2d'); }} />
      </Suspense> : <section
        className="architectural-map__viewport" aria-label={`${guide.title}俯视地图，可滚动`} tabIndex={0} ref={viewport} data-zoom={zoom} style={{ height: availableSize.height }}
        onScroll={event => {
          const { scrollLeft, scrollTop, clientWidth, clientHeight } = event.currentTarget;
          centres.current.set(floorId, worldPoint(drawing, [scrollLeft + clientWidth / 2, scrollTop + clientHeight / 2]));
          setScroll([scrollLeft, scrollTop]);
        }}
        onClick={(event) => {
          if (drag.current?.moved || touch.moved.current || (event.target as Element).closest('button')) return;
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
          if (event.target === event.currentTarget && ['+', '=', '-'].includes(event.key)) { event.preventDefault(); command(event.key === '-' ? 'out' : 'in'); }
        }}
        onPointerDown={(event) => {
          if (touch.down(event)) return;
          if (event.button !== 0 || (event.target as Element).closest('button')) return;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (touch.move(event)) return;
          const state = drag.current;
          if (!state || state.id !== event.pointerId) return;
          const dx = event.clientX - state.x, dy = event.clientY - state.y;
          state.moved ||= Math.hypot(dx, dy) > 5;
          if (state.moved) event.currentTarget.scrollTo(state.left - dx, state.top - dy);
        }}
        onPointerUp={(event) => { if (touch.up(event)) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { touch.cancel(); drag.current = null; }}
        onLostPointerCapture={(event) => {
          // A room button gives capture to the viewport when a touch becomes a drag.
          if (event.target !== event.currentTarget || event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if (touch.up(event)) return;
          setTimeout(() => { drag.current = null; }, 0);
        }}
        onBlur={(event) => {
          const state = drag.current;
          if (state && event.currentTarget.hasPointerCapture(state.id)) event.currentTarget.releasePointerCapture(state.id);
          drag.current = null;
        }}
      >
        <div className="architectural-map__plane" style={{ width: drawing.width, height: drawing.height }}>
        <svg ref={svg} aria-label={`${floor.label}俯视图`} viewBox={viewBox} style={{ width: drawing.width, height: drawing.height }}>
          <title>{floor.label}</title>
          <PlanGeometry plan={plan} floorId={floorId} id={drawingId} selectedSpaceId={selectedSpace?.id} />
          {selectedSpace?.floorId === floorId && <g data-selected-space-id={selectedSpace.id} fill="#e8bd5e" fillOpacity=".65" stroke="#f3d894" strokeWidth={1 / pixelsPerUnit} pointerEvents="none">
            {selectedSpace.polygons.map((polygon, index) => <path key={index} d={polygonPath(polygon)} fillRule="evenodd" />)}
          </g>}
          {labels.map((place) => <g key={place.id} data-anchor-id={place.id}>
            <line x1={place.at[0]/pixelsPerUnit+minX} y1={place.at[1]/pixelsPerUnit+minY} x2={place.displayAt[0]/pixelsPerUnit+minX} y2={place.displayAt[1]/pixelsPerUnit+minY} stroke={selected === place.id ? '#ffe2a1' : '#ab995f'} strokeWidth={(selected === place.id ? 2 : .7)/pixelsPerUnit} />
            <circle cx={place.at[0]/pixelsPerUnit+minX} cy={place.at[1]/pixelsPerUnit+minY} r={(selected === place.id ? 4 : 1.7)/pixelsPerUnit} fill="#ead797" />
          </g>)}
        </svg>
        <div className="architectural-map__2d-labels">
          {labels.map((place) => <div key={place.id} data-place-id={place.id} data-selected={selected === place.id} style={{
            left: place.displayAt[0] - place.width / 2,
            top: place.displayAt[1] - place.height / 2,
            width: place.width, height: place.height,
          }}>
              <button className="architectural-map__room" type="button" title={place.name} data-place-kind={place.kind} aria-label={`${place.label} ${place.name}`} aria-pressed={selected === place.id}
                data-room-id={place.kind === 'room' ? place.id : undefined} aria-describedby={place.guideNumbers?.length ? `${plan.slug}-${place.id}-guide-2d` : undefined} style={{ fontSize:13 * labelScale, borderWidth:Math.min(1,labelScale), borderRadius:2 * labelScale }}
                onClick={event => { if (!event.detail || (!drag.current?.moved && !touch.moved.current)) selectPlace(plan.places.find(p => p.id === place.id)!); }}><PlanPlaceMarker place={place} zoom={labelScale} descriptionId={place.guideNumbers?.length ? `${plan.slug}-${place.id}-guide-2d` : undefined} /></button>
          </div>)}
        </div>
        </div>
      </section>}
      <fieldset className="architectural-map__floors" aria-label="楼层">
        {orderedFloors.map((f) => <button key={f.id} type="button" aria-pressed={floorId === f.id} onClick={() => setFloorId(f.id)}>{f.label}</button>)}
      </fieldset>
      <div className="architectural-map__inspector">
        {view === '2d' && <button type="button" className="architectural-map__overview" aria-label="地图总览定位" title="地图总览：点击定位" onClick={event => {
          const matrix = event.currentTarget.querySelector('svg')?.getScreenCTM();
          if (!matrix) return;
          const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
          const at: MapPoint = event.detail ? [point.x, point.y] : [(floor.bounds[0]+floor.bounds[2])/2, (floor.bounds[1]+floor.bounds[3])/2];
          requestedFocus.current = { floorId, at };
          setFocusRevision(revision => revision + 1);
          viewport.current?.focus({ preventScroll: true });
        }}><svg viewBox={viewBox} aria-hidden="true"><use href={`#${drawingId}`} /><rect x={minX+scroll[0]/pixelsPerUnit} y={minY+scroll[1]/pixelsPerUnit} width={availableSize.width/pixelsPerUnit} height={availableSize.height/pixelsPerUnit} fill="#e9c56c" fillOpacity=".16" stroke="#e9c56c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />{current?.floorId === floorId && <circle cx={current.at[0]} cy={current.at[1]} r={Math.max(drawing.width,drawing.height)/pixelsPerUnit/45} fill="#ffe2a1" />}</svg><span>{Math.round(zoom*100)}%</span></button>}
        <span>{floorPlaces.length} 个空间标记</span>
        <strong>{current?.floorId === floorId ? `${current.label}${current.name !== current.label ? ` · ${current.name}` : ''}` : floor.label}</strong>
        <label>地点<select aria-label="定位地点" value={current?.floorId === floorId ? current.id : ''} onChange={(event) => { const p = plan.places.find((p) => p.id === event.target.value); if (p) selectPlace(p, true); }}>
          <option value="">选择地点</option>{floorPlaces.map((p) => <option key={p.id} value={p.id}>{p.label}{p.name !== p.label ? ` · ${p.name}` : ''}</option>)}
        </select></label>
      </div>
      <GuideRoomWorks guide={guide} place={current?.floorId === floorId ? current : undefined} />
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
        const partialNote = places.length ? completeness?.partialStops[index + 1] : undefined;
        const selectedStop = activeStop === index || (activeStop === undefined && places.some((place) => place.id === selected));
        return <li key={`${index}-${stop}`} data-stop-index={index} data-location-state={places.length ? partialNote ? 'partial' : 'located' : 'unlocated'} data-selected={selectedStop}>
          <span className="architectural-map__stop-number" aria-hidden="true">{index + 1}</span>
          <div className="architectural-map__stop-body">
            {places.length === 1 ? <button type="button" className="architectural-map__stop-focus" aria-current={selectedStop ? 'step' : undefined} onClick={() => selectPlace(places[0], true, index)}><MapPin size={15} aria-hidden="true" />{stop}</button> : <span>{stop}</span>}
            {places.length === 1 && <small className="architectural-map__stop-location">{plan.floors.find((floor) => floor.id === places[0].floorId)!.label} · {places[0].label}</small>}
            {places.length > 1 && <div className="architectural-map__stop-targets">{places.map((place) => <button key={place.id} type="button" aria-label={`定位：${place.name}`} onClick={() => selectPlace(place, true, index)}><MapPin size={15} aria-hidden="true" /><span>{place.name}<small className="architectural-map__stop-location">{plan.floors.find((floor) => floor.id === place.floorId)!.label} · {place.label}</small></span></button>)}</div>}
            {!places.length && <p className="architectural-map__stop-unlocated"><strong>未定位</strong>{(stopNotes as Record<string, string[]>)[plan.slug]?.[index] ?? '当前平面资料未能定位此步骤，保留文字导览。'}</p>}
            {partialNote && <p className="architectural-map__stop-unlocated"><strong>部分定位</strong>{partialNote}</p>}
          </div>
        </li>;
      })}</ol>
    </div>
  );
}
