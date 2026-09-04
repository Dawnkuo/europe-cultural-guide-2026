import type { GuideRecord } from '../types';

export type CuratedGuideContent = Pick<
  GuideRecord,
  | 'overviewTitle'
  | 'overview'
  | 'orientation'
  | 'spatial'
  | 'highlights'
  | 'sequence'
  | 'practical'
  | 'sources'
> &
  Partial<Pick<GuideRecord, 'originalTitle' | 'hero'>>;

export type GuideContentPack = Record<string, CuratedGuideContent>;

export function defineGuideContent<T extends GuideContentPack>(content: T) {
  return content;
}
