'use client';

import { lazy } from 'react';
import type { GuideRecord } from '../data/types';
import { exteriorReferences } from '../data/exterior-references';
import { guideExteriorTrials } from '../data/guide-exterior-trials';
import { GuideExteriorScene as LocalExterior } from './GuideExteriorScene';

// Keep the fallback component available before a first offline transition.
// Its WebGL renderer and model data still load only when it is mounted.
const ReferenceExterior = lazy(() => import('./ReferenceExterior').then(module => ({ default: module.ReferenceExterior })));

export function GuideExterior({ guide }: { guide: GuideRecord }) {
  const trial = exteriorReferences.find(model => model.id === guideExteriorTrials[guide.slug] && model.guideSlug === guide.slug);
  const local = <LocalExterior guide={guide} />;
  return trial ? <ReferenceExterior key={guide.slug} model={trial} usage="guide" fallback={local} /> : local;
}
