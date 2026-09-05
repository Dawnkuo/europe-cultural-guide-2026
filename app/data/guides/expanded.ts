import type { GuideHighlight, GuideRecord } from '../types';
import type { AuthoredHighlight } from './expanded-authorship';
import { expandedPaintings } from './expanded-paintings';
import { expandedItaly } from './expanded-italy';
import { expandedBarcelona } from './expanded-barcelona';
import { expandedChurches } from './expanded-churches';
import { expandedVatican } from './expanded-vatican';
import { expandedRomeExtra } from './expanded-rome-extra';
import rawMetadata from './collection-metadata.generated.json';

type Metadata = Pick<
  GuideHighlight,
  'originalTitle' | 'creator' | 'period' | 'location' | 'sourceIds' | 'image'
> & {
  building?: string;
  missingImage?: boolean;
};
const metadata: Record<string, Metadata> = rawMetadata;
export const collectionExpansion: Record<string, AuthoredHighlight[]> = {
  ...expandedPaintings,
  ...expandedItaly,
  ...expandedBarcelona,
  ...expandedChurches,
  ...expandedVatican,
  ...expandedRomeExtra,
};

const displayNotes: Record<string, string> = {
  'forum-castor-pollux': '配图近看三根柱子的柱头与檐部，不包含柱基和台座。',
  'doges-collegio':
    '配图为天顶画《威尼斯、正义与和平》的局部，不是学院厅全景。',
  'sagrada-nativity':
    '配图为诞生立面上的降生群像局部；立面上的其他叙事不都在这张照片内。',
  'brera-riot':
    '位于 La Grande Brera 的 Palazzo Citterio 分馆，不在主馆老楼；不因此调整原有行程。',
  'brera-fiumana':
    '位于 Palazzo Citterio 分馆；《人潮》不是现藏米兰另一馆的《第四等级》。',
  'brera-modigliani-boy':
    '位于 Palazzo Citterio 分馆，不能按主馆旧楼房间寻找。',
  'borghese-melissa':
    '核对时馆藏目录列为库藏（Deposito）；保留作品介绍，不承诺现场常设展出。',
  'venice-san-giobbe': '核对时馆藏目录标注修复中；实际展出以到访时安排为准。',
  'milan-apse': '配图为第19号《新约故事》彩窗的局部，不是整扇窗或全部后殿。',
  'milan-medici': '配图展示纪念碑中的肖像与莱奥内·莱奥尼署名局部。',
  'sagrada-model':
    '配图是圣家堂博物馆展示的古埃尔纺织村悬链模型，不是圣家堂整栋建筑的缩尺模型。',
  'sforza-asse': '配图为保存下来的单色装饰局部，不是全部天顶的复原图。',
};

function additionsFor(slug: string): GuideHighlight[] {
  return (collectionExpansion[slug] ?? []).map((text) => {
    const factual = metadata[text.id];
    if (!factual) throw new Error(`Missing verified object record: ${text.id}`);
    const note = [
      text.displayNote,
      displayNotes[text.id],
      factual.missingImage
        ? '暂缺符合清晰度要求的已核验配图，保留文字介绍。'
        : '',
    ]
      .filter(Boolean)
      .join(' ');
    return {
      ...text,
      originalTitle: factual.originalTitle,
      creator: factual.creator,
      period: factual.period,
      location:
        [factual.building, factual.location].filter(Boolean).join(' · ') ||
        '展室位置待确认',
      sourceIds: factual.sourceIds,
      ...(factual.image
        ? {
            image: factual.image,
            imageAlt: `${text.title}；${factual.originalTitle}`,
          }
        : {}),
      ...(note ? { displayNote: note } : {}),
    };
  });
}

// Split composite captions only after legacy positional media has been attached.
export function expandGuideHighlights(guide: GuideRecord): GuideRecord {
  const original = guide.highlights.map((highlight, index) => ({
    ...highlight,
    id: highlight.id ?? `${guide.slug}-highlight-${index + 1}`,
  }));
  if (guide.slug === 'uffizi')
    Object.assign(original[0], {
      title: '《春》',
      originalTitle: 'Primavera',
      period: '约1480年',
      location: '波提切利展区',
      category: '波提切利与梅第奇',
      imageAlt: '波提切利《春》完整画面',
      summary:
        '九位古典人物在繁花果树林中展开，维纳斯位于中央，右侧西风追逐克洛里斯的故事与左侧三美神和墨丘利共同构成复杂的诗性世界。',
      whyItMatters:
        '大型神话画把古代诗歌、自然细节与佛罗伦萨的赞助文化联系起来；它与《维纳斯的诞生》相关，但不是同一件作品。',
      lookFor:
        '由右侧西风、口中吐花的克洛里斯追到花神，再看中央上方的丘比特、三美神的交握双手与左端驱云的墨丘利。',
    });
  if (guide.slug === 'casa-batllo')
    Object.assign(original[2], {
      title: '阁楼的六十道拱',
      imageAlt: '巴特罗之家阁楼的白色连续拱列',
      summary:
        '阁楼以连续白色拱列形成服务空间，轻盈的结构节奏与主层大厅的华丽装饰明显不同。',
      lookFor:
        '沿轴线观察拱的重复、间距和光线，比较结构既围合空间又尽量减少材料的方式。',
    });
  if (guide.slug === 'medici-chapels')
    Object.assign(original[1], {
      title: '朱利亚诺公爵墓：《昼》与《夜》',
      imageAlt: '新圣器室：右侧朱利亚诺公爵墓及《昼》《夜》，左侧圣母子群像',
      summary:
        '内穆尔公爵朱利亚诺穿甲端坐，下方《昼》与《夜》以不同方向的扭转展现身体的重量。它与对面的洛伦佐公爵墓共同组成关于时间与死亡的纪念空间。',
      lookFor:
        '看《夜》低垂的头和支撑的手，比较《昼》的扭身与面部完成程度，再向上看公爵雕像平稳的姿态。',
    });
  if (guide.slug === 'museum-ludwig') {
    Object.assign(original[0], {
      title: '《M-Maybe》',
      creator: '罗伊·利希滕斯坦',
      category: '波普艺术',
      summary:
        '漫画中的女性、对话框和城市背景被放大为绘画，网点、黑线与平涂颜色将私人情绪转变为大众图像。',
      lookFor:
        '看脸部网点、对话文字与黑色轮廓，比较机械印刷的视觉语言怎样在大画布上被重新制作。',
    });
    Object.assign(original[1], {
      title: '《双手交叠的丑角》',
      creator: '巴勃罗·毕加索',
      category: '现代绘画',
      summary:
        '丑角服饰与沉静人物形成内外反差，交叠的双手和正面坐姿将视线收束到人物的存在，而不是舞台表演。',
      lookFor:
        '比较面部、手和衣服的处理，观察人物姿态如何在职业扮装中保留安静而内向的情绪。',
    });
  }
  const retained = original.filter(
    (_, index) =>
      !(guide.slug === 'borghese' && index === 2) &&
      !(guide.slug === 'cologne-cathedral' && index === 1),
  );
  return { ...guide, highlights: [...retained, ...additionsFor(guide.slug)] };
}
