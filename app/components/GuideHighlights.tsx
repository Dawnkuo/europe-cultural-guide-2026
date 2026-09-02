import { Eye } from 'lucide-react';
import type { GuideRecord } from '../data/types';
import { withBasePath } from '../lib/paths';

export function GuideHighlights({ guide }: { guide: GuideRecord }) {
  return (
    <section className="guide-section guide-highlights" id="guide-highlights">
      <div className="guide-section__heading">
        <p>02 / Highlights</p>
        <h2>不可错过</h2>
        <span>不是清单式打卡，而是到现场真正需要看的结构、作品与细节。</span>
      </div>
      <div className="guide-highlight-list">
        {guide.highlights.map((highlight, index) => (
          <article key={`${highlight.title}-${index}`}>
            <div className="guide-highlight__index">
              {String(index + 1).padStart(2, '0')}
            </div>
            {highlight.image && (
              <div className="guide-highlight__media">
                {/* oxlint-disable-next-line next/no-img-element -- Curated local artwork image with source credit. */}
                <img
                  alt={highlight.imageAlt ?? highlight.title}
                  src={withBasePath(highlight.image)}
                />
                {highlight.imageCredit && <span>{highlight.imageCredit}</span>}
              </div>
            )}
            <div className="guide-highlight__copy">
              <p>
                {[highlight.creator, highlight.period, highlight.location]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <h3>{highlight.title}</h3>
              {highlight.originalTitle && <em>{highlight.originalTitle}</em>}
              <div>{highlight.summary}</div>
              <aside>
                <Eye aria-hidden="true" size={17} />
                <span>
                  <strong>现场看什么</strong>
                  {highlight.lookFor}
                </span>
              </aside>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
