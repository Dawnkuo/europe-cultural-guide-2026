import type { GuideRecord } from './types';

// Cover photographs are selected independently from close-up highlight images.
export const guideHeroBySlug: Partial<Record<string, GuideRecord['hero']>> = {
  'sagrada-familia': {
    src: '/images/heroes/sagrada-familia-nave.jpg',
    alt: '圣家堂中殿全景：树状柱林、彩色玻璃与通向祭坛的中轴空间',
  },
};
