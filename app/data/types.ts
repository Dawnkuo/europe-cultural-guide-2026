export type VisitStatus = '已订' | '无需门票' | '未订' | '备选' | '待确认';

export type TripItemKind =
  | 'transport'
  | 'landmark'
  | 'museum'
  | 'district'
  | 'food'
  | 'hotel';

export type TripItem = {
  id: string;
  guideId?: string;
  time: string;
  title: string;
  city: string;
  status: VisitStatus;
  kind: TripItemKind;
  note?: string;
  arrival?: string;
  conflict?: string;
  highlights?: string[];
  routePoint?: boolean;
};

export type GuideSpatialType = 'floorplan' | 'site' | 'viewpoints' | 'district';

export type GuideHighlight = {
  id?: string;
  category?: string;
  title: string;
  originalTitle?: string;
  creator?: string;
  period?: string;
  location?: string;
  summary: string;
  lookFor: string;
  whyItMatters?: string;
  displayNote?: string;
  sourceIds?: string[];
  image?: string;
  imageAlt?: string;
};

export type GuideSource = {
  institution: string;
  title: string;
  url?: string;
  verifiedAt: string;
  note: string;
};

export type GuideVisit = {
  date: string;
  dateLabel: string;
  itemId: string;
  time: string;
  status: VisitStatus;
  note?: string;
  arrival?: string;
  conflict?: string;
};

export type GuideRecord = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  city: string;
  country: string;
  kind: Extract<TripItemKind, 'landmark' | 'museum' | 'district'>;
  aliases: string[];
  itemIds: string[];
  scheduledVisits: GuideVisit[];
  hero: {
    src: string;
    alt: string;
  };
  overviewTitle: string;
  overview: string;
  orientation: Array<{ title: string; body: string }>;
  spatial: {
    type: GuideSpatialType;
    title: string;
    note: string;
    stops: string[];
  };
  highlights: GuideHighlight[];
  sequence: Array<{ title: string; body: string; highlightIds?: string[] }>;
  practical: string[];
  sources: GuideSource[];
};

export type TripDay = {
  date: string;
  label: string;
  region: string;
  summary: string;
  detailPending?: boolean;
  items: TripItem[];
};

export type BookingRecord = {
  id: string;
  category: '门票' | '交通' | '住宿';
  title: string;
  date: string;
  status: VisitStatus;
  validity?: string;
  note?: string;
};
