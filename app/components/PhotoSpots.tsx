'use client';

import {
  ArrowUpRight,
  Camera,
  CalendarDays,
  Expand,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import {
  photoCities,
  photoSpotMapUrl,
  photoSpotMedia,
  photoSpots,
  type PhotoSpot,
} from '../data/photo-spots';
import { withBasePath } from '../lib/paths';
import { photoPolicyFor } from '../data/photo-policies';
import { photoCoverageNotes } from '../data/photo-coverage';
import {
  sortPhotoSpots,
  type PhotoSchedule,
  type PhotoVisit,
} from '../lib/photo-schedule';
import { ArtworkImageViewer } from './ArtworkImageViewer';
import './photo-spots.css';

export type PhotoGuide = { slug: string; title: string; city: string };

const spotKinds = [
  { value: '', label: '全部' },
  { value: 'indoor', label: '室内' },
  { value: 'outdoor', label: '室外' },
  { value: 'terrace', label: '屋顶与观景台' },
];

export function photoKind(spot: PhotoSpot) {
  return (
    spot.kind ??
    (spot.id === 'milan-galleria'
      ? 'indoor'
      : spot.id === 'cologne-triangle'
        ? 'terrace'
        : 'outdoor')
  );
}

function subscribe(notify: () => void) {
  window.addEventListener('hashchange', notify);
  window.addEventListener('popstate', notify);
  return () => {
    window.removeEventListener('hashchange', notify);
    window.removeEventListener('popstate', notify);
  };
}

export function readPhotoFilters(hash: string, guides: PhotoGuide[]) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const guide = guides.find((item) => item.slug === params.get('guide'));
  const city = params.get('city') ?? '';
  return {
    city: guide?.city ?? (photoCities.includes(city) ? city : ''),
    guide: guide?.slug ?? '',
    search: params.get('q') ?? '',
    kind: spotKinds.some((kind) => kind.value === params.get('kind'))
      ? (params.get('kind') ?? '')
      : '',
  };
}

