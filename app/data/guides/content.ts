import { barcelonaGuideContent } from './barcelona';
import { cologneParisGuideContent } from './cologne-paris';
import { milanVeniceGuideContent } from './milan-venice';
import { romeVaticanGuideContent } from './rome-vatican';
import { tuscanyGuideContent } from './tuscany';
import type { GuideContentPack } from './types';

export const guideContentBySlug: GuideContentPack = {
  ...milanVeniceGuideContent,
  ...tuscanyGuideContent,
  ...romeVaticanGuideContent,
  ...barcelonaGuideContent,
  ...cologneParisGuideContent,
};
