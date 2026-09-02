import { describe, expect, it } from "vitest";
import { tripDays } from "./trip";

const allItems = () => tripDays.flatMap((day) => day.items);
const findVisit = (title: string) =>
  allItems().find((item) => item.title === title);

describe("trip source of truth", () => {
  it("preserves the source date order", () => {
    expect(tripDays.map((day) => day.date)).toEqual([
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
    ]);
  });

  it("uses the final QR times for Saint Peter's Basilica and dome", () => {
    expect(findVisit("圣彼得大教堂")?.time).toContain("14:30");
    expect(findVisit("圣彼得大教堂穹顶（电梯）")?.time).toContain("15:30");
    expect(findVisit("圣彼得大教堂穹顶（电梯）")?.conflict).toContain(
      "原行程记录相反",
    );
  });

  it("keeps ticket semantics for Park Guell and Cologne Cathedral", () => {
    expect(findVisit("高迪故居博物馆")?.note).toContain(
      "16:00 是高迪故居博物馆预约时间",
    );
    expect(findVisit("科隆大教堂内部")?.time).toBe("10:00–17:45 有效");
    expect(findVisit("科隆大教堂南塔与珍宝馆")?.time).toBe(
      "10:00–16:00 有效",
    );
  });

  it("marks summary-only days as detail pending", () => {
    expect(tripDays.filter((day) => day.detailPending).map((day) => day.date)).toEqual([
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
    ]);
  });

  it("does not expose prices or private booking identifiers", () => {
    expect(JSON.stringify(tripDays)).not.toMatch(
      /€|EUR|CNY|TONGYI|BO YUAN|YAN LIANG|VWVTZQZR|B67MUA|K9K45R|TIE-\d+|DOM-\d+/,
    );
  });
});
