import { ArrowDown, CalendarDays, MapPin } from 'lucide-react';
import type { GuideRecord } from '../data/types';
import { withBasePath } from '../lib/paths';
import { StatusLabel } from './StatusLabel';

export function GuideHero({ guide }: { guide: GuideRecord }) {
  return (
    <header className="guide-hero" id="guide-top">
      <img alt={guide.hero.alt} src={withBasePath(guide.hero.src)} />
      <div className="guide-hero__shade" />
      <div className="guide-hero__content">
        <p className="guide-hero__place">
          <MapPin aria-hidden="true" size={15} />
          {guide.city} · {guide.country}
        </p>
        <h1>{guide.title}</h1>
        {guide.originalTitle && <p className="guide-hero__original">{guide.originalTitle}</p>}
        <div className="guide-hero__visits">
          {guide.scheduledVisits.map((visit) => (
            <div key={visit.itemId}>
              <CalendarDays aria-hidden="true" size={17} />
              <span>{visit.dateLabel}</span>
              <strong>{visit.time}</strong>
              <StatusLabel status={visit.status} />
            </div>
          ))}
        </div>
      </div>
      <p className="guide-hero__credit">图像：{guide.hero.credit}</p>
      <a aria-label="继续阅读" className="guide-hero__down" href="#guide-overview">
        <ArrowDown aria-hidden="true" size={18} />
      </a>
    </header>
  );
}
