export type VisitStatus =
  | "已订"
  | "无需门票"
  | "未订"
  | "备选"
  | "待确认";

export type TripItemKind =
  | "transport"
  | "landmark"
  | "museum"
  | "district"
  | "food"
  | "hotel";

export type TripItem = {
  id: string;
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
  category: "门票" | "交通" | "住宿";
  title: string;
  date: string;
  status: VisitStatus;
  validity?: string;
  note?: string;
};

export type SourceRecord = {
  id: string;
  institution: string;
  title: string;
  url?: string;
  verifiedAt: string;
  note: string;
};
