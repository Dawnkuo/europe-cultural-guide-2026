import { describe, expect, it } from "vitest";
import { guideCatalog, guideForTripItem } from "./guides";
import { tripDays } from "./trip";

describe("guide catalog", () => {
  it("maps every scheduled cultural stop to a guide", () => {
    const culturalStops = tripDays
      .flatMap((day) => day.items)
      .filter((item) => ["landmark", "museum", "district"].includes(item.kind));

    expect(culturalStops.filter((item) => !guideForTripItem(item))).toEqual([]);
  });

  it.each([
    ["st-peters-basilica", "st-peters-dome"],
    ["sagrada-basilica", "sagrada-passion-tower"],
    ["key-master", "vatican-followup"],
    ["cologne-interior", "cologne-tower-treasury"],
    ["ponte-vecchio-night-27", "ponte-vecchio-night-28"],
    ["florence-duomo-exterior", "brunelleschi-dome"],
  ])("maps %s and %s to one attraction chapter", (firstId, secondId) => {
    const items = tripDays.flatMap((day) => day.items);
    const first = items.find((item) => item.id === firstId);
    const second = items.find((item) => item.id === secondId);

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(guideForTripItem(first!)?.slug).toBe(guideForTripItem(second!)?.slug);
  });

  it.each([
    ["colosseum", "roman-forum"],
    ["roman-forum", "palatine"],
    ["leaning-tower", "pisa-cathedral"],
    ["pisa-cathedral", "pisa-baptistery"],
    ["doges-palace", "correr"],
    ["st-mark-campanile", "st-mark-basilica"],
  ])("keeps %s and %s as separate attraction chapters", (firstId, secondId) => {
    const items = tripDays.flatMap((day) => day.items);
    const first = items.find((item) => item.id === firstId);
    const second = items.find((item) => item.id === secondId);

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(guideForTripItem(first!)?.slug).not.toBe(
      guideForTripItem(second!)?.slug,
    );
  });

  it.each([
    ["罗马遗址联票", ["colosseum", "roman-forum", "palatine"]],
    [
      "比萨建筑群联票",
      [
        "leaning-tower",
        "pisa-cathedral",
        "pisa-baptistery",
        "camposanto",
        "sinopie",
        "opera-pisa",
      ],
    ],
    [
      "威尼斯组合票景点",
      [
        "doges-palace",
        "bridge-of-sighs",
        "st-mark-campanile",
        "st-mark-square",
        "correr",
        "st-mark-basilica",
        "rialto",
        "grand-canal",
        "fenice",
        "accademia-venice",
        "gondola",
      ],
    ],
  ])("keeps every %s attraction in its own chapter", (_label, itemIds) => {
    const items = tripDays.flatMap((day) => day.items);
    const slugs = itemIds.map((itemId) => {
      const item = items.find((candidate) => candidate.id === itemId);
      expect(item, itemId).toBeDefined();
      return guideForTripItem(item!)?.slug;
    });

    expect(new Set(slugs).size).toBe(itemIds.length);
  });

  it("uses unique stable slugs", () => {
    expect(new Set(guideCatalog.map((guide) => guide.slug)).size).toBe(
      guideCatalog.length,
    );
  });

  it("embeds the Vatican and Saint Peter offline guide inside this site", () => {
    const reusedSlugs = ["vatican-museums", "st-peters-basilica"];

    for (const slug of reusedSlugs) {
      expect(guideCatalog.find((guide) => guide.slug === slug)?.embeddedGuide).toEqual({
        path: "/vatican-guide/",
        label: "打开完整离线导览",
        sourceRepository: "https://github.com/Dawnkuo/vatican-offline-guide",
      });
      expect("externalGuide" in (guideCatalog.find((guide) => guide.slug === slug) ?? {})).toBe(false);
    }
  });
});
