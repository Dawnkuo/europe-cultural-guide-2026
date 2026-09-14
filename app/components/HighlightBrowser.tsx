'use client';

import { Expand, MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { GuideHighlight } from '../data/types';
import dimensions from '../data/media-dimensions.generated.json';
import { withBasePath } from '../lib/paths';
import './highlight-browser.css';
import { useGuideExperience } from './GuideExperience';
import { locationForWork, workId } from '../lib/guide-experience';
import { ArtworkImageViewer } from './ArtworkImageViewer';

const sizes: Record<string, { width: number; height: number }> = dimensions;
export { workId } from '../lib/guide-experience';

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
  const experience = useGuideExperience();
  const [floor, setFloor] = useState('all');
  const [room, setRoom] = useState('all');
  const [sort, setSort] = useState('catalog');
  const [imageSelection, setImageSelection] = useState({ workId: '', index: 0 });
  const [imageViewerWork, setImageViewerWork] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = `${slug}-work-detail-title`;
  const records = items.map((item, index) => ({
    ...item,
    id: workId(slug, item, index),
    ordinal: index + 1,
    mapLocation: locationForWork(slug, workId(slug, item, index), experience?.plan),
  }));
  const categories = [...new Set(items.map((item) => item.category ?? '综合'))];
  const needle = query.trim().normalize('NFKC').toLocaleLowerCase();
  const matches = records.filter(
    (item) =>
      (category === '全部' || (item.category ?? '综合') === category) &&
      (floor === 'all' || item.mapLocation?.places.some(place => place.floorId === floor)) &&
      (room === 'all' || item.mapLocation?.placeIds.includes(room)) &&
      [
        item.title,
        item.originalTitle,
        item.creator,
        item.location,
        item.summary,
        ...(item.mapLocation?.places.map(place => `${place.label} ${place.name}`) ?? []),
      ]
        .join(' ')
        .normalize('NFKC')
        .toLocaleLowerCase()
        .includes(needle),
  ).sort((a, b) => sort === 'year' ? (a.sortYear ?? Infinity) - (b.sortYear ?? Infinity) || a.ordinal - b.ordinal : sort === 'priority' ? (a.priority ?? 3) - (b.priority ?? 3) || a.ordinal - b.ordinal : a.ordinal - b.ordinal);
  const detail = records.find((item) => item.id === (experience ? experience.work : selected));
  if (imageViewerWork && imageViewerWork !== detail?.id) setImageViewerWork(null);
  const detailId = detail?.id;
  const imageIndex = imageSelection.workId === detail?.id ? imageSelection.index : 0;
  const gallery = detail ? detail.gallery?.length ? detail.gallery : detail.image ? [{ src: detail.image, alt: detail.imageAlt ?? detail.title }] : [] : [];
  const currentImage = gallery[imageIndex] ?? gallery[0];
  const floors = experience?.plan?.floors.filter(f => records.some(item => item.mapLocation?.places.some(p => p.floorId === f.id))) ?? [];
  const rooms = [...new Map(records.flatMap(item => item.mapLocation?.places ?? []).filter(place => floor === 'all' || place.floorId === floor).map(place => [place.id, place])).values()];
  const hasPriorities = items.some(item => item.priority !== undefined);
  const hasYears = items.filter(item => item.sortYear !== undefined).length > 1;

  useEffect(() => {
    if (experience) return;
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
  }, [items, slug, experience]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // State owns the native dialog; queued close notifications must not change a newer URL.
    if (detailId) {
      if (!element.open) element.showModal();
      element.querySelector<HTMLButtonElement>('.highlight-detail__close')?.focus({ preventScroll: true });
      element.scrollTop = 0;
    } else if (element.open) element.close();
  }, [detailId]);

  const open = (id: string, button: HTMLElement) => {
    if (experience) { experience.openWork(id, button); return; }
    opener.current = button;
    window.history.replaceState(null, '', `#work-${id}`);
    setSelected(id);
  };
  const close = () => {
    setImageViewerWork(null);
    if (experience) { experience.closeWork(); return; }
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
        {floors.length > 0 && <label>楼层<select aria-label="筛选楼层" value={floor} onChange={event => { setFloor(event.target.value); setRoom('all'); }}><option value="all">全部楼层</option>{floors.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></label>}
        {rooms.length > 0 && <label>展厅<select aria-label="筛选展厅" value={room} onChange={event => setRoom(event.target.value)}><option value="all">全部展厅</option>{rooms.map(place => <option key={place.id} value={place.id}>{place.label}{place.name !== place.label ? ` · ${place.name}` : ''}</option>)}</select></label>}
        {experience && (hasPriorities || hasYears) && <label>排序<select aria-label="作品排序" value={sort} onChange={event => setSort(event.target.value)}><option value="catalog">目录顺序</option>{hasPriorities && <option value="priority">推荐程度</option>}{hasYears && <option value="year">创作年代</option>}</select></label>}
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
                {item.mapLocation && <small className="highlight-browser__location"><MapPin size={13} aria-hidden="true" />{item.mapLocation.places.map(p => p.name).join(' · ')}</small>}
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
        onCancel={(event) => { event.preventDefault(); close(); }}
      >
        <header className="highlight-detail__toolbar">
          <button
            className="highlight-detail__close"
            aria-label="关闭作品详情"
            title="关闭作品详情"
            type="button"
            onClick={close}
          >
            <X />
          </button>
        </header>
        {detail && (
          <>
            {currentImage && (
              <div className="highlight-detail__image">
                <button className="highlight-detail__expand" type="button" aria-label={`放大查看：${currentImage.alt}`} title="放大查看图片" onClick={() => setImageViewerWork(detail.id)}>
                {/* oxlint-disable-next-line next/no-img-element -- Full uncropped local artwork. */}
                <img
                  src={withBasePath(currentImage.src)}
                  alt={currentImage.alt}
                  width={sizes[currentImage.src]?.width}
                  height={sizes[currentImage.src]?.height}
                />
                <span aria-hidden="true"><Expand size={20} /></span>
                </button>
                {gallery.length > 1 && <div className="highlight-detail__gallery" aria-label="作品图片">{gallery.map((photo, index) => <button key={photo.src} type="button" aria-label={`查看图片 ${index + 1}：${photo.alt}`} aria-pressed={index === imageIndex} onClick={() => setImageSelection({ workId: detail.id, index })}>
                  {/* oxlint-disable-next-line next/no-img-element -- Local artwork thumbnail. */}
                  <img src={withBasePath(photo.src)} alt="" />
                </button>)}</div>}
                {currentImage.caption && <p>{currentImage.caption}</p>}
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
              {detail.background && <section><h4>背景故事</h4><p>{detail.background}</p></section>}
              {detail.whyItMatters && (
                <section>
                  <h4>为何重要</h4>
                  <p>{detail.whyItMatters}</p>
                </section>
              )}
              <section>
                <h4>现场看什么</h4>
                <p>{detail.lookFor}</p>
                {detail.observations?.length ? <ol>{detail.observations.map(text => <li key={text}>{text}</li>)}</ol> : null}
              </section>
              {(detail.material || detail.dimensions || detail.inventoryNumber) && <section><h4>作品档案</h4><dl className="highlight-detail__facts">{[['材质', detail.material], ['尺寸', detail.dimensions], ['藏品编号', detail.inventoryNumber]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>}
              {detail.mapLocation && experience && <div className="highlight-detail__map-links">{detail.mapLocation.places.map(place => <button key={place.id} type="button" onClick={() => { experience.closeWork(false); experience.locatePlace(place.id); }}><MapPin size={17} aria-hidden="true" />{detail.mapLocation?.precision === 'area' ? '定位所在区域' : '在地图中定位'} · {place.name}</button>)}{detail.mapLocation.note && <p>{detail.mapLocation.note}</p>}</div>}
              {detail.displayNote && (
                <p className="highlight-detail__note">{detail.displayNote}</p>
              )}
            </div>
          </>
        )}
      </dialog>
      {detail && imageViewerWork === detail.id && gallery.length > 0 && <ArtworkImageViewer title={detail.title} photos={gallery} index={imageIndex} onSelect={index => setImageSelection({ workId: detail.id, index })} onClose={() => setImageViewerWork(null)} />}
    </div>
  );
}
