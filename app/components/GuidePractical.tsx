'use client';

import { ArrowUpRight, CalendarDays, RotateCcw } from 'lucide-react';
import { useMemo, useState, useSyncExternalStore } from 'react';
import type { GuideRecord } from '../data/types';
import { withBasePath } from '../lib/paths';
import { GuideVisitorInformation } from './GuideVisitorInformation';
import './guide-practical.css';

function subscribeToPreparation(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener('guide-preparation-change', notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('guide-preparation-change', notify);
  };
}

function PracticalChecklist({ guide }: { guide: GuideRecord }) {
  const storageKey = `guide-preparation:${guide.slug}`;
  const [unsaved, setUnsaved] = useState<string[] | null>(null);
  const snapshot = useSyncExternalStore(
    subscribeToPreparation,
    () => {
      try {
        return localStorage.getItem(storageKey) ?? '[]';
      } catch {
        return 'unavailable';
      }
    },
    () => '[]',
  );
  const stored = useMemo(() => {
    try {
      const value: unknown = JSON.parse(snapshot);
      return Array.isArray(value)
        ? [
            ...new Set(
              value.filter(
                (item): item is string =>
                  typeof item === 'string' && guide.practical.includes(item),
              ),
            ),
          ]
        : [];
    } catch {
      return [];
    }
  }, [snapshot, guide.practical]);
  const read = unsaved ?? stored;
  const storageFailed = unsaved !== null || snapshot === 'unavailable';

  function save(next: string[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setUnsaved(null);
      window.dispatchEvent(new Event('guide-preparation-change'));
    } catch {
      setUnsaved(next);
    }
  }

  return (
    <div className="guide-preparation">
      <header>
        <h3>出发准备</h3>
        <span aria-live="polite">
          已读 {read.length} / {guide.practical.length}
        </span>
        <button
          type="button"
          title="清除已读标记"
          aria-label="清除已读标记"
          disabled={!read.length}
          onClick={() => save([])}
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </header>
      <ul>
        {guide.practical.map((item, index) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={read.includes(item)}
                onChange={(event) =>
                  save(
                    event.target.checked
                      ? [...read, item]
                      : read.filter((value) => value !== item),
                  )
                }
              />
              <span className="guide-preparation__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      {storageFailed && (
        <output>当前浏览器无法保存已读标记，本次页面内仍可使用。</output>
      )}
    </div>
  );
}

export function GuidePractical({ guide }: { guide: GuideRecord }) {
  return (
    <section className="guide-section guide-practical" id="guide-practical">
      <div className="guide-section__heading">
        <p>04 / Before you go</p>
        <h2>实用攻略</h2>
        <span>
          {guide.city} · {guide.title}
        </span>
      </div>
      <GuideVisitorInformation slug={guide.slug} />
      <div className="guide-practical__content">
        {guide.scheduledVisits.length > 0 && (
          <div className="guide-visit-summary">
            <h3>
              <CalendarDays size={19} aria-hidden="true" />
              本次到访
            </h3>
            <ul>
              {guide.scheduledVisits.map((visit) => (
                <li key={visit.itemId}>
                  <a
                    href={withBasePath(
                      `/itinerary/#${visit.date}-${visit.itemId}`,
                    )}
                  >
                    <span>{visit.dateLabel}</span>
                    <strong>{visit.time}</strong>
                    <span>{visit.status}</span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <PracticalChecklist key={guide.slug} guide={guide} />
      </div>
    </section>
  );
}
