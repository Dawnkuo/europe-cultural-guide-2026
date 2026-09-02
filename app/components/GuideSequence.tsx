import { ArrowDownRight } from 'lucide-react';
import type { GuideRecord } from '../data/types';

export function GuideSequence({ guide }: { guide: GuideRecord }) {
  return (
    <section className="guide-section guide-sequence" id="guide-sequence">
      <div className="guide-section__heading">
        <p>03 / On site</p>
        <h2>现场顺序</h2>
        <span>只整理景点内部的观看顺序，不改变跨景点行程。</span>
      </div>
      <ol>
        {guide.sequence.map((step, index) => (
          <li key={`${step.title}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
            <ArrowDownRight aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
}
