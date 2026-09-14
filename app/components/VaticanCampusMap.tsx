'use client';

import { ArrowUpRight, Compass, MapPin, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { lazy, Suspense, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { vaticanCampusLabels, vaticanCampusRegions, type VaticanCampusRegion } from '../data/vatican-campus';
import type { GuideRecord } from '../data/types';
import type { ArchitecturalPlan } from '../lib/architectural-plan';
import { withBasePath } from '../lib/paths';
import { VaticanLibraryStudy } from './VaticanLibraryStudy';
import './vatican-campus.css';

const VaticanCampusScene = lazy(() => import('./VaticanCampusScene').catch(() => ({ default: CampusModuleUnavailable })));

function CampusModuleUnavailable({ onFallback }: { onFallback: () => void }) {
  return <div className="vatican-campus__module-failure" role="alert"><p>三维馆区组件加载失败，二维地图仍可使用。</p><button type="button" onClick={onFallback}>返回二维馆区</button></div>;
}

export function VaticanCampusMap({ guide, plan, onLocate }: {
  guide: GuideRecord;
  plan?: ArchitecturalPlan;
  onLocate?: (placeId: string) => void;
}) {
  const defaultId = guide.slug === 'st-peters-square' ? 'square' : guide.slug === 'st-peters-basilica' ? 'basilica' : 'entrance';
  const [selectedId, setSelectedId] = useState(defaultId);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [focusSerial, setFocusSerial] = useState(0);
  const [scale, setScale] = useState(1);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const transform = useRef<ReactZoomPanPinchRef>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const selected = vaticanCampusRegions.find(r => r.id === selectedId)!;
  const places = plan?.slug === 'vatican-museums' ? plan.places.filter(p => selected.places.includes(p.id)) : [];

  function changeView(next: '2d' | '3d') {
    if (next === view) return;
    if (next === '2d') setScale(1);
    setView(next);
  }

  function select(region: VaticanCampusRegion) {
    setSelectedId(region.id);
    setFocusSerial(value => value + 1);
    const element = canvas.current;
    if (!element) return;
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (!width || !height || failed) return;
    const frame = element.parentElement;
    if (!frame) return;
    const insetX = element.offsetLeft;
    const insetY = element.offsetTop;
    const zoom = 2;
    void transform.current?.setTransform(
      frame.clientWidth / 2 - (insetX + (region.at[0] - 385) / 1430 * width) * zoom,
      frame.clientHeight / 2 - (insetY + (region.at[1] - 1270) / 1240 * height) * zoom,
      zoom, 0,
    );
  }

  const regionList = <div className="vatican-campus__regions">
    <h3>馆区与建筑</h3>
    <div className="vatican-campus__list" aria-label="馆区列表">
      {vaticanCampusRegions.map(region => <button key={region.id} type="button" aria-pressed={region.id === selectedId} onClick={() => select(region)}>{region.name}</button>)}
    </div>
  </div>;

  return <section className="vatican-campus" aria-label="梵蒂冈馆区总览">
    <fieldset className="vatican-campus__modes" aria-label="馆区显示方式">
      <button type="button" aria-pressed={view === '2d'} onClick={() => changeView('2d')}>2D 馆区</button>
      <button type="button" aria-pressed={view === '3d'} onClick={() => changeView('3d')}>3D 馆区</button>
    </fieldset>
    {view === '3d' ? <div className="vatican-campus__body">
      <Suspense fallback={<output className="vatican-campus__three-loading">正在载入馆区视图…</output>}>
        <VaticanCampusScene selectedId={selectedId} focusSerial={focusSerial} onFallback={() => changeView('2d')} />
      </Suspense>
      {regionList}
    </div> : <TransformWrapper ref={transform} minScale={1} maxScale={6} disablePadding smooth={false}
      velocityAnimation={{ disabled: true }} zoomAnimation={{ disabled: true }}
      autoAlignment={{ animationTime: 0 }} panning={{ velocityDisabled: true, excluded: ['button'] }}
      doubleClick={{ mode: 'toggle', animationTime: 0 }}
      onTransform={(_, state) => setScale(state.scale)}>
      <div className="vatican-campus__tools">
        <span><Compass size={18} aria-hidden="true" />北向右</span>
        <output aria-label="馆区缩放比例">{Math.round(scale * 100)}%</output>
        <button type="button" title="缩小馆区地图" aria-label="缩小馆区地图" disabled={scale <= 1 || failed} onClick={() => transform.current?.zoomOut(.3, 0)}><ZoomOut /></button>
        <button type="button" title="放大馆区地图" aria-label="放大馆区地图" disabled={scale >= 6 || failed} onClick={() => transform.current?.zoomIn(.3, 0)}><ZoomIn /></button>
        <button type="button" title="显示完整馆区" aria-label="显示完整馆区" disabled={failed} onClick={() => transform.current?.resetTransform(0)}><RotateCcw /></button>
      </div>
      <div className="vatican-campus__body">
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- Focusable map viewport supports keyboard pan and zoom. */}
        <div className="vatican-campus__stage" role="application" aria-label="梵蒂冈馆区二维地图" tabIndex={0}
          onKeyDown={event => {
            if (event.target !== event.currentTarget || failed) return;
            const api = transform.current;
            if (!api) return;
            const { positionX, positionY, scale: zoom } = api.state;
            if (event.key === '+' || event.key === '=') void api.zoomIn(.3, 0);
            else if (event.key === '-') void api.zoomOut(.3, 0);
            else if (event.key === 'Home' || event.key === '0') void api.resetTransform(0);
            else if (event.key === 'ArrowLeft') void api.setTransform(positionX + 60, positionY, zoom, 0);
            else if (event.key === 'ArrowRight') void api.setTransform(positionX - 60, positionY, zoom, 0);
            else if (event.key === 'ArrowUp') void api.setTransform(positionX, positionY + 60, zoom, 0);
            else if (event.key === 'ArrowDown') void api.setTransform(positionX, positionY - 60, zoom, 0);
            else return;
            event.preventDefault();
          }}>
          <TransformComponent wrapperClass="vatican-campus__viewport" contentClass="vatican-campus__content">
            <div ref={canvas} className="vatican-campus__canvas">
              {/* oxlint-disable-next-line next/no-img-element -- Local source-derived SVG also works offline without WebGL. */}
              <img key={attempt} src={withBasePath('/maps/vatican-campus.svg')} alt="梵蒂冈博物馆、教宗宫、圣彼得大教堂与广场的建筑关系" draggable={false}
                onError={() => setFailed(true)} onLoad={() => setFailed(false)} />
              {!failed && <svg className="vatican-campus__leaders" viewBox="385 1270 1430 1240" aria-hidden="true">
                {vaticanCampusRegions.map(region => <g key={region.id} className={region.id === selectedId ? 'is-selected' : ''}>
                  <line x1={region.at[0]} y1={region.at[1]} x2={vaticanCampusLabels[region.id][0]} y2={vaticanCampusLabels[region.id][1]} vectorEffect="non-scaling-stroke" />
                  <circle cx={region.at[0]} cy={region.at[1]} r={4 / scale} />
                </g>)}
              </svg>}
              {!failed && vaticanCampusRegions.map(region => <button key={region.id} type="button" className="vatican-campus__label" aria-label={`地图上的${region.name}`} aria-pressed={region.id === selectedId} onClick={() => select(region)}
                style={{ left: `${(vaticanCampusLabels[region.id][0] - 385) / 1430 * 100}%`, top: `${(vaticanCampusLabels[region.id][1] - 1270) / 1240 * 100}%`, transform: `translate(-50%, -50%) scale(${1 / scale})` }}>{region.name}</button>)}
              {!failed && <span className="vatican-campus__pin" data-campus-region={selected.id} title={`${selected.name}区域位置`}
                style={{ left: `${(selected.at[0] - 385) / 1430 * 100}%`, top: `${(selected.at[1] - 1270) / 1240 * 100}%`, transform: `translate(-50%, -50%) scale(${1 / scale})` }}><MapPin size={28} aria-hidden="true" /></span>}
            </div>
          </TransformComponent>
          {failed && <div className="vatican-campus__failure" role="alert"><p>馆区地图加载失败，区域列表仍可使用。</p><button type="button" onClick={() => setAttempt(a => a + 1)}>重新加载地图</button></div>}
        </div>
        {regionList}
      </div>
    </TransformWrapper>}
    <div className="vatican-campus__detail" aria-live="polite">
      <h3>{selected.name}</h3><p>{selected.description}</p>
      {selected.id === 'library' && <VaticanLibraryStudy />}
      <div className="vatican-campus__links">
        {onLocate && places.map(place => <button key={place.id} type="button" onClick={() => onLocate(place.id)}><MapPin size={18} aria-hidden="true" />{place.name}<ArrowUpRight size={16} aria-hidden="true" /></button>)}
        {selected.guideSlug && <a href={withBasePath(`/guides/${selected.guideSlug}/#guide-spatial`)}>打开{selected.name}导览<ArrowUpRight size={18} aria-hidden="true" /></a>}
        {!places.length && selected.places.length > 0 && guide.slug !== 'vatican-museums' && <a href={withBasePath('/guides/vatican-museums/#guide-spatial')}>打开博物馆室内导览<ArrowUpRight size={18} aria-hidden="true" /></a>}
      </div>
    </div>
  </section>;
}
