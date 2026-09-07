import { cityProfiles } from './cities';
import { bookingReviewDate } from './bookings';
import { guideMediaBySlug } from './guide-media.generated';
import { guideHeroBySlug } from './guide-hero-media';
import { guideContentBySlug } from './guides/content';
import { expandGuideHighlights } from './guides/expanded';
import { tripDays } from './trip';
import type { GuideRecord, TripItem } from './types';

type CulturalItem = TripItem & {
  kind: 'landmark' | 'museum' | 'district';
};

type MergeDefinition = {
  slug: string;
  title: string;
  itemIds: string[];
};

const mergeDefinitions: MergeDefinition[] = [
  {
    slug: 'florence-duomo',
    title: '圣母百花大教堂',
    itemIds: ['florence-duomo-exterior', 'brunelleschi-dome'],
  },
  {
    slug: 'la-scala',
    title: '斯卡拉歌剧院',
    itemIds: ['la-scala-evening', 'la-scala-museum'],
  },
  {
    slug: 'ponte-vecchio',
    title: '老桥',
    itemIds: ['ponte-vecchio-night-27', 'ponte-vecchio-night-28'],
  },
  {
    slug: 'vatican-museums',
    title: '梵蒂冈博物馆',
    itemIds: ['key-master', 'vatican-followup'],
  },
  {
    slug: 'st-peters-basilica',
    title: '圣彼得大教堂',
    itemIds: ['st-peters-basilica', 'st-peters-dome'],
  },
  {
    slug: 'sagrada-familia',
    title: '圣家堂',
    itemIds: ['sagrada-basilica', 'sagrada-passion-tower'],
  },
  {
    slug: 'cologne-cathedral',
    title: '科隆大教堂',
    itemIds: ['cologne-interior', 'cologne-tower-treasury', 'cologne-treasury'],
  },
];

const culturalEntries = tripDays.flatMap((day) =>
  day.items
    .filter(
      (item): item is CulturalItem =>
        item.kind === 'landmark' ||
        item.kind === 'museum' ||
        item.kind === 'district',
    )
    .map((item) => ({ day, item })),
);

const mergeByItemId = new Map(
  mergeDefinitions.flatMap((definition) =>
    definition.itemIds.map((itemId) => [itemId, definition] as const),
  ),
);

function cityProfileFor(city: string) {
  return cityProfiles.find((profile) =>
    profile.name === '罗马与梵蒂冈'
      ? city === '罗马' || city === '梵蒂冈'
      : profile.name === city,
  );
}

function buildFallbackGuide(
  slug: string,
  title: string,
  entries: typeof culturalEntries,
): GuideRecord {
  const first = entries[0];
  const profile = cityProfileFor(first.item.city);
  const note = entries
    .flatMap(({ item }) => [item.arrival, item.note, item.conflict])
    .filter(Boolean)
    .join(' ');

  return {
    id: slug,
    slug,
    title,
    city: first.item.city,
    country: profile?.country ?? '待确认',
    kind: first.item.kind,
    aliases: [...new Set(entries.map(({ item }) => item.title))],
    itemIds: entries.map(({ item }) => item.id),
    scheduledVisits: entries.map(({ day, item }) => ({
      date: day.date,
      dateLabel: day.label,
      itemId: item.id,
      time: item.time,
      status: item.status,
      note: item.note,
      arrival: item.arrival,
      conflict: item.conflict,
    })),
    hero: {
      src: profile?.image ?? '/images/st-peters-hero.jpg',
      alt: profile?.imageAlt ?? `${title}所在城市`,
    },
    overviewTitle: `${title}概览`,
    overview:
      `${title}是本次${first.item.city}行程中的文化观察点。` +
      (note || '详细文化背景与现场信息正在依据官方资料整理。'),
    orientation: [
      {
        title: '先确认时间',
        body: entries.map(({ item }) => item.time).join('；'),
      },
      {
        title: '再看空间',
        body: first.item.arrival ?? '从现场入口和主要立面开始辨认空间关系。',
      },
      {
        title: '最后看细节',
        body: first.item.note ?? '以现场标识和官方说明为准。',
      },
    ],
    spatial: {
      type: first.item.kind === 'district' ? 'district' : 'viewpoints',
      title: `${title}空间观察`,
      note: '当前仅表达可确认的地理与观察关系，不作为精确导航或建筑测绘。',
      stops: ['入口或主要到达点', '核心空间', '离场方向'],
    },
    highlights: [
      {
        title: '整体空间',
        summary: '先观察建筑、街区或场馆的整体关系。',
        lookFor: '留意入口、主轴与最醒目的视觉焦点。',
      },
      {
        title: '关键细节',
        summary: '靠近后辨认材质、装饰与年代痕迹。',
        lookFor: '以现场说明牌确认名称和年代。',
      },
      {
        title: '城市联系',
        summary: `把${title}放回${first.item.city}的城市尺度中理解。`,
        lookFor: '回看它与周边街道、广场或天际线的联系。',
      },
    ],
    sequence: [
      {
        title: '抵达',
        body: first.item.arrival ?? '从主要入口或最佳观察面开始。',
      },
      {
        title: '进入核心',
        body: first.item.note ?? '按现场开放区域和标识继续。',
      },
      { title: '收束', body: '离开前回看整体空间，并确认下一段行程。' },
    ],
    practical: [
      `行程状态：${entries.map(({ item }) => item.status).join('、')}`,
      note || '开放区域、安检和现场规则以官方公告为准。',
    ],
    sources: [
      {
        institution: '国庆行程与票务资料',
        title: `${title}行程记录`,
        verifiedAt: bookingReviewDate,
        note: '当前记录票面时间、预订状态和到达说明；文化资料将在城市内容包中补齐。',
      },
    ],
  };
}

