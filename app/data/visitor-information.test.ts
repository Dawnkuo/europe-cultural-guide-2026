import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from './guides';
import { visitorInformation, vaticanPostHours } from './visitor-information';
import evidence from '../../sources/visitor-information/review.json';

describe('reviewed visitor information', () => {
  it.each(Object.entries(visitorInformation))(
    '%s preserves referential and evidence integrity',
    (slug, information) => {
      expect(guideCatalog.some((guide) => guide.slug === slug)).toBe(true);
      expect(information.verifiedAt).toBe(evidence.verifiedAt);
      expect(evidence.scope).toContain(slug);
      const entries = [...information.topics, ...information.questions];
      for (const list of [information.topics, information.questions])
        expect(new Set(list.map((item) => item.id)).size).toBe(list.length);
      for (const entry of entries) {
        expect(entry.paragraphs.length).toBeGreaterThan(0);
        expect(
          entry.paragraphs.every((paragraph) => paragraph.trim().length > 0),
        ).toBe(true);
        expect(entry.evidenceIds.length).toBeGreaterThan(0);
        for (const id of entry.evidenceIds)
          expect(evidence.sources, id).toHaveProperty(id);
      }
      for (const topic of information.topics) {
        for (const link of topic.guides ?? [])
          expect(guideCatalog.some((guide) => guide.slug === link.slug)).toBe(
            true,
          );
        if (topic.places?.length) {
          const plan = JSON.parse(
            readFileSync(`app/data/architectural-plans/${slug}.json`, 'utf8'),
          );
          for (const place of topic.places)
            expect(
              plan.places.some((p: { id: string }) => p.id === place.id),
              place.id,
            ).toBe(true);
        }
      }
    },
  );
  it('keeps sources internal and existing supporting files reachable', () => {
    for (const source of Object.values(evidence.sources)) {
      if ('file' in source)
        expect(existsSync(source.file), source.file).toBe(true);
      if ('url' in source) expect(new URL(source.url).protocol).toBe('https:');
    }
    for (const info of Object.values(visitorInformation))
      expect(JSON.stringify(info)).not.toMatch(/https?:\/\//);
  });
  it('does not overwrite itinerary fields or force a universal dome order', () => {
    for (const info of Object.values(visitorInformation)) {
      expect(info).not.toHaveProperty('scheduledVisits');
      expect(info).not.toHaveProperty('itemIds');
    }
    const dome = visitorInformation['st-peters-basilica'];
    expect(
      dome.topics
        .find((topic) => topic.id === 'booking-order')
        ?.paragraphs.join(''),
    ).toContain('先后可以不同');
    expect(JSON.stringify(dome)).not.toMatch(
      /必须提前.*(30|半小时)|提前90分钟|圣殿必须在穹顶之前/,
    );
  });
  it('keeps the contradictory postal Sunday schedule explicitly unresolved', () => {
    expect(vaticanPostHours.square).toContain('周日是否营业待确认');
    expect(
      visitorInformation['vatican-post'].questions
        .find((question) => question.id === 'sunday')
        ?.paragraphs.join(''),
    ).toContain('有分歧');
    expect(evidence.sources['post-offices'].note).toContain('Conflicts');
  });
});