function PhotoCard({
  spot,
  visits,
  guides,
  eager,
  ready,
}: {
  spot: PhotoSpot;
  visits: PhotoVisit[];
  guides: PhotoGuide[];
  eager: boolean;
  ready: boolean;
}) {
  const photo = photoSpotMedia[spot.id];
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const hasCoordinates = photo.latitude !== null && photo.longitude !== null;
  const kind = photoKind(spot);
  const policy = photoPolicyFor(spot.policyKey);
  return (
    <article
      className="photo-spot"
      data-spot={spot.id}
      data-kind={kind}
      data-visit-date={visits[0]?.date ?? ''}
      data-visit-order={visits[0]?.order ?? ''}
      data-visit-alternative={visits[0]?.alternative ?? false}
      aria-labelledby={`${spot.id}-title`}
    >
      <div className="photo-spot__visits" aria-label="关联行程">
        <CalendarDays size={16} aria-hidden="true" />
        <span>行程</span>
        <div>
          {visits.length ? (
            visits.map((visit) => (
              <p key={`${visit.date}-${visit.itemId}`}>
                <time dateTime={visit.date}>{visit.dateLabel}</time>
                <span>{visit.alternative ? '备选' : visit.time}</span>
              </p>
            ))
          ) : (
            <p>未排定日期</p>
          )}
        </div>
      </div>
      <div className="photo-spot__image">
        {/* oxlint-disable-next-line next/no-img-element -- Locally licensed, uncropped reference photo, available offline. */}
        <img
          key={attempt}
          src={withBasePath(photo.src)}
          alt={spot.alt}
          width={photo.width}
          height={photo.height}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
        />
        {failed ? (
          <button
            className="photo-spot__expand"
            title="重试照片"
            aria-label={`重试照片：${spot.title}`}
            disabled={!ready}
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            <RotateCcw size={20} />
          </button>
        ) : (
          <button
            className="photo-spot__expand"
            title="查看完整成片"
            aria-label={`查看完整成片：${spot.title}`}
            disabled={!ready}
            onClick={() => setExpanded(true)}
          >
            <Expand size={20} />
          </button>
        )}
      </div>
      <div className="photo-spot__body">
        <div className="photo-spot__meta">
          <span>{spot.city}</span>
          <span>{spotKinds.find((item) => item.value === kind)?.label}</span>
          <span>
            实拍{' '}
            {/^\d{4}-\d{2}-\d{2}$/.test(spot.shotDate) ? (
              <time dateTime={spot.shotDate}>{spot.shotDate}</time>
            ) : (
              spot.shotDate
            )}
          </span>
        </div>
        <h3 id={`${spot.id}-title`}>{spot.title}</h3>
        <dl>
          {spot.room && (
            <div>
              <dt>空间</dt>
              <dd>{spot.room}</dd>
            </div>
          )}
          <div>
            <dt>站位</dt>
            <dd>{spot.position}</dd>
          </div>
          <div>
            <dt>朝向</dt>
            <dd>{spot.direction}</dd>
          </div>
          <div>
            <dt>构图</dt>
            <dd>{spot.composition}</dd>
          </div>
          <div>
            <dt>拍摄建议</dt>
            <dd>{spot.advice}</dd>
          </div>
        </dl>
        <p className="photo-spot__access">{spot.access}</p>
        {policy && (
          <div className="photo-spot__policy" data-policy={policy.status}>
            <p>
              <strong>
                {policy.status === 'personal' ? '私人摄影' : '拍摄须确认'}
              </strong>{' '}
              · {policy.text}
            </p>
            <small>
              {policy.sources.map((source, index) => (
                <span key={source.url}>
                  {index > 0 && ' · '}
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                </span>
              ))}{' '}
              · 核对 {policy.checkedAt}
            </small>
          </div>
        )}
        {kind === 'indoor' && !policy && spot.id !== 'milan-galleria' && (
          <p className="photo-spot__policy">
            拍摄权限待现场确认；参考照片不代表现在获准拍摄。先询问工作人员，不开闪光灯，不越过参观边界。
          </p>
        )}
        <div className="photo-spot__location">
          <a
            href={photoSpotMapUrl(spot)}
            target="_blank"
            rel="noreferrer"
            title="打开外部地图（需联网）"
          >
            <MapPin size={16} aria-hidden="true" />
            {kind === 'indoor'
              ? '查看场馆位置'
              : hasCoordinates
                ? '查看约略机位'
                : '查看站位区域'}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <small>
            {kind === 'indoor'
              ? '室内按空间与站位文字定位；街道地图不标楼层'
              : hasCoordinates
                ? `原图相机记录：${photo.latitude?.toFixed(5)}, ${photo.longitude?.toFixed(5)}`
                : '原图未提供精确相机坐标'}{' '}
            · 外部地图需联网
          </small>
        </div>
        <p className="photo-spot__reference">{spot.referenceNote}</p>
        <div className="photo-spot__guides" aria-label="对应景点">
          {spot.guideSlugs.map((slug) => (
            <a key={slug} href={withBasePath(`/guides/${slug}/`)}>
              {guides.find((guide) => guide.slug === slug)?.title ?? slug}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          ))}
        </div>
        <details className="photo-spot__credits">
          <summary>照片来源与许可</summary>
          <p>
            {photo.author} ·{' '}
            <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
              原图
            </a>{' '}
            ·{' '}
            <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
              {photo.license}
            </a>
          </p>
          <p>
            本站仅等比缩放与压缩，保留完整构图；图片沿用原许可。拍摄建议为本站编写，并非原作者的拍摄参数。
          </p>
        </details>
      </div>
      {expanded && (
        <ArtworkImageViewer
          title={spot.title}
          photos={[
            {
              src: photo.src,
              alt: spot.alt,
              caption: `${spot.shotDate} · ${photo.author} · ${photo.license} · ${spot.referenceNote}`,
            },
          ]}
          index={0}
          onSelect={() => {}}
          onClose={() => setExpanded(false)}
        />
      )}
    </article>
  );
}

