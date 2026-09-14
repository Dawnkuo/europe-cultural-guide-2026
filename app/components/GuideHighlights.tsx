import type { GuideRecord } from '../data/types';
import { HighlightBrowser } from './HighlightBrowser';

export function GuideHighlights({ guide }: { guide: GuideRecord }) {
  return (
    <section className="guide-section guide-highlights" id="guide-highlights">
      <div className="guide-section__heading">
        <p>02 / Highlights</p>
        <h2>不可错过</h2>
        <span>{guide.highlights.length} 项作品、空间与细节</span>
      </div>
      <HighlightBrowser slug={guide.slug} items={guide.highlights} />
    </section>
  );
}
