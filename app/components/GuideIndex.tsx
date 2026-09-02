'use client';

import { ArrowUpRight, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { GuideRecord } from '../data/types';
import { withBasePath } from '../lib/paths';

const kindLabels: Record<GuideRecord['kind'], string> = {
  landmark: '建筑与地标',
  museum: '博物馆与收藏',
  district: '街区与城市空间',
};

export function GuideIndex({ guides }: { guides: GuideRecord[] }) {
  const [city, setCity] = useState('全部');
  const [kind, setKind] = useState<'全部' | GuideRecord['kind']>('全部');
  const cities = useMemo(
    () => ['全部', ...new Set(guides.map((guide) => guide.city))],
    [guides],
  );
  const visible = guides.filter(
    (guide) =>
      (city === '全部' || guide.city === city) &&
      (kind === '全部' || guide.kind === kind),
  );

  return (
    <>
      <div className="guide-filters" aria-label="筛选景点导览">
        <div>
          <span>城市</span>
          {cities.map((value) => (
            <button
              data-active={city === value}
              key={value}
              onClick={() => setCity(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
        <div>
          <span>类型</span>
          {(['全部', 'landmark', 'museum', 'district'] as const).map(
            (value) => (
              <button
                data-active={kind === value}
                key={value}
                onClick={() => setKind(value)}
                type="button"
              >
                {value === '全部' ? value : kindLabels[value]}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="guide-index" aria-live="polite">
        <p className="guide-index__count">{visible.length} 个章节</p>
        {visible.map((guide, index) => {
          const visit = guide.scheduledVisits[0];
          const href = withBasePath(`/guides/${guide.slug}/`);

          return (
            <a className="guide-index__row" href={href} key={guide.slug}>
              <span className="guide-index__number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="guide-index__media">
                {/* oxlint-disable-next-line next/no-img-element -- Static export keeps local images base-path safe. */}
                <img alt={guide.hero.alt} src={withBasePath(guide.hero.src)} />
              </div>
              <div className="guide-index__copy">
                <p>
                  <MapPin aria-hidden="true" size={14} />
                  {guide.city} · {kindLabels[guide.kind]}
                </p>
                <h2>{guide.title}</h2>
                {guide.originalTitle && <span>{guide.originalTitle}</span>}
              </div>
              <div className="guide-index__visit">
                <strong>{visit?.dateLabel ?? '日期待确认'}</strong>
                <span>{visit?.time ?? '时间待确认'}</span>
                <small>{visit?.status ?? '待确认'}</small>
              </div>
              <ArrowUpRight aria-hidden="true" className="guide-index__arrow" />
            </a>
          );
        })}
      </div>
    </>
  );
}
