'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { GuideHighlight } from '../data/types';
import dimensions from '../data/media-dimensions.generated.json';
import { withBasePath } from '../lib/paths';
import './highlight-browser.css';

const sizes: Record<string, { width: number; height: number }> = dimensions;
export const workId = (slug: string, item: GuideHighlight, index: number) =>
  item.id ?? `${slug}-highlight-${index + 1}`;

export function HighlightBrowser({
  slug,
  items,
}: {
  slug: string;
  items: GuideHighlight[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = `${slug}-work-detail-title`;
  const records = items.map((item, index) => ({
    ...item,
    id: workId(slug, item, index),
    ordinal: index + 1,
  }));
  const categories = [...new Set(items.map((item) => item.category ?? '综合'))];
  const needle = query.trim().normalize('NFKC').toLocaleLowerCase();
  const matches = records.filter(
    (item) =>
      (category === '全部' || (item.category ?? '综合') === category) &&
      [
        item.title,
        item.originalTitle,
        item.creator,
        item.location,
        item.summary,
      ]
        .join(' ')
        .normalize('NFKC')
        .toLocaleLowerCase()
        .includes(needle),
  );
  const detail = records.find((item) => item.id === selected);
  const hasDetail = Boolean(detail);

  useEffect(() => {
    const readHash = () => {
      const id = window.location.hash.startsWith('#work-')
        ? window.location.hash.slice(6)
        : null;
      setSelected(
        items.some((item, index) => workId(slug, item, index) === id)
          ? id
          : null,
      );
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [items, slug]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (hasDetail && !element.open) element.showModal();
    if (!hasDetail && element.open) element.close();
  }, [hasDetail]);

  const open = (id: string, button: HTMLElement) => {
    opener.current = button;
    window.history.replaceState(null, '', `#work-${id}`);
    setSelected(id);
  };
  const close = () => {
    setSelected(null);
    if (window.location.hash.startsWith('#work-')) {
      window.history.replaceState(null, '', '#guide-highlights');
    }
    opener.current?.focus();
  };

  return (
    <div className="highlight-browser">
      <div className="highlight-browser__filters">
        <label className="highlight-browser__search">
          <Search aria-hidden="true" size={18} />
          <input
            type="search"
            aria-label="搜索作品、作者或位置"
            placeholder="作品、作者或位置"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </label>
        <label>
          分类
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
            }}
          >
            <option>全部</option>
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <output>
          {matches.length} / {items.length} 项
        </output>
      </div>
      <div className="highlight-browser__grid">
        {matches.map((item) => (
          <article key={item.id}>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={(event) => open(item.id, event.currentTarget)}
            >
              <div className="highlight-browser__image">
                {item.image ? (
                  // oxlint-disable-next-line next/no-img-element -- Local offline collection image.
                  <img
                    src={withBasePath(item.image)}
                    alt={item.imageAlt ?? item.title}
                    loading="lazy"
                    decoding="async"
                    width={sizes[item.image]?.width}
                    height={sizes[item.image]?.height}
                  />
                ) : (
                  <span>文字导览 · 配图待核验</span>
                )}
              </div>
              <div className="highlight-browser__caption">
                <span>
                  {String(item.ordinal).padStart(2, '0')} ·{' '}
                  {item.category ?? '综合'}
                </span>
                <h3>{item.title}</h3>
                <p>{item.creator ?? item.location}</p>
              </div>
            </button>
          </article>
        ))}
      </div>
      {!matches.length && (
        <p className="highlight-browser__empty">没有匹配的作品或空间。</p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="highlight-detail"
        onCancel={close}
        onClose={close}
      >
        <button
          className="highlight-detail__close"
          aria-label="关闭作品详情"
          title="关闭作品详情"
          type="button"
          onClick={close}
        >
          <X />
        </button>
        {detail && (
          <>
            {detail.image && (
              <div className="highlight-detail__image">
                {/* oxlint-disable-next-line next/no-img-element -- Full uncropped local artwork. */}
                <img
                  src={withBasePath(detail.image)}
                  alt={detail.imageAlt ?? detail.title}
                  width={sizes[detail.image]?.width}
                  height={sizes[detail.image]?.height}
                />
              </div>
            )}
            <div className="highlight-detail__copy">
              <p>
                {[detail.creator, detail.period, detail.location]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <h3 id={titleId}>{detail.title}</h3>
              {detail.originalTitle && <em>{detail.originalTitle}</em>}
              <p>{detail.summary}</p>
              {detail.whyItMatters && (
                <section>
                  <h4>为何重要</h4>
                  <p>{detail.whyItMatters}</p>
                </section>
              )}
              <section>
                <h4>现场看什么</h4>
                <p>{detail.lookFor}</p>
              </section>
              {detail.displayNote && (
                <p className="highlight-detail__note">{detail.displayNote}</p>
              )}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
