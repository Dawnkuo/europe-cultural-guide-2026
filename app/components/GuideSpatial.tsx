'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import type { GuideRecord } from '../data/types';
import availabilityData from '../data/floorplan-availability.json';
import type { ArchitecturalPlan } from '../lib/architectural-plan';
import { hasArchitecturalPlan, loadArchitecturalPlan } from '../lib/architectural-plan-loader';

const ArchitecturalMap = lazy(() => import('./ArchitecturalMap').then((module) => ({ default: module.ArchitecturalMap })));
const GuideExteriorScene = lazy(() => import('./GuideExteriorScene').then((module) => ({ default: module.GuideExteriorScene })));

function SpatialLoading({ message }: { message: string }) {
  return <output aria-label="地图加载状态" aria-live="polite" className="guide-spatial__loading">{message}</output>;
}

function ReviewedGuideSpatial({ guide }: { guide: GuideRecord }) {
  const [plan, setPlan] = useState<ArchitecturalPlan>();
  const [failed, setFailed] = useState(false);
  const [exterior, setExterior] = useState(false);
  useEffect(() => {
    let live = true;
    void loadArchitecturalPlan(guide.slug).then((data) => { if (live) setPlan(data); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [guide.slug]);
  return <section className="guide-section guide-spatial" id="guide-spatial">
    <div className="guide-section__heading"><p>01 / 场馆空间</p><h2>室内导览地图</h2><span>{plan ? plan.floors.map((floor) => floor.label).join(' · ') : guide.title}</span></div>
    <fieldset className="guide-spatial__view-tabs" aria-label="内外视图">
      <button type="button" aria-pressed={!exterior} onClick={() => setExterior(false)}>内部</button>
      <button type="button" aria-pressed={exterior} onClick={() => setExterior(true)}>外观</button>
    </fieldset>
    <Suspense fallback={<SpatialLoading message="正在加载地图" />}>
      {exterior && <GuideExteriorScene guide={guide} />}
      <div hidden={exterior}>
        {plan ? <ArchitecturalMap plan={plan} guide={guide} active={!exterior} /> : failed ? <div role="alert">平面数据加载失败，请重新载入页面。{guide.spatial.stops.map((stop, index) => <p key={`${index}-${stop}`}>{stop}</p>)}</div> : <SpatialLoading message="正在加载平面数据" />}
      </div>
    </Suspense>
  </section>;
}

export function GuideSpatial({ guide }: { guide: GuideRecord }) {
  return hasArchitecturalPlan(guide.slug) ? <ReviewedGuideSpatial key={guide.slug} guide={guide} /> : <ExteriorGuideSpatial guide={guide} />;
}

function ExteriorGuideSpatial({ guide }: { guide: GuideRecord }) {
  const availability = (availabilityData as Record<string, string>)[guide.slug];
  const interiorPending = availability === 'ready' || availability === 'source-limited';
  return <section className="guide-section guide-spatial" id="guide-spatial">
    <div className="guide-section__heading"><p>01 / 场馆空间</p><h2>3D 导览地图</h2><span>{guide.spatial.title}</span></div>
    {interiorPending && <output className="guide-spatial__data-status">
      {availability === 'source-limited' ? '内部平面资料待补' : '室内地图待重建'}。当前展示外观示意，未使用简化室内布局代替真实平面。
    </output>}
    <Suspense fallback={<SpatialLoading message="正在加载外观地图" />}><GuideExteriorScene guide={guide} /></Suspense>
  </section>;
}
