'use client';

import type { GuideRecord } from '../data/types';
import { GuideExteriorScene as LocalExterior } from './GuideExteriorScene';

export function GuideExterior({ guide }: { guide: GuideRecord }) {
  return <LocalExterior guide={guide} />;
}
