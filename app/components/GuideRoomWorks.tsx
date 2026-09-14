'use client';

import { ArrowUpRight } from 'lucide-react';
import type { GuideRecord } from '../data/types';
import type { PlanPlace } from '../lib/architectural-plan';
import { workId, worksAtPlace } from '../lib/guide-experience';
import { withBasePath } from '../lib/paths';
import { useGuideExperience } from './GuideExperience';

export function GuideRoomWorks({ guide, place }: { guide: GuideRecord; place?: PlanPlace }) {
  const experience = useGuideExperience();
  if (!experience || !place) return null;
  const works = worksAtPlace(guide, place.id);
  if (!works.length) return null;
  return <section className="guide-room-works" aria-label={`${place.name}的作品`}>
    <header><h3>{place.name}</h3><span>{works.length} 项看点</span></header>
    <div>{works.map(work => <button key={workId(guide.slug, work, guide.highlights.indexOf(work))} type="button" onClick={event => experience.openWork(workId(guide.slug, work, guide.highlights.indexOf(work)), event.currentTarget)}>
      {/* oxlint-disable-next-line next/no-img-element -- Local offline artwork. */}
      {work.image && <img src={withBasePath(work.image)} alt="" loading="lazy" />}
      <span><strong>{work.title}</strong><small>{work.location ?? work.creator}</small></span><ArrowUpRight size={18} aria-hidden="true" />
    </button>)}</div>
  </section>;
}