export function PhotoSpots({
  guides,
  schedule,
}: {
  guides: PhotoGuide[];
  schedule: PhotoSchedule;
}) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
  const filters = readPhotoFilters(hash, guides);
  const availableGuides = guides.filter(
    (guide) => !filters.city || guide.city === filters.city,
  );
  const search = filters.search.trim().toLocaleLowerCase();
  const matches = sortPhotoSpots(photoSpots, schedule).filter(
    (spot) =>
      (!filters.city || spot.city === filters.city) &&
      (!filters.guide || spot.guideSlugs.includes(filters.guide)) &&
      (!filters.kind || photoKind(spot) === filters.kind) &&
      (!search ||
        [
          spot.title,
          spot.city,
          spot.position,
          spot.room ?? '',
          spot.mapQuery,
          ...spot.guideSlugs.map(
            (slug) => guides.find((guide) => guide.slug === slug)?.title ?? '',
          ),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(search)),
  );
  function change(next: typeof filters, replace = false) {
    const params = new URLSearchParams();
    if (next.city) params.set('city', next.city);
    if (next.guide) params.set('guide', next.guide);
    if (next.search) params.set('q', next.search);
    if (next.kind) params.set('kind', next.kind);
    // Hash filters keep the same precached document for every city/attraction.
    const url = `${window.location.pathname}${params.size ? `#${params}` : ''}`;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  return (
    <div className="photo-directory" data-ready={ready}>
      <fieldset
        className="photo-filters"
        aria-label="机位筛选"
        disabled={!ready}
      >
        <label>
          城市
          <select
            aria-label="城市"
            value={filters.city}
            onChange={(event) =>
              change({ ...filters, city: event.target.value, guide: '' })
            }
          >
            <option value="">全部城市</option>
            {photoCities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </label>
        <label>
          景点
          <select
            aria-label="景点"
            value={filters.guide}
            onChange={(event) =>
              change({ ...filters, guide: event.target.value })
            }
          >
            <option value="">全部景点</option>
            {availableGuides.map((guide) => (
              <option key={guide.slug} value={guide.slug}>
                {guide.title}
                {photoSpots.some((spot) => spot.guideSlugs.includes(guide.slug))
                  ? ''
                  : ' · 机位待补充'}
              </option>
            ))}
          </select>
        </label>
        <label className="photo-filters__search">
          搜索
          <span>
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="搜索"
              type="search"
              placeholder="景点或机位名称"
              value={filters.search}
              onChange={(event) =>
                change({ ...filters, search: event.target.value }, true)
              }
            />
          </span>
        </label>
        <button
          type="button"
          className="photo-filters__reset"
          title="清除筛选"
          aria-label="清除筛选"
          disabled={
            !filters.city && !filters.guide && !filters.search && !filters.kind
          }
          onClick={() => change({ city: '', guide: '', search: '', kind: '' })}
        >
          <RotateCcw size={18} />
        </button>
      </fieldset>
      <fieldset className="photo-kinds" aria-label="拍摄环境" disabled={!ready}>
        {spotKinds.map((kind) => (
          <label key={kind.value}>
            <input
              type="radio"
              name="photo-kind"
              value={kind.value}
              checked={filters.kind === kind.value}
              onChange={() => change({ ...filters, kind: kind.value })}
            />
            <span>
              {kind.label}{' '}
              <small>
                {
                  photoSpots.filter(
                    (spot) =>
                      (!filters.city || spot.city === filters.city) &&
                      (!filters.guide ||
                        spot.guideSlugs.includes(filters.guide)) &&
                      (!kind.value || photoKind(spot) === kind.value),
                  ).length
                }
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="photo-directory__count">
        <Camera size={17} aria-hidden="true" />
        <output aria-live="polite">{matches.length} 个机位</output>
        <span>参考照片不代表当前现场开放状态</span>
      </div>
      {filters.guide && photoCoverageNotes[filters.guide] && (
        <p className="photo-spot__policy" role="note">
          {photoCoverageNotes[filters.guide]}
        </p>
      )}
      {matches.length ? (
        <div className="photo-grid">
          {matches.map((spot, index) => (
            <PhotoCard
              key={spot.id}
              spot={spot}
              visits={schedule[spot.id] ?? []}
              guides={guides}
              eager={index < 2}
              ready={ready}
            />
          ))}
        </div>
      ) : (
        <div className="photo-empty" aria-live="polite">
          <Camera size={26} aria-hidden="true" />
          <h2>
            {filters.guide && !filters.search && !filters.kind
              ? '该景点的机位资料待补充'
              : '没有匹配的机位'}
          </h2>
          <p>
            {filters.guide && !filters.search && !filters.kind
              ? '暂不提供未经核验的站位与参考图。'
              : '试试其他城市、景点或关键词。'}
          </p>
          <button
            onClick={() =>
              change({ city: '', guide: '', search: '', kind: '' })
            }
          >
            查看全部机位
          </button>
        </div>
      )}
      <details className="photo-coverage">
        <summary>景点覆盖清单 · {guides.length} 处</summary>
        <ul>
          {guides.map((guide) => {
            const spots = photoSpots.filter((spot) =>
              spot.guideSlugs.includes(guide.slug),
            );
            const indoor = spots.filter(
              (spot) => photoKind(spot) === 'indoor',
            ).length;
            return (
              <li key={guide.slug}>
                <a href={`#guide=${guide.slug}`}>{guide.title}</a>
                <span>
                  {spots.length
                    ? `${spots.length} 个机位 · 室内 ${indoor}`
                    : '实拍与站位待补充'}
                </span>
                {photoCoverageNotes[guide.slug] && (
                  <small>{photoCoverageNotes[guide.slug]}</small>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
