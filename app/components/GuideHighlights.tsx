import { Eye } from 'lucide-react';
import type { GuideRecord } from '../data/types';
import { withBasePath } from '../lib/paths';
import dimensions from '../data/media-dimensions.generated.json';
import { HighlightBrowser } from './HighlightBrowser';

const mediaDimensions: Record<string, { width: number; height: number }> =
  dimensions;

export function GuideHighlights({ guide }: { guide: GuideRecord }) {
  return (
    <section className="guide-section guide-highlights" id="guide-highlights">
      <div className="guide-section__heading">
        <p>02 / Highlights</p>
        <h2>不可错过</h2>
        <span>{guide.highlights.length} 项作品、空间与细节</span>
      </div>
      {guide.highlights.length > 6 ? (
        <HighlightBrowser slug={guide.slug} items={guide.highlights} />
      ) : (
        <div className="guide-highlight-list">
          {guide.highlights.map((highlight, index) => (
            <article key={`${highlight.title}-${index}`}>
              <div className="guide-highlight__index">
                {String(index + 1).padStart(2, '0')}
              </div>
              {highlight.image && (
                <div className="guide-highlight__media">
                  {/* oxlint-disable-next-line next/no-img-element -- Curated local artwork image used by the offline guide. */}
                  <img
                    alt={highlight.imageAlt ?? highlight.title}
                    loading="lazy"
                    decoding="async"
                    width={mediaDimensions[highlight.image]?.width}
                    height={mediaDimensions[highlight.image]?.height}
                    src={withBasePath(highlight.image)}
                  />
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
                {highlight.whyItMatters && (
                  <div className="guide-highlight__context">
                    <strong>为何重要</strong>
                    {highlight.whyItMatters}
                  </div>
                )}
                <aside>
                  <Eye aria-hidden="true" size={17} />
                  <span>
                    <strong>现场看什么</strong>
                    {highlight.lookFor}
                  </span>
                </aside>
                {highlight.displayNote && (
                  <p className="guide-highlight__display-note">
                    {highlight.displayNote}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
