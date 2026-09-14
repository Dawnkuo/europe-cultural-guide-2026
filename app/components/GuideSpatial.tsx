'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import type { GuideRecord } from '../data/types';
import availabilityData from '../data/floorplan-availability.json';
import type { ArchitecturalPlan } from '../lib/architectural-plan';
import { hasArchitecturalPlan, loadArchitecturalPlan } from '../lib/architectural-plan-loader';
import { useGuideExperience } from './GuideExperience';
import { hasVaticanCampus } from '../data/vatican-campus';

const ArchitecturalMap = lazy(() => import('./ArchitecturalMap').then((module) => ({ default: module.ArchitecturalMap })));
const GuideExteriorScene = lazy(() => import('./GuideExterior').then((module) => ({ default: module.GuideExterior })));
const VaticanCampusMap = lazy(() => import('./VaticanCampusMap').then(module => ({ default: module.VaticanCampusMap })));

function SpatialLoading({ message }: { message: string }) {
  return <output aria-label="地图加载状态" aria-live="polite" className="guide-spatial__loading">{message}</output>;
}

function ReviewedGuideSpatial({ guide }: { guide: GuideRecord }) {
  const experience = useGuideExperience();
  const [ownPlan, setPlan] = useState<ArchitecturalPlan>();
  const plan = experience?.plan ?? ownPlan;
  const [failed, setFailed] = useState(false);
  const targetSerial = experience?.mapTarget?.serial ?? 0;
  const [viewSelection, setViewSelection] = useState<{ serial: number; value: 'interior' | 'exterior' | 'campus' }>({ serial: 0, value: 'interior' });
  const view = viewSelection.serial === targetSerial ? viewSelection.value : 'interior';
  const setView = (value: 'interior' | 'exterior' | 'campus') => setViewSelection({ serial: targetSerial, value });
  useEffect(() => {
    if (experience) return;
    let live = true;
    void loadArchitecturalPlan(guide.slug).then((data) => { if (live) setPlan(data); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [guide.slug, experience]);
  return <section className="guide-section guide-spatial" id="guide-spatial">
    <div className="guide-section__heading"><p>01 / 场馆空间</p><h2>{view === 'campus' ? '馆区导览地图' : '室内导览地图'}</h2><span>{plan ? plan.floors.map((floor) => floor.label).join(' · ') : guide.title}</span></div>
    <fieldset className="guide-spatial__view-tabs" aria-label="内外视图">
      <button type="button" aria-pressed={view === 'interior'} onClick={() => setView('interior')}>内部</button>
      {hasVaticanCampus(guide.slug) && <button type="button" aria-pressed={view === 'campus'} onClick={() => setView('campus')}>馆区总览</button>}
      <button type="button" aria-pressed={view === 'exterior'} onClick={() => setView('exterior')}>外观</button>
    </fieldset>
    <Suspense fallback={<SpatialLoading message="正在加载地图" />}>
      {view === 'exterior' && <GuideExteriorScene guide={guide} />}
      {view === 'campus' && <VaticanCampusMap guide={guide} plan={plan} onLocate={experience ? id => { experience.locatePlace(id, false); setView('interior'); } : undefined} />}
      <div hidden={view !== 'interior'}>
        {plan ? <ArchitecturalMap plan={plan} guide={guide} active={view === 'interior'} /> : failed || experience?.planFailed ? <div role="alert">平面数据加载失败，请重新载入页面。{guide.spatial.stops.map((stop, index) => <p key={`${index}-${stop}`}>{stop}</p>)}</div> : <SpatialLoading message="正在加载平面数据" />}
      </div>
    </Suspense>
  </section>;
}

export function GuideSpatial({ guide }: { guide: GuideRecord }) {
  return hasArchitecturalPlan(guide.slug) ? <ReviewedGuideSpatial key={guide.slug} guide={guide} /> : <ExteriorGuideSpatial guide={guide} />;
}

function ExteriorGuideSpatial({ guide }: { guide: GuideRecord }) {
  const [campus, setCampus] = useState(false);
  const availability = (availabilityData as Record<string, string>)[guide.slug];
  const interiorPending = availability === 'ready' || availability === 'source-limited';
  return <section className="guide-section guide-spatial" id="guide-spatial">
    <div className="guide-section__heading"><p>01 / 场馆空间</p><h2>{campus ? '馆区导览地图' : '3D 导览地图'}</h2><span>{guide.spatial.title}</span></div>
    {interiorPending && <output className="guide-spatial__data-status" aria-label="室内平面状态">
      {availability === 'source-limited' ? '内部平面资料待补' : '室内地图待重建'}。当前展示外观示意，未使用简化室内布局代替真实平面。
    </output>}
    {hasVaticanCampus(guide.slug) && <fieldset className="guide-spatial__view-tabs" aria-label="馆区与外观"><button type="button" aria-pressed={campus} onClick={() => setCampus(true)}>馆区总览</button><button type="button" aria-pressed={!campus} onClick={() => setCampus(false)}>外观</button></fieldset>}
    <Suspense fallback={<SpatialLoading message="正在加载外观地图" />}>{campus ? <VaticanCampusMap guide={guide} /> : <GuideExteriorScene key={guide.slug} guide={guide} />}</Suspense>
  </section>;
}
