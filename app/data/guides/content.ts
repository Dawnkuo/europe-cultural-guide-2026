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
  'la-scala': {
    ...milanVeniceGuideContent['la-scala-museum'],
    originalTitle: 'Teatro alla Scala e Museo Teatrale alla Scala',
    overview: `${milanVeniceGuideContent['la-scala-evening'].overview} ${milanVeniceGuideContent['la-scala-museum'].overview}`,
    orientation: [
      ...milanVeniceGuideContent['la-scala-museum'].orientation,
      ...milanVeniceGuideContent['la-scala-evening'].orientation,
    ],
    spatial: {
      type: 'floorplan',
      title: '博物馆展室、历史包厢与马蹄形观众厅',
      note: '平面关系按博物馆官方导览和观众公共动线合并；排练期间历史包厢可能关闭，晚间入口以最终票面为准。',
      stops: [
        'Largo Ghiringhelli博物馆入口',
        '第一、第三和第四主题展室',
        '第九室档案及图书馆材料',
        '开放时的历史包厢视角',
        '斯卡拉广场晚间观众入口',
        '门厅及楼层交通',
        '马蹄形观众厅、舞台与层叠包厢',
        '票面楼层座席或站位区',
      ],
    },
    highlights: [
      ...milanVeniceGuideContent['la-scala-museum'].highlights,
      ...milanVeniceGuideContent['la-scala-evening'].highlights,
    ],
    sequence: [
      ...milanVeniceGuideContent['la-scala-museum'].sequence,
      ...milanVeniceGuideContent['la-scala-evening'].sequence,
    ],
    practical: [
      ...milanVeniceGuideContent['la-scala-museum'].practical,
      ...milanVeniceGuideContent['la-scala-evening'].practical,
    ],
    sources: [
      ...milanVeniceGuideContent['la-scala-museum'].sources,
      ...milanVeniceGuideContent['la-scala-evening'].sources,
    ],
  },
};
