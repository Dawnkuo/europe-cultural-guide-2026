'use client';

import { lazy, Suspense, useRef, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { libraryPiers, librarySpaces, libraryWalls } from '../data/vatican-library';

const LibraryScene = lazy(() => import('./VaticanCampusScene').catch(() => ({ default: ({ onFallback }: { onFallback: () => void }) => <div role="alert"><p>三维剖切加载失败。</p><button type="button" onClick={onFallback}>返回二维剖切</button></div> })));

function LibraryPlan({ portrait = false }: { portrait?: boolean }) {
  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Semantic vector plan, not an image URL.
  return <svg className={`vatican-library__plan ${portrait ? 'is-portrait' : 'is-landscape'}`} viewBox={portrait ? '0 0 430 1450' : '1160 3680 1450 430'} role="img" aria-label="图书馆横翼平面，两端连接空间与西斯廷大厅六座中柱">
    <g transform={portrait ? 'matrix(0 1 -1 0 4110 -1160)' : undefined}>
      {librarySpaces.map(space => <polygon key={space.id} points={space.polygon.map(p => p.join(',')).join(' ')} fill={space.id === 'sistine-hall' ? '#264b58' : '#182f40'} />)}
      {[...libraryWalls, ...libraryPiers].map(([a, b, c, d], index) => <rect key={index} x={a} y={b} width={c - a} height={d - b} fill="#ddc990" />)}
    </g>
    {librarySpaces.map((space, index) => <text key={space.id} x={portrait ? 4110 - space.label[1] : space.label[0]} y={portrait ? space.label[0] - 1160 : space.label[1]} textAnchor="middle" dominantBaseline="central" fill="#f2ebd7" fontSize={portrait ? 52 : 28}>{portrait ? index + 1 : space.id === 'sistine-hall' ? space.name : space.id === 'west-vestibule' ? '西侧连接' : '东侧连接'}</text>)}
  </svg>;
}

export function VaticanLibraryStudy() {
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const transform = useRef<ReactZoomPanPinchRef>(null);
  return <details className="vatican-library" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>图书馆横翼 · 建筑剖切</summary>
    {open && <>
      <fieldset className="vatican-campus__modes" aria-label="图书馆剖切显示方式">
        <button type="button" aria-pressed={view === '2d'} onClick={() => { setScale(1); setView('2d'); }}>2D 平面</button>
        <button type="button" aria-pressed={view === '3d'} onClick={() => setView('3d')}>3D 剖切</button>
      </fieldset>
      {view === '2d' ? <TransformWrapper ref={transform} minScale={1} maxScale={8} smooth={false} velocityAnimation={{ disabled: true }} onTransform={(_, state) => setScale(state.scale)}>
        <div className="vatican-campus__tools">
          <span>建筑平面</span><output aria-label="图书馆平面缩放比例">{Math.round(scale * 100)}%</output>
          <button type="button" aria-label="缩小图书馆平面" title="缩小图书馆平面" disabled={scale <= 1} onClick={() => transform.current?.zoomOut(.3, 0)}><ZoomOut /></button>
          <button type="button" aria-label="放大图书馆平面" title="放大图书馆平面" disabled={scale >= 8} onClick={() => transform.current?.zoomIn(.3, 0)}><ZoomIn /></button>
          <button type="button" aria-label="重置图书馆平面" title="重置图书馆平面" onClick={() => transform.current?.resetTransform(0)}><RotateCcw /></button>
        </div>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- Keyboard equivalent of the pan/zoom viewport. */}
        <div className="vatican-library__viewport" role="application" aria-label="图书馆二维剖切" tabIndex={0} onKeyDown={event => {
          if (event.target !== event.currentTarget || !transform.current) return;
          const api = transform.current;
          const { positionX, positionY, scale: z } = api.state;
          if (event.key === '+' || event.key === '=') void api.zoomIn(.3, 0);
          else if (event.key === '-') void api.zoomOut(.3, 0);
          else if (event.key === 'Home') void api.resetTransform(0);
          else if (event.key === 'ArrowLeft') void api.setTransform(positionX + 50, positionY, z, 0);
          else if (event.key === 'ArrowRight') void api.setTransform(positionX - 50, positionY, z, 0);
          else if (event.key === 'ArrowUp') void api.setTransform(positionX, positionY + 50, z, 0);
          else if (event.key === 'ArrowDown') void api.setTransform(positionX, positionY - 50, z, 0);
          else return;
          event.preventDefault();
        }}><TransformComponent wrapperClass="vatican-library__transform" contentClass="vatican-library__content"><LibraryPlan /><LibraryPlan portrait /></TransformComponent></div>
      </TransformWrapper> : <Suspense fallback={<output className="vatican-campus__three-loading">正在载入图书馆剖切…</output>}><LibraryScene kind="library" selectedId="library" focusSerial={0} onFallback={() => { setScale(1); setView('2d'); }} /></Suspense>}
      <ol className="vatican-library__legend">{librarySpaces.map((space, index) => <li key={space.id}><span aria-hidden="true">{index + 1}</span> {space.name}</li>)}</ol>
      <p className="vatican-campus__scope">双廊大厅与两端连接空间的建筑剖切。墙体截低，拱顶和屋面仅保留轮廓；不含楼下书库、现代电梯和家具，也未与馆区地形高程配准。</p>
    </>}
  </details>;
}
