'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import type { GuideRecord } from '../data/types';
import {
  getFloorPlanAvailability,
  loadGuideFloorPlan,
} from '../lib/guide-floorplan-loader';
import type { StackedFloorPlan } from '../lib/floorplans/core';

const GuideExteriorScene = lazy(() =>
  import('./GuideExteriorScene').then((module) => ({
    default: module.GuideExteriorScene,
  })),
);
const GuideStackedFloorPlan = lazy(() =>
  import('./GuideStackedFloorPlan').then((module) => ({
    default: module.GuideStackedFloorPlan,
  })),
);

const spatialLabels: Record<GuideRecord['spatial']['type'], string> = {
  floorplan: '场馆空间',
  site: '遗址关系',
  viewpoints: '观察方位',
  district: '街区节点',
};

function SpatialLoading({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  return (
    <output
      aria-label={label}
      aria-live="polite"
      className="guide-spatial__loading"
    >
      {message}
    </output>
  );
}

export function GuideSpatial({ guide }: { guide: GuideRecord }) {
  const availability = getFloorPlanAvailability(guide.slug);
  const expectsFloorPlan = availability === 'ready';
  const sourceLimited = availability === 'source-limited';
  const defaultView = expectsFloorPlan ? 'interior' : 'exterior';
  const [viewSelection, setViewSelection] = useState<{
    slug: string;
    value: 'interior' | 'exterior';
  }>(() => ({ slug: guide.slug, value: defaultView }));
  const [loadResult, setLoadResult] = useState<{
    floorPlan?: StackedFloorPlan;
    slug: string;
    state: 'loading' | 'ready' | 'failed';
  }>(() => ({ slug: guide.slug, state: 'loading' }));
  const view =
    viewSelection.slug === guide.slug ? viewSelection.value : defaultView;
  const floorPlan =
    loadResult.slug === guide.slug ? loadResult.floorPlan : undefined;
  const floorPlanState = !expectsFloorPlan
    ? 'idle'
    : loadResult.slug === guide.slug
      ? loadResult.state
      : 'loading';

  function selectView(value: 'interior' | 'exterior') {
    setViewSelection({ slug: guide.slug, value });
  }

  useEffect(() => {
    if (!expectsFloorPlan) return;

    let cancelled = false;
    void loadGuideFloorPlan(guide.slug)
      .then((loadedPlan) => {
        if (cancelled) return;
        if (!loadedPlan)
          throw new Error(`${guide.slug}: floor plan unavailable`);
        if (loadedPlan.routeStops.length !== guide.spatial.stops.length) {
          throw new Error(`${guide.slug}: floor-plan route stop mismatch`);
        }
        setLoadResult({
          floorPlan: loadedPlan,
          slug: guide.slug,
          state: 'ready',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadResult({ slug: guide.slug, state: 'failed' });
        setViewSelection({ slug: guide.slug, value: 'exterior' });
      });

    return () => {
      cancelled = true;
    };
  }, [expectsFloorPlan, guide.slug, guide.spatial.stops.length]);

  const isInterior = expectsFloorPlan && view === 'interior';

  return (
    <section className="guide-section guide-spatial" id="guide-spatial">
      <div className="guide-section__heading">
        <p>01 / {spatialLabels[guide.spatial.type]}</p>
        <h2>{isInterior ? '分层室内导览地图' : '3D 导览地图'}</h2>
        <span>{guide.spatial.title}</span>
      </div>
      {expectsFloorPlan && (
        <div
          aria-label="导览地图视图"
          className="guide-spatial__view-tabs"
          role="tablist"
        >
          <button
            aria-selected={view === 'interior'}
            onClick={() => selectView('interior')}
            role="tab"
            type="button"
          >
            内部
          </button>
          <button
            aria-selected={view === 'exterior'}
            onClick={() => selectView('exterior')}
            role="tab"
            type="button"
          >
            外观
          </button>
        </div>
      )}
      {sourceLimited && (
        <output className="guide-spatial__data-status">内部平面资料待补</output>
      )}
      {floorPlanState === 'failed' && (
        <div className="guide-spatial__data-status" role="alert">
          室内平面加载失败，已切换至外观地图
        </div>
      )}
      {isInterior ? (
        floorPlanState === 'ready' && floorPlan ? (
          <Suspense
            fallback={
              <SpatialLoading
                label="室内地图加载状态"
                message="正在加载室内地图"
              />
            }
          >
            <GuideStackedFloorPlan floorPlan={floorPlan} guide={guide} />
          </Suspense>
        ) : (
          <SpatialLoading label="室内地图加载状态" message="正在加载室内平面" />
        )
      ) : (
        <Suspense
          fallback={
            <SpatialLoading
              label="外观地图加载状态"
              message="正在加载外观地图"
            />
          }
        >
          <GuideExteriorScene guide={guide} />
        </Suspense>
      )}
      <p className="guide-disclaimer">
        {guide.spatial.note}{' '}
        {isInterior
          ? '室内图依据已核验的导览平面重新绘制，用于理解楼层、房间与参观顺序。'
          : '外观模型用于理解建筑体量与周边空间关系。'}
      </p>
    </section>
  );
}