const consumedIds = new Set(mergeDefinitions.flatMap((item) => item.itemIds));

const mergedGuides = mergeDefinitions.map((definition) => {
  const entries = culturalEntries.filter(({ item }) =>
    definition.itemIds.includes(item.id),
  );
  return buildFallbackGuide(definition.slug, definition.title, entries);
});

const individualGuides = culturalEntries
  .filter(({ item }) => !consumedIds.has(item.id))
  .map(({ item }) => item.id)
  .filter((itemId, index, itemIds) => itemIds.indexOf(itemId) === index)
  .map((itemId) => {
    const entries = culturalEntries.filter(({ item }) => item.id === itemId);
    return buildFallbackGuide(itemId, entries[0].item.title, entries);
  });

export const guideCatalog: GuideRecord[] = [
  ...mergedGuides,
  ...individualGuides,
]
  .map((guide) => {
    const content =
      guideContentBySlug[guide.slug as keyof typeof guideContentBySlug];
    const enrichedGuide = !content
      ? guide
      : {
          ...guide,
          ...content,
          hero: content.hero ?? guide.hero,
        };
    const media =
      guideMediaBySlug[guide.slug] ??
      (guide.slug === 'la-scala'
        ? [
            ...(guideMediaBySlug['la-scala-museum'] ?? []),
            ...(guideMediaBySlug['la-scala-evening'] ?? []),
          ]
        : undefined);
    if (!media) return enrichedGuide;

    return {
      ...enrichedGuide,
      hero: guideHeroBySlug[guide.slug] ?? {
        src: media[0].image,
        alt: media[0].imageAlt,
      },
      highlights: enrichedGuide.highlights.map((highlight, index) => ({
        ...highlight,
        ...media[index],
      })),
    };
  })
  .map(expandGuideHighlights)
  .sort((left, right) => {
    const leftDate = left.scheduledVisits[0]?.date ?? '';
    const rightDate = right.scheduledVisits[0]?.date ?? '';
    return leftDate.localeCompare(rightDate);
  });

const guideByItemId = new Map(
  guideCatalog.flatMap((guide) =>
    guide.itemIds.map((itemId) => [itemId, guide] as const),
  ),
);

export function guideForTripItem(item: Pick<TripItem, 'id'>) {
  const explicit = mergeByItemId.get(item.id);
  if (explicit)
    return guideCatalog.find((guide) => guide.slug === explicit.slug);
  return guideByItemId.get(item.id);
}

export function guideBySlug(slug: string) {
  return guideCatalog.find((guide) => guide.slug === slug);
}
