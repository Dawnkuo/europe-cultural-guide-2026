import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { GuideRecord } from '../data/types';

export function GuidePractical({ guide }: { guide: GuideRecord }) {
  return (
    <section className="guide-section guide-practical" id="guide-practical">
      <div className="guide-section__heading">
        <p>04 / Before you go</p>
        <h2>实用攻略</h2>
        <span>
          票面与现场规则优先；运营信息记录核验日期，不把未确认事项写成事实。
        </span>
      </div>
      <div className="guide-practical__layout">
        <ul>
          {guide.practical.map((item) => (
            <li key={item}>
              <AlertTriangle aria-hidden="true" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="guide-sources">
          <h3>来源与核验</h3>
          {guide.sources.map((source) => (
            <article key={`${source.institution}-${source.title}`}>
              <p>{source.institution}</p>
              {source.url ? (
                <a href={source.url} rel="noreferrer" target="_blank">
                  {source.title}
                  <ExternalLink aria-hidden="true" size={13} />
                </a>
              ) : (
                <strong>{source.title}</strong>
              )}
              <span>核验：{source.verifiedAt}</span>
              <small>{source.note}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
